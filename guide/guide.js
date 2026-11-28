import {findNotes} from './search.mjs';

import {readMetadata,readAnchors} from './metadata.js';
import {pointAt,clearPointer} from './spatial.js';

const panel = document.querySelector('.study-guide');
const form = panel.querySelector('form');
const answer = panel.querySelector('.guide-answer');
const sources = panel.querySelector('.guide-sources');
const status = panel.querySelector('.guide-status');
const ai = panel.querySelector('.guide-ai');
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
  if (!panel.open) { request++; clearPointer(); stop(initial); } else refreshPicker();
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

const studyName = document.title.split(' — ')[0];
const picker = document.createElement('select');
picker.setAttribute('aria-label','Explore a scene label');
picker.style.cssText = 'max-width:100%;min-height:44px;margin:6px 0';
form.after(picker);
function refreshPicker() {
  const labels = readAnchors(slug,studyName).sort((a,b)=>a.title.localeCompare(b.title));
  picker.replaceChildren(new Option('Explore a scene label…',''));
  for (const {title} of labels) picker.add(new Option(title,title));
  picker.hidden = !labels.length;
}
picker.addEventListener('focus',refreshPicker);
picker.onchange = () => {
  if (picker.value) { form.elements.question.value = 'What is '+picker.value+'?'; form.requestSubmit(); }
};
function action(text, handler) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'btn'; button.textContent = text;
  button.onclick = handler; sources.append(button);
}
function revealControl(el) {
  const toggle = el.closest('section')?.querySelector('[aria-expanded="false"]');
  toggle?.click();
  el.scrollIntoView({block:'center'});
  el.animate([{outline:'3px solid #edab4c'},{outline:'3px solid transparent'}],1800);
}
form.onsubmit = async event => {
  event.preventDefault();
  const question = form.elements.question.value.trim();
  if (!question) return;
  const id = ++request;
  clearPointer();
  sources.replaceChildren();
  try {
    if (!notes) {
      const response = await fetch(new URL('./notes.json', import.meta.url));
      if (!response.ok) throw Error();
      notes = await response.json();
    }
    if (id !== request) return;
    const anchors = readAnchors(slug,studyName);
    const controls = readMetadata(slug,studyName);
    const all = [...notes,...anchors,...controls];
    const hits = findNotes(all,question,slug);
    if (!hits.length) {
      answer.textContent = 'No matching label or note in this study. Pick a scene label to explore.';
      return;
    }
    const local = hits.some(n=>n.slug===slug);
    const anchor = local && findNotes(anchors,question,slug).find(n=>hits.some(h=>h.title===n.title));
    const control = hits.find(n=>n.element);
    const authored = hits.filter(n=>!n.kind && n.title.toLowerCase()===anchor?.title.toLowerCase());
    const defining = /^(what (is|are)|define|meaning)/i.test(question);
    const exact = (defining && authored.find(n=>/^(A |An |Louvres are)/.test(n.text))) || authored[0];
    const primary = exact || hits.find(n=>n.kind!=='anchor') || hits[0];
    answer.textContent = primary.text;
    if (anchor) {
      if (/^(show|point|locate|where (is|are))\b/i.test(question)) pointAt(anchor.title);
      action('Show '+anchor.title+' in 3D',()=>{
        if (!pointAt(anchor.title)) answer.textContent = 'This feature is no longer visible in this configuration.';
      });
    } else if (control) action('Show this setting',()=>revealControl(control.element));
    const more = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'Label details and study notes'; more.append(summary);
    for (const hit of hits) {
      const p=document.createElement('p');
      p.textContent = hit.name+' · '+hit.text;
      more.append(p);
    }
    sources.append(more);
    if (ready) worker.postMessage({id,question,hits:hits.map(({name,title,text})=>({name,title,text}))});
  } catch { if (id === request) answer.textContent = 'The study notes could not load. Please try again.'; }
};

// Existing labels often ignore pointer events so the canvas can still orbit.
// Hit-test just their visible text after a tap; a drag keeps orbiting.
const stage = document.getElementById('stage');
let start;
stage?.addEventListener('pointerdown', e=>{ start=[e.clientX,e.clientY]; });
stage?.addEventListener('pointercancel', ()=>{ start=null; });
stage?.addEventListener('pointerup', e=>{
  if (!start || Math.hypot(e.clientX-start[0],e.clientY-start[1])>6) {start=null;return;}
  start=null;
  if (e.target.closest('button, a, input, [role="button"]')) return;
  const label = Array.from(stage.querySelectorAll('.dl')).find(el=>{
    const rect=el.getBoundingClientRect(), css=getComputedStyle(el);
    return rect.width && rect.height && css.visibility!=='hidden' && +css.opacity>.5 &&
      rect.left<=e.clientX && e.clientX<=rect.right && rect.top<=e.clientY && e.clientY<=rect.bottom;
  });
  if (!label?.textContent.trim()) return;
  panel.open=true;
  form.elements.question.value='What is '+label.textContent.trim()+'?';
  form.requestSubmit(); panel.scrollIntoView({block:'center'});
});
