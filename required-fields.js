/**
 * Gemeinsame Felder-Definitionen + Fortschritts-Berechnung.
 *
 * Es gibt zwei getrennte Listen:
 *   - REQUIRED_FIELDS      → Kunden-Pflichtangaben (im Public-Link sichtbar)
 *   - EXPERT_FIELDS        → Gutachter-Angaben (nur im Admin-Modus, vom Sachverständigen
 *                            auszufüllende Bewertungen, Begehungs-Feststellungen,
 *                            bautechnische Details und Restnutzungsdauer-Daten)
 *
 * Wird sowohl serverseitig (Node) als auch im Browser (UMD) genutzt,
 * damit Übersicht, Formular und Server dieselbe Quelle für die Fortschritte haben.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.RequiredFields = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {

    // type: 'text' (Default) | 'radio' | 'select' | 'image'
    // ============================================================
    // KUNDEN-PFLICHTANGABEN — werden im öffentlichen Link gezeigt
    // ============================================================
    const REQUIRED_FIELDS = [
        // Auftraggeber
        { name: 'auftraggeber_anrede',      label: 'Anrede',                         section: 'auftraggeber', type: 'select' },
        { name: 'name',                     label: 'Name',                           section: 'auftraggeber' },
        { name: 'strasse',                  label: 'Straße (Auftraggeber)',          section: 'auftraggeber' },
        { name: 'hausnummer',               label: 'Hausnummer (Auftraggeber)',      section: 'auftraggeber' },
        { name: 'plz',                      label: 'PLZ (Auftraggeber)',             section: 'auftraggeber' },
        { name: 'ort',                      label: 'Ort (Auftraggeber)',             section: 'auftraggeber' },

        // Angaben zum Objekt
        { name: 'objekt_strasse',           label: 'Straße (Objekt)',                section: 'objekt' },
        { name: 'objekt_hausnummer',        label: 'Hausnummer (Objekt)',            section: 'objekt' },
        { name: 'objekt_plz',               label: 'PLZ (Objekt)',                   section: 'objekt' },
        { name: 'objekt_ort',               label: 'Ort (Objekt)',                   section: 'objekt' },
        { name: 'baujahr',                  label: 'Baujahr',                        section: 'objekt' },
        { name: 'wohneinheiten',            label: 'Anzahl Wohneinheiten',           section: 'objekt' },
        { name: 'vollgeschosse',            label: 'Vollgeschosse',                  section: 'objekt' },
        { name: 'nutzflaeche',              label: 'Nutzfläche',                     section: 'objekt' },
        { name: 'nutzung',                  label: 'Derzeitige Nutzung',             section: 'objekt', type: 'radio' },
        { name: 'stellplaetze_vorhanden',   label: 'Stellplätze (ja/nein)',          section: 'objekt', type: 'radio' },
        { name: 'grundstueck_flaeche',      label: 'Grundstücksfläche (m²)',         section: 'objekt' },
        { name: 'gebaeude_grundflaeche',    label: 'Gebäude-Grundfläche (m²)',       section: 'objekt' },
        { name: 'geschossigkeit',           label: 'Geschossigkeit',                 section: 'objekt' },
        { name: 'kellerung',                label: 'Kellerung',                      section: 'objekt', type: 'radio' },
        { name: 'spitzboden',               label: 'Spitzboden',                     section: 'objekt', type: 'radio' },
        { name: 'gebaeude_form',            label: 'Gebäudeform',                    section: 'objekt', type: 'radio' },
        { name: 'aufzug',                   label: 'Aufzug (ja/nein)',               section: 'objekt', type: 'radio' },

        // Haustechnik
        { name: 'heizung',                  label: 'Heizungsart (Verteilung)',       section: 'haustechnik', type: 'radio' },
        { name: 'heizung_art',              label: 'Heizung Energieträger',          section: 'haustechnik', type: 'radio' },
        { name: 'heizung_baujahr',          label: 'Baujahr Heizung',                section: 'haustechnik' },
        { name: 'warmwasser',               label: 'Warmwasser',                     section: 'haustechnik', type: 'radio' },
        { name: 'solarthermie',             label: 'Solarthermie (ja/nein)',         section: 'haustechnik', type: 'radio' },
        { name: 'photovoltaik',             label: 'Photovoltaik (ja/nein)',         section: 'haustechnik', type: 'radio' },

        // Bilder
        { name: 'hausansicht',              label: 'Bild Hausansicht',               section: 'bilder', type: 'image' },
        { name: 'grundriss',                label: 'Bild Grundriss',                 section: 'bilder', type: 'image' }
    ];

    // ============================================================
    // GUTACHTER-ANGABEN — nur im Admin-Modus
    // ============================================================
    const EXPERT_FIELDS = [
        // Gutachten-Metadaten (administrative Termine)
        { name: 'stichtag',                 label: 'Stichtag',                       section: 'metadaten' },
        { name: 'auftragsdatum',            label: 'Auftragsdatum',                  section: 'metadaten' },
        { name: 'ortsbesichtigungsdatum',   label: 'Ortsbesichtigung am',            section: 'metadaten' },

        // Liegenschaft (Grundbuch-Daten — Sachverständiger recherchiert über Geoindex)
        { name: 'flur',                     label: 'Flur',                           section: 'objekt' },
        { name: 'flurstueck',               label: 'Flurstücksnummer',               section: 'objekt' },
        { name: 'gemarkung',                label: 'Gemarkung',                      section: 'objekt' },
        { name: 'bundesland',               label: 'Bundesland',                     section: 'objekt', type: 'select' },

        // Bewertung des Objekts (Ermessen)
        { name: 'standardstufe',            label: 'Standardstufe (SW-RL)',          section: 'objekt', type: 'radio' },
        { name: 'ausstattungsgrad',         label: 'Ausstattungsgrad',               section: 'objekt', type: 'radio' },
        { name: 'renovierungsstatus',       label: 'Renovierungsstatus',             section: 'objekt', type: 'radio' },
        { name: 'zustand_gesamt',           label: 'Gesamtzustand',                  section: 'objekt', type: 'radio' },

        // Bauart (Kerndaten für Bewertung)
        { name: 'bauart_außenwand_eg',         label: 'Außenwände EG–DG',                section: 'bauart', type: 'radio' },
        { name: 'bauart_außenwand_ug',         label: 'Außenwände UG',                   section: 'bauart', type: 'radio' },
        { name: 'bauart_fassade_daemmung',     label: 'Fassade gedämmt',                 section: 'bauart', type: 'radio' },
        { name: 'bauart_fassade_putz',         label: 'Fassade — Putz',                  section: 'bauart', type: 'radio' },
        { name: 'bauart_fassade_verkleidung',  label: 'Fassade — Verkleidung',           section: 'bauart', type: 'radio' },
        { name: 'bauart_innenwand',            label: 'Innenwände',                      section: 'bauart', type: 'radio' },
        { name: 'bauart_decke',                label: 'Decken',                          section: 'bauart', type: 'radio' },
        { name: 'bauart_kellerdecke',          label: 'Kellerdecke gedämmt',             section: 'bauart', type: 'radio' },
        { name: 'bauart_dach',                 label: 'Dach / Spitzboden gedämmt',       section: 'bauart', type: 'radio' },
        { name: 'bauart_dacheindeckung',       label: 'Dacheindeckung',                  section: 'bauart', type: 'radio' },
        { name: 'bauart_fenster',              label: 'Fenster',                         section: 'bauart', type: 'radio' },
        { name: 'bauart_fenster_verglasung',   label: '2-fach-Verglasung',               section: 'bauart', type: 'radio' },
        { name: 'bauart_fensterbaenke_außen',  label: 'Fensterbänke außen',              section: 'bauart', type: 'radio' },
        { name: 'bauart_fensterbaenke_innen',  label: 'Fensterbänke innen',              section: 'bauart', type: 'radio' },
        { name: 'bauart_aussenwand_dicke_eg',  label: 'Außenwand-Stärke EG–DG',          section: 'bauart', type: 'radio' },
        { name: 'bauart_aussenwand_dicke_ug',  label: 'Außenwand-Stärke UG',             section: 'bauart', type: 'radio' },
        { name: 'bauart_decke_og',             label: 'Decke EG bis DG',                 section: 'bauart', type: 'radio' },
        { name: 'bauart_dachform',             label: 'Dachform',                        section: 'bauart', type: 'radio' },
        { name: 'bauart_dachstuhl',            label: 'Dachstuhl',                       section: 'bauart', type: 'radio' },

        // Sanierungszustand (Freitext essentiell für Restnutzungsdauer)
        { name: 'sanierungszustand',        label: 'Sanierungszustand (Beschreibung)', section: 'sanierungszustand' },

        // Erschließung (vom Sachverständigen vor Ort erfasst)
        { name: 'erschliessung_himmelsrichtung', label: 'Erschließung Himmelsrichtung', section: 'erschliessung', type: 'radio' },
        { name: 'erschliessung_fahrbahn_typ',    label: 'Erschließung Fahrbahn-Typ',    section: 'erschliessung' },

        // Außenanlagen (3 Freitext-Felder)
        { name: 'aussenanlagen_eingang',    label: 'Außenanlagen — Eingang',          section: 'aussenanlagen' },
        { name: 'aussenanlagen_garten',     label: 'Außenanlagen — Garten',           section: 'aussenanlagen' },
        { name: 'aussenanlagen_zustand',    label: 'Außenanlagen — Zustand',          section: 'aussenanlagen' },

        // Bautechnische Beurteilung
        { name: 'decken_einschaetzung',         label: 'Decken-Einschätzung',         section: 'bautechnik', type: 'radio' },
        { name: 'standsicherheit_einschaetzung', label: 'Standsicherheit',            section: 'bautechnik', type: 'radio' },
        { name: 'tierbefall',                   label: 'Tierbefall',                 section: 'bautechnik', type: 'radio' },

        // Restnutzungsdauer (Werte)
        { name: 'rnd_fiktives_alter',       label: 'Fiktives Alter (Jahre)',          section: 'rnd' },
        { name: 'rnd_jahre',                label: 'Restnutzungsdauer (Jahre)',       section: 'rnd' },
        { name: 'rnd_gesamtnutzungsdauer',  label: 'Gesamtnutzungsdauer (Jahre)',     section: 'rnd' }
    ];

    function nonEmptyString(v) {
        return typeof v === 'string' ? v.trim().length > 0 : false;
    }

    function radioFilled(data, name) {
        const v = data[name];
        if (Array.isArray(v)) return v.some(nonEmptyString);
        return nonEmptyString(v);
    }

    // Konditionale Kunden-Pflichtfelder (abhängig von bereits eingetragenen Werten).
    function getConditionalRequiredFields(data) {
        data = data || {};
        const out = [];
        const anrede = data.auftraggeber_anrede || '';
        if (anrede && anrede !== 'firma') {
            out.push({ name: 'vorname', label: 'Vorname', section: 'auftraggeber' });
        }
        if (data.stellplaetze_vorhanden === 'ja') {
            out.push({ name: 'stellplaetze_anzahl', label: 'Anzahl Stellplätze', section: 'objekt' });
        }
        if (data.aufzug === 'ja') {
            out.push({ name: 'aufzug_baujahr', label: 'Baujahr Aufzug', section: 'objekt' });
        }
        if (data.solarthermie === 'ja') {
            out.push({ name: 'solar_bj_1', label: 'Baujahr Solarthermie', section: 'haustechnik' });
        }
        if (data.photovoltaik === 'ja') {
            out.push({ name: 'pv_bj', label: 'Baujahr Photovoltaik', section: 'haustechnik' });
        }
        return out;
    }

    // Konditionale Gutachter-Pflichtfelder (aktuell keine — Platzhalter für künftige Erweiterungen).
    function getConditionalExpertFields(/* data */) {
        return [];
    }

    function getAllRequiredFields(data) {
        return REQUIRED_FIELDS.concat(getConditionalRequiredFields(data));
    }

    function getAllExpertFields(data) {
        return EXPERT_FIELDS.concat(getConditionalExpertFields(data));
    }

    // images: { hausansicht: meta|null, grundriss: meta|null }
    function isFieldFilled(field, data, images) {
        if (field.type === 'image') {
            const meta = images && images[field.name];
            return !!(meta && (meta.original_name || meta.size > 0));
        }
        if (field.type === 'radio') {
            return radioFilled(data || {}, field.name);
        }
        return nonEmptyString((data || {})[field.name]);
    }

    function computeProgressFor(fields, data, images) {
        const total = fields.length;
        const missing = fields.filter((f) => !isFieldFilled(f, data, images));
        const filled = total - missing.length;
        const percent = total === 0 ? 100 : Math.round((filled / total) * 100);
        return {
            total,
            filled,
            missing: missing.map((m) => ({
                name: m.name,
                label: m.label,
                section: m.section,
                type: m.type || null
            })),
            percent,
            isComplete: missing.length === 0
        };
    }

    function computeProgress(data, images) {
        return computeProgressFor(getAllRequiredFields(data), data, images);
    }

    function computeExpertProgress(data, images) {
        return computeProgressFor(getAllExpertFields(data), data, images);
    }

    return {
        REQUIRED_FIELDS: REQUIRED_FIELDS,
        EXPERT_FIELDS: EXPERT_FIELDS,
        getConditionalRequiredFields: getConditionalRequiredFields,
        getConditionalExpertFields: getConditionalExpertFields,
        getAllRequiredFields: getAllRequiredFields,
        getAllExpertFields: getAllExpertFields,
        isFieldFilled: isFieldFilled,
        computeProgress: computeProgress,
        computeExpertProgress: computeExpertProgress
    };
}));
