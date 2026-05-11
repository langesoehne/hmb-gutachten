const { IMAGE_MIME_BY_EXT, detectImageExtension, readImageDimensions, fitToBox } = require('./image-utils');

const ANLAGE_HEADING = 'Anlage 1: Bilder der Ortsbegehung';
// Maximalbox für Bilder in EMU. Innerer Druckbereich bei A4 ist ~6,55 Mio × ~9,13 Mio EMU.
// Höhe etwas darunter, damit Platz für die Bildunterschrift bleibt.
const ANLAGE_BOX_CX = 6000000; // ~16,7 cm
const ANLAGE_BOX_CY = 8000000; // ~22,2 cm

function xmlEscape(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildPageBreakParagraphXml() {
  return '<w:p><w:pPr><w:pStyle w:val="Normal"/><w:rPr></w:rPr></w:pPr>'
    + '<w:r><w:rPr></w:rPr><w:br w:type="page"/></w:r></w:p>';
}

function buildAnlageHeadingXml(text) {
  const escaped = xmlEscape(text);
  return '<w:p><w:pPr><w:pStyle w:val="Footer"/>'
    + '<w:spacing w:before="0" w:after="240"/>'
    + '<w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:pPr>'
    + '<w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr>'
    + `<w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
}

function buildAnlageDateXml(dateText) {
  if (!dateText) return '';
  return '<w:p><w:pPr><w:pStyle w:val="Normal"/><w:rPr></w:rPr></w:pPr>'
    + `<w:r><w:rPr></w:rPr><w:t xml:space="preserve">${xmlEscape(dateText)}</w:t></w:r></w:p>`;
}

// Strukturell identisch zu den im Template enthaltenen <w:drawing>-Blöcken.
function buildAnlageImageXml(rId, cx, cy, drawingId, name) {
  return '<w:p><w:pPr><w:pStyle w:val="Normal"/><w:jc w:val="center"/><w:rPr></w:rPr></w:pPr>'
    + '<w:r><w:rPr></w:rPr><w:drawing>'
    + '<wp:inline distT="0" distB="0" distL="0" distR="0">'
    + `<wp:extent cx="${cx}" cy="${cy}"/>`
    + '<wp:effectExtent l="0" t="0" r="0" b="0"/>'
    + `<wp:docPr id="${drawingId}" name="${xmlEscape(name)}"></wp:docPr>`
    + '<wp:cNvGraphicFramePr>'
    + '<a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>'
    + '</wp:cNvGraphicFramePr>'
    + '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
    + '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
    + '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
    + '<pic:nvPicPr>'
    + `<pic:cNvPr id="${drawingId}" name="${xmlEscape(name)}"></pic:cNvPr>`
    + '<pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr>'
    + '</pic:nvPicPr>'
    + `<pic:blipFill><a:blip r:embed="${rId}"></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill>`
    + '<pic:spPr bwMode="auto">'
    + `<a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>`
    + '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
    + '<a:noFill/>'
    + '</pic:spPr>'
    + '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
}

function buildAnlageCaptionXml(caption) {
  const text = String(caption || '').trim();
  if (!text) return '';
  const lines = text.split(/\r\n|\r|\n/);
  const runs = lines.map((line, i) => {
    const escaped = xmlEscape(line);
    if (i === 0) {
      return '<w:r><w:rPr><w:i/><w:sz w:val="20"/></w:rPr>'
        + `<w:t xml:space="preserve">${escaped}</w:t></w:r>`;
    }
    return '<w:r><w:rPr><w:i/><w:sz w:val="20"/></w:rPr><w:br/>'
      + `<w:t xml:space="preserve">${escaped}</w:t></w:r>`;
  }).join('');
  return '<w:p><w:pPr><w:pStyle w:val="Normal"/>'
    + '<w:jc w:val="center"/>'
    + '<w:spacing w:before="120" w:after="120"/>'
    + '<w:rPr><w:i/><w:sz w:val="20"/></w:rPr></w:pPr>'
    + runs
    + '</w:p>';
}

function findMaxNumericMatch(text, regex) {
  let max = 0;
  for (const m of text.matchAll(regex)) {
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

// Hängt eine "Anlage 1"-Sektion (Heading + Bilder + Captions) ans DOCX-Body an.
// Schreibt direkt in den übergebenen PizZip-Container (post-render).
function appendAnlageBilder(zip, anlageList, dateText) {
  const list = (anlageList || []).filter((it) => it && Buffer.isBuffer(it.buffer) && it.buffer.length > 0);
  if (list.length === 0) return;

  const docFile = zip.file('word/document.xml');
  const relsFile = zip.file('word/_rels/document.xml.rels');
  const ctFile = zip.file('[Content_Types].xml');
  if (!docFile || !relsFile || !ctFile) return;

  let documentXml = docFile.asText();
  let relsXml = relsFile.asText();
  let ctXml = ctFile.asText();

  let nextRId = findMaxNumericMatch(relsXml, /Id="rId(\d+)"/g) + 1;
  if (nextRId < 1) nextRId = 1;
  // docPr-IDs müssen pro <w:drawing> eindeutig sein — auf vorhandenes Maximum aufsetzen.
  let nextDrawingId = Math.max(
    findMaxNumericMatch(documentXml, /<wp:docPr id="(\d+)"/g),
    findMaxNumericMatch(documentXml, /<pic:cNvPr id="(\d+)"/g),
    99
  ) + 1;

  const blocks = [];
  blocks.push(buildPageBreakParagraphXml());
  blocks.push(buildAnlageHeadingXml(ANLAGE_HEADING));
  if (dateText) {
    blocks.push(buildAnlageDateXml(dateText));
  }

  list.forEach((item, idx) => {
    if (idx > 0) {
      blocks.push(buildPageBreakParagraphXml());
    }

    const ext = detectImageExtension(item.buffer);
    const targetRel = `media/anlage_${idx + 1}.${ext}`;
    const targetPath = `word/${targetRel}`;
    zip.file(targetPath, item.buffer, { binary: true });

    // Content-Type-Default für die Erweiterung registrieren, falls noch nicht vorhanden.
    // Einsetzen direkt vor `</Types>` — robust gegen Template-Änderungen, kein Abhängigkeitsanker.
    if (!new RegExp(`<Default Extension="${ext}"`).test(ctXml)) {
      const mime = IMAGE_MIME_BY_EXT[ext] || 'application/octet-stream';
      ctXml = ctXml.replace(
        '</Types>',
        `<Default Extension="${ext}" ContentType="${mime}"/></Types>`
      );
    }

    const rId = `rId${nextRId++}`;
    const newRel = `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${targetRel}"/>`;
    relsXml = relsXml.replace('</Relationships>', newRel + '</Relationships>');

    const dims = readImageDimensions(item.buffer) || { width: 1, height: 1 };
    const box = fitToBox(ANLAGE_BOX_CX, ANLAGE_BOX_CY, dims.width, dims.height);

    const drawingId = nextDrawingId++;
    const imgName = `AnlageBild_${idx + 1}`;
    blocks.push(buildAnlageImageXml(rId, box.cx, box.cy, drawingId, imgName));
    blocks.push(buildAnlageCaptionXml(item.caption || ''));
  });

  const injection = blocks.join('');
  // Direkt vor <w:sectPr> einsetzen (das schließende sectPr gehört zur einen Body-Section).
  if (documentXml.includes('<w:sectPr>')) {
    documentXml = documentXml.replace('<w:sectPr>', injection + '<w:sectPr>');
  } else {
    documentXml = documentXml.replace('</w:body>', injection + '</w:body>');
  }

  zip.file('word/document.xml', documentXml);
  zip.file('word/_rels/document.xml.rels', relsXml);
  zip.file('[Content_Types].xml', ctXml);
}

module.exports = { appendAnlageBilder };
