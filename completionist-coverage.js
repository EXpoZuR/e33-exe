/* E33.EXE completion inventory coverage.
   Adds automatically acquired starting weapons without losing old checkmarks.
   Promotes previously hidden weapons inside broad quest labels to explicit weapons.
   Loaded AFTER completionist-precision.js and BEFORE completionist.js. */
(function(){
"use strict";
const chapters=window.E33_COMPLETION_DATA||[];
const audit=window.E33_COMPLETION_AUDIT;
if(!audit)return;
const source="https://game-checklists.com/expedition33/all-weapons.html";
function lookup(name) {
 for(const chapter of chapters)for(const pair of chapter.areas)for(const entry of pair[1])
  if(entry[1]===name)return {chapter,pair,entry};
 return null;
}
const corrections=[
 ["Delaram Paint Cage","Delaram",
  "From STONE WAVE CLIFFS ENTRANCE Flag follow the RIGHT WALL and climb the nearby ROPE to the elevated ledge beside EXPEDITION 78. Shoot the THREE PAINT CAGE ANOMALIES around the cage; open it to collect Gustave/Verso's DELARAM weapon. [Weapon rank: C+]."],
 ["Duenum Paint Cage","Duenum",
  "At STONE WAVE CLIFFS OLD FARM Flag take the UPHILL LEFT path to the BROKEN WINDMILL. Shoot the THREE glowing paint-anomaly targets around PAINT CAGE 5 to open it; collect Maelle's DUENUM weapon. [Weapon rank: C]."],
 ["Bazaar · Demonam / Critical Moment","Demonam",
  "In GESTRAL VILLAGE head LEFT into the BAZAAR from the main market entrance, locate the Gestral merchant selling Demonam, and challenge the shopkeeper to a duel to unlock his special weapon stock. Buy Gustave/Verso's DEMONAM for 4,002 Chroma. Critical Moment is recorded in its own Picto checkpoint."],
 ["Jerijeri / Rangeson","Rangeson",
  "At STONE WAVE CLIFFS OLD FARM Flag circle the FIRST FARMHOUSE on its RIGHT side and crawl through the gap BEHIND THE BIG ROCK. Challenge merchant JERIJERI to unlock his stock, then buy Sciel's RANGESON for 7,372 Chroma. The hairstyle sold there is a separate cosmetic reward."],
 ["Black-market alley","Sekarum",
  "In GESTRAL VILLAGE go LEFT into the BAZAAR, locate the merchant in the BACK ALLEY and follow him deeper into the passage. Win the ambush/duel and reopen his shop, then buy Maelle's SEKARUM for 4,380 Chroma. Also buy the separate HEALING MARK Picto."],
 ["Friendly Demineur","Deminerim",
  "At FLYING WATERS near the LARGE WRECKED SHIP, head RIGHT into the POT-SHAPED structure containing the friendly DÉMINEUR. Jump across the ROUND PILLARS nearby to pick up the INTACT MINE, bring it back and give it to Démineur. Claim Lune's DEMINERIM weapon and SPARE this friendly Nevron."],
 ["Mandelgo · unique stock","Algueron",
  "In OLD LUMIÈRE at the ENTRANCE Expedition Flag locate merchant MANDELGO beside the FIRST STREET. Challenge him to a DUEL to unlock the special weapon and buy Sciel's ALGUERON for 13,600 Chroma; buy the separate LONGER POWERFUL and HEALING COUNTER Pictos at the same stop."]
];
for(const [oldTitle,newTitle,route] of corrections){
 const t=lookup(oldTitle);
 if(!t)throw new Error("Missing expected checkpoint: "+oldTitle);
 t.entry[0]="Weapon";t.entry[1]=newTitle;t.entry[2]=route;
 const id=t.entry[3];
 audit.corrected[id]=route;audit.verified[id]=true;audit.quality[id]="verified";audit.sources[id]=source;
}
const starting=[
 {c:"prologue",a:"Lumière Festival",before:"Trash-can man's interaction",n:"Noahram",
  route:"STARTING EQUIPMENT: At the opening of the Lumière prologue, Gustave begins with NOAHRAM already in his Weapon inventory. Open Gustave's equipment and mark it acquired; no shop or detour is required."},
 {c:"act1",a:"Spring Meadows · Meadows Corridor",before:"Lanceram",n:"Lunerim",
  route:"STORY RECRUITMENT: When LUNE joins Gustave near the start of SPRING MEADOWS, check her Weapon inventory. LUNERIM is her starting weapon and is already equipped; no extra drop is required."},
 {c:"act1",a:"Flying Waters · Entrance / Noco's Hut",after:"Meet Maelle and the Curator",n:"Maellum",
  route:"STORY RECRUITMENT: After meeting MAELLE and the Curator at the FLYING WATERS Manor, check Maelle's Weapon inventory. MAELLUM is her default starting sword; mark it obtained as soon as she joins."},
 {c:"act1",a:"Gestral Village",after:"Gestral tournament / recruit Sciel",n:"Scieleson",
  route:"STORY RECRUITMENT: After the GESTRAL VILLAGE tournament's fourth match, SCIEL joins the party. Open her Weapon inventory; SCIELESON is available immediately as her default weapon."},
 {c:"act2",a:"Continent · Esquie swimming",after:"Unlock swimming / begin Act 2",n:"Verleso",
  route:"START OF ACT 2: VERSO becomes a playable party member after the Act 1 finale. His default starting weapon, VERLESO, is already in his inventory; check Weapons as soon as control returns."},
 {c:"act2",a:"Monoco's Station",after:"Recruit Monoco",n:"Monocaro",
  route:"STORY RECRUITMENT: At MONOCO'S STATION, defeat MONOCO and finish his joining tutorial. Open Monoco's Weapon inventory immediately afterward; MONOCARO is his default starting weapon."}
];
for(const z of starting){
 if(lookup(z.n))continue;
 const chapter=chapters.find(x=>x.id===z.c),area=chapter?.areas.find(x=>x[0]===z.a);
 if(!area)throw new Error("Missing insertion area for "+z.n);
 const i=area[1].findIndex(x=>x[1]===(z.after||z.before));
 if(i<0)throw new Error("Missing insertion anchor "+z.after||z.before);
 const id="coverage:default-weapon:"+z.n.toLowerCase();
 const entry=["Weapon",z.n,z.route,id];
 area[1].splice(i+(z.after?1:0),0,entry);
 audit.requirements[id]=z.c==="act2"?["swim"]:[];
 // These are checkpoints for inherited default equipment, not optional unlocks.
 audit.quality[id]="verified";audit.verified[id]=true;audit.corrected[id]=z.route;audit.sources[id]=source;
}
// The 97-outfit comparison also exposed one genuinely missable-at-location
// free outfit absent from the old 796-step source catalog.
const obscur="Maelle — Obscur outfit";
if(!lookup(obscur)){
 const act2=chapters.find(c=>c.id==="act2");
 const area=act2.areas.find(g=>g[0]==="Forgotten Battlefield · Vanguard Point / Ancient Bridge");
 if(!area)throw Error("Forgotten Battlefield group missing");
 const after=area[1].findIndex(e=>e[1]==="Benisim");
 if(after<0)throw Error("Missing Kasumi merchant checkpoint");
 const id="coverage:outfit:maelle-obscur";
 const route="In FORGOTTEN BATTLEFIELD, talk to the FADING WOMAN at the junction then take the RIGHT trench. Past the trench, pick up EXPEDITION 57 and enter the RUIN directly behind the journal. Climb the GOLDEN ROPE to merchant KASUMI in the upper room. Challenge Kasumi to a one-on-one duel, defeat him, then purchase Maelle's OBSCUR outfit for 5,000 Chroma. You can buy Benisim and Inverted Affinity at the same shop.";
 area[1].splice(after+1,0,["Cosmetic",obscur,route,id]);
 audit.requirements[id]=["swim"];audit.quality[id]="verified";audit.verified[id]=true;
 audit.corrected[id]=route;audit.sources[id]="https://www.neoseeker.com/clair-obscur-expedition-33/Kasumi";
}
const fullWeaponNames=[
 "Bonbim","Cleim","Esquim","Baguettaro","Esquiaro","Cannaro","Esqium","Licorum","Duollison","Esquion","Sucetton","Esquiso","Sucreso",
 "Abysseram","Blodam","Chevalam","Confuso","Contorso","Corpeso","Cruleram","Cultam","Danseso","Delaram","Demonam","Dreameso","Dualiso","Gaulteram","Gesam","Glaceso","Lanceram","Liteso","Noahram","Nosaram","Sakaram","Seeram","Simoso","Sireso","Tireso","Verleso",
 "Angerim","Benisim","Betelim","Braselim","Chapelim","Choralim","Colim","Coralim","Deminerim","Elerim","Kralim","Lighterim","Lithelim","Lunerim","Painerim","Potierim","Redalim","Saperim","Scaverim","Snowim","Trebuchim","Troubadim",
 "Barrier Breaker","Battlum","Brulerum","Chalium","Chantenum","Clierum","Coldum","Duenum","Facesum","Glaisum","Jarum","Lithum","Maellum","Medalum","Melarum","Plenum","Seashellum","Sekarum","Stalum","Tissenum","Veremum","Volesterum","Yeverum",
 "Algueron","Blizzon","Bourgelon","Charnon","Chation","Corderon","Direton","Garganon","Gobluson","Guleson","Hevason","Litheson","Lusteson","Martenon","Minason","Moisson","Ramasson","Rangeson","Sadon","Scieleson","Tisseron",
 "Ballaro","Boucharo","Brumaro","Chromaro","Fragaro","Grandaro","Joyaro","Monocaro","Nusaro","Sidaro","Urnaro","Baguette"
];
const missing=fullWeaponNames.filter(x=>!lookup(x));
if(missing.length)throw Error("Missing weapons: "+missing.join(", "));
window.E33_COMPLETION_COVERAGE={weapons:fullWeaponNames.length,weaponNames:fullWeaponNames,
 source,defaultWeaponsAdded:starting.length,weaponQuestNamesRepaired:corrections.length,
  outfitCoverage:{source:"https://game-checklists.com/expedition33/all-outfits.html",
    total:97,earnedItemsInGuide:76,defaultOrEditionOnly:21}};
audit.stats.steps=chapters.reduce((n,c)=>n+c.areas.reduce((v,a)=>v+a[1].length,0),0);
audit.stats.corrected=Object.keys(audit.verified).length;
})();