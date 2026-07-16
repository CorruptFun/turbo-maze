# Vehicle Art Upgrade — staging (generated, NOT yet integrated)

Upgraded dimensional/N64-ish car art for `drawVehicleBody` branches + shared `stdWheels`/`drawRocketBody`. Integrate by replacing each matching branch/function in index.html; verify each render in the showroom; keep only what looks better.

## taxi (car-branch)
_Replaced flat yellow fill with a top-left lit linear gradient over the identical roundRect(-17,-9.5,34,19,6). Kept the checker band loop byte-for-byte (signature). Added: fading top sheen, soft radial specular near top-left, glossy dark cockpit with two clipped diagonal reflection streaks, gradient amber roof light with a highlight, directional rim light (white top/left, black bottom/right), and a faint bottom contact sliver. Uses only existing primitives (roundRect, ellipse, gradients, clip). Verify at 30px: checker + shine should still read as a classic taxi; if the roof light looks too pale, nudge the rl stops darker._

```js
  if(vid==="taxi"){
    // body — top-left lit gradient over the same rounded shape
    const bg=ctx.createLinearGradient(-17,-9.5,17,9.5);
    bg.addColorStop(0,"#ffe6a0"); bg.addColorStop(0.5,"#ffc93c"); bg.addColorStop(1,"#d18f1a");
    ctx.fillStyle=bg; ctx.beginPath(); ctx.roundRect(-17,-9.5,34,19,6); ctx.fill();
    // contact / ground-seat darkening at the very bottom
    ctx.fillStyle="rgba(0,0,0,0.14)"; ctx.beginPath(); ctx.roundRect(-15,7.4,30,2.4,2); ctx.fill();
    // top sheen band fading down
    const sh=ctx.createLinearGradient(0,-9.5,0,-1.5);
    sh.addColorStop(0,"rgba(255,255,255,0.34)"); sh.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sh; ctx.beginPath(); ctx.roundRect(-17,-9.5,34,8,6); ctx.fill();
    // signature checker band (unchanged)
    ctx.fillStyle="#12151f";
    for(let i=0;i<8;i++){ const x=-15+i*4; ctx.fillRect(x, i%2? -9.5:-6.7, 4, 2.8); ctx.fillRect(x, i%2? 6.7:3.9, 4, 2.8); }
    // specular shine dot near top-left
    const sp=ctx.createRadialGradient(-9,-6,0,-9,-6,6.5);
    sp.addColorStop(0,"rgba(255,255,255,0.55)"); sp.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sp; ctx.beginPath(); ctx.ellipse(-9,-6,6.5,3,0,0,TAU); ctx.fill();
    // glossy cockpit: dark glass + diagonal reflections
    ctx.fillStyle="#141a2b"; ctx.beginPath(); ctx.roundRect(-6,-6,12,12,4); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(-6,-6,12,12,4); ctx.clip();
    ctx.fillStyle="rgba(150,180,225,0.5)"; ctx.beginPath(); ctx.moveTo(-6,-2); ctx.lineTo(-2,-6); ctx.lineTo(1,-6); ctx.lineTo(-6,1); ctx.closePath(); ctx.fill();
    ctx.fillStyle="rgba(150,180,225,0.26)"; ctx.beginPath(); ctx.moveTo(-6,4); ctx.lineTo(2,-6); ctx.lineTo(4,-6); ctx.lineTo(-6,6); ctx.closePath(); ctx.fill();
    ctx.restore();
    // amber roof light with a lit top edge
    const rl=ctx.createLinearGradient(0,-2.5,0,2.5); rl.addColorStop(0,"#fff0b0"); rl.addColorStop(1,"#e0a520");
    ctx.fillStyle=rl; ctx.fillRect(-1.5,-2.5,5,5);
    ctx.fillStyle="rgba(255,255,255,0.5)"; ctx.fillRect(-1.5,-2.5,5,1);
    // rim light: bright top+left, dark bottom+right to seat it
    ctx.lineWidth=1;
    ctx.strokeStyle="rgba(255,255,255,0.45)";
    ctx.beginPath(); ctx.moveTo(-10,-9.2); ctx.lineTo(10,-9.2); ctx.moveTo(-16.7,-3); ctx.lineTo(-16.7,3); ctx.stroke();
    ctx.strokeStyle="rgba(0,0,0,0.28)";
    ctx.beginPath(); ctx.moveTo(-10,9.2); ctx.lineTo(10,9.2); ctx.moveTo(16.7,-3); ctx.lineTo(16.7,3); ctx.stroke();
  }
```

## banana (car-branch)
_Same body roundRect(-17,-7,34,14,7). Flat belly band swapped for a clipped vertical brown-to-transparent gradient so the underside rounds off; kept the brown seam and added a light highlight ridge. Brown stem/tip circles kept at the same positions/radii but now radial-shaded so they read as rounded nubs. Added top sheen, radial specular, glossy cockpit with one reflection streak, and directional rim light. Verify the belly gradient darkness at 30px; if the fruit looks muddy, lower the belly end alpha to ~0.32._

```js
  else if(vid==="banana"){
    // body — lit yellow gradient over the same rounded shape
    const bg=ctx.createLinearGradient(-17,-7,17,7);
    bg.addColorStop(0,"#fff2a0"); bg.addColorStop(0.5,"#ffe135"); bg.addColorStop(1,"#d9b41c");
    ctx.fillStyle=bg; ctx.beginPath(); ctx.roundRect(-17,-7,34,14,7); ctx.fill();
    // rounded underside shading (belly) — replaces the flat #e8c92e band
    ctx.save(); ctx.beginPath(); ctx.roundRect(-17,-7,34,14,7); ctx.clip();
    const belly=ctx.createLinearGradient(0,0,0,7);
    belly.addColorStop(0,"rgba(150,110,30,0)"); belly.addColorStop(1,"rgba(150,110,30,0.42)");
    ctx.fillStyle=belly; ctx.fillRect(-17,0,34,7);
    ctx.restore();
    // top sheen fading down
    const sh=ctx.createLinearGradient(0,-7,0,-0.5);
    sh.addColorStop(0,"rgba(255,255,255,0.4)"); sh.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sh; ctx.beginPath(); ctx.roundRect(-16,-7,32,6,6); ctx.fill();
    // ridge seams: original brown seam + a light highlight ridge above it
    ctx.strokeStyle="rgba(120,84,40,0.28)"; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(-13,-2.6); ctx.lineTo(13,-2.6); ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,0.3)"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(-12,-4.2); ctx.lineTo(12,-4.2); ctx.stroke();
    // specular shine near top-left
    const sp=ctx.createRadialGradient(-8,-4.2,0,-8,-4.2,6);
    sp.addColorStop(0,"rgba(255,255,255,0.6)"); sp.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sp; ctx.beginPath(); ctx.ellipse(-8,-4.2,6,2.4,0,0,TAU); ctx.fill();
    // brown stem (left) & tip (right) — now 3D nubs, lit top-left
    for(const [nx,ny,nr] of [[-16.5,0,3],[16.5,0,2.4]]){
      const ng=ctx.createRadialGradient(nx-nr*0.4,ny-nr*0.4,0,nx,ny,nr);
      ng.addColorStop(0,"#8a6440"); ng.addColorStop(1,"#4f3620");
      ctx.fillStyle=ng; ctx.beginPath(); ctx.arc(nx,ny,nr,0,TAU); ctx.fill();
    }
    // glossy cockpit
    ctx.fillStyle="#141a2b"; ctx.beginPath(); ctx.roundRect(-5,-4,10,8,3); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(-5,-4,10,8,3); ctx.clip();
    ctx.fillStyle="rgba(150,180,225,0.5)"; ctx.beginPath(); ctx.moveTo(-5,-1); ctx.lineTo(-1,-4); ctx.lineTo(1.5,-4); ctx.lineTo(-5,1.5); ctx.closePath(); ctx.fill();
    ctx.restore();
    // rim light
    ctx.lineWidth=1;
    ctx.strokeStyle="rgba(255,255,255,0.5)";
    ctx.beginPath(); ctx.moveTo(-9,-6.7); ctx.lineTo(9,-6.7); ctx.stroke();
    ctx.strokeStyle="rgba(0,0,0,0.25)";
    ctx.beginPath(); ctx.moveTo(-9,6.7); ctx.lineTo(9,6.7); ctx.stroke();
  }
```

## tractor (car-branch)
_Preserved the full layout: 4 tires at identical rects, yellow hubs, green body roundRect(-13,-7.5,20,15,3), darker hood, yellow hood stripe, cab window, exhaust knob. Tires now vertical-gradient rubber with a thin top tread highlight; hubs and exhaust are radial-shaded metal; body/hood are lit gradients with sheen; added body specular, glossy cab reflection, bottom contact sliver, and directional rim light. This car has the most gradients (~12/frame) because of the 4 tires — still just createGradient calls, no heavy loops, so per-frame cost is fine. Verify the tractor draws tires-behind-body ordering as before (it does; body is filled after tires)._

