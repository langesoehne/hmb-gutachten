#!/usr/bin/env python3
"""
Transformiert das gutachten_template.docx so, dass alle TEXT-Marker und
fallspezifischen Hardcodings durch Platzhalter ersetzt werden.

Strategie:
- Per ElementTree XML parsen, per Paragraph + Run iterieren
- Für jedes Replacement: Paragraph anhand seiner kompletten Text-Signatur
  identifizieren, dann gezielt einzelne <w:t>-Inhalte modifizieren
- Das ist robust gegenüber Word's Run-Splitting

Die Liste TARGETS unten beschreibt für jede Stelle:
  signature: Liste von Strings, die in dieser Reihenfolge als die w:t-Inhalte
             des Ziel-Paragraphs erwartet werden (oder Teilstrings)
  patches:   Mapping {w:t-Index: neuer Inhalt}
"""
import re
import sys
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

TEMPLATE_PATH = Path(__file__).parent / "gutachten_template.docx"
OUTPUT_PATH = TEMPLATE_PATH

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

# Register all relevant namespaces from the original document.xml so the output
# preserves them in the same form.
NAMESPACES = {
    "w":   "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "r":   "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "wp":  "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    "a":   "http://schemas.openxmlformats.org/drawingml/2006/main",
    "pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
}
for prefix, uri in NAMESPACES.items():
    ET.register_namespace(prefix if prefix != "w" else "w", uri)


def get_w_t_elements(paragraph):
    """Returns list of <w:t> elements in document order (across all runs)."""
    return [t for t in paragraph.iter(W + "t")]


def get_paragraph_signature(paragraph):
    """Returns concat string of all <w:t> in this paragraph."""
    return "".join((t.text or "") for t in get_w_t_elements(paragraph))


# =============================================================================
# Targets: Each entry describes one paragraph patch.
# 'match' = unique substring that identifies the paragraph (compared against signature)
# 'patches' = list of (regex_pattern_for_individual_w_t, replacement_for_w_t)
#             OR list of (index, exact_old, new) tuples for safe per-element edits
# =============================================================================

