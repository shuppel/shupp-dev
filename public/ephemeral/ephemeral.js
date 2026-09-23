/* global document */
const $ = id => document.getElementById(id);
function renderSpecimenBrief(value) {
  const q=value.toLowerCase();
  const one=/one|1|just/.test(q);
  const supported=one || /catch|brief|three|3|update/.test(q);
  $('specimen-results').innerHTML=supported ? ['Fold beta','Less interface','Open studio'].slice(0,one?1:3).map((title,i)=>`<span><i>0${i+1}</i>${title}</span>`).join('') : '<span>Try “catch me up” or “one thing.”</span>';
  document.querySelectorAll('[data-spec-query]').forEach(button=>button.setAttribute('aria-pressed',String(supported && /one/i.test(button.dataset.specQuery)===one)));
}
$('specimen-form').addEventListener('submit',event=>{event.preventDefault();renderSpecimenBrief($('specimen-query').value);});
document.querySelectorAll('[data-spec-query]').forEach(button=>button.addEventListener('click',()=>{$('specimen-query').value=button.dataset.specQuery;renderSpecimenBrief(button.dataset.specQuery);}));
function renderPreferenceSpecimen() {
  const short=$('specimen-short').checked,design=$('specimen-design').checked;
  const items=design?['Fold beta','Less interface']:['Fold beta','Less interface','Open studio'];
  $('preference-preview').innerHTML=`<span class="tag yellow">${short?'Brief':'Expanded'}</span><span>${design?'Design & tools':'All interests'} · ${items.length} pieces${short?'':`<br />${items.join(' / ')}`}</span>`;
}
$('specimen-short').addEventListener('change',renderPreferenceSpecimen);
$('specimen-design').addEventListener('change',renderPreferenceSpecimen);
$('specimen-save').addEventListener('click',()=>{
  const saved=$('specimen-save').getAttribute('aria-pressed')!=='true';
  $('specimen-save').setAttribute('aria-pressed',String(saved));
  $('specimen-save').setAttribute('aria-label',saved?'Unsave example post':'Save example post');
  $('specimen-save-status').textContent=saved?'Saved for this page visit.':'Save for this page visit.';
  $('specimen-kept').textContent=saved?'Your saved thought stays.':'Your preferences stay.';
});
$('specimen-dismiss').addEventListener('click',()=>{
  $('specimen-complete').hidden=true;$('specimen-empty').hidden=false;
  $('specimen-release-status').textContent='View released. Your saved thought and preferences stay.';
  $('specimen-restore').focus({preventScroll:true});
});
$('specimen-restore').addEventListener('click',()=>{
  $('specimen-complete').hidden=false;$('specimen-empty').hidden=true;
  $('specimen-release-status').textContent='Completion view restored.';
  $('specimen-dismiss').focus({preventScroll:true});
});
