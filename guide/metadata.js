// Read the labels that are actually present, including values for this configuration.
export function readMetadata(slug, name) {
  const notes = [];
  for (const section of document.querySelectorAll('aside section')) {
    const group = section.querySelector('h2')?.textContent.trim();
    if (!group) continue;
    const description = section.querySelector('.why')?.textContent.trim() || '';
    for (const el of section.querySelectorAll('label, .lab, tr')) {
      const label = el.cloneNode(true);
      label.querySelectorAll('input,select,button,output,small,td:not(:first-child)').forEach(child => child.remove());
      const title = label.textContent.trim();
      if (!title) continue;
      const control = el.control || el.querySelector('input,select');
      const value = el.querySelector('td:nth-child(2)')?.textContent.trim() ||
        el.closest('.row')?.querySelector('output')?.textContent.trim() ||
        (control?.type === 'checkbox' ? (control.checked ? 'On' : 'Off') : '');
      const text = [title + (value ? ' · '+value : ''), group, description].filter(Boolean).join('. ');
      notes.push({slug,name,title,text,kind:'control',element:el});
    }
  }
  return notes;
}

export function readAnchors(slug,name) {
  const seen = new Set();
  return (window.studyGuideScene?.anchors() || []).filter(({title}) => {
    if (!title || seen.has(title)) return false;
    seen.add(title); return true;
  }).map(({title}) => ({slug,name,title,text:'Scene label in '+name+': '+title,kind:'anchor'}));
}