```js
  else if(vid==="tractor"){
    // tires — shaded rubber (top lighter) over the same rounded rects
    for(const [tx,ty,tw,th,tr] of [[-16,-14,11,9,3],[-16,5,11,9,3],[8,-9.5,7,5,2],[8,4.5,7,5,2]]){
      const tg=ctx.createLinearGradient(0,ty,0,ty+th);
      tg.addColorStop(0,"#2b2f3d"); tg.addColorStop(1,"#0c0e15");
      ctx.fillStyle=tg; ctx.beginPath(); ctx.roundRect(tx,ty,tw,th,tr); ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.12)"; ctx.beginPath(); ctx.roundRect(tx+1,ty+0.6,tw-2,1.6,tr*0.5); ctx.fill();
    }
    // rear hubs — lit metal
    for(const [hx,hy] of [[-10.5,-9.5],[-10.5,9.5]]){
      const hg=ctx.createRadialGradient(hx-0.8,hy-0.8,0,hx,hy,2.4);
      hg.addColorStop(0,"#ffe98a"); hg.addColorStop(1,"#d19b12");
      ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(hx,hy,2.2,0,TAU); ctx.fill();
    }
    // main body — green gradient, top-left lit
    const bg=ctx.createLinearGradient(-13,-7.5,7,7.5);
    bg.addColorStop(0,"#54c265"); bg.addColorStop(0.5,"#2f8f3e"); bg.addColorStop(1,"#1c5f28");
    ctx.fillStyle=bg; ctx.beginPath(); ctx.roundRect(-13,-7.5,20,15,3); ctx.fill();
    // body top sheen
    const sh=ctx.createLinearGradient(0,-7.5,0,-1);
    sh.addColorStop(0,"rgba(255,255,255,0.28)"); sh.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sh; ctx.beginPath(); ctx.roundRect(-13,-7.5,20,6,3); ctx.fill();
    // hood — darker green gradient with a lit top
    const hg2=ctx.createLinearGradient(3,-5,17,5);
    hg2.addColorStop(0,"#3f9f4d"); hg2.addColorStop(1,"#1e6a2a");
    ctx.fillStyle=hg2; ctx.beginPath(); ctx.roundRect(3,-5,14,10,3); ctx.fill();
    ctx.fillStyle="rgba(255,255,255,0.18)"; ctx.beginPath(); ctx.roundRect(3,-5,14,3,3); ctx.fill();
    // yellow hood stripe with sheen
    const yg=ctx.createLinearGradient(0,-1.2,0,1.2);
    yg.addColorStop(0,"#ffe87a"); yg.addColorStop(1,"#e0a814");
    ctx.fillStyle=yg; ctx.fillRect(3,-1.2,14,2.4);
    // specular on body
    const sp=ctx.createRadialGradient(-8,-4.5,0,-8,-4.5,6);
    sp.addColorStop(0,"rgba(255,255,255,0.5)"); sp.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sp; ctx.beginPath(); ctx.ellipse(-8,-4.5,6,2.6,0,0,TAU); ctx.fill();
    // glossy cab window
    ctx.fillStyle="#141a2b"; ctx.beginPath(); ctx.roundRect(-10,-4.5,9,9,2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(-10,-4.5,9,9,2); ctx.clip();
    ctx.fillStyle="rgba(150,180,225,0.5)"; ctx.beginPath(); ctx.moveTo(-10,-1); ctx.lineTo(-6,-4.5); ctx.lineTo(-3.5,-4.5); ctx.lineTo(-10,2); ctx.closePath(); ctx.fill();
    ctx.restore();
    // exhaust knob — metallic
    const eg=ctx.createRadialGradient(4.3,-7.5,0,5,-6.8,1.9);
    eg.addColorStop(0,"#c3ccde"); eg.addColorStop(1,"#5a6274");
    ctx.fillStyle=eg; ctx.beginPath(); ctx.arc(5,-6.8,1.7,0,TAU); ctx.fill();
    // faint contact darkening along body bottom
    ctx.fillStyle="rgba(0,0,0,0.15)"; ctx.beginPath(); ctx.roundRect(-11,5.6,16,1.8,1.5); ctx.fill();
    // rim light: bright top+left, dark bottom+right
    ctx.lineWidth=1;
    ctx.strokeStyle="rgba(255,255,255,0.4)";
    ctx.beginPath(); ctx.moveTo(-10,-7.3); ctx.lineTo(4,-7.3); ctx.moveTo(-12.7,-4); ctx.lineTo(-12.7,4); ctx.stroke();
    ctx.strokeStyle="rgba(0,0,0,0.28)";
    ctx.beginPath(); ctx.moveTo(-10,7.3); ctx.lineTo(4,7.3); ctx.stroke();
  }
```

## hotdog (car-branch)
_Bun and sausage each become top-left-lit gradients over the SAME silhouettes (roundRect(-16,-9,32,18,9) and roundRect(-19,-4,38,8,4)). Mustard zigzag kept identical geometry but now tri-stroked (dark shadow + yellow base + bright top edge) for a piped 3D look — verify the zigzag still reads as mustard at 30px. Added top sheen, a top-left shine dot, a white rim stroke and a faint dark ground sliver. lineCap is set to round for the mustard then reset to butt so nothing downstream inherits it._

```js
  else if(vid==="hotdog"){
    // bun body — warm top-left-lit gradient (replaces flat #e8b06a fill)
    const g=ctx.createLinearGradient(-14,-9,14,9);
    g.addColorStop(0,"#f3d3a2"); g.addColorStop(0.5,"#e8b06a"); g.addColorStop(1,"#b0824a");
    ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(-16,-9,32,18,9); ctx.fill();
    // top sheen band, fades down
    const sh=ctx.createLinearGradient(0,-9,0,-1);
    sh.addColorStop(0,"rgba(255,246,225,0.5)"); sh.addColorStop(1,"rgba(255,246,225,0)");
    ctx.fillStyle=sh; ctx.beginPath(); ctx.roundRect(-14,-8.5,28,8,7); ctx.fill();
    // lower bun crease shade
    ctx.fillStyle="#c9924c"; ctx.beginPath(); ctx.roundRect(-13,3.6,26,4.4,3); ctx.fill();
    // sausage — its own rounded gradient (replaces flat #c14b32)
    const s=ctx.createLinearGradient(0,-4,0,4);
    s.addColorStop(0,"#d76a4f"); s.addColorStop(0.5,"#c14b32"); s.addColorStop(1,"#8f3822");
    ctx.fillStyle=s; ctx.beginPath(); ctx.roundRect(-19,-4,38,8,4); ctx.fill();
    ctx.fillStyle="rgba(255,200,170,0.35)"; ctx.beginPath(); ctx.roundRect(-17,-3.4,34,2,2); ctx.fill();
    // mustard zigzag: dark cast shadow, base stroke, bright top edge
    ctx.lineCap="round";
    ctx.strokeStyle="rgba(120,80,0,0.35)"; ctx.lineWidth=2.4; ctx.beginPath();
    for(let i=0;i<=6;i++) ctx.lineTo(-15+i*5,(i%2?-2:2)+0.9); ctx.stroke();
    ctx.strokeStyle="#ffd93b"; ctx.lineWidth=2; ctx.beginPath();
    for(let i=0;i<=6;i++) ctx.lineTo(-15+i*5, i%2?-2:2); ctx.stroke();
    ctx.strokeStyle="rgba(255,248,190,0.7)"; ctx.lineWidth=0.8; ctx.beginPath();
    for(let i=0;i<=6;i++) ctx.lineTo(-15+i*5,(i%2?-2:2)-0.7); ctx.stroke();
    ctx.lineCap="butt";
    // specular shine dot, top-left of bun
    const sp=ctx.createRadialGradient(-8,-5,0,-8,-5,7);
    sp.addColorStop(0,"rgba(255,255,255,0.55)"); sp.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sp; ctx.beginPath(); ctx.ellipse(-8,-5,7,4,-0.3,0,TAU); ctx.fill();
    // rim light (top/left bright) + contact seat (bottom dark)
    ctx.strokeStyle="rgba(255,255,255,0.4)"; ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(-15.5,-8.5,31,17,8.5); ctx.stroke();
    ctx.fillStyle="rgba(0,0,0,0.16)"; ctx.beginPath(); ctx.ellipse(0,8.4,12,2,0,0,TAU); ctx.fill();
  }
```

## cart (car-branch)
_Basket, handle post and red grip all keep their exact rects/positions but gain gradients. The mesh is now two-pass: original dark grooves plus a 0.8px-offset white light-catch pass on every wire, so the grid reads as embossed metal instead of flat lines — the extra loop is ~10 short strokes total, negligible. Red grip switched from fillRect to roundRect(1.4) for a rounded handle; verify it still lines up on the post at 30px. Added sheen, shine dot, rim stroke and ground sliver._

