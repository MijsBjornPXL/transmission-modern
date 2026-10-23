(function(){'use strict';
const $=id=>document.getElementById(id), U=window.TransmissionUI, rpc=new TransmissionRPC();
const storage={getItem(key){try{return localStorage.getItem(key)}catch{return null}},setItem(key,val){try{localStorage.setItem(key,val)}catch{}}};
const FIELDS=['id','name','status','error','error_string','percent_done','rate_download','rate_upload','eta','total_size','size_when_done','downloaded_ever','uploaded_ever','upload_ratio','added_date','activity_date','is_stalled','peers_connected','queue_position'];
const DETAIL_FIELDS=[...FIELDS,'download_dir','peers_sending_to_us','files','peers','tracker_stats'];
let previousRenderSignature='',torrents=[],filter='all',search='',sort='activity',descending=true,viewDesktop=storage.getItem('tm2-desktop-view')||'minimal',viewMobile=storage.getItem('tm2-mobile-view')||'minimal',detailId=null,detailTab='general',selected=new Set(),refreshing=false,lastOk=0,menuId=null,modalClose=null;
const landscapePhone=()=>matchMedia('(orientation:landscape) and (max-height:600px) and (max-width:1024px)').matches;
const mobile=()=>matchMedia('(max-width:760px)').matches||landscapePhone();
function notify(message){const n=$('toast');n.textContent=message;n.hidden=false;clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.hidden=true,3600)}
function showError(err){console.error(err);notify(err.message||String(err))}
function setOnline(ok,err){$('connectionDot').classList.toggle('is-offline',!ok);$('connectionDot').classList.toggle('ok',ok);$('connectionDot').classList.toggle('bad',!ok);$('connectionText').textContent=ok?`${location.host} · Connected`:`${location.host} · Disconnected`; $('offlineBanner').hidden=ok;if(err)$('lastUpdated').textContent=`Last update failed: ${err.message}`}
function value(t,key){return Number(t[key])||0}
function counts(){const c={all:torrents.length,downloading:0,seeding:0,paused:0,completed:0,error:0};for(const t of torrents){if(t.status===4)c.downloading++;if(t.status===6)c.seeding++;if(t.status===0)c.paused++;if(U.completed(t))c.completed++;if(t.error>0)c.error++}return c}
function filtered(){let a=torrents.filter(t=>{if(filter==='downloading'&&t.status!==4)return false;if(filter==='seeding'&&t.status!==6)return false;if(filter==='paused'&&t.status!==0)return false;if(filter==='completed'&&!U.completed(t))return false;if(filter==='error'&&!(t.error>0))return false;return t.name.toLowerCase().includes(search)});const k={name:t=>t.name.toLowerCase(),progress:t=>value(t,'percent_done'),down:t=>value(t,'rate_download'),up:t=>value(t,'rate_upload'),size:t=>value(t,'size_when_done')||value(t,'total_size'),added:t=>value(t,'added_date'),activity:t=>value(t,'rate_download')+value(t,'rate_upload')||value(t,'activity_date')};a.sort((a,b)=>{const x=k[sort](a),y=k[sort](b);return (typeof x==='string'?x.localeCompare(y):x-y)*(descending?-1:1)});return a}
// Keep the existing progress fill node when a 5-second RPC refresh changes a row.
// Recreating it would restart the shimmer and prevent a smooth width transition.
function replaceKeepingProgress(old,html){
 const tpl=document.createElement('template');tpl.innerHTML=html.trim();
 const next=tpl.content.firstElementChild;
 const fill=old.querySelector('.progress-fill');
 const newFill=next.querySelector('.progress-fill');
 if(fill&&newFill){
  const nextWidth=newFill.style.width;
  fill.className=newFill.className;
  newFill.replaceWith(fill);
  old.replaceWith(next);
  fill.style.width=nextWidth;
 }else old.replaceWith(next);
 return next;
}
function render(){
const c=counts();for(const [k,v] of Object.entries(c)){const el=document.querySelector(`[data-count="${k}"]`);if(el)el.textContent=v}
$('totalChip').textContent=torrents.length;
const a=filtered();$('showingCount').textContent=`Showing ${a.length} of ${torrents.length} torrents`;
const desktop=viewDesktop==='minimal',phone=landscapePhone()||viewMobile==='minimal';
const signature=[mobile()?'mobile':'desktop',landscapePhone()?'landscape':'regular',desktop?'table':'cards',phone?'compact':'cards',sort,descending?'desc':'asc',...a.map(t=>t.id)].join('|');
const container=$('torrentContainer');
if(signature!==previousRenderSignature){
  container.innerHTML=`<div class="desktop-visible">${desktop?U.tableHead(sort,descending):'<div class="torrent-cards">'+a.map(U.card).join('')+'</div>'}</div><div class="mobile-visible">${phone?'<div class="mobile-compact">'+a.map(U.compact).join('')+'</div>':'<div class="torrent-cards">'+a.map(U.card).join('')+'</div>'}</div>`;
  previousRenderSignature=signature;
}
if(desktop){
 const body=$('tableBody');if(body){
  for(const t of a){
   let row=body.querySelector(`tr[data-id="${t.id}"]`);
   const html=U.tableRow(t,selected.has(t.id));
   if(!row){body.insertAdjacentHTML('beforeend',html);row=body.lastElementChild}
   else if(row.outerHTML!==html)row=replaceKeepingProgress(row,html);
  }
  for(const row of body.querySelectorAll('tr[data-id]'))if(!a.some(t=>t.id===Number(row.dataset.id)))row.remove();
  for(const t of a){const row=body.querySelector(`tr[data-id="${t.id}"]`);if(row)body.appendChild(row)}
 }
 const all=$('selectAll');if(all)all.checked=a.length>0&&a.every(t=>selected.has(t.id));
}
// Update existing cards individually instead of discarding the entire grid every 5 seconds.
const cardsRoot=container.querySelector('.desktop-visible .torrent-cards');if(cardsRoot){for(const t of a){const old=cardsRoot.querySelector(`.torrent-card[data-id="${t.id}"]`),html=U.card(t);if(old&&old.outerHTML!==html)replaceKeepingProgress(old,html)}}
const mobRoot=container.querySelector('.mobile-visible');if(mobRoot){const kind=phone?'.compact-torrent':'.torrent-card';for(const t of a){const old=mobRoot.querySelector(`${kind}[data-id="${t.id}"]`),html=phone?U.compact(t):U.card(t);if(old&&old.outerHTML!==html)replaceKeepingProgress(old,html)}}
const empty=container.querySelector('.empty-state');if(!a.length&&!empty)container.insertAdjacentHTML('beforeend',`<div class="empty-state"><strong>${torrents.length?'No matching torrents':'No torrents yet'}</strong><p>${torrents.length?'Try another filter or search.':'Add a magnet link or a .torrent file to begin.'}</p></div>`);
if(a.length&&empty)empty.remove();
$('viewMinimal').classList.toggle('is-active',mobile()?phone:desktop);$('viewCards').classList.toggle('is-active',mobile()?!phone:!desktop);
$('viewMinimal').setAttribute('aria-pressed',String(mobile()?phone:desktop));$('viewCards').setAttribute('aria-pressed',String(mobile()?!phone:!desktop));$('bulkBar').hidden=!selected.size;$('selectedCount').textContent=`${selected.size} selected`;
}
async function refresh(){if(refreshing)return;refreshing=true;try{const [a,s]=await Promise.all([rpc.list(FIELDS),rpc.call('session_stats')]);torrents=a.torrents||[];selected=new Set([...selected].filter(id=>torrents.some(t=>t.id===id)));$('statDownload').textContent=U.rate(s.download_speed||0);$('statUpload').textContent=U.rate(s.upload_speed||0);$('statActive').textContent=s.active_torrent_count??torrents.filter(t=>t.status!==0).length;$('statTotal').textContent=s.torrent_count??torrents.length;$('serverVersion').textContent=rpc.version;lastOk=Date.now();$('lastUpdated').textContent=`Updated ${new Date().toLocaleTimeString()}`;setOnline(true);if(!$('modalBackdrop').hidden||!$('detailSheet').hidden||!$('contextMenu').hidden){/* keep active dialogs and menus */}render()}catch(err){setOnline(false,err);if(!lastOk)$('torrentContainer').innerHTML=`<div class="empty-state"><strong>Cannot connect to Transmission</strong><p>${U.e(err.message)}</p></div>`}finally{refreshing=false}}
async function action(method,args={},message='Action completed'){try{await rpc.call(method,args);notify(message);await refresh();return true}catch(err){showError(err);return false}}
function closeModal(){$('modalBackdrop').hidden=true;modalClose=null}
function openModal(title,content,buttons){$('modalTitle').textContent=title;$('modalContent').innerHTML=content;$('modalActions').innerHTML='';for(const b of buttons){const el=document.createElement('button');el.className='button '+(b.className||'');el.textContent=b.text;el.addEventListener('click',b.click);$('modalActions').appendChild(el)}$('modalBackdrop').hidden=false;modalClose=closeModal}
function addTorrent(){openModal('Add torrent',`<form id="addTorrentForm"><label class="field-label" for="magnetInput">Magnet link or torrent URL</label><textarea id="magnetInput" rows="3" placeholder="magnet:?xt=urn:btih:… or https://…"></textarea><div class="form-divider">or choose a torrent file</div><label class="field-label" for="torrentFile">.torrent file</label><input id="torrentFile" type="file" accept=".torrent,application/x-bittorrent"><label class="field-label" for="downloadDir">Download directory (optional)</label><input id="downloadDir" type="text" placeholder="Use Transmission default"><label class="checkbox-label"><input id="addPaused" type="checkbox"> Add paused</label></form>`,[{text:'Cancel',click:closeModal},{text:'Add torrent',className:'primary',click:async()=>{const file=$('torrentFile').files[0],link=$('magnetInput').value.trim(),dir=$('downloadDir').value.trim();if(!file&&!link){notify('Paste a link or select a .torrent file');return}try{const args={paused:$('addPaused').checked};if(dir)args.download_dir=dir;if(file){const buf=await file.arrayBuffer();const bytes=new Uint8Array(buf);let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));args.metainfo=btoa(binary)}else args.filename=link;const result=await rpc.call('torrent_add',args);closeModal();notify(result['torrent-duplicate']||result.torrent_duplicate?'Torrent already exists':'Torrent added');await refresh()}catch(e){showError(e)}}}]);}
function confirmRemove(ids){const many=ids.length>1;openModal('Remove torrent'+(many?'s':''),`<p>Remove ${many?ids.length+' selected torrents':'this torrent'} from Transmission?</p><label class="checkbox-label"><input id="deleteData" type="checkbox"> Also delete downloaded data from disk</label><p class="warning-text">Deleting downloaded data cannot be undone.</p>`,[{text:'Cancel',click:closeModal},{text:'Remove',className:'danger-outline',click:async()=>{const del=$('deleteData').checked;if(await action('torrent_remove',{ids,delete_local_data:del},'Torrent removed')){ids.forEach(id=>selected.delete(id));closeModal();closeDetails();render()}}}])}
function closeDetails(){$('detailSheet').hidden=true;$('sheetBackdrop').hidden=true;$('detailSheet').setAttribute('aria-hidden','true');detailId=null}
async function details(id,tab='general'){detailId=id;detailTab=tab;$('sheetBackdrop').hidden=false;$('detailSheet').hidden=false;$('detailSheet').setAttribute('aria-hidden','false');$('detailBody').innerHTML='<p class="subdued">Loading details…</p>';const basic=torrents.find(t=>t.id===id);$('detailTitle').textContent=basic?.name||'Torrent';for(const b of document.querySelectorAll('[data-detail-tab]')){b.classList.toggle('is-active',b.dataset.detailTab===tab);b.setAttribute('aria-selected',String(b.dataset.detailTab===tab))}try{const response=await rpc.details([id],DETAIL_FIELDS),t=response.torrents?.[0];if(!t)throw Error('Torrent not found');$('detailTitle').textContent=t.name;const display={general:U.detailGeneral,files:U.detailFiles,peers:U.detailPeers,trackers:U.detailTrackers};$('detailBody').innerHTML=display[tab](t);$('detailPause').textContent=t.status===0?'Resume':'Pause';$('detailPause').onclick=async()=>{await action(t.status===0?'torrent_start':'torrent_stop',{ids:[id]});if(detailId===id)details(id,tab)};$('detailRemove').onclick=()=>confirmRemove([id])}catch(e){$('detailBody').textContent='Could not load details: '+e.message}}
function closeMenu(){$('contextMenu').hidden=true;menuId=null}
function menu(id,anchor){if(menuId===id&&!$('contextMenu').hidden){closeMenu();return}const t=torrents.find(t=>t.id===id);if(!t)return;menuId=id;const m=$('contextMenu');m.innerHTML=`<button data-menu="details">Details</button><button data-menu="${t.status===0?'start':'stop'}">${t.status===0?'Resume':'Pause'}</button><button data-menu="verify">Verify local data</button><button data-menu="remove" class="danger-text">Remove torrent</button>`;m.hidden=false;const r=anchor.getBoundingClientRect();m.style.left=Math.max(8,Math.min(innerWidth-m.offsetWidth-8,r.right-m.offsetWidth))+'px';m.style.top=Math.min(innerHeight-m.offsetHeight-8,r.bottom+5)+'px'}
function setSort(s){if(sort===s)descending=!descending;else{sort=s;descending=s!=='name'}$('sortSelect').value=s;render()}
document.addEventListener('click',async ev=>{const target=ev.target.closest('[data-action]');if(target){const id=Number(target.dataset.id),type=target.dataset.action;if(type==='details')details(id);else if(type==='menu')menu(id,target);else if(type==='start'||type==='stop')await action('torrent_'+type,{ids:[id]});return}const m=ev.target.closest('[data-menu]');if(m){const id=menuId,type=m.dataset.menu;closeMenu();if(type==='details')details(id);else if(type==='remove')confirmRemove([id]);else await action('torrent_'+(type==='verify'?'verify':type),{ids:[id]});return}if(!ev.target.closest('#contextMenu'))closeMenu();const th=ev.target.closest('[data-sort]');if(th)setSort(th.dataset.sort);const f=ev.target.closest('[data-filter]');if(f){filter=f.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('is-active',b===f);b.setAttribute('aria-pressed',String(b===f))});render()}const bulk=ev.target.closest('[data-bulk]');if(bulk){const ids=[...selected];if(bulk.dataset.bulk==='clear'){selected.clear();render()}else if(bulk.dataset.bulk==='remove')confirmRemove(ids);else await action('torrent_'+bulk.dataset.bulk,{ids})}});
document.addEventListener('change',ev=>{if(ev.target.matches('[data-select]')){const id=Number(ev.target.dataset.select);ev.target.checked?selected.add(id):selected.delete(id);render()}if(ev.target.id==='selectAll'){for(const t of filtered())ev.target.checked?selected.add(t.id):selected.delete(t.id);render()}});
$('searchInput').addEventListener('input',ev=>{search=ev.target.value.trim().toLowerCase();render()});$('sortSelect').addEventListener('change',ev=>setSort(ev.target.value));$('viewMinimal').onclick=()=>{if(mobile()){viewMobile='minimal';storage.setItem('tm2-mobile-view',viewMobile)}else{viewDesktop='minimal';storage.setItem('tm2-desktop-view',viewDesktop)}render()};$('viewCards').onclick=()=>{if(landscapePhone())return;if(mobile()){viewMobile='cards';storage.setItem('tm2-mobile-view',viewMobile)}else{viewDesktop='cards';storage.setItem('tm2-desktop-view',viewDesktop)}render()};$('addButton').onclick=addTorrent;document.addEventListener('submit',e=>{if(e.target.id==='addTorrentForm')e.preventDefault()});$('refreshButton').onclick=refresh;$('retryButton').onclick=refresh;$('closeDetails').onclick=closeDetails;$('sheetBackdrop').onclick=closeDetails;$('modalX').onclick=closeModal;$('modalBackdrop').addEventListener('click',e=>{if(e.target===$('modalBackdrop'))closeModal()});document.querySelectorAll('[data-detail-tab]').forEach(b=>b.onclick=()=>{if(detailId!==null)details(detailId,b.dataset.detailTab)});document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();closeDetails();closeModal()}if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();$('searchInput').focus()}});addEventListener('resize',()=>{closeMenu();render()});
refresh();setInterval(()=>{if(!document.hidden)refresh()},5000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
})();
