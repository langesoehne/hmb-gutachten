const PLACEHOLDER = '___';

function compactJoin(parts, separator = ' ') {
  return parts
    .map((value) => (value || '').toString().trim())
    .filter(Boolean)
    .join(separator)
    .trim();
}

function str(value) {
  return (value === undefined || value === null) ? '' : value.toString().trim();
}

function fallback(value, defaultValue = PLACEHOLDER) {
  const v = str(value);
  return v || defaultValue;
}

function formatDateDe(value) {
  const s = str(value);
  if (!s) return '';
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  const [, y, mo, d] = m;
  const months = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  return `${parseInt(d, 10)}. ${months[parseInt(mo, 10) - 1]} ${y}`;
}

function toDisplayAnrede(rawValue) {
  const map = { herr: 'Herr', frau: 'Frau', firma: 'Firma' };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayHeizungArt(rawValue) {
  const map = { gas: 'Gas', oel: 'Öl', strom: 'Strom' };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayHeizungTyp(rawValue) {
  const map = { zentral: 'Zentralheizung', etage: 'Etagenheizung', einzelofen: 'Einzelöfen' };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayDachform(rawValue) {
  const map = {
    sattel: 'Satteldach',
    mansard: 'Mansarddach',
    walm: 'Walmdach',
    kruppelwalm: 'Krüppelwalmdach',
    pult: 'Pultdach',
    flach: 'Flachdach'
  };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayDachstuhl(rawValue) {
  const map = {
    holz: 'Holzkonstruktion',
    binder: 'Binderkonstruktion',
    pfetten: 'Pfettendach, Holzkonstruktion',
    stahlbeton: 'Stahlbetonkonstruktion'
  };
  return map[str(rawValue).toLowerCase()] || '';
}

// Eingabe ist eine Zahl 1,0 – 8,0 in 0,5er-Schritten ("1,0", "1,5", ..., "8,0").
function parseGeschossigkeitNum(rawValue) {
  const s = str(rawValue).trim().replace(',', '.');
  if (s === '') return null;
  const num = parseFloat(s);
  if (isNaN(num)) return null;
  if (num < 1 || num > 8) return null;
  if (Math.abs(num * 2 - Math.round(num * 2)) > 1e-9) return null;
  return Math.round(num * 2) / 2;
}

// Wortstamm: 1 → "ein", 1,5 → "eineinhalb", 2,5 → "zweieinhalb", ..., 8 → "acht"
function geschossigkeitWortstamm(rawValue) {
  const num = parseGeschossigkeitNum(rawValue);
  if (num === null) return '';
  const ganz = Math.floor(num);
  const halb = (num - ganz) === 0.5;
  const ZAHLWORT = { 1: 'ein', 2: 'zwei', 3: 'drei', 4: 'vier', 5: 'fünf', 6: 'sechs', 7: 'sieben', 8: 'acht' };
  const wort = ZAHLWORT[ganz];
  if (!wort) return '';
  return halb ? `${wort}einhalb` : wort;
}

function toDisplayGeschossigkeit(rawValue) {
  const stamm = geschossigkeitWortstamm(rawValue);
  return stamm ? `${stamm}geschossig` : '';
}

function toDisplayGeschossigkeitDekl(rawValue) {
  const stamm = geschossigkeitWortstamm(rawValue);
  return stamm ? `${stamm}geschossigen` : '';
}

function toDisplayGebaeudeFormGen(rawValue) {
  const map = {
    freistehend: 'freistehenden Gebäudes',
    doppelhaus: 'Doppelhauses',
    reihenmittelhaus: 'Reihenmittelhauses',
    reihenendhaus: 'Reihenendhauses',
    mehrfamilienhaus: 'Mehrfamilienhauses'
  };
  return map[str(rawValue).toLowerCase()] || 'Gebäudes';
}

function toDisplayGeschossigkeitMehrstoeckig(rawValue) {
  const stamm = geschossigkeitWortstamm(rawValue);
  return stamm ? `${stamm}stöckiges` : 'mehrstöckiges';
}

function toDisplayKellerung(rawValue) {
  const map = {
    unterkellert: 'unterkellert',
    teilunterkellert: 'teilunterkellert',
    nicht: 'nicht unterkellert'
  };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayKellerungAdjektiv(rawValue) {
  const map = {
    unterkellert: 'unterkellerten',
    teilunterkellert: 'teilunterkellerten',
    nicht: 'nicht unterkellerten'
  };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplaySpitzboden(rawValue) {
  const map = {
    ausbaufaehig: 'ausbaufähigem Spitzboden',
    nicht_ausbaufaehig: 'nicht ausbaufähigem Spitzboden',
    ausgebaut: 'ausgebautem Dachgeschoss',
    keiner: ''
  };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayGebaeudeForm(rawValue) {
  const map = {
    freistehend: 'freistehendes Gebäude',
    doppelhaus: 'Doppelhaus',
    reihenmittelhaus: 'Reihenmittelhaus',
    reihenendhaus: 'Reihenendhaus',
    mehrfamilienhaus: 'Mehrfamilienhaus'
  };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayRenovierungsstatusAdjektiv(rawValue) {
  const map = {
    nicht_renoviert: 'nicht renovierten',
    teilweise: 'teilweise renovierten',
    umfassend: 'umfassend modernisierten',
    saniert: 'sanierten'
  };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayRenovierungsstatusSatz(rawValue) {
  const map = {
    nicht_renoviert: 'nicht renoviert oder modernisiert',
    teilweise: 'teilweise renoviert und modernisiert',
    umfassend: 'umfassend modernisiert',
    saniert: 'umfassend saniert'
  };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayZustandKurz(rawValue) {
  const map = {
    altersgemaess: 'dem Alter entsprechend',
    unterdurchschnittlich: 'unterdurchschnittlich',
    gepflegt: 'gepflegt',
    sanierungsbeduerftig: 'sanierungsbedürftig',
    renovierungsbeduerftig: 'renovierungsbedürftig'
  };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayZustandLangDeklin(rawValue) {
  const map = {
    altersgemaess: 'dem Alter entsprechenden',
    unterdurchschnittlich: 'unterdurchschnittlichen',
    gepflegt: 'gepflegten',
    sanierungsbeduerftig: 'sanierungsbedürftigen',
    renovierungsbeduerftig: 'renovierungsbedürftigen'
  };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayAusstattungsgrad(rawValue) {
  const map = { einfach: 'überwiegend einfache Art', mittel: 'mittlere Art', gehoben: 'gehobene Art' };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayHimmelsrichtung(rawValue) {
  const map = {
    nord: 'nördlich',
    nordost: 'nordöstlich',
    ost: 'östlich',
    suedost: 'südöstlich',
    sued: 'südlich',
    suedwest: 'südwestlich',
    west: 'westlich',
    nordwest: 'nordwestlich'
  };
  return map[str(rawValue).toLowerCase()] || '';
}

// Genus-Regel: Heizungstypen sind alle feminin → "eine". Einzelöfen ist Plural ohne Artikel.
function toDisplayHeizungArtikel(heizungTyp) {
  const typ = str(heizungTyp).toLowerCase();
  if (typ === 'einzelofen') return '';
  return 'eine';
}

// Datalist-Werte: '>24cm', '11,5-24cm', '<11,5cm', leer
function toDisplayWandstaerke(rawValue) {
  const v = str(rawValue);
  if (!v) return '';
  return v + ' dick';
}

function toDisplayDeckeOG(rawValue) {
  const map = {
    beton: 'Beton',
    stahlbeton: 'Stahlbeton',
    holz: 'Holz',
    holzbalken: 'Holzbalkendecke'
  };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayRndKategorie(punkteSumme) {
  const n = parseInt(str(punkteSumme), 10);
  if (!Number.isFinite(n)) return '';
  if (n === 0) return 'nicht modernisiert bis kleine Modernisierung im Rahmen der Instandhaltung';
  if (n <= 4) return 'kleine Modernisierung im Rahmen der Instandhaltung';
  if (n <= 9) return 'mittlere Modernisierung';
  if (n <= 14) return 'umfassende Modernisierung';
  return 'umfassende Modernisierung im Rahmen einer Sanierung';
}

function toDisplayGebaeudeTyp(rawValue) {
  const map = {
    wohnzwecke: 'Wohngebäude',
    gewerblich: 'Gewerbegebäude',
    wohngewerblich: 'Wohn- und Bürogebäude'
  };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayGebaeudeTypGen(rawValue) {
  const map = {
    wohnzwecke: 'Wohngebäudes',
    gewerblich: 'Gewerbegebäudes',
    wohngewerblich: 'Wohn- und Bürogebäudes'
  };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayNutzungsZweck(rawValue) {
  const map = {
    wohnzwecke: 'Wohnzwecken',
    gewerblich: 'gewerblichen Zwecken',
    wohngewerblich: 'Wohn- und Gewerbezwecken'
  };
  return map[str(rawValue).toLowerCase()] || '';
}

// Mittelteil für "Die zu begutachtende Liegenschaft {nutzungs_zweck_satz} genutzt."
function toDisplayNutzungsZweckSatz(currentRaw, pastRaw) {
  const current = toDisplayNutzungsZweck(currentRaw);
  if (!current) return '';
  const pastKey = str(pastRaw).toLowerCase();
  const isSame = !pastKey || pastKey === 'gleich' || pastKey === str(currentRaw).toLowerCase();
  if (isSame) {
    return `wird aktuell und wurde in der Vergangenheit zu ${current}`;
  }
  const past = toDisplayNutzungsZweck(pastRaw);
  if (!past) {
    return `wird aktuell und wurde in der Vergangenheit zu ${current}`;
  }
  return `wird aktuell zu ${current} und wurde in der Vergangenheit zu ${past}`;
}

function toDisplayBauweise(rawValue) {
  const map = { beton: 'Stahlbeton', mauerwerk: 'Mauerwerk', holztafel: 'Holztafelbauweise' };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayBauweiseLang(rawValue) {
  const map = { beton: 'Stahlbetonbauweise', mauerwerk: 'Mauerwerksbauweise', holztafel: 'Holztafelbauweise' };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayInnenwand(rawValue) {
  const map = { trockenbau: 'Trockenbau', mauerwerk: 'Mauerwerk', holztafel: 'Holztafelbauweise' };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayDecke(rawValue) {
  const map = { beton: 'Beton', holzbalken: 'Holzbalkendecke' };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayDachStatus(rawValue) {
  const v = str(rawValue).toLowerCase();
  if (v === 'ja') return 'gedämmt';
  if (v === 'nein') return 'ungedämmt';
  return '';
}

function toDisplayDacheindeckung(rawValue) {
  const map = {
    beton: 'Betonziegel',
    ton: 'Tonziegel',
    faserzement: 'Faserzement',
    bitumen: 'Bitumen',
    folie: 'Folie'
  };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayFensterNominativ(rawValue) {
  const map = { holz: 'Holzfenster', kunststoff: 'Kunststofffenster', alu: 'Aluminiumfenster' };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayFensterbankAussen(rawValue) {
  const map = { alu: 'Aluminium', stein: 'Stein' };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayFensterbankInnen(rawValue) {
  const map = { holz: 'Holz', stein: 'Stein' };
  return map[str(rawValue).toLowerCase()] || '';
}

function toDisplayWarmwasser(rawValue) {
  const map = {
    zentral: 'zentral',
    durchlauferhitzer: 'elektrischer Durchlauferhitzer',
    therme: 'Therme',
    gas: 'Gas-Therme',
    strom: 'Strom'
  };
  return map[str(rawValue).toLowerCase()] || '';
}

// Dämmung wird separat über {energie_aussenwand} ausgegeben — hier nur sichtbare Fassaden-Aspekte.
function toDisplayFassade(fields) {
  const out = [];
  if (str(fields.bauart_fassade_putz).toLowerCase() === 'ja') out.push('Putz');
  if (str(fields.bauart_fassade_verkleidung).toLowerCase() === 'ja') out.push('Verkleidung');
  return out;
}

// Amtliche Bezeichnungen der Landesbauordnungen je Bundesland.
const LANDESBAUORDNUNG_BY_BUNDESLAND = {
  BW: { name: 'Landesbauordnung für Baden-Württemberg',          kurz: 'LBO' },
  BY: { name: 'Bayerische Bauordnung',                            kurz: 'BayBO' },
  BE: { name: 'Bauordnung für Berlin',                            kurz: 'BauO Bln' },
  BB: { name: 'Brandenburgische Bauordnung',                      kurz: 'BbgBO' },
  HB: { name: 'Bremische Landesbauordnung',                       kurz: 'BremLBO' },
  HH: { name: 'Hamburgische Bauordnung',                          kurz: 'HBauO' },
  HE: { name: 'Hessische Bauordnung',                             kurz: 'HBO' },
  MV: { name: 'Landesbauordnung Mecklenburg-Vorpommern',          kurz: 'LBauO M-V' },
  NI: { name: 'Niedersächsische Bauordnung',                      kurz: 'NBauO' },
  NW: { name: 'Bauordnung für das Land Nordrhein-Westfalen',      kurz: 'BauO NRW' },
  RP: { name: 'Landesbauordnung Rheinland-Pfalz',                 kurz: 'LBauO' },
  SL: { name: 'Landesbauordnung Saarland',                        kurz: 'LBO' },
  SN: { name: 'Sächsische Bauordnung',                            kurz: 'SächsBO' },
  ST: { name: 'Bauordnung des Landes Sachsen-Anhalt',             kurz: 'BauO LSA' },
  SH: { name: 'Landesbauordnung für das Land Schleswig-Holstein', kurz: 'LBO' },
  TH: { name: 'Thüringer Bauordnung',                             kurz: 'ThürBO' }
};

function getLandesbauordnung(bundeslandCode) {
  const code = str(bundeslandCode).toUpperCase();
  return LANDESBAUORDNUNG_BY_BUNDESLAND[code] || { name: '', kurz: '' };
}

const LIEGENSCHAFTSKARTE_QUELLE = {
  BW: ', geoportal-bw.de',
  BY: ', geoportal.bayern.de',
  BE: ', geoportal.berlin.de',
  BB: ', geoportal.brandenburg.de',
  HB: ', geoportal.bremen.de',
  HH: ', geoportal-hamburg.de',
  HE: ', geoportal.hessen.de',
  MV: ', geoportal-mv.de',
  NI: ', geoportal.niedersachsen.de',
  NW: ', GEOportal.NRW',
  RP: ', geoportal.rlp.de',
  SL: ', geoportal.saarland.de',
  SN: ', geoportal.sachsen.de',
  ST: ', geoportal.sachsen-anhalt.de',
  SH: ', geoportal-sh.de',
  TH: ', geoportal-th.de'
};

function getLiegenschaftskarteQuelle(bundeslandCode) {
  return LIEGENSCHAFTSKARTE_QUELLE[str(bundeslandCode).toUpperCase()] || '';
}

// Adressblock für Sektion 1.1 — mehrzeilig, kein duplizierter Text.
// "Firma" steht auf Zeile 1, sonst nur Anrede+Name (z.B. "Herr Robert Hyra").
function buildAuftraggeberBlock(fields, name, strasseHausnummer, plzOrt) {
  const anrede = toDisplayAnrede(fields.auftraggeber_anrede);
  const isFirma = anrede === 'Firma';
  const lines = [];
  if (isFirma) {
    lines.push(anrede);
    if (name) lines.push(name);
  } else {
    const head = [anrede, name].filter(Boolean).join(' ').trim();
    if (head) lines.push(head);
  }
  if (strasseHausnummer) lines.push(strasseHausnummer);
  if (plzOrt) lines.push(plzOrt);
  return lines.join('\n');
}

// Auftraggeber im Satz (Sektion 2): "Firma" mit Artikel "die", sonst Anrede+Name.
function buildAuftraggeberSatz(fields, name, strasseHausnummer, plzOrt) {
  const anrede = toDisplayAnrede(fields.auftraggeber_anrede);
  const isFirma = anrede === 'Firma';
  const head = isFirma
    ? `die ${anrede} ${name}`.trim()
    : [anrede, name].filter(Boolean).join(' ').trim();
  return compactJoin([head, strasseHausnummer, plzOrt], ', ');
}

function jaNein(rawValue, baujahr) {
  const v = str(rawValue).toLowerCase();
  if (v !== 'ja' && v !== 'nein') return '';
  if (v === 'nein') return 'nicht vorhanden';
  const bj = str(baujahr);
  return bj ? `vorhanden (Baujahr ${bj})` : 'vorhanden';
}

function buildStellplaetzeText(fields) {
  const vorhanden = str(fields.stellplaetze_vorhanden).toLowerCase();
  if (vorhanden === 'nein') return 'keine Stellplätze';
  if (vorhanden === 'ja') {
    const anzahl = parseInt(str(fields.stellplaetze_anzahl), 10);
    if (!Number.isFinite(anzahl) || anzahl < 1) return '';
    if (anzahl === 1) return 'einen Stellplatz';
    return `${anzahl} Stellplätze`;
  }
  return '';
}

function buildErschliessungText(fields, objektStrasse, anschriftKurz) {
  const versorgung = [];
  if (str(fields.erschliessung_strom).toLowerCase() === 'ja') versorgung.push('Strom');
  if (str(fields.erschliessung_gas).toLowerCase() === 'ja') versorgung.push('Gas');
  if (str(fields.erschliessung_wasser).toLowerCase() === 'ja') versorgung.push('Wasser');
  const versorgungText = versorgung.length
    ? versorgung.join(', ').replace(/, ([^,]+)$/, ' und $1')
    : '';

  const himmel = toDisplayHimmelsrichtung(fields.erschliessung_himmelsrichtung);
  const fahrbahn = str(fields.erschliessung_fahrbahn_typ);
  const strasseName = str(objektStrasse);
  const anschriftRef = str(anschriftKurz);

  const kanal = str(fields.erschliessung_kanalisation).toLowerCase() === 'ja';
  const kanalSuffix = kanal ? ' an die öffentliche Kanalisation angeschlossen' : ' angeschlossen';

  const teil1 = (anschriftRef && versorgungText)
    ? `Das Objekt ${anschriftRef} ist an das öffentliche Versorgungsnetz mit ${versorgungText}${kanalSuffix}.`
    : '';

  const teil2 = (himmel && strasseName)
    ? ` Es wird, soweit ersichtlich, von der ${himmel} verlaufenden „${strasseName}" erschlossen${fahrbahn ? ` (${fahrbahn})` : ''}.`
    : '';

  return (teil1 + teil2).trim();
}

module.exports = {
  compactJoin,
  str,
  fallback,
  formatDateDe,
  toDisplayAnrede,
  toDisplayHeizungArt,
  toDisplayHeizungTyp,
  toDisplayDachform,
  toDisplayDachstuhl,
  toDisplayGeschossigkeit,
  toDisplayGeschossigkeitDekl,
  toDisplayGeschossigkeitMehrstoeckig,
  toDisplayGebaeudeForm,
  toDisplayGebaeudeFormGen,
  toDisplayKellerung,
  toDisplayKellerungAdjektiv,
  toDisplaySpitzboden,
  toDisplayRenovierungsstatusAdjektiv,
  toDisplayRenovierungsstatusSatz,
  toDisplayZustandKurz,
  toDisplayZustandLangDeklin,
  toDisplayAusstattungsgrad,
  toDisplayHeizungArtikel,
  toDisplayWandstaerke,
  toDisplayDeckeOG,
  toDisplayRndKategorie,
  toDisplayGebaeudeTyp,
  toDisplayGebaeudeTypGen,
  toDisplayNutzungsZweck,
  toDisplayNutzungsZweckSatz,
  toDisplayBauweise,
  toDisplayBauweiseLang,
  toDisplayInnenwand,
  toDisplayDecke,
  toDisplayDachStatus,
  toDisplayDacheindeckung,
  toDisplayFensterNominativ,
  toDisplayFensterbankAussen,
  toDisplayFensterbankInnen,
  toDisplayWarmwasser,
  toDisplayFassade,
  getLandesbauordnung,
  getLiegenschaftskarteQuelle,
  buildAuftraggeberBlock,
  buildAuftraggeberSatz,
  jaNein,
  buildStellplaetzeText,
  buildErschliessungText
};
