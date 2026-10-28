"use strict";
/* Assert the Weapons page follows the in-game party order without changing
   each card's weapon contents or the filter character labels. */
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
const desired=["Sciel","Lune","Verso","Maelle","Monoco","Gustave"];
const begin=html.indexOf('<main class="grid" id="grid">');
const finish=html.indexOf("</main>",begin);
assert.ok(begin>=0&&finish>begin,"Weapons page grid not found");
const grid=html.slice(begin,finish);
const cards=[...grid.matchAll(/<section class="character-card"[^>]*>\s*<div class="character-header">\s*<h2>([^<]+)<\/h2>/g)].map(m=>m[1]);
assert.deepEqual(cards,desired,"Weapons card order differs from game's character order");
const match=html.match(/<select id="weaponTrackerCharacter"[^>]*>([\s\S]*?)<\/select>/);
assert.ok(match,"Weapon character filter missing");
const options=[...match[1].matchAll(/<option(?:\s+[^>]*)?>([^<]+)<\/option>/g)].map(x=>x[1]);
assert.deepEqual(options,["All characters",...desired],"Weapon tracker dropdown order incorrect");
console.log("PASS: Weapons cards and tracker filter both use",desired.join(" > "));
