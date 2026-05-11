const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { TEMPLATE_PATH } = require('../../config');
const { readImageDimensions, fitToBox } = require('./image-utils');
const { appendAnlageBilder } = require('./anlage');

if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error(`FEHLER: DOCX-Template nicht gefunden unter ${TEMPLATE_PATH}`);
  console.error('Bitte DOCX_TEMPLATE_PATH setzen oder Template unter templates/gutachten_template.docx ablegen.');
  process.exit(1);
}

// Template einmal beim Start in Buffer laden — vermeidet blockierendes fs.readFileSync pro Export.
const TEMPLATE_BUFFER = fs.readFileSync(TEMPLATE_PATH);

const HAUSANSICHT_TARGETS = [
  'word/media/image1.jpeg', // Titelseite
  'word/media/image2.jpeg', // Bild 1: Ansicht
  'word/media/image4.jpeg'  // Bild 3: Ansicht
];
const GRUNDRISS_TARGETS = [
  'word/media/image5.png'   // Bild 4: Grundriss
];
const LIEGENSCHAFTSKARTE_TARGETS = [
  'word/media/image3.jpeg'  // Bild 2: Auszug aus der Liegenschaftskarte
];

// Map: image target path (z.B. 'word/media/image1.jpeg') → rId aus word/_rels/document.xml.rels
function buildImageRelMap(zip) {
  const rels = zip.file('word/_rels/document.xml.rels');
  if (!rels) return {};
  const xml = rels.asText();
  const map = {};
  const re = /<Relationship\b([^>]+)\/>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const attrs = m[1];
    if (!/Type="[^"]*\/image"/.test(attrs)) continue;
    const id = attrs.match(/Id="(rId\d+)"/);
    const target = attrs.match(/Target="([^"]+)"/);
    if (id && target) {
      // Targets in rels are relative to /word/, so prepend that prefix.
      map[`word/${target[1]}`] = id[1];
    }
  }
  return map;
}

// Schreibt <wp:extent>/<a:ext> in jedem <w:drawing> mit passender r:embed neu, so dass das neue Bild seitenverhältniskonform in die Original-Box passt (letterbox).
function updateDrawingExtents(xml, rIdToBox) {
  return xml.replace(/<w:drawing>[\s\S]*?<\/w:drawing>/g, (drawing) => {
    const embed = drawing.match(/r:embed="(rId\d+)"/);
    if (!embed) return drawing;
    const box = rIdToBox[embed[1]];
    if (!box) return drawing;
    return drawing.replace(/cx="\d+" cy="\d+"/g, `cx="${box.cx}" cy="${box.cy}"`);
  });
}

// Geht alle <w:drawing>-Blöcke einmal durch und liefert rId → Original-Box.
function buildDrawingBoxMap(xml) {
  const map = {};
  const drawingRe = /<w:drawing>[\s\S]*?<\/w:drawing>/g;
  let m;
  while ((m = drawingRe.exec(xml)) !== null) {
    const block = m[0];
    const embed = block.match(/r:embed="(rId\d+)"/);
    const extent = block.match(/cx="(\d+)" cy="(\d+)"/);
    if (embed && extent) {
      map[embed[1]] = { cx: parseInt(extent[1], 10), cy: parseInt(extent[2], 10) };
    }
  }
  return map;
}

// Ersetzt die Bild-Bytes im Zip für jedes Target und liefert [{rId, cx, cy}] zurück, damit der Aufrufer die Drawing-Extents anpassen kann.
function swapImageInZip(zip, targets, buffer, relMap, drawingBoxMap) {
  if (!buffer) return [];
  const dims = readImageDimensions(buffer);
  const replacements = [];
  for (const target of targets) {
    if (!zip.file(target)) continue;
    zip.file(target, buffer, { binary: true });
    const rId = relMap[target];
    if (!rId || !dims) continue;
    const box = drawingBoxMap[rId];
    if (!box) continue;
    replacements.push({ rId, ...fitToBox(box.cx, box.cy, dims.width, dims.height) });
  }
  return replacements;
}

function renderGutachtenDocx(context, hausansichtBuffer = null, grundrissBuffer = null, liegenschaftskarteBuffer = null, anlageList = null, anlageDateText = '') {
  const zip = new PizZip(TEMPLATE_BUFFER);

  const relMap = buildImageRelMap(zip);
  const docFile = zip.file('word/document.xml');
  let documentXml = docFile ? docFile.asText() : '';
  const drawingBoxMap = buildDrawingBoxMap(documentXml);

  const replacements = [
    ...swapImageInZip(zip, HAUSANSICHT_TARGETS, hausansichtBuffer, relMap, drawingBoxMap),
    ...swapImageInZip(zip, GRUNDRISS_TARGETS, grundrissBuffer, relMap, drawingBoxMap),
    ...swapImageInZip(zip, LIEGENSCHAFTSKARTE_TARGETS, liegenschaftskarteBuffer, relMap, drawingBoxMap)
  ];

  if (replacements.length && docFile) {
    const rIdToBox = {};
    for (const r of replacements) rIdToBox[r.rId] = { cx: r.cx, cy: r.cy };
    documentXml = updateDrawingExtents(documentXml, rIdToBox);
    zip.file('word/document.xml', documentXml);
  }

  try {
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => ''
    });

    doc.render(context);
    const renderedZip = doc.getZip();
    appendAnlageBilder(renderedZip, anlageList, anlageDateText);
    return renderedZip.generate({ type: 'nodebuffer' });
  } catch (error) {
    const templateHasSingleDocumentXml =
      error?.properties?.id === 'filetype_not_identified' &&
      zip.file('word/document.xml') &&
      !zip.file('[Content_Types].xml');

    if (!templateHasSingleDocumentXml) {
      throw error;
    }

    const repairedZip = new PizZip();

    Object.keys(zip.files).forEach((filename) => {
      const entry = zip.files[filename];
      if (!entry.dir) {
        repairedZip.file(filename, entry.asBinary(), { binary: true });
      }
    });

    repairedZip.file(
      '[Content_Types].xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '</Types>'
    );

    repairedZip.file(
      '_rels/.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '</Relationships>'
    );

    repairedZip.file(
      'word/_rels/document.xml.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>'
    );

    const doc = new Docxtemplater(repairedZip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => ''
    });

    doc.render(context);
    const renderedZip = doc.getZip();
    appendAnlageBilder(renderedZip, anlageList, anlageDateText);
    return renderedZip.generate({ type: 'nodebuffer' });
  }
}

module.exports = { renderGutachtenDocx };
