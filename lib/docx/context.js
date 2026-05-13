const { SACHVERSTAENDIGER_ORT } = require('../../config');
const T = require('../transformers');

// joinAnd: verbinde Liste mit Komma, letztes Element mit "und"
function joinAnd(parts) {
  const filtered = parts.filter(Boolean);
  if (filtered.length === 0) return '';
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return filtered.join(' und ');
  return filtered.slice(0, -1).join(', ') + ' und ' + filtered[filtered.length - 1];
}

function buildSachverhaltEinleitung(ctx) {
  if (!(ctx.geschossigkeitDekl || ctx.gebaeudeForm || ctx.flur || ctx.flurstueck)) return '';
  const grundstueckTeil = (ctx.flur || ctx.flurstueck)
    ? `Das Grundstück Flur ${ctx.flur}; Flst.Nr.: ${ctx.flurstueck}`
    : 'Das Grundstück';
  const flaecheTeil = ctx.grundstueckFlaeche ? ` mit einer Fläche von ${ctx.grundstueckFlaeche} m²` : '';
  const adjektive = [ctx.geschossigkeitDekl, ctx.kellerungAdj].filter(Boolean).join(', ');
  const formTeil = ctx.gebaeudeForm || 'Gebäude';
  const beschreibung = adjektive
    ? ` ist mit einem ${adjektive} ${formTeil} bebaut.`
    : (formTeil ? ` ist mit einem ${formTeil} bebaut.` : ' ist bebaut.');
  return grundstueckTeil + flaecheTeil + beschreibung;
}

function buildSachverhaltZwischen(fields, ctx) {
  if (!(ctx.geschossigkeit || ctx.gebaeudeGrundflaeche)) return '';
  const teile = [];
  if (ctx.geschossigkeit) teile.push(`${ctx.geschossigkeit} ausgeführt`);
  const kellerungKey = T.str(fields.kellerung).toLowerCase();
  if (kellerungKey === 'unterkellert') teile.push('vollständig unterkellert');
  else if (kellerungKey === 'teilunterkellert') teile.push('teilunterkellert');
  if (ctx.gebaeudeGrundflaeche) {
    teile.push(`weist eine Grundfläche von ca. ${ctx.gebaeudeGrundflaeche} m² auf (gemäß Angaben des Eigentümers; durch den Sachverständigen mittels überschlägiger Plausibilitätsprüfung verifiziert)`);
  }
  return teile.length
    ? `Das bezeichnete Gebäude ist ${joinAnd(teile)}. Dem Unterzeichner lagen Auszüge aus den ursprünglichen Eingabeplänen sowie nachträglich erstellte Bestandsunterlagen vor.`
    : '';
}

function buildGebaeudeKurzbeschreibung(ctx) {
  if (!(ctx.geschossigkeitDekl || ctx.gebaeudeForm || ctx.dachform)) return '';
  const adjektive = [ctx.geschossigkeitDekl, ctx.kellerungAdj].filter(Boolean).join(', ');
  let satz = ctx.gebaeudeForm
    ? `Das Gebäude ist ein ${ctx.gebaeudeForm} und besteht aus einem`
    : 'Das Gebäude besteht aus einem';
  if (adjektive) satz += ` ${adjektive}`;
  satz += ' Gebäude';
  if (ctx.dachform) satz += ` mit ${ctx.dachform}`;
  if (ctx.spitzbodenText) satz += ` und ${ctx.spitzbodenText}`;
  return satz + '.';
}

