"use strict";
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const assert=require("node:assert/strict"),base=path.resolve(__dirname,"..");
const childNames=[".cp-guide-body","#cpGuideChapter","#cpGuideType","#cpGuideTitle","#cpGuideLocation","#cpGuideNumber","#cpGuideControls",".cp-guide-scroll",".cp-guide-close"];
const children={};
class Element {
 constructor(name){this.name=name;this.handlers={};this.textContent="";this.innerHTML="";
  this.scrollLeft=0;this.scrollTop=0;this.style={setProperty(){}};
  this.classList={add(){},remove(){},contains(){return false}};}
 querySelector(s){return this.name==="modal"?(children[s]||null):null;}
 querySelectorAll(){return [];}
 addEventListener(k,fn){this.handlers[k]=fn;}
 setAttribute(){} focus(){} scrollIntoView(){}
}
for(const n of childNames)children[n]=new Element(n);
const els={completionistSections:new Element("mount"),completionistDock:new Element("dock"),
 completionistAnnouncement:new Element("announcements"),completionistGuideModal:new Element("modal")};
const store={};
const win={localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=String(v)},
 matchMedia:()=>({matches:true}),confirm:()=>true,alert(){}};
const doc={body:new Element("body"),activeElement:null,getElementById:id=>els[id]||null};
const context={window:win,document:doc,console,HTMLDetailsElement:class{},setTimeout:()=>0,
 clearTimeout(){},Date,Math,JSON};
vm.createContext(context);
for(const f of ["completionist-data.js","completionist-chronology.js","completionist-details.js",
 "completionist-routes.js","completionist-context.js","completionist-gates.js",
 "completionist-integrity.js","completionist-precision.js","completionist-coverage.js","completionist-merchants.js","completionist.js"]){
 vm.runInContext(fs.readFileSync(path.join(base,f),"utf8"),context,{filename:f,timeout:10000});
}
const mount=els.completionistSections,dock=els.completionistDock;
const click=(scope,action,dataset={})=>{
 assert.equal(typeof scope.handlers.click,"function","Missing click listener");
 const b={dataset:{action,...dataset}};
 scope.handlers.click({target:{closest:()=>b}});
};
assert.match(mount.innerHTML,/TRAVERSAL CHECK/);
assert.match(dock.innerHTML,/802 steps completed/);
click(mount,"toggle-ability",{ability:"fly"});
click(mount,"toggle-ability",{ability:"endingMaelle"});
click(mount,"toggle-ability",{ability:"endingVerso"});
const flags=JSON.parse(store["e33-completionist-abilities-v1"]);
assert.equal(flags.fly,true);
assert.equal(flags.endingMaelle,false);
assert.equal(flags.endingVerso,true);
const all=win.E33_COMPLETION_DATA.flatMap(c=>c.areas.flatMap(a=>a[1]));
const civilian=all.find(x=>x[1]==="Verso — Civilian outfit");
const starter=all.find(x=>x[1]==="Noahram");
assert.ok(civilian&&starter);
const pure=all.find(x=>x[1]==="Monoco · Pure haircut");
assert.ok(pure,"Monoco Pure haircut missing");
click(mount,"details",{id:pure[3]});
assert.match(children[".cp-guide-body"].innerHTML,/Requires Fly|Required traversal: Fly/i);
assert.match(children[".cp-guide-body"].innerHTML,/2,000 Chroma/);

click(mount,"details",{id:civilian[3]});
assert.match(children[".cp-guide-body"].innerHTML,/spiral/i);
assert.match(children[".cp-guide-body"].innerHTML,/Required traversal: Swim/);
click(mount,"done",{id:starter[3]});
click(mount,"skip",{id:civilian[3]});
click(dock,"jump",{id:civilian[3]});
const statuses=JSON.parse(store["e33-completionist-progress-v1"]).statuses;
assert.equal(statuses[starter[3]],"done");
assert.equal(statuses[civilian[3]],"skip","Timeline navigation must preserve skipped status");
assert.match(mount.innerHTML,/Verso — Civilian outfit/);
console.log("PASS: 802-step UI rendered, gates toggled, outcomes exclusive, directions viewed, done/skip persisted, skipped timeline navigated.");
