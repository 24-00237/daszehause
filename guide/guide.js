import {findNotes} from './search.mjs';

const panel = document.querySelector('.study-guide');
const form = panel.querySelector('form');
const answer = panel.querySelector('.guide-answer');
const sources = panel.querySelector('.guide-sources');
const status = panel.querySelector('.guide-status');
const ai = panel.querySelector('.guide-ai');
const current = new URL('../', import.meta.url);
const slug = location.pathname.split('/').at(-2);
let worker, ready = false, request = 0, notes;
const initial = status.textContent;

function stop(message) {
  worker?.terminate();
  worker = undefined;
  ready = false;
  ai.disabled = false;
  status.textContent = message;
}
panel.addEventListener('toggle', () => {
  if (!panel.open) { request++; stop(initial); }
});
ai.onclick = () => {
  if (!navigator.gpu) { status.textContent = 'This browser cannot run the model. Study search is available.'; return; }
  ai.disabled = true;
  status.textContent = 'Preparing the model…';
  try {
    worker = new Worker(new URL('./worker.js', import.meta.url), {type:'module'});
    worker.onerror = () => stop('AI could not load. Study search is available.');
    worker.onmessage = ({data}) => {
      if (data.error) { stop('AI unavailable. You can still search the study notes.'); return; }
      if (data.ready) ready = true;
      if (data.status) status.textContent = data.status;
      if (data.reply && data.id === request) answer.textContent = data.reply;
    };
    worker.postMessage({load:true});
  } catch { stop('AI unavailable. Study search is available.'); }
};

form.onsubmit = async event => {
  event.preventDefault();
  const question = form.elements.question.value.trim();
  if (!question) return;
  const id = ++request;
  sources.replaceChildren();
  try {
    if (!notes) {
      const response = await fetch(new URL('./notes.json', import.meta.url));
      if (!response.ok) throw Error();
      notes = await response.json();
    }
    if (id !== request) return;
    const hits = findNotes(notes, question, slug);
    answer.textContent = hits.length ? 'Related study notes' : 'I couldn’t find that in the indexed study notes.';
    for (const hit of hits) {
      const p = document.createElement('p'), link = document.createElement('a');
      link.href = new URL(hit.slug+'/', current);
      link.textContent = hit.name+' · '+hit.title;
      p.append(link, document.createElement('br'), hit.text);
      sources.append(p);
    }
    if (ready && hits.length) worker.postMessage({id,question,hits});
  } catch { if (id === request) answer.textContent = 'Couldn’t load the study notes. Please try again.'; }
};
