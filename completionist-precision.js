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
 "AFTER Old Lumière grants Esquie the ability to BREAK CORAL REEFS: leave Monoco's Station onto the eastern coast and swim through the previously impassable reef to the island with COASTAL CAVE. On the SMALL BEACH just NORTH of the Coastal Cave portal, find the Gestral near two enemy groups and invite it back to camp.",
 {move:["act2","Continent · western expansion"],ability:["swim","reef"],source:"https://www.pushsquare.com/guides/clair-obscur-expedition-33-the-continent-walkthrough-lost-gestrals-music-records-outfits-journals"});
apply("Verso · Gestral haircut",
 "After rescuing FIVE Lost Gestrals (the fifth is on the newly accessible coast north of Coastal Cave), set up CAMP from the Continent. Talk to SASTRO by the Curator's cave to collect Verso's Gestral haircut.",
 {move:["act2","Continent · western expansion"],ability:["swim","reef"],gate:["act2:continent-western-expansion:lost-gestral-5"],source:H});
apply("Verso — Swimsuit 1 outfit",
 "AFTER Old Lumière unlocks swimming through reefs, reach the GESTRAL BEACH east of Sirène's island. Enter the RACE course, follow the right-side line on the final ascent and finish UNDER 38 SECONDS (gold medal) to unlock VERSO'S SWIMSUIT I. The Act 3 Sciel camp scene unlocks Swimsuit II, not this one.",
 {move:["act2","Continent · eastern detour"],ability:["swim","reef"],source:O});
apply("Verso — Swimsuit 2 outfit",
 "At CAMP in Act 3, select CHECK UP ON THE OTHERS and talk to SCIEL until her relationship level reaches SIX. Finish the swimming lesson scene with Verso. It awards VERSO'S SWIMSUIT II and SCIEL'S SWIMSUIT I; do not confuse it with Verso's race reward.",
 {move:["act3","Sciel rank 6 · camp rewards"],ability:["fly"],source:O});
apply("Energising Start I",
 "From GESTRAL VILLAGE on the Continent, take the road directly NORTH toward the shoreline and find the SMALL BEACH north of the village. Collect Energising Start I from the visible ground pickup beside the coast; it is NOT inside Yellow Harvest.",
 {move:["act1","Continent · AFTER Esquie traversal"],ability:["rough"],source:C});
apply("Stalum", 
 "On the Continent, exit FORGOTTEN BATTLEFIELD through its NORTHERN portal. Follow the WESTBOUND shore to the BEACH where a Stalact roams beside an expedition camp; defeat the Stalact for Maelle's Stalum.",
 {ability:["swim"],source:W});

