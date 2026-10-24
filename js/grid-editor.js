/* Transmission Modern v2.8.4 — a single editable grid for statistics and individual torrents.
   All preferences remain in this browser; no extra server or external dependencies. */
(()=>{'use strict';
const grid=document.getElementById('dashboardGrid'),editButton=document.getElementById('editDashboard');
const toolbar=document.getElementById('gridToolbar'),visibility=document.getElementById('gridVisibility');
if(!grid||!editButton||!toolbar||!visibility)return;
const statNames={'library-search':'Search','library-filters':'Filters & sorting',download:'Download',upload:'Upload',active:'Active',total:'Total'};
const controlIds=['library-search','library-filters'];
const stats=Object.keys(statNames),elements=new Map(stats.map(id=>[id,grid.querySelector(`[data-tile="${id}"]`)]));
const mobileQuery=matchMedia('(max-width:760px), (orientation:landscape) and (max-height:600px) and (max-width:1024px)');
let isMobile=mobileQuery.matches,editing=false,snapshot=null,layout=[],activePointer=null,manualOrder=false;
let displayed=new Set(),torrentNames=new Map(),lastTorrents=[],visibilitySignature="";
const storeKey=()=>`tm-grid-v283-${isMobile?'mobile':'desktop'}`;
const oldKeys=()=>[`tm-grid-v282-${isMobile?'mobile':'desktop'}`,`tm-grid-v28-${isMobile?'mobile':'desktop'}`];
const limits=()=>isMobile?4:12;
const torrentId=t=>'torrent:'+String(t.hash_string||'id-'+t.id).toLowerCase();
const isTorrent=id=>/^torrent:(?:[a-f0-9]{40}|id-\d+)$/.test(id);
const valid=id=>stats.includes(id)||isTorrent(id);
const label=id=>statNames[id]||torrentNames.get(id)||'Torrent';
const defaultItem=id=>({id,span:id==='library-search'?(isMobile?4:7):id==='library-filters'?(isMobile?4:5):(stats.includes(id)?(isMobile?1:3):(isMobile?4:6)),height:controlIds.includes(id)?(isMobile?65:64):(stats.includes(id)?(isMobile?60:80):180),visible:true});
const defaults=()=>stats.map(defaultItem);
const minHeight=id=>controlIds.includes(id)?56:stats.includes(id)?60:120;
const maxHeight=id=>controlIds.includes(id)?500:stats.includes(id)?600:1200;
function normalize(input){
 const map=new Map(),order=[];
 if(Array.isArray(input))for(const v of input){
  if(!v||typeof v.id!=='string')continue;
  if(v.id==='library-tools'){for(const id of controlIds){if(!map.has(id)){map.set(id,{...defaultItem(id),visible:v.visible!==false});order.push(id)}}continue}
  if(valid(v.id)&&!map.has(v.id)){map.set(v.id,v);order.push(v.id)}
 }
 // Include missing statistics once, ahead of any previously saved torrent tiles.
 const missing=stats.filter(id=>!map.has(id));const ordered=[...missing,...order];
 return ordered.map(id=>{const d=defaultItem(id),v=map.get(id)||d;return {
  id,span:Math.max(1,Math.min(limits(),Number.isFinite(+v.span)?Math.round(+v.span):d.span)),
  height:Math.max(minHeight(id),Math.min(maxHeight(id),Number.isFinite(+v.height)?Math.round(+v.height):d.height)),
  visible:v.visible!==false
 }});
}
function load(){
 try{const saved=localStorage.getItem(storeKey());if(saved){const parsed=JSON.parse(saved);manualOrder=parsed.manualOrder===true;return normalize(parsed.tiles||parsed)}}catch{}
 for(const key of oldKeys())try{const legacy=JSON.parse(localStorage.getItem(key)||'null');if(legacy){manualOrder=legacy.manualOrder===true;return normalize(legacy.tiles||legacy)}}catch{}
 return defaults();
}
function persist(){try{localStorage.setItem(storeKey(),JSON.stringify({tiles:layout,manualOrder}))}catch{}}
function sync(){
 layout=normalize(layout);
 let index=0;
 for(const item of layout){const el=elements.get(item.id);if(!el)continue;
  if(grid.children[index]!==el)grid.insertBefore(el,grid.children[index]||null);
  index++;
  el.style.setProperty('--tile-span',item.span);el.style.setProperty('--tile-height',item.height+'px');
  const shown=item.visible&&(stats.includes(item.id)||displayed.has(item.id));
  el.hidden=!shown;el.classList.toggle('grid-hidden',!shown);el.classList.toggle('grid-editing',editing);
  const size=el.querySelector('.grid-tile-size');if(size)size.textContent=`${item.span}/${limits()} · ${item.height}px`;
 }
 for(const input of visibility.querySelectorAll('input[data-visible]'))input.checked=layout.find(t=>t.id===input.dataset.visible)?.visible!==false;
}
function rebuildVisibility(){
 visibilitySignature=[...layout].filter(t=>elements.has(t.id)).map(t=>t.id).join("|");
 visibility.replaceChildren();
 for(const item of layout){if(!elements.has(item.id))continue;
  const wrap=document.createElement('label'),input=document.createElement('input');
  input.type='checkbox';input.dataset.visible=item.id;input.checked=item.visible;
  wrap.title=label(item.id);wrap.append(input,document.createTextNode(label(item.id)));
  visibility.appendChild(wrap);
 }
}
function setEditing(value){
 if(value===editing)return;
 editing=value;grid.classList.toggle('is-editing',editing);toolbar.hidden=!editing;
 editButton.setAttribute('aria-pressed',String(editing));
 editButton.setAttribute('aria-label',editing?'Finish editing dashboard':'Customize dashboard');
 editButton.title=editing?'Save or cancel your dashboard changes':'Customize dashboard';
 if(editing){snapshot=JSON.stringify({tiles:layout,manualOrder});rebuildVisibility()}
 else{visibility.replaceChildren();clearDrag()}
 sync();
}
function save(){persist();setEditing(false)}
function cancel(){if(snapshot){try{const p=JSON.parse(snapshot);layout=normalize(p.tiles);manualOrder=p.manualOrder===true}catch{layout=defaults()}}setEditing(false)}
function updateItem(id,patch){layout=layout.map(t=>t.id===id?{...t,...patch}:t);sync()}
function reorder(source,target,after=false){
 if(source===target)return;
 const old=layout.findIndex(t=>t.id===source),to=layout.findIndex(t=>t.id===target);if(old<0||to<0)return;
 const arr=layout.slice(),[moving]=arr.splice(old,1),index=arr.findIndex(t=>t.id===target);
 arr.splice(index+(after?1:0),0,moving);layout=arr;manualOrder=true;sync();
}
function animateReflow(previous,except){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 for(const el of elements.values()){
  if(el===except||el.hidden)continue;
  const before=previous.get(el),after=el.getBoundingClientRect();if(!before)continue;
  const dx=before.left-after.left,dy=before.top-after.top;
  if(Math.abs(dx)<1&&Math.abs(dy)<1)continue;
  el.getAnimations().filter(a=>a.effect?.getKeyframes?.().some(k=>k.transform)).forEach(a=>a.cancel());
  el.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}],{duration:115,easing:'cubic-bezier(.18,.85,.25,1)'});
 }
}
function liveReorder(source,target,after){
 const before=layout.map(t=>t.id).join('|');
 const positions=new Map([...elements.values()].map(el=>[el,el.getBoundingClientRect()]));
 reorder(source,target,after);
 if(layout.map(t=>t.id).join('|')!==before)animateReflow(positions,elements.get(source));
}
function clearDrag(){
 const d=activePointer;if(d?.element)d.element.classList.remove('grid-dragging','grid-drag-placeholder');
 if(d?.ghost)d.ghost.remove();grid.querySelectorAll('.grid-drop-target').forEach(el=>el.classList.remove('grid-drop-target'));
 activePointer=null;
}
function startPreview(d){
 const rect=d.element.getBoundingClientRect(),ghost=document.createElement('div');
 // Never clone a live torrent card: that would duplicate its controls and DOM state.
 ghost.className='grid-drag-preview grid-preview-title';ghost.textContent=label(d.id);
 ghost.style.width=rect.width+'px';ghost.style.height=rect.height+'px';
 ghost.style.left=rect.left+'px';ghost.style.top=rect.top+'px';
 ghost.setAttribute('aria-hidden','true');document.body.appendChild(ghost);
 d.ghost=ghost;d.element.classList.add('grid-drag-placeholder','grid-dragging');
}
function createControls(id){
 const el=elements.get(id),wrap=document.createElement('div'),handle=document.createElement('button'),size=document.createElement('span'),resize=document.createElement('button');
 wrap.className='grid-tile-controls';handle.className='grid-tile-drag';handle.type='button';handle.textContent='⠿ Drag';
 handle.title=`Drag ${label(id)} to reposition; arrow keys also work.`;handle.setAttribute('aria-label',`Move ${label(id)}`);
 size.className='grid-tile-size';resize.className='grid-tile-resize';resize.type='button';resize.textContent='◢';
 resize.title=`Drag to resize ${label(id)}`;resize.setAttribute('aria-label',`Resize ${label(id)}`);
 wrap.append(handle,size);el.insertBefore(wrap,el.firstChild);el.appendChild(resize);
 handle.addEventListener('keydown',ev=>{
  if(!editing||!['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(ev.key))return;
  ev.preventDefault();const pos=layout.findIndex(t=>t.id===id),offset=['ArrowLeft','ArrowUp'].includes(ev.key)?-1:1,other=layout[pos+offset];
  if(other){reorder(id,other.id,offset>0);handle.focus()}
 });
 el.addEventListener('pointerdown',ev=>{
  if(!editing||ev.button!==0||activePointer)return;
  if(ev.target.closest('.grid-tile-resize'))return;
  const interactive=ev.target.closest('button,input,select,textarea,a,[role="button"]');
  if(interactive&&!ev.target.closest('.grid-tile-drag'))return;
  ev.preventDefault();activePointer={type:'move',id,element:el,pointerId:ev.pointerId,startX:ev.clientX,startY:ev.clientY,moved:false};
 });
 resize.addEventListener('pointerdown',ev=>{
  if(!editing||ev.button!==0||activePointer)return;
  ev.preventDefault();ev.stopPropagation();const item=layout.find(t=>t.id===id);
  activePointer={type:'resize',id,element:el,pointerId:ev.pointerId,startX:ev.clientX,startY:ev.clientY,span:item.span,height:item.height,moved:false};
 });
}
document.addEventListener('pointermove',ev=>{
 const d=activePointer;if(!d||!editing||d.pointerId!==ev.pointerId)return;
 if(!d.moved&&Math.hypot(ev.clientX-d.startX,ev.clientY-d.startY)<5)return;
 ev.preventDefault();d.moved=true;
 if(d.type==='move'){
  if(!d.ghost)startPreview(d);
  d.ghost.style.transform=`translate3d(${ev.clientX-d.startX}px,${ev.clientY-d.startY}px,0)`;
  const hit=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('[data-tile]');
  const target=hit&&hit!==d.element&&elements.get(hit.dataset.tile)===hit&&!hit.hidden?hit:null;
  grid.querySelectorAll('.grid-drop-target').forEach(el=>el.classList.remove('grid-drop-target'));
  if(target){
   target.classList.add('grid-drop-target');const rect=target.getBoundingClientRect(),src=d.element.getBoundingClientRect();
   const sameRow=Math.abs(src.top-rect.top)<Math.min(src.height,rect.height)*.5;
   const after=sameRow?ev.clientX>rect.left+rect.width/2:ev.clientY>rect.top+rect.height/2;
   const key=target.dataset.tile+':'+after;
   if(key!==d.lastTarget&&performance.now()-(d.lastSwap||0)>35){liveReorder(d.id,target.dataset.tile,after);d.lastTarget=key;d.lastSwap=performance.now()}
  }else d.lastTarget=null;
 }else{
  const gap=isMobile?7:13,col=(grid.getBoundingClientRect().width-(limits()-1)*gap)/limits()+gap;
  const span=Math.max(1,Math.min(limits(),d.span+Math.round((ev.clientX-d.startX)/Math.max(col,1))));
  const height=Math.max(minHeight(d.id),Math.min(maxHeight(d.id),d.height+Math.round((ev.clientY-d.startY)/20)*20));
  updateItem(d.id,{span,height});
 }
},{passive:false});
document.addEventListener('pointerup',ev=>{if(activePointer?.pointerId===ev.pointerId)clearDrag()});
document.addEventListener('pointercancel',clearDrag);window.addEventListener('blur',clearDrag);
function setTorrents(torrents,{view='cards',selected=new Set()}={}){
 lastTorrents=torrents;displayed=new Set();
 for(const t of torrents){
  const id=torrentId(t);if(!valid(id))continue;
  displayed.add(id);torrentNames.set(id,t.name||'Torrent');
  let el=elements.get(id);
  if(!el){
   el=document.createElement('div');el.className='dashboard-tile torrent-dashboard-tile';el.dataset.tile=id;
   el.innerHTML='<div class="torrent-tile-select"><input class="torrent-checkbox" type="checkbox"><span>Select</span></div><div class="torrent-tile-content"></div>';
   const input=el.querySelector('input');input.dataset.select=t.id;input.setAttribute('aria-label',`Select ${t.name}`);
   elements.set(id,el);grid.appendChild(el);createControls(id);
  }
  const check=el.querySelector('.torrent-tile-select input');check.dataset.select=t.id;check.checked=selected.has(t.id);
  const html=view==='minimal'?window.TransmissionUI.compact(t):window.TransmissionUI.card(t);
  const content=el.querySelector('.torrent-tile-content');
  if(el._renderedHTML!==html||el._view!==view){
   const old=content.firstElementChild;
   if(old){const template=document.createElement('template');template.innerHTML=html.trim();const next=template.content.firstElementChild;
    const fill=old.querySelector('.progress-fill'),newFill=next.querySelector('.progress-fill');
    if(fill&&newFill){const width=newFill.style.width;fill.className=newFill.className;newFill.replaceWith(fill);old.replaceWith(next);fill.style.width=width}
    else old.replaceWith(next);
   }else content.innerHTML=html;
   el._renderedHTML=html;el._view=view;
  }
  el.classList.toggle('is-minimal',view==='minimal');el.classList.toggle('is-cards',view!=='minimal');
  if(!layout.some(x=>x.id===id))layout.push(defaultItem(id));
 }
 for(const [id,el] of elements){if(isTorrent(id)&&!displayed.has(id)){el.remove();elements.delete(id)}}
 // Before a manual drag, the selected sort order also determines the torrent tile order.
 if(!manualOrder&&!editing){const newOrder=torrents.map(torrentId);const statItems=layout.filter(t=>stats.includes(t.id));
  const current=new Map(layout.map(t=>[t.id,t]));const visibleItems=newOrder.map(id=>current.get(id)).filter(Boolean);
  const stale=layout.filter(t=>isTorrent(t.id)&&!displayed.has(t.id));layout=[...statItems,...visibleItems,...stale];
 }
 if(editing&&visibilitySignature!==layout.filter(t=>elements.has(t.id)).map(t=>t.id).join("|"))rebuildVisibility();sync();
}
for(const id of stats)createControls(id);
visibility.addEventListener('change',ev=>{const id=ev.target?.dataset?.visible;if(editing&&valid(id))updateItem(id,{visible:ev.target.checked})});
editButton.addEventListener('click',()=>editing?save():setEditing(true));
document.getElementById('gridSave').addEventListener('click',save);
document.getElementById('gridCancel').addEventListener('click',cancel);
document.getElementById('gridReset').addEventListener('click',()=>{manualOrder=false;layout=defaults();for(const t of lastTorrents){const id=torrentId(t);if(valid(id))layout.push(defaultItem(id))}rebuildVisibility();sync()});
mobileQuery.addEventListener('change',ev=>{if(editing)cancel();isMobile=ev.matches;layout=load();for(const t of lastTorrents){const id=torrentId(t);if(valid(id)&&!layout.some(x=>x.id===id))layout.push(defaultItem(id))}sync()});
layout=load();sync();
window.TransmissionGrid={setTorrents};
})();