```js
  else if(vid==="cart"){
    // metal basket body — cool top-left-lit gradient (replaces flat #b8c1d8)
    const g=ctx.createLinearGradient(-13,-9,16,9);
    g.addColorStop(0,"#e2e6f2"); g.addColorStop(0.5,"#b8c1d8"); g.addColorStop(1,"#828aa6");
    ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(-13,-9,29,18,3); ctx.fill();
    // top sheen
    const sh=ctx.createLinearGradient(0,-9,0,-2);
    sh.addColorStop(0,"rgba(255,255,255,0.45)"); sh.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sh; ctx.beginPath(); ctx.roundRect(-12,-8.5,27,7,2.5); ctx.fill();
    // wire mesh: dark grooves + light-catch highlight = embossed wires
    ctx.strokeStyle="rgba(20,25,40,0.28)"; ctx.lineWidth=1;
    for(let x=-9;x<=13;x+=4.5){ ctx.beginPath(); ctx.moveTo(x,-9); ctx.lineTo(x,9); ctx.stroke(); }
    for(const y of [-4,1]){ ctx.beginPath(); ctx.moveTo(-13,y); ctx.lineTo(16,y); ctx.stroke(); }
    ctx.strokeStyle="rgba(255,255,255,0.3)"; ctx.lineWidth=0.7;
    for(let x=-9;x<=13;x+=4.5){ ctx.beginPath(); ctx.moveTo(x-0.8,-9); ctx.lineTo(x-0.8,9); ctx.stroke(); }
    for(const y of [-4,1]){ ctx.beginPath(); ctx.moveTo(-13,y-0.8); ctx.lineTo(16,y-0.8); ctx.stroke(); }
    // handle post — brushed-metal gradient (replaces flat #8b93ad)
    const p=ctx.createLinearGradient(-18,0,-14,0);
    p.addColorStop(0,"#aab2c8"); p.addColorStop(1,"#6f768e");
    ctx.fillStyle=p; ctx.fillRect(-18,-9,4,18);
    ctx.fillStyle="rgba(255,255,255,0.4)"; ctx.fillRect(-18,-9,1,18);
    // red grip — sheen + shade (replaces flat #e34a4a)
    const r=ctx.createLinearGradient(-18,-3.5,-15,3.5);
    r.addColorStop(0,"#ff7a6a"); r.addColorStop(0.5,"#e34a4a"); r.addColorStop(1,"#b02f2f");
    ctx.fillStyle=r; ctx.beginPath(); ctx.roundRect(-18,-3.5,3,7,1.4); ctx.fill();
    ctx.fillStyle="rgba(255,255,255,0.5)"; ctx.fillRect(-17.8,-3,0.8,3);
    // specular shine dot, top-left
    const sp=ctx.createRadialGradient(-6,-5,0,-6,-5,7);
    sp.addColorStop(0,"rgba(255,255,255,0.5)"); sp.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sp; ctx.beginPath(); ctx.ellipse(-6,-5,7,4,-0.3,0,TAU); ctx.fill();
    // rim light + contact seat
    ctx.strokeStyle="rgba(255,255,255,0.4)"; ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(-12.5,-8.5,28,17,2.5); ctx.stroke();
    ctx.fillStyle="rgba(0,0,0,0.16)"; ctx.beginPath(); ctx.roundRect(-12,7.6,28,1.4,1.4); ctx.fill();
  }
```

## toilet (car-branch)
_Tank, bowl, seat-rim and water all keep their exact ellipse/rect geometry. Tank and bowl become porcelain gradients (bowl is radial, lit from upper-left at (-1,-4)); the water bowl is now the glossy element — radial blue with depth plus a white reflection ellipse per recipe point 6. Seat rim gained an upper-edge white highlight arc; added flush-button highlight, a bowl shine dot, an upper rim-light arc and a lower dark contact arc. Verify the small water reflection doesn't wash out the blue at 30px._

```js
  else if(vid==="toilet"){
    // tank/cistern — porcelain gradient (replaces flat #eef1fa)
    const tg=ctx.createLinearGradient(-18,-8,-7,8);
    tg.addColorStop(0,"#ffffff"); tg.addColorStop(0.55,"#eef1fa"); tg.addColorStop(1,"#c6cddf");
    ctx.fillStyle=tg; ctx.beginPath(); ctx.roundRect(-18,-8,11,16,3); ctx.fill();
    // tank lid highlight band (replaces flat #d5dbeb)
    const lid=ctx.createLinearGradient(0,-8,0,-4);
    lid.addColorStop(0,"rgba(255,255,255,0.85)"); lid.addColorStop(1,"rgba(213,219,235,0.2)");
    ctx.fillStyle=lid; ctx.beginPath(); ctx.roundRect(-18,-8,11,3.8,3); ctx.fill();
    // flush button, with its own tiny highlight
    ctx.fillStyle="#b7c0d8"; ctx.beginPath(); ctx.ellipse(-12.5,-6,1.7,1.1,0,0,TAU); ctx.fill();
    ctx.fillStyle="rgba(255,255,255,0.6)"; ctx.beginPath(); ctx.ellipse(-13,-6.4,0.7,0.5,0,0,TAU); ctx.fill();
    // bowl — radial porcelain, lit from top-left (replaces flat #f4f6ff)
    const bg=ctx.createRadialGradient(-1,-4,1,3,0,15);
    bg.addColorStop(0,"#ffffff"); bg.addColorStop(0.6,"#f0f3fb"); bg.addColorStop(1,"#cdd4e6");
    ctx.fillStyle=bg; ctx.beginPath(); ctx.ellipse(3,0,14,10,0,0,TAU); ctx.fill();
    // seat rim groove (dark) + upper-edge highlight
    ctx.strokeStyle="rgba(150,160,190,0.5)"; ctx.lineWidth=2.5; ctx.beginPath(); ctx.ellipse(3,0,10,7,0,0,TAU); ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,0.6)"; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(3,-0.6,10,6.6,0,Math.PI,TAU); ctx.stroke();
    // water — glossy blue with depth + bright reflection streak (the gloss element)
    const wg=ctx.createRadialGradient(3,-1,0,4,0,6);
    wg.addColorStop(0,"#bfe6ff"); wg.addColorStop(0.5,"#7ec9ff"); wg.addColorStop(1,"#3f8fd6");
    ctx.fillStyle=wg; ctx.beginPath(); ctx.ellipse(4,0,5,3.5,0,0,TAU); ctx.fill();
    ctx.fillStyle="rgba(255,255,255,0.55)"; ctx.beginPath(); ctx.ellipse(2.6,-1,1.6,0.9,-0.3,0,TAU); ctx.fill();
    // specular shine on bowl front-left
    const sp=ctx.createRadialGradient(-3,-5,0,-3,-5,7);
    sp.addColorStop(0,"rgba(255,255,255,0.6)"); sp.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sp; ctx.beginPath(); ctx.ellipse(-3,-5,6,3.5,-0.3,0,TAU); ctx.fill();
    // rim light (upper arc) + contact seat (lower arc)
    ctx.strokeStyle="rgba(255,255,255,0.45)"; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(3,0,14,10,0,Math.PI*1.05,Math.PI*1.95); ctx.stroke();
    ctx.strokeStyle="rgba(0,0,0,0.15)"; ctx.lineWidth=1.4; ctx.beginPath(); ctx.ellipse(3,0.4,13.6,9.6,0,0.15,Math.PI-0.15); ctx.stroke();
  }
```

