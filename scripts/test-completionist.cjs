// E33.EXE: Run \`node scripts/test-completionist.cjs\` from the repository root.
// Structural regression checks do not substitute for in-game pickup verification.
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const scope={window:{}};vm.createContext(scope);
for(const name of ["completionist-data.js","completionist-chronology.js","completionist-gates.js","completionist-integrity.js","completionist-precision.js"])
  vm.runInContext(fs.readFileSync(path.join(root,name),"utf8"),scope,{filename:name});
const w=scope.window, audit=w.E33_COMPLETION_AUDIT;
const rows=w.E33_COMPLETION_DATA.flatMap(c=>c.areas.flatMap(([area,r])=>r.map(x=>({
  chapter:c.id,area,id:x[3],title:x[1],description:x[2]
}))));
const byId=new Map(rows.map(x=>[x.id,x]));
function item(title){const x=rows.find(x=>x.title===title);assert.ok(x,title+" missing");return x;}
assert.ok(rows.length>=780,"Unexpectedly reduced checklist");
assert.equal(byId.size,rows.length,"Duplicate checkpoint IDs");
for(const r of rows){
  assert.ok(r.id&&r.description,"Empty ID or description");
  assert.ok(Array.isArray(audit.requirements[r.id]),"Missing capability: "+r.id);
  assert.ok(audit.quality[r.id],"Missing review status: "+r.id);
  assert.ok(!["act1","act2"].includes(r.chapter)||
    !audit.requirements[r.id].some(x=>x==="fly"||x==="dive"),
    "Impossible early traversal: "+r.id);
  if(audit.quality[r.id]==="verified")
    assert.doesNotMatch(r.description,/Acquisition inventory check|Check that this distinct|consult an area guide for exact position/i);
}
for(const [id,gate] of Object.entries(w.E33_COMPLETION_GATES.steps)){
  assert.ok(byId.has(id),"Orphan gate: "+id);
  for(const dep of gate.requires||[])assert.ok(byId.has(dep),"Dangling prerequisite: "+id+" -> "+dep);
}
assert.equal(item("Angerim").chapter,"act3");
assert.ok(audit.requirements[item("Angerim").id].includes("fly"));
assert.match(item("Verso — Civilian outfit").description,/spiral/i);
assert.match(item("Verso — Civilian outfit").description,/books/i);
assert.equal(item("Stalum").area,"Continent · northern detours");
assert.equal(item("Maelle — Swimsuit outfit").chapter,"act3");
assert.equal(item("Verso — Swimsuit 1 outfit").chapter,"act3");
assert.equal(item("Verso — Swimsuit 2 outfit").chapter,"act2");
assert.equal(item("Maelle — Civilian outfit").chapter,"act2");
assert.equal(item("Snowim").chapter,"act2");
assert.equal(item("Sciel").chapter,"act3");
assert.equal(item("Goblu").chapter,"act1");
assert.ok(w.E33_RECORD_CATALOG&&w.E33_RECORD_CATALOG.unique===33,"Music record catalog mismatch");
assert.ok(audit.requirements[item("Gustave — Renoir's Suit outfit").id].includes("ngplus"));
for (const name of ["Gustave — Civilian outfit","Gustave — Renoir outfit","Verso — Renoir outfit"])
 assert.ok(audit.requirements[item(name).id].some(req=>req==="endingMaelle"||req==="endingVerso"),"Missing finale-choice gate: "+name);
assert.equal(item("Barrier Breaker").chapter,"act2");
assert.ok(audit.requirements[item("Piercing Shot").id].includes("paint"));
assert.equal(audit.stats.vague,0,"All 796 entries must have item-specific pickup directions");
assert.ok(w.E33_PRECISION_AUDIT.updated>=300,"All second-pass source corrections must load");
assert.equal(item("Baguette").chapter,"endgame");
assert.ok(audit.requirements[item("Baguette").id].includes("ngplus"));
assert.equal(item("Burning Shots").chapter,"act1");
assert.ok(!audit.requirements[item("Gestral Race").id].includes("fly"));
const act2=w.E33_COMPLETION_DATA.find(c=>c.id==="act2").areas.map(a=>a[0]);
assert.ok(act2.indexOf("Collectibles · Frozen Hearts")>act2.indexOf("Monoco's Station"));
assert.ok(act2.indexOf("Collectibles · Frozen Hearts")<act2.indexOf("Old Lumière"));
assert.ok(act2.indexOf("Return Eternal Ice to Grandis merchant")>act2.indexOf("Collectibles · Frozen Hearts"));
for(const name of ["Coldum","Cultam","Grandaro","Survivor","Greater Rush"])
  assert.equal(item(name).area,"Return Eternal Ice to Grandis merchant");

/* Verify every traversal ability exists before the steps requiring it. */
const ix=new Map(rows.map((r,i)=>[r.id,i]));
for(const r of rows)for(const ability of audit.requirements[r.id]){
 const milestone=audit.milestones?.[ability];
 if(milestone&&ix.has(milestone))
   assert.ok(ix.get(milestone)<=ix.get(r.id),"Ability "+ability+" unlocks AFTER "+r.title);
}
const milestoneIds=new Set(rows.map(r=>r.id));
for(const [id,gate] of Object.entries(w.E33_COMPLETION_GATES.steps)){
 for(const needed of gate.requires||[])
  assert.ok(ix.get(needed)<ix.get(id),"Quest prerequisite appears after "+id);
}

console.log("PASS",rows.length,"unique collectible steps;",audit.stats.corrected,"source-linked corrections;",
  audit.stats.vague,"generic item directions remaining.");
