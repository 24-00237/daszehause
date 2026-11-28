"""Rebuild public guide notes from the study pages: python3 guide/index-notes.py."""
import html
import json
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
notes = []
for page in sorted(root.glob("*/index.html")):
    source = page.read_text()
    if "</aside>" not in source or "Save or load this study" not in source:
        continue
    slug = page.parent.name
    name = html.unescape(re.search(r"<title>(.*?) —", source)[1])
    intro = re.search(r'<meta name="description" content="([^"]+)"', source) or re.search(r'<p class="sub">([^<]+)', source)
    entries = [("Overview", intro[1])] if intro else []
    for match in re.finditer(r"^\s*\['([^'\n]+)','((?:\\.|[^'\\\n])+)',\[", source, re.M):
        entries.append(match.groups())
    if slug == "zuhause":
        entries.extend([
            ("Arched colonnade", "A colonnade is a row of columns. Here the white concrete columns rise from the terrace and flare into arches beneath the roof slab."),
            ("Cistern", "A cistern is a tank that stores water. Here it holds filtered rainwater from the roofs beneath the plinth."),
            ("Plinth", "A plinth is a raised base. In this study it supports the house above the underground cistern."),
            ("Timber louvre screen", "Louvres are angled slats. The timber screen shades the facade while leaving gaps for air."),
        ])
    for row in source.splitlines():
        group = re.match(r"^\s*\['([^']+)','((?:\\.|[^'\\])*)',\[", row)
        if not group:
            continue
        for label in re.findall(r"\bl:'((?:\\.|[^'\\])+)'", row):
            title = label.replace("\\'", "'")
            text = f"{title} is a setting in {group[1]}." + (" " + group[2] if group[2] else "")
            notes.append(dict(slug=slug, name=name, title=title, text=text, kind="setting"))
    notes.extend(dict(slug=slug, name=name, title=title, text=html.unescape(body.replace("\\'", "'"))) for title, body in entries)
(root / 'guide/notes.json').write_text(json.dumps(notes, ensure_ascii=False, indent=2)+'\n')
