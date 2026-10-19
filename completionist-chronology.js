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
  const pending=new Map();
  const findTarget=(step, groupName)=>{
    const desc=String(step[2]||"");
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
      if(step[0]==="Cosmetic"&&(/default(?: costume)?\b|deluxe edition default/i.test(desc))){excluded++;continue}
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
    const label="Unique items · "+anchor;
    const existing=chap.areas.find(x=>x[0]===label);
    if(existing){existing[1].push(...items);continue}
    chap.areas.splice(at+1,0,[label,items]);
  }
  window.E33_ROUTE_MIGRATION_STATS={moved,retained,excluded,remaining:inv.areas.reduce((n,x)=>n+x[1].length,0)};
})();