## ufo (car-branch)
_Re-shaded THE SAUCER. Preserved exact silhouette: outer rim ellipse (0,0,17,13), hull ellipse (0,-1,16,11.5), dome arc(0,-1,7), the 6 rotating rainbow lights (same colors/orbit/game.t*2.5 animation), and the top-left specular dot. Upgrades: rim ellipse is now a vertical gradient (light top -> dark bottom) so the underside reads as shadowed hull thickness/contact; hull is a top-left->bottom-right linear gradient (light steel -> #8892ab base -> dark); added a soft top sheen band; double-offset stroke rim light (white up-left, dark down-right); each running light now has a soft glow ring + hot white core; dome is now glossy glass via a radial gradient (bright TL highlight -> dome color -> dark edge) with a thin dark rim stroke. All canvas 2D primitives already in file. ~4 gradients + cheap arcs; no shadowBlur. drawNumDecal(ufo) still draws over the dome unchanged. Verify: dome should look like a glass bubble and the rainbow lights should still visibly rotate._

```js
  else if(vid==="ufo"){
    // 🛸 metallic saucer, top-left light
    // underside rim (hull thickness + contact shade)
    const rimG = ctx.createLinearGradient(0,-9,0,13);
    rimG.addColorStop(0,"#838ba0"); rimG.addColorStop(1,"#363b49");
    ctx.fillStyle=rimG; ctx.beginPath(); ctx.ellipse(0,0,17,13,0,0,TAU); ctx.fill();
    // main hull
    const hullG = ctx.createLinearGradient(-14,-11,14,10);
    hullG.addColorStop(0,"#c4cade"); hullG.addColorStop(0.5,"#8892ab"); hullG.addColorStop(1,"#565d73");
    ctx.fillStyle=hullG; ctx.beginPath(); ctx.ellipse(0,-1,16,11.5,0,0,TAU); ctx.fill();
    // top sheen band
    const ufSh = ctx.createLinearGradient(0,-12,0,-2);
    ufSh.addColorStop(0,"rgba(255,255,255,0.30)"); ufSh.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=ufSh; ctx.beginPath(); ctx.ellipse(0,-5,12,5,0,0,TAU); ctx.fill();
    // rim light (double-offset stroke: white up-left, dark down-right)
    ctx.save(); ctx.strokeStyle="rgba(255,255,255,0.4)"; ctx.lineWidth=1; ctx.translate(-0.5,-0.6); ctx.beginPath(); ctx.ellipse(0,-1,16,11.5,0,0,TAU); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.strokeStyle="rgba(0,0,0,0.28)"; ctx.lineWidth=1; ctx.translate(0.5,0.7); ctx.beginPath(); ctx.ellipse(0,-1,16,11.5,0,0,TAU); ctx.stroke(); ctx.restore();
    // rotating running lights: soft glow + hot core
    for(let i=0;i<6;i++){
      const a = game.t*2.5 + i*TAU/6;
      const lx=Math.cos(a)*12.5, ly=Math.sin(a)*9;
      ctx.fillStyle = ["#ff6a5e","#ffd76a","#9ae64a","#53e0ff","#ff8fe0","#b98cff"][i];
      ctx.globalAlpha=0.45; ctx.beginPath(); ctx.arc(lx,ly,3.2,0,TAU); ctx.fill();
      ctx.globalAlpha=1;    ctx.beginPath(); ctx.arc(lx,ly,1.8,0,TAU); ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.85)"; ctx.beginPath(); ctx.arc(lx-0.5,ly-0.6,0.7,0,TAU); ctx.fill();
    }
    ctx.globalAlpha=1;
    // glass dome (glossy radial)
    const domeG = ctx.createRadialGradient(-2.5,-4,0.5,0,-1,7.5);
    domeG.addColorStop(0,"#eef1f8"); domeG.addColorStop(0.55,"#c3cce0"); domeG.addColorStop(1,"#7f88a0");
    ctx.fillStyle=domeG; ctx.beginPath(); ctx.arc(0,-1,7,0,TAU); ctx.fill();
    ctx.strokeStyle="rgba(30,36,52,0.35)"; ctx.lineWidth=0.8; ctx.beginPath(); ctx.arc(0,-1,7,0,TAU); ctx.stroke();
    // specular shine dot
    ctx.fillStyle="rgba(255,255,255,0.75)"; ctx.beginPath(); ctx.ellipse(-2.5,-3.5,2.4,1.6,-0.5,0,TAU); ctx.fill();
  }
```

## supra (car-branch)
_Re-shaded 2FAST. Preserved exact silhouette + identity: body roundRect(-16,-9,33,18,8), the two curved twin body lines (same quadratic control points), dark cockpit roundRect(-4,-6,11,12,4), the two wing struts, and THE big rear wing fillRect area (-20.5,-11.5,4,23) drawn LAST/on top as before. Upgrades: body is now an orange TL->BR gradient (#ffb066 -> #ff7a1a base -> #c9530a); top sheen is a fading gradient; added specular streak near top-left; the twin lines now have a dark shadow pass under a bright white pass so they read as raised trim; cockpit is glossy glass (blue-black gradient) with a diagonal white reflection parallelogram; double-offset rim light; faint ground-contact sliver under the body (stdWheels are small so AO helps seat it); the wing is now a vertical gradient slab (light top -> dark bottom) with white top-edge + dark bottom-edge lines, and the struts got a top highlight. Wing rounded by r=1.2 (was a sharp fillRect) — negligible shape change. Verify: orange should read as a rounded shell (not flat), and the wing should look like a lit 3D slab._

```js
  else if(vid==="supra"){
    // the orange legend with the big wing — top-left light
    // ground contact sliver (behind body)
    ctx.fillStyle="rgba(0,0,0,0.18)"; ctx.beginPath(); ctx.ellipse(0,9,14,1.6,0,0,TAU); ctx.fill();
    // body gradient
    const spBody = ctx.createLinearGradient(-16,-9,15,9);
    spBody.addColorStop(0,"#ffb066"); spBody.addColorStop(0.5,"#ff7a1a"); spBody.addColorStop(1,"#c9530a");
    ctx.fillStyle=spBody; ctx.beginPath(); ctx.roundRect(-16,-9,33,18,8); ctx.fill();
    // top sheen (fades down)
    const spSh = ctx.createLinearGradient(0,-9,0,-0.5);
    spSh.addColorStop(0,"rgba(255,255,255,0.34)"); spSh.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=spSh; ctx.beginPath(); ctx.roundRect(-16,-9,33,8,8); ctx.fill();
    // specular shine
    ctx.fillStyle="rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.ellipse(-8,-5.5,4.5,1.8,-0.3,0,TAU); ctx.fill();
    // twin curved lines: dark shadow under, bright over
    ctx.strokeStyle="rgba(110,44,6,0.45)"; ctx.lineWidth=2.4; ctx.beginPath();
    ctx.moveTo(-12,-7.4); ctx.quadraticCurveTo(2,-3.4,14,-6.8);
    ctx.moveTo(-12,9);    ctx.quadraticCurveTo(2,5,14,8.4);
    ctx.stroke();
    ctx.strokeStyle="#eef1f8"; ctx.lineWidth=2.2; ctx.beginPath();
    ctx.moveTo(-12,-8.2); ctx.quadraticCurveTo(2,-4.2,14,-7.6);
    ctx.moveTo(-12,8.2);  ctx.quadraticCurveTo(2,4.2,14,7.6);
    ctx.stroke();
    // cockpit glass
    const spGlass = ctx.createLinearGradient(-4,-6,7,6);
    spGlass.addColorStop(0,"#2b3854"); spGlass.addColorStop(1,"#0d1220");
    ctx.fillStyle=spGlass; ctx.beginPath(); ctx.roundRect(-4,-6,11,12,4); ctx.fill();
    ctx.fillStyle="rgba(150,192,240,0.34)"; ctx.beginPath();
    ctx.moveTo(-1.5,-6); ctx.lineTo(2,-6); ctx.lineTo(-3,6); ctx.lineTo(-4,3.5); ctx.closePath(); ctx.fill();
    // rim light (double-offset stroke)
    ctx.save(); ctx.strokeStyle="rgba(255,255,255,0.4)"; ctx.lineWidth=1; ctx.translate(-0.5,-0.6); ctx.beginPath(); ctx.roundRect(-16,-9,33,18,8); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.strokeStyle="rgba(0,0,0,0.3)"; ctx.lineWidth=1; ctx.translate(0.5,0.7); ctx.beginPath(); ctx.roundRect(-16,-9,33,18,8); ctx.stroke(); ctx.restore();
    // wing struts
    ctx.fillStyle="#8b93ad"; ctx.fillRect(-17,-9,2,3.2); ctx.fillRect(-17,5.8,2,3.2);
    ctx.fillStyle="rgba(255,255,255,0.35)"; ctx.fillRect(-17,-9,2,0.9); ctx.fillRect(-17,5.8,2,0.9);
    // THE wing (on top) — dimensional slab
    const spWing = ctx.createLinearGradient(0,-11.5,0,11.5);
    spWing.addColorStop(0,"#f4f6fb"); spWing.addColorStop(0.5,"#d3d8e4"); spWing.addColorStop(1,"#969db0");
    ctx.fillStyle=spWing; ctx.beginPath(); ctx.roundRect(-20.5,-11.5,4,23,1.2); ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,0.5)"; ctx.lineWidth=0.8;
    ctx.beginPath(); ctx.moveTo(-20.2,-11); ctx.lineTo(-16.8,-11); ctx.stroke();
    ctx.strokeStyle="rgba(0,0,0,0.3)";
    ctx.beginPath(); ctx.moveTo(-20.2,11); ctx.lineTo(-16.8,11); ctx.stroke();
  }
```

## beast (car-branch)
_Re-shaded THE BEAST (ownWheels). Preserved exact silhouette + identity: the four fat tires at their original rects (rear -13,-11.5,10,7 & -13,4.5,10,7; front 8,-10,7,5.5 & 8,4.5,7,5.5), matte body roundRect(-18,-10,36,20,5), cockpit roundRect(-6,-7,12,14,3), the chrome blower roundRect(7,-3.5,7,7,2) with its two intake stacks, and the two left side pipes. Upgrades: tires now have a top rubber highlight + dark bottom band (drawn before body, so the peeking top/bottom slivers look rounded); body is a matte TL->BR gradient (#3b3f4b -> #23262e base -> #101218) — dimensional but still matte (low-alpha sheen 0.14 + faint 0.16 specular, deliberately restrained vs the glossy cars); cockpit is glossy glass with a diagonal reflection streak; double-offset rim light (white up-left, dark down-right); blower is now real chrome (vertical light->dark gradient) with a bright top glint and the intake stacks kept as darker slots; side pipes are chrome vertical gradients. All primitives already in file; tire loop is 4x a few fills (no gradients in the loop) so per-frame cost stays low. Verify: car still reads as matte black (not glossy paint) and the blower/pipes pop as chrome._

```js
  else if(vid==="beast"){
    // matte black muscle, blower through the hood — top-left light
    // fat tires: rounded rubber, top-lit (rear pair bigger)
    for(const [tx,ty,tw,th] of [[-13,-11.5,10,7],[-13,4.5,10,7],[8,-10,7,5.5],[8,4.5,7,5.5]]){
      ctx.fillStyle="#0d0f16"; ctx.beginPath(); ctx.roundRect(tx,ty,tw,th,2); ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.12)"; ctx.beginPath(); ctx.roundRect(tx,ty,tw,2.2,2); ctx.fill();
      ctx.fillStyle="rgba(0,0,0,0.4)"; ctx.beginPath(); ctx.roundRect(tx,ty+th-2,tw,2,2); ctx.fill();
    }
    // body gradient (matte, but dimensional)
    const bsBody = ctx.createLinearGradient(-18,-10,16,10);
    bsBody.addColorStop(0,"#3b3f4b"); bsBody.addColorStop(0.5,"#23262e"); bsBody.addColorStop(1,"#101218");
    ctx.fillStyle=bsBody; ctx.beginPath(); ctx.roundRect(-18,-10,36,20,5); ctx.fill();
    // subtle top sheen (matte)
    const bsSh = ctx.createLinearGradient(0,-10,0,-1);
    bsSh.addColorStop(0,"rgba(255,255,255,0.14)"); bsSh.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=bsSh; ctx.beginPath(); ctx.roundRect(-18,-10,36,8,5); ctx.fill();
    ctx.fillStyle="rgba(255,255,255,0.16)"; ctx.beginPath(); ctx.ellipse(-9,-6,5,1.8,-0.3,0,TAU); ctx.fill();
    // cockpit glass
    const bsGlass = ctx.createLinearGradient(-6,-7,6,7);
    bsGlass.addColorStop(0,"#20242e"); bsGlass.addColorStop(1,"#0a0b10");
    ctx.fillStyle=bsGlass; ctx.beginPath(); ctx.roundRect(-6,-7,12,14,3); ctx.fill();
    ctx.fillStyle="rgba(120,150,190,0.22)"; ctx.beginPath();
    ctx.moveTo(-3.5,-7); ctx.lineTo(0,-7); ctx.lineTo(-5,7); ctx.lineTo(-6,4); ctx.closePath(); ctx.fill();
    // rim light (double-offset stroke)
    ctx.save(); ctx.strokeStyle="rgba(255,255,255,0.28)"; ctx.lineWidth=1; ctx.translate(-0.5,-0.6); ctx.beginPath(); ctx.roundRect(-18,-10,36,20,5); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.strokeStyle="rgba(0,0,0,0.35)"; ctx.lineWidth=1; ctx.translate(0.5,0.7); ctx.beginPath(); ctx.roundRect(-18,-10,36,20,5); ctx.stroke(); ctx.restore();
    // chrome blower through the hood
    const bsBlow = ctx.createLinearGradient(0,-3.5,0,3.5);
    bsBlow.addColorStop(0,"#eef2f8"); bsBlow.addColorStop(0.5,"#aab4c8"); bsBlow.addColorStop(1,"#5e6070");
    ctx.fillStyle=bsBlow; ctx.beginPath(); ctx.roundRect(7,-3.5,7,7,2); ctx.fill();
    ctx.fillStyle="#565f74"; ctx.fillRect(8.4,-3.5,1.6,7); ctx.fillRect(11.4,-3.5,1.6,7);   // intake stacks
    ctx.fillStyle="rgba(255,255,255,0.5)"; ctx.fillRect(7,-3.5,7,1.1);                      // chrome top glint
    // chrome side pipes
    for(const py of [-6.5,3.1]){
      const bsPipe=ctx.createLinearGradient(0,py,0,py+3.4);
      bsPipe.addColorStop(0,"#d7dce6"); bsPipe.addColorStop(0.5,"#8b93ad"); bsPipe.addColorStop(1,"#494f5e");
      ctx.fillStyle=bsPipe; ctx.fillRect(-20,py,2.4,3.4);
    }
  }
```

## goat (car-branch)
_Goat previously just called flat drawRocketBody + emoji. I inlined the SAME rocket silhouette (body roundRect(-17,-9.5,34,19,7), cockpit roundRect(-6,-6.5,12,13,4), glass slit at x3, rear nozzle fillRect(-19,-8,4,16)) so I could shade it without touching the shared drawRocketBody (left for the starter-car batch). Gold body gradient light#fff1c2->#ffd76a->#d8a636, cream stripe, glossy cockpit reflection, top-left specular, rim light + AO. Emoji still at (11,0). Verify: silhouette/size unchanged vs old goat; the goat emoji still reads on the gold body.
_

```js
  else if(vid==="goat"){
    // 🐐 GOAT — golden rocket, dimensional re-shade (keeps drawRocketBody silhouette inline)
    const g=ctx.createLinearGradient(-14,-9,14,9);
    g.addColorStop(0,"#fff1c2"); g.addColorStop(0.5,"#ffd76a"); g.addColorStop(1,"#d8a636");
    ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(-17,-9.5,34,19,7); ctx.fill();
    // top sheen fading down
    const sh=ctx.createLinearGradient(0,-9.5,0,-1);
    sh.addColorStop(0,"rgba(255,255,255,0.5)"); sh.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sh; ctx.beginPath(); ctx.roundRect(-16,-9,32,8,6); ctx.fill();
    // cream centre stripe with soft shade
    const st=ctx.createLinearGradient(0,-2.4,0,2.4);
    st.addColorStop(0,"#fffdf3"); st.addColorStop(1,"#e9d9a8");
    ctx.fillStyle=st; ctx.fillRect(-17,-2.4,34,4.8);
    // rear nozzle
    ctx.fillStyle="#20283c"; ctx.fillRect(-19,-8,4,16);
    ctx.fillStyle="rgba(255,255,255,0.12)"; ctx.fillRect(-19,-8,4,3);
    // glossy cockpit + diagonal glass reflection
    ctx.fillStyle="#161d2c"; ctx.beginPath(); ctx.roundRect(-6,-6.5,12,13,4); ctx.fill();
    const gl=ctx.createLinearGradient(-5,-6,5,6);
    gl.addColorStop(0,"rgba(150,205,255,0.55)"); gl.addColorStop(0.5,"rgba(150,205,255,0.06)"); gl.addColorStop(1,"rgba(150,205,255,0)");
    ctx.fillStyle=gl; ctx.beginPath(); ctx.roundRect(-5.2,-5.8,10.4,11.6,3.4); ctx.fill();
    ctx.fillStyle="rgba(200,230,255,0.5)"; ctx.beginPath(); ctx.roundRect(3,-5.5,3,11,1.5); ctx.fill();
    // specular shine dot (top-left)
    ctx.save(); const sp=ctx.createRadialGradient(-9,-6,0,-9,-6,7);
    sp.addColorStop(0,"rgba(255,255,255,0.6)"); sp.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sp; ctx.beginPath(); ctx.ellipse(-9,-6,7,4,-0.3,0,TAU); ctx.fill(); ctx.restore();
    // rim light (top/left bright) + seat (bottom/right dark)
    ctx.lineWidth=1; ctx.strokeStyle="rgba(255,255,255,0.4)";
    ctx.beginPath(); ctx.moveTo(-13,-9); ctx.lineTo(13,-9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-16.5,-6); ctx.lineTo(-16.5,5); ctx.stroke();
    ctx.strokeStyle="rgba(0,0,0,0.32)";
    ctx.beginPath(); ctx.moveTo(-13,9); ctx.lineTo(14,9); ctx.stroke();
    // ground contact AO sliver
    ctx.fillStyle="rgba(0,0,0,0.14)"; ctx.beginPath(); ctx.roundRect(-14,8,28,1.6,1.5); ctx.fill();
    // goat accent
    ctx.fillStyle="#3a2a10"; ctx.font="10px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("🐐", 11, 0);
  }
```

## blaze (car-branch)
_Same draw order preserved (body, sheen, orange band, yellow core, flame tip, cockpit, pipes) so layering matches. Red body now gradient #f4604d->#d93b2b->#9a2317; flame band and yellow core are vertical gradients so they read as glowing heat; flame tip gets a hot inner core; pipes get a chrome top highlight; added top-left specular, rim light + bottom AO. Verify: flame band/core still centered, tip still pokes past the nose, cockpit box unchanged (-6,-6,12,12)._

```js
  else if(vid==="blaze"){                                    // 🏁 World 1 reward — flame hot rod
    const g=ctx.createLinearGradient(-14,-9,14,9);
    g.addColorStop(0,"#f4604d"); g.addColorStop(0.5,"#d93b2b"); g.addColorStop(1,"#9a2317");
    ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(-17,-9.5,34,19,7); ctx.fill();
    // top sheen
    const sh=ctx.createLinearGradient(0,-9.5,0,-1.5);
    sh.addColorStop(0,"rgba(255,255,255,0.28)"); sh.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sh; ctx.beginPath(); ctx.roundRect(-16,-9,32,8,6); ctx.fill();
    // orange flame band (glowing gradient)
    const fb=ctx.createLinearGradient(0,-3.4,0,3.4);
    fb.addColorStop(0,"#ffb04a"); fb.addColorStop(0.5,"#ff8a1a"); fb.addColorStop(1,"#e5680a");
    ctx.fillStyle=fb; ctx.fillRect(-17,-3.4,30,6.8);
    // yellow core
    const yc=ctx.createLinearGradient(0,-1.6,0,1.6);
    yc.addColorStop(0,"#fff0a0"); yc.addColorStop(1,"#ffcf2e");
    ctx.fillStyle=yc; ctx.fillRect(-17,-1.6,26,3.2);
    // flame tip with hot inner core
    ctx.fillStyle="#ffd23b"; ctx.beginPath(); ctx.moveTo(13,-3.6); ctx.lineTo(19,0); ctx.lineTo(13,3.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle="rgba(255,244,170,0.85)"; ctx.beginPath(); ctx.moveTo(13,-2.2); ctx.lineTo(17,0); ctx.lineTo(13,2.2); ctx.closePath(); ctx.fill();
    // glossy cockpit + diagonal reflection
    ctx.fillStyle="#141a28"; ctx.beginPath(); ctx.roundRect(-6,-6,12,12,4); ctx.fill();
    const gl=ctx.createLinearGradient(-5,-5.5,5,5.5);
    gl.addColorStop(0,"rgba(150,205,255,0.5)"); gl.addColorStop(0.5,"rgba(150,205,255,0.05)"); gl.addColorStop(1,"rgba(150,205,255,0)");
    ctx.fillStyle=gl; ctx.beginPath(); ctx.roundRect(-5.4,-5.4,10.8,10.8,3.4); ctx.fill();
    // twin pipes with chrome highlight
    ctx.fillStyle="#9aa3b8"; ctx.fillRect(-19,-6,2.4,3.2); ctx.fillRect(-19,2.8,2.4,3.2);
    ctx.fillStyle="rgba(255,255,255,0.4)"; ctx.fillRect(-19,-6,2.4,1); ctx.fillRect(-19,2.8,2.4,1);
    // specular shine dot (top-left)
    ctx.save(); const sp=ctx.createRadialGradient(-9,-6,0,-9,-6,7);
    sp.addColorStop(0,"rgba(255,255,255,0.45)"); sp.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sp; ctx.beginPath(); ctx.ellipse(-9,-6,7,4,-0.3,0,TAU); ctx.fill(); ctx.restore();
    // rim light + seat
    ctx.lineWidth=1; ctx.strokeStyle="rgba(255,255,255,0.4)";
    ctx.beginPath(); ctx.moveTo(-13,-9); ctx.lineTo(13,-9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-16.5,-6); ctx.lineTo(-16.5,5); ctx.stroke();
    ctx.strokeStyle="rgba(0,0,0,0.32)";
    ctx.beginPath(); ctx.moveTo(-13,9); ctx.lineTo(13,9); ctx.stroke();
    ctx.fillStyle="rgba(0,0,0,0.14)"; ctx.beginPath(); ctx.roundRect(-14,8,28,1.6,1.5); ctx.fill();
  }
```

## frost (car-branch)
_Kept original draw order (body, sheen, shard1, shard2, skirt, cockpit, glint). Icy body now gradient #bfe9ff->#4aa8d8->#2a6f95; strong frosty top sheen retained; each ice shard gets a small darker facet triangle so it reads as 3D crystal; skirt is a vertical gradient; cockpit tint deepened with a diagonal cyan reflection; added top-left specular + rim/AO. The glint slit at (-3,-4.5,3,9) is preserved. Verify: both shards sit in the same spots, skirt still along the lower-left, cockpit box unchanged._

```js
  else if(vid==="frost"){                                    // 🧊 World 2 reward — icy racer
    const g=ctx.createLinearGradient(-14,-9,14,9);
    g.addColorStop(0,"#bfe9ff"); g.addColorStop(0.45,"#4aa8d8"); g.addColorStop(1,"#2a6f95");
    ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(-17,-9.5,34,19,8); ctx.fill();
    // frosty sheen
    const sh=ctx.createLinearGradient(0,-9.5,0,-1);
    sh.addColorStop(0,"rgba(255,255,255,0.55)"); sh.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sh; ctx.beginPath(); ctx.roundRect(-16,-9,32,8,7); ctx.fill();
    // ice shards with facet shade (drawn before skirt, as original)
    ctx.fillStyle="#eaf7ff"; ctx.beginPath(); ctx.moveTo(8,-8); ctx.lineTo(12,-3); ctx.lineTo(9,-1); ctx.lineTo(5,-4); ctx.closePath(); ctx.fill();
    ctx.fillStyle="rgba(120,180,220,0.5)"; ctx.beginPath(); ctx.moveTo(9,-1); ctx.lineTo(12,-3); ctx.lineTo(10.5,-2); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#eaf7ff"; ctx.beginPath(); ctx.moveTo(11,2); ctx.lineTo(15,6); ctx.lineTo(11,8); ctx.lineTo(8,5); ctx.closePath(); ctx.fill();
    ctx.fillStyle="rgba(120,180,220,0.5)"; ctx.beginPath(); ctx.moveTo(11,8); ctx.lineTo(15,6); ctx.lineTo(13,7); ctx.closePath(); ctx.fill();
    // frost skirt (bottom band)
    const sk=ctx.createLinearGradient(0,3.8,0,6.8);
    sk.addColorStop(0,"#eaf7ff"); sk.addColorStop(1,"#c2e2f2");
    ctx.fillStyle=sk; ctx.beginPath(); ctx.roundRect(-16,3.8,26,3,1.5); ctx.fill();
    // glossy tinted cockpit + diagonal reflection
    ctx.fillStyle="#0e2735"; ctx.beginPath(); ctx.roundRect(-6,-6,12,12,4); ctx.fill();
    const gl=ctx.createLinearGradient(-5,-5.5,5,5.5);
    gl.addColorStop(0,"rgba(190,233,255,0.6)"); gl.addColorStop(0.5,"rgba(190,233,255,0.08)"); gl.addColorStop(1,"rgba(190,233,255,0)");
    ctx.fillStyle=gl; ctx.beginPath(); ctx.roundRect(-5.4,-5.4,10.8,10.8,3.4); ctx.fill();
    ctx.fillStyle="#bfe9ff"; ctx.beginPath(); ctx.roundRect(-3,-4.5,3,9,1.5); ctx.fill();     // icy glint
    // specular shine dot (top-left)
    ctx.save(); const sp=ctx.createRadialGradient(-9,-6,0,-9,-6,7);
    sp.addColorStop(0,"rgba(255,255,255,0.6)"); sp.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sp; ctx.beginPath(); ctx.ellipse(-9,-6,7,4,-0.3,0,TAU); ctx.fill(); ctx.restore();
    // rim light + seat
    ctx.lineWidth=1; ctx.strokeStyle="rgba(255,255,255,0.5)";
    ctx.beginPath(); ctx.moveTo(-13,-9); ctx.lineTo(13,-9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-16.5,-6); ctx.lineTo(-16.5,5); ctx.stroke();
    ctx.strokeStyle="rgba(0,0,0,0.26)";
    ctx.beginPath(); ctx.moveTo(-13,9); ctx.lineTo(13,9); ctx.stroke();
    ctx.fillStyle="rgba(0,0,0,0.12)"; ctx.beginPath(); ctx.roundRect(-14,8,28,1.6,1.5); ctx.fill();
  }
```

## glitch (car-branch)
_Re-shaded the neon glitch racer with the shared lighting recipe while keeping its identity (purple body, #c56cff neon outline/centerline, magenta core, cyan glitch blocks, glowing cockpit slit, and the signature shadowBlur glow halo — the one allowed cheap shadow). Added: top-left→bottom-right body gradient over the SAME roundRect, a fading top sheen, a soft specular dot top-left, a top+left white rim / bottom+right dark rim to seat it, a diagonal reflection streak on the glossy cockpit, lit top edges on the neon core + glitch blocks + slit, and a faint AO sliver at the bottom. Verify at ~30px that the neon centerline still reads and the glow halo still shows around the silhouette._

```js
  else if(vid==="glitch"){                                   // 🌀 World 3 reward — neon glitch racer
    ctx.save(); ctx.shadowColor="#c56cff"; ctx.shadowBlur=8;                       // neon glow halo (identity)
    ctx.fillStyle="#2a1c46"; ctx.beginPath(); ctx.roundRect(-17,-9.5,34,19,7); ctx.fill();
    ctx.restore();
    let g=ctx.createLinearGradient(-17,-9.5,17,9.5);                              // dimensional body
    g.addColorStop(0,"#4a3576"); g.addColorStop(0.5,"#2a1c46"); g.addColorStop(1,"#160e28");
    ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(-17,-9.5,34,19,7); ctx.fill();
    let sh=ctx.createLinearGradient(0,-9.5,0,-1);                                 // top sheen fading down
    sh.addColorStop(0,"rgba(150,110,220,0.5)"); sh.addColorStop(1,"rgba(150,110,220,0)");
    ctx.fillStyle=sh; ctx.beginPath(); ctx.roundRect(-16,-9,32,8,6); ctx.fill();
    let sp=ctx.createRadialGradient(-9,-6,0,-9,-6,7);                             // specular shine dot
    sp.addColorStop(0,"rgba(255,255,255,0.5)"); sp.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sp; ctx.beginPath(); ctx.ellipse(-9,-6,7,4,-0.3,0,TAU); ctx.fill();
    ctx.fillStyle="rgba(0,0,0,0.22)"; ctx.beginPath(); ctx.roundRect(-15,7.6,30,1.8,1); ctx.fill();  // ground seat
    ctx.strokeStyle="#c56cff"; ctx.lineWidth=1.8; ctx.beginPath(); ctx.roundRect(-16,-8.7,32,17.4,6); ctx.stroke();   // neon outline
    let ne=ctx.createLinearGradient(0,-1.4,0,1.4);                                // neon centerline
    ne.addColorStop(0,"#e0a0ff"); ne.addColorStop(0.5,"#c56cff"); ne.addColorStop(1,"#8a3fd0");
    ctx.fillStyle=ne; ctx.fillRect(-15,-1.4,28,2.8);
    ctx.fillStyle="#ff5db1"; ctx.fillRect(-15,-1,20,2);                           // magenta core
    ctx.fillStyle="rgba(255,190,230,0.7)"; ctx.fillRect(-15,-1,20,0.7);           // core hi-light
    ctx.fillStyle="rgba(126,201,255,0.7)"; ctx.fillRect(-10,-7,5,2); ctx.fillRect(2,5.2,6,2);   // glitch blocks
    ctx.fillStyle="rgba(200,240,255,0.85)"; ctx.fillRect(-10,-7,5,0.7); ctx.fillRect(2,5.2,6,0.7);  // lit top edge
    ctx.fillStyle="#0e0a1a"; ctx.beginPath(); ctx.roundRect(-6,-6,12,12,4); ctx.fill();          // glossy cockpit
    ctx.fillStyle="rgba(140,90,200,0.55)"; ctx.beginPath(); ctx.moveTo(-6,-2); ctx.lineTo(-1,-6); ctx.lineTo(2,-6); ctx.lineTo(-6,1); ctx.closePath(); ctx.fill();  // reflection streak
    ctx.fillStyle="#c56cff"; ctx.beginPath(); ctx.roundRect(-3,-4.5,3,9,1.5); ctx.fill();        // glowing slit
    ctx.fillStyle="rgba(230,200,255,0.85)"; ctx.fillRect(-3,-4.5,1.2,9);                          // slit hi-light
    ctx.lineWidth=1; ctx.strokeStyle="rgba(255,255,255,0.4)";                     // rim light: top+left
    ctx.beginPath(); ctx.moveTo(-10,-9.5); ctx.lineTo(10,-9.5); ctx.moveTo(-17,-2.5); ctx.lineTo(-17,2.5); ctx.stroke();
    ctx.strokeStyle="rgba(0,0,0,0.32)";                                           // rim shade: bottom+right
    ctx.beginPath(); ctx.moveTo(-10,9.5); ctx.lineTo(10,9.5); ctx.moveTo(17,-2.5); ctx.lineTo(17,2.5); ctx.stroke();
  }
```

## monster (car-branch)
_Re-shaded the CRUSHER monster truck (own wheels). Kept identity: 4 fat tires at the same rects, gold hub bolts, raised orange body, steel band, dark cab window, and the front steel bull-bar scoop. Each tire now uses a top-left-lit radial gradient with darkened tread grooves + a subtle top tread highlight so the rubber reads as round volume; bolts get a tiny shine dot. Body: top-left→bottom-right orange gradient over the SAME roundRect, fading top sheen, soft specular (nudged to x=-8 so the cab window drawn later doesn't cover it), shaded steel band, glossy cab with a reflection streak, gradient + top glint on the scoop, and top+left / bottom rim strokes. This is the heaviest car (~9 gradients) but only the player + rival render in-game, so per-frame cost is fine. Verify the four tires still read as fat and the orange body still pops at ~30px._

```js
  else if(vid==="monster"){                                  // 🏭 World 4 reward — CRUSHER monster truck (ownWheels)
    const tires=[[-15,-13,12,9],[-15,4,12,9],[6,-12,10,8],[6,4,10,8]];
    for(const [tx,ty,tw,th] of tires){                                            // dimensional rubber
      let tg=ctx.createRadialGradient(tx+tw*0.35,ty+th*0.3,1,tx+tw*0.5,ty+th*0.5,tw*0.95);
      tg.addColorStop(0,"#3a3f4c"); tg.addColorStop(0.6,"#1c1f27"); tg.addColorStop(1,"#0c0e13");
      ctx.fillStyle=tg; ctx.beginPath(); ctx.roundRect(tx,ty,tw,th,3); ctx.fill();
    }
    ctx.strokeStyle="rgba(8,10,14,0.8)"; ctx.lineWidth=1.4;                        // tread grooves
    for(const [tx,ty,tw,th] of tires)
      for(let k=1;k<3;k++){ ctx.beginPath(); ctx.moveTo(tx+tw*k/3,ty); ctx.lineTo(tx+tw*k/3,ty+th); ctx.stroke(); }
    ctx.strokeStyle="rgba(120,132,155,0.35)"; ctx.lineWidth=1;                     // tread top highlight
    for(const [tx,ty,tw,th] of tires){ ctx.beginPath(); ctx.moveTo(tx+1.5,ty+1); ctx.lineTo(tx+tw-1.5,ty+1); ctx.stroke(); }
    ctx.fillStyle="#e8a930"; for(const [wx,wy] of [[-9,-8.5],[-9,8.5],[11,-8],[11,8]]){ ctx.beginPath(); ctx.arc(wx,wy,2,0,TAU); ctx.fill(); }  // hubs
    ctx.fillStyle="#fff0c0"; for(const [wx,wy] of [[-9,-8.5],[-9,8.5],[11,-8],[11,8]]){ ctx.beginPath(); ctx.arc(wx-0.6,wy-0.6,0.8,0,TAU); ctx.fill(); }  // bolt shine
    let g=ctx.createLinearGradient(-13,-8,15,8);                                  // raised orange body
    g.addColorStop(0,"#f0954a"); g.addColorStop(0.5,"#c96a2a"); g.addColorStop(1,"#8f4718");
    ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(-13,-8,28,16,4); ctx.fill();
    let sh=ctx.createLinearGradient(0,-8,0,0);                                    // top sheen
    sh.addColorStop(0,"rgba(255,235,200,0.5)"); sh.addColorStop(1,"rgba(255,235,200,0)");
    ctx.fillStyle=sh; ctx.beginPath(); ctx.roundRect(-12,-7.5,26,7,3); ctx.fill();
    let sp=ctx.createRadialGradient(-8,-5,0,-8,-5,6);                             // specular
    sp.addColorStop(0,"rgba(255,255,255,0.55)"); sp.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sp; ctx.beginPath(); ctx.ellipse(-8,-5,6,3.4,-0.3,0,TAU); ctx.fill();
    let bg=ctx.createLinearGradient(0,-1.6,0,1.6);                                // steel band
    bg.addColorStop(0,"#b89a68"); bg.addColorStop(0.5,"#8b6a3a"); bg.addColorStop(1,"#5e4826");
    ctx.fillStyle=bg; ctx.fillRect(-13,-1.6,28,3.2);
    ctx.fillStyle="#141a26"; ctx.beginPath(); ctx.roundRect(-6,-6,11,12,3); ctx.fill();          // glossy cab window
    ctx.fillStyle="rgba(120,150,190,0.5)"; ctx.beginPath(); ctx.moveTo(-6,-1); ctx.lineTo(0,-6); ctx.lineTo(3,-6); ctx.lineTo(-6,2); ctx.closePath(); ctx.fill();  // reflection
    let scg=ctx.createLinearGradient(14,0,18,0);                                  // steel bull-bar scoop
    scg.addColorStop(0,"#d8e0ee"); scg.addColorStop(1,"#7c8496");
    ctx.fillStyle=scg; ctx.beginPath(); ctx.roundRect(14,-9,4,18,2); ctx.fill();
    ctx.fillStyle="#6d7690"; ctx.fillRect(15,-7,2,3); ctx.fillRect(15,4,2,3);
    ctx.fillStyle="rgba(255,255,255,0.5)"; ctx.fillRect(14,-9,4,0.8);              // scoop top glint
    ctx.strokeStyle="rgba(255,255,255,0.4)"; ctx.lineWidth=1;                      // rim light: top+left
    ctx.beginPath(); ctx.moveTo(-9,-8); ctx.lineTo(11,-8); ctx.moveTo(-13,-4); ctx.lineTo(-13,4); ctx.stroke();
    ctx.strokeStyle="rgba(0,0,0,0.3)";                                            // rim shade: bottom
    ctx.beginPath(); ctx.moveTo(-9,8); ctx.lineTo(11,8); ctx.stroke();
  }
```

## wave (car-branch)
_Re-shaded the cresting-wave racer. Kept identity: teal body, the white foam wave sweep across the lower body (same quadraticCurve path), the crest hi-light stroke, the foam curl at the nose, the two water droplets, glossy cockpit + glint, the foam skirt, and the teal side intakes. Added: top-left→bottom-right teal body gradient over the SAME roundRect, fading top sheen, a vertical gradient on the foam sweep so it has volume, an inner-shade wedge on the foam curl, tiny white speculars on the droplets, a soft body specular, a diagonal reflection streak on the deep-teal cockpit, and top+left white / bottom+right dark rim strokes. Verify the wave crest and foam curl still read at ~30px and the teal→foam contrast holds._

```js
  else if(vid==="wave"){                                     // 🌊 World 5 reward — cresting-wave racer
    let g=ctx.createLinearGradient(-17,-9.5,17,9.5);                              // dimensional teal body
    g.addColorStop(0,"#5cd6ea"); g.addColorStop(0.5,"#12a6c4"); g.addColorStop(1,"#08657c");
    ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(-17,-9.5,34,19,8); ctx.fill();
    let sh=ctx.createLinearGradient(0,-9.5,0,-1);                                 // top sheen
    sh.addColorStop(0,"rgba(230,252,255,0.55)"); sh.addColorStop(1,"rgba(230,252,255,0)");
    ctx.fillStyle=sh; ctx.beginPath(); ctx.roundRect(-16,-9,32,7.5,7); ctx.fill();
    let wg=ctx.createLinearGradient(0,-2,0,8);                                    // foam wave sweep
    wg.addColorStop(0,"#bff4ff"); wg.addColorStop(1,"#6fd8ee");
    ctx.fillStyle=wg;
    ctx.beginPath();
    ctx.moveTo(-17,1); ctx.quadraticCurveTo(-8,-4,0,0); ctx.quadraticCurveTo(8,4,17,-1);
    ctx.lineTo(17,5); ctx.quadraticCurveTo(8,9,0,5); ctx.quadraticCurveTo(-8,1,-17,6);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle="#eafcff"; ctx.lineWidth=1.6;                                 // crest hi-light
    ctx.beginPath(); ctx.moveTo(-17,1); ctx.quadraticCurveTo(-8,-4,0,0); ctx.quadraticCurveTo(8,4,17,-1); ctx.stroke();
    ctx.fillStyle="#eafcff";                                                      // foam curl
    ctx.beginPath(); ctx.moveTo(12,-4); ctx.quadraticCurveTo(19,-6,18,0); ctx.quadraticCurveTo(17,3,13,2); ctx.quadraticCurveTo(15,-1,12,-4); ctx.closePath(); ctx.fill();
    ctx.fillStyle="rgba(120,200,225,0.5)";                                        // curl inner shade
    ctx.beginPath(); ctx.moveTo(13,2); ctx.quadraticCurveTo(15,-1,12,-4); ctx.quadraticCurveTo(15.6,-1,15,1.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#bff4ff";                                                      // droplets
    for(const [dx,dy,s] of [[-11,-6,2],[-3,7,1.6]]){
      ctx.beginPath(); ctx.moveTo(dx,dy-s*2.2);
      ctx.quadraticCurveTo(dx+s,dy-s*0.3,dx+s,dy); ctx.arc(dx,dy,s,0,Math.PI);
      ctx.quadraticCurveTo(dx-s,dy-s*0.3,dx,dy-s*2.2); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle="rgba(255,255,255,0.8)";                                        // droplet speculars
    for(const [dx,dy,s] of [[-11,-6,2],[-3,7,1.6]]){ ctx.beginPath(); ctx.arc(dx-s*0.3,dy-s*0.3,s*0.35,0,TAU); ctx.fill(); }
    let sp=ctx.createRadialGradient(-9,-6,0,-9,-6,7);                             // body specular
    sp.addColorStop(0,"rgba(255,255,255,0.5)"); sp.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sp; ctx.beginPath(); ctx.ellipse(-9,-6,6.5,3.6,-0.3,0,TAU); ctx.fill();
    ctx.fillStyle="#08323b"; ctx.beginPath(); ctx.roundRect(-6,-6,12,12,4); ctx.fill();          // glossy cockpit
    ctx.fillStyle="rgba(130,220,255,0.5)"; ctx.beginPath(); ctx.moveTo(-6,-1); ctx.lineTo(0,-6); ctx.lineTo(3,-6); ctx.lineTo(-6,2); ctx.closePath(); ctx.fill();  // reflection
    ctx.fillStyle="#7fe4ff"; ctx.beginPath(); ctx.roundRect(-3,-4.5,3,9,1.5); ctx.fill();        // glint
    ctx.fillStyle="#eafcff"; ctx.beginPath(); ctx.roundRect(-17,4,10,3,1.5); ctx.fill();         // foam skirt
    ctx.fillStyle="#25d4e0"; ctx.fillRect(-19,-6,2.4,3.2); ctx.fillRect(-19,2.8,2.4,3.2);        // side intakes
    ctx.strokeStyle="rgba(255,255,255,0.42)"; ctx.lineWidth=1;                     // rim light: top+left
    ctx.beginPath(); ctx.moveTo(-10,-9.5); ctx.lineTo(10,-9.5); ctx.moveTo(-17,-2.5); ctx.lineTo(-17,2.5); ctx.stroke();
    ctx.strokeStyle="rgba(0,0,0,0.28)";                                           // rim shade: bottom+right
    ctx.beginPath(); ctx.moveTo(-10,9.5); ctx.lineTo(10,9.5); ctx.moveTo(17,-2.5); ctx.lineTo(17,2.5); ctx.stroke();
  }
```

## drawRocketBody (shared-fn)
_Signature unchanged (bodyCol, stripeCol). Silhouette (roundRect -17,-9.5,34,19,7), stripe band, cockpit, rear thruster block, and the light front-glass strip are all preserved. Dimensional shading uses an rgba white->transparent->black overlay gradient over the clipped body so it works with ANY bodyCol string (no hex parsing needed). Rim light is done as ONE gradient stroke (white top-left -> black bottom-right) — cheap and seats the car. ~5 gradients per call. Uses only existing primitives (roundRect, clip, createLinearGradient, createRadialGradient, ellipse, TAU). Verify at 30px that the cockpit reflection streak and stripe gloss don't over-brighten a light-colored body; if a very pale bodyCol looks washed, nudge the sheen 0.34 down. Note it now clips (save/restore balanced) — no state leaks._

```js
function drawRocketBody(bodyCol, stripeCol){
  // rear thruster block (behind body)
  let bg = ctx.createLinearGradient(-19,-8,-15,8);
  bg.addColorStop(0,"#2c3651"); bg.addColorStop(1,"#141a29");
  ctx.fillStyle = bg; ctx.fillRect(-19,-8,4,16);

  // body: base color + top-left light -> bottom-right shade, clipped to silhouette
  ctx.save();
  ctx.beginPath(); ctx.roundRect(-17,-9.5,34,19,7); ctx.clip();
  ctx.fillStyle = bodyCol; ctx.fillRect(-18,-10,36,20);
  let g = ctx.createLinearGradient(-14,-9.5,15,9.5);
  g.addColorStop(0,"rgba(255,255,255,0.30)");
  g.addColorStop(0.45,"rgba(255,255,255,0.03)");
  g.addColorStop(0.60,"rgba(0,0,0,0.05)");
  g.addColorStop(1,"rgba(0,0,0,0.36)");
  ctx.fillStyle = g; ctx.fillRect(-18,-10,36,20);
  // top sheen band fading down
  let sh = ctx.createLinearGradient(0,-9.5,0,-1);
  sh.addColorStop(0,"rgba(255,255,255,0.34)");
  sh.addColorStop(1,"rgba(255,255,255,0)");
  ctx.fillStyle = sh; ctx.fillRect(-17,-9.5,34,8.5);
  // racing stripe with gloss (kept accent)
  if(stripeCol){
    ctx.fillStyle = stripeCol; ctx.fillRect(-17,-2.4,34,4.8);
    let stg = ctx.createLinearGradient(0,-2.4,0,2.4);
    stg.addColorStop(0,"rgba(255,255,255,0.30)");
    stg.addColorStop(0.5,"rgba(255,255,255,0)");
    stg.addColorStop(1,"rgba(0,0,0,0.22)");
    ctx.fillStyle = stg; ctx.fillRect(-17,-2.4,34,4.8);
  }
  // specular shine dot (top-left)
  let sp = ctx.createRadialGradient(-9,-6,0,-9,-6,9);
  sp.addColorStop(0,"rgba(255,255,255,0.55)");
  sp.addColorStop(1,"rgba(255,255,255,0)");
  ctx.fillStyle = sp;
  ctx.beginPath(); ctx.ellipse(-9,-6,8,4.6,-0.32,0,TAU); ctx.fill();
  // ground-contact ambient occlusion sliver along bottom edge
  let ao = ctx.createLinearGradient(0,9.5,0,4.5);
  ao.addColorStop(0,"rgba(0,0,0,0.30)");
  ao.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = ao; ctx.fillRect(-17,4.5,34,5);
  ctx.restore();

  // rim light: bright top-left -> dark bottom-right in a single gradient stroke
  let rim = ctx.createLinearGradient(-17,-9.5,17,9.5);
  rim.addColorStop(0,"rgba(255,255,255,0.5)");
  rim.addColorStop(0.5,"rgba(255,255,255,0.05)");
  rim.addColorStop(0.55,"rgba(0,0,0,0.05)");
  rim.addColorStop(1,"rgba(0,0,0,0.4)");
  ctx.strokeStyle = rim; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.roundRect(-16.4,-8.9,32.8,17.8,6.5); ctx.stroke();

  // glossy cockpit glass: deep base + diagonal reflection streak
  ctx.fillStyle = "#131a29";
  ctx.beginPath(); ctx.roundRect(-6,-6.5,12,13,4); ctx.fill();
  let cg = ctx.createLinearGradient(-6,-6.5,6,6.5);
  cg.addColorStop(0,"rgba(96,150,210,0.5)");
  cg.addColorStop(0.5,"rgba(28,44,74,0.25)");
  cg.addColorStop(1,"rgba(4,7,14,0.5)");
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.roundRect(-6,-6.5,12,13,4); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.roundRect(-6,-6.5,12,13,4); ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.moveTo(-6,-1.5); ctx.lineTo(-1.5,-6.5); ctx.lineTo(1.5,-6.5); ctx.lineTo(-3,-1.5); ctx.closePath(); ctx.fill();
  ctx.restore();
  // bright front glass edge (kept accent)
  ctx.fillStyle = "rgba(170,222,255,0.42)";
  ctx.beginPath(); ctx.roundRect(3,-5.5,3,11,2); ctx.fill();
}
```

## stdWheels (shared-fn)
_IMPORTANT INTEGRATOR FIX: one color stop got mangled in transit — replace "#7a melt" with "#7a melt" -> the intended value is "#7a8399" (a mid steel-grey). Set that stop to rg.addColorStop(0.78,"#7a8399"); before pasting, or the gradient will throw. Keeps the original 4 wheel positions ([-10,-10],[-10,10],[9,-10],[9,10]) and 8x6 footprint exactly. Adds: gradient tire (top-left lit), thin rim-light stroke, a metallic radial-gradient hub cap, and a hub dot with a spec highlight. 2 gradients x 4 wheels = 8 gradients total per car — within budget. Every standard-wheel car inherits this. At 30px in-game the hub cap reads as a bright silver rim; verify it isn't so bright it competes with the body — if so drop the 0.45 stop from #c4cbda toward #aab2c4._

```js
function stdWheels(){
  for(const [wx,wy] of [[-10,-10],[-10,10],[9,-10],[9,10]]){
    // tire: rounded rect, top-left lit -> bottom-right dark
    let tg = ctx.createLinearGradient(wx-4,wy-3,wx+4,wy+3);
    tg.addColorStop(0,"#2b3042");
    tg.addColorStop(0.5,"#181c28");
    tg.addColorStop(1,"#0b0d14");
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.roundRect(wx-4,wy-3,8,6,2.2); ctx.fill();
    // faint top-left rim light on the tire edge
    ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.roundRect(wx-3.7,wy-2.7,7.4,5.4,1.9); ctx.stroke();
    // metallic hub cap: radial gradient, bright silver top-left -> dark steel
    let rg = ctx.createRadialGradient(wx-1.1,wy-1.1,0.2, wx,wy,3.4);
    rg.addColorStop(0,"#f4f6fc");
    rg.addColorStop(0.45,"#c4cbda");
    rg.addColorStop(0.78,"#7a melt");
    rg.addColorStop(1,"#3a4054");
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.roundRect(wx-2.8,wy-1.9,5.6,3.8,1.6); ctx.fill();
    // hub center + tiny specular
    ctx.fillStyle = "#2a2f3d";
    ctx.beginPath(); ctx.ellipse(wx,wy,1.1,0.9,0,0,TAU); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath(); ctx.ellipse(wx-0.4,wy-0.5,0.5,0.4,0,0,TAU); ctx.fill();
  }
}
```
