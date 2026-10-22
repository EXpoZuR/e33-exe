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
    destination:["act2","Collectibles · Frozen Hearts"],capabilities:["reef"],
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
    directions:"Fly to the otherwise inaccessible Gestral Beach ringed by steep rocks and water in the NORTHEAST Continent. Enter the Climb the Wall beach portal; the Expedition 37 journal is immediately to your RIGHT near the bodies of failed climbers, before the challenge itself.",
    source:"https://www.pushsquare.com/guides/clair-obscur-expedition-33-the-continent-walkthrough-lost-gestrals-music-records-outfits-journals"
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
  // These milestones are sourced from story traversal and Sastro's nine-gestral rewards.
  const abilities=[
    {id:"rough",label:"Cross rough terrain",when:"Recruit Esquie in his Nest (Act 1)",source:"https://www.neoseeker.com/clair-obscur-expedition-33/walkthrough"},
    {id:"swim",label:"Swim",when:"Finish Stone Wave Cliffs, then begin Act 2",source:"https://www.xboxachievements.com/game/expedition-33/guide/"},
    {id:"paint",label:"Paint Break",when:"Rescue FOUR Lost Gestrals; talk to Sastro at camp",source:"https://www.neoseeker.com/clair-obscur-expedition-33/Lost_Gestrals"},
    {id:"reef",label:"Cross coral reefs",when:"Finish Old Lumière in Act 2",source:"https://www.xboxachievements.com/game/expedition-33/guide/"},
    {id:"fly",label:"Fly",when:"Finish the Monolith and enter Act 3",source:"https://www.xboxachievements.com/game/expedition-33/guide/"},
    {id:"dive",label:"Dive underwater",when:"Finish Esquie's relationship rank 6 quest in Act 3",source:"https://www.xboxachievements.com/game/expedition-33/guide/"}
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
  const requirements={};
  const quality={};
  let vague=0;
  for(const chapter of chapters)for(const [area,entries] of chapter.areas)for(const entry of entries){
    const [kind,title,description,id]=entry;
    const context=(area+" "+title+" "+description).toLowerCase();
    const need=new Set(manualCapabilities[id]||[]);
    if(chapter.id==="act2")need.add("swim");
    if(chapter.id==="act3"||chapter.id==="endgame")need.add("fly");
    if(chapter.id==="update"&&/verso.s drafts/i.test(area))need.add("dive");
    if(chapter.id==="act1"&&/after esquie traversal|yellow harvest|lost woods/i.test(area))need.add("rough");
    if(chapter.id==="act2"&&/western expansion|eastern detour|sir.ne/i.test(area))need.add("reef");
    if(/paint spike|paint break|paint nail/i.test(description))need.add("paint");
    if(/esquie.{0,40}(?:fly|flight)|(?:requires|using|unlock).{0,22}flight|flying casino|raised ledge only reachable by flight|floating island|airborne island/i.test(context))need.add("fly");
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