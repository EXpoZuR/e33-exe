/* E33.EXE 14.9: provenance, access milestones, and carefully verified route corrections.
   Applies AFTER inventory migration and BEFORE the tracker constructs its immutable steps. */
(function () {
  "use strict";
  const chapters=window.E33_COMPLETION_DATA||[];
  const slug=s=>String(s).normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const findChapter=id=>chapters.find(c=>c.id===id);
  const registry=[];
  for(const chapter of chapters)for(const pair of chapter.areas)for(const entry of pair[1]){
    if(!entry[3])entry[3]=chapter.id+":"+slug(pair[0])+":"+slug(entry[1]);
    registry.push({chapter,area:pair[0],entry});
  }
  const corrected={};
  const sources={};
  const verified={};
  const manualCapabilities={};
  const used=new Set();
  const addArea=(chapterId,name,after)=>{
    const chapter=findChapter(chapterId);
    if(!chapter)return null;
    let pair=chapter.areas.find(a=>a[0]===name);
    if(!pair){
      pair=[name,[]];
      const pos=after?chapter.areas.findIndex(a=>a[0]===after):-1;
      chapter.areas.splice(pos<0?0:pos+1,0,pair);
    }
    return pair;
  };
  function edit(title,{destination,directions,source,capabilities=[],originalArea}={}){
    const candidate=registry.find(x=>x.entry[1]===title&&!used.has(x.entry[3])&&
      (!originalArea||originalArea.test(x.area)));
    if(!candidate)return;
    used.add(candidate.entry[3]);
    const item=candidate.entry;
    if(destination){
      const arr=candidate.chapter.areas.find(a=>a[0]===candidate.area)?.[1];
      const at=arr?.indexOf(item)??-1;
      if(at>=0)arr.splice(at,1);
      const dest=addArea(destination[0],destination[1],destination[2]);
      if(dest)dest[1].push(item);
    }
    if(directions){item[2]=directions;corrected[item[3]]=directions;verified[item[3]]=true;}
    if(source)sources[item[3]]=source;
    if(capabilities.length)manualCapabilities[item[3]]=capabilities;
  }
  const FLIGHT=["act3","Continent · first flight sweep"];
  const PAINT=["act2","Paint Break · revisit previous areas","Continent · northern detours"];
  const SC_REWARD=["act3","Sciel rank 6 · camp rewards","Act 3 · relationships and full traversal"];
  // Treat swimming as a story milestone rather than a random nearby pickup.
  const swimArea=findChapter("act2")?.areas?.[0];
  if(swimArea&&!swimArea[1].some(x=>x[1]==="Unlock swimming / begin Act 2"))
    swimArea[1].unshift(["Story","Unlock swimming / begin Act 2",
      "Complete Stone Wave Cliffs, return to camp after Act 1, and follow the opening Act 2 story sequence. Once Esquie can enter the sea from the Continent, mark this complete and sweep the new islands before entering Forgotten Battlefield.",
      "act2:swim:unlock-swimming"]);
  corrected["act2:swim:unlock-swimming"]=swimArea[1][0][2];
  verified["act2:swim:unlock-swimming"]=true;
  // An explicit story milestone makes the first-flight sweep navigable.
  const flightGroup=addArea("act3",FLIGHT[1]);
  if(flightGroup&&!flightGroup[1].some(x=>x[1]==="Unlock flight / first flight sweep"))
    flightGroup[1].push(["Story","Unlock flight / first flight sweep",
      "Finish the Monolith in Act 2 and begin Act 3. Once Esquie can fly on the Continent, revisit the high ledges and sky islands marked in this section. Flight is not available during the Forgotten Battlefield story route.",
      "act3:flight:unlock-flight"]);
  corrected["act3:flight:unlock-flight"]=flightGroup[1][0][2];
  verified["act3:flight:unlock-flight"]=true;
  manualCapabilities["act3:flight:unlock-flight"]=[];
  edit("Angerim",{
    destination:FLIGHT,capabilities:["fly"],
    directions:"After Esquie learns to fly in Act 3, return to the Continent at the NORTHERN exit of Forgotten Battlefield. Fly UP to the isolated raised ledge immediately north of that exit and defeat the Chromatic Démineur there; its reward is Lune's Angerim. You cannot reach this ledge by swimming or walking.",
    source:"https://www.neoseeker.com/clair-obscur-expedition-33/Chromatic_Demineur"
  });
  edit("Stalum",{
    destination:["act2","Collectibles · Frozen Hearts"],capabilities:[],
    directions:"Enter Frozen Hearts and travel to the Glacial Falls Expedition Flag. Follow the broken railway tracks up the cliff beyond the flag and defeat the Danseuse + Stalact enemy group; the drop is Maelle's Stalum, NOT a Forgotten Battlefield overworld pickup.",
    source:"https://e33hub.com/en/weapons/stalum/"
  });
  edit("Verso — Civilian outfit",{
    capabilities:["swim"],
    directions:"Once Esquie can swim, reach the island SOUTHWEST of Forgotten Battlefield / northwest of Stone Wave Cliffs. Land on its beach, follow the shore toward the mountain and climb to the Manor door on the cliff. Inside the LIBRARY, climb the spiral stairs, follow the upper walkway to the books beside a lamp, and INTERACT with them. Enter the opened secret room and collect Verso's Civilian outfit from the DESK.",
    source:"https://www.neoseeker.com/clair-obscur-expedition-33/To_the_Forgotten_Battlefield"
  });
  edit("Verso — Swimsuit 1 outfit",{
    destination:SC_REWARD,capabilities:["fly"],
    directions:"In Act 3, make camp and choose Check Up on the Others. Speak with Sciel through her relationship scenes until RANK 6; watch her swimming lesson with Verso. That scene awards BOTH Sciel's and Verso's Swimsuit I outfits. This is NOT a Gestral Beach race reward.",
    source:"https://www.gamerguides.com/clair-obscur-expedition-33/guide/characters/relationships/relationship-guide-all-ranks-and-rewards/"
  });
  edit("Sciel — Swimsuit 1 outfit",{
    destination:SC_REWARD,capabilities:["fly"],
    directions:"At camp in Act 3, choose Check Up on the Others and speak with Sciel until relationship rank 6. Finish the swimming lesson scene with Verso to automatically receive Sciel's Swimsuit I AND Verso's Swimsuit I.",
    source:"https://www.gamerguides.com/clair-obscur-expedition-33/guide/characters/relationships/relationship-guide-all-ranks-and-rewards/"
  });
  // Additional source-checked corrections discovered during the chapter-by-chapter pass.
  edit("Maelle — Swimsuit outfit",{
    destination:FLIGHT,capabilities:["fly"],
    directions:"With Esquie's FLIGHT in Act 3, fly to the isolated Gestral Beach island SOUTH of Sirène, in the lake south of the northern Gestral Beach. The Expedition 37 journal lies immediately RIGHT of the entrance. Climb the three-lane tower, moving sideways between handholds to dodge falling blue flames, then speak to the GRANDIS at the top for Maelle's Swimsuit.",
    source:"https://www.neoseeker.com/clair-obscur-expedition-33/Gestral_Beach_5"
  });
  edit("Verso — Sakapatate outfit",{
    destination:["act2","Act 2 · revisit earlier merchants","Continent · Esquie swimming"],
    directions:"Once Verso joins your party in Act 2, FAST TRAVEL back to Gestral Village. From Chief Golgra's House turn LEFT into the Bazaar, walk through the market, then turn RIGHT to Delsitra, the merchant beside a large LIT TORCH. Buy Verso's Sakapatate outfit for 1,000 Chroma; that stock is not usable as Verso in Act 1.",
    source:"https://gameranx.com/features/id/542130/article/clair-obscur-expedition-33-all-verso-outfits-and-haircuts/"
  });
  edit("Monoco — Swimsuit outfit",{
    capabilities:["swim"],
    directions:"After recruiting MONOCO at his station in Act 2, head southwest into the forest between Monoco's Station and Old Lumière. Find the small LAKE with a Gestral Beach portal in its CENTER (swim to it with Esquie). Inside, finish the Only Up-style climbing course; at the summit pass the dancing Gestrals, ascend the stairs and speak to the host to claim Monoco's Swimsuit.",
    source:"https://gameranx.com/features/id/542131/article/clair-obscur-expedition-33-all-monoco-outfits-and-haircuts/"
  });
  edit("Sciel — Swimsuit 2 outfit",{
    capabilities:["swim"],
    directions:"Once Esquie can SWIM in Act 2, sail east to the Gestral Beach RAFT VOLLEYBALL portal. Enter the Rafting Club and challenge the STRONGEST Gestral; return all his serves to win the final match and receive Sciel's Swimsuit II.",
    source:"https://mapmaster.io/games/clair-obscur-expedition-33/guides/Outfit"
  });
  edit("Baguette",{
    destination:["endgame","New Game+ only · bakery revisit","Verification sweep"],
    directions:"NEW GAME+ ONLY. Keep an unused Festival Token when ending your previous run. During NG+ Lumière's DAYTIME Prologue, after meeting Sophie, go to Mathilde's Boulangerie on Main Street and interact with the BREAD BASKET immediately in front of the bakery. Spend the carried-over token for a Baguette weapon. In your first playthrough, only preserve a token; the weapon cannot be obtained there yet.",
    source:"https://clair-obscur.fandom.com/wiki/Baguette_(weapon)"
  });
  edit("Forlorn",{
    destination:FLIGHT,capabilities:["fly"],
    directions:"In Act 3, FLY to the inaccessible raised coast east of the original Act 1 island. Follow the southwest beach path up toward its Manor door. Inside, interact with the nearby WARDROBE to open the concealed room and pick up the Forlorn music record from its floor.",
    source:"https://gameranx.com/features/id/540284/article/clair-obscur-expedition-33-all-music-record-locations-connoisseur-achievement-guide/"
  });
  edit("Rêveries dans Paris",{
    destination:FLIGHT,capabilities:["fly"],
    directions:"After unlocking FLIGHT in Act 3, fly to Flying Casino, suspended northeast of Stone Wave Cliffs (south-southeast of Forgotten Battlefield). At the BOARDED-UP casino entrance, do not go inside: follow the exterior wall around to the RIGHT and take the Rêveries dans Paris music record lying on the rocks behind the building.",
    source:"https://www.pushsquare.com/guides/clair-obscur-expedition-33-flying-casino-walkthrough-music-records"
  });
  edit("Julie",{
    destination:FLIGHT,capabilities:["fly"],
    directions:"Fly to the previously unreachable raised land WEST of Forgotten Battlefield's northern exit. Land at the expedition campsite in front of the enemies and pick up the JULIE expedition journal from that camp BEFORE proceeding into the enemy group.",
    source:"https://www.pushsquare.com/guides/clair-obscur-expedition-33-the-continent-walkthrough-lost-gestrals-music-records-outfits-journals"
  });
  edit("Verso",{
    originalArea:/northern detours/,destination:FLIGHT,capabilities:["fly"],
    directions:"From the JULIE journal's raised campsite west of Forgotten Battlefield's northern exit, move forward and defeat the group of enemies guarding the rest of the ledge. Pick up the VERSO expedition journal from the ground immediately BEHIND those enemies.",
    source:"https://www.pushsquare.com/guides/clair-obscur-expedition-33-the-continent-walkthrough-lost-gestrals-music-records-outfits-journals"
  });
  edit("Expedition 37",{
    destination:FLIGHT,capabilities:["fly"],
    directions:"In Act 3 FLY to the isolated Gestral Beach island in the LAKE SOUTH of Sirène, below the northern Gestral Beach. Enter the portal and IMMEDIATELY turn RIGHT; Expedition 37 is beside the fallen expeditioner at the base of the climbing tower. Pick it up before climbing for Maelle’s Swimsuit.",
    source:"https://www.neoseeker.com/clair-obscur-expedition-33/Gestral_Beach_5"
  });
  edit("Betelim",{
    destination:PAINT,capabilities:["paint"],
    directions:"After rescuing FOUR Lost Gestrals, talk to Sastro at camp to unlock Paint Break. Return to Gestral Village and fast-travel to the GESTRAL ARENA flag; head LEFT toward Chief's House, take the alley beside it, and look BEHIND the home of the Gestral sitting in flames. Break the Paint Spike at that house and pick up Lune's Betelim inside.",
    source:"https://www.neoseeker.com/clair-obscur-expedition-33/Paint_Spikes"
  });
  edit("Aegis Revival",{
    destination:PAINT,capabilities:["paint"],
    directions:"After Sastro awards Paint Break for FOUR rescued Gestrals, return to Spring Meadows' Abandoned Expeditioner Camp and find the friendly white Jar Nevron. Break the Paint Spike beside Jar, GRAPPLE across the gap behind it, and pick up Aegis Revival on the RIGHT side.",
    source:"https://www.neoseeker.com/clair-obscur-expedition-33/Paint_Spikes"
  });
  // Frozen Hearts is reached from Monoco's Station's EAST exit after the station's
  // story sequence, not after Old Lumière or the coral-breaking upgrade.
  const act2Chapter=findChapter("act2");
  if(act2Chapter){
    const frozenIndex=act2Chapter.areas.findIndex(a=>a[0]==="Collectibles · Frozen Hearts");
    const monocoIndex=act2Chapter.areas.findIndex(a=>a[0]==="Monoco's Station");
    if(frozenIndex>=0&&monocoIndex>=0){
      const [frozenArea]=act2Chapter.areas.splice(frozenIndex,1);
      const place=act2Chapter.areas.findIndex(a=>a[0]==="Collectibles · Monoco's Station");
      act2Chapter.areas.splice((place<0?monocoIndex:place)+1,0,frozenArea);
    }
    const monocoArea=act2Chapter.areas.find(a=>a[0]==="Monoco's Station");
    const returnItem=monocoArea?.[1].find(a=>a[1]==="Eternal Ice merchant request");
    if(returnItem){
      monocoArea[1].splice(monocoArea[1].indexOf(returnItem),1);
      const after=addArea("act2","Return Eternal Ice to Grandis merchant","Collectibles · Frozen Hearts");
      after[1].push(returnItem);
      returnItem[2]="From Frozen Hearts' final boss GARGANT, collect Eternal Ice. Exit through the portal back to Monoco's Station and speak to the Grandis Merchant beside the train. HAND OVER Eternal Ice to unlock the merchant's additional stock, then purchase the unique weapons and Pictos you still need.";
      verified[returnItem[3]]=true;
      corrected[returnItem[3]]=returnItem[2];
      sources[returnItem[3]]="https://www.neoseeker.com/clair-obscur-expedition-33/Frozen_Hearts";
    }
  }
  // All seven Grandis merchant rewards are sold only AFTER the Eternal Ice hand-in.
  // Several formerly appeared before the quest in Monoco's Station's pickup inventory.
  const merchantSource="https://www.neoseeker.com/clair-obscur-expedition-33/Side_Quest_-_Grandis_-_Monocos_Station";
  [
    ["Coldum","Maelle weapon", "39,200"],
    ["Grandaro","Monoco weapon","53,901"],
    ["Cultam","Verso/Gustave weapon","47,530"],
    ["Survivor","Picto","98,000"],
    ["Greater Rush","Picto","85,750"]
  ].forEach(([item,type,price])=>edit(item,{
    destination:["act2","Return Eternal Ice to Grandis merchant"],capabilities:["swim"],
    directions:"Complete Frozen Hearts and defeat GARGANT to get Eternal Ice. Return via the exit portal to Monoco's Station, speak to the GRANDIS MERCHANT left of the station's Expedition Flag beside the train, hand over the Eternal Ice, then buy "+item+" ("+type+") for "+price+" Chroma. This item is not sold before the hand-in.",
    source:merchantSource
  }));
  // Single-claim pickup directions checked against the full Picto location inventory.
  edit("Augmented Aim",{directions:"In Flying Waters fast-travel to NOCO'S HUT Flag, enter the open area with the GIANT ANCHOR and use the handholds climbing the anchor structure to the high ledge. Pick up the Augmented Aim Picto there.",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  edit("Augmented Attack",{directions:"At Spring Meadows' GRAND MEADOW Flag, take the optional RIGHT-hand path beyond the flying Volesters instead of climbing the rope toward the story exit. Defeat the CHROMATIC LANCELIER at the end of this detour to obtain Augmented Attack.",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  edit("Augmented Counter I",{directions:"From the CORAL CAVE Flag in Flying Waters, climb the handholds toward the optional Bourgeon arena; defeat that BOURGEON boss to acquire Augmented Counter I. It is a boss reward, not a loose pickup.",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  edit("Augmented First Strike",{directions:"Inside ESQUIE'S NEST, continue to François, the boss who guards Esquie. Defeat FRANÇOIS and collect the Augmented First Strike Picto from the victory rewards before exiting the Nest.",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  edit("Auto Death",{directions:"At YELLOW HARVEST's HARVESTER'S HOLLOW Flag, take the right-hand route through the lamp-filled clearing and pass the fallen expeditioner/journal; look LEFT for the grapple point to PINABBY's elevated rock. Buy Auto Death from Pinabby for 5,320 Chroma (Teamwork also requires defeating him).",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  edit("Auto Regen",{directions:"Enter SIRÈNE and reach the DANCING CLASSES Expedition Flag. Follow the route onward into the deep interior chamber, check beside the enemy near the chamber's side wall, and pick up Auto Regen from the ground.",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  edit("Beneficial Contamination",{directions:"In FALLING LEAVES, start at the RESINVEIL GROVE Expedition Flag and follow the grove path toward the grapple point that leads to PECHA's merchant ledge. Grapple across and buy the Beneficial Contamination Picto from the merchant for 48,200 Chroma.",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  edit("Breaker",{directions:"At ANCIENT SANCTUARY's GIANT BELL ALLEY Flag, explore the side route to the ULTIMATE SAKAPATATE encounter and defeat it. The Breaker Picto is the boss reward, not a hidden pickup in the entrance corridor.",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  edit("Burn Affinity",{directions:"From FROZEN HEARTS' GLACIAL FALLS Flag, head to the cave containing the MANOR DOOR, then take the FOGGY PASSAGE to its right. Grapple ahead, descend the rope and land on the broken TRAIN CARRIAGE to pick up Burn Affinity.",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  edit("Burning Death",{directions:"Enter FROZEN HEARTS through the eastern route out of Monoco's Station. Defeat the FIRST GROUP of Danseuse-type enemies on the path beyond the Icebound Train Station Flag to receive the Burning Death Picto.",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  edit("Cleansing Tint",{directions:"Advance through SPRING MEADOWS to the INDIGO TREE Expedition Flag and defeat the mandatory ÉVÊQUE boss on the story path. Cleansing Tint is among its battle rewards.",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  edit("Critical Moment",{directions:"In GESTRAL VILLAGE, head into the GESTRAL BAZAAR from the village entrance and locate the merchant in its back alley. Buy Critical Moment for 5,520 Chroma; do not search the village streets for a ground pickup.",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  edit("Energising Break",{directions:"From FLYING WATERS' LUMIÈRAN STREETS Flag, reach and defeat the CHROMATIC TROUBADOUR on the optional upper path. Search its battle/arena rewards for Energising Break before returning to the story trail.",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  edit("Energising Burn",{directions:"In FROZEN HEARTS, enter from Monoco's Station and unlock the ICEBOUND TRAIN STATION Flag. Continue deep into the abandoned train passages to the CHROMATIC VEILLEUR enemy and defeat it for Energising Burn.",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  edit("Energising Gradient",{directions:"Exit FORGOTTEN BATTLEFIELD through its NORTH portal onto the Continent, then explore the slopes NORTHWEST of that entrance. Defeat the FROST ÉVÊQUE roaming this approach to collect Energising Gradient.",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  edit("Energising Shell",{directions:"In Act 3 FLY just EAST of the STONE WAVE CLIFFS CAVE portal on the Continent. Land at the raised rock formation, use PAINT BREAK on the blue-black Paint Spike and take Energising Shell from the newly accessible pickup.",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  edit("Confident Fighter",{directions:"Within VISAGES enter the PATH OF JOY section and progress to its enormous SKULL landmark. Turn RIGHT around the skull and pick up Confident Fighter from the nearby ledge before continuing toward the masks.",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  edit("Energising Revive",{directions:"With Esquie's swimming unlocked, enter STONE WAVE CLIFFS CAVE from the sea. Follow the cave route to its final arena and defeat the CHROMATIC HEXGA; Energising Revive is the battle reward.",source:"https://game-checklists.com/expedition33/all-pictos.html"});
  // Sastro's haircut rewards are strictly keyed by the number of recovered Lost
  // Gestrals. Old collection migration incorrectly displayed 2/3/5 in early Act 1.
  [
    {
      name:"Lune · Gestral haircut",
      after:["act1","Return to camp · two Gestrals","Continent · AFTER Esquie traversal"],
      quest:"act1:continent-after-esquie-traversal:lost-gestral-2",
      count:2
    },
    {
      name:"Sciel · Gestral haircut",
      after:["act2","Return to camp · three Gestrals","Collectibles · Continent · Esquie swimming"],
      quest:"act2:continent-esquie-swimming:lost-gestral-3",
      count:3
    },
    {
      name:"Verso · Gestral haircut",
      after:["act2","Return to camp · five Gestrals","Collectibles · Continent · western expansion"],
      quest:"act2:continent-western-expansion:lost-gestral-5",
      count:5
    }
  ].forEach(({name,after,quest,count})=>{
    const ordinal=String(count)+(count===2?"nd":count===3?"rd":"th");
    edit(name,{
      destination:after,
      directions:"First find and rescue at least "+count+" Lost Gestrals on the Continent; the "+ordinal+" comes from the preceding Lost Gestral checkpoint in this guide. At CAMP, locate SASTRO beside the Curator's cave and speak with him to claim the "+name+" reward. You cannot obtain this hairstyle before rescuing "+count+" Gestrals.",
      source:"https://www.neoseeker.com/clair-obscur-expedition-33/Lost_Gestrals"
    });
    const id=registry.find(x=>x.entry[1]===name)?.entry[3];
    if(id&&window.E33_COMPLETION_GATES?.steps)
      window.E33_COMPLETION_GATES.steps[id]={requires:[quest],tip:"Save the "+ordinal+" Lost Gestral, then talk to Sastro in camp to claim this reward."};
  });
  // Keep related post-flight pickups together: the two journals are on one
  // plateau, and Expedition 37 is at the entrance to Maelle's climbing beach.
  if(flightGroup){
    const prior=[
      "Unlock flight / first flight sweep",
      "Angerim",
      "Julie",
      "Verso",
      "Expedition 37",
      "Maelle — Swimsuit outfit",
      "Forlorn",
      "Rêveries dans Paris"
    ];
    flightGroup[1].sort((a,b)=>{
      const ai=prior.indexOf(a[1]),bi=prior.indexOf(b[1]);
      return (ai<0?999:ai)-(bi<0?999:bi);
    });
  }
  // These milestones are sourced from story traversal and Sastro's nine-gestral rewards.
  const abilities=[
    {id:"rough",label:"Cross rough terrain",when:"Recruit Esquie in his Nest (Act 1)",source:"https://www.neoseeker.com/clair-obscur-expedition-33/walkthrough"},
    {id:"swim",label:"Swim",when:"Finish Stone Wave Cliffs, then begin Act 2",source:"https://www.xboxachievements.com/game/expedition-33/guide/"},
    {id:"paint",label:"Paint Break",when:"Rescue FOUR Lost Gestrals; talk to Sastro at camp",source:"https://www.neoseeker.com/clair-obscur-expedition-33/Lost_Gestrals"},
    {id:"reef",label:"Cross coral reefs",when:"Finish Old Lumière in Act 2",source:"https://www.xboxachievements.com/game/expedition-33/guide/"},
    {id:"fly",label:"Fly",when:"Finish the Monolith and enter Act 3",source:"https://www.xboxachievements.com/game/expedition-33/guide/"},
    {id:"dive",label:"Dive underwater",when:"Finish Esquie's relationship rank 6 quest in Act 3",source:"https://www.xboxachievements.com/game/expedition-33/guide/"},
    {id:"ngplus",label:"New Game+",when:"Start a subsequent playthrough with a carried-over Festival Token",source:"https://clair-obscur.fandom.com/wiki/Baguette_(weapon)"}
  ];
  const milestones={
    rough:"act1:esquie-s-nest-return-to-village:franc-ois-recruit-esquie",
    swim:"act2:swim:unlock-swimming",
    paint:"act2:continent-northern-detours:lost-gestral-4-paint-break",
    reef:"act2:old-lumie-re:old-lumie-re-story-encounter",
    fly:"act3:flight:unlock-flight",
    dive:"act3:act-3-relationships-and-full-traversal:esquie-6-7"
  };
  // Correct the prior gate with a reference to a non-existent step.
  const gate=window.E33_COMPLETION_GATES?.steps?.["act2:continent-northern-detours:painting-workshop-entrance-2"];
  if(gate?.requires)gate.requires=gate.requires.map(id=>id==="act2:forgotten-battlefield:dualliste"?
    "act2:forgotten-battlefield-vanguard-point-ancient-bridge:dualliste":id);
  // A historical gate key was left after removing the old objective.
  if(window.E33_COMPLETION_GATES?.steps)delete window.E33_COMPLETION_GATES.steps["act3:act-3-relationships-and-full-traversal:find-remaining-gestrals"];
  const requirements={};
  const quality={};
  let vague=0;
  for(const chapter of chapters)for(const [area,entries] of chapter.areas)for(const entry of entries){
    const [kind,title,description,id]=entry;
    const context=(area+" "+title+" "+description).toLowerCase();
    const need=new Set(manualCapabilities[id]||[]);
    if(chapter.id==="act2")need.add("swim");
    if(chapter.id==="act3"||(chapter.id==="endgame"&&!/New Game\+/i.test(area)))need.add("fly");
    if(/New Game\+/i.test(area)||/^Baguette$/i.test(title))need.add("ngplus");
    if(chapter.id==="update"&&/verso.s drafts/i.test(area))need.add("dive");
    if(chapter.id==="act1"&&/after esquie traversal|yellow harvest|lost woods/i.test(area))need.add("rough");
    if(chapter.id==="act2"&&/western expansion|eastern detour|sir.ne/i.test(area))need.add("reef");
    if(/paint spike|paint break|paint nail/i.test(description))need.add("paint");
    if(/esquie.{0,30}(?:\bfly\b|flight)|(?:requires|using|unlock).{0,22}flight|flying casino|raised ledge only reachable by flight|floating island|airborne island/i.test(context))need.add("fly");
    if(id==="act1:continent-after-esquie-traversal:ancient-gestral-city"||id==="act2:continent-eastern-detour:gestral-race")need.delete("fly");
    if(/requires.{0,25}diving|underwater diving|dive entrance|renoir.s drafts/i.test(context))need.add("dive");
    if(/requires.{0,18}coral|swim through coral|sea.reef.breaking/i.test(context))need.add("reef");
    if(/requires.{0,20}esquie.s rough.terrain|land.barrier/i.test(context))need.add("rough");
    if(kind==="Story"&&id==="act3:flight:unlock-flight")need.delete("fly");
    if(id===milestones.swim)need.delete("swim");
    if(id===milestones.paint)need.delete("paint");
    if(id===milestones.rough)need.delete("rough");
    if(id===milestones.dive)need.delete("dive");
    if(id===milestones.reef)need.delete("reef");
    requirements[id]=[...need];
    // An inventory-location statement is not an independently verified walking route.
    const generic=/Acquisition inventory check|This is a location.index|Check that this distinct|Check the character.s weapon inventory after obtaining|Find or obtain this Picto and verify|Check that.*is unlocked/i.test(description);
    const bare=/^(?:Continent|Location|Found at|Source)\s*[:·]/i.test(description)&&description.length<80;
    if(verified[id])quality[id]="verified";
    else if(generic||bare){quality[id]="unverified";vague++;}
    else quality[id]=id.startsWith("inventory:")?"catalogued":"authored";
  }
  window.E33_COMPLETION_AUDIT={version:"14.9.0",abilities,milestones,requirements,quality,verified,sources,corrected,
    stats:{steps:Object.keys(requirements).length,vague,corrected:Object.keys(verified).length}};
})();