/* Source-checked chapter Pictos: boss/merchant/flag-specific acquisition directions. */
const PIC_SOURCE="https://game-checklists.com/expedition33/all-pictos.html";
const PIC_FIXES=[["First Offensive","Go to ABBEST CAVE on the Continent's first landmass after Spring Meadows. Enter the small cave, follow the single path to CHROMATIC ABBEST at the far end and defeat it to collect First Offensive."],["Powerful Revive","On the Continent north of GESTRAL VILLAGE, locate the CHROMATIC BRÛLEUR patrolling the open grass near Hidden Gestral Arena. Defeat it for the Powerful Revive Picto."],["Accelerating Last Stand","At the HIDDEN GESTRAL ARENA west of Ancient Sanctuary, speak to the arena attendant and win the SECOND one-on-one championship fight. Collect Accelerating Last Stand from the victory rewards."],["Empowering Last Stand","At the HIDDEN GESTRAL ARENA west of Ancient Sanctuary, win the FOURTH and last individual challenge; collect Empowering Last Stand from the champion's rewards."],["Last Stand Critical","Enter the HIDDEN GESTRAL ARENA on the accessible Continent south of Gestral Village. Win the FIRST solo fight and claim Last Stand Critical from the award."],["Protecting Last Stand","Enter the HIDDEN GESTRAL ARENA south of Gestral Village. Win the THIRD arena fight and take Protecting Last Stand from the rewards."],["Solo Fighter","After clearing the first three HIDDEN GESTRAL ARENA fights, win the FOURTH/FINAL challenge and claim Solo Fighter alongside its other unique reward."],["Healing Mark","Within GESTRAL VILLAGE head to its BAZAAR and find the hidden BLACK MARKET merchant in the back alley. Challenge his duel if offered, then buy Healing Mark for 9,200 Chroma."],["Energising Attack I","In YELLOW HARVEST reach the YELLOW SPIRE WRECKS Flag, continue to the GLAISE optional boss guarding the upper path and defeat it. Energising Attack I drops in the same battle."],["Teamwork","Enter YELLOW HARVEST through the northern rough-terrain barrier and fast-travel to HARVESTER'S HOLLOW Flag. Take the merchant side path to PINABBY, win the Gestral duel, then purchase Teamwork for 9,120 Chroma."],["Defensive Mode","In STONE WAVE CLIFFS defeat LAMPMASTER to end the Act 1 story sequence; after the encounter, return to the boss arena on the next available visit and claim Defensive Mode."],["Tainted","From STONE WAVE CLIFFS OLD FARM Flag search around the barn clearing for the CHROMATIC GAULT optional enemy and defeat it to receive Tainted."],["Dead Energy I","While swimming the Continent in Act 2, beach Esquie beside the DARK SHORES dungeon portal and check the ground along the approach to the portal for Dead Energy I."],["Breaking Death","Sail to STONE WAVE CLIFFS CAVE off the Act 2 coastline; on the EASTERN shore immediately outside its entrance, engage the THUNDER ÉVÊQUE enemy and defeat it for Breaking Death."],["Exhausting Power","Enter STONE WAVE CLIFFS CAVE and advance to the chamber containing the CHROMATIC HEXGA boss. Search the perimeter of that boss room for Exhausting Power lying on the ground before leaving."],["Solidifying","Enter CRUSHING CAVERN from the Continent after Esquie's swimming unlock. Follow the cavern to the GIANT SAPLING enemy at its end, defeat it and collect Solidifying."],["Breaking Burn","From MONOCO'S STATION use the NORTHWEST Continent exit and head far WEST into the wooded coast. Search the path around the roaming BOURGEON for the Breaking Burn pickup."],["Charging Tint","From FORGOTTEN BATTLEFIELD's NORTH exit reach the Continent shore, turn WEST onto the beach and find the expedition CAMP alongside the roaming STALACT. Charging Tint lies at this camp."],["Critical Vulnerability","On the Continent, swim toward FLOATING CEMETERY and locate the small BAY to its NORTH. Land along the WESTERN side of the bay and search the secluded expedition campsite for Critical Vulnerability."],["Shielding Tint","On the peninsula SOUTHWEST of the BOAT GRAVEYARD portal, walk among the ruined walls beside the shoreline and collect Shielding Tint hidden in the building remains."],["Healing Parry","Enter STONE QUARRY near the Stone Wave Cliffs coastal route and find the FRIENDLY TROUBADOUR Nevron. Complete its request and speak to it again to claim Healing Parry. An alternate ground copy lies behind the Bourgeon near Stone Wave Cliffs' entrance."],["Anti-Burn","In FROZEN HEARTS progress to the boss chamber at the end and defeat GARGANT. Anti-Burn drops from the encounter, along with the Eternal Ice quest item."],["Anti-Freeze","In FROZEN HEARTS pass the cave containing the MANOR entrance and locate PAINT CAGE 12 along the continuing path. Shoot all three paint anomalies to unlock the cage and retrieve Anti-Freeze."],["Burning Break","Fast travel to the GLACIAL FALLS Flag in FROZEN HEARTS and take the side corridor immediately beyond the flag instead of following the story rails. Collect Burning Break at the end of the small branch."],["Fueling Break","On the Continent in Act 2, head EAST of THE CAROUSEL dungeon entrance. Search the ground on the small strip of reachable land just beyond the portal for Fueling Break."],["Protecting Heal","Enter ESOTERIC RUINS near Old Lumière and locate the FRIENDLY PORTIER. Complete its request, return to the Nevron to claim the quest reward and verify Protecting Heal appears in the Picto menu."],["Breaking Slow","With PAINT BREAK earned from Sastro, return to the Continent SOUTHWEST of ABBEST CAVE. Find the cracked blue-black rock along the coast, break it with a ranged paint shot and take Breaking Slow behind the spike."],["Auto Rush","During the solo party sequence in OLD LUMIÈRE, check the side alcoves along the main route before leaving this character-specific section. Auto Rush lies on the ground along that route."],["Healing Counter","At OLD LUMIÈRE's ENTRANCE Flag locate the merchant MANDELGO beside the main road. Buy Healing Counter for 20,400 Chroma."],["Longer Powerful","At OLD LUMIÈRE's ENTRANCE Flag find the merchant MANDELGO near the first ruined street. Buy Longer Powerful from him for 20,400 Chroma."],["Revive Paradox","Within OLD LUMIÈRE, take the hanging ROPE DOWN from the ruined route to the arena containing CHROMATIC DANSEUSE. Defeat her for Revive Paradox."],["Critical Break","After learning Paint Break, swim northwest of VISAGES on the Continent to the reachable strip of coastline. Destroy the blue-cracked PAINT SPIKE rock on that shore and retrieve Critical Break."],["SOS Rush","In FALLING LEAVES, start at RESINVEIL GROVE Flag and follow the route toward the CHROMATIC BALLET side-boss; check the pickup beside its arena for SOS Rush."],["Augmented Counter II","At VISAGES take the SADNESS VALE path from the Plaza. Defeat the CHROMATIC RAMASSEUR in the Vale and obtain Augmented Counter II."],["Glass Canon","In VISAGES follow the SADNESS VALE branch and defeat CHROMATIC RAMASSEUR, then search its arena for the Glass Cannon Picto (called Glass Canon in the site's current catalog)."],["Healing Share","At VISAGES' PLAZA Expedition Flag find the Gestral merchant stationed inside the main hub. Buy Healing Share for 19,200 Chroma."],["Immaculate","In VISAGES clear the Joy, Anger and Sadness Vale routes, return to PLAZA and defeat the MASK KEEPER story boss. Immaculate is in the victory rewards."],["Powered Attack","At VISAGES take the ANGER VALE branch, activate the giant MOUTH landmark, then turn RIGHT into the enemy-guarded side path and defeat the enemy to collect Powered Attack."],["Anti-Charm","In SIRÈNE proceed past the DANCING CLASSES area to the encounter with TISSEUR. Defeat Tisseur and collect Anti-Charm in its battle rewards."],["Double Mark","At SIRÈNE's CRUMBLING PATH Flag take the climbable HANDHOLDS toward the upper merchant and buy Double Mark for 42,400 Chroma."],["Effective Heal","From SIRÈNE's DANCING CLASSES Flag follow the passage toward the deep chamber containing the CHROMATIC GREATSWORD CULTIST. Defeat it and search the immediate floor for Effective Heal."],["Energising Attack II","From SIRÈNE's CRUMBLING PATH Flag climb the nearby HANDHOLDS to the merchant landing and purchase Energising Attack II for 37,100 Chroma."],["Energising Turn","Defeat the main SIRÈNE boss at the end of the theatrical dungeon. Energising Turn is part of the Sirène battle rewards."],["Greater Powerful","From SIRÈNE's CRUMBLING PATH Flag use the rock HANDHOLDS to reach the high merchant and purchase Greater Powerful for 37,100 Chroma."],["Greater Shell","At SIRÈNE's DANCING CLASSES Flag continue into the large chamber with CHROMATIC GREATSWORD CULTIST and search the pickup in that room for Greater Shell."],["Healing Fire","From SIRÈNE's CRUMBLING PATH Flag follow the hanging ROPE, then the GRAPPLE to the wall opening. Crawl through the hole to pick up Healing Fire."],["Powerful on Shell","From SIRÈNE's DANCING CLASSES Flag take the branch RIGHT into the deep BENISSEUR chamber. Defeat the Benisseur group to receive Powerful on Shell."],["Protecting Death","In SIRÈNE travel to the area near its hidden MIME fight. Take the alternate series of GRAPPLE points beside the Mime path to reach the ledge holding Protecting Death."],["Shield Affinity","At SIRÈNE's DANCING CLASSES Flag find PAINT CAGE 7 and shoot the three paint anomalies in its immediate area. The cage opens to reveal Shield Affinity."],["Breaking Attack","Inside the MONOLITH's TAINTED LUMIÈRE stage follow the main route to the CLAIR OBSCUR miniboss. Defeat it to receive Breaking Attack."],["Combo Attack II","In the MONOLITH defeat the CHROMATIC CLAIR OBSCUR encounter during the Tainted Lumière sequence and collect Combo Attack II from its rewards."],["Empowering Parry","In the MONOLITH's TAINTED HEARTS section, locate PAINT CAGE 11 on the upper path. Shoot all three local anomaly targets to open it and claim Empowering Parry."],["Energising Cleanse","In the MONOLITH's TAINTED MEADOWS segment, continue until the SECOND story cutscene. Immediately afterward challenge the nearby merchant, then buy Energising Cleanse for 40,800 Chroma."],["Enfeebling Attack","In the MONOLITH's TAINTED HEARTS area find the Gestral merchant on the main trail and inspect the ground beside that merchant for Enfeebling Attack."],["Greater Defenceless","In the MONOLITH's TAINTED HEARTS segment climb the HANDHOLDS on the route leading to the merchant, defeat him in a duel and buy Greater Defenceless for 47,600 Chroma."],["Painted Power","Finish the MONOLITH story encounter against the PAINTRESS and claim Painted Power from the boss rewards; you do not need a separate collectible pickup."],["Random Defense","In the MONOLITH's TAINTED SANCTUARY section find PAINT CAGE 20 and shoot its three nearby anomalies. Open the cage for Random Defense."],["Second Chance","At the MONOLITH PEAK continue to the required RENOIR battle. Win and claim Second Chance from his victory rewards."],["Weakness Gain","Inside the MONOLITH's TAINTED CLIFFS area take the GRAPPLE path past the statue. At the statue choose the RIGHT side path and collect Weakness Gain."]];
for(const [name,desc] of PIC_FIXES)apply(name,desc,{source:PIC_SOURCE});
window.E33_PRECISION_AUDIT={evidence,updated:evidence.filter(x=>x.id).length,failed:evidence.filter(x=>!x.id).length};
audit.stats.vague=Object.values(audit.quality).filter(q=>q==="unverified").length;
audit.stats.corrected=Object.keys(audit.verified).length;
})();