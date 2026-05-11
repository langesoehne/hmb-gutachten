#!/usr/bin/env python3
"""
Trimmt aus gutachten_template.docx die statischen "Anlage 1: Auszug Bilder"-Seiten.

Hintergrund: Das Template enthielt feste Bildplatzhalter fuer 12 Beispielbilder.
Diese werden zur Laufzeit dynamisch ueber den Server eingefuegt (zusammen mit
admin-eingegebenen Bildunterschriften), siehe server.js -> appendAnlageBilder.

Die unbenutzten Bildressourcen (rId8..rId19 / image7.jpeg..image18.jpeg) werden
ebenfalls aus dem ZIP entfernt, damit das Template kompakter wird.

Aufruf:
    python3 trim_anlage_section.py [--apply]

Ohne --apply: nur dry-run (Diff-Statistik ausgeben).
Mit --apply:  Backup anlegen und Template ueberschreiben.
"""

import argparse
import os
import re
import shutil
import sys
import zipfile
from datetime import datetime
from io import BytesIO

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_PATH = os.path.join(HERE, 'gutachten_template.docx')

ANLAGE_FOOTER_MARKER = (
    '<w:p><w:pPr><w:pStyle w:val="Footer"/>'
    '<w:spacing w:before="0" w:after="0"/>'
    '<w:rPr></w:rPr></w:pPr>'
    '<w:r><w:rPr></w:rPr>'
    '<w:t xml:space="preserve">Anlage </w:t>'
)

REMOVED_RIDS = [f'rId{n}' for n in range(8, 20)]
REMOVED_MEDIA = [f'word/media/image{n}.jpeg' for n in range(7, 19)]


def find_cut_region(xml: str):
    """Liefert (start, end) der zu entfernenden Bytes in document.xml.

    start = Beginn der Page-Break-<w:p>, die direkt vor "Anlage 1" steht
    end   = Anfang von <w:sectPr> am Body-Ende
    """
    anlage_idx = xml.find(ANLAGE_FOOTER_MARKER)
    if anlage_idx < 0:
        raise SystemExit('"Anlage 1"-Footer-Block nicht gefunden — Template eventuell schon getrimmt.')

    # Page-Break-Paragraph ist die letzte <w:p>...</w:p> direkt vor dem Anlage-Block.
    page_break_open = xml.rfind('<w:p>', 0, anlage_idx)
    if page_break_open < 0:
        raise SystemExit('Konnte Page-Break-Paragraph vor Anlage 1 nicht lokalisieren.')
    page_break_close_rel = xml.find('</w:p>', page_break_open)
    if page_break_close_rel < 0 or page_break_close_rel >= anlage_idx:
        raise SystemExit('Page-Break-Paragraph schliesst nicht vor dem Anlage-Block.')
    page_break_block = xml[page_break_open:page_break_close_rel + len('</w:p>')]
    if '<w:br w:type="page"/>' not in page_break_block:
        raise SystemExit('Erwarteter Page-Break im Vorgaenger-Paragraph fehlt.')

    sect_pr = xml.find('<w:sectPr>')
    if sect_pr < 0:
        raise SystemExit('<w:sectPr> nicht gefunden.')

    return page_break_open, sect_pr


def trim_document_xml(xml: str) -> str:
    start, end = find_cut_region(xml)
    return xml[:start] + xml[end:]


def trim_rels(rels_xml: str) -> str:
    out = rels_xml
    for rid in REMOVED_RIDS:
        pattern = re.compile(r'<Relationship Id="' + re.escape(rid) + r'"[^>]*/>', re.S)
        out = pattern.sub('', out)
    return out


def main():
    ap = argparse.ArgumentParser(description='Trim Anlage 1 image pages from template')
    ap.add_argument('--apply', action='store_true', help='Schreibt Aenderungen tatsaechlich (sonst nur dry-run)')
    args = ap.parse_args()

    if not os.path.exists(TEMPLATE_PATH):
        sys.exit(f'Template nicht gefunden: {TEMPLATE_PATH}')

    with zipfile.ZipFile(TEMPLATE_PATH) as zin:
        names = zin.namelist()
        doc_xml = zin.read('word/document.xml').decode('utf-8')
        rels_xml = zin.read('word/_rels/document.xml.rels').decode('utf-8')

    new_doc = trim_document_xml(doc_xml)
    new_rels = trim_rels(rels_xml)
    media_to_drop = set(REMOVED_MEDIA) & set(names)
    rels_actually_removed = sum(1 for rid in REMOVED_RIDS if rid in rels_xml and rid not in new_rels)

    print(f'Template: {TEMPLATE_PATH}')
    print(f'document.xml: {len(doc_xml):,} -> {len(new_doc):,} bytes (-{len(doc_xml) - len(new_doc):,})')
    print(f'document.xml.rels: {rels_actually_removed} Image-Beziehungen werden entfernt')
    print(f'Media-Dateien werden entfernt: {len(media_to_drop)} ({sorted(media_to_drop)})')

    if not args.apply:
        print('\nDry-run beendet. Mit --apply ausfuehren, um Aenderungen zu schreiben.')
        return

    # Backup
    backup = TEMPLATE_PATH + '.backup-' + datetime.now().strftime('%Y%m%d-%H%M%S') + '.docx'
    shutil.copy2(TEMPLATE_PATH, backup)
    print(f'Backup: {backup}')

    # Neue ZIP-Datei in-memory schreiben, dann atomic replace
    buf = BytesIO()
    with zipfile.ZipFile(TEMPLATE_PATH) as zin, zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zout:
        for info in zin.infolist():
            if info.filename in media_to_drop:
                continue
            data = zin.read(info.filename)
            if info.filename == 'word/document.xml':
                data = new_doc.encode('utf-8')
            elif info.filename == 'word/_rels/document.xml.rels':
                data = new_rels.encode('utf-8')
            new_info = zipfile.ZipInfo(info.filename, date_time=info.date_time)
            new_info.compress_type = info.compress_type
            zout.writestr(new_info, data)

    tmp_path = TEMPLATE_PATH + '.tmp'
    with open(tmp_path, 'wb') as f:
        f.write(buf.getvalue())
    os.replace(tmp_path, TEMPLATE_PATH)
    print(f'Template ueberschrieben: {TEMPLATE_PATH}')


if __name__ == '__main__':
    main()