TARGETS = [
    # =========================================================================
    # Sektion 3 — Sachverhalt (3 standalone TEXT in eigenen Paragraphen)
    # =========================================================================
    {
        "name": "P82 Sachverhalt-Einleitung",
        "match_signature_exact": "TEXT",
        "match_after_signature": "Gegenstand dieses Gutachtens ist das",
        "single_text_replacement": "{sachverhalt_einleitung}",
    },
    {
        "name": "P87 Sachverhalt-Zwischen",
        "match_signature_exact": "TEXT",
        "match_after_signature": "Nach Angaben der Eigentümer wurde das Gebäude",
        "single_text_replacement": "{sachverhalt_zwischen}",
    },

    # =========================================================================
    # Z.119 Erschliessung
    # =========================================================================
    {
        "name": "P119 Erschliessung",
        "match_signature_exact": "TEXT",
        "match_after_signature": "5.Feststellungen vor Ort",
        "single_text_replacement": "{erschliessung_text}",
    },

    # =========================================================================
    # Z.128 Gebäude-Kurzbeschreibung
    # =========================================================================
    {
        "name": "P128 Gebäude-Kurzbeschreibung",
        "match_signature_exact": "TEXT",
        "match_before_signature": "Bild 3",
        "single_text_replacement": "{gebaeude_kurzbeschreibung}",
    },

    # =========================================================================
    # Z.130 hardcoded Zustand-Satz
    # =========================================================================
    {
        "name": "P130 Zustand-Satz",
        "match_substring": "Der bauliche und technische Zustand des",
        "text_replace": [
            (
                "Der bauliche und technische Zustand des {baujahr} errichteten und teilweise renovierten {gebaeude_typ_gen} ist, soweit anhand einer Begehung feststellbar, als dem Alter entsprechend zu bezeichnen. Das Bauwerk entspricht dem ursprünglichen Zustand.",
                "Der bauliche und technische Zustand des {baujahr} errichteten und {renovierungsstatus_adj} {gebaeude_typ_gen} ist, soweit anhand einer Begehung feststellbar, als {zustand_kurz} zu bezeichnen.",
            ),
        ],
    },

    # =========================================================================
    # Z.132 Ausstattungsgrad-Satz
    # =========================================================================
    {
        "name": "P132 Ausstattungsgrad",
        "match_substring": "Der Ausstattungsgrad des unterkellerten",
        "text_replace": [
            ("unterkellerten, in {bauweise} errichteten Gebäudes mit TEXT (Dachform)",
             "{kellerung_adj}, in {bauweise} errichteten {gebaeude_form_gen} mit {dachform}"),
            ("ist überwiegend einfache Art (im Mittel Stufe TEXT ({gebaeude_typ})",
             "ist {ausstattungsgrad} (im Mittel Stufe {standardstufe} ({gebaeude_typ})"),
        ],
    },

    # =========================================================================
    # Z.149 Schluss-Zustand
    # =========================================================================
    {
        "name": "P149 Schluss-Zustand",
        "match_substring": "Ansonsten erfolgten im Wesentlichen",
        "text_replace": [
            ("Das Objekt befindet sich in einem gepflegten Zustand.",
             "Das Objekt befindet sich in einem {zustand_lang_deklin} Zustand."),
        ],
    },

    # =========================================================================
    # Z.170/177/182 Außenanlagen
    # =========================================================================
    {
        "name": "P170 Außenanlagen-Eingang",
        "match_signature_exact": "TEXT",
        "match_before_signature": "Eingang",
        "match_after_signature": "Garten / Hof",
        "single_text_replacement": "{aussenanlagen_eingang}",
    },
    {
        "name": "P177 Außenanlagen-Garten",
        "match_signature_exact": "TEXT",
        "match_before_signature": "Garten / Hof",
        "match_after_signature": "Zustand",
        "single_text_replacement": "{aussenanlagen_garten}",
    },
    {
        "name": "P182 Außenanlagen-Zustand",
        "match_signature_exact": "TEXT",
        "match_before_signature": "Garten / Hof",
        "match_after_signature": "Funktion",
        "single_text_replacement": "{aussenanlagen_zustand}",
    },

    # =========================================================================
    # Z.188/190 Funktion-Zusatz
    # =========================================================================
    {
        "name": "P188 Funktion-Geschosse",
        "match_substring": "Das Gebäude stammt aus dem Jahr {baujahr} und verfügt über",
        "text_replace": [
            ("Vollgeschosse. TEXT", "Vollgeschosse. {funktion_zusatz_geschosse}"),
        ],
    },
    {
        "name": "P190 Funktion-Einheiten",
        "match_substring": "umfasst insgesamt {wohneinheiten} Wohneinheiten",
        "text_replace": [
            ("Wohneinheiten. TEXT", "Wohneinheiten. {funktion_zusatz_einheiten}"),
        ],
    },

    # =========================================================================
    # Z.194 Fundamente
    # =========================================================================
    {
        "name": "P194 Fundamente",
        "match_substring": "Die Fundamente werden als baujahrestypisch eingeschätzt",
        "text_replace": [
            ("baujahrestypisch eingeschätzt. TEXT",
             "baujahrestypisch eingeschätzt. {fundamente_zusatz}"),
        ],
    },

    # =========================================================================
    # Z.197/198 Außenwand-Stärken (Run-übergreifend)
    # =========================================================================
    {
        "name": "P197 Außenwand UG",
        "match_signature_contains": ["UG:", "{aussenwand_ug}, TEXT"],
        "patches_indexed": [
            (1, "{aussenwand_ug}, TEXT", "{aussenwand_ug}, {aussenwand_dicke_ug}"),
        ],
    },
    {
        "name": "P198 Außenwand EG bis DG",
        "match_signature_contains": ["EG bis DG:", "{aussenwand_eg}, TEXT"],
        "patches_indexed": [
            (1, "{aussenwand_eg}, TEXT", "{aussenwand_eg}, {aussenwand_dicke_eg}"),
        ],
    },

    # =========================================================================
    # Z.201/202 Innenwand-Stärken
    # =========================================================================
    {
        "name": "P201 Innenwand UG",
        "match_signature_contains": ["UG:", "{innenwand}, TEXT"],
        "patches_indexed": [
            (1, "{innenwand}, TEXT", "{innenwand}, {aussenwand_dicke_ug}"),
        ],
    },
    {
        "name": "P202 Innenwand EG bis DG",
        "match_signature_contains": ["EG bis DG:", "{innenwand}, TEXT"],
        "patches_indexed": [
            (1, "{innenwand}, TEXT", "{innenwand}, {aussenwand_dicke_eg}{innenwand_zusatz}"),
        ],
    },

    # =========================================================================
    # Z.207 Decke über EG bis DG
    # =========================================================================
    {
        "name": "P207 Decke EG/DG",
        "match_signature_contains": ["Decke über EG bis DG:", "TEXT"],
        "patches_indexed": [
            (1, "TEXT", "{decke_og}"),
        ],
    },

    # =========================================================================
    # Z.209 Terrasse / Balkon (standalone TEXT)
    # =========================================================================
    {
        "name": "P209 Terrasse/Balkon",
        "match_signature_exact": "TEXT",
        "match_before_signature": "Decke über EG bis DG:",
        "match_after_signature": "Treppen:",
        "single_text_replacement": "{terrasse_balkon}",
    },

    # =========================================================================
    # Z.218 Treppen (standalone TEXT)
    # =========================================================================
    {
        "name": "P218 Treppen",
        "match_signature_exact": "TEXT",
        "match_before_signature": "Treppen:",
        "match_after_signature": "Dachkonstruktion / Eindeckung",
        "single_text_replacement": "{treppen_text}",
    },

    # =========================================================================
    # Z.221 Dachstuhl
    # =========================================================================
    {
        "name": "P221 Dachstuhl",
        "match_signature_contains": ["Dachstuhl:", "TEXT"],
        "patches_indexed": [
            (1, "TEXT", "{dachstuhl_text}"),
        ],
    },

    # =========================================================================
    # Z.228 Regenrinne (standalone TEXT)
    # =========================================================================
    {
        "name": "P228 Regenrinne",
        "match_signature_exact": "TEXT",
        "match_before_signature": "Regenrinne und Fallrohr",
        "match_after_signature": "Ausbau",
        "single_text_replacement": "{regenrinne_text}",
    },

    # =========================================================================
    # Z.234/235/236 Wandoberflächen
    # =========================================================================
    {
        "name": "P234 Wandoberfläche Wohnräume",
        "match_signature_contains": ["Wohnräume:", "TEXT"],
        "match_before_signature": "Wandoberflächen:",
        "match_after_signature": "Bäder:",
        "patches_indexed": [
            (1, "TEXT", "{wandoberflaeche_wohnraeume}"),
        ],
    },
    {
        "name": "P235 Wandoberfläche Bäder",
        "match_signature_contains": ["Bäder:", "TEXT"],
        "match_before_signature": "Wohnräume:",
        "match_after_signature": "Küchen:",
        "patches_indexed": [
            (1, "TEXT", "{wandoberflaeche_baeder}"),
        ],
    },
    {
        "name": "P236 Wandoberfläche Küchen",
        "match_signature_contains": ["Küchen:", "TEXT"],
        "match_before_signature": "Bäder:",
        "match_after_signature": "Fenster / Glas",
        "patches_indexed": [
            (1, "TEXT", "{wandoberflaeche_kuechen}"),
        ],
    },

    # =========================================================================
    # Z.239 Fenster Zusatz
    # =========================================================================
    {
        "name": "P239 Fenster Zusatz",
        "match_signature_contains": ["Wohnung:", "{fenster_text}, TEXT"],
        "patches_indexed": [
            (1, "{fenster_text}, TEXT", "{fenster_text}, {fenster_zusatz}"),
        ],
    },

    # =========================================================================
    # Z.245 Hauseingang Eingangselement
    # =========================================================================
    {
        "name": "P245 Hauseingang",
        "match_substring": "Eingangselement: TEXT",
        "text_replace": [
            ("Eingangselement: TEXT", "Eingangselement: {hauseingang_element}"),
        ],
    },

    # =========================================================================
    # Z.248 Innentüren + Wohnungstüren
    # =========================================================================
    {
        "name": "P248 Innen+Wohnungstüren",
        "match_signature_contains": ["Innentüren:", "TEXT", "Wohnungstüren:", "TEXT"],
        "patches_indexed": [
            (1, "TEXT", "{innentueren_text}    "),
            (3, "TEXT", "{wohnungstueren_text}"),
        ],
    },

    # =========================================================================
    # Z.251-256 Bodenbeläge
    # =========================================================================
    {
        "name": "P251 Boden Bäder",
        "match_signature_contains": ["in Bädern:", "TEXT"],
        "patches_indexed": [
            (1, "TEXT", "{boden_baeder}"),
        ],
    },
    {
        "name": "P252 Boden Küchen+Flur",
        "match_signature_contains": ["in Küchen:", "TEXT", "Flur:", "TEXT"],
        "patches_indexed": [
            (1, "TEXT", "{boden_kuechen}    "),
            (3, "TEXT", "{boden_flur}"),
        ],
    },
    {
        "name": "P253 Boden Wohnräume",
        "match_signature_contains": ["Wohnräume:", "TEXT"],
        "match_before_signature": "in Küchen:",
        "match_after_signature": "Eingang:",
        "patches_indexed": [
            (1, "TEXT", "{boden_wohnraeume}"),
        ],
    },
    {
        "name": "P254 Boden Eingang",
        "match_signature_contains": ["Eingang:", "TEXT"],
        "patches_indexed": [
            (1, "TEXT", "{boden_eingang}"),
        ],
    },
    {
        "name": "P255 Boden Treppenhaus",
        "match_signature_contains": ["Treppenhaus:", "TEXT"],
        "patches_indexed": [
            (1, "TEXT", "{boden_treppenhaus}"),
        ],
    },
    {
        "name": "P256 Boden Keller",
        "match_signature_contains": ["Keller:", "TEXT"],
        "patches_indexed": [
            (1, "TEXT", "{boden_keller}"),
        ],
    },

    # =========================================================================
    # Z.259 Deckenoberflächen (standalone TEXT)
    # =========================================================================
    {
        "name": "P259 Deckenoberflächen",
        "match_signature_exact": "TEXT",
        "match_before_signature": "Deckenoberflächen:",
        "match_after_signature": "Haustechnik:",
        "single_text_replacement": "{decken_oberflaeche}",
    },

    # =========================================================================
    # Z.263 Heizung Genus + Zusatz
    # =========================================================================
    {
        "name": "P263 Heizung",
        "match_substring": "Das Gebäude wird über eine {heizung_text}",
        "text_replace": [
            ("Das Gebäude wird über eine {heizung_text} (Baujahr {heizung_baujahr}) beheizt. TEXT",
             "Das Gebäude wird über {heizung_artikel} {heizung_text} (Baujahr {heizung_baujahr}) beheizt. {heizung_zusatz}"),
        ],
    },

    # =========================================================================
    # Z.267 Schornstein
    # =========================================================================
    {
        "name": "P267 Schornstein",
        "match_signature_exact": "TEXT",
        "match_before_signature": "Schornstein:",
        "match_after_signature": "Sanitärinstallation:",
        "single_text_replacement": "{schornstein_text}",
    },

    # =========================================================================
    # Z.270 Sanitärinstallation
    # =========================================================================
    {
        "name": "P270 Sanitärinstallation",
        "match_signature_exact": "TEXT",
        "match_before_signature": "Sanitärinstallation:",
        "match_after_signature": "Badausstattung:",
        "single_text_replacement": "{sanitaer_text}",
    },

    # =========================================================================
    # Z.273 Badausstattung
    # =========================================================================
    {
        "name": "P273 Badausstattung",
        "match_signature_exact": "TEXT",
        "match_before_signature": "Badausstattung:",
        "single_text_replacement": "{bad_ausstattung_text}",
    },

    # =========================================================================
    # Z.296 Bautechnik-Einleitung
    # =========================================================================
    {
        "name": "P296 Bautechnik-Einleitung",
        "match_substring": "Das {gebaeude_typ} wurde {baujahr} als TEXT in baujahrestypischer",
        "text_replace": [
            ("Das {gebaeude_typ} wurde {baujahr} als TEXT in baujahrestypischer {bauweise} gebaut.",
             "Das {gebaeude_typ} wurde {baujahr} als {bautechnik_einleitung} in baujahrestypischer {bauweise} gebaut."),
        ],
    },

    # =========================================================================
    # Z.298 Decken-Bewertung
    # =========================================================================
    {
        "name": "P298 Decken-Bewertung",
        "match_substring": "Die Decken sind verhältnismäßig dünn",
        "text_replace": [
            ("Die Decken sind verhältnismäßig dünn ausgebildet. Soweit einschätzbar erfüllen sie nicht die heutigen Brand- und Schallschutzanforderungen. Die Wände sind in üblichen Bauteilstärken ausgeführt. ",
             "{decken_einschaetzung_text} "),
        ],
    },

    # =========================================================================
    # Z.300 Standsicherheit
    # =========================================================================
    {
        "name": "P300 Standsicherheit",
        "match_substring": "Die Gebäude erscheinen insgesamt ausreichend standsicher",
        "text_replace": [
            ("Die Gebäude erscheinen insgesamt ausreichend standsicher.",
             "{standsicherheit_text}"),
        ],
    },

    # =========================================================================
    # Z.302 Fundamente-Einschätzung
    # =========================================================================
    {
        "name": "P302 Fundamente-Einschätzung",
        "match_substring": "Die Fundamente und der Keller sind massiv ausgebildet",
        "text_replace": [
            ("Die Fundamente und der Keller sind massiv ausgebildet und, soweit ersichtlich, ausreichend standsicher. Der Keller ist weder gedämmt noch abgedichtet.",
             "{fundamente_einschaetzung_text}"),
        ],
    },

    # =========================================================================
    # Z.304 Wärmeschutz-Block
    # =========================================================================
    {
        "name": "P304 Wärmeschutz",
        "match_substring": "Weder der Keller noch das Dach sind zusätzlich gedämmt",
        "text_replace": [
            ("Weder der Keller noch das Dach sind zusätzlich gedämmt. Die {fenster_typ} sind 2-fach verglast ohne weitere Anforderungen. Gemäß dem Gebäudebaujahr wurde an das Gebäude keine Wärmeschutzanforderungen gestellt. Dementsprechend schlecht stellt sich der Wärmeschutz im Verhältnis zu den aktuellen Wärmeschutzanforderungen dar. ",
             "{waermeschutz_text} "),
        ],
    },

    # =========================================================================
    # Z.307 Tierbefall
    # =========================================================================
    {
        "name": "P307 Tierbefall",
        "match_substring": "Tierbefall von Bauteilen: Tierbefall wurde nicht festgestellt",
        "text_replace": [
            ("Tierbefall von Bauteilen: Tierbefall wurde nicht festgestellt",
             "{tierbefall_text}"),
        ],
    },

    # =========================================================================
    # Z.310 Installation-Einschätzung
    # =========================================================================
    {
        "name": "P310 Installation",
        "match_substring": "Ebenfalls sind die Sanitär- und Elektroinstallationen seit den",
        "text_replace": [
            ("Ebenfalls sind die Sanitär- und Elektroinstallationen seit den Modernisierungsmaßnahmen in die Jahre gekommen und entsprechen nicht den heutigen Anforderungen.",
             "{installation_text}"),
        ],
    },

    # =========================================================================
    # Z.316 Bewertungsobjekt-Modernisierung
    # =========================================================================
    {
        "name": "P316 Bewertungsobjekt-Modernisierung",
        "match_substring": "Es wurde TEXT teilweise renoviert und modernisiert",
        "text_replace": [
            ("Es wurde TEXT teilweise renoviert und modernisiert.",
             "Es wurde {modernisierungs_jahre} {renovierungsstatus_satz}."),
        ],
    },

    # =========================================================================
    # Z.318 Standardstufe + Gesamtnutzungsdauer
    # =========================================================================
    {
        "name": "P318 Standardstufe",
        "match_substring": "Bei einer gewöhnlichen Gesamtnutzungsdauer von TEXT Jahren",
        "text_replace": [
            ("Bei einer gewöhnlichen Gesamtnutzungsdauer von TEXT Jahren für das {gebaeude_typ} (hier Standardstufe TEXT nach SW-RL)",
             "Bei einer gewöhnlichen Gesamtnutzungsdauer von {rnd_gesamtnutzungsdauer} Jahren für das {gebaeude_typ} (hier Standardstufe {standardstufe} nach SW-RL)"),
        ],
    },

    # =========================================================================
    # Z.322 Modernisierungsmaßnahmen-Tabelle (standalone TEXT)
    # =========================================================================
    {
        "name": "P322 Modernisierungsmaßnahmen",
        "match_signature_exact": "TEXT",
        "match_before_signature": "Folgende Modernisierungsmaßnahmen wurden durchgeführt",
        "single_text_replacement": "{modernisierungs_massnahmen}",
    },

    # =========================================================================
    # Bild 1 Caption: Hauptansicht
    # =========================================================================
    {
        "name": "P76 Bild1-Caption",
        "match_signature_exact": "Bild 1",
        "single_text_replacement": "Bild 1: {bild1_caption}",
    },

    # =========================================================================
    # Bild 2 Caption: Liegenschaftskarte-Quelle (Bundesland-spezifisch)
    # =========================================================================
    {
        "name": "P109 Liegenschaftskarte-Caption",
        "match_substring": "Bild 2: Auszug aus der Liegenschaftskarte",
        "text_replace": [
            ("Bild 2: Auszug aus der Liegenschaftskarte",
             "Bild 2: Auszug aus der Liegenschaftskarte{liegenschaftskarte_quelle}"),
        ],
    },

    # =========================================================================
    # Bild 3 Caption: Gebäudeansicht
    # =========================================================================
    {
        "name": "P126 Bild3-Caption",
        "match_signature_exact": "Bild 3",
        "single_text_replacement": "Bild 3: {bild3_caption}",
    },

    # =========================================================================
    # Bild 4 Caption: Grundriss-Spezifizierung
    # =========================================================================
    {
        "name": "P152 Bild4-Caption",
        "match_signature_exact": "Bild 4: Grundriss",
        "single_text_replacement": "Bild 4: {bild4_caption}",
    },

    # =========================================================================
    # Energetischer Zustand: Kellerdecke-Zeile dynamisch (Kellerdecke / Bodenplatte)
    # =========================================================================
    {
        "name": "P142 Kellerdecke-Label",
        "match_signature_contains": ["- Kellerdecke: ", "{energie_kellerdecke}"],
        "patches_indexed": [
            (0, "- Kellerdecke: ", "- {kellerdecke_label}: "),
        ],
    },

    # =========================================================================
    # P387 Schluss-Datumzeile: "München" konfigurierbar machen
    # =========================================================================
    {
        "name": "P387 Schluss-Ort",
        "match_substring": "Der Sachverständige München, den {erstellungsdatum}",
        "text_replace": [
            ("Der Sachverständige München, den {erstellungsdatum}",
             "Der Sachverständige {sachverstaendiger_ort}, den {erstellungsdatum}"),
        ],
    },

    # =========================================================================
    # Z.374 RND-Schlussatz
    # =========================================================================
    {
        "name": "P374 RND-Schlussatz",
        "match_substring": "Die taxierte Restnutzungsdauer des Gebäudes",
        "text_replace": [
            ("verlängert sich entsprechend der erreichten Punktzahl und einem angesetzten Alter von {fiktives_alter} Jahren auf {rnd_jahre} Jahre für das {gebaeude_typ}.",
             "verlängert sich entsprechend der erreichten Punktzahl (={rnd_kategorie_text}) und einem angesetzten Alter von {fiktives_alter} Jahren um {rnd_punkte_summe} Jahre auf {rnd_jahre} Jahre für das {gebaeude_typ}."),
        ],
    },
]


