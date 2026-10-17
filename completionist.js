/* E33.EXE Completionist – persistent sequential quest tracker */
(function () {
  "use strict";
  const raw = window.E33_COMPLETION_DATA;
  const mount = document.getElementById("completionistSections");
  const dock = document.getElementById("completionistDock");
  const live = document.getElementById("completionistAnnouncement");
  if (!Array.isArray(raw) || !mount || !dock) return;

  const STORE = "e33-completionist-progress-v1";
  const OPEN = "e33-completionist-active-v1";
  const slug = x => String(x).normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const esc = x => String(x).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const chapters = raw.map((chapter, chapterIndex) => {
    const steps = chapter.areas.flatMap(([area, entries]) => entries.map(([kind,title,directions,stableId], position) => ({
      id: typeof stableId === "string" && stableId ? stableId : chapter.id + ":" + slug(area) + ":" + slug(title),
      kind,title,directions,area,position,chapterId:chapter.id
    })));
    return {...chapter,number:chapterIndex,steps};
  });
  const steps = chapters.flatMap(c => c.steps);
  const byId = new Map(steps.map((step,i) => [step.id,{step,index:i}]));
  let statuses = {};
  let openId = "act1";
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
  function icon(kind) {
    return ({
      "Quest":"✦","Missable quest":"!","Journal":"≡","Record":"♫",
      "Picto":"◇","Weapon":"⚔","Boss":"◆","Optional boss":"◆",
      "Chromatic":"✹","Rare enemy":"◎","Lost Gestral":"◉",
      "Merchant":"◈","Cosmetic":"◈","Secret":"✧","Minigame":"✦",
      "Arena":"◇","Story":"→","Relationship":"♡","Collection":"▣"
    })[kind] || "◇";
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
          <button class="cp-inline" data-action="restore" data-id="${esc(step.id)}" aria-label="Undo ${esc(step.title)}">Undo</button>
        </div>`).join("")}
      </div>
    </details>`;
  }

  // Show a compact, internally scrollable preview without diluting the primary objective.
  function upcomingMarkup(chapter, current) {
    if (!current) return "";
    const nextIndex = chapter.steps.indexOf(current);
    const upcoming = chapter.steps.slice(nextIndex + 1).filter(s => statusOf(s.id) === "pending").slice(0, 8);
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
              <p class="cp-upcoming-instructions">${esc(step.directions)}</p>
              <div class="cp-upcoming-meta"><span>${esc(step.area)}</span><span class="cp-upcoming-type">${esc(icon(step.kind)+" "+step.kind)}</span></div>
              <div class="cp-upcoming-actions">
                <button class="cp-inline cp-upcoming-complete" data-action="done" data-id="${esc(step.id)}" aria-label="Complete ${esc(step.title)}">✓ Complete Step</button>
                <button class="cp-inline cp-upcoming-skip" data-action="skip" data-id="${esc(step.id)}" aria-label="Skip ${esc(step.title)} for now">Skip for now ↷</button>
              </div>
            </div>
          </div>`;
        }).join("")}
      </div>
      <div class="cp-upcoming-footer">Showing the next ${upcoming.length} unfinished step${upcoming.length === 1 ? "" : "s"} · More appear as you progress</div>
    </section>`;
  }

  function focusMarkup(chapter,stats) {
    const next = chapter.steps.find(step => statusOf(step.id) === "pending");
    const completed = chapter.steps.filter(step => statusOf(step.id) === "done");
    const upcoming = upcomingMarkup(chapter,next);
    const skipped = skippedMarkup(chapter);
    const archive = archiveMarkup(chapter,completed);
    let main;
    if (!next) {
      main = `<div class="cp-finished">
        <h3>${stats.skip ? "All checkpoints visited" : "Act complete ✓"}</h3>
        <p>${stats.skip ? "You reached the end of this route, but skipped checkpoints remain uncollected. Mark them complete above or choose Revisit to bring one back." : "Every step in this section has been completed."}</p>
        ${stats.skip ? `<button class="cp-tool" data-action="revisit-first" data-chapter="${esc(chapter.id)}">Revisit first skipped step ↗</button>` : ""}
      </div>`;
    } else {
      const idx=chapter.steps.indexOf(next)+1;
      main = `<article class="cp-focus-card" tabindex="-1" aria-label="Active Step">
        <div class="cp-focus-overline">
          <span class="cp-next-label">Active Step</span>
          <span class="cp-kind">${esc(icon(next.kind)+" "+next.kind)}</span>
          <span class="cp-step-counter">STEP ${idx} / ${chapter.steps.length}</span>
        </div>
        <div class="cp-stage">${esc(next.area)} <span aria-hidden="true">↗</span></div>
        <h3 style="margin-top:19px">${esc(next.title)}</h3>
        <div class="cp-directions-label">Where to go / how to complete</div>
        <p class="cp-directions">${esc(next.directions)}</p>
        <div class="cp-step-actions">
          <button class="cp-done" data-action="done" data-id="${esc(next.id)}"><span aria-hidden="true">✓</span> Complete Step</button>
          <button class="cp-skip" data-action="skip" data-id="${esc(next.id)}">Skip for now ↷</button>
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
      ${archive}
    </div>`;
  }

  function render({animated=false,followRail=true,preserveUpcomingScroll=false}={}) {
    const totalDone = steps.filter(s => statusOf(s.id) === "done").length;
    const overall = Math.round(100*totalDone/steps.length);
    const activeChapter = chapters.find(c=>c.id===openId);
    const activeStats = activeChapter ? chapterStats(activeChapter) : null;
    const previousUpcomingScroll = mount.querySelector(".cp-upcoming-list")?.scrollTop || 0;
    mount.innerHTML=chapters.map(chapter => {
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
    const currentStep = activeChapter?.steps.find(s=>statusOf(s.id)==="pending") || null;
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
        <span class="cp-route-tip">Fill = completion · line = route reached · select dots to open their section</span>
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
    openId=id;
    storageSet(OPEN,id);
    render({followRail:true});
  }
  function change(id,status) {
    const item=byId.get(id);
    if(!item)return;
    const activeChapter=chapters.find(c=>c.id===openId);
    const currentBefore=activeChapter?.steps.find(s=>statusOf(s.id)==="pending")?.id;
    const changedCurrent=currentBefore===id;
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
        openId=null;
        storageSet(OPEN,"");
        render({followRail:false});
      } else openChapter(btn.dataset.chapter);
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
    const btn=event.target.closest("button[data-action='jump']");
    if(!btn)return;
    const item=byId.get(btn.dataset.id);
    if(!item)return;
    if(statusOf(item.step.id)==="skip")showSkips.add(item.step.chapterId);
    if(statusOf(item.step.id)==="done")showArchives.add(item.step.chapterId);
    openChapter(item.step.chapterId);
    mount.querySelector('[data-cp-chapter="'+item.step.chapterId+'"]')?.scrollIntoView({behavior:"smooth",block:"start"});
    announce(item.step.area+": "+item.step.title);
  });

  document.getElementById("completionistExport")?.addEventListener("click",()=>{
    const payload={app:"E33.EXE",type:"completionist",schema:1,exported:new Date().toISOString(),statuses};
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
      save();render({animated:true});announce("Completionist progress imported.");
    } catch(err){announce("Import failed. Select an E33.EXE Completionist backup JSON file.");window.alert("Import failed: "+err.message);}
    finally{importInput.value="";}
  });
  document.getElementById("completionistReset")?.addEventListener("click",()=>{
    if(!window.confirm("Reset ALL Completionist progress in this browser? Export a backup first if you want to keep it."))return;
    statuses={};save();render({animated:true});announce("Completionist progress reset.");
  });
  render({followRail:true});
})();
