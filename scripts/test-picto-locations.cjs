"use strict";
/* E33.EXE: verify the independent Picto Locations inventory and regression gates.
 * Source checks cannot replace manual in-game acquisition verification. */
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"picto-locations.css"),"utf8");
const script=fs.readFileSync(path.join(root,"picto-locations.js"),"utf8");
const dataText=fs.readFileSync(path.join(root,"picto-locations-data.js"),"utf8");
const scope={window:{}};
vm.runInNewContext(dataText,scope,{filename:"picto-locations-data.js",timeout:10000});
const entries=scope.window.E33_PICTO_LOCATION_DATA;
const originalMatch=html.match(/const luminaData = (\[[^\n]+\]);/);
assert.ok(originalMatch,"Cannot inspect existing catalog");
const original=JSON.parse(originalMatch[1]);
assert.equal(entries.length,210,"Guide should contain exactly 210 Pictos");
assert.equal(new Set(entries.map(x=>x.name)).size,210,"Duplicated Picto");
assert.equal(original.length,210,"Old Picto inventory changed unexpectedly");
const catalogNames=new Set(original.map(x=>x.name));
for(const p of entries){
 assert.ok(catalogNames.has(p.name),"Unknown Picto "+p.name);
 assert.ok(p.guide.length>=55,"Location instructions too short: "+p.name);
 assert.ok(p.section.length>=3,"Missing region: "+p.name);
 assert.ok(p.requirement.length>=4,"Missing access gate: "+p.name);
 assert.ok(p.source.startsWith("https://"),"Missing source: "+p.name);
 assert.ok(["act1","act2","act3","update","endgame"].includes(p.chapter),p.name+": unknown progression stage");
 assert.ok(!["act1","act2"].includes(p.chapter)||!/\b(Fly to|requires flight|unlock(?:s|ed)? FLIGHT)\b/i.test(p.guide),p.name+": flight content placed before Act 3");
}
for(const name of catalogNames)assert.ok(entries.some(p=>p.name===name),"Guide misses "+name);
assert.equal(entries.filter(p=>p.dlc).length,17,"DLC/update Picto count");
assert.equal(entries.filter(p=>p.missable).length,2,"Missable Picto count");

// Each visible requirement tag must match the per-item audited progression gate.
// Do not infer Paint Break from Paint Cage or Esquie flight from a nearby area.
const auditScope={window:{}};
vm.createContext(auditScope);
const auditedModules=[
 "completionist-data.js","completionist-chronology.js","completionist-details.js",
 "completionist-routes.js","completionist-context.js","completionist-gates.js",
 "completionist-integrity.js","completionist-precision.js","completionist-coverage.js",
 "completionist-merchants.js","completionist-areas.js"
];
for(const file of auditedModules)
 vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),auditScope,{filename:file,timeout:10000});
const aliases={
 "Exposing Attack · Noco exclusive":"Exposing Attack (Missable)",
 "Energising Heal (west beach camp)":"Energising Heal",
 "Shared Care (southern island)":"Shared Care",
 "Accelerating Heal (eastern camp)":"Accelerating Heal"
};
const auditedPictos=new Map();
for(const chapter of auditScope.window.E33_COMPLETION_DATA)
 for(const [area,steps] of chapter.areas)
  for(const step of steps)
   if(step[0]==="Picto"){
    const name=aliases[step[1]]||step[1];
    assert.ok(!auditedPictos.has(name),"Duplicate Picto in audit: "+name);
    auditedPictos.set(name,auditScope.window.E33_COMPLETION_AUDIT.requirements[step[3]]||[]);
   }
assert.equal(auditedPictos.size,210,"Audited Picto source coverage changed");
const knownGates=new Set(["rough","swim","paint","reef","fly","dive"]);
for(const p of entries){
 assert.ok(Array.isArray(p.requirements),p.name+" missing requirements array");
 assert.ok(p.requirements.every(g=>knownGates.has(g)),p.name+" has unknown ability");
 assert.equal(new Set(p.requirements).size,p.requirements.length,p.name+" duplicated ability");
 assert.equal(JSON.stringify([...p.requirements].sort()),JSON.stringify([...(auditedPictos.get(p.name)||[])].sort()),
  p.name+" requirements differ from audited Completionist gates");
}
const reqOf=name=>entries.find(p=>p.name===name).requirements;
assert.ok(reqOf("Piercing Shot").includes("paint"),"Piercing Shot needs Sastro Paint Break");
assert.ok(!reqOf("Energising Revive").includes("paint"),"Paint Cage must not imply Paint Break");
assert.ok(reqOf("Breaking Death").includes("fly"),"Thunder Évêque requires flight");
assert.ok(reqOf("Shortcut").includes("dive"),"Renoir's Drafts requires dive");
assert.ok(entries.some(p=>p.requirements.includes("rough")),"Missing Esquie terrain badges");
assert.ok(entries.some(p=>p.requirements.includes("reef")),"Missing Esquie Coral Break badges");

