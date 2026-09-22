/* global document */
// Authored examples only. No inference, remote data, storage, or tracking.
const posts = [
  { id:'p01', at:420, time:'07:00', author:'Fold team', handle:'@fold', topic:'design', kind:'update', title:'A prototype can be a conversation.', body:'Fold beta now lets a team leave comments directly on a shared prototype. Open a scene, add a note, and keep the discussion beside the work.' },
  { id:'p02', at:430, time:'07:10', author:'Mara Chen', handle:'@marac', topic:'craft', kind:'read', title:'The best part was the space we left.', body:'We removed half the labels from our reading app. The difficult part was deciding which labels people still needed. Less interface takes more editorial work.', excerpt:'An empty corner is not automatically a useful corner. We watched people pause, reread, and reach for the same three things. Those three things stayed. Everything else had to make a case for being there.' },
  { id:'p03', at:440, time:'07:20', author:'East Room', handle:'@eastroom', topic:'local', kind:'update', title:'A room for unfinished things.', body:'Open studio this evening, 18:00–20:00. Bring a sketch, a question, or nothing at all. The long table is open to everyone.' },
  { id:'p04', at:450, time:'07:30', author:'Ivo Reed', handle:'@ivoreed', topic:'design', kind:'reply', title:'Comments beside the thing itself.', body:'Tried the Fold beta with our small team. Comments stayed attached to the scene we were reviewing, which saved us from pasting screenshots into a separate thread.' },
  { id:'p05', at:460, time:'07:40', author:'Leah North', handle:'@leahn', topic:'craft', kind:'reply', title:'Keep the useful landmarks.', body:'Replying to Mara: we had the same finding. People were happy with fewer labels as long as search, save, and back stayed easy to find.' },
  { id:'p06', at:470, time:'07:50', author:'Jon Bell', handle:'@jonb', topic:'local', kind:'reply', title:'See you at the long table.', body:'Taking a paper prototype to East Room tonight. If you have a half-finished interface, I would love to trade notes.' },
  { id:'p07', at:650, time:'10:50', author:'Sana Holt', handle:'@sanah', topic:'design', kind:'reply', title:'A keyboard test worth making.', body:'Fold comments work with my keyboard, but the prototype canvas still has gaps in its keyboard navigation. I would test your own workflow before moving a whole team over.' },
  { id:'p08', at:670, time:'11:10', author:'Mara Chen', handle:'@marac', topic:'craft', kind:'read', title:'An interface can have an ending.', body:'Our reading experiment now offers three pieces and a clear end. People can ask for more. We are testing whether that makes it easier to leave when they intended to.', excerpt:'The old layout never told you whether you were finished. There was always another rectangle below this one. This version makes a smaller promise: here are three things for the time you have. An ending can be a useful part of an interface.' },
  { id:'p09', at:690, time:'11:30', author:'East Room', handle:'@eastroom', topic:'local', kind:'update', title:'Bring something you are stuck on.', body:'Tonight’s open studio has a small critique circle at 18:30. No presentation needed. A sketch on paper is plenty.' },
  { id:'p10', at:720, time:'12:00', author:'Fold team', handle:'@fold', topic:'design', kind:'reply', title:'What the beta does—and does not—include.', body:'Thanks for the reports. Canvas keyboard navigation is incomplete. Comments and shared scenes are in this beta; offline editing is not. We have not announced a date for those additions.' },
  { id:'p11', at:740, time:'12:20', author:'Ivo Reed', handle:'@ivoreed', topic:'design', kind:'read', title:'Useful for review. Early for everything else.', body:'Fold has been helpful for discussing one scene at a time. For our team, incomplete keyboard navigation means it remains a small trial rather than our default workspace.', excerpt:'Moving the conversation closer to the work removes one detour. It does not remove the need to make the work accessible. We will keep our existing workflow alongside this trial until everyone can participate.' },
  { id:'p12', at:760, time:'12:40', author:'Leah North', handle:'@leahn', topic:'craft', kind:'update', title:'Show the original.', body:'If a summary helps me orient myself, I still want one easy way to see the material it came from. A good shortcut keeps the longer route available.' },
  { id:'p13', at:1020, time:'17:00', author:'Niko Vale', handle:'@nikov', topic:'craft', kind:'read', title:'A little room to wander.', body:'The nicest part of a bookshop is finding something I did not arrive looking for. I am trying to leave that kind of room in a digital collection.', excerpt:'I put a small essay beside a photograph, then moved the neat category labels out of the way. The connection was weaker, and the browsing felt more interesting. Discovery sometimes starts with a little uncertainty.' },
  { id:'p14', at:1050, time:'17:30', author:'Mara Chen', handle:'@marac', topic:'craft', kind:'update', title:'A good stopping point.', body:'Closed the laptop while there was still one thing I wanted to try tomorrow. An unfinished thought can be a nice place to stop.' },
  { id:'p15', at:1110, time:'18:30', author:'Jon Bell', handle:'@jonb', topic:'local', kind:'update', title:'Paper first, pixels later.', body:'At East Room: six people around a paper prototype, moving the pieces with their hands. Everyone has a different idea of where the beginning is.' },
  { id:'p16', at:1140, time:'19:00', author:'Sana Holt', handle:'@sanah', topic:'design', kind:'read', title:'The person who cannot use the shortcut.', body:'A tool can feel beautifully simple to one person and block another. Keep checking who can reach the same outcome.', excerpt:'The best shortcut in our prototype used a drag gesture. It was also the only way to complete the task. Adding a keyboard path did not make the interface less simple. It made the promise of simplicity available to more people.' },
  { id:'p17', at:1180, time:'19:40', author:'East Room', handle:'@eastroom', topic:'local', kind:'update', title:'The table after everyone left.', body:'A pencil, three paper screens, and a very good question left on a sticky note. Thanks for spending your evening here.' },
  { id:'p18', at:1210, time:'20:10', author:'Ivo Reed', handle:'@ivoreed', topic:'design', kind:'update', title:'Keeping the trial small.', body:'We are trying Fold on one review tomorrow. Same team, same work, one changed step. That should give us a clearer comparison.' }
];

