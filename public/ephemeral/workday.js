/* global document */
// A deterministic, fictional workday. No model, calendar API, mail, or phone calls.
const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#ep-${name}"></use></svg>`;
const clock = minutes => `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
const moments = {
  morning:{now:510,label:'Before the first meeting',habits:[.9,.1,.1,.2,.1]},
  meeting:{now:600,label:'A conversation in progress',habits:[.25,.95,.4,.1,.05]},
  midday:{now:750,label:'Turn the conversation into work',habits:[.3,.2,.9,.4,.2]},
  afternoon:{now:900,label:'A window for reaching out',habits:[.1,.1,.65,.95,.3]},
  evening:{now:1170,label:'Make a little room to reflect',habits:[.1,.05,.1,.1,.95]}
};
const meetings=[
  {id:'m1',title:'Product sync',start:540,end:570,place:'Studio B',travel:12,buffer:5,people:['Mara','Ivo'],agenda:['Agree the release scope','Resolve the open handoff'],ready:false},
  {id:'m2',title:'Design review',start:600,end:645,place:'Video room',travel:0,buffer:2,people:['Leah','Sana'],agenda:['Review the onboarding proposal','Decide the keyboard navigation change'],ready:false},
  {id:'m3',title:'Partner check-in',start:840,end:870,place:'Video room',travel:0,buffer:2,people:['Jules','You'],agenda:['Review the pilot','Confirm the next conversation'],ready:false}
];
const reviews=[
  {id:'r1',meeting:'m1',title:'Release scope / v3',author:'Mara',summary:'The draft keeps the onboarding work and moves account themes into the next release.',checked:false},
  {id:'r2',meeting:'m1',title:'Handoff notes',author:'Ivo',summary:'Two interactions need final decisions: the empty state and the handoff to support.',checked:false},
  {id:'r3',meeting:'m2',title:'Onboarding proposal',author:'Leah',summary:'The revised first-run flow has three steps. Keyboard focus now follows the visible order.',checked:false},
  {id:'r4',meeting:'m3',title:'Pilot feedback',author:'Jules',summary:'The partner wants a short follow-up call and a copy of the revised pilot outline.',checked:false}
];
const actions=[
  {id:'a1',available:570,text:'Share the agreed release scope',owner:'You',due:'13:00',source:'Product sync',done:false},
  {id:'a2',available:645,text:'Send the keyboard review notes',owner:'Sana',due:'15:30',source:'Design review',done:false},
  {id:'a3',available:645,text:'Confirm the onboarding handoff',owner:'You',due:'16:00',source:'Design review',done:false},
  {id:'a4',available:870,text:'Send the revised pilot outline',owner:'You',due:'16:30',source:'Partner check-in',done:false}
];
const contacts=[
  {id:'c1',name:'Jules Park',company:'Harbor Studio',topic:'Pilot follow-up',brief:'Discuss the revised outline and agree one small next step.',from:900,to:990,done:false},
  {id:'c2',name:'Theo Moss',company:'Northline',topic:'Research invitation',brief:'Invite Theo to a 20-minute conversation about the team’s current review process.',from:900,to:990,done:false}
];
const readings=[
  {id:'b1',title:'A useful ending',by:'Mara Chen',text:'A good workday can end before every possible thing is finished. Write down the next step, keep the context, and let the workspace go.',done:false},
  {id:'b2',title:'The question we carried home',by:'Leah North',text:'The best part of a review was the question nobody could answer yet. We wrote it down, gave it an owner, and stopped trying to solve it in the last two minutes.',done:false}
];
const kinds=['prepare','meeting','followup','outreach','reflect'];
const labels={prepare:'Meeting preparation',meeting:'In the meeting',followup:'Follow-ups & actions',outreach:'Calls & outreach',reflect:'Reading & reflection'};
const headings={prepare:'A little preparation.',meeting:'Be in the conversation.',followup:'Give the decisions a next step.',outreach:'Good time for a conversation.',reflect:'Let the day settle.'};
const registry={
  prepare:['next-meeting','agenda','review-queue'],
  meeting:['live-meeting','agenda','capture'],
  followup:['action-list','followup-draft'],
  outreach:['call-queue','contact-brief'],
  reflect:['reading-list','reflection']
};
const componentLabels={'next-meeting':'Arrival card',agenda:'Agenda editor','review-queue':'Work to review','live-meeting':'Meeting room',capture:'Notes + action capture','action-list':'Action items','followup-draft':'Follow-up draft','call-queue':'Call queue','contact-brief':'Contact brief','reading-list':'Reading shelf',reflection:'Reflection journal'};
const state={moment:'morning',layout:'adaptive',manual:'auto',mounted:null,released:false,moveMeeting:false,joined:new Set(),notes:{},actionDrafts:{},notesSaved:new Set(),draftReady:false,activeCall:null,callNotes:{},reflection:'',reflectionSaved:false,serial:0};
const now=()=>moments[state.moment].now;
const scheduled=()=>meetings.map(m=>({...m,start:m.start+(m.id==='m1'&&state.moveMeeting?30:0),end:m.end+(m.id==='m1'&&state.moveMeeting?30:0)})).sort((a,b)=>a.start-b.start);
const activeMeeting=()=>scheduled().find(m=>m.start<=now()&&m.end>now());
const nextMeeting=()=>scheduled().find(m=>m.start>now());
const relevantMeeting=()=>activeMeeting()||nextMeeting()||scheduled().at(-1);
const availableActions=()=>actions.filter(a=>a.available+(a.id==='a1'&&state.moveMeeting?30:0)<=now());
const pendingPrep=()=>{
  const relevant=scheduled().filter(m=>m.start>now()&&m.start-now()<=120);
  const ids=new Set(relevant.map(m=>m.id));
  const docs=reviews.filter(r=>ids.has(r.meeting));
  return {meetings:relevant,docs,total:relevant.length+docs.length,open:relevant.filter(m=>!m.ready).length+docs.filter(r=>!r.checked).length};
};
const fraction=(open,total)=>total?open/total:0;
const windowFit=(time,from,to)=>time>=from&&time<=to?1:Math.max(0,1-Math.min(Math.abs(time-from),Math.abs(time-to))/90);
function scoreModel(){
  const n=now(),next=nextMeeting(),active=activeMeeting(),prep=pendingPrep(),last=scheduled().filter(m=>m.end<=n).sort((a,b)=>b.end-a.end)[0];
  const queue=availableActions();
  const timing=[next?Math.max(0,1-(next.start-n)/90):0,active?1:0,last?Math.max(0,1-(n-last.end)/180):0,Math.max(...contacts.map(c=>windowFit(n,c.from,c.to))),windowFit(n,1110,1260)];
  const work=[fraction(prep.open,prep.total),active?1:0,fraction(queue.filter(a=>!a.done).length,queue.length),fraction(contacts.filter(c=>!c.done).length,contacts.length),fraction(readings.filter(r=>!r.done).length+(state.reflectionSaved?0:1),readings.length+1)];
  const habits=$('use-habits').checked?moments[state.moment].habits:[0,0,0,0,0];
  const weights=[Number($('weight-time').value),Number($('weight-work').value),Number($('weight-habit').value)];
  const rows=kinds.map((id,i)=>({id,t:timing[i],d:work[i],h:habits[i],score:weights[0]*timing[i]+weights[1]*work[i]+weights[2]*habits[i]}));
  const max=Math.max(...rows.map(r=>r.score));
  const denominator=rows.reduce((sum,r)=>sum+Math.exp((r.score-max)/1.5),0);
  rows.forEach(r=>{r.share=100*Math.exp((r.score-max)/1.5)/denominator;});
  // Largest remainders make the displayed one-decimal shares sum to 100.0%.
  const tenths=rows.map(r=>Math.floor(r.share*10));
  let remainder=1000-tenths.reduce((a,b)=>a+b,0);
  const order=rows.map((r,i)=>({i,fraction:r.share*10-tenths[i]})).sort((a,b)=>b.fraction-a.fraction);
  for(let i=0;remainder>0;i++,remainder--)tenths[order[i].i]++;
  rows.forEach((r,i)=>{r.display=(tenths[i]/10).toFixed(1);});
  return {rows,ranked:[...rows].sort((a,b)=>b.score-a.score),weights,prep,queue,next,active,last};
}
function compatible(a,b){return [['prepare','meeting'],['meeting','followup'],['followup','outreach']].some(pair=>pair.includes(a)&&pair.includes(b));}
function suggested(model){
  const [first,second]=model.ranked;
  if(Math.abs(first.score-second.score)<.000001)return {kinds:[],pieces:[],tie:true,key:'calendar'};
  const blend=$('workday-blend').checked&&second.share>=25&&compatible(first.id,second.id);
  const needs=blend?[first.id,second.id]:[first.id];
  const support={prepare:'review-queue',meeting:'capture',followup:'action-list',outreach:'call-queue'};
  const core=blend?(first.id==='meeting'?['live-meeting','capture']:registry[first.id].slice(0,2)):registry[first.id];
  const pieces=[...new Set([...core,...(blend?[support[second.id]]:[])])].slice(0,3).sort((a,b)=>Number(a==='capture')-Number(b==='capture'));
  return {kinds:needs,pieces,tie:false,key:needs.join('+')};
}
function chosen(model){
  return state.manual==='auto'?suggested(model):{kinds:[state.manual],pieces:registry[state.manual],tie:false,key:state.manual};
}
const card=(id,title,body,badge='')=>`<section class="work-card" data-component="${id}"><header><h4>${title}</h4>${badge?`<span class="tag">${badge}</span>`:''}</header>${body}</section>`;
const empty=message=>`<p class="work-empty">${message}</p>`;
function meetingCard(live=false){
  const m=relevantMeeting(),isLive=m.start<=now()&&m.end>now(),ended=m.end<=now();
  if(ended)return card(live?'live-meeting':'next-meeting','No more meetings',empty('Your scheduled conversations are done for today.'),'Complete');
  const leave=m.start-m.travel-m.buffer;
  return card(live?'live-meeting':'next-meeting',live?'Meeting room':'Get there with room to spare',`<p class="meeting-time">${clock(m.start)}<span>– ${clock(m.end)}</span></p><h5>${m.title}</h5><p class="work-meta">${m.place} · ${m.people.join(' + ')}</p><div class="meeting-attendees">${m.people.map(name=>`<span class="avatar">${name[0]}</span>`).join('')}<span>${m.people.length+1} participants</span></div>${isLive?`<button type="button" class="solid-button" data-join="${m.id}">${state.joined.has(m.id)?'Leave sample room':'Join sample room'} ${icon('arrow')}</button>`:`<div class="arrival-callout">${icon('clock')}<div><strong>${m.travel?'Leave':'Be ready'} by ${clock(leave)}</strong><span>${Math.max(0,leave-now())} minutes from this sample time</span></div></div><details class="work-detail"><summary>Arrival calculation</summary><p>${clock(m.start)} − ${m.travel} min travel − ${m.buffer} min buffer = ${clock(leave)}.</p></details>${m.id==='m1'?`<button class="outline-button" type="button" data-move-meeting>${state.moveMeeting?'Restore 09:00 start':'What if it moves to 09:30?'}</button>`:''}`}<p class="micro">${state.joined.has(m.id)?'Sample room open. No meeting service is connected.':isLive?'A local simulation; no real call is opened.':'Travel time is an authored example.'}</p>`,isLive?'Now':'Next');
}
function agendaCard(){
  const m=relevantMeeting();
  if(m.end<=now())return card('agenda','Agendas',empty('The scheduled meetings have ended.'));
  return card('agenda','An agenda with a point',`<p class="work-meta">${m.title}</p><form data-form="agenda" data-meeting="${m.id}"><label class="work-label" for="agenda-text">Topics, one per line</label><textarea id="agenda-text" name="agenda" rows="4" data-draft="agenda" data-meeting="${m.id}">${esc(m.agenda.join('\n'))}</textarea><button class="solid-button" type="submit">${m.ready?'Save agenda':'Mark agenda ready'} ${icon('check')}</button></form>`,m.ready?'Ready':'Draft');
}
function reviewCard(){
  const docs=pendingPrep().docs;
  return card('review-queue','Other people’s work',docs.length?docs.map(r=>`<article class="review-item"><div><span class="avatar">${r.author[0]}</span><div><strong>${r.title}</strong><span>${r.author} · before ${scheduled().find(m=>m.id===r.meeting).title}</span></div></div><details class="work-detail"><summary>Read the changes</summary><p>${r.summary}</p></details><label class="task-check"><input type="checkbox" data-review="${r.id}" ${r.checked?'checked':''} /> Reviewed</label></article>`).join(''):empty('No review documents for meetings in the next two hours.'));
}
function captureCard(){
  const m=relevantMeeting(),draft=state.actionDrafts[m.id]||{text:'',owner:'You',due:'16:00'};
  return card('capture','Keep the decisions',`<form data-form="notes" data-meeting="${m.id}"><label class="work-label" for="meeting-notes">Notes / ${m.title}</label><textarea id="meeting-notes" rows="3" data-draft="notes" data-meeting="${m.id}" placeholder="What changed? What was decided?">${esc(state.notes[m.id]||'')}</textarea><button class="outline-button" type="submit">Save notes</button><span class="micro">${state.notesSaved.has(m.id)?'Saved for this page visit.':''}</span></form><form data-form="action" data-meeting="${m.id}" class="capture-action"><label class="work-label" for="new-action">Turn a decision into an action</label><input id="new-action" name="action" value="${esc(draft.text)}" required maxlength="180" placeholder="e.g. Share the revised prototype" /><div class="action-fields"><label>Owner<select name="owner">${['You','Mara','Sana','Leah'].map(name=>`<option value="${name}" ${draft.owner===name?'selected':''}>${name}</option>`).join('')}</select></label><label>Due<input type="time" name="due" value="${esc(draft.due)}" required /></label></div><button class="solid-button" type="submit">Add action ${icon('arrow')}</button></form>`,`${availableActions().filter(a=>a.source===m.title).length} actions`);
}
function actionCard(){
  const queue=availableActions();
  return card('action-list','Give each promise a next step',queue.length?queue.map(a=>`<label class="action-row ${a.done?'is-done':''}"><input type="checkbox" data-action-done="${a.id}" ${a.done?'checked':''} /><span><strong>${esc(a.text)}</strong><small>${esc(a.owner)} · due ${esc(a.due)}<br />${esc(a.source)}</small></span></label>`).join(''):empty('Action items appear after a sample meeting ends, or when you capture one.'),`${queue.filter(a=>!a.done).length} open`);
}
function followupCard(){
  const queue=availableActions().filter(a=>!a.done);
  return card('followup-draft','A follow-up, ready to review',queue.length?`<p class="work-meta">Draft / today’s collaborators</p><div class="draft-sheet"><p>Thanks for the conversation. Here are the next steps:</p><ul>${queue.map(a=>`<li>${esc(a.text)} — ${esc(a.owner)}, ${esc(a.due)}</li>`).join('')}</ul></div><button class="solid-button" type="button" data-draft-ready>${state.draftReady?'Draft marked ready':'Mark draft ready'} ${icon('check')}</button><p class="micro">Nothing is sent. This is an authored template.</p>`:empty('No open actions to include.'));
}
function callsCard(){
  return card('call-queue','Two people to reconnect with',contacts.map(c=>`<article class="call-person"><div class="contact-line"><span class="avatar">${c.name.split(' ').map(p=>p[0]).join('')}</span><div><strong>${c.name}</strong><span>${c.company} · ${c.topic}</span></div><span class="tag ${c.done?'yellow':''}">${c.done?'Logged':`${clock(c.from)}–${clock(c.to)}`}</span></div>${state.activeCall===c.id?`<div class="call-open"><span class="tag yellow">Sample call in progress</span><label class="work-label" for="call-note-${c.id}">What should you keep?</label><textarea id="call-note-${c.id}" rows="2" data-draft="call" data-contact="${c.id}">${esc(state.callNotes[c.id]||'')}</textarea><button class="solid-button" type="button" data-finish-call="${c.id}">Finish & log ${icon('check')}</button></div>`:c.done?`<p class="micro">${esc(state.callNotes[c.id]||'Call completed in this sample.')}</p><button class="outline-button" type="button" data-reopen-call="${c.id}">Reopen</button>`:`<button class="outline-button" type="button" data-call="${c.id}" ${state.activeCall?'disabled':''}>Start sample call ${icon('phone')}</button>`}</article>`).join(''));
}
function contactCard(){
  const c=contacts.find(c=>c.id===state.activeCall)||contacts.find(c=>!c.done)||contacts[0];
  return card('contact-brief','Context before contact',`<p class="eyebrow">${c.company}</p><h5>${c.name}</h5><p>${c.brief}</p><div class="contact-context">${icon('thread')}<span>${c.id==='c1'?'The pilot outline also appears in your meeting follow-ups.':'A research conversation, not a sales script.'}</span></div><p class="micro">Callback window: ${clock(c.from)}–${clock(c.to)} · authored preference.</p>`);
}
function readingCard(){
  return card('reading-list','Something to stay with',readings.map(r=>`<article class="reading-item"><div class="reading-number">${icon('book')}</div><div><h5>${r.title}</h5><p class="work-meta">${r.by} · short read</p><details class="work-detail"><summary>Open the reading</summary><p>${r.text}</p></details><label class="task-check"><input type="checkbox" data-read-done="${r.id}" ${r.done?'checked':''} /> Read</label></div></article>`).join(''),`${readings.filter(r=>!r.done).length} unread`);
}
function reflectionCard(){
  return card('reflection','A small place to leave the day',`<p class="reflection-prompt">What moved forward?<br />What can wait until tomorrow?</p><form data-form="reflection"><label class="work-label" for="reflection-text">Your reflection</label><textarea id="reflection-text" data-draft="reflection" rows="6" placeholder="A thought, a decision, one next step…">${esc(state.reflection)}</textarea><button class="solid-button" type="submit">Save reflection ${icon('save')}</button><p class="micro">${state.reflectionSaved?'Saved for this page visit.':'Only stored in this page’s memory.'}</p></form>`);
}
const renderers={'next-meeting':()=>meetingCard(false),'live-meeting':()=>meetingCard(true),agenda:agendaCard,'review-queue':reviewCard,capture:captureCard,'action-list':actionCard,'followup-draft':followupCard,'call-queue':callsCard,'contact-brief':contactCard,'reading-list':readingCard,reflection:reflectionCard};
function calendarView(){return card('calendar','The fixed calendar',`<p class="micro">The control keeps the same format throughout the day.</p>${scheduled().map(m=>`<div class="calendar-row"><time>${clock(m.start)}<span>${clock(m.end)}</span></time><div><strong>${m.title}</strong><span>${m.place} · ${m.people.join(', ')}</span></div><span class="tag">${m.start<=now()&&m.end>now()?'Now':m.end<=now()?'Ended':'Upcoming'}</span></div>`).join('')}<div class="calendar-row"><time>15:00</time><div><strong>Outreach window</strong><span>2 sample contacts</span></div></div><div class="calendar-row"><time>19:30</time><div><strong>Reading & reflection</strong><span>2 pieces and a journal</span></div></div>`);}
function renderTimeline(){
  $('workday-clock').textContent=`Tuesday / ${clock(now())}`;
  $('workday-timeline').innerHTML=scheduled().map(m=>`<div class="day-event ${m.start<=now()&&m.end>now()?'current':''} ${m.end<=now()?'past':''}"><time>${clock(m.start)}</time><strong>${m.title}</strong><span>${m.place}</span></div>`).join('')+`<div class="day-event ${state.moment==='afternoon'?'current':''}"><time>15:00</time><strong>Reach out</strong><span>Harbor + Northline</span></div><div class="day-event ${state.moment==='evening'?'current':''}"><time>19:30</time><strong>Wind down</strong><span>Read + reflect</span></div>`;
  document.querySelectorAll('[data-moment]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.moment===state.moment)));
  document.querySelectorAll('[data-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layout===state.layout)));
}
function renderWorkspace(){
  renderTimeline();
  const calendar=state.layout==='calendar'||state.mounted.tie;
  $('workday-kicker').textContent=state.manual!=='auto'?'You chose this view':moments[state.moment].label;
  $('workday-title').textContent=calendar?'Your schedule, as usual.':headings[state.mounted.kinds[0]];
  $('workday-components').innerHTML=calendar?calendarView():state.mounted.pieces.map(id=>renderers[id]()).join('');
  const actionForm=$('workday-components').querySelector('[data-form=action]');
  if(actionForm)actionForm.elements.namedItem('owner').value=state.actionDrafts[actionForm.dataset.meeting]?.owner||'You';
  $('workday-components').dataset.composition=calendar?'calendar':state.mounted.pieces.join(',');
  $('workday-components').hidden=state.released;
  $('workday-released').hidden=!state.released;
  $('workday-release').hidden=state.released;
  $('workday-context').textContent=calendar?'The same schedule, in a fixed format.':state.mounted.kinds.length>1?`${labels[state.mounted.kinds[0]]} + ${labels[state.mounted.kinds[1]]}`:labels[state.mounted.kinds[0]];
}
function renderReasoning(){
  const model=scoreModel(),plan=suggested(model),target=chosen(model),mounted=state.layout==='calendar'?{pieces:['calendar']}:state.mounted;
  $('guess-time').textContent=clock(now());
  $('guess-bars').innerHTML=model.ranked.map(r=>`<div class="guess-row"><div><span>${labels[r.id]}</span><strong>${r.display}%</strong></div><div class="guess-track"><span style="width:${r.share.toFixed(3)}%" class="${plan.kinds.includes(r.id)?'selected':''}"></span></div></div>`).join('');
  $('composition-title').textContent=plan.tie?'No strong direction. Keep the calendar.':plan.kinds.map(id=>labels[id]).join(' + ');
  $('composition-pieces').innerHTML=plan.tie?'<span class="tag">Calendar</span>':plan.pieces.map(id=>`<span class="tag ${mounted.pieces.includes(id)?'yellow':''}">${componentLabels[id]}</span>`).join('');
  const [first,second]=model.ranked;
  $('composition-reason').textContent=plan.tie?'The top scores are equal. Keep a familiar view until the user chooses.':plan.kinds.length>1?`${second.display}% also points to ${labels[second.id].toLowerCase()}. These needs are compatible, so the composition borrows one supporting component.`:!$('workday-blend').checked?'Combining is off. Use only the strongest need.':second.share<25?'The runner-up is below 25%. Keep the composition focused.':'The runner-up is a different kind of task. Keep it separate.';
  $('composition-override').textContent=state.layout==='calendar'?'You are viewing the calendar control. The scores remain visible for comparison.':state.manual!=='auto'?`Your explicit choice (${labels[state.manual]}) takes priority. The percentages do not change.`:state.mounted.key!==target.key?'Your current view stays in place. Use “Use new suggestion” above when ready.':'Yellow chips are the components currently in use.';
  $('workday-apply').hidden=state.released||state.layout==='calendar'||state.mounted.key===target.key;
  ['time','work','habit'].forEach((key,i)=>{$(`weight-${key}-value`).value=String(model.weights[i]);});
  $('score-formula').textContent=`sᵢ = ${model.weights[0]}tᵢ + ${model.weights[1]}dᵢ + ${model.weights[2]}hᵢ`;
  $('score-rows').innerHTML=model.rows.map(r=>`<tr data-need="${r.id}" data-score="${r.score}" data-share="${r.share}" data-t="${r.t}" data-d="${r.d}" data-h="${r.h}"><th scope="row">${labels[r.id]}</th><td>${r.t.toFixed(3)}</td><td>${r.d.toFixed(3)}</td><td>${r.h.toFixed(3)}</td><td>${r.score.toFixed(3)}</td><td>${r.display}%</td></tr>`).join('');
  const terms=[first.t,first.d,first.h].map((v,i)=>`${model.weights[i]} × ${v.toFixed(3)}`).join(' + ');
  $('worked-example').textContent=`${labels[first.id]}: ${terms} ≈ ${first.score.toFixed(3)}. Share = 100 × exp(${first.score.toFixed(3)} / 1.5) / ${model.rows.reduce((sum,r)=>sum+Math.exp(r.score/1.5),0).toFixed(3)} ≈ ${first.display}%. Calculations use full precision; displayed signals are rounded. Shares total 100.0% after rounding.`;
  $('signal-facts').innerHTML=`<ul><li>Clock: ${clock(now())}. ${model.active?`${model.active.title} is active.`:model.next?`${model.next.title} starts at ${clock(model.next.start)} (${model.next.start-now()} minutes away).`:'No more meetings.'}</li><li>Preparation: ${model.prep.open}/${model.prep.total} relevant agendas and documents still need attention.</li><li>Follow-ups: ${model.queue.filter(a=>!a.done).length}/${model.queue.length} available action items remain.</li><li>Outreach: ${contacts.filter(c=>!c.done).length}/${contacts.length} calls remain. Sample callback windows: 15:00–16:30.</li><li>Reflection: ${readings.filter(r=>!r.done).length} unread pieces; reflection ${state.reflectionSaved?'saved':'not saved'}. Preferred window: 18:30–21:00.</li><li>Sample habit strengths: ${kinds.map((id,i)=>`${labels[id]} ${moments[state.moment].habits[i]}`).join('; ')}. ${$('use-habits').checked?'Enabled.':'Disabled: h = 0.'}</li></ul>`;
}
function refresh(message='',remount=false){
  if(remount)state.mounted=chosen(scoreModel());
  renderWorkspace();renderReasoning();
  if(message)$('workday-status').textContent=message;
}
function focusWorkspace(){const heading=$('workday-title');heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
$('workday-override').addEventListener('change',()=>{state.manual=$('workday-override').value;state.released=false;refresh('View updated to your choice.',true);});
$('workday-blend').addEventListener('change',()=>{state.released=false;refresh('Composition preference applied.',true);});
$('workday-apply').addEventListener('click',()=>{refresh('Updated suggestion applied.',true);focusWorkspace();});
$('workday-release').addEventListener('click',()=>{state.released=true;refresh('View released. Work stays for this page visit.');$('workday-return').focus({preventScroll:true});});
$('workday-return').addEventListener('click',()=>{state.released=false;refresh('Workday restored.');focusWorkspace();});
['weight-time','weight-work','weight-habit','use-habits'].forEach(id=>$(id).addEventListener('input',renderReasoning));
$('workday-components').addEventListener('input',event=>{
  const e=event.target;
  if(e.dataset.draft==='notes'){state.notes[e.dataset.meeting]=e.value;state.notesSaved.delete(e.dataset.meeting);}
  if(e.closest('[data-form=action]')){const form=e.closest('form');state.actionDrafts[form.dataset.meeting]={text:form.elements.namedItem('action').value,owner:form.elements.namedItem('owner').value,due:form.elements.namedItem('due').value};}
  if(e.dataset.draft==='agenda'){const m=meetings.find(m=>m.id===e.dataset.meeting);m.agenda=e.value.split('\n');m.ready=false;e.closest('.work-card').querySelector('header .tag').textContent='Draft';renderReasoning();}
  if(e.dataset.draft==='call')state.callNotes[e.dataset.contact]=e.value;
  if(e.dataset.draft==='reflection'){state.reflection=e.value;state.reflectionSaved=false;renderReasoning();}
});
$('workday-components').addEventListener('change',event=>{
  const e=event.target;
  if(e.dataset.review){reviews.find(r=>r.id===e.dataset.review).checked=e.checked;renderReasoning();$('workday-status').textContent='Review status updated.';}
  if(e.dataset.actionDone){actions.find(a=>a.id===e.dataset.actionDone).done=e.checked;e.closest('.action-row').classList.toggle('is-done',e.checked);state.draftReady=false;e.closest('.work-card').querySelector('header .tag').textContent=`${availableActions().filter(a=>!a.done).length} open`;renderReasoning();$('workday-status').textContent='Action status updated. Draft will use the remaining items.';if(state.mounted.pieces.includes('followup-draft')){const old=$('workday-components').querySelector('[data-component="followup-draft"]');old.outerHTML=followupCard();}}
  if(e.dataset.readDone){readings.find(r=>r.id===e.dataset.readDone).done=e.checked;e.closest('.work-card').querySelector('header .tag').textContent=`${readings.filter(r=>!r.done).length} unread`;renderReasoning();$('workday-status').textContent='Reading status updated.';}
});
$('workday-components').addEventListener('submit',event=>{
  const form=event.target;event.preventDefault();
  if(form.dataset.form==='agenda'){const m=meetings.find(m=>m.id===form.dataset.meeting);m.agenda=$('agenda-text').value.split('\n').map(t=>t.trim()).filter(Boolean);if(!m.agenda.length){$('workday-status').textContent='Add at least one agenda topic.';return;}m.ready=true;refresh('Agenda saved and marked ready.');}
  if(form.dataset.form==='notes'){state.notes[form.dataset.meeting]=$('meeting-notes').value;state.notesSaved.add(form.dataset.meeting);refresh('Meeting notes saved.');}
  if(form.dataset.form==='action'){const text=form.elements.namedItem('action').value.trim();if(!text)return;actions.push({id:`custom${++state.serial}`,available:now(),text,owner:form.elements.namedItem('owner').value,due:form.elements.namedItem('due').value,source:meetings.find(m=>m.id===form.dataset.meeting).title,done:false});state.actionDrafts[form.dataset.meeting]=undefined;state.draftReady=false;refresh('Action captured. It is available in follow-ups.');}
  if(form.dataset.form==='reflection'){state.reflection=$('reflection-text').value;if(!state.reflection.trim()){$('workday-status').textContent='Write a reflection before saving.';return;}state.reflectionSaved=true;refresh('Reflection saved for this page visit.');}
  focusWorkspace();
});
document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.moment){state.moment=b.dataset.moment;state.released=false;state.activeCall=null;refresh('Sample time changed.',true);}
  else if(b.dataset.layout){state.layout=b.dataset.layout;state.released=false;refresh('Layout comparison updated.');}
  else if(b.hasAttribute('data-move-meeting')){state.moveMeeting=!state.moveMeeting;refresh('Meeting time changed. Check the arrival time and updated guess.');focusWorkspace();}
  else if(b.dataset.join){if(state.joined.has(b.dataset.join))state.joined.delete(b.dataset.join);else state.joined.add(b.dataset.join);refresh('Sample meeting room toggled. No actual call was opened.');focusWorkspace();}
  else if(b.hasAttribute('data-draft-ready')){state.draftReady=true;refresh('Draft marked ready. Nothing was sent.');focusWorkspace();}
  else if(b.dataset.call){state.activeCall=b.dataset.call;refresh('Sample call started. No actual call was placed.');focusWorkspace();}
  else if(b.dataset.finishCall){contacts.find(c=>c.id===b.dataset.finishCall).done=true;state.activeCall=null;refresh('Sample call logged.');focusWorkspace();}
  else if(b.dataset.reopenCall){contacts.find(c=>c.id===b.dataset.reopenCall).done=false;refresh('Call returned to the queue.');focusWorkspace();}
});
refresh('',true);