def find_paragraphs_with_signature(root, target):
    """Find paragraphs that match the target's matching criteria.

    Returns list of (paragraph_index_global, paragraph_element).
    """
    all_paragraphs = list(root.iter(W + "p"))
    candidates = []

    sig_exact = target.get("match_signature_exact")
    sig_substring = target.get("match_substring")
    sig_contains_seq = target.get("match_signature_contains")
    before_sig = target.get("match_before_signature")
    after_sig = target.get("match_after_signature")

    for i, p in enumerate(all_paragraphs):
        sig = get_paragraph_signature(p)

        if sig_exact is not None and sig != sig_exact:
            continue
        if sig_substring is not None and sig_substring not in sig:
            continue
        if sig_contains_seq is not None:
            wts = get_w_t_elements(p)
            if len(wts) < len(sig_contains_seq):
                continue
            wts_text = [t.text or "" for t in wts]
            if wts_text != sig_contains_seq:
                continue

        # Optional surrounding-context filters
        if before_sig is not None:
            window = " ".join(get_paragraph_signature(q) for q in all_paragraphs[max(0, i-10):i])
            if before_sig not in window:
                continue
        if after_sig is not None:
            window = " ".join(get_paragraph_signature(q) for q in all_paragraphs[i+1:i+11])
            if after_sig not in window:
                continue

        candidates.append((i, p))

    return candidates


