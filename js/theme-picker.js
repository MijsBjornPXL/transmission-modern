(function(){'use strict';
const KEY='transmission-modern-theme';
const THEMES=['blue','violet','emerald','sunset','obsidian','graphite','pearl','aurora'];
let current='blue';
try{const stored=localStorage.getItem(KEY);if(THEMES.includes(stored))current=stored;else if(stored==='cyan')current='blue';else if(stored==='rose')current='violet'}catch{}
const root=document.documentElement;
root.dataset.theme=current;
const dialog=document.getElementById('themeDialog');
const trigger=document.getElementById('themeButton');
const close=document.getElementById('themeClose');
if(!dialog||!trigger||!close)return;
function sync(){dialog.querySelectorAll('[data-theme-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeChoice===current)));trigger.title='Color theme: '+current+' (change)'}
function apply(value){if(!THEMES.includes(value))return;current=value;root.dataset.theme=value;try{localStorage.setItem(KEY,value)}catch{};sync()}
sync();
trigger.addEventListener('click',()=>{sync();if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');});
close.addEventListener('click',()=>dialog.close());
dialog.querySelectorAll('[data-theme-choice]').forEach(button=>button.addEventListener('click',()=>{apply(button.dataset.themeChoice);dialog.close();trigger.focus()}));
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}});
})();
