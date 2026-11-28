const stop = new Set('a an the in on of to for from what which who how where is are was be do does it this that and with me tell about study design compare between differs different house can you please'.split(' '));
const tokens = text => text.toLowerCase().match(/[\p{L}\d]+/gu) || [];

export function findNotes(notes, question, current) {
  const words = [...new Set(tokens(question).filter(word => !stop.has(word)))];
  const mentioned = new Set(notes.filter(note => words.includes(note.slug)).map(note => note.slug));
  const scores = notes.map(note => {
    const title = tokens(note.title);
    const body = tokens(note.text);
    let score = 0;
    for (const word of words) {
      if (word === note.slug && note.title === 'Overview') score += 4;
      if (title.includes(word)) score += 8;
      if (body.includes(word)) score += 2;
    }
    return {note, score: score ? score + Number(note.slug === current) : 0};
  }).filter(({note, score}) => score && (!mentioned.size || mentioned.has(note.slug)))
    .sort((a,b) => b.score - a.score);
  const first = [...mentioned].map(slug => scores.find(row => row.note.slug === slug)).filter(Boolean);
  return [...new Set([...first, ...scores])].slice(0,4).map(row => row.note);
}