def apply_target(root, target):
    """Apply one transformation target to the document tree."""
    candidates = find_paragraphs_with_signature(root, target)

    if not candidates:
        return False, "no candidate found"
    if len(candidates) > 1:
        return False, f"multiple candidates: {len(candidates)}"

    p_index, p = candidates[0]
    wts = get_w_t_elements(p)

    # Apply patches
    if "single_text_replacement" in target:
        # Only one <w:t> expected; replace its text
        if len(wts) != 1:
            return False, f"expected 1 w:t but got {len(wts)}"
        wts[0].text = target["single_text_replacement"]
        return True, f"single replacement at p{p_index}"

    if "text_replace" in target:
        # Find which w:t contains the old string and replace inline
        applied = []
        for old, new in target["text_replace"]:
            replaced_here = False
            for t in wts:
                if t.text and old in t.text:
                    t.text = t.text.replace(old, new, 1)
                    replaced_here = True
                    applied.append(old[:40])
                    break
            if not replaced_here:
                # Try cross-w:t replacement: collect all w:t's combined text and
                # check if pattern spans them. For now just report failure.
                return False, f"text_replace pattern not found: {old[:60]}"
        return True, f"text_replace ({len(applied)} patches) at p{p_index}"

    if "patches_indexed" in target:
        for idx, expected_old, new in target["patches_indexed"]:
            if idx >= len(wts):
                return False, f"index {idx} out of range (have {len(wts)} w:t)"
            if wts[idx].text != expected_old:
                return False, f"w:t[{idx}] text mismatch: got {wts[idx].text!r}, expected {expected_old!r}"
            wts[idx].text = new
        return True, f"indexed patches at p{p_index}"

    return False, "no patch action specified"


