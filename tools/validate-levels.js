#!/usr/bin/env node
/* TURBO MAZE — level validator (the reusable "scratchpad" harness, now version-controlled).
 *
 * Proves every level is beatable BEFORE it ships, using the game's own reachability semantics.
 * Reused across every content drop (Worlds 2-4, VS/KO arenas, co-op seasons).
 *
 *   node tools/validate-levels.js            # regression-check all shipped levels in index.html
 *   node tools/validate-levels.js FILE.js    # validate a candidate module.exports = [ ...levels ]
 *
 * Authoring flow: write candidate levels in a scratch .js (module.exports = [{name,emoji,hue,par,grid:[...]}]),
 * run this on it, fix what it flags, then paste the grids into the matching array in index.html.
 * Use mk() below to avoid off-by-one width bugs (write interiors; it wraps borders + pads to width).
 */
const fs = require("fs");
const path = require("path");
const HTML = path.join(__dirname, "..", "index.html");

// --- interior builder: write rows WITHOUT borders; this seals borders + pads each row to width W ---
function mk(W, rows){
  const out = ["#".repeat(W)];
  rows.forEach((r,i)=>{ if(r.length>W-2) throw new Error(`mk row ${i} too long (${r.length}>${W-2}): ${r}`);
    out.push("#" + r + ".".repeat(W-2-r.length) + "#"); });
  out.push("#".repeat(W));
  return out;
}

// --- the game's own reachability primitives (kept in sync with index.html) ---
function findIn(rows, ch){ for(let r=0;r<rows.length;r++){ const c=rows[r].indexOf(ch); if(c>=0) return [c,r]; } return null; }
function findAll(rows, ch){ const o=[]; rows.forEach((r,y)=>[...r].forEach((c,x)=>{ if(c===ch) o.push([x,y]); })); return o; }
function bfs(rows, starts, passable){
  const R=rows.length, C=rows[0].length, d=Array.from({length:R},()=>new Array(C).fill(-1)), q=[];
  for(const s of starts){ if(d[s[1]][s[0]]<0){ d[s[1]][s[0]]=0; q.push(s); } }
  while(q.length){ const [c,r]=q.shift();
    for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nc=c+dc,nr=r+dr;
      if(nc<0||nr<0||nc>=C||nr>=R||d[nr][nc]!==-1||!passable(rows[nr][nc])) continue;
      d[nr][nc]=d[r][c]+1; q.push([nc,nr]); } }
  return d;
}
// M/N shifting walls, w trap walls, ! pits, O trap doors, conveyors, ~ ice, & sticky shallows,
// J splash pad, % foam float, T/z/B/o/*/c/n are all PASSABLE for reachability (temporary or floor).
// Only # is a permanent wall. Crushers are a runtime property (not in the grid). Crates x are solid
// until smashed; foam % is checked separately (it can't be the SOLE bridge — see checkCampaign).
const openPass  = ch => ch!=="#";                 // gates/doors treated open
const shutPass  = ch => ch!=="#" && ch!=="Q";     // co-op gate Q shut
const noCrate   = ch => ch!=="#" && ch!=="x";     // crate x as a wall (no forced smash)
const noFoam    = ch => ch!=="#" && ch!=="%";     // 🧱 foam float as already-collapsed (post-collapse reachability)

function frame(rows, issues){
  const W = rows[0].length;
  rows.forEach((r,y)=>{ if(r.length!==W) issues.push(`row ${y} length ${r.length}≠${W}`); });
  for(let c=0;c<W;c++){ if(rows[0][c]!=="#"||rows[rows.length-1][c]!=="#") issues.push(`top/bottom border hole col ${c}`); }
  rows.forEach((r,y)=>{ if(r[0]!=="#"||r[W-1]!=="#") issues.push(`side border hole row ${y}`); });
  const nT = findAll(rows,"T").length; if(nT!==0 && nT!==2) issues.push(`portals=${nT} (must be 0 or 2)`);
}

