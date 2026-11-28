const stop = new Set('a an the in on of to for from what which who how where is are was be do does it this that and with me tell about study design compare between differs different house can you please show point at there mean means come comes called many has have my these those label explain ders dors'.split(' '));
const tokens = text => (text.toLowerCase().match(/[\p{L}\d]+/gu) || []).map(w => w.length>4 && w.endsWith('s') ? w.slice(0,-1) : w);

export function findNotes(notes, question, current) {
  const words = [...new Set(tokens(question).filter(word => !stop.has(word)))];
  const mentioned = new Set(notes.filter(note => words.includes(note.slug)).map(note => note.slug));
  if (!mentioned.size) mentioned.add(current);
  const pool = notes.filter(note => mentioned.has(note.slug));
  const scored = pool.map(note => {
    const title = tokens(note.title), body = tokens(note.text);
    let score = 0;
    for (const word of words) {
      if (word === note.slug && note.title === 'Overview') score += 8;
      if (title.includes(word)) score += 9;
      else if (body.includes(word)) score += 1;
    }
    if (score && words.includes(note.title.toLowerCase())) score += 3;
    return {note,score};
  }).filter(row=>row.score).sort((a,b)=>b.score-a.score);
  const first = [...mentioned].map(slug=>scored.find(row=>row.note.slug===slug)).filter(Boolean);
  return [...new Set([...first,...scored])].slice(0,8).map(row=>row.note);
}
