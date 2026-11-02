(() => {
  const root = document.querySelector('[data-gallery-root]');
  if (!root) return;
  const reviewNode = document.getElementById('gallery-review-data');
  const data = reviewNode ? JSON.parse(reviewNode.textContent) : null;
  const trips = data ? data.trips : [];
  const storageKey = 'qzy-gallery-review-v3';
  let state = {photos:{},trips:{}};
  try { state = {...state,...JSON.parse(localStorage.getItem(storageKey)||'{}')}; } catch (_) {}
  if(location.protocol==='file:'&&location.hash.startsWith('#review=')){
    try {state={...state,...JSON.parse(decodeURIComponent(location.hash.slice(8)))};}catch(_){}
  }
  const save = () => { try {localStorage.setItem(storageKey,JSON.stringify(state));} catch (_) {} };
  save();
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');
    if(data&&location.protocol==='file:'&&a&&a.getAttribute('href').match(/^(?:\.\.\/)?(?:gallery-preview\.html|trips\/[^#]+\.html)(?:#.*)?$/)){
      a.href=a.href.split('#')[0]+'#review='+encodeURIComponent(JSON.stringify(state));
    }
  });
  const photoState = p => ({...p,...state.photos[p.id]});
  const tripState = t => ({...t,...state.trips[t.id]});
  const displayPlace = (p,t) => state.trips[t.id]?.place || p.place || t.place;
  const figureFor = (p,t) => {
    const f=document.createElement('figure');f.className='album-photo';f.dataset.photoId=p.id;
    const a=document.createElement('a');a.href=p.src;a.dataset.galleryPhoto='';a.dataset.caption=`${p.date} · ${displayPlace(p,t)}`;a.setAttribute('aria-label',`Enlarge: ${p.alt}`);
    const img=document.createElement('img');img.src=p.thumb;img.srcset=p.srcset;img.sizes='(max-width:640px) 90vw,300px';img.alt=p.alt;img.width=p.width;img.height=p.height;img.loading='lazy';img.decoding='async';a.append(img);
    const caption=document.createElement('figcaption');caption.textContent=`${p.date} · ${displayPlace(p,t)}`;f.append(a,caption);return f;
  };
  const updateHome = () => {
    if (!data || !root.hasAttribute('data-gallery-home')) return;
    let retained=0;
    trips.forEach(original => {
      const t=tripState(original),card=root.querySelector(`[data-trip-id="${t.id}"]`);if(!card)return;
      const kept=t.photos.map(photoState).filter(p=>p.keep),featured=kept.filter(p=>p.featured);retained+=kept.length;
      card.querySelector('[data-trip-place]').textContent=t.place;card.querySelector('[data-trip-date]').textContent=t.date;
      card.querySelector('[data-trip-count]').textContent=`${kept.length} photographs`;
      const grid=card.querySelector('[data-photo-group]');grid.replaceChildren(...featured.map(p=>figureFor(p,t)));
      const cover=featured.find(p=>p.id===t.cover_id)||featured[0]||kept[0];if(cover){const img=card.querySelector('.album-cover');img.src=cover.thumb;img.srcset=cover.srcset;img.alt=t.place;}
    });
    const total=root.querySelector('[data-gallery-count]');if(total)total.textContent=`${trips.length} trips · ${retained} photographs`;
  };
  const updateTrip = () => {
    if (!data || !root.hasAttribute('data-gallery-trip')) return;
    const t=tripState(trips[0]),all=root.querySelector('[data-show-all]')?.checked;let kept=0;
    root.querySelector('[data-edit-place]').value=t.place;root.querySelector('[data-edit-date]').value=t.date;
    root.querySelectorAll('[data-trip-place]').forEach(e=>e.textContent=t.place);root.querySelectorAll('[data-trip-date]').forEach(e=>e.textContent=t.date);
    t.photos.forEach(original => {
      const p=photoState(original),f=root.querySelector(`[data-photo-id="${p.id}"]`);if(!f)return;
      if(p.keep)kept++;f.hidden=!all&&!p.keep;f.classList.toggle('is-rejected',!p.keep);
      const k=f.querySelector('[data-keep]'),s=f.querySelector('[data-featured]');if(k)k.checked=p.keep;if(s)s.checked=p.featured;
      const a=f.querySelector('[data-gallery-photo]');a.dataset.caption=`${p.date} · ${displayPlace(p,t)}`;
      f.querySelector('figcaption').textContent=a.dataset.caption;
    });
    const count=root.querySelector('[data-trip-total]');if(count)count.textContent=`${kept} photographs`;
  };
  root.querySelectorAll('[data-year-filter]').forEach(button=>button.addEventListener('click',()=>{
    root.querySelectorAll('[data-year-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    root.querySelectorAll('.travel-album').forEach(a=>{
      const t=trips.find(t=>t.id===a.dataset.tripId),year=button.dataset.yearFilter;
      a.hidden=year!=='all'&&(t ? !(t.first_date.slice(0,4)<=year&&t.last_date.slice(0,4)>=year) : a.dataset.year!==year);
    });
    const visible=[...root.querySelectorAll('.travel-album')].filter(a=>!a.hidden),count=root.querySelector('[data-gallery-count]');
    if(count)count.textContent=`${visible.length} trips · ${visible.reduce((sum,a)=>sum+Number(a.querySelector('[data-trip-count]').textContent.match(/\d+/)?.[0]||0),0)} photographs`;
  }));
  root.addEventListener('change',e=>{
    const input=e.target;
    if(input.matches('[data-keep],[data-featured]')){
      const id=input.closest('[data-photo-id]').dataset.photoId,p=trips.flatMap(t=>t.photos).find(p=>p.id===id),next=photoState(p);
      if(input.hasAttribute('data-keep')){next.keep=input.checked;if(!next.keep)next.featured=false;}else{next.featured=input.checked;if(next.featured)next.keep=true;}
      state.photos[id]={keep:next.keep,featured:next.featured};save();updateTrip();updateHome();
    }
    if(input.hasAttribute('data-show-all'))updateTrip();
    if(input.matches('[data-edit-place],[data-edit-date]')){
      const t=trips[0],place=root.querySelector('[data-edit-place]').value.trim(),date=root.querySelector('[data-edit-date]').value.trim();
      state.trips[t.id]={place:place||t.place,date:date||t.date};save();updateTrip();
    }
  });
  document.querySelectorAll('[data-export-review]').forEach(button=>button.addEventListener('click',()=>{
    const scope=root.hasAttribute('data-gallery-home')?'gallery':'trip';
    const chosen=trips.flatMap(t=>t.photos.map(photoState).map(p=>({id:p.id,trip_id:t.id,keep:p.keep,featured:p.featured})));
    const payload={schema:2,scope,publication_approved:false,trips:trips.map(tripState).map(t=>({id:t.id,place:t.place,date:t.date})),photos:chosen,overrides:state};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=scope==='gallery'?'gallery-review.json':`gallery-review-${trips[0].id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }));
  if(typeof HTMLDialogElement!=='undefined'){
    const dialog=document.createElement('dialog');dialog.className='gallery-lightbox';dialog.setAttribute('aria-label','Photograph viewer');
    dialog.innerHTML='<div class="lightbox-toolbar"><span data-position aria-live="polite"></span><button data-close type="button" aria-label="Close photograph viewer">Close ×</button></div><img data-image alt=""><p class="lightbox-caption" data-caption aria-live="polite"></p><div class="lightbox-navigation"><button data-prev type="button" aria-label="Previous photograph">← Previous</button><button data-next type="button" aria-label="Next photograph">Next →</button></div>';document.body.append(dialog);
    let group=[],current=0,opener=null,startX=null;
    const show=n=>{current=(n+group.length)%group.length;const a=group[current],img=dialog.querySelector('[data-image]');img.src=a.href;img.alt=a.querySelector('img').alt;dialog.querySelector('[data-caption]').textContent=a.dataset.caption;dialog.querySelector('[data-position]').textContent=`${current+1} / ${group.length}`;};
    root.addEventListener('click',e=>{const a=e.target.closest('[data-gallery-photo]');if(!a)return;e.preventDefault();opener=a;group=[...a.closest('[data-photo-group]').querySelectorAll('[data-gallery-photo]')].filter(a=>!a.closest('figure').hidden);show(group.indexOf(a));dialog.showModal();document.documentElement.classList.add('gallery-modal-open');});
    dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());dialog.querySelector('[data-prev]').addEventListener('click',()=>show(current-1));dialog.querySelector('[data-next]').addEventListener('click',()=>show(current+1));
    dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();show(current+(e.key==='ArrowLeft'?-1:1));}});
    dialog.addEventListener('close',()=>{document.documentElement.classList.remove('gallery-modal-open');opener?.focus();});
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    dialog.addEventListener('touchstart',e=>startX=e.changedTouches[0].clientX,{passive:true});dialog.addEventListener('touchend',e=>{if(startX!==null){const d=e.changedTouches[0].clientX-startX;if(Math.abs(d)>60)show(current+(d<0?1:-1));startX=null;}},{passive:true});
  }
  updateHome();updateTrip();
  window.addEventListener('pageshow',()=>{
    try {state={photos:{},trips:{},...JSON.parse(localStorage.getItem(storageKey)||'{}')};}catch(_){}
    updateHome();updateTrip();
    root.querySelector('[data-year-filter][aria-pressed="true"]')?.click();
  });
})();