def main():
    if not TEMPLATE_PATH.exists():
        print(f"FEHLER: Template nicht gefunden: {TEMPLATE_PATH}", file=sys.stderr)
        sys.exit(1)

    print(f"Lade: {TEMPLATE_PATH}")
    with zipfile.ZipFile(TEMPLATE_PATH, "r") as zf:
        files = {name: zf.read(name) for name in zf.namelist()}

    document_xml_bytes = files["word/document.xml"]
    root = ET.fromstring(document_xml_bytes)

    success_count = 0
    failures = []

    for target in TARGETS:
        ok, msg = apply_target(root, target)
        status = "✓" if ok else "✗"
        print(f"  {status} {target['name']}: {msg}")
        if ok:
            success_count += 1
        else:
            failures.append(target['name'])

    print(f"\nErfolg: {success_count}/{len(TARGETS)}")
    if failures:
        print(f"Fehlgeschlagen:")
        for f in failures:
            print(f"  - {f}")

    # =========================================================================
    # RND-Punkte-Tabelle: hardcoded "0"-Zellen durch Platzhalter ersetzen
    # =========================================================================
    rnd_punkte_keys = [
        "{rnd_punkte_fenster}",
        "{rnd_punkte_dach}",
        "{rnd_punkte_leitungen}",
        "{rnd_punkte_heizung}",
        "{rnd_punkte_fassade}",
        "{rnd_punkte_innenausbau}",
        "{rnd_punkte_baeder}",
        "{rnd_punkte_summe}",
    ]

    # Find the table with "Modernisierung / Punkte maximal / Ansatz" header
    target_table = None
    for tbl in root.iter(W + "tbl"):
        rows = list(tbl.iter(W + "tr"))
        if not rows:
            continue
        first_cells = [
            "".join((t.text or "") for t in cell.iter(W + "t")).strip()
            for cell in rows[0].iter(W + "tc")
        ]
        if "Modernisierung" in first_cells and "Punkte maximal" in first_cells:
            target_table = tbl
            break

    if target_table is not None:
        rows = list(target_table.iter(W + "tr"))
        # Skip header row, then rows 1..7 = punkte-zeilen, row 8 = summe
        applied_punkte = 0
        for row_idx, row in enumerate(rows[1:9]):
            cells = list(row.iter(W + "tc"))
            # Find the cell with "0" content (Ansatz-Spalte)
            target_cell = None
            for cell in cells:
                cell_text = "".join((t.text or "") for t in cell.iter(W + "t")).strip()
                if cell_text == "0":
                    target_cell = cell
                    break
            if target_cell is None:
                print(f"  ✗ RND-Tabelle Zeile {row_idx+1}: kein '0'-Zell gefunden")
                continue
            # Replace the "0" text with the placeholder
            for t in target_cell.iter(W + "t"):
                if (t.text or "").strip() == "0":
                    t.text = rnd_punkte_keys[row_idx]
                    applied_punkte += 1
                    break
        print(f"  ✓ RND-Punkte-Tabelle: {applied_punkte}/{len(rnd_punkte_keys)} Zellen gepatcht")
    else:
        print(f"  ✗ RND-Punkte-Tabelle nicht gefunden")

    # Serialize XML back
    new_xml = ET.tostring(root, encoding="utf-8", xml_declaration=True, default_namespace=None)
    files["word/document.xml"] = new_xml

    # Update footers (years) — handle both single-run "© 2019" and split-run "© 20" + "19"
    for footer_name in ["word/footer1.xml", "word/footer2.xml", "word/footer3.xml"]:
        if footer_name not in files:
            continue
        footer_xml = files[footer_name].decode("utf-8")
        # Case 1: single-run "© 20XX"
        new_footer = re.sub(r'© 20\d\d Benedikt Hackl', '© 2026 Benedikt Hackl', footer_xml)
        # Case 2: split-run "© 20" + "<two digits>" — replace the two-digit run that follows "© 20"
        # Pattern: <w:t>© 20</w:t></w:r>...<w:t>NN</w:t>  (NN = two digits)
        # We replace the "NN" part with "26".
        new_footer = re.sub(
            r'(<w:t[^>]*>© 20</w:t>\s*</w:r>\s*<w:r[^>]*>(?:<w:rPr[^>]*>(?:[^<]|<[^/]|</[^w]|</w[^:]|</w:[^r])*</w:rPr>)?\s*<w:t[^>]*>)\d\d(</w:t>)',
            r'\g<1>26\g<2>',
            new_footer
        )
        if new_footer != footer_xml:
            print(f"  ✓ Footer aktualisiert: {footer_name}")
        files[footer_name] = new_footer.encode("utf-8")

    # Write back
    with zipfile.ZipFile(OUTPUT_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, data in files.items():
            zf.writestr(name, data)

    print(f"\n✓ Template aktualisiert: {OUTPUT_PATH}")
    print(f"  Größe: {OUTPUT_PATH.stat().st_size} Bytes")


if __name__ == "__main__":
    main()
