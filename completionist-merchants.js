/* E33.EXE verified merchant-access registry. Loaded after item chronology/coverage.
 * Treat access as a property of the merchant's AREA, not a guess about each item.
 * Entries maintain original IDs and localStorage progress when moved.
 * Where source evidence conflicts, do not auto-certify a vendor.
 */
(function(){
  "use strict";
  const chapters=window.E33_COMPLETION_DATA||[];
  const audit=window.E33_COMPLETION_AUDIT;
  if(!audit)throw Error("completionist integrity must load before merchant access");
  const catalog=[
    {
      id:"lucaroparfe", name:"Lucaroparfé",
      chapter:"act3", area:"Continent · Lucaroparfé valley (flight)",
      after:"Continent · first flight sweep",
      capabilities:["fly"],
      sources:[
        "https://www.neoseeker.com/clair-obscur-expedition-33/Lucaroparfe",
        "https://gamefaqs.gamespot.com/ps5/469495-clair-obscur-expedition-33/faqs/81883/merchants"
      ],
      location:"With ESQUIE'S ACT 3 FLIGHT, land in the otherwise inaccessible VALLEY EAST OF THE MEADOWS and NORTHEAST OF LUMIÈRE, among THREE fallen Contorsionnistes beside the CHROMATIC BÉNISSEUR.",
      stock:[
        {title:"Monoco · Pure haircut",price:"2,000 Chroma",item:"Pure haircut for Monoco"},
        {title:"Monoco — Pure outfit",price:"10,000 Chroma",item:"Pure outfit for Monoco"}
      ]
    },
    {
      id:"sodasso", name:"Sodasso",
      chapter:"act3", area:"Continent · Sodasso valley (flight)",
      after:"Continent · Lucaroparfé valley (flight)",
      capabilities:["fly"],
      sources:[
        "https://www.neoseeker.com/clair-obscur-expedition-33/Sodasso",
        "https://gamefaqs.gamespot.com/ps5/469495-clair-obscur-expedition-33/faqs/81883/merchants"
      ],
      location:"With ESQUIE'S ACT 3 FLIGHT, land in the isolated SHALLOW VALLEY NORTH OF THE REACHER and directly WEST OF VISAGES, then find merchant SODASSO in its open field.",
      stock:[
        {title:"Verso · Curly haircut",price:"2,000 Chroma",item:"Curly haircut for Verso"},
        {title:"Maelle · Short White haircut",price:"2,000 Chroma",item:"Short White haircut for Maelle"},
        {title:"Sciel · Double Braid haircut",price:"2,000 Chroma",item:"Double Braid haircut for Sciel"}
      ]
    }
  ];
  const errors=[];
  function find(item){
    const matches=[];
    for(const chapter of chapters)for(const group of chapter.areas)for(const entry of group[1])
      if(entry[1]===item)matches.push({chapter,group,entry});
    if(matches.length!==1)errors.push(item+" expected exactly one source entry; found "+matches.length);
    return matches[0];
  }
  for(const m of catalog){
    const chapter=chapters.find(ch=>ch.id===m.chapter);
    if(!chapter){errors.push("Missing merchant chapter "+m.chapter);continue;}
    let group=chapter.areas.find(x=>x[0]===m.area);
    if(!group){
      group=[m.area,[]];
      const idx=chapter.areas.findIndex(a=>a[0]===m.after);
      if(idx<0){errors.push("Missing preceding travel sweep "+m.after);continue;}
      chapter.areas.splice(idx+1,0,group);
    }
    for(const stock of m.stock){
      const found=find(stock.title);
      if(!found)continue;
      if(found.group!==group){
        found.group[1].splice(found.group[1].indexOf(found.entry),1);
        group[1].push(found.entry);
      }
      const entry=found.entry,id=entry[3];
      const directions=m.location+" Buy the "+stock.item+" from "+m.name+" for "+stock.price+".";
      entry[2]=directions;
      audit.requirements[id]=[...new Set([...m.capabilities])];
      audit.corrected[id]=directions;
      audit.verified[id]=true;
      audit.quality[id]="verified";
      audit.sources[id]=m.sources[0];
    }
  }
  if(errors.length)throw Error("Merchant registry invalid: "+errors.join("; "));
  window.E33_MERCHANT_ACCESS={
    catalog,sourceCount:catalog.reduce((n,x)=>n+x.sources.length,0),
    lockedItems:catalog.reduce((n,x)=>n+x.stock.length,0)
  };
})();