// ---- per-mode checks ----
function checkCampaign(L){                          // LEVELS: single car, race to F
  const rows=L.grid, iss=[]; frame(rows,iss);
  const S=findIn(rows,"S"), F=findIn(rows,"F"), key=findIn(rows,"k");
  if(!S) iss.push("no S"); if(!F) iss.push("no F");
  if(rows.some(r=>r.includes("D")) && !key) iss.push("door needs a key");
  if(S&&F){
    if(bfs(rows,[S],openPass)[F[1]][F[0]]<0) iss.push("CAN'T REACH THE FLAG");
    else if(bfs(rows,[S],noFoam)[F[1]][F[0]]<0) iss.push("a foam float (%) is the only S→F bridge — after it collapses a kid respawns stranded; add an alternate ground route");
    if(bfs(rows,[S],noCrate)[F[1]][F[0]]<0) iss.push("⚠ crate on the sole path — fine ONLY if it's a smashable-crate level with runway to build speed");
    if(key && bfs(rows,[S],shutPass)[key[1]][key[0]]<0) iss.push("key is locked behind its own door");
    const d=bfs(rows,[S],openPass);
    findAll(rows,"c").concat(findAll(rows,"n")).forEach(([x,y])=>{ if(d[y][x]<0) iss.push(`coin ${x},${y} walled off`); });
  }
  return iss;
}
function checkVs(L){                                // VS_ARENAS: two starts both race to F
  const rows=L.grid, iss=[]; frame(rows,iss);
  const S=findIn(rows,"S"), P2=findIn(rows,"2"), F=findIn(rows,"F");
  if(!S)iss.push("no S"); if(!P2)iss.push("no 2 (P2)"); if(!F)iss.push("no F");
  if(S&&P2&&F){ if(bfs(rows,[S],openPass)[F[1]][F[0]]<0) iss.push("P1 can't reach F");
    if(bfs(rows,[P2],openPass)[F[1]][F[0]]<0) iss.push("P2 can't reach F"); }
  return iss;
}
function checkKo(L){                                // KO_ARENAS: last standing, ! hazards, F hidden
  const rows=L.grid, iss=[]; frame(rows,iss);
  const S=findAll(rows,"S"), P2=findAll(rows,"2"), F=findAll(rows,"F"), H=findAll(rows,"!");
  if(!S.length)iss.push("no S"); if(!P2.length)iss.push("no 2"); if(F.length!==1)iss.push("need exactly 1 F");
  if(H.length<4)iss.push("need >=4 hazard pits");
  [...S,...P2].forEach(([x,y])=>{ if(rows[y][x]==="!") iss.push(`a start sits on a hazard ${x},${y}`); });
  return iss;
}
function checkCoop(L){                              // COOP_LEVELS: both reach F; plate-swap OR o-sequence opens Q
  const rows=L.grid, iss=[]; frame(rows,iss);
  const S=findIn(rows,"S"), P2=findIn(rows,"2"), F=findIn(rows,"F"), gates=findAll(rows,"Q");
  const plates=findAll(rows,"P"), pads=findAll(rows,"o");
  if(!S)iss.push("no S"); if(!P2)iss.push("no 2"); if(!F)iss.push("no F"); if(!gates.length)iss.push("no Q gate");
  if(plates.length && pads.length) iss.push("mixes plates and sequence pads (pick one mechanic)");
  if(S&&P2&&F&&gates.length){
    const dSc=bfs(rows,[S],shutPass), dFc=bfs(rows,[F],shutPass), dSo=bfs(rows,[S],openPass);
    if(dSc[P2[1]][P2[0]]<0) iss.push("P1 & P2 not on the same start side");
    if(dSc[F[1]][F[0]]>=0) iss.push("gate not mandatory (F reachable while shut)");
    if(dSo[F[1]][F[0]]<0) iss.push("F unreachable even with gate open");
    if(plates.length){                             // swap puzzle: a plate reachable on each side
      if(!plates.some(([x,y])=>dSc[y][x]>=0)) iss.push("no plate reachable on the START side");
      if(!plates.some(([x,y])=>dFc[y][x]>=0)) iss.push("no plate reachable on the FINISH side");
    }
    if(pads.length){ if(pads.length<3) iss.push("need >=3 sequence pads");
      pads.forEach(([x,y])=>{ if(dSc[y][x]<0) iss.push(`pad ${x},${y} unreachable before the gate opens`); }); }
    findAll(rows,"c").concat(findAll(rows,"n")).forEach(([x,y])=>{ if(dSo[y][x]<0) iss.push(`coin ${x},${y} walled off`); });
  }
  return iss;
}

// ---- pull the level arrays straight out of index.html (they're plain literals) ----
function extract(html, name){
  const key = "const "+name+" = [";
  const i = html.indexOf(key); if(i<0) return null;
  let d=0, j=html.indexOf("[", i);
  for(; j<html.length; j++){ if(html[j]==="[")d++; else if(html[j]==="]"){ if(--d===0) break; } }
  return eval(html.slice(html.indexOf("[",i), j+1));   // eslint-disable-line no-eval
}

function run(levels, checker, label){
  let ok=0; console.log(`\n=== ${label} (${levels.length}) ===`);
  levels.forEach((L,i)=>{ let iss; try{ iss=checker(L); }catch(e){ iss=["threw: "+e.message]; }
    const hard = iss.filter(s=>!s.startsWith("⚠"));               // ⚠ = advisory, doesn't fail the run
    if(iss.length){ console.log(`  ${hard.length?"❌":"⚠️ "} [${i}] ${L.emoji||""} ${L.name}`); iss.forEach(s=>console.log("       - "+s)); }
    if(!hard.length) ok++; });
  console.log(`  ${ok}/${levels.length} valid`);
  return ok===levels.length;
}

if(require.main===module){
  const arg = process.argv[2];
  let allOk = true;
  if(arg){                                           // validate a candidate file (auto-detect mode by tiles)
    const levels = require(path.resolve(arg));
    const pick = L => findAll(L.grid,"!").length ? checkKo
      : (L.grid.some(r=>r.includes("Q")) ? checkCoop : (findIn(L.grid,"2") ? checkVs : checkCampaign));
    allOk = run(levels, L=>pick(L)(L), "CANDIDATE "+arg);
  } else {                                            // regression-check everything shipped
    const html = fs.readFileSync(HTML,"utf8");
    allOk &= run(extract(html,"LEVELS"),     checkCampaign, "CAMPAIGN (LEVELS)");
    allOk &= run(extract(html,"VS_ARENAS"),  checkVs,       "VS ARENAS");
    allOk &= run(extract(html,"KO_ARENAS"),  checkKo,       "KNOCKOUT ARENAS");
    allOk &= run(extract(html,"COOP_LEVELS"),checkCoop,     "CO-OP LEVELS");
  }
  console.log("\n"+(allOk ? "🎉 all levels valid" : "⚠️  fix the ❌ above before shipping"));
  process.exit(allOk?0:1);
}
module.exports = { mk, findIn, findAll, bfs, checkCampaign, checkVs, checkKo, checkCoop, extract };
