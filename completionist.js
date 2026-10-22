/* E33.EXE Completionist – persistent sequential quest tracker */
(function () {
  "use strict";
  const raw = window.E33_COMPLETION_DATA;
  const mount = document.getElementById("completionistSections");
  const dock = document.getElementById("completionistDock");
  const live = document.getElementById("completionistAnnouncement");
  const modal = document.getElementById("completionistGuideModal");
  const detailData = window.E33_COMPLETION_DETAILS || {};
  const routeData = window.E33_COMPLETION_ROUTES || {};
  const contextData = window.E33_COMPLETION_CONTEXT || {};
  const gates = window.E33_COMPLETION_GATES?.steps || {};
  const audit = window.E33_COMPLETION_AUDIT || {abilities:[],requirements:{},quality:{}};
  const siteRanks = window.E33_ITEM_RANKINGS || {weapons:[],pictos:[]};
  let modalStepId = null;
  let modalPreviousFocus = null;
  if (!Array.isArray(raw) || !mount || !dock) return;

  const STORE = "e33-completionist-progress-v1";
  const OPEN = "e33-completionist-active-v1";
  const slug = x => String(x).normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const esc = x => String(x).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const chapters = raw.map((chapter, chapterIndex) => {
    const steps = chapter.areas.flatMap(([area, entries]) => entries.map(([kind,title,directions,stableId], position) => {
      const id = typeof stableId === "string" && stableId ? stableId : chapter.id + ":" + slug(area) + ":" + slug(title);
      const previousRoute = routeData[id];
      return {
        id,kind,title,area,position,chapterId:chapter.id,
        context: audit.verified?.[id] ? "" : contextData[id] || "",
        capabilities: audit.requirements?.[id] || [],
        quality: audit.quality?.[id] || "authored",
        // Always assume consecutive chronological play. Original wording stays available for NG+ detours.
        directions: typeof previousRoute?.from === "string" ? previousRoute.from : directions,
        previousTitle: previousRoute?.previous || null,
        restartDirections: directions
      };
    }));
    return {...chapter,number:chapterIndex,steps};
  });
  // Route continuity: only label a direction as coming from the previous checkpoint
  // when its authored origin matches the actual immediately preceding step.
  // Audit catalogs are unordered item indexes, not a physical walking route.
  for (const chapter of chapters) {
    chapter.steps.forEach((step, index) => {
      const previous = chapter.steps[index - 1];
      const route = routeData[step.id];
      const linked = !!previous && !!route?.previous &&
        slug(route.previous) === slug(previous.title);
      step.isLinkedRoute = chapter.id !== "inventory" && linked;
      step.previousTitle = step.isLinkedRoute ? previous.title : null;
      if (!step.isLinkedRoute || audit.corrected?.[step.id]) step.directions = step.restartDirections;
      step.routeLabel = chapter.id === "inventory" ? "COLLECTION LOCATION / ACQUISITION" :
        audit.corrected?.[step.id] ? "VERIFIED LOCATION ROUTE" : step.isLinkedRoute ? "FROM THE PREVIOUS STEP" : "AREA-BASED CHECKPOINT / DETOUR";
    });
  }
  const steps = chapters.flatMap(c => c.steps);
  const byId = new Map(steps.map((step,i) => [step.id,{step,index:i}]));
  let statuses = {};
  let openId = "act1";
  // Temporary timeline selection. Never change progress simply by viewing a dot.
  let selectedStepId = null;
  const showSkips = new Set();
  const showArchives = new Set();
  let touched = null;
  let dockPulseTimer = null;

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch { return null; }
  }
  function storageSet(key,value) {
    try { window.localStorage.setItem(key,value); return true; }
    catch { announce("Progress could not be saved in this browser. Try exporting a backup."); return false; }
  }
  function announce(value) { if (live) live.textContent = value; }

  try {
    const parsed = JSON.parse(storageGet(STORE) || "{}");
    const candidate = parsed?.statuses || parsed;
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      Object.entries(candidate).forEach(([id,status]) => {
        if (byId.has(id) && (status === "done" || status === "skip")) statuses[id] = status;
      });
    }
  } catch {}
  const savedOpen = storageGet(OPEN);
  if (chapters.some(c => c.id === savedOpen)) openId = savedOpen;

  function save() {
    storageSet(STORE,JSON.stringify({schema:1,updated:new Date().toISOString(),statuses}));
  }
  const statusOf = id => statuses[id] || "pending";
  const chapterStats = chapter => {
    const done = chapter.steps.filter(s => statusOf(s.id) === "done").length;
    const skip = chapter.steps.filter(s => statusOf(s.id) === "skip").length;
    return {done,skip,total:chapter.steps.length,pending:chapter.steps.length-done-skip};
  };

  const ABILITY_STORAGE="e33-completionist-abilities-v1";
  let abilityOverrides={};
  try {const v=JSON.parse(storageGet(ABILITY_STORAGE)||"{}");if(v&&typeof v==="object")abilityOverrides=v;}catch{}
  const abilityById=new Map((audit.abilities||[]).map(x=>[x.id,x]));
  const hasCapability=id=>Object.prototype.hasOwnProperty.call(abilityOverrides,id)?
    abilityOverrides[id]===true:statusOf(audit.milestones?.[id])==="done";
  function missingCapabilities(step){return (step.capabilities||[]).filter(id=>!hasCapability(id));}
  function missingDependencies(step){return (gates[step.id]?.requires||[]).filter(id=>byId.has(id)&&statusOf(id)!=="done");}
  function isReady(step){return step.quality!=="unverified"&&!missingCapabilities(step).length&&!missingDependencies(step).length;}
  function capabilityNames(step){return (step.capabilities||[]).map(id=>abilityById.get(id)?.label||id);}
  const showUnverified=new Set();
  const showLocked=new Set();

  function abilityMarkup(){
 const abilities=audit.abilities||[];
 if(!abilities.length)return "";
 const confirmed=steps.filter(x=>x.quality==="verified").length;
 const uncertain=steps.filter(x=>x.quality==="unverified"&&statusOf(x.id)==="pending").length;
 return `<section class="cp-access-panel" aria-label="Traversal ability controls">
   <div class="cp-access-top"><div><span class="cp-eyebrow">TRAVERSAL CHECK</span><h2>Only show what you can reach</h2>
   <p>Mark the abilities currently unlocked in your save. Completing a linked story milestone also unlocks its ability automatically. Items that require missing abilities, or have insufficient directions, cannot interrupt your route.</p></div>
   <span class="cp-access-stat">${confirmed} pickup routes cross-checked · ${uncertain} entries awaiting detailed locations</span></div>
   <div class="cp-abilities">${abilities.map(a=>{const ok=hasCapability(a.id);return `<button type="button" data-action="toggle-ability"
     data-ability="${esc(a.id)}" class="cp-ability ${ok?"is-unlocked":""}" aria-pressed="${ok}">
     <span class="cp-ability-mark">${ok?"✓":"○"}</span><span class="cp-ability-copy"><strong>${esc(a.label)}</strong><small>${esc(a.when)}</small></span>
     <span class="cp-ability-state">${ok?"UNLOCKED":"LOCKED"}</span></button>`;}).join("")}</div>
   <p class="cp-access-help">New Game+ may reset traversal. These manual toggles adjust reachability without changing any collected-item checkmarks.</p>
 </section>`;
}
  function queueMarkup(chapter){
 const pending=chapter.steps.filter(x=>statusOf(x.id)==="pending");
 const unknown=pending.filter(x=>x.quality==="unverified");
 const blocked=pending.filter(x=>x.quality!=="unverified"&&!isReady(x));
 const blocks=[];
 if(blocked.length){
  const expanded=showLocked.has(chapter.id),shown=expanded?blocked:blocked.slice(0,6);
  blocks.push(`<details class="cp-audit-queue" open><summary>${blocked.length} locked by abilities or quests <small>excluded from On Deck</small></summary>
  ${shown.map(x=>`<div class="cp-audit-row"><span>${esc(x.title)}<small>${esc(x.area)}</small></span>
    <span class="cp-audit-reason">${esc(missingCapabilities(x).map(id=>abilityById.get(id)?.label||id).join(", ")||"Quest prerequisite")}</span>
    <button class="cp-inline" data-action="details" data-id="${esc(x.id)}">Inspect ↗</button></div>`).join("")}
  ${blocked.length>6?`<button class="cp-inline" data-action="toggle-audit" data-type="locked" data-chapter="${esc(chapter.id)}">${expanded?"Show fewer":"Show all "+blocked.length}</button>`:""}
  </details>`);
 }
 if(unknown.length){
  const expanded=showUnverified.has(chapter.id),shown=expanded?unknown:unknown.slice(0,6);
  blocks.push(`<details class="cp-audit-queue"><summary>${unknown.length} entries awaiting usable directions <small>excluded from On Deck</small></summary>
   <p class="cp-audit-explain">Retained in your collection total, but the current catalog does not document a reproducible location route. You can inspect or manually complete these entries.</p>
  ${shown.map(x=>`<div class="cp-audit-row"><span>${esc(x.title)}<small>${esc(x.area)}</small></span>
    <button class="cp-inline" data-action="details" data-id="${esc(x.id)}">Review ↗</button></div>`).join("")}
  ${unknown.length>6?`<button class="cp-inline" data-action="toggle-audit" data-type="unverified" data-chapter="${esc(chapter.id)}">${expanded?"Show fewer":"Show all "+unknown.length}</button>`:""}
  </details>`);
 }
 return blocks.length?`<div class="cp-audit-queues">${blocks.join("")}</div>`:"";
}
  function icon(kind) {
    return ({
      "Quest":"✦","Missable quest":"!","Journal":"≡","Record":"♫",
      "Picto":"◇","Weapon":"⚔","Boss":"◆","Optional boss":"◆",
      "Chromatic":"✹","Rare enemy":"◎","Lost Gestral":"◉",
      "Merchant":"◈","Cosmetic":"◈","Secret":"✧","Minigame":"✦",
      "Arena":"◇","Story":"→","Relationship":"♡","Collection":"▣"
    })[kind] || "◇";
  }


  // Every checkpoint opens the same stable, accessible guide modal.
  function completionNote(step) {
    if (step.kind === "Journal" || step.kind === "Record") return "Pick up the named collectible, then confirm it appears in your Journal or Music Records menu. Merely reaching the location does not count.";
    if (step.kind === "Picto" || step.kind === "Weapon") return "Collect the item or defeat the specified enemy, then confirm the named item appears in your Pictos or Weapons inventory. Existing NG+ copies still count.";
    if (step.kind === "Rare enemy" || step.kind === "Chromatic" || step.kind === "Boss" || step.kind === "Optional boss") return "Defeat the encounter and claim its unique reward. If you are not strong enough yet, use Skip for now and return when ready.";
    if (step.kind === "Merchant") return "Finish the merchant duel if its stock is locked and purchase the unique item(s). Just meeting the merchant is not the same as acquiring everything.";
    if (step.kind === "Lost Gestral") return "Speak with the lost Gestral, offer to bring it to camp, then check in with Sastro at camp for the corresponding reward.";
    if (step.kind === "Quest" || step.kind === "Missable quest") return "After handing in the requested item or winning the quest fight, speak to the NPC one more time and verify the quest reward before leaving.";
    if (step.kind === "Relationship") return "Return to camp after the quest, select Check Up on the Others and speak through the new relationship interaction to claim the unlock.";
    if (step.kind === "Minigame" || step.kind === "Arena") return "Finish every required round or objective and speak to the host again to claim its final reward.";
    return "Complete the named interaction, then verify any unique reward in the corresponding in-game menu before marking this step complete.";
  }
  function guideSource(step) {
    const areaInfo = detailData.areas?.[step.area];
    const key = detailData.overrides?.[step.title] || areaInfo?.[2] || step.chapterId;
    const url = detailData.sources?.[key] || detailData.sources?.[step.chapterId];
    if (!url || !/^https:\/\/[a-z0-9.-]+\/\S+$/i.test(url)) return null;
    const title = detailData.sourceTitles?.[key] || (areaInfo?.[2] === key ? "Illustrated area walkthrough / reference" : "Collectibles walkthrough");
    return {url,title};
  }
  function showGuide(id) {
 const entry=byId.get(id);
 if(!entry||!modal)return;
 const step=entry.step,ch=chapters.find(c=>c.id===step.chapterId);
 const customSource=audit.sources?.[step.id];
 const source=customSource?{url:customSource,title:"Source used to verify this location"}:guideSource(step);
 const needed=capabilityNames(step),locked=missingCapabilities(step);
 const isDocumented=step.quality!=="unverified";
 const route=step.directions||step.restartDirections||"";
 modalStepId=id;
 modalPreviousFocus=document.activeElement;
 const body=modal.querySelector(".cp-guide-body");
 modal.style.setProperty("--cp-guide-accent",ch?.accent||"#81c8ff");
 modal.querySelector("#cpGuideChapter").textContent=ch?.title||"Completionist";
 modal.querySelector("#cpGuideType").textContent=icon(step.kind)+" "+step.kind;
 modal.querySelector("#cpGuideTitle").textContent=step.title;
 modal.querySelector("#cpGuideLocation").textContent=step.area;
 modal.querySelector("#cpGuideNumber").textContent="STEP "+(ch.steps.indexOf(step)+1)+" / "+ch.steps.length;
 body.innerHTML=`
  <section class="cp-guide-block"><span class="cp-guide-block-label">01 / LOCATION & ACCESS</span>
    <h4>${esc(step.area)}</h4>
    <p>${needed.length?"Required traversal: "+esc(needed.join(" · ")): "No special overworld traversal recorded for this checkpoint."}</p>
    ${prerequisiteMarkup(step)}
    ${locked.length?`<p class="cp-route-blocked">This is not yet accessible: unlock ${esc(locked.map(a=>abilityById.get(a)?.label||a).join(", "))} first.</p>`:""}
  </section>
  <section class="cp-guide-block cp-guide-route"><span class="cp-guide-block-label">02 / ${isDocumented?"HOW TO GET THERE":"DIRECTIONS NOT YET VERIFIED"}</span>
    <h4>${isDocumented?"Pickup route":"Needs location research"}</h4>
    ${isDocumented?`<p>${esc(route)}</p>`:
      `<p>The current item catalog does not supply reliable turn-by-turn directions. It is excluded from On Deck so it cannot block the walk-through. The available source note is:</p><p>${esc(step.restartDirections)}</p>`}
  </section>
  <section class="cp-guide-block cp-guide-alternate"><span class="cp-guide-block-label">03 / COMPLETE & VERIFY</span>
    <h4>${esc(step.title)}</h4>
    <p>${esc(detailData.completion?.[step.title]||completionNote(step))}</p>
  </section>
  ${source?`<a class="cp-guide-source" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">
    <span><strong>${esc(source.title)}</strong><small>Optional reference. The available on-site directions are above.</small></span><span aria-hidden="true">↗</span></a>`:""}
 `;
 updateModalControls();
 modal.classList.add("open");
 modal.setAttribute("aria-hidden","false");
 document.body.classList.add("modal-open");
 modal.querySelector(".cp-guide-scroll").scrollTop=0;
 modal.querySelector(".cp-guide-close")?.focus({preventScroll:true});
}

  function updateModalControls() {
    if(!modalStepId || !modal)return;
    const st=statusOf(modalStepId), actions=modal.querySelector("#cpGuideControls");
    if(!actions)return;
    actions.innerHTML=st==="done" ?
      `<span class="cp-guide-done-msg">✓ Step completed</span><button class="cp-guide-secondary" data-guide-action="restore">Undo completion</button>` :
      st==="skip" ?
      `<span class="cp-guide-skip-msg">○ Skipped for later</span><button class="cp-guide-primary" data-guide-action="done">✓ Complete Step</button><button class="cp-guide-secondary" data-guide-action="restore">Revisit / make active</button>` :
      `<button class="cp-guide-primary" data-guide-action="done">✓ Complete Step</button><button class="cp-guide-secondary" data-guide-action="skip">Skip for now ↷</button>`;
  }
  function closeGuide() {
    if(!modal || !modal.classList.contains("open"))return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden","true");
    document.body.classList.remove("modal-open");
    modalStepId=null;
    if(modalPreviousFocus?.isConnected)modalPreviousFocus.focus({preventScroll:true});
    else mount.querySelector(".cp-focus-card")?.focus({preventScroll:true});
    modalPreviousFocus=null;
  }
  modal?.addEventListener("click",event=>{
    if(event.target===modal || event.target.closest(".cp-guide-close")){closeGuide();return;}
    const link=event.target.closest('button[data-action="details"]');
    if(link){showGuide(link.dataset.id);return;}
    const btn=event.target.closest("[data-guide-action]");
    if(!btn||!modalStepId)return;
    const id=modalStepId,status=btn.dataset.guideAction;
    closeGuide();
    change(id,status==="restore"?"pending":status);
  });
  modal?.addEventListener("keydown",event=>{
    if(event.key==="Escape"){event.preventDefault();closeGuide();return;}
    if(event.key!=="Tab")return;
    const focusable=[...modal.querySelectorAll('button:not(:disabled), a[href]')].filter(x=>x.offsetParent!==null);
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
  });

  // Lightweight availability hints, not a hard lock: the save file can be ahead of localStorage.
  function prerequisiteMarkup(step,compact=false){
 const missing=missingDependencies(step),abilities=missingCapabilities(step);
 if(!missing.length&&!abilities.length)return "";
 const first=missing.length?byId.get(missing[0]).step:null;
 const label=abilities.length?"Requires "+abilities.map(a=>abilityById.get(a)?.label||a).join(", "):
   "First complete: "+first.title;
 const tip=gates[step.id]?.tip||"Advance the listed story checkpoint before this pickup.";
 return `<div class="cp-prerequisite ${compact?"is-compact":""}" role="note">
   <span class="cp-prereq-marker" aria-hidden="true">!</span>
   <span class="cp-prereq-copy"><strong>${esc(label)}</strong>${compact?"":`<span>${esc(tip)} ${abilities.length?"Update the traversal panel once this power is unlocked.":""}</span>`}</span>
   ${first?`<button type="button" class="cp-prereq-action" data-action="details" data-id="${esc(first.id)}">View prerequisite ↗</button>`:""}
 </div>`;
}

  const rewardHints = {"Chromatic Lancelier":["Augmented Attack"],"Abbest Cave · Chromatic Abbest":["First Offensive"],"Noco's duel and shop":["Exposing Attack"],"Friendly Demineur":["Deminerim"],"Chromatic Troubadour":["Troubadim","Energising Break"],"Chromatic Brûleur":["Powerful Revive"],"Hidden Gestral Arena · four champions":["Solo Fighter","Accelerating Last Stand"],"Red Woods · Bénisseur":["Recovery"],"Ultimate Sakapatate":["Breaker"],"Black-market alley":["Healing Mark","Sekarum"],"Gestral tournament / recruit Sciel":["Medalum"],"Pinabby":["Teamwork","Auto Death"],"Glaise":["Plenum","Energising Attack I"],"Chromatic Orphelin trio":["Kralim"],"Friendly Hexga":["Auto Shell"],"Stone Quarry Troubadour":["Healing Parry"],"Esoteric Ruins / Portier":["Protecting Heal"],"Mandelgo · unique stock":["Algueron","Longer Powerful","Healing Counter"],"Chromatic Danseuse":["Danseso","Revive Paradox"],"Frozen Hearts":["Survivor"],"Flying Manor · Clea":["Clea's Life"],"Renoir's Drafts / The Abyss · Simon":["Simoso"],"Reverie Path":["AP Discount","Consuming Attack"],"Root of All Evil · Osquio":["Esquiso"],"Clea Unleashed":["Cleim","Clea's Death"],"Duollistes":["Duollison"],"Chromatic Lampmaster":["First Life"]};
  const rankByName=new Map();
  [...siteRanks.weapons.map(item=>({...item,type:"Weapon"})),
   ...siteRanks.pictos.map(item=>({...item,type:"Picto"}))].forEach(item=>{
    const key=item.name.toLowerCase();
    if(!rankByName.has(key))rankByName.set(key,[]);
    rankByName.get(key).push(item);
  });
  function rankedRewards(step) {
    const eligible=new Set(["Weapon","Picto","Merchant","Chromatic","Boss","Optional boss","Quest","Arena","Collection","Secret","Minigame"]);
    if(!eligible.has(step.kind))return [];
    const names=new Set(rewardHints[step.title]||[]);
    // A weapon/picto named in the title takes precedence. Avoid rating the
    // PREVIOUS/NEXT pickup when it is mentioned only to clarify the route.
    const nameAlreadyIdentified = [...rankByName.values()].some(list=>{
      const n=list[0].name.toLowerCase(),title=step.title.toLowerCase();
      const at=title.indexOf(n);
      if(at<0)return false;
      const before=at===0?"":title[at-1],after=title[at+n.length]||"";
      return !/[a-z0-9]/.test(before)&&!/[a-z0-9]/.test(after);
    });
    const targets=(step.kind==="Weapon"||step.kind==="Picto")&&!nameAlreadyIdentified?
      [step.title,step.restartDirections]:[step.title];
    for(const list of rankByName.values()) {
      const item=list[0];
      if(item.name.length<5)continue;
      if(targets.some(text=>{
        const s=String(text).toLowerCase(),n=item.name.toLowerCase();
        let at=s.indexOf(n);
        while(at>=0) {
          const before=at===0?"":s[at-1],after=s[at+n.length]||"";
          if(!/[a-z0-9]/.test(before)&&!/[a-z0-9]/.test(after))return true;
          at=s.indexOf(n,at+1);
        }
        return false;
      }))names.add(item.name);
    }
    const items=[];
    for(const name of names){
      const options=rankByName.get(name.toLowerCase())||[];
      const picked=options.find(x=>x.type==="Weapon"&&(step.chapterId==="act1"?x.character==="Gustave":x.character==="Verso"))||options[0];
      if(picked)items.push(picked);
    }
    return items.slice(0,4);
  }
  function rewardRankMarkup(step) {
    const items=rankedRewards(step);
    if(!items.length)return "";
    return `<div class="cp-ranked-rewards" aria-label="E33.EXE item rankings">
      <span class="cp-rank-kicker">Build ranking</span>
      ${items.map(item=>{
        const who=item.type==="Weapon"?item.character+" · ":"Picto · ";
        const order=item.type==="Weapon"&&Number.isFinite(item.rank)?" · #"+item.rank:"";
        const sourceNote=item.type==="Weapon"?item.why:"Lumina cost: "+item.cost+" LP";
        return `<span class="cp-rank-item" title="${esc(item.name+" · "+item.tier+" tier · "+sourceNote)}"><strong>${esc(item.name)}</strong> ${esc(who)}<em>${esc(item.tier)} tier</em>${order}</span>`;
      }).join("")}
    </div>`;
  }

  function skippedMarkup(chapter) {
    const skipped = chapter.steps.filter(step => statusOf(step.id) === "skip");
    if (!skipped.length) return "";
    const expanded = showSkips.has(chapter.id);
    const visible = expanded ? skipped : skipped.slice(0,4);
    return `<div class="cp-skipped" aria-label="Skipped checkpoints">
      <div class="cp-skipped-head">
        <span>◌ &nbsp;${skipped.length} skipped · still to collect</span>
        ${skipped.length > 4 ? `<button class="cp-inline" data-action="toggle-skips" data-chapter="${esc(chapter.id)}">${expanded?"Show fewer":"Show all"}</button>` : ""}
      </div>
      ${visible.map(step => `<div class="cp-skipped-item">
        <span class="cp-skipped-dot" aria-hidden="true"></span>
        <span class="cp-skipped-title" title="${esc(step.area+" · "+step.title)}">${esc(step.title)}</span>
        <button class="cp-inline" data-action="details" data-id="${esc(step.id)}" aria-label="Details for ${esc(step.title)}">Guide ↗</button>
        <button class="cp-inline" data-action="restore" data-id="${esc(step.id)}" aria-label="Move ${esc(step.title)} back to next steps">Revisit</button>
        <button class="cp-inline complete" data-action="done" data-id="${esc(step.id)}" aria-label="Mark ${esc(step.title)} completed">✓</button>
      </div>`).join("")}
    </div>`;
  }
  function archiveMarkup(chapter, done) {
    if (!done.length) return "";
    const opened = showArchives.has(chapter.id);
    return `<details class="cp-archive" data-archive="${esc(chapter.id)}" ${opened ? "open" : ""}>
      <summary>✓ &nbsp;Completed checkpoints <span>${done.length} archived</span></summary>
      <div class="cp-archive-rows">
        ${done.map(step => `<div class="cp-archive-row">
          <span class="cp-archive-icon" aria-hidden="true">✓</span>
          <span class="cp-archive-name">${esc(step.area)} · ${esc(step.title)}</span>
          <button class="cp-inline" data-action="details" data-id="${esc(step.id)}" aria-label="Details for ${esc(step.title)}">Guide ↗</button>
          <button class="cp-inline" data-action="restore" data-id="${esc(step.id)}" aria-label="Undo ${esc(step.title)}">Undo</button>
        </div>`).join("")}
      </div>
    </details>`;
  }

  // Show a compact, internally scrollable preview without diluting the primary objective.
  function upcomingMarkup(chapter, current) {
    if (!current) return "";
    const nextIndex = chapter.steps.indexOf(current);
    const upcoming = chapter.steps.slice(nextIndex + 1).filter(s => statusOf(s.id) === "pending" && isReady(s)).slice(0, 8);
    if (!upcoming.length) return "";
    return `<section class="cp-upcoming" aria-label="Upcoming steps">
      <div class="cp-upcoming-header">
        <div><span class="cp-upcoming-eyebrow">ON DECK</span>
          <h4>Up Next <span>${upcoming.length} upcoming step${upcoming.length === 1 ? "" : "s"}</span></h4>
        </div>
        <span class="cp-upcoming-hint">Directions and actions at a glance</span>
      </div>
      <div class="cp-upcoming-list" role="list" aria-label="Next ${upcoming.length} steps">
        ${upcoming.map(step => {
          const number = chapter.steps.indexOf(step) + 1;
          return `<div class="cp-upcoming-item" role="listitem" data-upcoming="${esc(step.id)}">
            <span class="cp-upcoming-number" aria-label="Step ${number}">${number.toString().padStart(2, "0")}</span>
            <div class="cp-upcoming-info">
              <h5 class="cp-upcoming-title">${esc(step.title)}</h5>
              ${rewardRankMarkup(step)}
              ${step.context && step.quality!=="verified" ? `<p class="cp-upcoming-context">${esc(step.context)}</p>` : ""}
              ${prerequisiteMarkup(step,true)}
              <p class="cp-upcoming-instructions">${esc(step.directions)}</p>
              <div class="cp-upcoming-meta"><span>${esc(step.area)}</span><span class="cp-upcoming-type">${esc(icon(step.kind)+" "+step.kind)}</span></div>
              <div class="cp-upcoming-actions">
                <button class="cp-inline cp-upcoming-complete" data-action="done" data-id="${esc(step.id)}" aria-label="Complete ${esc(step.title)}">✓ Complete Step</button>
                <button class="cp-inline cp-upcoming-skip" data-action="skip" data-id="${esc(step.id)}" aria-label="Skip ${esc(step.title)} for now">Skip for now ↷</button>
                <button class="cp-inline cp-upcoming-guide" data-action="details" data-id="${esc(step.id)}" aria-label="View detailed directions for ${esc(step.title)}">↗ Full guide</button>
              </div>
            </div>
          </div>`;
        }).join("")}
      </div>
      <div class="cp-upcoming-footer">Showing the next ${upcoming.length} unfinished step${upcoming.length === 1 ? "" : "s"} · More appear as you progress</div>
    </section>`;
  }

  function focusMarkup(chapter,stats) {
    // The true active objective remains the first pending one; a timeline dot may
    // spotlight ANY step without marking it done or undoing its skipped state.
    const active = chapter.steps.find(step => statusOf(step.id) === "pending" && isReady(step));
    const selection = selectedStepId && byId.get(selectedStepId)?.step.chapterId === chapter.id
      ? byId.get(selectedStepId).step : null;
    const step = selection || active;
    const selected = !!selection && selection.id !== active?.id;
    const completed = chapter.steps.filter(entry => statusOf(entry.id) === "done");
    const upcoming = upcomingMarkup(chapter,active);
    const skipped = skippedMarkup(chapter);
    const archive = archiveMarkup(chapter,completed);
    let main;
    if (!step) {
      main = `<div class="cp-finished">
        <h3>${stats.pending ? "No reachable verified step at this point" : stats.skip ? "All checkpoints visited" : "Act complete ✓"}</h3>
        <p>${stats.pending ? "Check the traversal unlocks above or the pending-location review section below. Remaining checkpoints are not confirmed accessible right now." : stats.skip ? "You reached the end of this route, but skipped checkpoints remain uncollected. Select one of their hollow markers in the bottom timeline to review it, or choose Revisit." : "Every step in this section has been completed. Select a filled marker to review a previous step."}</p>
        ${stats.skip ? `<button class="cp-tool" data-action="revisit-first" data-chapter="${esc(chapter.id)}">Revisit first skipped step ↗</button>` : ""}
      </div>`;
    } else {
      const stepStatus=statusOf(step.id);
      const label=selected ? (stepStatus==="skip" ? "Skipped Step" : stepStatus==="done" ? "Completed Step" : "Selected Step") : "Active Step";
      const idx=chapter.steps.indexOf(step)+1;
      const actions=stepStatus==="done"
        ? `<button class="cp-skip" data-action="restore" data-id="${esc(step.id)}">↶ Undo completion</button>`
        : stepStatus==="skip"
        ? `<button class="cp-done" data-action="done" data-id="${esc(step.id)}"><span aria-hidden="true">✓</span> Complete Step</button>
           <button class="cp-skip" data-action="restore" data-id="${esc(step.id)}">↶ Revisit as active</button>`
        : `<button class="cp-done" data-action="done" data-id="${esc(step.id)}"><span aria-hidden="true">✓</span> Complete Step</button>
           <button class="cp-skip" data-action="skip" data-id="${esc(step.id)}">Skip for now ↷</button>`;
      main = `<article class="cp-focus-card ${selected?"is-spotlight":""}" tabindex="-1" aria-label="${esc(label)}" data-focus-step="${esc(step.id)}">
        <div class="cp-focus-overline">
          <span class="cp-next-label">${esc(label)}</span>
          <span class="cp-kind">${esc(icon(step.kind)+" "+step.kind)}</span>
          <span class="cp-step-counter">STEP ${idx} / ${chapter.steps.length}</span>
        </div>
        <div class="cp-stage">${esc(step.area)} <span aria-hidden="true">↗</span></div>
        <h3 style="margin-top:19px">${esc(step.title)}</h3>
        ${rewardRankMarkup(step)}
        ${step.context && step.quality!=="verified" ? `<p class="cp-focus-context">${esc(step.context)}</p>` : ""}
        <div class="cp-directions-label">${esc(step.routeLabel)}${step.previousTitle ? " · "+esc(step.previousTitle) : ""}</div>
        <p class="cp-directions">${esc(step.directions)}</p>
        ${prerequisiteMarkup(step)}
        ${selected && stepStatus==="skip" ? `<p class="cp-view-note">This checkpoint is still skipped. Viewing it does not change your completion percentage or fill its timeline circle.</p>` : ""}
        <div class="cp-step-actions">
          ${actions}
          <button class="cp-route-btn" data-action="details" data-id="${esc(step.id)}" aria-label="View detailed directions for ${esc(step.title)}">↗ Detailed directions</button>
          ${selected ? `<button class="cp-route-btn cp-resume" data-action="resume">← Back to ${active?"Active Step":"act overview"}</button>` : ""}
        </div>
      </article>`;
    }
    return `<div class="cp-chapter-body" id="cp-body-${esc(chapter.id)}">
      <div class="cp-status-line">
        <span><strong>${stats.done}</strong> of ${stats.total} steps completed · ${stats.skip} skipped</span>
        <span>${stats.pending ? stats.pending+" upcoming" : "Route visited"}</span>
      </div>
      ${skipped}
      ${main}
      ${upcoming}
      ${queueMarkup(chapter)}
      ${archive}
    </div>`;
  }

  function render({animated=false,followRail=true,preserveUpcomingScroll=false}={}) {
    const totalDone = steps.filter(s => statusOf(s.id) === "done").length;
    const overall = Math.round(100*totalDone/steps.length);
    const activeChapter = chapters.find(c=>c.id===openId);
    const activeStats = activeChapter ? chapterStats(activeChapter) : null;
    const previousUpcomingScroll = mount.querySelector(".cp-upcoming-list")?.scrollTop || 0;
    mount.innerHTML=abilityMarkup()+chapters.map(chapter => {
      const s=chapterStats(chapter),opened=chapter.id===openId;
      const percent=100*s.done/s.total;
      return `<section class="cp-chapter ${opened?"is-open":""}" style="--cp-accent:${esc(chapter.accent)}" data-cp-chapter="${esc(chapter.id)}">
        <button class="cp-chapter-toggle" data-action="toggle-chapter" data-chapter="${esc(chapter.id)}" aria-expanded="${opened}" aria-controls="cp-body-${esc(chapter.id)}">
          <span class="cp-chapter-number">${chapter.id==="prologue"?"P":chapter.id==="act1"?"I":chapter.id==="act2"?"II":chapter.id==="act3"?"III":chapter.id==="endgame"?"E":"+"}</span>
          <span><span class="cp-chapter-name">${esc(chapter.title)}</span><span class="cp-chapter-sub">${esc(chapter.subtitle)}</span></span>
          <span class="cp-chapter-count"><strong>${s.done} / ${s.total}</strong><small>${s.skip ? s.skip+" skipped · " : ""}${Math.round(percent)}%</small></span>
          <span class="cp-chevron" aria-hidden="true">⌄</span>
        </button>
        <div class="cp-chapter-progress"><div class="cp-chapter-progress-fill" style="width:${percent}%"></div></div>
        ${opened ? focusMarkup(chapter,s) : ""}
      </section>`;
    }).join("");

    const upcomingScroller = mount.querySelector(".cp-upcoming-list");
    if(upcomingScroller && (preserveUpcomingScroll || !animated)) upcomingScroller.scrollTop = previousUpcomingScroll;
    const prevScroll = dock.querySelector(".cp-route-viewport")?.scrollLeft || 0;
    let furthest=-1;
    steps.forEach((step,index)=>{if(statusOf(step.id)!=="pending")furthest=index;});
    const travel = Math.max(0,100*(furthest+1)/steps.length);
    const currentStep = (selectedStepId && byId.get(selectedStepId)?.step.chapterId === openId ? byId.get(selectedStepId).step : null)
      || activeChapter?.steps.find(s=>statusOf(s.id)==="pending"&&isReady(s)) || null;
    const activeIndex = currentStep ? byId.get(currentStep.id).index : -1;
    dock.innerHTML=`<div class="cp-dock-inner ${animated?"is-updated":""}">
      <div class="cp-dock-head">
        <div><span class="cp-overall-kicker">Total completion</span>
          <span class="cp-overall-num">${overall}% <small>${totalDone} / ${steps.length} steps completed</small></span>
        </div>
        <div class="cp-overall-right">
          <div><strong>${activeChapter ? esc(activeChapter.title) : "Route"}</strong> · ${activeStats ? activeStats.done+" / "+activeStats.total+" complete" : "Select an act"}</div>
          <div>${steps.filter(s=>statusOf(s.id)==="skip").length} skipped · ${steps.length-totalDone} still uncollected</div>
        </div>
      </div>

      <div class="cp-section-strip" aria-label="Act and section completion">
        <div class="cp-section-track">
          ${chapters.map(chapter=>{
            const s=chapterStats(chapter),isActive=chapter.id===openId;
            const percent=Math.round(100*s.done/s.total);
            const tooltip=chapter.title+" · "+s.done+" / "+s.total+" completed ("+percent+"%)";
            return `<button class="cp-section-segment ${isActive?"is-active":""}" type="button" style="--cp-segment-accent:${esc(chapter.accent)};flex-grow:${s.total};" data-action="segment" data-chapter="${esc(chapter.id)}" data-tooltip="${esc(tooltip)}" aria-label="${esc(tooltip+". Open section.")}"><span class="cp-section-fill" style="width:${100*s.done/s.total}%"></span></button>`;
          }).join("")}
        </div>
      </div>
      <div class="cp-route-viewport" aria-label="Scrollable route timeline">
        <div class="cp-route-rail" style="--cp-travel:${travel}%">
          ${steps.map((step,index)=>{
            const status=statusOf(step.id);
            const current=index===activeIndex;
            return `<button class="cp-tick ${status==="done"?"is-done":status==="skip"?"is-skip":""} ${current?"is-current":""}"
              data-action="jump" data-id="${esc(step.id)}"
              title="${esc(step.area+" · "+step.title+" — "+(status==="done"?"Completed":status==="skip"?"Skipped":"Not yet completed"))}"
              aria-label="${esc(step.title+": "+(status==="done"?"completed":status==="skip"?"skipped":"upcoming")+". Open "+chapters.find(c=>c.id===step.chapterId).title)}"></button>`;
          }).join("")}
        </div>
      </div>
      <div class="cp-route-legend">
        <span class="cp-legend-pieces">
          <span class="cp-legend-piece"><i class="cp-legend-dot done"></i> Completed</span>
          <span class="cp-legend-piece"><i class="cp-legend-dot skipped"></i> Skipped</span>
          <span class="cp-legend-piece"><i class="cp-legend-dot"></i> Upcoming</span>
        </span>
        <span class="cp-route-tip">Select any dot to review its exact step</span>
      </div>
    </div>`;
    const viewport=dock.querySelector(".cp-route-viewport");
    if(viewport){
      if(followRail && activeIndex>=0) {
        const dot=viewport.querySelectorAll(".cp-tick")[activeIndex];
        const target=Math.max(0,dot.offsetLeft+dot.offsetWidth/2-viewport.clientWidth/2);
        viewport.scrollLeft=target;
      } else viewport.scrollLeft=prevScroll;
    }
    if (animated) {
      clearTimeout(dockPulseTimer);
      dockPulseTimer=setTimeout(()=>dock.querySelector(".cp-dock-inner")?.classList.remove("is-updated"),550);
    }
  }

  function openChapter(id) {
    if(!chapters.some(c=>c.id===id))return;
    if(selectedStepId && byId.get(selectedStepId)?.step.chapterId !== id) selectedStepId=null;
    openId=id;
    storageSet(OPEN,id);
    render({followRail:true});
  }
  function change(id,status) {
    const item=byId.get(id);
    if(!item)return;
    const activeChapter=chapters.find(c=>c.id===openId);
    const currentBefore=activeChapter?.steps.find(s=>statusOf(s.id)==="pending"&&isReady(s))?.id;
    const changedCurrent=currentBefore===id || selectedStepId===id;
    if(selectedStepId===id)selectedStepId=null;
    if(status==="pending")delete statuses[id];
    else statuses[id]=status;
    touched=id;
    save();
    // Completing an On Deck objective must not move the current step or scroll away.
    render({animated:true,followRail:changedCurrent,preserveUpcomingScroll:!changedCurrent});
    const action = status==="done" ? "Completed" : status==="skip" ? "Skipped for later" : "Restored";
    announce(action+": "+item.step.title+". Progress saved in this browser.");
    if(changedCurrent && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
      mount.querySelector(".cp-focus-card")?.focus({preventScroll:true});
    }
  }

  mount.addEventListener("click",event=>{
    const btn=event.target.closest("button[data-action]");
    if(!btn)return;
    const action=btn.dataset.action,id=btn.dataset.id;
    if(action==="toggle-chapter") {
      if(openId===btn.dataset.chapter) {
        selectedStepId=null;
        openId=null;
        storageSet(OPEN,"");
        render({followRail:false});
      } else openChapter(btn.dataset.chapter);
    }
    if(action==="toggle-ability"){
      const key=btn.dataset.ability;
      if(!abilityById.has(key))return;
      abilityOverrides[key]=!hasCapability(key);
      if(abilityOverrides[key]&&key==="endingMaelle")abilityOverrides.endingVerso=false;
      if(abilityOverrides[key]&&key==="endingVerso")abilityOverrides.endingMaelle=false;
      storageSet(ABILITY_STORAGE,JSON.stringify(abilityOverrides));
      render({followRail:false});
      announce((abilityOverrides[key]?"Unlocked: ":"Locked: ")+abilityById.get(key).label);
      return;
    }
    if(action==="toggle-audit"){
      const target=btn.dataset.type==="locked"?showLocked:showUnverified;
      if(target.has(btn.dataset.chapter))target.delete(btn.dataset.chapter);
      else target.add(btn.dataset.chapter);
      render({followRail:false});
      return;
    }
    if(action==="details")showGuide(id);
    if(action==="resume"){
      selectedStepId=null;
      render({followRail:true});
      mount.querySelector(".cp-focus-card")?.scrollIntoView?.({behavior:"smooth",block:"start"});
      announce("Returned to the active objective.");
    }
    if(action==="done" || action==="skip")change(id,action);
    if(action==="restore")change(id,"pending");
    if(action==="toggle-skips") {
      const chapter=btn.dataset.chapter;
      if(showSkips.has(chapter))showSkips.delete(chapter);
      else showSkips.add(chapter);
      render({followRail:false});
    }
    if(action==="revisit-first"){
      const chapter=chapters.find(c=>c.id===btn.dataset.chapter);
      const first=chapter?.steps.find(s=>statusOf(s.id)==="skip");
      if(first)change(first.id,"pending");
    }
  });
  mount.addEventListener("toggle",event=>{
    if(!(event.target instanceof HTMLDetailsElement) || !event.target.dataset.archive)return;
    const chapter=event.target.dataset.archive;
    if(event.target.open)showArchives.add(chapter); else showArchives.delete(chapter);
  },true);
  dock.addEventListener("click",event=>{
    const segment=event.target.closest("button[data-action='segment']");
    if(segment){selectedStepId=null;openChapter(segment.dataset.chapter);mount.querySelector('[data-cp-chapter="'+segment.dataset.chapter+'"]')?.scrollIntoView({behavior:"smooth",block:"start"});return;}
    const btn=event.target.closest("button[data-action='jump']");
    if(!btn)return;
    const item=byId.get(btn.dataset.id);
    if(!item)return;
    // Show the selected objective in the focus card, regardless of its status.
    // In particular, a skipped dot must NOT be silently restored or stay hidden.
    selectedStepId=item.step.id;
    openChapter(item.step.chapterId);
    const focus=mount.querySelector(".cp-focus-card");
    (focus || mount.querySelector('[data-cp-chapter="'+item.step.chapterId+'"]'))?.scrollIntoView({behavior:"smooth",block:"start"});
    focus?.focus?.({preventScroll:true});
    announce("Reviewing "+item.step.title+". Its completion status has not changed.");
  });

  document.getElementById("completionistExport")?.addEventListener("click",()=>{
    const payload={app:"E33.EXE",type:"completionist",schema:2,exported:new Date().toISOString(),statuses,abilityOverrides};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const uri=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=uri;a.download="e33-completionist-backup.json";
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(uri),300);
    announce("Completionist backup exported.");
  });
  const importInput=document.getElementById("completionistImportInput");
  document.getElementById("completionistImport")?.addEventListener("click",()=>importInput?.click());
  importInput?.addEventListener("change",async()=>{
    const file=importInput.files?.[0];
    if(!file)return;
    try {
      const parsed=JSON.parse(await file.text());
      if(parsed.type!=="completionist" || !parsed.statuses || typeof parsed.statuses!=="object" || Array.isArray(parsed.statuses))throw new Error("Invalid completionist backup.");
      const incoming={};
      Object.entries(parsed.statuses).forEach(([id,status])=>{
        if(byId.has(id) && (status==="done"||status==="skip")) incoming[id]=status;
      });
      if(!window.confirm("Import this backup? It will replace the current Completionist progress on this browser."))return;
      statuses=incoming;
      abilityOverrides=parsed.abilityOverrides&&typeof parsed.abilityOverrides==="object"?parsed.abilityOverrides:{};
      storageSet(ABILITY_STORAGE,JSON.stringify(abilityOverrides));
      save();render({animated:true});announce("Completionist progress imported.");
    } catch(err){announce("Import failed. Select an E33.EXE Completionist backup JSON file.");window.alert("Import failed: "+err.message);}
    finally{importInput.value="";}
  });
  document.getElementById("completionistReset")?.addEventListener("click",()=>{
    if(!window.confirm("Reset ALL Completionist progress in this browser? Export a backup first if you want to keep it."))return;
    statuses={};abilityOverrides={};storageSet(ABILITY_STORAGE,"{}");save();render({animated:true});announce("Completionist progress reset.");
  });
  render({followRail:true});
})();
