/* Place source-grounded item checks beside their first applicable region. */
(function(){
  const chapters=window.E33_COMPLETION_DATA||[];
  const inv=chapters.find(c=>c.id==="inventory");if(!inv)return;
  const slug=x=>String(x).normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const groups=inv.areas.slice(); inv.areas=[];
  let moved=0,retained=0,excluded=0;
  const targets=[
    [/verso.s drafts|candy land|gestral baths|reverie path|gingerbread|root of all evil|gestral carousel/i,"update","Verso's Drafts"],
    [/endless tower|clea unleashed|simon divergent star|chromatic lampmaster/i,"endgame","Optional regions, bosses and secret weapons"],
    [/renoir.s drafts|the abyss/i,"endgame","Optional regions, bosses and secret weapons"],
    [/flying manor/i,"endgame","Optional regions, bosses and secret weapons"],
    [/sinister cave|sunless cliffs|dark shores|sacred river|sky island|the crows|the chosen path|flying casino|white sands|sir.ne.s dress|endless night sanctuary|the reacher|fountain|dark gestral arena|crimson forest|floating cemetery/i,"act3","Act 3 · relationships and full traversal"],
    [/frozen hearts/i,"act2","Continent · western expansion"],
    [/monolith|tainted/i,"act2","The Monolith"],
    [/sir.ne/i,"act2","Sirène"],
    [/visages|joy vale|sadness vale|anger vale/i,"act2","Visages"],
    [/old lumi.re|manor gardens|right street/i,"act2","Old Lumière"],
    [/falling leaves|resinveil/i,"act2","Continent · western expansion"],
    [/esoteric ruins|coastal cave|carousel/i,"act2","Continent · before Old Lumière"],
    [/monoco.s station|fashionist/i,"act2","Monoco's Station"],
    [/stone quarry|boat graveyard/i,"act2","Continent · northern detours"],
    [/crushing cavern|white tree|blades. graveyard|stone wave cliffs cave|the meadows/i,"act2","Continent · Esquie swimming"],
    [/forgotten battlefield|vanguard point|main gate|fort ruins/i,"act2","Forgotten Battlefield · Vanguard Point / Ancient Bridge"],
    [/stone wave cliffs|old farm|tide caverns|paintress shrine|basalt waves|flooded buildings/i,"act1","Stone Wave Cliffs · Old Farm / Tide Caverns"],
    [/yellow harvest|lost woods|harvester.s hollow/i,"act1","Yellow Harvest / Lost Woods"],
    [/esquie.s nest/i,"act1","Esquie's Nest → return to Village"],
    [/gestral village|gestral theater/i,"act1","Gestral Village"],
    [/ancient sanctuary/i,"act1","Ancient Sanctuary"],
    [/flying waters/i,"act1","Flying Waters · Coral Cave / Lumieran Streets"],
    [/spring meadows|grand meadow|indigo tree/i,"act1","Spring Meadows · Abandoned Camp → Indigo Tree"],
    [/lumi.re act iii|act 3 lumi.re|lumi.re gardens/i,"act3","Story finale · Lumière"],
    [/lumi.re festival|prologue/i,"prologue","Lumière Festival"]
  ];
  const continentPictoHints = {
    "Accelerating Heal": [
      "act3",
      "Act 3 · relationships and full traversal",
      "On an island just NORTH of Flying Casino, search the beach camp (requires access to the island)."
    ],
    "Anti-Stun": [
      "act3",
      "Act 3 · relationships and full traversal",
      "East of Flying Casino, defeat the Chromatic Petank in the grassy meadow."
    ],
    "Breaking Burn": [
      "act2",
      "Continent · northern detours",
      "Far WEST of Monoco's Station northwest exit, search near a Bourgeon."
    ],
    "Breaking Death": [
      "act2",
      "Continent · Esquie swimming",
      "East of Stone Wave Cliffs Cave, defeat the Thunder Eveque."
    ],
    "Breaking Slow": [
      "act2",
      "Continent · before Old Lumière",
      "Southwest of Abbest Cave, break the Paint Spike rock after unlocking Sastro's Paint Break."
    ],
    "Burning Death": [
      "act2",
      "Continent · western expansion",
      "Inside Frozen Hearts, defeat the first enemy group; this is NOT a generic random Overworld pickup."
    ],
    "Charging Tint": [
      "act2",
      "Continent · northern detours",
      "West of Forgotten Battlefield north exit, check the beach camp next to the Stalact."
    ],
    "Cheater": [
      "act3",
      "Act 3 · relationships and full traversal",
      "Defeat the optional overworld boss Sprong when your party is strong enough."
    ],
    "Critical Break": [
      "act2",
      "Continent · western expansion",
      "Northwest of Visages on land shoreline, break the Paint Spike rock."
    ],
    "Critical Vulnerability": [
      "act2",
      "Continent · northern detours",
      "At the small bay above Floating Cemetery, search the hidden camp on the WEST side."
    ],
    "Dead Energy I": [
      "act2",
      "Continent · Esquie swimming",
      "Near the Dark Shores portal, search the ground beside the path."
    ],
    "Effective Support": [
      "act3",
      "Act 3 · relationships and full traversal",
      "Fly northeast/east from Sirene over the mainland; search the ground."
    ],
    "Empowering Dodge": [
      "act3",
      "Act 3 · relationships and full traversal",
      "In the camp near the Endless Night Sanctuary portal, pick up the Picto."
    ],
    "Energising Gradient": [
      "act2",
      "Continent · northern detours",
      "Northwest of Forgotten Battlefield north portal, defeat the Frost Eveque."
    ],
    "Energising Heal": [
      "act3",
      "Act 3 · relationships and full traversal",
      "At the camp beside the Endless Tower portal, clear the nearby enemy group and collect."
    ],
    "Energising Shell": [
      "act3",
      "Act 3 · relationships and full traversal",
      "Fly EAST of Stone Wave Cliffs Cave and break the Paint Spike rock."
    ],
    "Energy Master": [
      "act3",
      "Act 3 · relationships and full traversal",
      "Defeat Serpenphare after unlocking Esquie's flight."
    ],
    "Fueling Break": [
      "act2",
      "Continent · before Old Lumière",
      "Just EAST of The Carousel on the Continent; ground pickup."
    ],
    "Healing Parry": [
      "act2",
      "Continent · northern detours",
      "Obtain from the friendly Troubadour quest in Stone Quarry; alternate path beyond the Bourgeon near Stone Wave Cliffs portal."
    ],
    "Longer Burn": [
      "endgame",
      "Optional regions, bosses and secret weapons",
      "Flying Manor Central Plaza merchant after elevator; win duel and purchase."
    ],
    "Longer Rush": [
      "act3",
      "Act 3 · relationships and full traversal",
      "On the mountainside southwest of Frozen Cliffs; access through the later northern traversal."
    ],
    "Powerful Revive": [
      "act1",
      "Continent · AFTER Flying Waters (before Sanctuary)",
      "Defeat the Chromatic Bruler north of Gestral Village; its Picto is Powerful Revive."
    ],
    "Shared Care": [
      "act2",
      "Continent · Esquie swimming",
      "On the island containing White Tree's entrance, collect from the ground by the island camp."
    ],
    "Shielding Tint": [
      "act2",
      "Continent · northern detours",
      "In the ruined buildings on a peninsula SOUTHWEST of Boat Graveyard portal."
    ],
    "Sniper": [
      "act3",
      "Act 3 · relationships and full traversal",
      "The Reacher: defeat an enemy group in the snowy section."
    ],
    "Warming Up": [
      "act2",
      "Continent · before Old Lumière",
      "Outside Coastal Cave portal, defeat the optional Grosse Tete boss."
    ]
  };
  const regionNames=["Flying Manor","Endless Tower","Renoir\u0027s Drafts","Candy Land","Gestral Baths","Gestral Carousel","Reverie Path","Root of All Evil","The Reacher","Frozen Hearts","White Tree","Stone Wave Cliffs Cave","Crushing Cavern","Falling Leaves","Esoteric Ruins","Coastal Cave","Boat Graveyard","Stone Quarry","Hidden Gestral Arena","Abbest Cave","Sirène\u0027s Dress","Endless Night Sanctuary","Flying Casino","Sacred River","Isle of the Eyes","Dark Gestral Arena","Sunless Cliffs","The Crows","Sky Island","The Fountain","White Sands","The Meadows"];
  const pending=new Map();
  const findTarget=(step, groupName)=>{
    const desc=String(step[2]||"");
    if (groupName==="Picto inventory audit · Continent" && continentPictoHints[step[1]]) {
      const [ch, anchor, hint]=continentPictoHints[step[1]];
      step[2]=hint+" "+desc;
      return [ch,anchor];
    }
    if (/\bstarting weapon\b/i.test(desc)) return null;
    if (/\b(?:Chalier Combo|Stalact Punches)\b/i.test(step[1]))return ["act2","Monoco's Station"];
    if (/Blodam|Serpenphare/i.test(step[1]+" "+desc))return ["act3","Act 3 · relationships and full traversal"];
    if (step[1]==="Colim") {step[2]="Sirène · fight Chorale enemies on the ribbon paths near the large chamber. "+desc;return ["act2","Sirène"];}
    if (/Lumi.re.*Act III/i.test(desc+" "+groupName))return ["act3","Story finale · Lumière"];
    if (/Civilian outfit/i.test(step[1]) && /Verso/.test(step[1]))return ["act2","Continent · Esquie swimming"];
    if (/Camp scene with Maelle during Act 2/i.test(desc))return ["act2","Continent · Esquie swimming"];
    if (/Monoco.*Pure outfit/i.test(step[1]))return ["act3","Act 3 · relationships and full traversal"];
    if (/Gestral haircut/i.test(step[1]))return ["act1","Continent · AFTER Flying Waters (before Sanctuary)"];
    if (/Manor Door 11/.test(step[1]))return ["act3","Act 3 · relationships and full traversal"];
    if (/\bHidden Gestral Arena\b/i.test(desc+" "+groupName))return ["act1","Continent · AFTER Flying Waters (before Sanctuary)"];
    if (/\bAbbest Cave\b/i.test(desc+" "+groupName))return ["act1","Continent · FIRST VISIT (before Flying Waters)"];
    if (/\bLumi.re (?:Act III|Act 3)\b/i.test(desc+" "+groupName))return ["act3","Story finale · Lumière"];
    if (/\bIsle of the Eyes\b/i.test(desc))return ["act3","Act 3 · relationships and full traversal"];
    if (/\bGestral Beach\b/i.test(desc))return /volleyball|raft volley|swimsuit 2|race|only up/i.test(desc)?["act2","Continent · Esquie swimming"]:["act1","Continent · AFTER Flying Waters (before Sanctuary)"];
    if (/\bchoose (?:Maelle|Verso) ending\b/i.test(desc))return ["act3","Story finale · Lumière"];
    if (/\brelationship level\b|\bStart Act 3\b|\bAct 3 story progression\b|\bsecond Axon\b/i.test(desc))return ["act3","Act 3 · relationships and full traversal"];
    if (/\bSciel relationship level 6\b/i.test(desc))return ["act3","Act 3 · relationships and full traversal"];
    if (/\bThe Manor\b/i.test(desc))return /kitchen|switch puzzle/i.test(desc)?["act1","Gestral Village"]:/bookcase platform|spiral staircase/i.test(desc)?["act2","Continent · Esquie swimming"]:["act3","Act 3 · relationships and full traversal"];
    if (/\b(?:1|2|3) Lost Gestrals\b/i.test(desc))return ["act2","Continent · Esquie swimming"];
    if (/\b(?:5|9) Lost Gestrals\b/i.test(desc))return ["act3","Act 3 · relationships and full traversal"];
    if (/\bFestival Token\b/i.test(desc))return ["prologue","Lumière Festival"];
    if (/\bwestern? (?:lake|side)|\bsouthwestern Continent lake\b/i.test(desc))return ["act2","Continent · Esquie swimming"];
    if (/near Hidden Gestral Arena/i.test(desc))return ["act1","Continent · AFTER Flying Waters (before Sanctuary)"];
    if (/south of snow region/i.test(desc))return ["act2","Continent · northern detours"];
    if (/\bIsle of the Eyes\b|\bBoat Graveyard\b/i.test(desc))return ["act3","Act 3 · relationships and full traversal"];
    if(/requires paint break|behind paint spike|paint spike barrier/i.test(desc)&& !/endless night|manor/i.test(desc))return ["act2","Continent · before Old Lumière"];
    if(/requir(?:es|ing) flight|esquie.s flight|requires flying/i.test(desc))return ["act3","Act 3 · relationships and full traversal"];
    const skill=step[0]==="Skill enemy";
    for(const [test,ch,anchor] of targets){
      if(!test.test(desc+" "+groupName))continue;
      if(skill&&ch==="act1")return ["act2","Monoco's Station"];
      if(ch==="act2"&&anchor==="Forgotten Battlefield · Vanguard Point / Ancient Bridge"&&/fort ruins/i.test(desc))return [ch,"Forgotten Battlefield · Fort Ruins"];
      if(ch==="act2"&&anchor==="Forgotten Battlefield · Vanguard Point / Ancient Bridge"&&/main gate/i.test(desc))return [ch,"Forgotten Battlefield · Main Gate"];
      return [ch,anchor];
    }
    return null;
  };
  for(const [g,entries] of groups){
    if(/Chroma Catalysts/i.test(g)){excluded+=entries.length;continue}
    let unresolved=[];
    for(const step of entries){
      const desc=String(step[2]||"");
      if((step[0]==="Cosmetic"&&(/default(?: costume)?\b|deluxe edition default/i.test(desc)))||(/\bstarting weapon\b/i.test(desc))){excluded++;continue}
      if(step[0]==="Collectible"&&/Paint Cage 15\b/.test(step[1])){excluded++;continue}
      const dest=findTarget(step,g);
      if(!dest){unresolved.push(step);retained++;continue}
      step[3]=step[3]||"inventory:"+slug(g)+":"+slug(step[1]);
      const key=dest.join("::");let box=pending.get(key);if(!box){box=[];pending.set(key,box)}box.push(step);moved++;
    }
    if(unresolved.length)inv.areas.push([g,unresolved]);
  }
  for(const [key,items] of pending){
    const [id,anchor]=key.split("::");
    const chap=chapters.find(c=>c.id===id);if(!chap){inv.areas.push(["Unmapped - "+key,items]);continue}
    const at=chap.areas.findIndex(x=>x[0]===anchor);
    if(at<0){inv.areas.push(["Unmapped - "+key,items]);continue}
    const label="Collectibles to obtain before leaving · "+anchor;
    const existing=chap.areas.find(x=>x[0]===label);
    if(existing){existing[1].push(...items);continue}
    chap.areas.splice(at+1,0,[label,items]);
  }
  window.E33_ROUTE_MIGRATION_STATS={moved,retained,excluded,remaining:inv.areas.reduce((n,x)=>n+x[1].length,0)};
})();