function buildWaermeschutzText(fields, ctx) {
  const teile = [];
  const dachGedaemmt = T.str(fields.bauart_dach).toLowerCase() === 'ja';
  const fassadeGedaemmt = T.str(fields.bauart_fassade_daemmung).toLowerCase() === 'ja';
  if (!dachGedaemmt && !fassadeGedaemmt) {
    teile.push(ctx.istUnterkellert
      ? 'Weder der Keller noch das Dach sind zusätzlich gedämmt.'
      : 'Weder das Dach noch die Wände sind zusätzlich gedämmt.');
  } else if (dachGedaemmt && !fassadeGedaemmt) {
    teile.push('Das Dach ist gedämmt, die Wände sind nicht zusätzlich gedämmt.');
  } else if (!dachGedaemmt && fassadeGedaemmt) {
    teile.push('Die Wände sind gedämmt, das Dach ist nicht zusätzlich gedämmt.');
  } else {
    teile.push('Sowohl das Dach als auch die Wände sind gedämmt.');
  }
  if (ctx.fensterTyp) {
    const verglasungsTeil = ctx.fensterIst2fach ? '2-fach verglast' : 'einfach verglast';
    teile.push(`Die ${ctx.fensterTyp} sind ${verglasungsTeil} ohne weitere Anforderungen.`);
  }
  teile.push('Gemäß dem Gebäudebaujahr wurde an das Gebäude keine Wärmeschutzanforderungen gestellt. Dementsprechend schlecht stellt sich der Wärmeschutz im Verhältnis zu den aktuellen Wärmeschutzanforderungen dar.');
  return teile.join(' ');
}