const visits = {
  morning: { cutoff:480, context:'You have a few minutes before your day begins.', intent:'brief', query:'Catch me up. I have three minutes.' },
  afternoon: { cutoff:780, context:'You keep hearing about Fold. You want to understand the conversation.', intent:'focus', query:'Help me understand the Fold launch.' },
  evening: { cutoff:1230, context:'The day is done. You have room to follow your curiosity.', intent:'browse', query:'Let me browse. Something interesting to read.' }
};
const briefings = {
  morning:[
    { topic:'design', title:'A prototype becomes a conversation.', summary:'Fold’s beta puts team comments beside a shared scene. One early user describes fewer screenshot detours.', detail:'This is a launch announcement and an individual experience, not evidence that it fits every team.', sources:['p01','p04'] },
    { topic:'craft', title:'Leave room. Keep the landmarks.', summary:'Mara and Leah discuss removing labels while keeping search, save, and back easy to find.', detail:'Their examples point to a design question: what can disappear without making someone lose their place?', sources:['p02','p05'] },
    { topic:'local', title:'Somewhere to bring an unfinished idea.', summary:'East Room opens its studio from 18:00 to 20:00. Jon is bringing a paper prototype.', detail:'You can bring a sketch or simply join the long table. These are fictional community posts.', sources:['p03','p06'] }
  ],
  afternoon:[
    { topic:'design', title:'Fold is useful—and still a beta.', summary:'The team confirms gaps in canvas keyboard navigation and no offline editing. Ivo is keeping the trial small.', detail:'The original promise is shared scenes and comments. The follow-up adds limits that matter before adopting it for a team.', sources:['p01','p07','p10','p11'] },
    { topic:'craft', title:'A feed with a finish line.', summary:'Mara is testing a reading view with three pieces and a clear end. Leah asks for easy access to original sources.', detail:'The hypothesis is easier completion. No result has been reported; the posts describe an experiment and a design preference.', sources:['p08','p12'] },
    { topic:'local', title:'Tonight’s studio has a critique circle.', summary:'East Room adds a casual critique at 18:30. A paper sketch is enough.', detail:'The open studio still runs from 18:00 to 20:00, as announced earlier.', sources:['p03','p09'] }
  ],
  evening:[
    { topic:'design', title:'A small trial. A more useful question.', summary:'Ivo will try Fold on one review. Sana asks who can reach an outcome when a shortcut excludes them.', detail:'The earlier keyboard limitations remain unresolved in these posts. Nothing here announces a fix.', sources:['p10','p16','p18'] },
    { topic:'craft', title:'Room to wander. Permission to stop.', summary:'Niko experiments with unexpected neighbors in a collection. Mara leaves an unfinished thought for tomorrow.', detail:'These are personal reflections on browsing and stopping, not measured claims about user behavior.', sources:['p13','p14'] },
    { topic:'local', title:'The studio evening, in two small moments.', summary:'Jon shares a paper prototype session. East Room closes with a pencil, three screens, and a question.', detail:'The conversation has shifted from an invitation to people sharing what happened.', sources:['p15','p17'] }
  ]
};

