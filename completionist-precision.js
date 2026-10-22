/* E33.EXE: source-verified location and first-access corrections.
   Runs after completionist-integrity.js, before completionist.js.
   Stable IDs are never regenerated; previously recorded completion survives moves.
   Use an exact action and landmark; do NOT upgrade generic inventories to "verified". */
(function(){
"use strict";
const chapters=window.E33_COMPLETION_DATA||[];
const audit=window.E33_COMPLETION_AUDIT;
if(!audit)return;
const index=new Map();
for(const chapter of chapters)for(const group of chapter.areas)for(const entry of group[1]){
  const key=entry[1];
  if(!index.has(key))index.set(key,[]);
  index.get(key).push({chapter,group,entry});
}
const evidence=[];
const C="https://game-checklists.com/expedition33/all-pictos.html";
const W="https://game-checklists.com/expedition33/all-weapons.html";
const H="https://game-checklists.com/expedition33/all-haircuts.html";
const O="https://game-checklists.com/expedition33/all-outfits.html";
function groupFor(chapterId,name,after){
  const chapter=chapters.find(c=>c.id===chapterId);
  if(!chapter)throw Error("Missing chapter "+chapterId);
  let g=chapter.areas.find(x=>x[0]===name);
  if(!g){
    g=[name,[]];
    const idx=chapter.areas.findIndex(x=>x[0]===after);
    chapter.areas.splice(idx<0?chapter.areas.length:idx+1,0,g);
  }
  return {chapter,g};
}
function apply(name,description,opts={}){
  const matches=index.get(name)||[];
  const found=matches.find(x=>opts.oldAct?x.chapter.id===opts.oldAct:true);
  if(!found){evidence.push({name,status:"NO MATCH"});return;}
  const {entry}=found,id=entry[3];
  if(!id)throw Error("Missing stable id for "+name);
  if(opts.move){
    const target=groupFor(opts.move[0],opts.move[1],opts.move[2]);
    found.group[1].splice(found.group[1].indexOf(entry),1);
    target.g[1].push(entry);
    found.chapter=target.chapter;found.group=target.g;
  }
  entry[2]=description;
  audit.corrected[id]=description;
  audit.quality[id]="verified";
  audit.verified[id]=true;
  audit.sources[id]=opts.source||C;
  if(opts.ability) audit.requirements[id]=opts.ability;
  if(opts.requires){
    const all=new Set([...audit.requirements[id],...opts.requires]);
    audit.requirements[id]=[...all];
  }
  if(opts.gate)window.E33_COMPLETION_GATES.steps[id]={requires:opts.gate,tip:opts.tip||"Complete the prerequisite story event first."};
  evidence.push({name,id,chapter:found.chapter.id,area:found.group[0],source:audit.sources[id]});
}
const AFTER_PAINT=["act2","Paint Break · revisit previous areas","Continent · northern detours"];
const AFTER_VILLAGE=["act1","Collectibles · Gestral Village","Gestral Village"];
const AFTER_ESQUIE=["act1","Continent · AFTER Esquie traversal"];
const AFTER_BATTLE=["act2","Continent · northern detours","Forgotten Battlefield · Vanguard Point / Ancient Bridge"];
const AFTER_SWIM=["act2","Collectibles · Continent · Esquie swimming","Continent · Esquie swimming"];

apply("Piercing Shot",
 "AFTER learning Paint Break from Sastro (four Lost Gestrals), FAST TRAVEL to Ancient Sanctuary's Sanctuary Maze Flag and break the cracked Paint Spike near the Ranger Sakapatate clearing. Enter the newly opened Gestral Totem section; from the GESTRAL TOTEM Flag head forward along the STREAM BETWEEN THE ROCKS to the Picto.",
 {move:AFTER_PAINT,ability:["paint"],source:"https://www.gamerguides.com/clair-obscur-expedition-33/database/pictos/offensive/piercing-shot"});
apply("Powerful Shots",
 "Only after Paint Break: return to GESTRAL VILLAGE, use the GESTRAL ARENA Flag and stand outside the ARENA GATE. Shoot the blue-cracked Paint Spike immediately to the RIGHT of the gate and collect Powerful Shots from behind the barrier.",
 {move:AFTER_PAINT,ability:["paint"],source:C});
apply("Rejuvenating Revive",
 "Return to STONE WAVE CLIFFS after acquiring Sastro's Paint Break. From the TIDE CAVERNS Flag, explore the NORTHWEST branch to the blue-cracked rock, destroy the Paint Spike and continue into the pocket behind it to collect Rejuvenating Revive.",
 {move:AFTER_PAINT,ability:["paint"],source:C});
apply("Stalum",
 "On the Continent, exit FORGOTTEN BATTLEFIELD through its NORTHERN portal. Follow the WESTBOUND shore to the BEACH where a Stalact roams beside an expedition camp; defeat the Stalact for Maelle's Stalum. Do this during your post-battlefield coast sweep, before visiting Monoco's Station.",
 {move:AFTER_BATTLE,ability:["swim"],source:W});
apply("Augmented Attack",
 "At SPRING MEADOWS Grand Meadow Flag, follow the path past the flying Volesters, turn RIGHT instead of climbing the story rope, and defeat the CHROMATIC LANCELIER. It awards the Augmented Attack Picto.",
 {move:["act1","Spring Meadows · Grand Meadow"],ability:[],source:C});
apply("Lost Gestral #5",
 "After Forgotten Battlefield, recruit Monoco and enter the Continent from MONOCO'S STATION. Use Esquie's normal swimming to reach the ISLAND with COASTAL CAVE's portal to the EAST; explore the grass BEHIND the Coastal Cave entrance among the roaming enemies and speak to Lost Gestral #5. The original route incorrectly delayed this Gestral until after Old Lumière.",
 {move:["act2","Continent · northern detours"],ability:["swim"],source:"https://www.polygon.com/clair-obscur-expedition-33-guides/566911/lost-gestrals-locations-all-where-to-find"});
apply("Verso · Gestral haircut",
 "After rescuing FIVE Lost Gestrals, open the CAMP from the Continent and find SASTRO beside the Curator's cave. Speak to him again to receive Verso's Gestral haircut; the fifth Gestral can be rescued on the Coastal Cave island before Old Lumière.",
 {move:["act2","Continent · northern detours"],ability:["swim"],gate:["act2:continent-western-expansion:lost-gestral-5"],source:H});
apply("Energising Start I",
 "From GESTRAL VILLAGE on the Continent, take the road directly NORTH toward the shoreline and find the SMALL BEACH north of the village. Collect Energising Start I from the visible ground pickup beside the coast; it is NOT inside Yellow Harvest.",
 {move:["act1","Continent · AFTER Esquie traversal"],ability:["rough"],source:C});
apply("Stalum", 
 "On the Continent, exit FORGOTTEN BATTLEFIELD through its NORTHERN portal. Follow the WESTBOUND shore to the BEACH where a Stalact roams beside an expedition camp; defeat the Stalact for Maelle's Stalum.",
 {ability:["swim"],source:W});
window.E33_PRECISION_AUDIT={evidence,updated:evidence.filter(x=>x.id).length,failed:evidence.filter(x=>!x.id).length};
audit.stats.vague=Object.values(audit.quality).filter(q=>q==="unverified").length;
audit.stats.corrected=Object.keys(audit.verified).length;
})();