/* E33.EXE: Area entrance != the accessibility of every nearby plateau.
 * Cross-checked Stone Wave Cliffs Cave versus its flight-only exterior plateau.
 * Load AFTER merchant registry and BEFORE completionist.js.
 */
(function(){
"use strict";
const chapters=window.E33_COMPLETION_DATA||[];
const audit=window.E33_COMPLETION_AUDIT;
if(!audit||!window.E33_MERCHANT_ACCESS)throw Error("Area access requires completionist merchant and audit modules");
const records=new Map();
for(const chapter of chapters)for(const pair of chapter.areas)for(const entry of pair[1]){
  records.set(entry[3],{chapter,pair,entry});
}
const evidence={
 thunder:[
  "https://www.gamerguides.com/clair-obscur-expedition-33/database/enemies/optional-bosses/thunder-eveque",
  "https://www.neoseeker.com/clair-obscur-expedition-33/Overworld_Exploration",
  "https://gamefaqs.gamespot.com/ps5/469495-clair-obscur-expedition-33/faqs/81920/chapter-19-flying-manor"
 ],
 cave:[
  "https://www.neoseeker.com/clair-obscur-expedition-33/Stone_Wave_Cliffs_Cave",
  "https://gamefaqs.gamespot.com/pc/469480-clair-obscur-expedition-33/faqs/81920/chapter-8-forgotten-battlefield"
 ],
 merchant:[
  "https://gamefaqs.gamespot.com/ps5/469495-clair-obscur-expedition-33/faqs/81883/merchants",
  "https://www.neoseeker.com/clair-obscur-expedition-33/Hairstyles"
 ]
};
function area(chapterId,name,after){
  const chapter=chapters.find(x=>x.id===chapterId);
  if(!chapter)throw Error("Missing chapter "+chapterId);
  let existing=chapter.areas.find(x=>x[0]===name);
  if(!existing){
    existing=[name,[]];
    const pos=chapter.areas.findIndex(g=>g[0]===after);
    if(pos<0)throw Error("Missing preceding area: "+after);
    chapter.areas.splice(pos+1,0,existing);
  }
  return {chapter,pair:existing};
}
function edit(id,{target,route,abilities,source,kind}){
  const v=records.get(id);
  if(!v)throw Error("Missing checkpoint "+id);
  const {entry}=v;
  if(target){
    const next=area(target[0],target[1],target[2]);
    if(v.pair!==next.pair){
      const i=v.pair[1].indexOf(entry);
      if(i<0)throw Error("Checkpoint detached: "+id);
      v.pair[1].splice(i,1);
      next.pair[1].push(entry);
      v.chapter=next.chapter;v.pair=next.pair;
    }
  }
  if(kind)entry[0]=kind;
  if(route){entry[2]=route;audit.corrected[id]=route;audit.quality[id]="verified";audit.verified[id]=true;}
  if(abilities)audit.requirements[id]=abilities;
  if(source)audit.sources[id]=source;
}
const flyPlateau=["act3","Continent · elevated Stone Wave Cliffs plateau (flight)","Continent · first flight sweep"];
const landCave=["act2","Collectibles · Stone Wave Cliffs Cave"];
edit("inventory:picto-inventory-audit-continent:breaking-death",{
  target:flyPlateau,abilities:["fly"],source:evidence.thunder[0],
  route:"Only after ESQUIE unlocks FLIGHT in ACT 3: from the Continent's eastern coast locate the STONE WAVE CLIFFS CAVE entrance, then fly UP to the otherwise inaccessible GRASSY PLATEAU EAST of the cave. Find the solitary lightning-infused THUNDER ÉVÊQUE in the plateau's open field and DEFEAT IT to receive the BREAKING DEATH Picto (Level 29). The cave entrance below is swim-accessible in Act 2, but this boss is NOT."
});
edit("inventory:picto-inventory-audit-continent:energising-shell",{
  target:flyPlateau,abilities:["fly","paint"],source:"https://www.neoseeker.com/clair-obscur-expedition-33/Paint_Spikes",
  route:"With FLIGHT and PAINT BREAK unlocked, rise above the STONE WAVE CLIFFS CAVE entrance and fly to the raised rocky site just EAST of it. At the BASE OF THE LARGE STRANGE STATUE find a blue-cracked PAINT SPIKE, destroy it, and pick up the ENERGISING SHELL Picto revealed behind it."
});
edit("inventory:haircut-collection-audit-lune:lune-braid-haircut",{
  target:landCave,abilities:["swim"],source:evidence.merchant[0],
  route:"At the start of ACT 2, summon ESQUIE and SWIM EAST around STONE WAVE CLIFFS to the BEACH with the STONE WAVE CLIFFS CAVE portal. Find Gestral merchant APPLA standing immediately outside the portal, and buy Lune's BRAID haircut for 1,000 Chroma."
});
edit("inventory:haircut-collection-audit-sciel:sciel-short-curly-haircut",{
  target:landCave,abilities:["swim"],source:evidence.merchant[0],
  route:"After Esquie can SWIM, land on the small BEACH directly EAST of STONE WAVE CLIFFS where the STONE WAVE CLIFFS CAVE portal stands. Speak to APPLA beside the entrance and buy Sciel's SHORT CURLY haircut for 1,000 Chroma, alongside Lune's Braid haircut."
});
edit("inventory:picto-inventory-audit-stone-wave-cliffs-cave:energising-revive",{
  target:landCave,abilities:["swim"],source:evidence.cave[1],
  route:"From the STONE WAVE CLIFFS CAVE ENTRANCE Flag, follow the downhill route, cross the first gap, crawl through the RIGHT-HAND opening if collecting the side Paint Cage, then return to the main passage. GRAPPLE to the final arena and DEFEAT THE CHROMATIC HEXGA for ENERGISING REVIVE (Level 8)."
});
edit("inventory:picto-inventory-audit-stone-wave-cliffs-cave:exhausting-power",{
  target:landCave,abilities:["swim"],source:evidence.cave[1],
  route:"Immediately AFTER defeating the CHROMATIC HEXGA at the end of STONE WAVE CLIFFS CAVE, collect the EXHAUSTING POWER Picto (Level 8) from the LEFT SIDE of its arena. Also collect the Expedition 54 journal on the RIGHT before taking the exit portal."
});
edit("endgame:verification-sweep:expedition-54",{
  target:landCave,abilities:["swim"],source:evidence.cave[1],kind:"Journal",
  route:"In ACT 2, enter STONE WAVE CLIFFS CAVE from the swim-accessible beach EAST of Stone Wave Cliffs. Follow the cave to its LAST ARENA and defeat CHROMATIC HEXGA. Pick up EXPEDITION 54 from the RIGHT-HAND SIDE of the arena, opposite the Exhausting Power Picto, BEFORE exiting."
});
// Within the same cave run, do the two merchant purchases first, then boss,
// then two pickups, rather than forcing backtracking through separate chapters.
const cave=area("act2","Collectibles · Stone Wave Cliffs Cave").pair;
const caveOrder=[
 "inventory:haircut-collection-audit-lune:lune-braid-haircut",
 "inventory:haircut-collection-audit-sciel:sciel-short-curly-haircut",
 "inventory:picto-inventory-audit-stone-wave-cliffs-cave:energising-revive",
 "inventory:picto-inventory-audit-stone-wave-cliffs-cave:exhausting-power",
 "endgame:verification-sweep:expedition-54"
];
cave[1].sort((a,b)=>{const x=caveOrder.indexOf(a[3]),y=caveOrder.indexOf(b[3]);return (x<0?999:x)-(y<0?999:y)});
const platform=area("act3",flyPlateau[1]).pair;
const platformOrder=["inventory:picto-inventory-audit-continent:breaking-death","inventory:picto-inventory-audit-continent:energising-shell"];
platform[1].sort((a,b)=>platformOrder.indexOf(a[3])-platformOrder.indexOf(b[3]));
window.E33_AREA_ACCESS={
  entries:{
   "stone-wave-cliffs-cave":{
      chapter:"act2",requires:["swim"],
      source:evidence.cave,
      stepIds:caveOrder
   },
   "stone-wave-cliffs-elevated-plateau":{
      chapter:"act3",requires:["fly"],
      source:evidence.thunder,
      stepIds:platformOrder
   }
  }
};
audit.stats.steps=chapters.reduce((n,c)=>n+c.areas.reduce((sum,x)=>sum+x[1].length,0),0);
})();