function buildDocxContext(fields = {}) {
  // --- Auftraggeber ---
  const auftraggeberName = T.compactJoin([fields.vorname, fields.name]);
  const hausnummerMitZusatz = T.compactJoin([fields.hausnummer, T.str(fields.hausnummer_zusatz)]);
  const auftraggeberStrasseHausnummer = T.compactJoin([fields.strasse, hausnummerMitZusatz]);
  const auftraggeberPlzOrt = T.compactJoin([fields.plz, fields.ort]);
  const auftraggeberBlock = T.buildAuftraggeberBlock(fields, auftraggeberName, auftraggeberStrasseHausnummer, auftraggeberPlzOrt);
  const auftraggeberSatz = T.buildAuftraggeberSatz(fields, auftraggeberName, auftraggeberStrasseHausnummer, auftraggeberPlzOrt);

  // --- Objekt ---
  const objektStrasse = T.str(fields.objekt_strasse);
  const objektHausnummerZusatz = T.str(fields.objekt_hausnummer_zusatz);
  const objektStrasseHausnummer = T.compactJoin([
    objektStrasse,
    T.compactJoin([fields.objekt_hausnummer, objektHausnummerZusatz])
  ]);
  const objektPlzOrt = T.compactJoin([fields.objekt_plz, fields.objekt_ort]);
  const genaueAnschrift = T.compactJoin([objektStrasseHausnummer, objektPlzOrt], ', ');

  // --- Eckdaten ---
  const baujahr = T.str(fields.baujahr);
  const wohneinheiten = T.str(fields.wohneinheiten);
  const nutzflaeche = T.str(fields.nutzflaeche);
  const vollgeschosse = T.str(fields.vollgeschosse);
  const stellplaetze = T.buildStellplaetzeText(fields);
  const energieausweisJahr = T.str(fields.energieausweis_jahr);
  const energieausweisGueltigBis = T.str(fields.energieausweis_gueltig_bis);
  const flur = T.str(fields.flur);
  const flurstueck = T.str(fields.flurstueck);
  const gemarkung = T.str(fields.gemarkung);
  const bundesland = T.str(fields.bundesland);
  const landesbauordnung = T.getLandesbauordnung(bundesland);
  const grundstueckFlaeche = T.str(fields.grundstueck_flaeche);
  const gebaeudeGrundflaeche = T.str(fields.gebaeude_grundflaeche);

  // --- Daten ---
  const stichtag = T.formatDateDe(fields.stichtag);
  const auftragsdatum = T.formatDateDe(fields.auftragsdatum);
  const ortsbesichtigungsdatum = T.formatDateDe(fields.ortsbesichtigungsdatum);
  const unterschriftsdatum = T.formatDateDe(fields.unterschriftsdatum);

  // --- Bild-Captions ---
  const bild1Caption = T.str(fields.bild1_caption);
  const bild3Caption = T.str(fields.bild3_caption);
  const bild4Caption = T.str(fields.bild4_caption);

  // --- Heizung / Warmwasser ---
  const heizungArtText = T.toDisplayHeizungArt(fields.heizung_art);
  const heizungTypText = T.toDisplayHeizungTyp(fields.heizung);
  const heizungText = T.compactJoin([heizungArtText, heizungTypText], '-');
  const heizungBaujahr = T.str(fields.heizung_baujahr);
  const heizungArtikel = T.toDisplayHeizungArtikel(fields.heizung);
  const heizungZusatz = T.str(fields.heizung_zusatz);
  const warmwasserBereitstellung = T.toDisplayWarmwasser(fields.warmwasser);
  const solarthermieText = T.jaNein(fields.solarthermie, fields.solar_bj_1);
  const photovoltaikText = T.jaNein(fields.photovoltaik, fields.pv_bj);
  const aufzugText = T.jaNein(fields.aufzug, fields.aufzug_baujahr);

  // --- Bauart ---
  const gebaeudeTyp = T.toDisplayGebaeudeTyp(fields.nutzung);
  const gebaeudeTypGen = T.toDisplayGebaeudeTypGen(fields.nutzung);
  const nutzungsZweckSatz = T.toDisplayNutzungsZweckSatz(fields.nutzung, fields.nutzung_vergangenheit);
  const aussenwandEg = T.toDisplayBauweise(fields.bauart_außenwand_eg);
  const aussenwandUg = T.toDisplayBauweise(fields.bauart_außenwand_ug);
  const aussenwandDickeEg = T.toDisplayWandstaerke(fields.bauart_aussenwand_dicke_eg);
  const aussenwandDickeUg = T.toDisplayWandstaerke(fields.bauart_aussenwand_dicke_ug);
  const bauweiseLang = T.toDisplayBauweiseLang(fields.bauart_außenwand_eg);
  const innenwandText = T.toDisplayInnenwand(fields.bauart_innenwand);
  const innenwandZusatz = T.str(fields.innenwand_zusatz);
  const deckeText = T.toDisplayDecke(fields.bauart_decke);
  const deckeOgText = T.toDisplayDeckeOG(fields.bauart_decke_og) || deckeText;
  const dachZustand = T.toDisplayDachStatus(fields.bauart_dach);
  const dachform = T.toDisplayDachform(fields.bauart_dachform);
  const dachstuhlText = T.compactJoin([dachform, T.toDisplayDachstuhl(fields.bauart_dachstuhl)], ', ');
  const dacheindeckungText = T.toDisplayDacheindeckung(fields.bauart_dacheindeckung);
  const fensterTyp = T.toDisplayFensterNominativ(fields.bauart_fenster);
  const fensterbankAussen = T.toDisplayFensterbankAussen(fields.bauart_fensterbaenke_außen);
  const fensterbankInnen = T.toDisplayFensterbankInnen(fields.bauart_fensterbaenke_innen);
  const fassadeListe = T.toDisplayFassade(fields);
  const fassadeText = fassadeListe.length ? fassadeListe.join(', ') : '';

  // --- Energetischer Zustand ---
  const fassadeDaemmung = T.str(fields.bauart_fassade_daemmung).toLowerCase();
  const energieAussenwand = fassadeDaemmung === 'ja' ? 'gedämmt'
    : (fassadeDaemmung === 'nein' ? 'ungedämmt' : '');
  const energieDach = dachZustand;
  const kellerdeckeDaemmung = T.str(fields.bauart_kellerdecke).toLowerCase();
  const energieKellerdecke = kellerdeckeDaemmung === 'ja' ? 'gedämmt'
    : (kellerdeckeDaemmung === 'nein' ? 'ungedämmt' : '');
  const fensterIst2fach = T.str(fields.bauart_fenster_verglasung).toLowerCase() === 'ja';
  const fensterText = fensterTyp
    ? (fensterIst2fach ? `${fensterTyp}, 2-fach-Verglasung` : fensterTyp)
    : '';
  const fensterZusatz = T.str(fields.fenster_zusatz);

  const liegenschaftskarteQuelle = T.getLiegenschaftskarteQuelle(bundesland);

  // --- Geschossigkeit / Kellerung / Form ---
  const geschossigkeit = T.toDisplayGeschossigkeit(fields.geschossigkeit);
  const geschossigkeitDekl = T.toDisplayGeschossigkeitDekl(fields.geschossigkeit);
  const geschossigkeitStoeckig = T.toDisplayGeschossigkeitMehrstoeckig(fields.geschossigkeit);
  const kellerungAdj = T.toDisplayKellerungAdjektiv(fields.kellerung);
  const kellerungKey = T.str(fields.kellerung).toLowerCase();
  const istUnterkellert = kellerungKey === 'unterkellert' || kellerungKey === 'teilunterkellert';
  const kellerdeckeLabel = istUnterkellert ? 'Kellerdecke' : 'Bodenplatte';
  const spitzbodenText = T.toDisplaySpitzboden(fields.spitzboden);
  const gebaeudeForm = T.toDisplayGebaeudeForm(fields.gebaeude_form);
  const gebaeudeFormGen = T.toDisplayGebaeudeFormGen(fields.gebaeude_form);

  // --- Renovierungsstatus / Zustand / Ausstattung ---
  const renovierungsstatusAdj = T.toDisplayRenovierungsstatusAdjektiv(fields.renovierungsstatus);
  const renovierungsstatusSatz = T.toDisplayRenovierungsstatusSatz(fields.renovierungsstatus);
  const zustandKurz = T.toDisplayZustandKurz(fields.zustand_gesamt);
  const zustandLangDeklin = T.toDisplayZustandLangDeklin(fields.zustand_gesamt);
  const ausstattungsgrad = T.toDisplayAusstattungsgrad(fields.ausstattungsgrad);
  const standardstufe = T.str(fields.standardstufe);

  // --- Erschließung ---
  const erschliessungAnschrift = T.compactJoin([
    objektStrasse,
    T.compactJoin([fields.objekt_hausnummer, objektHausnummerZusatz])
  ]);
  const erschliessungText = T.buildErschliessungText(fields, objektStrasse, erschliessungAnschrift);

  // --- Generierte Texte ---
  const sharedCtx = { geschossigkeitDekl, gebaeudeForm, flur, flurstueck, kellerungAdj,
    grundstueckFlaeche, geschossigkeit, gebaeudeGrundflaeche, dachform, spitzbodenText,
    fensterTyp, fensterIst2fach, istUnterkellert };
  const sachverhaltEinleitung = buildSachverhaltEinleitung(sharedCtx);
  const sachverhaltZwischen = buildSachverhaltZwischen(fields, sharedCtx);
  const gebaeudeKurzbeschreibung = buildGebaeudeKurzbeschreibung(sharedCtx);

  // --- Außenanlagen / Funktion-Zusatz / Rohbau / Ausbau / Haustechnik (alle Freitexte) ---
  const aussenanlagenEingang = T.str(fields.aussenanlagen_eingang);
  const aussenanlagenGarten = T.str(fields.aussenanlagen_garten);
  const aussenanlagenZustand = T.str(fields.aussenanlagen_zustand);
  const funktionZusatzGeschosse = T.str(fields.funktion_zusatz_geschosse);
  const funktionZusatzEinheiten = T.str(fields.funktion_zusatz_einheiten);
  const fundamenteZusatz = T.str(fields.fundamente_zusatz);
  const terrasseBalkon = T.str(fields.terrasse_balkon_text);
  const treppenText = T.str(fields.treppen_text);
  const regenrinneText = T.str(fields.regenrinne_text);
  const wandoberflaecheWohnraeume = T.str(fields.wandoberflaeche_wohnraeume);
  const wandoberflaecheBaeder = T.str(fields.wandoberflaeche_baeder);
  const wandoberflaecheKuechen = T.str(fields.wandoberflaeche_kuechen);
  const hauseingangElement = T.str(fields.hauseingang_element);
  const innentuerenText = T.str(fields.innentueren_text);
  const wohnungstuerenText = T.str(fields.wohnungstueren_text);
  const bodenBaeder = T.str(fields.boden_baeder);
  const bodenKuechen = T.str(fields.boden_kuechen);
  const bodenFlur = T.str(fields.boden_flur);
  const bodenWohnraeume = T.str(fields.boden_wohnraeume);
  const bodenEingang = T.str(fields.boden_eingang);
  const bodenTreppenhaus = T.str(fields.boden_treppenhaus);
  const bodenKeller = T.str(fields.boden_keller);
  const deckenOberflaeche = T.str(fields.decken_oberflaeche);
  const schornsteinText = T.str(fields.schornstein_text);
  const sanitaerText = T.str(fields.sanitaer_text);
  const badAusstattungText = T.str(fields.bad_ausstattung_text);
  const elektroText = T.str(fields.elektro_text);

  // --- Sektion 6: Bautechnische Beurteilung ---
  const bautechnikEinleitung = T.compactJoin([
    geschossigkeitStoeckig,
    dachform ? `${dachform}gebäude` : '',
    istUnterkellert ? 'mit Unterkellerung' : 'ohne Unterkellerung'
  ], ' ');
  const deckenEinschaetzung = T.str(fields.decken_einschaetzung).toLowerCase();
  const deckenEinschaetzungText = deckenEinschaetzung === 'duenn'
    ? 'Die Decken sind verhältnismäßig dünn ausgebildet. Soweit einschätzbar erfüllen sie nicht die heutigen Brand- und Schallschutzanforderungen. Die Wände sind in üblichen Bauteilstärken ausgeführt.'
    : (deckenEinschaetzung === 'ueblich'
       ? 'Die Decken sind in üblichen Bauteilstärken ausgeführt. Die Wände sind in üblichen Bauteilstärken ausgeführt.'
       : '');
  const standsicherheit = T.str(fields.standsicherheit_einschaetzung).toLowerCase();
  const standsicherheitText = standsicherheit === 'ausreichend'
    ? 'Die Gebäude erscheinen insgesamt ausreichend standsicher.'
    : (standsicherheit === 'eingeschraenkt'
       ? 'Die Standsicherheit der Gebäude erscheint eingeschränkt.'
       : '');
  const fundamenteEinschaetzungText = istUnterkellert
    ? 'Die Fundamente und der Keller sind massiv ausgebildet und, soweit ersichtlich, ausreichend standsicher. Der Keller ist weder gedämmt noch abgedichtet.'
    : 'Die Fundamente sind massiv ausgebildet und, soweit ersichtlich, ausreichend standsicher. Die Bodenplatte ist weder gedämmt noch abgedichtet.';
  const waermeschutzText = buildWaermeschutzText(fields, sharedCtx);
  const tierbefall = T.str(fields.tierbefall).toLowerCase();
  const tierbefallText = tierbefall === 'ja'
    ? 'Tierbefall von Bauteilen: Tierbefall wurde festgestellt.'
    : (tierbefall === 'nein' ? 'Tierbefall von Bauteilen: Tierbefall wurde nicht festgestellt' : '');
  const installationText = T.str(fields.installation_einschaetzung) ||
    'Ebenfalls sind die Sanitär- und Elektroinstallationen seit den Modernisierungsmaßnahmen in die Jahre gekommen und entsprechen nicht den heutigen Anforderungen.';

  // --- Sektion 7: RND ---
  const rndFiktivesAlter = T.str(fields.rnd_fiktives_alter);
  const rndJahre = T.str(fields.rnd_jahre);
  const rndGesamtnutzungsdauer = T.str(fields.rnd_gesamtnutzungsdauer);
  const modernisierungsJahre = T.str(fields.modernisierungs_jahre);
  const modernisierungsMassnahmen = T.str(fields.modernisierungs_massnahmen);
  const pFenster = parseInt(T.str(fields.rnd_punkte_fenster), 10) || 0;
  const pDach = parseInt(T.str(fields.rnd_punkte_dach), 10) || 0;
  const pLeitungen = parseInt(T.str(fields.rnd_punkte_leitungen), 10) || 0;
  const pHeizung = parseInt(T.str(fields.rnd_punkte_heizung), 10) || 0;
  const pFassade = parseInt(T.str(fields.rnd_punkte_fassade), 10) || 0;
  const pInnenausbau = parseInt(T.str(fields.rnd_punkte_innenausbau), 10) || 0;
  const pBaeder = parseInt(T.str(fields.rnd_punkte_baeder), 10) || 0;
  const punkteSumme = pFenster + pDach + pLeitungen + pHeizung + pFassade + pInnenausbau + pBaeder;
  const rndKategorieText = T.toDisplayRndKategorie(punkteSumme);

  // --- Freitexte ---
  const modernisierung = T.str(fields.modernisierung_freitext);
  const erweiterung = T.str(fields.erweiterung);
  const sanierungszustand = T.str(fields.sanierungszustand);
  const anmerkung = T.str(fields.anmerkung);
  const bauschaeden = T.str(fields.bauschaeden);

  return {
    // Auftraggeber
    auftraggeber_name: T.fallback(auftraggeberName),
    auftraggeber_block: T.fallback(auftraggeberBlock),
    auftraggeber_satz: T.fallback(auftraggeberSatz),

    // Objekt
    genaue_anschrift: T.fallback(genaueAnschrift),
    flur: T.fallback(flur),
    flurstueck: T.fallback(flurstueck),
    gemarkung: T.fallback(gemarkung),
    landesbauordnung_name: T.fallback(landesbauordnung.name),
    landesbauordnung_kurz: T.fallback(landesbauordnung.kurz),

    // Eckdaten
    baujahr: T.fallback(baujahr),
    wohneinheiten: T.fallback(wohneinheiten),
    nutzflaeche: T.fallback(nutzflaeche),
    vollgeschosse: T.fallback(vollgeschosse),
    stellplaetze: T.fallback(stellplaetze),
    energieausweis_jahr: T.fallback(energieausweisJahr),
    energieausweis_gueltig_bis: T.fallback(energieausweisGueltigBis),

    // Daten
    stichtag: T.fallback(stichtag),
    unterschriftsdatum: T.fallback(unterschriftsdatum),
    auftragsdatum: T.fallback(auftragsdatum),
    ortsbesichtigungsdatum: T.fallback(ortsbesichtigungsdatum),
    sachverstaendiger_ort: T.str(fields.sachverstaendiger_ort) || SACHVERSTAENDIGER_ORT,

    // Bild-Captions
    bild1_caption: T.fallback(bild1Caption),
    bild3_caption: T.fallback(bild3Caption),
    bild4_caption: T.fallback(bild4Caption),

    // Gebäudetyp / Form / Zustand
    gebaeude_typ: T.fallback(gebaeudeTyp),
    gebaeude_typ_gen: T.fallback(gebaeudeTypGen),
    nutzungs_zweck_satz: T.fallback(nutzungsZweckSatz),
    kellerung_adj: T.fallback(kellerungAdj),
    gebaeude_form_gen: T.fallback(gebaeudeFormGen),
    renovierungsstatus_adj: T.fallback(renovierungsstatusAdj),
    renovierungsstatus_satz: T.fallback(renovierungsstatusSatz),
    zustand_kurz: T.fallback(zustandKurz),
    zustand_lang_deklin: T.fallback(zustandLangDeklin),
    ausstattungsgrad: T.fallback(ausstattungsgrad),
    standardstufe: T.fallback(standardstufe),

    // Bauart
    aussenwand_eg: T.fallback(aussenwandEg),
    aussenwand_ug: T.fallback(aussenwandUg),
    aussenwand_dicke_eg: T.fallback(aussenwandDickeEg),
    aussenwand_dicke_ug: T.fallback(aussenwandDickeUg),
    bauweise: T.fallback(bauweiseLang),
    innenwand: T.fallback(innenwandText),
    innenwand_zusatz: innenwandZusatz,
    decke: T.fallback(deckeText),
    decke_og: T.fallback(deckeOgText),
    dachform: T.fallback(dachform),
    dachstuhl_text: T.fallback(dachstuhlText),
    dacheindeckung: T.fallback(dacheindeckungText),
    fenster_text: T.fallback(fensterText),
    fenster_zusatz: fensterZusatz,
    fensterbank_aussen: T.fallback(fensterbankAussen),
    fensterbank_innen: T.fallback(fensterbankInnen),
    fassade: T.fallback(fassadeText),

    // Energetisch
    energie_aussenwand: T.fallback(energieAussenwand),
    energie_dach: T.fallback(energieDach),
    energie_kellerdecke: T.fallback(energieKellerdecke),
    kellerdecke_label: kellerdeckeLabel,
    liegenschaftskarte_quelle: liegenschaftskarteQuelle,

    // Heizung / Warmwasser
    heizung_art_text: T.fallback(heizungArtText),
    heizung_text: T.fallback(heizungText),
    heizung_artikel: heizungArtikel,
    heizung_baujahr: T.fallback(heizungBaujahr),
    heizung_zusatz: heizungZusatz,
    warmwasser_bereitstellung: T.fallback(warmwasserBereitstellung),
    solarthermie: T.fallback(solarthermieText),
    photovoltaik: T.fallback(photovoltaikText),
    aufzug: T.fallback(aufzugText),

    // Erschließung
    erschliessung_text: T.fallback(erschliessungText),

    // Sachverhalt-Einleitungen
    sachverhalt_einleitung: T.fallback(sachverhaltEinleitung),
    sachverhalt_zwischen: T.fallback(sachverhaltZwischen),
    gebaeude_kurzbeschreibung: T.fallback(gebaeudeKurzbeschreibung),

    // Außenanlagen
    aussenanlagen_eingang: aussenanlagenEingang,
    aussenanlagen_garten: aussenanlagenGarten,
    aussenanlagen_zustand: aussenanlagenZustand,

    // Funktion-Zusatz
    funktion_zusatz_geschosse: funktionZusatzGeschosse,
    funktion_zusatz_einheiten: funktionZusatzEinheiten,

    // Rohbau-Zusatz
    fundamente_zusatz: fundamenteZusatz,
    terrasse_balkon: terrasseBalkon,
    treppen_text: treppenText,
    regenrinne_text: regenrinneText,

    // Ausbau
    wandoberflaeche_wohnraeume: wandoberflaecheWohnraeume,
    wandoberflaeche_baeder: wandoberflaecheBaeder,
    wandoberflaeche_kuechen: wandoberflaecheKuechen,
    hauseingang_element: hauseingangElement,
    innentueren_text: innentuerenText,
    wohnungstueren_text: wohnungstuerenText,
    boden_baeder: bodenBaeder,
    boden_kuechen: bodenKuechen,
    boden_flur: bodenFlur,
    boden_wohnraeume: bodenWohnraeume,
    boden_eingang: bodenEingang,
    boden_treppenhaus: bodenTreppenhaus,
    boden_keller: bodenKeller,
    decken_oberflaeche: deckenOberflaeche,

    // Haustechnik-Zusatz
    schornstein_text: schornsteinText,
    sanitaer_text: sanitaerText,
    bad_ausstattung_text: badAusstattungText,
    elektro_text: elektroText,

    // Sektion 6
    bautechnik_einleitung: T.fallback(bautechnikEinleitung),
    decken_einschaetzung_text: T.fallback(deckenEinschaetzungText),
    standsicherheit_text: T.fallback(standsicherheitText),
    fundamente_einschaetzung_text: T.fallback(fundamenteEinschaetzungText),
    waermeschutz_text: T.fallback(waermeschutzText),
    tierbefall_text: T.fallback(tierbefallText),
    installation_text: T.fallback(installationText),

    // RND
    rnd_jahre: T.fallback(rndJahre),
    fiktives_alter: T.fallback(rndFiktivesAlter),
    rnd_gesamtnutzungsdauer: T.fallback(rndGesamtnutzungsdauer),
    rnd_punkte_fenster: String(pFenster),
    rnd_punkte_dach: String(pDach),
    rnd_punkte_leitungen: String(pLeitungen),
    rnd_punkte_heizung: String(pHeizung),
    rnd_punkte_fassade: String(pFassade),
    rnd_punkte_innenausbau: String(pInnenausbau),
    rnd_punkte_baeder: String(pBaeder),
    rnd_punkte_summe: String(punkteSumme),
    rnd_kategorie_text: T.fallback(rndKategorieText),
    modernisierungs_jahre: modernisierungsJahre,
    modernisierungs_massnahmen: modernisierungsMassnahmen,

    // Freitexte
    modernisierung_freitext: modernisierung,
    erweiterung,
    sanierungszustand,
    anmerkung,
    bauschaeden
  };
}

module.exports = { buildDocxContext };
