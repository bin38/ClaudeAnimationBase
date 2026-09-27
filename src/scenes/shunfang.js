// shunfang.js: 顺纺集团 corporate film, 3 minutes. See STORYBOARD.md.
// Motif: one red thread (a running stitch) that ties every shot together. Hero: 小纺, a denim-blue Clawd with a spool hat.
(() => {
  const C = {
    red: '#C23A3A', redDk: '#8A2430', gold: '#E9B949', goldDk: '#B98A2A', denim: '#4E7BB5', denimDk: '#2E4C7E', denimLt: '#95B8E2',
    tile: '#5D6370', tileDk: '#40444F', wall: '#EFE5D2', wallDk: '#D6C6AA', wood: '#A7744A', woodDk: '#6E4A2E', leaf: '#5F9150', leafDk: '#3E6B3A',
    water: '#79BCD9', waterDk: '#3F86AE', sky: '#CFE3EC', steel: '#B3BDC6', steelDk: '#6F7C88', kraft: '#C9A36B', kraftDk: '#9C7A48',
    sea: '#3D7EA6', night: '#27335E', machine: '#3A3440', rose: '#E58FA3', teal: '#4EA59D', ochre: '#E0A640', cream: PAL.cream, ink: PAL.ink,
  };
  BODY = { col: C.denim, dk: C.denimDk, lt: C.denimLt };
  const TEAM = [   // teammates: colour, hat, blink seed
    { col: '#4EA59D', dk: '#2F7069', lt: '#9AD3CB', hat: 'beanie' }, { col: '#E58FA3', dk: '#B45E73', lt: '#F6C2CE', hat: 'bow' },
    { col: '#E0A640', dk: '#A87520', lt: '#F4D38F', hat: 'hard' }, { col: '#8C79C2', dk: '#5E4E94', lt: '#C4B7E8', hat: 'band' },
    { col: '#D97757', dk: '#A84D33', lt: '#F5B394', hat: 'sweatband' }, { col: '#6FA35A', dk: '#48753A', lt: '#B5D6A6', hat: 'flower' },
  ];

  // ---------- lettering ----------
  const FONT = s => `${s}px "Ma Shan Zheng"`;
  // a caption in screen space: pops in at t0, fades out by t1 (shot-local times)
  function cap(lt, t0, t1, txt, x, y, size, col = C.ink, o = {}) {
    if (lt < t0 || lt > t1) return;
    letter(txt, x, y, size, col, { font: FONT(size), pop: (lt - t0) * 3.2, alpha: 1 - seg(lt, t1 - .4, t1), screen: true, ink: false, ...o });
  }
  // a red seal (印章) stamped at k = 0..1 (1.8× → 1× and a thump); chars stacked in a column
  function seal(x, y, s, chars, k, alpha = 1) {
    if (k <= 0 || alpha <= 0) return;
    const sc = k < 1 ? lerp(1.9, 1, easeIn(k)) : 1 + .08 * spring(k, 1, 3, 30), a = clamp(k * 1.6) * alpha;
    boilSeed('seal' + x);
    push(); translate(x, y); rotate(-.05); scale(sc);
    paint(rrPts(-s / 2, -s / 2, s, s, s * .1, s * .015), { wash: mixCol(PAL.paper, C.red, a), washOp: 255, ink: mixCol(PAL.paper, C.redDk, a), sw: .9 });
    paint(rrPts(-s * .42, -s * .42, s * .84, s * .84, s * .06, s * .015), { ink: mixCol(C.red, C.cream, .6 * a), sw: .45 });
    pop();
    const n = chars.length, fs = n > 1 ? s * .4 : s * .64;
    for (let i = 0; i < n; i++) letter(chars[i], x, y + (i - (n - 1) / 2) * fs * 1.02 + fs * .04, fs * sc, C.cream, { font: FONT(Math.round(fs * sc)), rot: -.05, alpha: a, screen: true, ink: false });
  }
  // chapter card, top-left: seal with the chapter numeral, a cream brush swash, title and subtitle
  function chapter(lt, t0, t1, num, title, sub, x = 150, y = 150) {
    if (lt < t0 || lt > t1) return;
    const a = lt - t0, out = 1 - seg(lt, t1 - .4, t1), k = easeOut(seg(a, .15, .7)) * out;
    boilSeed('chapter');
    if (k > .02) {
      const x0 = x + 30, x1 = x0 + 560 * k, P = [];
      for (let i = 0; i <= 8; i++) P.push([lerp(x0, x1, i / 8), y - 62 + 6 * Math.sin(i * 1.7)]);
      for (let i = 8; i >= 0; i--) P.push([lerp(x0, x1, i / 8) - 30 * (i / 8), y + 92 + 6 * Math.sin(i * 1.3)]);
      paint(P, { wash: C.cream, washOp: 225, ink: null });
    }
    seal(x, y, 100, [num], seg(a, 0, .25), out);
    cap(lt, t0 + .25, t1, title, x + 82, y - 8, 78, C.ink, { align: 'left' });
    if (sub) cap(lt, t0 + .7, t1, sub, x + 86, y + 60, 44, C.redDk, { align: 'left' });
  }

  // ---------- thread ----------
  const thread = (P, sw = 2.2, col = C.red) => inkLine(P, sw, col, 'ink', .5);
  // a running stitch along a dense polyline, shown up to arc length `upto`
  function stitch(P, upto = Infinity, sw = 2.4, col = C.red, dash = 44, gap = 26) {
    let acc = 0, cur = []; const segs = [];
    for (let i = 0; i < P.length; i++) {
      if (i) acc += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      if (acc > upto) break;
      if (acc % (dash + gap) < dash) cur.push(P[i]); else if (cur.length) { segs.push(cur); cur = []; }
    }
    if (cur.length) segs.push(cur);
    for (const s of segs) if (s.length > 1) inkLine(s, sw, col, 'ink', .2);
  }
  const wavePath = (x0, x1, y, amp, per, ph = 0, step = 8) => { const P = []; for (let x = x0; x <= x1; x += step) P.push([x, y + amp * Math.sin((x / per + ph) * TAU)]); return P; };
  function needle(x, y, ang, L = 110) {
    push(); translate(x, y); rotate(ang);
    paint([[L * .5, 0], [L * .1, -4], [-L * .45, -5], [-L * .5, 0], [-L * .45, 5], [L * .1, 4]], { wash: C.steel, ink: C.ink, sw: .7 });
    paint(ellPts(-L * .36, 0, L * .07, 2, 10), { wash: PAL.paper, ink: null });
    pop();
  }

  // ---------- transitions ----------
  // A fabric panel slides in from the left with a stitched edge (cover at p = .5), then slides off to the right.
  function clothWipe(p, col = C.denim, dk = C.denimDk, stitchCol = C.gold) {
    if (p <= 0 || p >= 1) return;
    const x0 = p < .5 ? -300 : lerp(-300, W + 400, ease((p - .5) * 2)), x1 = p < .5 ? lerp(-300, W + 400, easeOut(p * 2)) : W + 400;
    if (x1 - x0 < 20) return;
    boilSeed('clothwipe');
    const edge = []; for (let k = 0; k <= 12; k++) edge.push([x1 + 36 * Math.sin(k * 1.1 + p * 6), lerp(-120, H + 120, k / 12)]);
    paint([[x0, -120], ...edge, [x0, H + 120]], { wash: col, ink: null });
    for (let i = -6; i < 16; i++) {   // twill
      const y = i * 90, a = Math.max(x0, x1 - 1400), b = x1 - 50;
      if (b - a > 60) inkLine([[a, y], [b, y + (b - a) * .35]], .45, dk, 'inkfine', 0);
    }
    stitch(edge.map(([x, y]) => [x - 34, y]), Infinity, 1.6, stitchCol, 26, 16);
    stitch(edge.map(([x, y]) => [x - 58, y]), Infinity, 1.6, stitchCol, 26, 16);
    inkLine(edge, 1, C.ink, 'ink', .4);
  }
  // speed lines for a whip pan (screen space), k = 0..1 strength
  function speedLines(k, dir = 1) {
    if (k <= .02) return;
    boilSeed('speed' + Math.floor(T * 24));
    for (let i = 0; i < 16; i++) {
      const y = hash(i * 3.1) * H, x = hash(i * 7.7 + Math.floor(T * 24)) * W, L = (300 + 500 * hash(i)) * k;
      inkLine([[x, y], [x + dir * L, y]], .8 + .8 * k, '#6E6A78', 'inkfine', 0);
    }
  }

  // ---------- props ----------
  // a treadle sewing machine on a table top at y; s = size; t drives the needle
  function sewMachine(x, y, s, t, speed = 2) {
    const bob = Math.abs(Math.sin(bpOf(t) * Math.PI * speed)) * s * .16;
    paint(rectPts(x - 1.3 * s, y - .22 * s, 2.6 * s, .22 * s), { wash: C.machine, ink: C.ink, sw: .8 });
    paint([[x + .75 * s, y - .2 * s], [x + 1.15 * s, y - .2 * s], [x + 1.1 * s, y - 1.45 * s], [x + .8 * s, y - 1.45 * s]], { wash: C.machine, ink: C.ink, sw: .8 });
    paint(rrPts(x - 1.2 * s, y - 1.72 * s, 2.4 * s, .42 * s, .15 * s), { wash: C.machine, ink: C.ink, sw: .8 });
    paint(rectPts(x - 1.25 * s, y - 1.72 * s, .42 * s, 1.05 * s), { wash: C.machine, ink: C.ink, sw: .8 });
    inkLine([[x - .5 * s, y - 1.55 * s], [x + .6 * s, y - 1.55 * s]], .7, C.gold, 'inkfine', 0);
    paint(ellPts(x + 1.2 * s, y - 1.35 * s, .38 * s, .38 * s, 14), { wash: C.steelDk, ink: C.ink, sw: .7 });
    push(); translate(x + 1.2 * s, y - 1.35 * s); rotate(bpOf(t) * TAU * speed * .5);
    inkLine([[-.3 * s, 0], [.3 * s, 0]], .6, C.cream, 'inkfine', 0); pop();
    inkLine([[x - 1.04 * s, y - .67 * s], [x - 1.04 * s, y - .5 * s + bob]], 1, C.steel, 'inkfine', 0);
  }
  // a garment (unit ≈ half its width): 'jacket' | 'hoodie' | 'sport' | 'wind' | 'shirt'
  const GAR = {
    body: [[-.5, -1], [.5, -1], [.72, -.88], [1.28, .22], [1.02, .38], [.7, -.18], [.68, 1.1], [-.68, 1.1], [-.7, -.18], [-1.02, .38], [-1.28, .22], [-.72, -.88]],
    collar: [[-.5, -1], [-.18, -.66], [0, -.9], [.18, -.66], [.5, -1]],
    zip: [[0, -.9], [0, 1.1]],
  };
  function garment(x, y, s, style, o = {}) {
    const P = pts => pts.map(([a, b]) => [x + a * s, y + b * s]), sw = o.sw ?? clamp(s / 60, .45, 1.2);
    const col = o.col || { jacket: C.denim, hoodie: C.rose, sport: C.teal, wind: C.ochre, shirt: '#A9C8E8' }[style];
    if (style === 'hoodie') paint(P([[-.55, -1], [-.45, -1.45], [0, -1.62], [.45, -1.45], [.55, -1]]), { wash: mixCol(col, C.ink, .15), ink: C.ink, sw });
    paint(P(GAR.body), { wash: col, ink: C.ink, sw });
    paint(P([[-.68, .85], [.68, .85], [.68, 1.1], [-.68, 1.1]]), { wash: mixCol(col, C.ink, .18), ink: null });
    if (style === 'jacket' || style === 'wind') {
      paint(P(GAR.collar.concat([[0, -.92]])), { wash: mixCol(col, C.ink, .2), ink: C.ink, sw: sw * .8 });
      inkLine(P(GAR.zip), sw * .7, style === 'jacket' ? C.gold : C.ink, 'inkfine', 0);
      if (style === 'jacket') for (const d of [-1, 1]) { stitch(P([[d * .22, .1], [d * .5, .1], [d * .5, .45], [d * .22, .45], [d * .22, .1]]), Infinity, sw * .6, C.gold, 8, 6); }
    } else if (style === 'sport') {
      for (const d of [-1, 1]) inkLine(P([[d * .74, -.84], [d * 1.18, .2]]), sw * 1.6, C.cream, 'ink', 0);
      inkLine(P([[-.2, -.66], [0, -.5], [.2, -.66]]), sw * .8, C.cream, 'inkfine', 0);
    } else if (style === 'hoodie') {
      paint(P([[-.35, .35], [.35, .35], [.42, .72], [-.42, .72]]), { wash: mixCol(col, C.ink, .12), ink: C.ink, sw: sw * .7 });
      for (const d of [-1, 1]) inkLine(P([[d * .12, -.9], [d * .14, -.55]]), sw * .6, C.cream, 'inkfine', 0);
    } else if (style === 'shirt') {
      inkLine(P([[-.5, -1], [-.1, -.7], [0, -.95], [.1, -.7], [.5, -1]]), sw * .8, C.ink, 'inkfine', .2);
      for (let i = 0; i < 4; i++) paint(ellPts(x, y + (-.5 + i * .4) * s, s * .04, s * .04, 6), { wash: C.cream, ink: null });
    }
  }
  function box(x, y, w, h, o = {}) {   // shipping carton, bottom centre at (x, y)
    paint(rectPts(x - w / 2, y - h, w, h, 1), { wash: o.col || C.kraft, ink: C.ink, sw: o.sw ?? .8 });
    inkLine([[x - w / 2, y - h * .55], [x + w / 2, y - h * .55]], o.sw ?? .8, C.red, 'ink', 0);
    inkLine([[x, y - h], [x, y - h * .78]], (o.sw ?? .8) * .7, C.kraftDk, 'inkfine', 0);
  }
  function tree(x, y, s, t, col = C.leaf) {
    paint([[x - .12 * s, y], [x - .08 * s, y - .9 * s], [x + .08 * s, y - .9 * s], [x + .14 * s, y]], { wash: C.woodDk, ink: C.ink, sw: .7 });
    const sway = wob(t, .25, x * .001) * .04 * s;
    paint(ellPts(x + sway, y - 1.25 * s, .72 * s, .55 * s, 22, s * .03), { wash: col, ink: C.ink, sw: .7 });
    paint(ellPts(x - .25 * s + sway, y - 1.45 * s, .3 * s, .2 * s, 14), { wash: mixCol(col, C.cream, .3), ink: null });
    for (let i = 0; i < 5; i++) paint(ellPts(x + sway + (hash(i + x) - .5) * s, y - 1.2 * s + (hash(i + 9 + x) - .5) * .6 * s, s * .05, s * .05, 8), { wash: C.red, ink: null });   // lychees
  }
  function sparkle(x, y, r, k, col = C.cream) { if (k > 0 && k < 1) paint(starPts(x, y, r * backOut(k) * (1 - k * .6), .25, 4, k * 2), { wash: col, washOp: 255 * (1 - k * k), ink: null }); }

  // the hero, 小纺
  const hero = (x, y, u, o = {}) => clawd(x, y, u, { hat: 'spool', seed: 1, ...o });

  // ===================================================================================================
  // Shot 1 (0–15): title. A needle stitches a red thread across the paper, the name is brushed in and stamped;
  // 小纺 hops onto the thread, sees the title, waves, tugs the thread and runs off along it to the right.
  // ===================================================================================================
  const TITLE = ['顺', '纺', '集', '团'];
  const titleY = 330, threadY = x => 770 + 18 * Math.sin((x / 520) * TAU);
  function titleBlock(lt, t0, jig = 0) {
    TITLE.forEach((ch, i) => {
      const a = lt - (t0 + i * .17); if (a < 0) return;
      const r = (hash(i + 3) - .5) * .12 + jig * Math.sin(i * 2 + lt * 30) * .5;
      letter(ch, 960 + (i - 1.5) * 225, titleY + (hash(i) - .5) * 14, 210, C.ink, { font: FONT(210), pop: a * 3.5, rot: r, ink: false });
      if (a < .5) { boilSeed('splat' + i); for (let k = 0; k < 4; k++) sparkle(960 + (i - 1.5) * 225 + Math.cos(k * 1.7 + i) * 130, titleY + Math.sin(k * 1.7 + i) * 110, 16, a / .5, C.ink); }
    });
  }
  function shotTitle(t, lt, dur) {
    const tHop = 6.4, tLand = 6.95, tSee = 7.5, tWave = 8.3, tTurn = 9.7, tTug = 10.1, tRun = 11.0;
    const cx = kf(lt, [[0, 960], [tRun + .3, 960], [dur, 1560]], ease);
    camBegin(cx, 540 + 6 * Math.sin(lt * .7), kf(lt, [[0, 1.04], [6, 1], [dur, 1.02]]));
    boilSeed('paperwash');
    paint(ellPts(960, 420, 900, 330, 26, 8), { wash: '#F7EFE0', washOp: 140, ink: null });
    // the thread: the needle runs from off-screen left to the right, leaving a running stitch
    const P = []; for (let x = -200; x <= 3000; x += 8) P.push([x, threadY(x)]);
    const nk = easeOut(seg(lt, .3, 3.4)) * .62 + ease(seg(lt, 3.4, 14.5)) * .38, nx = lerp(-200, 3000, nk);
    // the tug pulls the thread taut for a moment: a dip travels along it
    const tug = lt > tTug ? Math.exp(-(lt - tTug) * 3) * Math.sin((lt - tTug) * 14) : 0;
    const PT = P.map(([x, y]) => [x, y + tug * 16 * Math.exp(-Math.abs(x - 700) / 500)]);
    boilSeed('stitch');
    stitch(PT, (nx + 200) * 1.02);
    const ny = threadY(nx), slope = Math.atan2(threadY(nx + 10) - ny, 10);
    if (nx < 2950) { boilSeed('needle'); needle(nx + 55, ny - 4, slope - .08, 150); }

    // 小纺: hops in from below onto the thread, sees the title, waves, turns, tugs, runs right along the thread
    const x0 = 330;
    let x = x0, gy = threadY(x0), pose = {};
    if (lt < tHop) x = -500;
    else if (lt < tLand) { const k = easeOut(seg(lt, tHop, tLand)); [x, gy] = arcPt([160, 1400], [x0, threadY(x0)], 380, k); pose = { sq: -.2 * Math.sin(k * Math.PI), aL: 1.3, aR: 1.3 }; }
    const u = 26;
    const walk = stroll(lt, tRun, dur + 1.2, x0, 2700, u);
    if (lt >= tRun) x = walk.x;
    const mood = emotions(lt, [[0, 'excited'], [tLand + .05, 'excited'], [tSee, 'surprised', { lookX: .5, lookY: -.9 }], [tSee + .7, 'starstruck', { lookX: .4, lookY: -.7 }],
                               [tTurn - .2, 'determined'], [tRun, 'excited']]);
    let cl = { ...mood };
    if (lt >= tHop && lt < tLand) cl = { ...cl, ...pose, dy: 0 };
    else if (lt >= tLand) {
      cl.sq = (cl.sq || 0) + jump(lt, -9, tLand, 1).sq;   // squash on landing
      cl.rot = .05 * Math.sin(lt * 5) * Math.exp(-(lt - tLand) * 1.5);   // balancing on the thread
      if (lt > tWave && lt < tTurn - .1) cl.aL = lerp(cl.aL ?? .2, 1.2 + .5 * Math.sin((lt - tWave) * 12), ease(seg(lt, tWave, tWave + .2)));
      if (lt >= tTurn - .1 && lt < tRun) {
        Object.assign(cl, turn(lt, tTurn - .1, tTurn + .1, 0, .25));
        const pull = lt > tTug - .15 ? Math.exp(-(lt - tTug) * 2.5) : 0;
        cl.rot = -.28 * pull * (lt > tTug ? 1 : seg(lt, tTug - .15, tTug)); cl.aL = -.4; cl.dy = 0;
        cl.armL = (u, sw) => thread([[0, 0], [u * .6, u * .8], [u * .4, u * 2.2]], sw * .7);
      }
      if (lt >= tRun) Object.assign(cl, { view: 'side', walk: walk.walk * 1.4, dy: walk.dy * 2 - Math.abs(Math.sin(walk.walk * Math.PI * 1.4)) * .6, rot: .06, aL: .6 * Math.sin(walk.walk * TAU * .7), squint: 0 });
    }
    if (lt >= tHop) hero(x, (lt < tLand ? gy : threadY(x)) + 2, u, { ...cl, noShadow: true, dy: (cl.dy || 0) + (lt < tLand ? 0 : tug * .3) });

    titleBlock(lt, 3.4, lt > tTug ? Math.exp(-(lt - tTug) * 4) * .3 : 0);
    // (the seal and subtitle live in world space too, so the pan carries them away)
    const sealK = seg(lt, 4.55, 4.8), [sx, sy] = toScreen(1455, 330), sealS = 120 * CAM.zoom;
    const [bx, by] = toScreen(960, 480);
    cap(lt, 5.3, 99, '始于一九八四 · 中国顺德', bx, by, Math.round(54 * CAM.zoom), C.redDk);
    camEnd();
    seal(sx, sy, sealS, ['顺', '纺'], sealK);   // screen space: the box and its glyphs share one transform
    // open: the paper fades up from ink
    boilSeed('fadein');
    if (lt < .6) paint(rectPts(-60, -60, W + 120, H + 120), { wash: C.ink, washOp: 255 * (1 - ease(lt / .6)), ink: null });
    flushLetters();
    if (lt > dur - .4) clothWipe((lt - (dur - .4)) / .8);
  }

  // ===================================================================================================
  // Shot 2 (15–37.5): 壹 始于1984. Dusk, a Lingnan house in Ronggui. 小纺 sews at a treadle machine and holds up the first
  // shirt. The camera pulls back; sun sets, moon crosses, sun rises; four garment factories and a washing plant rise.
  // ===================================================================================================
  const tPull = 8.6, tLapse0 = 10, tLapse1 = 17.5;
  function skyCol(lt) {
    return lt < tLapse0 ? '#F2B880' : kfCol(lt, [[tLapse0, '#F2B880'], [11.8, '#6B5A8E'], [12.6, C.night], [14.6, C.night], [15.6, '#E9A98E'], [16.6, '#F6D7A7'], [tLapse1, C.sky]]);
  }
  function kfCol(t, keys) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) return mixCol(keys[i - 1][1], keys[i][1], ease(seg(t, keys[i - 1][0], keys[i][0])));
    return keys[keys.length - 1][1];
  }
  const nightK = lt => clamp(seg(lt, 11.4, 12.6) - seg(lt, 14.8, 15.9));
  function house(cx, gy, lit, t) {
    const w = 520, h = 300, dL = cx - 150, dR = cx + 150, dT = gy - 240;
    // gables: the wok-ear (镬耳) walls rise above the roof on both ends
    for (const s of [-1, 1]) {
      const ex = cx + s * 250, P = [];
      for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12; P.push([ex + s * (-40 + 40 * Math.cos(a)) + s * 10, gy - h - 40 - 150 * Math.sin(a)]); }
      P.push([ex + s * 30, gy - h + 10]); P.push([ex - s * 90, gy - h + 10]);
      boilSeed('gable' + s);
      paint(P, { wash: C.tileDk, ink: C.ink, sw: 1 });
      inkLine(P.slice(0, 13).map(([x, y]) => [x, y + 16]), 1.2, C.cream, 'inkfine', .5);
    }
    boilSeed('roof');
    paint([[cx - 240, gy - h + 12], [cx - 200, gy - h - 110], [cx + 200, gy - h - 110], [cx + 240, gy - h + 12]], { wash: C.tile, ink: C.ink, sw: 1 });
    for (let i = 0; i < 11; i++) { const x = cx - 190 + i * 38; inkLine([[x, gy - h - 104], [x - 8 + (i - 5) * 5, gy - h + 8]], .6, C.tileDk, 'inkfine', 0); }
    paint(rectPts(cx - 215, gy - h - 124, 430, 20, 1), { wash: C.tileDk, ink: C.ink, sw: .8 });
    // walls around the open doorway
    const wallC = C.wall;
    boilSeed('walls');
    paint(rectPts(cx - w / 2 + 10, gy - h, dL - (cx - w / 2 + 10), h), { wash: wallC, ink: null });
    paint(rectPts(dR, gy - h, cx + w / 2 - 10 - dR, h), { wash: wallC, ink: null });
    paint(rectPts(dL, gy - h, dR - dL, dT - (gy - h)), { wash: wallC, ink: null });
    paint(rectPts(cx - w / 2 + 10, gy - h, w - 20, h), { ink: C.ink, sw: 1 });
    paint(rectPts(dL, dT, dR - dL, 240), { ink: C.woodDk, sw: 1.6 });
    paint(rectPts(cx - w / 2 + 10, gy - 34, dL - (cx - w / 2 + 10), 34), { wash: C.tile, ink: C.ink, sw: .8 });
    paint(rectPts(dR, gy - 34, cx + w / 2 - 10 - dR, 34), { wash: C.tile, ink: C.ink, sw: .8 });
    // lattice windows, warm at night
    for (const s of [-1, 1]) {
      const wx = cx + s * 205;
      boilSeed('win' + s);
      paint(rectPts(wx - 40, gy - 220, 80, 100), { wash: mixCol(C.woodDk, '#FFD58A', lit), ink: C.ink, sw: .8 });
      for (let i = 1; i < 4; i++) inkLine([[wx - 40 + i * 20, gy - 220], [wx - 40 + i * 20, gy - 120]], .5, C.woodDk, 'inkfine', 0);
      inkLine([[wx - 40, gy - 170], [wx + 40, gy - 170]], .5, C.woodDk, 'inkfine', 0);
      if (lit > .05) glow(wx, gy - 170, 90, '#FFC766', lit * .8);
    }
  }
  function factory(cx, gy, w, h, k, lit, o = {}) {
    if (k <= 0) return;
    push(); translate(cx, gy); scale(1, backOut(k)); if (o.far) scale(.78, .78);
    const n = Math.max(3, Math.round(w / 110)), tw = w / n, wallC = o.far ? mixCol(C.wall, C.sky, .35) : C.wall;
    boilSeed('fac' + cx);
    for (let i = 0; i < n; i++) {   // sawtooth roof: glass faces the north light
      const x0 = -w / 2 + i * tw;
      paint([[x0, -h], [x0, -h - 70], [x0 + tw, -h]], { wash: o.far ? mixCol(C.tile, C.sky, .3) : C.tile, ink: C.ink, sw: .8 });
      paint([[x0 + 4, -h - 4], [x0 + 4, -h - 60], [x0 + tw * .3, -h - 45]], { wash: mixCol('#9CC9E0', '#FFD58A', lit), ink: null });
    }
    paint(rectPts(-w / 2, -h, w, h, 1), { wash: wallC, ink: C.ink, sw: .9 });
    paint(rectPts(-w / 2, -h, w, 14), { wash: C.red, ink: null });
    const cols = Math.max(2, Math.round(w / 90));
    for (let r = 0; r < 2; r++) for (let i = 0; i < cols; i++) {
      const wx = -w / 2 + (i + .5) * w / cols - 22, wy = -h + 40 + r * (h * .42);
      paint(rectPts(wx, wy, 44, h * .26), { wash: mixCol('#9CC9E0', '#FFD58A', lit), ink: C.ink, sw: .6 });
    }
    if (o.tank) {   // the washing plant: a water tank and pipes
      paint(rectPts(w / 2 - 20, -h - 150, 110, 150), { wash: C.water, ink: C.ink, sw: .9 });
      paint(ellPts(w / 2 + 35, -h - 150, 55, 16, 16), { wash: mixCol(C.water, C.cream, .4), ink: C.ink, sw: .8 });
      inkLine([[w / 2 + 35, -h - 20], [w / 2 + 35, -h * .4], [w / 2 - 5, -h * .4]], 3, C.steelDk, 'ink', 0);
    }
    paint(rectPts(-40, -90, 80, 90), { wash: C.woodDk, ink: C.ink, sw: .7 });
    pop();
    if (lit > .05 && k > .9) glow(cx, gy - h * .5, w * .5, '#FFC766', lit * .5);
  }
  function shotOrigin(t, lt, dur) {
    const G = 860, lit = lt < tLapse0 ? 1 : nightK(lt) * 1 + (1 - seg(lt, tLapse0, 11)) * 0;
    const zoom = lt < tPull ? kf(lt, [[0, 2.35], [tPull, 2.2]]) : lt < 21.2 ? lerp(2.2, .62, ease(seg(lt, tPull, 12.2))) : lerp(.62, 5.5, easeIn(seg(lt, 21.2, dur)));
    const cx = lt < 21.2 ? lerp(958, 960, seg(lt, tPull, 12.2)) : lerp(960, 1660, ease(seg(lt, 21.2, dur - .5)));
    const cy = lt < 21.2 ? lerp(742, 560, ease(seg(lt, tPull, 12.2))) : lerp(560, 690, ease(seg(lt, 21.2, dur - .5)));
    camBegin(cx, cy, zoom);
    // sky, sun / moon, stars
    boilSeed('sky');
    paint(rectPts(-1400, -1400, 4800, 2300), { wash: skyCol(lt), ink: null });
    const nk = nightK(lt);
    if (nk > .02) for (let i = 0; i < 40; i++) { boilSeed('st' + i); const tw = .6 + .4 * Math.sin(lt * 3 + i); paint(starPts(-700 + hash(i) * 3400, -600 + hash(i + 50) * 900, (3 + 4 * hash(i + 9)) * tw, .35), { wash: C.cream, washOp: 255 * nk, ink: null }); }
    boilSeed('sun');
    const sunA = lt < tLapse0 ? [1780, 470] : lt < 12 ? [lerp(1780, 2200, seg(lt, tLapse0, 12)), lerp(470, 1000, easeIn(seg(lt, tLapse0, 12)))] : null;
    if (sunA) { glow(...sunA, 260, '#FFB36B', .9); paint(ellPts(...sunA, 70, 70, 24), { wash: '#FFE0A0', ink: null }); }
    if (lt > 12.2 && lt < 15.2) { const k = seg(lt, 12.2, 15.2), p = arcPt([-300, 700], [2300, 700], 1000, k); paint(ellPts(...p, 60, 60, 22), { wash: C.cream, ink: C.ink, sw: .7 }); glow(...p, 180, '#FFF2C8', .5); }
    if (lt > 15) { const k = easeOut(seg(lt, 15, tLapse1 + 1)), p = [lerp(-200, 250, k), lerp(900, -250, k)]; glow(...p, 300, '#FFD27A', .8 * (1 - seg(lt, 17, 20) * .5)); paint(ellPts(...p, 80, 80, 24), { wash: '#FFE6A8', ink: null }); }
    // far hills
    boilSeed('hills');
    paint(ellPts(300, G + 60, 1300, 260, 30, 6), { wash: mixCol('#8FB38A', skyCol(lt), .45), ink: null });
    paint(ellPts(2000, G + 80, 1100, 220, 30, 6), { wash: mixCol('#7FA67E', skyCol(lt), .4), ink: null });
    // the group rises through the night, one building per beat pair
    const grow = i => seg(lt, 12.5 + i * 1.25, 13.4 + i * 1.25), fLit = Math.max(nk, lt < 16 ? 0 : 0);
    factory(1320, G - 100, 520, 260, grow(3), fLit, { far: true });
    factory(560, G - 110, 460, 240, grow(2), fLit, { far: true });
    factory(250, G, 480, 280, grow(0), fLit);
    factory(1660, G, 520, 300, grow(1), fLit);
    factory(2280, G, 460, 260, grow(4), fLit, { tank: true });
    // ground and river
    boilSeed('ground');
    paint(rectPts(-1400, G - 10, 4800, 60), { wash: '#8DAA6A', ink: null });
    inkLine([[-1400, G - 10], [960, G - 14], [3400, G - 8]], 1, C.ink, 'ink', .5);
    paint(rectPts(-1400, G + 50, 4800, 900), { wash: mixCol(C.water, skyCol(lt), .3), ink: null });
    inkLine([[-1400, G + 50], [3400, G + 50]], 1, C.ink, 'ink', 0);
    for (let i = 0; i < 14; i++) { boilSeed('wave' + i); const wx = -700 + hash(i) * 3200 + 30 * Math.sin(lt + i), wy = G + 90 + hash(i + 4) * 200; inkLine([[wx, wy], [wx + 40, wy - 6], [wx + 80, wy]], .8, C.cream, 'inkfine', .5); }
    // a little boat drifts past
    boilSeed('boat');
    const bx = -300 + ((lt * 60) % 3000);
    paint([[bx - 90, G + 110], [bx + 90, G + 110], [bx + 60, G + 140], [bx - 60, G + 140]], { wash: C.woodDk, ink: C.ink, sw: .8 });
    paint([[bx - 40, G + 110], [bx - 30, G + 80], [bx + 30, G + 80], [bx + 40, G + 110]], { wash: C.tile, ink: C.ink, sw: .7 });
    tree(560, G, 150, lt); tree(1380, G, 130, lt, '#6E9F58');

    // interior: warm lamplight, 小纺 at the treadle machine behind the table
    boilSeed('interior');
    paint(rectPts(810, 620, 300, 240), { wash: '#6A4636', ink: null });
    glow(1000, 700, 220, '#FFC766', .9);
    paint(rectPts(810, 620, 300, 240), { wash: '#F2C27A', washOp: 90, ink: null });
    boilSeed('lamp');
    inkLine([[1010, 620], [1010, 660]], .7, C.ink, 'inkfine', 0);
    paint([[990, 660], [1030, 660], [1040, 676], [980, 676]], { wash: C.gold, ink: C.ink, sw: .6 });
    const u = 13, hx = 925, tShirt = 6.0;
    const mood = emotions(lt, [[0, 'determined', { lookX: .8, lookY: .6 }], [tShirt, 'excited'], [tShirt + .9, 'proud'], [tPull + 3.4, 'starstruck', { lookX: .2, lookY: -.8 }]]);
    const sewing = lt < tShirt - .2;
    const inside = true, hxx = hx;
    const cl = { ...mood, view: 'q' };
    if (sewing) { const b = Math.sin(bpOf(lt) * Math.PI * 2); cl.aR = -.3 + .25 * b; cl.aL = -.25 - .2 * b; cl.dy = (cl.dy || 0) * .3; }
    if (lt >= tShirt - .2 && inside) {   // the first shirt, lifted high in the near arm
      const up = backOut(seg(lt, tShirt - .2, tShirt + .4));
      cl.aL = lerp(-.2, 1.35, up) + .08 * Math.sin(lt * 4); cl.aR = lerp(-.2, .9, up);
      cl.armL = (u, sw) => { push(); rotate(cl.aL - .1); garment(u * .2, -u * 1.5, u * 1.7, 'shirt', { sw: sw * .7 }); pop(); };
    }
    hero(hxx, inside ? 860 : G - 8, u, cl);
    // the table and machine in front of 小纺; the red thread runs from the spool hat into the needle
    boilSeed('table');
    if (inside || lt < 12) {
      paint(rectPts(965, 790, 140, 16), { wash: C.wood, ink: C.ink, sw: .8 });
      for (const lx of [975, 1090]) inkLine([[lx, 806], [lx, 860]], 1.2, C.woodDk, 'ink', 0);
      sewMachine(1045, 790, 32, lt, sewing ? 2 : 0);
      if (sewing) {
        const fx = (lt * 18) % 60;
        paint(rectPts(985 - fx * .2, 781, 80, 8), { wash: '#A9C8E8', ink: C.ink, sw: .5 });
        boilSeed('hatthread');
        thread([[hx + 2.6 * u * .74 + 14, 860 - 12 * u], [hx + 60, 700], [1011, 736]], .9);
      }
    }
    house(960, 860, lt < tLapse0 ? 1 : nk, lt);
    camEnd();
    boilSeed('titles');
    chapter(lt, .8, 7.2, '壹', '始于一九八四', '扎根佛山顺德容桂');
    cap(lt, 16.2, 21.4, '近四十载  深耕不辍', 960, 150, 92, C.ink);
    cap(lt, 17.4, 21.4, '四间成衣工厂 · 一间洗水厂 · 全产业链布局', 960, 250, 48, C.redDk);
    flushLetters();
    boilSeed('flash');
    if (lt > dur - .7) flash(ease(seg(lt, dur - .7, dur - .05)), '#FFF3D6');
    if (lt < .4) clothWipe(.5 + lt / .8);
  }


  // a caption on a cream brush swash, for busy backgrounds
  function banner(lt, t0, t1, txt, x, y, size, col = C.ink, wdt = null) {
    if (lt < t0 || lt > t1) return;
    const k = easeOut(seg(lt, t0, t0 + .45)) * (1 - seg(lt, t1 - .4, t1)), w = (wdt || txt.length * size * 1.02 + 120) * k;
    if (w > 10) {
      boilSeed('banner' + x);
      const P = []; for (let i = 0; i <= 8; i++) P.push([x - w / 2 + w * i / 8, y - size * .75 + 5 * Math.sin(i * 1.9)]);
      for (let i = 8; i >= 0; i--) P.push([x - w / 2 + w * i / 8 + 16, y + size * .7 + 5 * Math.sin(i * 1.3)]);
      paint(P, { wash: C.cream, washOp: 235, ink: null });
    }
    cap(lt, t0 + .15, t1, txt, x, y, size, col);
  }

  // ===================================================================================================
  // Shot 3 (37.5–57.5): 贰 面料研发. A loom weaves on the beat; 小纺 studies the weave with a magnifier, has an idea,
  // and nine swatches fly onto the board one per beat; a red running stitch sews them into a patchwork.
  // The camera pushes into the cream swatch, which becomes the design paper of shot 4.
  // ===================================================================================================
  const SW = [   // swatches: colour, pattern
    [C.denim, 'twill'], ['#D8B98C', 'solid'], [C.rose, 'dots'], [C.teal, 'stripe'], ['#F4EBD8', 'solid'], ['#3F3A46', 'solid'],
    [C.red, 'check'], [C.ochre, 'stripe'], ['#9DBB8A', 'dots'],
  ];
  const slot = i => [1400 + (i % 3) * 165, 270 + Math.floor(i / 3) * 150];
  function swatch(x, y, w, h, i, rot = 0, sw = .8) {
    const [col, pat] = SW[i];
    push(); translate(x, y); rotate(rot);
    boilSeed('swatch' + i);
    paint(rectPts(-w / 2, -h / 2, w, h, 1.5), { wash: col, ink: C.ink, sw });
    const d = mixCol(col, C.ink, .3), l = mixCol(col, C.cream, .5);
    if (pat === 'twill') for (let k = -3; k < 4; k++) inkLine([[k * w * .2 - w * .1, -h / 2 + 4], [k * w * .2 + w * .15, h / 2 - 4]], .4, d, 'inkfine', 0);
    if (pat === 'stripe') for (let k = 1; k < 4; k++) inkLine([[-w / 2 + 4, -h / 2 + k * h / 4], [w / 2 - 4, -h / 2 + k * h / 4]], 1.4, l, 'ink', 0);
    if (pat === 'check') for (let k = 1; k < 4; k++) { inkLine([[-w / 2 + 4, -h / 2 + k * h / 4], [w / 2 - 4, -h / 2 + k * h / 4]], 1, l, 'ink', 0); inkLine([[-w / 2 + k * w / 4, -h / 2 + 4], [-w / 2 + k * w / 4, h / 2 - 4]], 1, l, 'ink', 0); }
    if (pat === 'dots') for (let k = 0; k < 6; k++) paint(ellPts(-w * .3 + (k % 3) * w * .3, -h * .2 + Math.floor(k / 3) * h * .4, 5, 5, 8), { wash: l, ink: null });
    pop();
  }
  function shotFabric(t, lt, dur) {
    const G = 860, tWalk = 6.8, tLens = 7.6, tIdea = 9.4, tFly = 10.6, tSew = 16.2, tPush = 18.4;
    const zoom = kf(lt, [[0, 1.02], [tWalk, 1.02], [tLens + .6, 1.45], [tIdea + .8, 1.45], [tFly + 1.2, 1.12], [tPush, 1.12], [dur, 9]], ease);
    const cx = kf(lt, [[0, 960], [tWalk, 960], [tLens + .6, 880], [tIdea + .8, 880], [tFly + 1.2, 1260], [tPush, 1260], [dur - .6, slot(4)[0]], [dur, slot(4)[0]]]);
    const cy = kf(lt, [[0, 540], [tWalk, 540], [tLens + .6, 560], [tIdea + .8, 560], [tFly + 1.2, 470], [tPush, 470], [dur - .6, slot(4)[1]], [dur, slot(4)[1]]]);
    camBegin(cx, cy, lt > tPush ? lerp(1.12, 18, easeIn(seg(lt, tPush, dur - .15))) : zoom);
    boilSeed('studio');
    paint(rectPts(-800, -600, 3600, 1600), { wash: '#E8DCC5', ink: null });
    paint(rectPts(-800, G, 3600, 800), { wash: '#CDB690', ink: null });
    inkLine([[-800, G], [2800, G]], 1, C.ink, 'ink', 0);
    for (let i = 0; i < 9; i++) inkLine([[-600 + i * 400, G + 10], [-900 + i * 400, G + 400]], .6, C.woodDk, 'inkfine', 0);
    // window with daylight
    boilSeed('window');
    paint(rectPts(90, 150, 330, 380), { wash: C.sky, ink: C.ink, sw: 1 });
    paint(ellPts(300, 470, 260, 90, 20), { wash: '#B8D6A0', ink: null });
    inkLine([[255, 150], [255, 530]], 2, C.woodDk, 'ink', 0); inkLine([[90, 340], [420, 340]], 2, C.woodDk, 'ink', 0);
    glow(255, 340, 380, '#FFF0C8', .35);
    // the loom
    const yf = lerp(700, 440, ease(seg(lt, .6, tWalk + .4))), bp = bpOf(lt), leg = Math.floor(bp), f = bp - leg;
    const shX = lerp(...(leg % 2 ? [1000, 580] : [580, 1000]), ease(clamp(f * 1.4)));
    boilSeed('loom');
    for (const px of [540, 1040]) paint(rectPts(px - 14, 250, 28, G - 250), { wash: C.wood, ink: C.ink, sw: .9 });
    paint(rectPts(520, 250, 540, 34), { wash: C.wood, ink: C.ink, sw: .9 });
    paint(rectPts(520, 760, 540, 30), { wash: C.wood, ink: C.ink, sw: .9 });
    boilSeed('cloth');
    paint(rectPts(572, yf, 436, 762 - yf), { wash: C.denim, ink: C.ink, sw: .7 });
    for (let y = 752; y > yf + 8; y -= 36) inkLine([[574, y], [1006, y]], 2, (Math.round(y / 36) % 3) ? C.denimLt : C.red, 'ink', 0);
    boilSeed('warp');
    for (let i = 0; i < 16; i++) { const x = 580 + i * 28; inkLine([[x, 286], [x + ((i % 2) ? 3 : -3) * (1 - f), yf]], .5, C.cream, 'inkfine', 0); }
    const reed = yf - 26 - 30 * (1 - pulse(lt, 5));
    paint(rectPts(560, reed - 8, 460, 16), { wash: C.woodDk, ink: C.ink, sw: .7 });
    boilSeed('shuttle');
    paint([[shX - 46, yf - 10], [shX - 20, yf - 20], [shX + 20, yf - 20], [shX + 46, yf - 10], [shX + 20, yf], [shX - 20, yf]], { wash: C.ochre, ink: C.ink, sw: .7 });
    thread([[shX, yf - 10], [lerp(shX, leg % 2 ? 1006 : 574, .6), yf - 4], [leg % 2 ? 1006 : 574, yf - 2]], .8);
    // the swatch board
    boilSeed('board');
    paint(rectPts(1300, 170, 500, 480), { wash: C.kraft, ink: C.ink, sw: 1 });
    paint(rectPts(1300, 170, 500, 480), { wash: '#B98E56', washOp: 60, ink: null });
    for (let i = 0; i < 9; i++) {
      const tA = tFly + i * BEAT, k = seg(lt, tA, tA + .5), [sx, sy] = slot(i);
      if (lt < tA) continue;
      const src = [920, lerp(700, 500, i / 8)], p = k < 1 ? arcPt(src, [sx, sy], 220, easeOut(k)) : [sx, sy];
      const rot = k < 1 ? (1 - k) * (hash(i) - .5) * 3 : .03 * spring(lt, tA + .5, 5, 16);
      swatch(p[0], p[1], 140 * lerp(.5, 1, k), 120 * lerp(.5, 1, k), i, rot);
      if (k >= 1) { paint(ellPts(sx, sy - 52, 7, 7, 10), { wash: C.red, ink: C.ink, sw: .5 }); sparkle(sx + 60, sy - 50, 26, seg(lt, tA + .5, tA + .9)); }
    }
    // the sewing: running stitches along the seams between swatches
    const sk = seg(lt, tSew, tSew + 1.8);
    if (sk > 0) {
      boilSeed('seams');
      for (const x of [1482, 1647]) stitch(wavePath(0, 440, 0, 0, 1).map(([a]) => [x, 200 + a]), 440 * sk, 1.8, C.red, 16, 10);
      for (const y of [345, 495]) stitch(wavePath(1330, 1770, y, 0, 1), 440 * sk, 1.8, C.red, 16, 10);
    }
    // 小纺: works the loom, then studies the cloth with a magnifier, then turns to cheer on the swatches
    const u = 24;
    const mood = emotions(lt, [[0, 'determined', { lookX: .6, lookY: .3 }], [tWalk - .4, 'neutral'], [tLens + .3, 'thinking', { lookX: 1, lookY: .2 }], [tIdea, 'idea'],
                               [tFly + .3, 'excited', { lookX: .8, lookY: -.6 }], [tSew + .4, 'starstruck'], [tPush - .5, 'proud']]);
    const walk = stroll(lt, tWalk, tLens, 1220, 1090, u);
    const cl = { ...mood, view: 'q', flip: true };
    if (lt < tWalk) { const b = pulse(lt, 5); cl.aL = .1 + .6 * b; cl.aR = -.1 + .4 * b; }
    else if (lt < tLens) Object.assign(cl, { walk: walk.walk, dy: walk.dy, view: 'q', flip: true });
    if (lt >= tLens - .2 && lt < tFly) {
      const up = backOut(seg(lt, tLens - .2, tLens + .3));
      cl.aR = lerp(0, .5, up) + .05 * Math.sin(lt * 3);
      cl.armR = (u, sw) => {   // the magnifier: handle, rim and a close-up of the weave in the lens
        push(); rotate(-cl.aR);
        inkLine([[0, 0], [u * 1.3, -u * .3]], sw * 1.6, C.woodDk, 'ink', 0);
        const r = u * 1.3, lx = u * 2.4, ly = -u * .6;
        paint(ellPts(lx, ly, r, r, 24), { wash: C.denim, ink: null });
        for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (a * a + b * b < 6) paint(rectPts(lx + a * r * .36 - r * .15, ly + b * r * .36 - r * .15, r * .3, r * .3), { wash: (a + b) % 2 ? C.denimLt : C.red, ink: null });
        paint(ellPts(lx, ly, r, r, 24), { ink: C.ink, sw: sw * 1.5 });
        paint(ellPts(lx - r * .4, ly - r * .4, r * .25, r * .14, 10, 0, -.6), { wash: C.cream, washOp: 200, ink: null });
        pop();
      };
    }
    if (lt >= tFly) Object.assign(cl, turn(lt, tFly, tFly + .2, -.25, .125), { aR: 1.3 + .1 * Math.sin(lt * 4) });
    hero(lt < tWalk ? 1220 : lt < tLens ? walk.x : 1090, G, u, cl);
    camEnd();
    chapter(lt, .6, 6.6, '贰', '面料研发', '一纱一线 · 精选好料');
    banner(lt, 12.2, 17.8, '多元面料 · 自主开发', 960, 960, 68);
    flushLetters();
    boilSeed('flashin');
    if (lt < .6) flash(1 - ease(lt / .6), '#FFF3D6');
  }

  // ===================================================================================================
  // Shot 4 (57.5–77.5): 叁 设计开发. Out of the cream paper: 小纺 thinks, gets an idea, and a magic pencil sketches a
  // jacket; the sketch fills with colour, peels off and lands on a dress form; outfits change on the beat.
  // ===================================================================================================
  const PAPER2 = '#F4EBD8', JX = 760, JY = 500, JS = 150;
  function sketchPaths() {
    const P = pts => pts.map(([a, b]) => [JX + a * JS, JY + b * JS]);
    return [P(GAR.body.concat([GAR.body[0]])), P(GAR.collar), P(GAR.zip), P([[-.22, .1], [-.5, .1], [-.5, .45], [-.22, .45]]), P([[.22, .1], [.5, .1], [.5, .45], [.22, .45]])];
  }
  function drawSketch(k) {   // reveal the sketch paths up to fraction k of their total length; returns the pencil tip
    const paths = sketchPaths(), lens = paths.map(p => p.reduce((s, q, i) => i ? s + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0, 0));
    let left = k * lens.reduce((a, b) => a + b, 0), tip = paths[0][0];
    for (let j = 0; j < paths.length && left > 0; j++) {
      const p = paths[j], out = [p[0]];
      for (let i = 1; i < p.length && left > 0; i++) {
        const d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
        if (d <= left) { out.push(p[i]); left -= d; } else { const q = [lerp(p[i - 1][0], p[i][0], left / d), lerp(p[i - 1][1], p[i][1], left / d)]; out.push(q); left = 0; }
      }
      tip = out[out.length - 1];
      if (out.length > 1) inkLine(out, 1.3, '#4A4450', 'ink', 0);
    }
    return tip;
  }
  function pencil(x, y, rot = -.6, L = 170) {
    push(); translate(x, y); rotate(rot);
    paint([[0, 0], [22, -8], [22, 8]], { wash: '#F2D2A0', ink: C.ink, sw: .6 });
    paint([[0, 0], [7, -3], [7, 3]], { wash: C.ink, ink: null });
    paint(rectPts(22, -9, L - 40, 18), { wash: C.ochre, ink: C.ink, sw: .7 });
    paint(rectPts(L - 18, -9, 18, 18), { wash: C.rose, ink: C.ink, sw: .7 });
    pop();
  }
  function dressForm(x, G) {
    boilSeed('form');
    inkLine([[x, 700], [x, G - 10]], 3, C.woodDk, 'ink', 0);
    paint([[x - 70, G], [x + 70, G], [x + 40, G - 16], [x - 40, G - 16]], { wash: C.woodDk, ink: C.ink, sw: .8 });
    paint(through([[x - 70, 380], [x - 95, 480], [x - 80, 600], [x - 90, 700], [x + 90, 700], [x + 80, 600], [x + 95, 480], [x + 70, 380], [x, 360], [x - 70, 380]], 4), { wash: '#E9D3B5', ink: C.ink, sw: .8 });
  }
  function shotDesign(t, lt, dur) {
    const G = 880, FX = 1650, tIdea = 2.6, tDraw = 3.4, tColour = 7.6, tPeel = 9.0, tLand = 10.3, tSwap = 11.25, tThumb = 16.6, tWhip = 19.35;
    const zoom = lt < 1.8 ? lerp(8, 1, easeOut(seg(lt, 0, 1.8))) : 1 + .02 * Math.sin(lt * .5);
    const whip = easeIn(seg(lt, tWhip, dur));
    camBegin(lerp(JX, 960, easeOut(seg(lt, 0, 1.8))) + 2400 * whip, lerp(JY, 540, easeOut(seg(lt, 0, 1.8))), zoom);
    boilSeed('designroom');
    paint(rectPts(-800, -600, 5000, 1700), { wash: '#DCE4E6', ink: null });
    paint(rectPts(-800, G, 5000, 800), { wash: '#B9C7C9', ink: null });
    inkLine([[-800, G], [4200, G]], 1, C.ink, 'ink', 0);
    // a mood board of little sketches on the wall
    boilSeed('pins');
    for (let i = 0; i < 4; i++) { const x = 1250 + i * 150, y = 190 + (i % 2) * 40; paint(rectPts(x, y, 110, 130), { wash: C.cream, ink: C.ink, sw: .6 }); garment(x + 55, y + 70, 30, ['hoodie', 'sport', 'wind', 'shirt'][i], { sw: .4 }); }
    // the easel and paper
    boilSeed('easel');
    for (const [a, b] of [[[520, G], [620, 240]], [[1000, G], [900, 240]], [[760, G + 10], [760, 300]]]) inkLine([a, b], 4, C.woodDk, 'ink', 0);
    paint(rectPts(460, 250, 600, 490), { wash: C.wood, ink: C.ink, sw: 1 });
    paint(rectPts(480, 268, 560, 454), { wash: PAPER2, ink: C.ink, sw: .6 });
    paint(rectPts(470, 740, 580, 18), { wash: C.woodDk, ink: C.ink, sw: .8 });
    // the sketch, then its colour; after the peel only a faint ghost stays on the paper
    const sk = ease(seg(lt, tDraw, tColour - .2)), ck = seg(lt, tColour, tColour + .9);
    boilSeed('sketch');
    let tip = [JX - 1.28 * JS, JY + .22 * JS];
    if (lt < tPeel) {
      if (ck > 0) garment(JX, JY, JS, 'jacket', { col: mixCol(PAPER2, C.denim, ck), sw: lerp(.5, 1, ck) });
      if (ck < 1) tip = drawSketch(sk);
    } else inkLine(sketchPaths()[0], .5, '#B8AFA0', 'HB', 0);
    // the magic pencil: rests on the tray, wakes with the idea, draws, then bows out
    let px = 560, py = 736, pr = -.05;
    if (lt > tIdea + .2) {
      const up = easeOut(seg(lt, tIdea + .2, tDraw)), done = ease(seg(lt, tColour - .2, tColour + .5));
      px = lerp(560, tip[0], up); py = lerp(736, tip[1], up) - 30 * Math.sin(up * Math.PI); pr = lerp(-.05, -.9, up) + .15 * Math.sin(lt * 12) * (lt > tDraw && lt < tColour ? 1 : 0);
      if (done > 0) { px = lerp(tip[0], 1080, done); py = lerp(tip[1], 300, done) - 60 * Math.sin(done * Math.PI); pr = lerp(-.9, -2.2, done); }
    }
    boilSeed('pencil'); pencil(px, py, pr);
    if (lt > tDraw && lt < tColour) sparkle(px + 10, py - 10, 18, frac(lt * 3));
    // the dress form and the outfit parade
    dressForm(FX, G);
    const styles = ['jacket', 'hoodie', 'sport', 'wind', 'jacket'], si = lt < tSwap ? 0 : Math.min(4, 1 + Math.floor((lt - tSwap) / (2 * BEAT)));
    if (lt >= tPeel) {
      boilSeed('outfit');
      if (lt < tLand) {
        const k = seg(lt, tPeel, tLand), p = arcPt([JX, JY], [FX, 520], 260, ease(k));
        push(); translate(...p); rotate(Math.sin(k * Math.PI) * -.5); scale(1 - .15 * Math.sin(k * Math.PI), 1 + .1 * Math.sin(k * Math.PI));
        garment(0, 0, lerp(JS, 125, k), 'jacket'); pop();
      } else {
        const tsw = lt < tSwap ? tLand : tSwap + (si - 1) * 2 * BEAT, sq = spring(lt, tsw, 6, 20) * .12;
        push(); translate(FX, 520); scale(1 + sq, 1 - sq); garment(0, 0, 125, styles[si]); pop();
        for (let i = 0; i < 5; i++) sparkle(FX + Math.cos(i * 1.3) * 170, 520 + Math.sin(i * 1.3) * 170, 26, seg(lt, tsw, tsw + .5));
      }
    }
    // 小纺
    const u = 26, hx = 1270;
    const mood = emotions(lt, [[0, 'thinking', { lookX: -.9, lookY: -.3 }], [tIdea, 'idea'], [tDraw + .3, 'starstruck', { lookX: -.9 }], [tPeel + .2, 'surprised', { lookX: .6, lookY: -.6 }],
                               [tLand + .2, 'excited'], [tThumb, 'proud'], [tWhip - .4, 'excited']]);
    const cl = { ...mood, view: 'q', flip: lt < tPeel + .3 };
    if (lt >= tPeel + .3 && lt < tPeel + .5) Object.assign(cl, turn(lt, tPeel + .3, tPeel + .5, -.125, .125));
    if (lt > tSwap - .3 && lt < tThumb) Object.assign(cl, move('bounce', lt), { view: 'q', flip: false });
    if (lt >= tThumb && lt < tWhip) { cl.aR = 1.2 + .1 * Math.sin(lt * 3); cl.armR = (u, sw) => paint(rrPts(-u * .1, -u * .9, u * .45, u * .9, u * .18), { wash: C.denim, ink: C.ink, sw: sw * .7 }); }
    hero(hx, G, u, cl);
    camEnd();
    chapter(lt, 1.2, 7.2, '叁', '设计开发', '紧跟潮流 · 设计驱动');
    banner(lt, 11.4, 16.6, '潮流设计 · 快速打样', 960, 960, 68);
    flushLetters();
    speedLines(seg(lt, tWhip, dur) * 1.2, -1);
  }

  // ===================================================================================================
  // Shot 5 (77.5–102.5): 肆 精益制造. A big workshop: four teammates sew, a conveyor and a hanger rail carry garments
  // right; 小纺 walks the line, checks a garment, gives it the thumbs-up, and cheers as cartons are packed and stacked.
  // ===================================================================================================
  function shotFactory(t, lt, dur) {
    const G = 960, u = 26, tIn = .45;
    const w1 = stroll(lt, .4, 5.2, 260, 1150, u), w2 = stroll(lt, 8.6, 12.6, 1150, 2650, u), w3 = stroll(lt, 19, 20.6, 2650, 3350, u);
    const hx = lt < 8.6 ? w1.x : lt < 19 ? w2.x : w3.x;
    const cx = clamp(hx + 250, 960, 3300) - 2400 * (1 - easeOut(seg(lt, 0, tIn)));
    camBegin(cx, 540, 1);
    const vis = x => Math.abs(x - cx) < 1200;
    boilSeed('hall');
    paint(rectPts(cx - 1100, -200, 2200, 1500), { wash: '#EFE6D6', ink: null });
    // skylights and light shafts
    for (let i = Math.floor((cx - 1100) / 300); i < (cx + 1100) / 300; i++) {
      const x0 = i * 300; boilSeed('sky' + i);
      paint([[x0, 140], [x0, 20], [x0 + 300, 140]], { wash: C.tile, ink: C.ink, sw: .8 });
      paint([[x0 + 6, 132], [x0 + 6, 34], [x0 + 110, 100]], { wash: '#BFE0F0', ink: null });
      paint([[x0 + 20, 140], [x0 + 110, 140], [x0 + 300, 900], [x0 + 150, 900]], { wash: '#FFF8E6', washOp: 70, ink: null });
    }
    inkLine([[cx - 1100, 140], [cx + 1100, 140]], 1.2, C.ink, 'ink', 0);
    // the hanger rail
    boilSeed('rail');
    inkLine([[cx - 1100, 250], [cx + 1100, 250]], 3, C.steelDk, 'ink', 0);
    for (let i = 0; i < 18; i++) {
      const x = ((i * 260 + lt * 90) % 4680) - 200; if (!vis(x)) continue;
      boilSeed('hang' + i);
      const sway = .06 * Math.sin(lt * 3 + i);
      push(); translate(x, 250); rotate(sway);
      inkLine([[0, 0], [0, 18], [-26, 34], [26, 34], [0, 18]], .8, C.steelDk, 'inkfine', 0);
      garment(0, 34 + 42, 38, ['jacket', 'hoodie', 'sport', 'wind', 'shirt'][i % 5], { sw: .5 }); pop();
    }
    // teammates at their machines
    for (let i = 0; i < 4; i++) {
      const x = 520 + i * 620; if (!vis(x)) continue;
      const m = TEAM[i], tu = 15;
      clawd(x - 60, 690, tu, { ...feel(['determined', 'happy', 'determined', 'happy'][i], lt + i * .3), view: 'q', col: m.col, dk: m.dk, lt: m.lt, hat: m.hat, seed: i + 3, boilKey: 'mate' + i,
        aR: -.3 + .3 * Math.sin((bpOf(lt) + i * .37) * Math.PI * 2), aL: -.2 - .25 * Math.sin((bpOf(lt) + i * .37) * Math.PI * 2), lookX: .8, lookY: .5 });
      boilSeed('bench' + i);
      paint(rectPts(x - 30, 640, 170, 14), { wash: C.wood, ink: C.ink, sw: .7 });
      for (const lx of [x - 20, x + 130]) inkLine([[lx, 654], [lx, 700]], 1, C.woodDk, 'ink', 0);
      sewMachine(x + 60, 640, 24, lt + i * .2, 2);
      paint(rectPts(x + 5, 632, 70, 7), { wash: ['#A9C8E8', C.rose, C.teal, C.ochre][i], ink: null });
    }
    // the conveyor
    boilSeed('belt');
    paint(rectPts(cx - 1100, 745, Math.min(2200, 3230 - (cx - 1100)), 34), { wash: C.steelDk, ink: C.ink, sw: .9 });
    for (let x = Math.floor((cx - 1100) / 120) * 120; x < Math.min(cx + 1100, 3120); x += 120) paint(ellPts(x - (lt * 110) % 120 + 120, 762, 12, 12, 10), { wash: C.steel, ink: C.ink, sw: .5 });
    for (let i = 0; i < 12; i++) {
      const x = ((i * 330 + lt * 110) % 3960) - 300; if (!vis(x) || x > 3200) continue;
      boilSeed('item' + i);
      push(); translate(x, 728); scale(1, .55); garment(0, 0, 30, ['jacket', 'hoodie', 'sport', 'wind', 'shirt'][(i + 2) % 5], { sw: .5 }); pop();
    }
    // the floor, under the packing station, the stack and 小纺
    boilSeed('floor');
    paint(rectPts(cx - 1100, 860, 2200, 400), { wash: '#D8C7A8', ink: null });
    inkLine([[cx - 1100, 860], [cx + 1100, 860]], 1, C.ink, 'ink', 0);
    // packing: a garment drops into the open carton on each bar, the flaps fold, the carton joins the stack
    const packT = [13.2, 15.7, 18.2];
    boilSeed('pack');
    paint(rectPts(3250, 800, 260, 20), { wash: C.wood, ink: C.ink, sw: .8 });
    for (const lx of [3265, 3495]) inkLine([[lx, 820], [lx, G]], 1.4, C.woodDk, 'ink', 0);
    const bars = packT.filter(tp => lt > tp + 1.2).length;
    if (lt > 12.4) {
      const cur = packT.find(tp => lt < tp + 1.6) ?? null;
      if (cur != null) {
        const fly = seg(lt, cur, cur + .55), close = ease(seg(lt, cur + .6, cur + 1)), slide = easeIn(seg(lt, cur + 1.1, cur + 1.6));
        const bx = lerp(3380, 3700, slide);
        if (fly > 0 && fly < 1) { const p = arcPt([3180, 728], [3380, 740], 140, fly); garment(p[0], p[1], 30, 'jacket', { sw: .5 }); }
        box(bx, 800, 150, 110);
        for (const s of [-1, 1]) { const a = lerp(-2.2, 0, close) * s; push(); translate(bx + s * 75, 690); rotate(a); paint(rectPts(-(s > 0 ? 75 : 0), -8, 75, 10), { wash: C.kraft, ink: C.ink, sw: .6 }); pop(); }
      }
    }
    // the stack: one carton per bar, dropping in on the beat with a squash
    const stackN = bars + Math.max(0, Math.min(3, Math.floor((lt - 19.4) / (2 * BEAT)) + 1));
    for (let i = 0; i < stackN; i++) {
      const tIn2 = i < 3 ? packT[i] + 1.6 : 19.4 + (i - 3) * 2 * BEAT, k = seg(lt, tIn2, tIn2 + .3);
      const bx = 3700 + (i % 2) * 160, by = G - Math.floor(i / 2) * 112 - (1 - easeIn(k)) * 300, sq = spring(lt, tIn2 + .3, 7, 22) * .15;
      boilSeed('stack' + i);
      push(); translate(bx, by); scale(1 + sq, 1 - sq); box(0, 0, 150, 110); pop();
    }
    // 小纺 on the floor in front
    const mood = emotions(lt, [[0, 'determined'], [5.2, 'thinking', { lookX: -.2, lookY: -.6 }], [6.8, 'proud'], [8.4, 'happy'], [13.4, 'excited', { lookX: .7 }], [20.8, 'love']]);
    const walking = (lt > .4 && lt < 5.2) || (lt > 8.6 && lt < 12.6) || (lt > 19 && lt < 20.6), wk = lt < 8.6 ? w1 : lt < 19 ? w2 : w3;
    const cl = { ...mood };
    if (walking) Object.assign(cl, { view: 'side', walk: wk.walk, dy: wk.dy * 1.4 });
    else if (lt >= 5.2 && lt < 8.6) {   // the check: holds a jacket up, looks it over, thumbs-up
      cl.view = 'q'; cl.aL = 1.1 + .05 * Math.sin(lt * 3);
      cl.armL = (u, sw) => { push(); rotate(cl.aL - .1); garment(u * .3, -u * 1.6, u * 1.5, 'hoodie', { sw: sw * .7 }); pop(); };
      if (lt > 6.8) { cl.aR = 1.25; cl.armR = (u, sw) => paint(rrPts(-u * .1, -u * .9, u * .45, u * .9, u * .18), { wash: C.denim, ink: C.ink, sw: sw * .7 }); }
    } else if (lt >= 12.6 && lt < 19) Object.assign(cl, { view: 'q', ...(lt > 13.4 ? { aL: 1 + .4 * pulse(lt), aR: 1 + .4 * pulse(lt, 4) } : {}) });
    else if (lt >= 20.6) { cl.view = 'q'; cl.aR = .4 + .5 * pulse(lt, 5); }
    hero(hx, G, u, cl);
    camEnd();
    boilSeed('whipin');
    speedLines(1 - seg(lt, 0, tIn), -1);
    chapter(lt, .8, 6.8, '肆', '精益制造', '四大成衣工厂 · 品质如一');
    banner(lt, 13.4, 19.2, '全产业链 · 从面料到成衣', 960, 560, 64);
    flushLetters();
    boilSeed('wipe');
    if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, [C.waterDk, C.water]);
  }


  // ===================================================================================================
  // Shot 6 (102.5–127.5): 伍 绿色发展. A cutaway of the washing plant: jeans tumble, a laser brushes whiskers, a water
  // drop counts up the savings; the camera tilts up to the rooftop solar farm at sunrise, 小纺 polishes a panel,
  // shoots sprout along the eaves, and the camera pushes into the sun.
  // ===================================================================================================
  function jeans(x, y, s, rot = 0, fade = 0, col = C.denim) {
    push(); translate(x, y); rotate(rot);
    const P = pts => pts.map(([a, b]) => [a * s, b * s]), sw = clamp(s / 90, .4, 1.1);
    paint(P([[-.5, -1], [.5, -1], [.56, 1], [.12, 1], [0, -.35], [-.12, 1], [-.56, 1]]), { wash: col, ink: C.ink, sw });
    paint(P([[-.5, -1], [.5, -1], [.5, -.86], [-.5, -.86]]), { wash: mixCol(col, C.ink, .2), ink: null });
    stitch(P([[-.44, -.7], [-.2, -.7], [-.2, -.5]]), Infinity, sw * .6, C.gold, 5, 4);
    stitch(P([[.44, -.7], [.2, -.7], [.2, -.5]]), Infinity, sw * .6, C.gold, 5, 4);
    if (fade > 0) {   // laser whiskers: pale strokes fanning from the crotch, drawn up to `fade`
      for (let i = 0; i < 4; i++) { const k = clamp(fade * 4 - i); if (k <= 0) continue;
        for (const d of [-1, 1]) inkLine(P([[d * .06, -.3 + i * .06], [d * lerp(.06, .45, k), -.42 + i * .08]]), sw * 1.6, C.denimLt, 'ink', .3); }
      paint(P([[-.46, .1], [-.2, .1], [-.18, .5], [-.44, .5]]), { wash: C.denimLt, washOp: 120 * clamp(fade * 2 - 1), ink: null });
      paint(P([[.46, .1], [.2, .1], [.18, .5], [.44, .5]]), { wash: C.denimLt, washOp: 120 * clamp(fade * 2 - 1), ink: null });
    }
    pop();
  }
  function dropPts(cx, cy, r) { const P = []; for (let i = 0; i <= 20; i++) { const a = -Math.PI / 2 + i / 20 * TAU, k = Math.abs(Math.sin((a + Math.PI / 2) / 2)); P.push([cx + Math.cos(a) * r * k * 1.02, cy + Math.sin(a) * r * (a < -Math.PI / 2 + .01 || a > TAU * .75 - .01 ? 1.5 : 1)]); } return through([[cx, cy - 1.7 * r], [cx + .7 * r, cy - .5 * r], [cx + r, cy + .2 * r], [cx + .7 * r, cy + .85 * r], [cx, cy + r * 1.05], [cx - .7 * r, cy + .85 * r], [cx - r, cy + .2 * r], [cx - .7 * r, cy - .5 * r], [cx, cy - 1.7 * r]], 4); }
  function shotGreen(t, lt, dur) {
    const G = 900, tLaser = 4, tDrop = 7.8, tTilt = 11, tUp = 13.2, tPop = 13.6, tWipe = 16, tSprout = 20, tPush = 23.2;
    const cy = lt < tTilt ? 540 : lerp(540, -330, ease(seg(lt, tTilt, tUp)));
    const sun = [1450, lerp(160, -640, easeOut(seg(lt, tTilt + .5, 17)))];
    const pk = easeIn(seg(lt, tPush, dur - .1));
    camBegin(lerp(960, sun[0], ease(seg(lt, tPush, dur - .4))), lerp(cy, sun[1], ease(seg(lt, tPush, dur - .4))), lerp(1, 16, pk));
    // sky and sun
    boilSeed('gsky');
    paint(rectPts(-800, -1600, 3600, 1700), { wash: mixCol('#F7C99A', C.sky, seg(lt, 14, 19)), ink: null });
    glow(...sun, 420, '#FFD27A', .9); glow(...sun, 200, '#FFF0C0', .8);
    paint(ellPts(...sun, 110, 110, 30), { wash: '#FFE6A8', ink: null });
    // a bird crosses
    if (lt > 18.5 && lt < 23.5) { const k = seg(lt, 18.5, 23.5), bx = lerp(-100, 2000, k), by = -520 + 60 * Math.sin(k * 7), f = Math.sin(lt * 14) * 18; boilSeed('bird'); inkLine([[bx - 30, by - f], [bx, by], [bx + 30, by - f]], 1.2, C.ink, 'ink', .5); }
    // roof: slab, panels, hatch, eaves
    boilSeed('roof');
    paint(rectPts(80, 50, 1840, 100), { wash: C.tile, ink: C.ink, sw: 1 });
    for (let i = 0; i < 6; i++) {
      const x = 180 + i * 250; boilSeed('panel' + i);
      inkLine([[x + 40, 50], [x + 60, -60]], 2, C.steelDk, 'ink', 0);
      paint([[x, 40], [x + 210, 40], [x + 240, -110], [x + 30, -110]], { wash: '#2F4A7A', ink: C.ink, sw: .9 });
      for (let k = 1; k < 3; k++) inkLine([[x + 70 * k, 40], [x + 30 + 70 * k, -110]], .5, C.denimLt, 'inkfine', 0);
      inkLine([[x + 15, -35], [x + 225, -35]], .5, C.denimLt, 'inkfine', 0);
      const gl = seg(lt, 15 + i * .25, 15.6 + i * .25), wiped = i === 5 ? seg(lt, tWipe + .6, tWipe + 2.6) : 0;
      sparkle(x + 190, -90, 34, gl); if (wiped > 0) sparkle(x + 150 - 60 * Math.sin(lt * 6), -60, 30, frac(lt * 1.6));
    }
    paint(rectPts(1725, 34, 90, 16), { wash: C.steelDk, ink: C.ink, sw: .7 });
    for (let i = 0; i < 18; i++) {   // sprouts along the eaves, one after another
      const k = backOut(seg(lt, tSprout + i * .08, tSprout + .4 + i * .08)); if (k <= 0) continue;
      const x = 110 + i * 102; boilSeed('sprout' + i);
      inkLine([[x, 150], [x + 4, 150 - 34 * k]], 1, C.leafDk, 'ink', .4);
      paint(ellPts(x - 12 * k, 150 - 34 * k, 13 * k, 7 * k, 10, 0, -.5), { wash: C.leaf, ink: C.ink, sw: .5 });
      paint(ellPts(x + 16 * k, 150 - 28 * k, 12 * k, 6 * k, 10, 0, .5), { wash: '#86B96A', ink: C.ink, sw: .5 });
    }
    // energy runs down the red cable
    if (lt > 17) { boilSeed('cable'); thread([[1690, -30], [1930, -20], [1935, 150], [1935, 900]], 1.6); for (let i = 0; i < 5; i++) { const k = frac(lt * .7 + i / 5), p = k < .3 ? [lerp(1690, 1930, k / .3), -30] : [1935, lerp(-20, 900, (k - .3) / .7)]; glow(...p, 40, '#FFE27A', .9); } }
    // the cutaway interior
    boilSeed('inside');
    paint(rectPts(80, 150, 1840, 750), { wash: '#E1ECEC', ink: C.ink, sw: 1 });
    paint(rectPts(80, G, 1840, 160), { wash: '#BCCBC8', ink: C.ink, sw: 1 });
    // the washer: jeans tumble behind the porthole
    const shake = 3 * Math.sin(lt * 45) * (lt < tTilt ? 1 : 0), wx = 560 + shake, wy = 590;
    boilSeed('washer');
    paint(rrPts(wx - 250, 290, 500, 610, 30), { wash: C.steel, ink: C.ink, sw: 1 });
    paint(rectPts(wx - 230, 310, 460, 60), { wash: C.steelDk, ink: C.ink, sw: .7 });
    paint(ellPts(wx + 150, 340, 20, 20, 12), { wash: C.gold, ink: C.ink, sw: .5 });
    paint(ellPts(wx, wy + 30, 200, 200, 32), { wash: C.steelDk, ink: C.ink, sw: 1.2 });
    paint(ellPts(wx, wy + 30, 170, 170, 32), { wash: mixCol(C.water, C.cream, .3), ink: null });
    const a = lt * 2.4;
    for (let i = 0; i < 3; i++) { boilSeed('jean' + i); const aa = a + i * TAU / 3; jeans(wx + Math.cos(aa) * 80, wy + 30 + Math.sin(aa) * 80, 70, aa * 1.3 + i, 0, [C.denim, C.denimDk, '#6C93C4'][i]); }
    boilSeed('water');
    const wl = []; for (let i = 0; i <= 12; i++) { const x = wx - 165 + i * 27.5; wl.push([x, wy + 80 + 10 * Math.sin(i * .9 + lt * 6)]); }
    paint([...wl, [wx + 120, wy + 150], [wx, wy + 198], [wx - 120, wy + 150]], { wash: C.water, washOp: 150, ink: null });
    for (let i = 0; i < 6; i++) { const k = frac(lt * .8 + hash(i)), bx = wx - 100 + hash(i + 3) * 200 + 10 * Math.sin(lt * 5 + i), by = wy + 170 - k * 280; if (Math.hypot(bx - wx, by - wy - 30) < 160) paint(ellPts(bx, by, 6 + 5 * hash(i), 6 + 5 * hash(i), 10), { ink: C.cream, sw: .5 }); }
    paint(ellPts(wx - 60, wy - 50, 40, 22, 12, 0, -.6), { wash: C.cream, washOp: 150, ink: null });
    // the laser station: the head runs along its rail and brushes whiskers onto the jeans
    const LX = 1560, lk = seg(lt, tLaser, tLaser + 3.4);
    boilSeed('laser');
    paint(rectPts(LX - 230, 230, 460, 30), { wash: C.steelDk, ink: C.ink, sw: .8 });
    for (const px of [LX - 220, LX + 220]) paint(rectPts(px - 10, 230, 20, G - 230), { wash: C.steel, ink: C.ink, sw: .7 });
    jeans(LX, 590, 190, 0, lk);
    const hx = LX + 150 * Math.sin(lt * 5) * (lk > 0 && lk < 1 ? 1 : 0);
    paint(rectPts(hx - 30, 255, 60, 44), { wash: C.machine, ink: C.ink, sw: .7 });
    if (lk > 0 && lk < 1) { const ty = 500 + 40 * Math.sin(lt * 7); inkLine([[hx, 300], [hx + (LX - hx) * .3, ty]], 1.2, '#FF6A5A', 'inkfine', 0); glow(hx + (LX - hx) * .3, ty, 60, '#FF7A5A', .8); }
    // the water drop that counts the savings
    const dk = backOut(seg(lt, tDrop, tDrop + .5)) * (1 - seg(lt, tTilt + 1.2, tTilt + 1.8));
    if (dk > .02) {
      boilSeed('drop');
      push(); translate(1060, 400); scale(dk);
      paint(dropPts(0, 0, 110), { wash: C.water, ink: C.ink, sw: 1.2 });
      paint(ellPts(-40, -30, 22, 36, 12, 0, .4), { wash: C.cream, washOp: 170, ink: null });
      for (let i = 0; i < 2; i++) { const ang = lt * 2 + i * Math.PI; const P = []; for (let k = 0; k <= 8; k++) { const aa = ang + k * .16; P.push([Math.cos(aa) * 175, Math.sin(aa) * 175]); } thread(P, 2.4, C.leaf); paint(starPts(...P[8], 14, .1, 3, ang + 1.28 + Math.PI / 2), { wash: C.leaf, ink: null }); }
      pop();
      const [sx, sy] = toScreen(1060, 410);
      letter(Math.round(82 * ease(seg(lt, tDrop + .3, tDrop + 2))) + '%', sx, sy, 76 * dk, C.cream, { font: `${Math.round(76 * dk)}px "Permanent Marker"`, screen: true, ink: true });
    }
    // 小纺: watches the washer, then the laser; later pops out of the roof hatch and polishes a panel
    const u = 24;
    if (lt < tUp) {
      const mood = emotions(lt, [[0, 'happy', { lookX: -1 }], [tLaser - .2, 'starstruck', { lookX: 1, lookY: -.2 }], [tDrop + .5, 'proud']]);
      hero(1040, G, u, { ...mood, view: 'q', flip: lt < tLaser - .2 });
    } else if (lt > tPop) {
      const w = stroll(lt, tPop + .9, tWipe, 1770, 1560, 20);
      const mood = emotions(lt, [[tPop, 'surprised', { lookX: -.6, lookY: -.8 }], [tPop + .8, 'excited'], [tWipe, 'determined'], [tWipe + 2.4, 'love']]);
      const j = jump(lt, tPop, tPop + .5, 3), rise = seg(lt, tPop, tPop + .3);
      const cl = { ...mood, dy: (mood.dy || 0) + j.dy + (1 - rise) * 5, sq: (mood.sq || 0) + j.sq, view: 'q', flip: true };
      if (lt > tPop + .9 && lt < tWipe) Object.assign(cl, { walk: w.walk, dy: w.dy, view: 'side' });
      if (lt >= tWipe && lt < tWipe + 2.6) { cl.aR = .9 + .35 * Math.sin(lt * 12); cl.armR = (u, sw) => paint(ellPts(u * .5, 0, u * .7, u * .45, 10), { wash: C.cream, ink: C.ink, sw: sw * .6 }); }
      hero(lt < tPop + .9 ? 1770 : w.x, 40, 20, cl);
    }
    camEnd();
    chapter(lt, .8, 6.8, '伍', '绿色发展', '节能减排 · 可持续供应链');
    banner(lt, tDrop + .2, tTilt + .6, '洗水节水82% · 年均节电20%', 960, 1000, 60);
    banner(lt, 15.4, 21.6, '屋顶光伏 1450.5千瓦', 720, 170, 70);
    cap(lt, 16.4, 21.6, '年发电约170万千瓦时', 720, 265, 44, C.redDk);
    flushLetters();
    boilSeed('gwipein');
    if (lt < .3) brushWipe(.5 + lt / .6, [C.waterDk, C.water]);
  }

  // ===================================================================================================
  // Shot 7 (127.5–150): 陆 连通全球. Out of the sun, a painted globe: 小纺 stands on top as red threads fly from Shunde to
  // the world, one per beat. A brush wipe to the harbour: the last container is craned aboard, the horn sounds, and the
  // ship sails off trailing 小纺's red thread. The camera tilts up into the first fireworks.
  // ===================================================================================================
  const LAND = [   // rough continents on the globe disk, in units of r
    [[-.75, -.55], [-.3, -.62], [-.25, -.35], [-.38, -.12], [-.55, -.05], [-.72, -.25]],
    [[-.42, .05], [-.2, .12], [-.18, .35], [-.3, .66], [-.38, .45]],
    [[-.05, -.62], [.2, -.66], [.22, -.42], [.02, -.36]],
    [[-.05, -.28], [.25, -.3], [.32, .05], [.18, .48], [.05, .2], [-.08, -.05]],
    [[.25, -.7], [.8, -.55], [.82, -.18], [.62, .05], [.45, -.08], [.3, -.3]],
    [[.5, .38], [.78, .36], [.8, .6], [.55, .62]],
  ];
  const ORIGIN = [.6, -.1], DEST = [[.08, -.52], [-.55, -.35], [.74, -.36], [-.3, .38], [.2, .1], [.66, .5], [-.62, -.12], [.3, -.22]];
  function globe(cx, cy, r, lt) {
    boilSeed('globe');
    const oc = mixCol('#FFE6A8', C.sea, seg(lt, .1, 1.1));
    paint(ellPts(cx, cy, r, r, 48), { wash: oc, ink: C.ink, sw: 1.2 });
    for (const la of [-.5, 0, .5]) inkLine(ellPts(cx, cy + la * r, r * Math.sqrt(1 - la * la), r * .12, 30).concat([[cx + r * Math.sqrt(1 - la * la), cy + la * r]]), .5, mixCol(oc, C.cream, .4), 'inkfine', .5);
    LAND.forEach((P, i) => { boilSeed('land' + i); paint(through(P.concat([P[0]]).map(([a, b]) => [cx + a * r, cy + b * r]), 4), { wash: mixCol(oc, '#9CC486', seg(lt, .3, 1.2)), ink: C.ink, sw: .6 }); });
    paint(ellPts(cx - r * .35, cy - r * .4, r * .3, r * .16, 16, 0, -.6), { wash: C.cream, washOp: 60, ink: null });
  }
  function pin(x, y, s, k) { if (k <= 0) return; const sc = backOut(k); paint(dropPts(x, y - 26 * s * sc, 12 * s * sc).map(([a, b]) => [a, 2 * (y - 26 * s * sc) - b]), { wash: C.red, ink: C.ink, sw: .6 }); paint(ellPts(x, y - 26 * s * sc + 2, 4 * s * sc, 4 * s * sc, 8), { wash: C.cream, ink: null }); }
  function ship(x, y, lt, o = {}) {   // waterline at y
    boilSeed('ship');
    paint([[x - 470, y - 110], [x + 520, y - 110], [x + 440, y + 40], [x - 430, y + 40]], { wash: '#2F3440', ink: C.ink, sw: 1 });
    paint([[x - 440, y + 5], [x + 460, y + 5], [x + 440, y + 40], [x - 430, y + 40]], { wash: C.redDk, ink: null });
    inkLine([[x - 460, y - 88], [x + 505, y - 88]], 1, C.cream, 'inkfine', 0);
    paint(rectPts(x - 440, y - 290, 150, 180), { wash: C.cream, ink: C.ink, sw: .9 });
    for (let k = 0; k < 3; k++) paint(rectPts(x - 430 + k * 45, y - 270, 32, 22), { wash: '#6F9FC0', ink: null });
    paint(rectPts(x - 400, y - 380, 60, 90), { wash: C.cream, ink: C.ink, sw: .8 });
    paint(rectPts(x - 400, y - 370, 60, 22), { wash: C.red, ink: null });
    const cols = [C.teal, C.ochre, C.rose, C.denim, '#8C79C2', C.red, C.leaf, C.teal, C.denim, C.ochre, C.rose];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) {
      if (r === 1 && c === 4 && !o.last) continue;
      const bx = x - 250 + c * 125, by = y - 110 - r * 75;
      boilSeed('cont' + r + c);
      paint(rectPts(bx, by - 72, 120, 72, 1), { wash: r === 1 && c === 4 ? C.kraft : cols[r * 5 + c], ink: C.ink, sw: .7 });
      for (let k = 1; k < 5; k++) inkLine([[bx + k * 24, by - 66], [bx + k * 24, by - 6]], .4, C.ink, 'inkfine', 0);
    }
  }
  function firework(x, y, age, col, n = 14) {
    if (age < 0 || age > 1.6) return;
    const R = 220 * easeOut(clamp(age / .9)), fade = 1 - seg(age, 1, 1.6);
    boilSeed('fw' + x);
    glow(x, y, R * 1.2, col, .6 * fade);
    for (let i = 0; i < n; i++) { const a = i / n * TAU + x; inkLine([[x + Math.cos(a) * R * .55, y + Math.sin(a) * R * .55 + age * 30], [x + Math.cos(a) * R, y + Math.sin(a) * R + age * 60]], 2.2 * fade, col, 'ink', 0); }
  }
  function shotGlobal(t, lt, dur) {
    const tWipe = 8.1, b = lt - (tWipe + .3);
    if (b < 0) {
      const zoom = lt < 1.6 ? lerp(12, 1, easeOut(seg(lt, 0, 1.6))) : 1 + .01 * lt;
      camBegin(960, lerp(640, 560, easeOut(seg(lt, 0, 1.6))), zoom);
      boilSeed('space');
      paint(rectPts(-600, -600, 3100, 2300), { wash: '#1E2B55', ink: null });
      for (let i = 0; i < 50; i++) { boilSeed('gs' + i); const tw = .6 + .4 * Math.sin(lt * 2.5 + i * 1.7); paint(starPts(hash(i) * 2000 - 40, hash(i + 70) * 1100, (3 + 4 * hash(i + 3)) * tw, .35), { wash: C.cream, washOp: 200, ink: null }); }
      const GX = 960, GY = 640, R = 330;
      glow(GX, GY, R * 1.5, '#7FB8E8', .35);
      globe(GX, GY, R, lt);
      const o = [GX + ORIGIN[0] * R, GY + ORIGIN[1] * R];
      DEST.forEach((d, i) => {
        const t0 = 1.9 + i * BEAT, k = seg(lt, t0, t0 + .55); if (k <= 0) return;
        const e = [GX + d[0] * R, GY + d[1] * R], h = 90 + 60 * hash(i), P = [];
        for (let j = 0; j <= 16; j++) { const q = j / 16 * easeOut(k); P.push(arcPt(o, e, h, q)); }
        boilSeed('route' + i); thread(P, 1.8);
        if (k < 1) glow(...P[16], 30, '#FFE27A', 1); else { pin(...e, 1, seg(lt, t0 + .55, t0 + .85)); sparkle(e[0], e[1] - 30, 24, seg(lt, t0 + .55, t0 + 1)); }
      });
      pin(...o, 1.3, seg(lt, 1.3, 1.6)); glow(...o, 40, '#FF9A7A', .7 + .3 * Math.sin(lt * 6));
      const mood = emotions(lt, [[0, 'surprised', { lookX: .6, lookY: .5 }], [1.6, 'excited', { lookX: .5, lookY: .8 }], [6.8, 'proud']]);
      hero(GX, GY - R + 6, 18, { ...mood, rot: .04 * Math.sin(lt * 1.3), aR: lt > 1.6 && lt < 6.8 ? 1.2 + .2 * pulse(lt) : mood.aR });
      camEnd();
      chapter(lt, .9, 5.4, '陆', '连通全球', '专业进出口服务');
      banner(lt, 5.5, tWipe + .3, '产品远销全球 · 服务知名服饰品牌', 960, 1010, 56);
      flushLetters();
    } else {
      const shipX = lerp(1250, 3300, easeIn(seg(b, 5.2, 13.5))), SEA = 760;
      const tilt = ease(seg(b, 11.6, 13.4));
      camBegin(lerp(960, 1180, ease(seg(b, 4.5, 9))), lerp(540, -380, tilt), lerp(1, .9, ease(seg(b, 4.5, 9))));
      boilSeed('hsky');
      paint(rectPts(-800, -1400, 3600, 2200), { wash: mixCol('#F6D9B0', '#3B3D6E', tilt), ink: null });
      paint(ellPts(1500, SEA, 900, 120, 26), { wash: mixCol('#F2C6A0', '#4B4A7A', tilt), ink: null });
      // fireworks as the camera reaches the sky
      firework(700, -700, b - 12.4, C.gold); firework(1300, -820, b - 12.9, C.red); firework(1000, -560, b - 13.3, C.rose);
      // crane
      boilSeed('crane');
      paint(rectPts(500, 140, 44, SEA - 140), { wash: C.ochre, ink: C.ink, sw: .9 });
      for (let k = 0; k < 7; k++) inkLine([[500, 160 + k * 85], [544, 200 + k * 85]], .8, C.ink, 'inkfine', 0);
      paint(rectPts(420, 150, 1100, 34), { wash: C.ochre, ink: C.ink, sw: .9 });
      const lower = ease(seg(b, .3, 3)), swing = .05 * Math.sin(b * 3) * (1 - seg(b, 3, 3.6)), trolley = 1330;
      const cy2 = lerp(300, SEA - 110 - 75 - 36, lower) + (b > 3 ? 4 * spring(b, 3, 6, 18) : 0), ccx = trolley + Math.sin(swing) * (cy2 - 184);
      paint(rectPts(trolley - 30, 184, 60, 26), { wash: C.machine, ink: C.ink, sw: .7 });
      if (b < 3.6) {
        inkLine([[trolley, 210], [ccx, cy2 - 36]], 1, C.ink, 'inkfine', 0);
        boilSeed('lastbox'); paint(rectPts(ccx - 60, cy2 - 36, 120, 72, 1), { wash: C.kraft, ink: C.ink, sw: .7 }); inkLine([[ccx - 60, cy2], [ccx + 60, cy2]], 1.2, C.red, 'ink', 0);
      } else inkLine([[trolley, 210], [trolley, lerp(SEA - 260, 300, seg(b, 3.6, 4.4))]], 1, C.ink, 'inkfine', 0);
      // ship, sea, dock
      const bob = 5 * Math.sin(b * 1.4);
      push(); translate(0, bob); ship(shipX, SEA, b, { last: b >= 3.6 }); pop();
      if (b > 3.6 && b < 3.9) sparkle(shipX + 310, SEA - 250, 40, seg(b, 3.6, 3.9));
      if (b > 4.2 && b < 6) { for (let i = 0; i < 3; i++) { const k = seg(b, 4.2 + i * .2, 5.4 + i * .2); if (k > 0 && k < 1) { boilSeed('puff' + i); paint(ellPts(shipX - 370 + 20 * k, SEA - 400 - 120 * k, 30 + 30 * k, 22 + 20 * k, 14), { wash: C.cream, washOp: 230 * (1 - k), ink: null }); } } }
      boilSeed('sea');
      paint(rectPts(-800, SEA, 3600, 900), { wash: C.sea, washOp: 235, ink: null });
      for (let i = 0; i < 22; i++) { boilSeed('hw' + i); const wx = -600 + hash(i) * 3200 + ((b * 40 * (1 + hash(i + 2))) % 200), wy = SEA + 30 + hash(i + 5) * 260; inkLine([[wx, wy], [wx + 40, wy - 8], [wx + 80, wy]], .9, C.cream, 'inkfine', .5); }
      if (b > 5.2) for (let i = 0; i < 4; i++) { boilSeed('wake' + i); const wx = shipX - 470 - i * 70; inkLine([[wx, SEA + 30 + i * 8], [wx - 60, SEA + 24 + i * 8]], 1, C.cream, 'inkfine', 0); }
      boilSeed('dock');
      paint(rectPts(-800, SEA - 40, 1300, 90), { wash: C.steel, ink: C.ink, sw: 1 });
      for (const bx of [80, 300]) paint(rrPts(bx - 14, SEA - 70, 28, 32, 8), { wash: C.machine, ink: C.ink, sw: .6 });
      // gulls
      for (let i = 0; i < 2; i++) { const gx = lerp(-100, 2400, frac(b * .05 + i * .4)), gy = 260 + i * 90 + 20 * Math.sin(b + i), f = Math.sin(b * 10 + i) * 14; boilSeed('gull' + i); inkLine([[gx - 24, gy - f], [gx, gy], [gx + 24, gy - f]], 1, C.ink, 'ink', .5); }
      // 小纺 signals the crane, cheers the landing, then waves the ship off; its thread trails behind the stern
      const u = 22, hx = 360, gy = SEA - 40;
      const mood = emotions(b, [[-1, 'determined', { lookX: .8, lookY: -.6 }], [3.7, 'excited'], [5.4, 'hopeful', { lookX: .9 }], [10.5, 'love']]);
      const cl = { ...mood, view: 'q' };
      if (b < 3.6) { cl.aL = .5 + .7 * Math.sin(b * 5); cl.aR = .5 - .7 * Math.sin(b * 5); }
      if (b > 5.8 && b < 10.5) cl.aR = 1.2 + .5 * Math.sin((b - 5.8) * 11);
      if (b > 5) { boilSeed('trail'); const top = [hx + 30, gy - 12 * u], st = [shipX - 470, SEA - 100 + bob], mid = [lerp(top[0], st[0], .5), Math.max(top[1], st[1]) + 90 + 40 * Math.sin(b)]; thread(through([top, mid, st], 8), 1.6); }
      hero(hx, gy, u, cl);
      camEnd();
      banner(b, 5.4, 11, '专业进出口服务 · 连接世界', 960, 990, 60);
      flushLetters();
    }
    boilSeed('gwipe');
    if (lt > tWipe && lt < tWipe + .6) brushWipe((lt - tWipe) / .6, [C.waterDk, C.sea]);
    if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, [C.red, C.gold]);
  }

  // ===================================================================================================
  // Shot 8 (150–167.5): 柒 携手共进. Three honours drop onto a red garland, one every two beats; the whole team cheers,
  // jumps for the group photo (flash, confetti), and 小纺's red thread runs through every teammate's hat.
  // ===================================================================================================
  const HON = [[820, '2004', '纺织商会会长企业'], [1220, '2019', '行业杰出贡献奖'], [1620, '2022', '顺德区百强企业']];
  const sagY = x => 200 + 130 * (1 - ((x - 960) / 1060) ** 2);
  const MATES = [[330, 0], [540, 1], [750, 2], [1170, 3], [1380, 4], [1590, 5]];
  function shotTeam(t, lt, dur) {
    const G = 900, tDrop = [1.9, 3.15, 4.4], tPhoto = 7.4, tFlash = 9.3, tThread = 12.4, tLove = 14.2;
    camBegin(960, 540 + 4 * Math.sin(lt), 1 + .015 * lt);
    boilSeed('stage');
    paint(rectPts(-200, -200, 2400, 1500), { wash: '#F6E4CA', ink: null });
    for (let i = 0; i < 5; i++) paint(rectPts(-100 + i * 480, -100, 200, 1000), { wash: '#F1D9B8', ink: null });
    paint(rectPts(-200, G, 2400, 400), { wash: '#DDBF93', ink: null });
    inkLine([[-200, G], [2200, G]], 1, C.ink, 'ink', 0);
    boilSeed('garland');
    const GP = []; for (let x = -100; x <= 2020; x += 20) GP.push([x, sagY(x)]);
    thread(GP, 2.2);
    HON.forEach(([x, yr, txt], i) => {
      const k = seg(lt, tDrop[i], tDrop[i] + .4); if (k <= 0) return;
      const y = sagY(x), dy = -500 * (1 - easeIn(k)), sw = .25 * spring(lt, tDrop[i] + .4, 3, 9);
      boilSeed('medal' + i);
      push(); translate(x, y + dy); rotate(sw);
      paint([[-30, 0], [-6, 0], [-18, 70], [-40, 60]], { wash: C.red, ink: C.ink, sw: .7 });
      paint([[30, 0], [6, 0], [18, 70], [40, 60]], { wash: C.redDk, ink: C.ink, sw: .7 });
      paint(ellPts(0, 118, 70, 70, 30), { wash: C.gold, ink: C.ink, sw: 1 });
      paint(ellPts(0, 118, 55, 55, 30), { ink: C.goldDk, sw: .6 });
      paint(starPts(0, 96, 16, .45, 5), { wash: C.cream, ink: null });
      pop();
      const [sx, sy] = toScreen(x + Math.sin(sw) * -118, y + dy + 128 + 4);
      letter(yr, sx, sy, 30, C.redDk, { font: '30px "Permanent Marker"', rot: sw, screen: true, ink: false });
      if (k >= 1) sparkle(x + 60, y + 60, 34, seg(lt, tDrop[i] + .4, tDrop[i] + .8));
      cap(lt, tDrop[i] + .35, tPhoto + 1.2, txt, x, y + 215, 40, C.ink);
    });
    // confetti after the flash
    if (lt > tFlash) for (let i = 0; i < 46; i++) {
      const a = lt - tFlash - hash(i) * .6; if (a < 0) continue;
      const x = hash(i + 11) * 2000 - 40 + 40 * Math.sin(a * 3 + i), y = -60 + a * (170 + 90 * hash(i + 5));
      if (y > G + 40) continue;
      boilSeed('cf' + i);
      push(); translate(x, y); rotate(a * 5 + i); paint(rectPts(-9, -5, 18, 10), { wash: [C.red, C.gold, C.teal, C.rose, C.denim][i % 5], ink: null }); pop();
    }
    // the team
    const jumpAt = (x) => tPhoto + .6 + (x / 1920) * .5;
    const tops = [];
    const huddle = ease(seg(lt, tLove - .2, tLove + 1.2));
    MATES.forEach(([x0, m], i) => {
      const M = TEAM[m], x = lerp(x0, lerp(x0, 960, .22), huddle), u = 19;
      let o = { ...feel(lt > tLove ? 'love' : lt > tPhoto ? 'excited' : 'happy', lt + i * .23, lt < tPhoto ? { lookY: -.8, lookX: (1220 - x) / 900 } : {}) };
      for (const td of tDrop) { const tk = take(lt, td + .35 + i * .04, .6); o.sq = (o.sq || 0) + tk.sq; o.dy = (o.dy || 0) + tk.dy; }
      const j = jump(lt, jumpAt(x0), jumpAt(x0) + .55, 3); o.dy = (o.dy || 0) + j.dy; o.sq = (o.sq || 0) + j.sq;
      clawd(x, G, u, { ...o, col: M.col, dk: M.dk, lt: M.lt, hat: M.hat, seed: i + 5, boilKey: 'tm' + i, flip: x0 > 960 && lt < tPhoto });
      tops.push([x, G + (o.dy || 0) * u - 8 * u * (1 - (o.sq || 0)) - 2 * u]);
    });
    const hm = emotions(lt, [[0, 'happy', { lookY: -.8, lookX: .3 }], [tPhoto, 'excited'], [tFlash + .4, 'laugh'], [tThread, 'determined'], [tLove, 'love']]);
    const hj = jump(lt, jumpAt(960), jumpAt(960) + .6, 3.4);
    for (const td of tDrop) { const tk = take(lt, td + .35, .7); hm.sq += tk.sq; hm.dy += tk.dy; }
    hero(960, G, 24, { ...hm, dy: hm.dy + hj.dy, sq: hm.sq + hj.sq });
    // the thread through every hat
    const tk = seg(lt, tThread, tThread + 1.6);
    if (tk > 0) {
      const hero0 = [960, G + (hm.dy + hj.dy) * 24 - 11.5 * 24];
      const L = tops.filter(p => p[0] < 960).sort((a, b) => b[0] - a[0]), R = tops.filter(p => p[0] > 960).sort((a, b) => a[0] - b[0]);
      boilSeed('teamthread');
      for (const side of [L, R]) { const P = [hero0, ...side.slice(0, Math.ceil(tk * side.length + .001))]; if (P.length > 1) thread(through(P, 6).slice(0, Math.max(2, Math.round((P.length - 1) * 6 * Math.min(1, tk * side.length / (P.length - 1))) + 1)), 1.8); }
    }
    camEnd();
    chapter(lt, .5, 6.6, '柒', '携手共进', '四十年荣誉与坚守');
    banner(lt, tFlash + .4, tThread + 1.6, '携手同心 · 共赢未来', 960, 575, 60);
    flushLetters();
    boilSeed('photoflash');
    if (lt > tFlash - .05 && lt < tFlash + .5) flash(1 - seg(lt, tFlash, tFlash + .5));
    if (lt < .3) brushWipe(.5 + lt / .6, [C.red, C.gold]);
    if (lt > dur - .4) clothWipe((lt - (dur - .4)) / .8, C.red, C.redDk, C.cream);
  }

  // ===================================================================================================
  // Shot 9 (167.5–180): the end rhymes with the opening. Paper, the red running stitch, the name and the seal again,
  // the slogan; 小纺 walks in along the thread, bows, and ties the thread into a bow. Iris out on the bow.
  // ===================================================================================================
  function bowKnot(x, y, k) {
    if (k <= 0) return;
    const s = 60 * backOut(k);
    boilSeed('bowknot');
    for (const d of [-1, 1]) {
      thread(through([[x, y], [x + d * s * .9, y - s * .7], [x + d * s * 1.4, y - s * .1], [x + d * s * .9, y + s * .35], [x, y]], 6), 2.4);
      thread([[x, y], [x + d * s * .4, y + s * .6], [x + d * s * .7, y + s * 1.2]], 2.2);
    }
    paint(ellPts(x, y, 10, 10, 10), { wash: C.red, ink: C.redDk, sw: .7 });
  }
  function shotEnd(t, lt, dur) {
    const tWalk = .3, tStop = 2.8, tBow = 5.4, tTie = 7.2, tIris = 10.2, KX = 960, KY = threadY(960) - 6;
    camBegin(960, 540, kf(lt, [[0, 1.03], [dur, 1]]));
    boilSeed('paperwash');
    paint(ellPts(960, 420, 900, 330, 26, 8), { wash: '#F7EFE0', washOp: 140, ink: null });
    const P = []; for (let x = -200; x <= 2200; x += 8) P.push([x, threadY(x)]);
    boilSeed('stitch'); stitch(P);
    titleBlock(lt, .9);
    const [sx, sy] = toScreen(1455, 330), sealS = 120 * CAM.zoom;
    cap(lt, 2.9, 99, '一线相牵 · 织就未来', 960, 480, 66, C.red);
    cap(lt, 3.9, 99, '佛山市顺德区顺纺（集团）有限公司', 960, 560, 38, C.ink);
    // the thread from 小纺's spool to the bow
    const u = 26, w = stroll(lt, tWalk, tStop, -220, 470, u), hx = w.x;
    const tk = ease(seg(lt, tTie - .4, tTie + .6));
    if (lt > tTie - .4) { boilSeed('tie'); thread(through([[hx + 60, threadY(hx) - 11 * u], [lerp(hx + 60, KX, .5), KY - 60 * (1 - tk) + 30], [lerp(hx + 60, KX, tk), lerp(threadY(hx) - 11 * u, KY, tk)]], 6), 1.8); }
    bowKnot(KX, KY, seg(lt, tTie + .5, tTie + 1));
    sparkle(KX + 70, KY - 60, 36, seg(lt, tTie + .9, tTie + 1.4));
    const mood = emotions(lt, [[0, 'happy'], [tStop + .2, 'proud', { lookX: .5, lookY: -.8 }], [tBow, 'relieved'], [tTie - .6, 'determined', { lookX: 1, lookY: .4 }], [tTie + 1, 'love']]);
    const cl = { ...mood };
    if (lt < tStop) Object.assign(cl, { view: 'side', walk: w.walk, dy: w.dy });
    const bow = Math.sin(Math.PI * seg(lt, tBow, tBow + 1.1));
    cl.rot = (cl.rot || 0) + .38 * bow; cl.sq = (cl.sq || 0) + .12 * bow; cl.aL = lerp(cl.aL ?? .2, -1, bow); cl.aR = lerp(cl.aR ?? .2, -1, bow);
    if (lt > tTie - .6 && lt < tTie + 1) cl.aR = .6 + .3 * Math.sin(lt * 8);
    hero(hx, threadY(hx) + 2, u, { ...cl, noShadow: true });
    const at = toScreen(KX, KY);
    camEnd();
    seal(sx, sy, sealS, ['顺', '纺'], seg(lt, 1.95, 2.2));
    flushLetters();
    boilSeed('iris');
    if (lt < .3) clothWipe(.5 + lt / .8, C.red, C.redDk, C.cream);
    if (lt > tIris) { const r = lt < tIris + .7 ? lerp(1500, 220, ease(seg(lt, tIris, tIris + .7))) : lt < dur - .5 ? lerp(220, 200, seg(lt, tIris + .7, dur - .5)) : lerp(200, 0, easeIn(seg(lt, dur - .5, dur - .1))); iris(...at, r); }
  }

  // placeholders for the rest while building
  function todo(t, lt, dur) { paint(rectPts(-60, -60, W + 120, H + 120), { wash: C.sky, ink: null }); hero(960, 860, 24, feel('happy', lt)); }

  shots([[0, shotTitle], [15, shotOrigin], [37.5, shotFabric], [57.5, shotDesign], [77.5, shotFactory], [102.5, shotGreen], [127.5, shotGlobal], [150, shotTeam], [167.5, shotEnd]]);
})();
