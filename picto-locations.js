/* E33.EXE // Independent Picto location + NG+ Lv33 hunt.
   Does NOT read or write e33-acquired-pictos-luminas-v1 or e33-owned-picto-levels-v1. */
(function(){
  'use strict';
  const data=window.E33_PICTO_LOCATION_DATA;
  const host=document.getElementById('pictoHuntPage');
  if(!host)return;
  const list=host.querySelector('#pictoHuntList');
  const search=host.querySelector('#pictoHuntSearch');
  const empty=host.querySelector('#pictoHuntEmpty');
  const tabs=[...host.querySelectorAll('[data-hunt-tab]')];
  const storeKey='e33-picto-location-hunt-v1';
  const allowed=new Set((data||[]).map(x=>x.name));
  let tab='all', progress=readProgress();

  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function readProgress(){
    try{
      const saved=JSON.parse(localStorage.getItem(storeKey)||'{}');
      const result=Object.create(null);
      if(saved&&typeof saved==='object'&&!Array.isArray(saved))
        for(const [name,status] of Object.entries(saved))
          if(allowed.has(name)&&['found','maxed'].includes(status))result[name]=status;
      return result;
    }catch(e){return Object.create(null);}
  }
  function save(){
    try{localStorage.setItem(storeKey,JSON.stringify(progress));}
    catch(e){host.querySelector('#pictoHuntSaveNote').textContent='Save unavailable in this browser. Export your progress before leaving.';}
  }
  function totals(){
    const n=data.length;
    const maxed=data.filter(p=>progress[p.name]==='maxed').length;
    const found=data.filter(p=>progress[p.name]==='found').length;
    return {unfound:n-found-maxed,found,maxed,owned:found+maxed};
  }
  function stats(){
    const {unfound,found,maxed,owned}=totals();
    const n=data.length;
    const set=(id,val)=>{const el=host.querySelector('#'+id);if(el)el.textContent=val;};
    set('pictoHuntTotal',n);
    set('pictoHuntUnfound',unfound);
    set('pictoHuntFound',found);
    set('pictoHuntMaxed',maxed);
    set('pictoHuntTabAllCount',n);
    set('pictoHuntTabFoundCount',owned);
    set('pictoHuntTabMaxedCount',maxed);
    const bar=host.querySelector('.pl-meter');
    if(bar){
      const parts=[['unfound',unfound],['found',found],['maxed',maxed]];
      for(const [name,count] of parts){
        const segment=bar.querySelector('.pl-meter-'+name);
        if(segment)segment.style.width=(n?count/n*100:0)+'%';
      }
      bar.setAttribute('aria-label',unfound+' unfound, '+found+' found but not maxed, '+maxed+' maxed, out of '+n);
    }
  }
  function cleanedSection(p){
    return p.section||p.location||'Other locations';
  }
  function visible(p,q){
    if(tab==='found'&&!progress[p.name])return false;
    if(tab==='maxed'&&progress[p.name]!=='maxed')return false;
    if(!q)return true;
    return [p.name,p.section,p.location,p.requirement,p.guide,p.effect,...(p.tags||[])].join(' ').toLowerCase().includes(q);
  }
  function status(p){
    return progress[p.name]||'unfound';
  }
  function card(p){
    const s=status(p),owned=s!=='unfound',maxed=s==='maxed';
    return '<article class="pl-card pl-'+s+'" data-hunt-name="'+safe(p.name)+'">'
      +'<div class="pl-card-copy">'
      +'<div class="pl-card-head"><h3>'+safe(p.name)+'</h3>'
      +(p.dlc?'<span class="pl-mini pl-dlc">Update</span>':'')
      +(p.missable?'<span class="pl-mini pl-missable">Missable</span>':'')
      +'<span class="pl-mini pl-tier" title="Build ranking">Tier '+safe(p.tier)+'</span>'
      +'<span class="pl-mini pl-lp">'+safe(p.cost)+' LP</span></div>'
      +'<div class="pl-card-gate">'+safe(p.requirement)+'</div>'
      +'<div class="pl-card-location"><span class="pl-pin" aria-hidden="true">⌖</span><strong>'+safe(cleanedSection(p))+'</strong></div>'
      +'<p class="pl-card-directions">'+safe(p.guide)+'</p>'
      +(p.effect?'<p class="pl-card-effect"><b>Effect:</b> '+safe(p.effect)+'</p>':'')
      +'<div class="pl-card-footer"><span class="pl-card-tags">'+safe((p.tags||[]).filter(t=>!['Situational','Support','Universal','Act 3'].includes(t)).slice(0,4).join(' · '))+'</span>'
      +'<a href="'+safe(p.source)+'" target="_blank" rel="noopener noreferrer" aria-label="Cross-check '+safe(p.name)+' location in external checklist">Cross-check source <span aria-hidden="true">↗</span></a></div>'
      +'</div><div class="pl-actions" aria-label="'+safe(p.name)+' replay tracking">'
      +'<label class="pl-toggle '+(owned?'is-selected':'')+'"><input type="checkbox" data-hunt-status="found" data-hunt-name="'+safe(p.name)+'" '+(owned?'checked':'')+' aria-label="'+safe(p.name)+' found"><span class="pl-check" aria-hidden="true">✓</span><span>Found</span></label>'
      +'<label class="pl-toggle pl-maxed-toggle '+(maxed?'is-selected':'')+'"><input type="checkbox" data-hunt-status="maxed" data-hunt-name="'+safe(p.name)+'" '+(maxed?'checked':'')+' aria-label="'+safe(p.name)+' maxed at level 33"><span class="pl-check" aria-hidden="true">✓</span><span>Maxed <small>Lv 33</small></span></label>'
      +'</div></article>';
  }
  function sectionHtml(items,chapter,section){
    return '<section class="pl-area" aria-label="'+safe(section)+'"><div class="pl-area-head"><h2>'+safe(section)+'</h2><span>'+items.length+' Picto'+(items.length===1?'':'s')+'</span></div><div class="pl-area-list">'+items.map(card).join('')+'</div></section>';
  }
  function render(){
    if(!data||!Array.isArray(data)||data.length!==210){
      list.textContent='Picto location database is unavailable or incomplete.';
      return;
    }
    const q=(search.value||'').trim().toLowerCase();
    const selected=data.filter(p=>visible(p,q));
    tabs.forEach(b=>{
      const active=b.dataset.huntTab===tab;
      b.classList.toggle('active',active);
      b.setAttribute('aria-selected',String(active));
      b.tabIndex=active?0:-1;
    });
    if(tab==='maxed'){
      const sorted=[...selected].sort((a,b)=>a.name.localeCompare(b.name));
      list.innerHTML='<div class="pl-flat-list">'+sorted.map(card).join('')+'</div>';
    }else{
      const chapters=new Map();
      for(const p of selected){
        if(!chapters.has(p.act))chapters.set(p.act,new Map());
        const sections=chapters.get(p.act),key=cleanedSection(p);
        if(!sections.has(key))sections.set(key,[]);
        sections.get(key).push(p);
      }
      list.innerHTML=[...chapters.entries()].map(([act,sections])=>
        '<div class="pl-chapter"><div class="pl-chapter-title"><span class="pl-chapter-rule"></span><h2>'+safe(act)+'</h2><span>'+[...sections.values()].reduce((n,a)=>n+a.length,0)+' Pictos</span></div>'
        +[...sections.entries()].map(([section,entries])=>sectionHtml(entries,act,section)).join('')+'</div>'
      ).join('');
    }
    empty.hidden=selected.length!==0;
    const shown=host.querySelector('#pictoHuntShown');
    if(shown)shown.textContent=selected.length+' of '+data.length+' Pictos shown';
    stats();
  }
  function change(name,kind,checked){
    if(!allowed.has(name))return;
    const previous=progress[name]||'unfound';
    if(kind==='maxed'){
      if(checked)progress[name]='maxed';
      else if(previous==='maxed')progress[name]='found';
    }else if(kind==='found'){
      if(!checked)delete progress[name];
      else if(previous==='unfound')progress[name]='found';
    }
    save();
    if(tab==='all'&&!search.value.trim()){
      const cardEl=[...list.querySelectorAll('[data-hunt-name]')].find(x=>x.dataset.huntName===name);
      if(cardEl){
        const now=progress[name]||'unfound';
        cardEl.classList.remove('pl-unfound','pl-found','pl-maxed');
        cardEl.classList.add('pl-'+now);
        cardEl.querySelectorAll('[data-hunt-status]').forEach(input=>{
          const isChecked=input.dataset.huntStatus==='found'?now!=='unfound':now==='maxed';
          input.checked=isChecked;input.closest('.pl-toggle').classList.toggle('is-selected',isChecked);
        });
        stats();
        return;
      }
    }
    render();
  }
  list.addEventListener('change',e=>{
    const input=e.target.closest('input[data-hunt-status]');
    if(!input)return;
    change(input.dataset.huntName,input.dataset.huntStatus,input.checked);
  });
  tabs.forEach(button=>button.addEventListener('click',()=>{tab=button.dataset.huntTab;render();}));
  host.querySelector('.pl-tabs').addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();
    const i=tabs.findIndex(b=>b.dataset.huntTab===tab);
    const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length;
    tabs[next].click();tabs[next].focus();
  });
  search.addEventListener('input',render);
  host.querySelector('#pictoHuntClearSearch').addEventListener('click',()=>{search.value='';search.focus();render();});

  host.querySelector('#pictoHuntExport').addEventListener('click',()=>{
    const payload={version:1,tracker:'e33-picto-location-hunt',exportedAt:new Date().toISOString(),progress:{...progress}};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='e33-picto-location-hunt.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  const importEl=host.querySelector('#pictoHuntImportFile');
  host.querySelector('#pictoHuntImport').addEventListener('click',()=>importEl.click());
  importEl.addEventListener('change',async()=>{
    const file=importEl.files&&importEl.files[0];if(!file)return;
    try{
      const raw=JSON.parse(await file.text());
      if(raw.tracker!=='e33-picto-location-hunt'||raw.version!==1||!raw.progress||typeof raw.progress!=='object'||Array.isArray(raw.progress))throw Error('Invalid location tracker backup');
      const replacement=Object.create(null);
      for(const [name,value] of Object.entries(raw.progress)){
        if(allowed.has(name)&&['found','maxed'].includes(value))replacement[name]=value;
      }
      progress=replacement;save();render();
      host.querySelector('#pictoHuntSaveNote').textContent='Location tracker backup imported. The original Pictos & Luminas inventory was not changed.';
    }catch(err){host.querySelector('#pictoHuntSaveNote').textContent='Could not import: select an E33.EXE Picto Locations backup JSON.';}
    finally{importEl.value='';}
  });

  render();
})();