const byId = new Map(posts.map(p => [p.id, p]));
const $ = id => document.getElementById(id);
const state = { visit:'morning', mode:'ephemeral', intent:'brief', released:false, unsupported:false, design:false, one:false, long:false, angle:'overview', saved:new Set() };
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const available = () => posts.filter(p => p.at <= visits[state.visit].cutoff);
const designOnly = () => $('design-only').checked || (state.mode === 'ephemeral' && state.design);
const eligible = () => available().filter(p => !designOnly() || p.topic !== 'local');
const isLong = () => $('reading-first').checked || state.long;
const intentQueries = { brief:'Catch me up. I have three minutes.', focus:'Help me understand the Fold launch.', browse:'Let me browse. Something interesting to read.' };

function saveButton(id) {
  const saved = state.saved.has(id);
  return `<button type="button" data-save="${id}" aria-pressed="${saved}" aria-label="${saved?'Unsave':'Save'} ${escapeHTML(byId.get(id).title)}">${saved?'Saved ✓':'Save for later'}</button>`;
}
function sourcePost(id, expanded=false) {
  const p = byId.get(id);
  return `<article class="source-post" data-source="${p.id}"><header>${escapeHTML(p.author)} · ${p.handle} · <time>${p.time}</time></header><p>${escapeHTML(p.body)}</p>${expanded && p.excerpt?`<p>${escapeHTML(p.excerpt)}</p>`:''}${saveButton(p.id)}</article>`;
}
function sourceDisclosure(ids, open=false) {
  return `<details class="source-disclosure" ${open?'open':''}><summary>${ids.length} original post${ids.length===1?'':'s'}</summary>${ids.map(id=>sourcePost(id)).join('')}</details>`;
}
function completion(label='You’re caught up on this selection.') {
  return `<div class="completion"><p>${label}</p><button type="button" class="solid-button" data-action="done">I’m done for now</button></div>`;
}
function feedView() {
  return `<div class="feed"><div class="feed-heading"><p class="eyebrow">Following · latest first</p><h3 class="scene-title">Your regular feed.</h3><p class="scene-intro">Individual posts from the same sample snapshot.</p></div>${eligible().slice().reverse().map(p=>`<article class="feed-post" data-post="${p.id}"><header class="post-meta"><strong>${p.author}</strong><span>${p.handle}</span><time>${p.time}</time></header><p>${escapeHTML(p.body)}</p><div class="item-actions">${saveButton(p.id)}${p.excerpt?`<button type="button" data-read="${p.id}" aria-expanded="false" aria-controls="read-${p.id}">Read more</button>`:''}</div>${p.excerpt?`<p id="read-${p.id}" hidden>${escapeHTML(p.excerpt)}</p>`:''}</article>`).join('')}<p class="scene-intro">End of this fictional snapshot.</p></div>`;
}
function briefView() {
  const groups = briefings[state.visit].filter(g=>!designOnly() || g.topic!=='local').slice(0,state.one?1:3);
  const short = $('short-brief').checked;
  return `<div class="scene-top"><div><p class="eyebrow">A finite briefing</p><h3 class="scene-title">${state.one?'One thing for right now.':`${groups.length===3?'Three':'Two'} things to take with you.`}</h3></div><button type="button" data-action="scope">${designOnly()?'All my interests':'Only design & tools'}</button></div><div class="brief-list">${groups.map(g=>`<article class="brief-item" data-brief="${g.topic}"><h4>${g.title}</h4><p>${g.summary}</p>${short?'':`<p>${g.detail}</p>`}${g.topic==='design'?'<div class="item-actions"><button type="button" data-intent="focus">Follow the Fold conversation ↗</button></div>':''}${sourceDisclosure(g.sources,!short)}</article>`).join('')}</div>${completion()}`;
}
function focusView() {
  const later = state.visit!=='morning';
  const evening = state.visit==='evening';
  const sections = state.angle==='limits' ? (later ? [
    { title:'Keyboard access is incomplete.', text:'Sana reports gaps in canvas navigation. The Fold team confirms the limitation.', ids:['p07','p10'] },
    { title:'Offline editing is outside this beta.', text:'The team has not announced a date for offline editing or the keyboard additions.', ids:['p10'] }
  ] : [
    { title:'The sample has not answered this yet.', text:'These morning posts cover the launch and one early experience. They do not establish keyboard support, offline access, or suitability for every team.', ids:['p01','p04'] }
  ]) : [
    { title:'The promise', text:'Discuss a prototype beside the scene itself, with fewer screenshots passed between tools.', ids:['p01','p04'] },
    ...(later ? [{ title:'The qualification', text:'The team confirms incomplete keyboard navigation and no offline editing. A shared review flow still needs to work for everyone.', ids:['p07','p10'] },{ title:evening?'The next step':'The early experience', text:evening?'Ivo is trying one review tomorrow, keeping the change small enough to compare.':'Ivo finds it useful for review, while keeping the existing workspace alongside the trial.', ids:[evening?'p18':'p11'] }] : [])
  ];
  return `<div class="focus-view"><p class="eyebrow">One conversation, brought together</p><h3 class="scene-title">${state.angle==='limits'?'What should I know before trying it?':'So, what’s happening with Fold?'}</h3><p class="lede">${later?'The appeal is fewer detours. The open question is whether everyone can take part.':'The beta moves comments closer to the work. It is early in the conversation.'}</p><div class="focus-thread">${sections.map(s=>`<article><h4>${s.title}</h4><p>${s.text}</p>${sourceDisclosure(s.ids)}</article>`).join('')}</div><div class="focus-questions"><button type="button" data-action="angle">${state.angle==='limits'?'Back to the whole conversation':'What are the limitations?'}</button><button type="button" data-intent="brief">Back to a quick catch-up</button></div>${completion('Enough context to choose your next step.')}</div>`;
}
function browseView() {
  let pool = eligible().slice().reverse();
  if (isLong()) pool = pool.filter(p=>p.kind==='read');
  // The authored collection is deliberately small; more is an explicit choice.
  const featured = pool.slice(0,3);
  return `<div class="scene-top"><div><p class="eyebrow">An open collection</p><h3 class="scene-title">${isLong()?'A little longer with each thought.':'Follow whatever catches you.'}</h3><p class="scene-intro">${isLong()?'Longer reads from this moment in the sample.':'A few voices. No particular hurry.'}</p></div><button type="button" data-action="reads">${isLong()?'Mix it up':'Longer reads'}</button></div><div class="browse-grid ${isLong()?'reading':''}">${featured.map(p=>`<article class="browse-post" data-post="${p.id}"><p class="eyebrow">${p.topic==='local'?'Around town':p.kind==='read'?'Something to read':'A passing thought'}</p><blockquote>${escapeHTML(p.title)}</blockquote><p>${escapeHTML(p.body)}</p>${isLong() && p.excerpt?`<p class="excerpt">${escapeHTML(p.excerpt)}</p>`:''}<p class="byline">${p.author} · ${p.time}</p><div class="item-actions">${saveButton(p.id)}</div>${sourceDisclosure([p.id])}</article>`).join('')}</div>${completion('Keep what you like. Leave whenever you’re ready.')}`;
}
function releasedView() {
  return `<div class="quiet-state"><p class="eyebrow">This visit is complete</p><h3 class="scene-title">A little space, again.</h3><p>The view is gone. ${state.saved.size?`${state.saved.size} saved post${state.saved.size===1?' is':'s are'} still here.`:'Your preferences are still here.'}</p><button type="button" class="solid-button" data-action="restart">Start another visit</button><button type="button" data-mode="feed">Open the regular feed</button></div>`;
}
function unsupportedView() {
  return '<div class="quiet-state"><p class="eyebrow">Outside this small sketch</p><h3 class="scene-title">Try a different starting point.</h3><p>This demo understands a catch-up, the Fold conversation, or browsing. You can add “only design,” “one minute,” or “longer reads.” It doesn’t infer an answer to other requests.</p><button type="button" class="solid-button" data-intent="brief">Try a catch-up</button></div>';
}
function renderSaved() {
  $('saved-count').textContent=String(state.saved.size);
  $('saved-content').innerHTML=state.saved.size ? [...state.saved].map(id=>{const p=byId.get(id);return `<article class="saved-item"><div><strong>${escapeHTML(p.title)}</strong><p>${p.author} · ${p.time}</p><p>${escapeHTML(p.body)}</p>${p.excerpt?`<p>${escapeHTML(p.excerpt)}</p>`:''}</div><button type="button" data-save="${id}" aria-label="Remove ${escapeHTML(p.title)} from saved">Remove</button></article>`;}).join('')+'<p class="query-help">Saved for this page visit. Refreshing clears this fictional collection.</p>' : '<p>No saved posts yet. Save an original post to keep it after a view ends.</p>';
}
function renderWhy() {
  let reason;
  if(state.mode==='feed') reason='The control shows each available post in reverse time order. The “Only design & tools” preference also applies here, so the comparison uses the same preferred topics.';
  else if(state.released) reason='You ended this visit. The temporary composition was removed. Your preferences and saved posts remain for this page visit.';
  else if(state.unsupported) reason='The query did not match an authored intent. No answer or layout has been invented.';
  else reason={brief:'You asked to catch up. Authored summaries group related posts into a finite briefing. “Keep my brief short” changes the amount of detail; “one minute” narrows it to one development.',focus:'You asked about Fold. A temporary conversation view brings the announcement, available experiences, and qualifications together. It only uses posts available at this sample time.',browse:'You asked to browse. The view offers a loose collection with saving as the next action. “Longer reads” selects posts with full excerpts and gives them a single reading column.'}[state.intent];
  const ids=eligible().map(p=>p.id);
  $('why-panel').innerHTML=`<h3>${state.mode==='feed'?'The same underlying material.':'A request, then a useful shape.'}</h3><p>${reason}</p><p>${designOnly()?'Your design & tools scope includes design and craft posts; local events are left out.':'All interests are eligible: design, craft, and local posts.'} ${available().length} posts exist at this sample time; ${ids.length} match this scope.</p><p>The time buttons load example visits. Your chosen intent overrides their starting point. No browsing habits are observed, and no model is called.</p><p class="source-list">Open original posts beneath each piece, or inspect the full snapshot in the regular feed.</p><button type="button" data-mode="${state.mode==='feed'?'ephemeral':'feed'}">${state.mode==='feed'?'Return to the intent view':'Inspect the regular feed'}</button>`;
}
function render(announce=true) {
  const content = state.mode==='feed'?feedView():state.released?releasedView():state.unsupported?unsupportedView():({brief:briefView,focus:focusView,browse:browseView}[state.intent])();
  $('scene').innerHTML=content;
  $('scene').dataset.format=state.mode==='feed'?'feed':state.released?'released':state.intent;
  $('intent-area').hidden=state.mode==='feed';
  $('visit-context').textContent=visits[state.visit].context;
  $('snapshot-label').textContent=`${available().length} sample posts available`;
  document.querySelectorAll('[data-visit]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.visit===state.visit)));
  document.querySelectorAll('.comparison [data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
  document.querySelectorAll('.intent-choices [data-intent]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.intent===state.intent && !state.released && !state.unsupported)));
  $('format-note').textContent=state.mode==='feed'?'Control · individual posts, latest first':state.released?'Released · saved items remain':state.unsupported?'No matching example':{brief:'Briefing · grouped developments, a clear end',focus:'Conversation · context, qualifications, sources',browse:isLong()?'Reading · fewer pieces, more room':'Collection · room to wander'}[state.intent];
  $('benefit-note').textContent=state.mode==='feed'?'The control leaves the work of grouping, connecting, and choosing when to stop to the reader.':state.released?'The temporary view ends without taking your saved items with it.':state.unsupported?'A bounded example should acknowledge when it cannot understand a request.':{brief:'The user can finish catching up without deciding where an endless feed ends.',focus:'The user can understand a discussion without piecing it together across separate threads.',browse:'The user can follow their curiosity in a layout that gives individual thoughts room.'}[state.intent];
  renderSaved();renderWhy();
  if(announce)$('announcement').textContent=$('format-note').textContent;
}
function selectIntent(intent) {
  state.intent=intent;state.mode='ephemeral';state.released=false;state.unsupported=false;state.design=false;state.one=false;state.long=false;state.angle='overview';
  $('intent-query').value=intentQueries[intent];
  render();
}
function applyQuery() {
  const q=$('intent-query').value.trim().toLowerCase();
  let intent=null;
  if(/catch|brief|missed|what.*changed|update/.test(q))intent='brief';
  else if(/fold|understand|launch|conversation/.test(q))intent='focus';
  else if(/brows|wander|read|interesting|explor/.test(q))intent='browse';
  state.design=/only design|design only|just design|design tools/.test(q);
  state.one=/one minute|1 minute|one thing|just one/.test(q);
  state.long=/longer|long reads|long read/.test(q);
  if(!intent && (state.design || state.one || state.long))intent=state.intent;
  state.mode='ephemeral';state.released=false;state.unsupported=!intent;state.angle='overview';
  if(intent)state.intent=intent;
  render();
}
function focusScene() {
  const title=$('scene').querySelector('h3');
  if(title){title.setAttribute('tabindex','-1');title.focus({preventScroll:true});}
}
function togglePanel(buttonId,panelId) {
  const panel=$(panelId);panel.hidden=!panel.hidden;$(buttonId).setAttribute('aria-expanded',String(!panel.hidden));
}
$('preferences-toggle').addEventListener('click',()=>togglePanel('preferences-toggle','preferences-panel'));
$('saved-toggle').addEventListener('click',()=>togglePanel('saved-toggle','saved-panel'));
$('why-toggle').addEventListener('click',()=>togglePanel('why-toggle','why-panel'));
$('intent-form').addEventListener('submit',event=>{event.preventDefault();applyQuery();});
$('preferences-panel').addEventListener('change',()=>render());

document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button)return;
  const removedFocus=$('scene').contains(button)||$('why-panel').contains(button);
  if(button.dataset.visit){
    state.visit=button.dataset.visit;
    const visit=visits[state.visit];
    const previousMode=state.mode;
    selectIntent(visit.intent);state.mode=previousMode;$('intent-query').value=visit.query;render();
  }else if(button.dataset.mode){state.mode=button.dataset.mode;render();if(removedFocus)focusScene();
  }else if(button.dataset.intent){selectIntent(button.dataset.intent);if(removedFocus)focusScene();
  }else if(button.dataset.save){
    const id=button.dataset.save;
    if(state.saved.has(id))state.saved.delete(id);else state.saved.add(id);
    // Update in place to preserve expanded sources, focus, and reading position.
    document.querySelectorAll(`[data-save="${id}"]`).forEach(b=>{if(!$('saved-panel').contains(b)){b.setAttribute('aria-pressed',String(state.saved.has(id)));b.setAttribute('aria-label',`${state.saved.has(id)?'Unsave':'Save'} ${byId.get(id).title}`);b.textContent=state.saved.has(id)?'Saved ✓':'Save for later';}});
    const fromSaved=$('saved-panel').contains(button);renderSaved();
    if(state.released)render();
    if(fromSaved)$('saved-toggle').focus({preventScroll:true});
    $('announcement').textContent=state.saved.has(id)?'Post saved for this page visit.':'Post removed from saved.';
  }else if(button.dataset.read){
    const paragraph=$(`read-${button.dataset.read}`);paragraph.hidden=!paragraph.hidden;button.setAttribute('aria-expanded',String(!paragraph.hidden));button.textContent=paragraph.hidden?'Read more':'Read less';
  }else if(button.dataset.action){
    switch(button.dataset.action){
      case 'done':state.released=true;$('intent-query').value='';break;
      case 'restart':selectIntent(visits[state.visit].intent);break;
      case 'scope':{const scoped=designOnly();$('design-only').checked=!scoped;state.design=false;break;}
      case 'reads':{const long=isLong();$('reading-first').checked=!long;state.long=false;break;}
      case 'angle':state.angle=state.angle==='overview'?'limits':'overview';break;
      default:return;
    }
    render();focusScene();
  }
});
render(false);