const byName=Object.fromEntries(entries.map(p=>[p.name,p]));
assert.equal(byName["Breaking Death"].chapter,"act3","Thunder Évêque requires flight");
assert.match(byName["Breaking Death"].guide,/THUNDER ÉVÊQUE/i);
assert.equal(byName["Energising Start IV"].chapter,"act2");
assert.equal(byName["Augmented Counter III"].chapter,"act3");
assert.match(byName["Exposing Attack (Missable)"].guide,/Noco/i);
assert.match(byName["Auto Powerful"].guide,/Chalier/i);
assert.ok(entries.filter(p=>p.section==="Flying Manor"||p.section==="Endless Tower").every(p=>/Esquie flight/i.test(p.requirement)),"Flying Manor and Endless Tower accessible immediately after flight");
assert.ok(entries.filter(p=>p.chapter==="endgame"&&p.section==="Optional regions, bosses and secret weapons").every(p=>/Esquie diving/i.test(p.requirement)),"Renoir's Drafts needs diving");
const position=name=>entries.findIndex(p=>p.name===name);
assert.ok(position("Stay Marked")<position("Shortcut")&&position("Shortcut")<position("AP Discount"),"Flight areas should precede diving zones and DLC");

assert.equal(byName["Piercing Shot"].chapter,"act2","Paint Break gate in Ancient Sanctuary");
assert.match(byName["Piercing Shot"].requirement,/Paint Break/i);
assert.ok(entries.filter(p=>p.chapter==="update").every(p=>/diving/i.test(p.requirement)),"Verso's Drafts requires Esquie diving");
assert.ok(entries.filter(p=>p.chapter==="endgame"&&/Renoir.s Drafts/i.test(p.location)).every(p=>/diving/i.test(p.requirement)),"Renoir's Drafts requires dive");
const chapterRank={act1:0,act2:1,act3:2,endgame:3,update:4};
for(let i=1;i<entries.length;i++)
 assert.ok(chapterRank[entries[i-1].chapter]<=chapterRank[entries[i].chapter],"Guide chapter order regressed near "+entries[i].name);
assert.match(html,/id="pictoHuntPage"/);
assert.match(html,/data-page="pictoHuntPage"/);
assert.match(html,/data-hunt-tab="all"[\s\S]*data-hunt-tab="found"[\s\S]*data-hunt-tab="maxed"/);
assert.match(html,/picto-locations-data\.js/);
assert.match(html,/picto-locations\.css/);
assert.match(html,/picto-locations\.js/);
assert.match(script,/e33-picto-location-hunt-v1/);
assert.doesNotMatch(script,/\be33-acquired-pictos-luminas-v1\b.*(?:getItem|setItem)/);
assert.doesNotMatch(script,/\be33-owned-picto-levels-v1\b.*(?:getItem|setItem)/);
assert.match(script,/if\(checked\)progress\[name\]='maxed'/,"Checking Maxed must mark the row as Maxed");
assert.match(script,/tab==='found'&&progress\[p\.name\]!=='found'/,"Found tab must exclude Maxed Pictos");
assert.match(script,/set\('pictoHuntTabFoundCount',found\)/,"Found tab count must exclude Maxed Pictos");
assert.match(html,/Found and Maxed are separate tabs/,"UI explanation must reflect mutually exclusive tabs");
assert.match(script,/input\.dataset\.huntStatus==='found'\?now!=='unfound':now==='maxed'/,"Checking Maxed must check Found");
assert.match(css,/\.pl-meter-maxed/);

assert.match(script,/function requirementHTML\(p\)/,"Requirements must render as independent badges");
for(const label of ["Esquie Swim","Paint Break","Esquie Coral Break","Esquie Fly","Esquie Dive"])
 assert.ok(script.includes(label),"Missing requirement label: "+label);
assert.match(css,/\.pl-req-rough/,"Missing Esquie tag styling");
assert.match(css,/\.pl-req-reef/,"Missing coral-break tag styling");
assert.match(css,/\.pl-req-none/,"Missing no-traversal-requirement tag styling");
for(const status of ["unfound","found","maxed"])
 assert.match(css,new RegExp("\\.pl-meter-"+status+"\\{background:linear-gradient"),status+" progress bar needs high-contrast gradient");
assert.match(html,/<main class="site-main-scroll" id="siteViewport"/,"Main content needs its own scrolling region beneath the header");
assert.match(html,/\.site-main-scroll\s*\{[^}]*overflow-y:auto/,"Main scrolling region must own vertical scrolling");
assert.match(html,/html,body\s*\{height:100%;overflow:hidden;\}/,"Root scrollbar must be hidden");
assert.match(html,/document\.getElementById\('siteViewport'\)\.scrollTop=0/,"Switching tabs must reset the new scrollport");
assert.match(html,/#buildsPage \.build-toolbar,#luminaPage \.library-toolbar \{top:0 !important;\}/,"Sticky toolbars must respect the internal scrollport");
assert.match(html,/picto-locations\.js\?v=14\.12\.1/,"Bump cache-busting version to avoid stale browser scripts");
assert.doesNotMatch(html,/window\.scrollTo\(0,0\)/,"Page switching cannot scroll the old document");

console.log("Picto Locations verified: 210 audited requirements, traversal tags, contrast bars, isolated scrollport, separate persistent tracker.");
