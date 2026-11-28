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
        entries.append(("Cistern definition", "A cistern is a tank that stores water."))
    notes.extend(dict(slug=slug, name=name, title=title, text=html.unescape(body.replace("\\'", "'"))) for title, body in entries)
(root / 'guide/notes.json').write_text(json.dumps(notes, ensure_ascii=False, indent=2)+'\n')
