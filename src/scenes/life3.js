// life3.js: "A Life", the 3-minute version (155.75 s), over assets/life3_narration.mp3. See STORYBOARD3.md.
// Eight shots in one world seen through one day: birth at night → childhood at dawn → school at noon → love in the
// afternoon → grey adulthood and a rainy night → parenthood as the sky clears → old age at sunset → night, and a glow
// that opens the next life. All times are VIDEO times, from the real speech (script/life3_subtitles.srt).
(() => {
  // ---------- palette and characters ----------
  const C = {
    dark: '#15121E', glowW: '#FFD58A',
    dawn: '#F2C4A8', dawnHi: '#F7DCC0', dawnHill: '#A9C77F', dawnHill2: '#C6D79A',
    noon: '#A8D5EE', noonHi: '#D3ECF6', grass: '#86B764', grass2: '#A5C97C', aft: '#F3D9A4', aftHi: '#FBEBC8',
    grey: '#A3AAB5', greyDk: '#6F7682', road: '#8B877E', town: '#8C94A0',
    dusk: '#F0A267', duskHi: '#F6C98C', duskHill: '#B98A55', rust: '#DE8440',
    night: '#1C2248', nightHill: '#2C3659', puddle: '#9CCBE6',
    trunk: '#7A5234', leaf: '#5E9E4E', butter: '#F7D24A', butter2: '#F0A13A', box: '#C9A06A', boxDk: '#9C7646', wood: '#B98556',
  };
  const PARTNER = { col: '#5FA9A2', dk: '#3D7B76', lt: '#9AD3CB' };
  const LITTLE = { col: '#EB9A77', dk: '#B8664A', lt: '#F8C3A8' };
  const GREYC = '#B5ADA6';
  const aged = (c, k = .45) => ({ col: mixCol(c.col, GREYC, k), dk: mixCol(c.dk, '#7E7670', k), lt: mixCol(c.lt, '#D8D2CC', k) });
  const OLD = aged({ col: PAL.clay, dk: PAL.clayDk, lt: '#F5B394' }), OLDP = aged(PARTNER);
  const HILL = [860, 1180, 1250, 360], TX = 1450, FAR = [1750, 1150, 800, 300];

  const add = (a, b) => ({ ...a, ...b, dy: (a.dy || 0) + (b.dy || 0), sq: (a.sq || 0) + (b.sq || 0), rot: (a.rot || 0) + (b.rot || 0) });
  function armTip(x, y, u, o, which) {   // front-view arm tip of clawd(x, y, u, o), in world px
    const a = which === 'L' ? (o.aL ?? .2) : (o.aR ?? .2), dir = which === 'L' ? -1 : 1, sq = o.sq || 0;
    const px = dir * (4.9 + .55 * clamp((Math.abs(a) - .7) / .9)) + dir * 2.2 * Math.cos(a), py = -4.5 - 2.2 * Math.sin(a);
    return [x + (o.dx || 0) * u + px * u * (1 + sq * .6), y + (o.dy || 0) * u + py * u * (1 - sq)];
  }
  const headTop = (y, u, o) => y + (o.dy || 0) * u - 8 * u * (1 - (o.sq || 0));
  const hillY = (x, cx, cy, rx, ry) => cy - ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));
  const SW = u => clamp(u / 15, .45, 2.4);

  // ---------- set pieces ----------
  function sky(col, hi, key = 'sky') {
    // the flat base goes straight onto the canvas: under software WebGL p5.brush can drop a frame's first big wash
    push(); noStroke(); fill(col); rect(-900, -2400, W + 1800, H + 3000); pop();
    boilSeed(key);
    paint(ellPts(W * .62, 120, W * .55, 330, 26, 12), { wash: hi, washOp: 120, ink: null });
  }
  function hill(cx, cy, rx, ry, col, t, tufts = 0, key = '') {
    boilSeed('hill' + cx + key);
    paint(ellPts(cx, cy, rx, ry, 44, 2), { wash: col, ink: PAL.ink, sw: 1 });
    for (let i = 0; i < tufts; i++) {
      const a = -Math.PI / 2 + (hash(i + cx) - .5) * 1.5, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry + 5, s = wob(t, .45, hash(i) * 3) * 5;
      for (const k of [-1, 1]) inkLine([[x + k * 6, y], [x + k * 10 + s, y - 20 - 7 * hash(i + k)]], .7, mixCol(col, PAL.ink, .35), 'inkfine', .4);
    }
  }
  function sun(x, y, r, col = '#FFE7A6', g = .7) {
    if (g > 0) glow(x, y, r * 3.2, '#FFD27A', g);
    boilSeed('sun');
    paint(ellPts(x, y, r, r, 26, 1.5), { wash: col, ink: PAL.ink, sw: .7 });
  }
  function cloud(x, y, s, col, key) {
    boilSeed('cloud' + key);
    paint([[-1.6, .4], [-1.5, -.2], [-.9, -.6], [-.3, -1], [.5, -.9], [1, -.4], [1.6, -.2], [1.7, .4]].map(([a, b]) => [x + a * s, y + b * s]), { wash: col, ink: PAL.ink, sw: .8, curv: .8 });
  }
  function stars(t, n, y0, y1) {
    for (let i = 0; i < n; i++) {
      boilSeed('st' + i);
      const x = hash(i + 7) * (W + 400) - 200, y = lerp(y0, y1, hash(i + 90)), tw = .55 + .45 * Math.sin(t * (1.6 + 2 * hash(i + 30)) + i);
      paint(starPts(x, y, (3 + 5 * hash(i + 60)) * tw, .35, 4), { wash: PAL.cream, ink: null });
    }
  }
  function butterfly(x, y, s, t, o = {}) {
    boilSeed('butterfly' + (o.key || ''));
    if (o.light) glow(x, y, s * 4, '#FFE27A', o.light);
    const flap = o.rest ? .45 + .12 * Math.sin(t * 2.6) : .15 + .85 * Math.abs(Math.sin(t * 15));
    push(); translate(x, y); rotate(o.rot || 0);
    for (const d of [-1, 1]) {
      const w = s * flap * d;
      paint([[0, -s * .1], [w * .7, -s * 1.05], [w * 1.25, -s * .75], [w * 1.1, -s * .05]], { wash: C.butter, ink: PAL.ink, sw: .55, curv: .6 });
      paint([[0, s * .05], [w * .95, s * .15], [w * .75, s * .7], [w * .2, s * .55]], { wash: C.butter2, ink: PAL.ink, sw: .5, curv: .6 });
    }
    inkLine([[0, -s * .35], [0, s * .5]], .9, PAL.ink, 'ink', 0);
    inkLine([[0, -s * .35], [-s * .25, -s * .8]], .5, PAL.ink, 'inkfine', .3);
    inkLine([[0, -s * .35], [s * .25, -s * .8]], .5, PAL.ink, 'inkfine', .3);
    pop();
  }
  const flight = (t, keys, amp = 22) => { const [x, y] = kf(t, keys); return [x + amp * .6 * Math.sin(t * 5.3), y + amp * Math.sin(t * 7.9) * Math.abs(Math.sin(t * 2.1))]; };
  function flower(x, y, h, k, t, key, col = '#F08EA6') {
    boilSeed('flower' + key);
    const sway = .05 * Math.sin(t * 1.3 + x), tx = x + h * sway, ty = y - h, sw = clamp(h / 150, .5, 2.2);
    inkLine([[x, y], [x + h * sway * .4, y - h * .5], [tx, ty]], 1.1 * sw, '#4F7F3E', 'ink', .5);
    paint(ellPts(x + h * .12, y - h * .4, h * .13, h * .05, 10, 0, -.6), { wash: '#6FA353', ink: PAL.ink, sw: .5 * sw });
    const r = h * (.1 + .22 * k);
    if (k < .05) { paint(ellPts(tx, ty, h * .07, h * .11, 12), { wash: '#E27A92', ink: PAL.ink, sw: .6 * sw }); return [tx, ty]; }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * .15; paint(ellPts(tx + Math.cos(a) * r * .9, ty + Math.sin(a) * r * .9, r * .62, r * .42, 12, 0, a), { wash: col, ink: PAL.ink, sw: .55 * sw }); }
    paint(ellPts(tx, ty, r * .45, r * .45, 12), { wash: PAL.ochre, ink: PAL.ink, sw: .55 * sw });
    return [tx, ty];
  }
  function tree(x, y, s, leaf, t, bare = false) {
    boilSeed('tree');
    paint([[x - .18 * s, y + 10], [x - .1 * s, y - .6 * s], [x - .35 * s, y - .95 * s], [x - .05 * s, y - .8 * s], [x + .02 * s, y - 1.05 * s], [x + .1 * s, y - .75 * s], [x + .38 * s, y - .9 * s], [x + .12 * s, y - .55 * s], [x + .2 * s, y + 10]],
      { wash: bare ? mixCol(C.trunk, C.night, .5) : C.trunk, ink: PAL.ink, sw: .9, curv: .3 });
    if (bare) return;
    const sw = .015 * Math.sin(t * .9);
    boilSeed('canopy');
    for (const [dx, dy, r] of [[-.35, -1.05, .38], [.3, -1.1, .4], [0, -1.35, .45]]) paint(ellPts(x + (dx + sw) * s, y + dy * s, r * s, r * s * .8, 26, 3), { wash: leaf, ink: PAL.ink, sw: .9 });
  }
  function box(x, y, u, rot = 0, key = '', col = C.box) {   // (x, y) = bottom centre
    boilSeed('box' + key);
    push(); translate(x, y); rotate(rot);
    paint(rectPts(-2.4 * u, -3 * u, 4.8 * u, 3 * u, u * .06), { wash: col, ink: PAL.ink, sw: SW(u) * .8 });
    paint(rectPts(-.4 * u, -3 * u, .8 * u, 3 * u), { wash: C.boxDk, washOp: 150, ink: null });
    pop();
  }
  function rain(t, k, key = 'rain') {
    if (k <= 0) return;
    boilSeed(key);
    const n = Math.round(46 * k);
    for (let i = 0; i < n; i++) {
      const x = hash(i + 3) * (W + 300) - 150, y = frac(hash(i + 50) + t * (1.1 + .3 * hash(i))) * (H + 200) - 100;
      inkLine([[x, y], [x - 10, y + 42]], .6, '#5B6A86', 'inkfine', 0);
    }
  }
  function puddle(x, y, rx, skyCol, splashAt, t, key) {   // a puddle that reflects the sky, and a splash when stepped in
    boilSeed('puddle' + key);
    paint(ellPts(x, y, rx, rx * .22, 28, 2), { wash: mixCol(skyCol, '#7FB8E0', .75), ink: PAL.ink, sw: .8 });
    paint(ellPts(x - rx * .25, y - rx * .04, rx * .35, rx * .05, 14), { wash: '#FFFFFF', washOp: 110, ink: null });
    for (const s of [].concat(splashAt)) {
      const a = t - s; if (a < 0 || a > .7) continue;
      for (let i = 0; i < 7; i++) {
        const ang = -Math.PI * (.1 + .8 * i / 6), d = rx * (.3 + 1.1 * a), h = 260 * a - 520 * a * a;
        paint(ellPts(x + Math.cos(ang) * d, y - Math.max(0, h) * (.6 + .5 * hash(i)), 9 * (1 - a) + 3, 12 * (1 - a) + 3, 10), { wash: C.puddle, ink: PAL.ink, sw: .5 });
      }
      paint(ellPts(x, y, rx * (1 + a * .8), rx * .22 * (1 + a * .8), 28), { wash: '#FFFFFF', washOp: 150 * (1 - a / .7), ink: null });
    }
  }
  function darkFrame() { paint(rectPts(-60, -60, W + 120, H + 120), { wash: C.dark, ink: null }); }
  const QMARK = (x, y, s, k, age) => { if (k > 0) emote('?', x, y, s, k, age); };

  // ---------- A: birth (and the coda) ----------
  // K = { sink: the light starts sinking, open: the iris of dawn opens, eyes: eyes open, happy, bfly: the butterfly }
  function birth(bt, t, K) {
    const dawnK = ease(seg(bt, K.open, K.open + 2.4));
    camBegin(960, 560 - 20 * dawnK, lerp(1.12, 1.0, seg(bt, K.open, K.open + 3)));
    sky(mixCol('#2A2440', C.dawn, dawnK), mixCol('#3A3050', C.dawnHi, dawnK), 'birthsky');
    if (dawnK > .05) glow(960, 1020, 700, '#FFC58A', .5 * dawnK);
    hill(960, 1260, 1500, 420, mixCol('#2E3A45', C.dawnHill, dawnK), t, 22, 'b');
    boilSeed('nest');
    paint(ellPts(960, 866, 330, 64, 26, 3), { wash: mixCol('#4A4034', '#D9B77A', dawnK), ink: PAL.ink, sw: 1 });
    for (let i = 0; i < 14; i++) { const a = Math.PI * (1.05 + .9 * i / 13), x = 960 + Math.cos(a) * 320; inkLine([[x, 860], [x + 30 * Math.cos(a + 1.2), 800 + 20 * hash(i)]], .8, mixCol('#3A3228', '#A8864E', dawnK), 'inkfine', .5); }
    const mood = emotions(bt, [[0, 'sleepy'], [K.eyes, 'surprised', { lookY: -.3 }], [K.happy, 'happy']], { take: 1.2 });
    const look = K.bfly && bt > K.bfly + .3 ? { lookX: clamp((bt - K.bfly - .3) * 2) * .9, lookY: -.6 } : {};
    const o = { ...mood, ...look, sq: (mood.sq || 0) + .06 };
    if (bt < K.eyes) o.emoteK = (o.emoteK ?? 1) * seg(bt, K.open + 1, K.open + 1.4);
    clawd(960, 866, 30, o);
    if (K.bfly && bt > K.bfly) { const [bx, by] = flight(bt, [[K.bfly, [1750, 360]], [K.bfly + 1.4, [1290, 470]]]); butterfly(bx, by, 30, bt); }
    camEnd();
    // the dark with the light in it: it breathes, sinks a little toward the world, then an iris of dawn opens round it
    const cy = lerp(520, 640, ease(seg(bt, K.sink, K.open)));
    const r = lerp(0, 1500, easeIn(seg(bt, K.open, K.open + 1.6)));
    if (bt < K.open + 1.6) {
      if (r < 5) darkFrame(); else iris(960, cy, r, C.dark);
      const a = 1 - seg(bt, K.open + .8, K.open + 1.6), br = 1 + .08 * Math.sin(bt * 3.2) + .1 * seg(bt, 1.5, 4.8);
      glow(960, cy, (110 + 60 * seg(bt, .2, 1.4) + r * .35) * br, C.glowW, a * seg(bt, 0, .8));
      glow(960, cy, 40 * br, '#FFF1C8', a * seg(bt, .1, .9));
    }
  }
  const BIRTH = { sink: 5.8, open: 8.9, eyes: 10.9, happy: 11.7, bfly: 12.0 };
  function shotBirth(t, lt, dur) {
    birth(t, t, BIRTH);
    boilSeed('wipeA');
    if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, ['#EFA27E', '#F4C667']);
  }

  // ---------- B: childhood ----------
  // 14.1 "everything is enormous" · 16.9 puddle (splash 17.25) · 18.3 butterfly on the flower · 20.9 falls (21.2, 22.35)
  // · 23.6 "every single time, you get back up" · 26.8 "No one has to teach you" · 28.8 hops off · 29.8 tilt up
  const PUD = [900, 905], FALLS = [[21.15, 21.75], [22.3, 22.95], [23.45, 24.15]], tOffB = 28.7;
  function kidX(t) {
    if (t < 16.95) return kf(t, [[13.6, -150], [15.2, 420], [16.2, 520], [16.95, PUD[0]]], x => x);
    if (t < 20.8) return PUD[0];
    if (t < FALLS[2][1]) return kf(t, [[20.8, PUD[0]], [21.15, 1010], [21.75, 1010], [22.3, 1120], [22.95, 1120], [23.45, 1220], [24.15, 1220]]);
    if (t < tOffB) return 1220;
    return lerp(1220, 2300, easeIn(seg(t, tOffB, 30.2)));
  }
  function shotChild(t, lt, dur) {
    const G = 900, u = 17, up = ease(seg(t, 29.7, 31.0));
    camBegin(kf(t, [[13.2, 780], [16.5, 880], [21, 1000], [24.5, 1080], [29.5, 1250]]), kf(t, [[13.2, 620], [15.5, 600]]) - 1450 * up, kf(t, [[13.2, 1.15], [16.5, 1.05], [29.5, 1.05]]) - .05 * up);
    const skyB = up < .5 ? mixCol(C.dawn, '#FBF0D8', up * 2) : mixCol('#FBF0D8', C.noon, up * 2 - 1);
    sky(skyB, mixCol(skyB, '#FFFFFF', .3), 'childsky');
    glow(1650, 300, 380, '#FFD9A0', .55 * (1 - up));
    boilSeed('sunB'); paint(ellPts(1650, 300, 70, 70, 26, 1.5), { wash: '#FFF0C8', ink: PAL.ink, sw: .6 });
    hill(1500, 1110, 900, 330, C.dawnHill2, t, 0, 'b2');
    boilSeed('meadow');
    paint(rectPts(-500, G - 20, W + 1500, 700, 3), { wash: C.dawnHill, ink: null });
    inkLine([[-500, G - 18], [960, G - 24], [W + 900, G - 16]], 1, PAL.ink, 'ink', .5);
    // everything is enormous: flowers and grass taller than the kid
    flower(200, G - 10, 520, 1, t, 'g1', '#F2A0B4'); flower(1560, G - 10, 470, 1, t, 'g2', '#C99BE0');
    const fl = flower(1360, G - 10, 300, 1, t, 'g3');
    for (let i = 0; i < 12; i++) { const x = -250 + i * 230 + 70 * hash(i), s = wob(t, .4, hash(i)) * 6; boilSeed('blade' + i); inkLine([[x, G - 16], [x + 10 + s, G - 110 - 60 * hash(i + 3)]], 1.2, '#5E8A45', 'ink', .4); }
    puddle(PUD[0], PUD[1], 120, skyB, [17.25], t, 'b');

    const x = kidX(t);
    const mood = emotions(t, [[13.2, 'excited', { lookY: -.8 }], [15.6, 'starstruck', { lookY: -.9, lookX: -.4 }], [17.3, 'laugh'], [18.4, 'starstruck', { lookX: 1, lookY: -.6 }],
      [20.9, 'excited', { lookX: 1 }], [FALLS[0][0] + .1, 'ko'], [FALLS[0][1] - .1, 'determined'], [FALLS[1][0] + .1, 'ko'], [FALLS[1][1] - .1, 'determined'],
      [FALLS[2][0] + .1, 'cry'], [24.4, 'determined'], [25.2, 'proud'], [26.8, 'happy'], [27.8, 'playful', { lookX: 1, lookY: -.6 }]], { take: .8 });
    let pose = {};
    if (t < 16.95) { const p = frac((t - 13.6) / .5); pose = t > 13.6 ? { view: 'side', ...jump(p, .08, .92, 2.2) } : { view: 'side' }; }
    else if (t < 17.25) pose = jump(t, 16.95, 17.25, 2.5);
    else if (t < 20.8) pose = { ...jump(t, 17.25, 17.25, 0), view: t > 18.2 ? 'q' : 'front' };
    else {
      const f = FALLS.find(([a, b]) => t >= a - .35 && t < b + .45);
      if (f) {
        const [a, b] = f;
        if (t < a) pose = { view: 'side', walk: (t - a) * 3.5, rot: .1 * seg(t, a - .1, a) };
        else if (t < b) { const k = seg(t, a, a + .18), land = t - a - .18; pose = { view: 'front', rot: lerp(.35, .1, k), dy: -1.3 * Math.sin(k * Math.PI) * (1 - k), sq: land > 0 ? .22 + .08 * Math.exp(-land * 8) * Math.cos(land * 30) : -.1, aL: -.5, aR: -.6 }; }
        else { const k = backOut(seg(t, b, b + .35)); pose = { rot: lerp(.1, 0, k), sq: lerp(.22, 0, k), dy: -1 * Math.sin(seg(t, b, b + .3) * Math.PI) }; }
        if (f === FALLS[2] && t > a + .3 && t < b) pose.sq += .03 * Math.sin(t * 40);
      } else if (t < tOffB) pose = { view: t > 26.8 ? 'q' : 'front', ...(t > 25.2 && t < 26.6 ? { aL: 1.3, aR: 1.3 } : {}) };
      else { const p = frac((t - tOffB) / .5); pose = { view: 'side', ...jump(p, .1, .9, 3) }; }
    }
    const o = add(mood, pose);
    clawd(x, G, u, { ...o, hat: 'party' });
    const top = [x + (o.dx || 0) * u, headTop(G, u, o) - 5.2 * u];
    let b, rest = false;
    if (t < 18.3) b = flight(t, [[13.2, [1700, 300]], [15.5, [700, 350]], [17, [1100, 420]], [18.3, [fl[0], fl[1] - 16]]], 26 * (1 - seg(t, 17.8, 18.3)));
    else if (t < 20.8) { b = [fl[0], fl[1] - 16]; rest = true; }
    else if (t < 26.9) b = flight(t, [[20.8, [fl[0], fl[1] - 16]], [22, [1500, 500]], [23.5, [1400, 620]], [25, [1500, 480]], [26.9, [top[0] + 60, top[1] - 30]]], 30);
    else if (t < tOffB) { b = [top[0] + 40 * Math.sin(t * 2), top[1] - 40 - 10 * Math.sin(t * 3)]; }
    else b = flight(t, [[tOffB, [top[0], top[1] - 40]], [30, [1800, 250]], [31, [1600, -500]]]);
    butterfly(b[0], b[1], 30, t, { rest });
    camEnd();
    boilSeed('wipeB');
    if (lt < .3) brushWipe(.5 + lt / .6, ['#EFA27E', '#F4C667']);
  }

  // ---------- C: school ----------
  // 32.1 grows · 32.4 pencil · 33.2 desk · 34.0 the swarm of ? · 35.7 bulb + books · 37.8 looks up · 42.8/43.5/44.4 ? ? ?
  const tGrowC = 32.15, tPencil = 32.45, tDesk = 33.15, tSwarm = 33.9, tBulb = 35.7, tLook = 37.8, BIGQ = [42.85, 43.55, 44.45];
  function shotSchool(t, lt, dur) {
    const down = ease(seg(t, 31.0, 32.0)), xc = 640, gc = hillY(xc, ...HILL) + 4;
    const lookUp = ease(seg(t, tLook, tLook + 1.2));
    camBegin(lerp(900, 880, lookUp), lerp(540 - 1450, 560, down) - 110 * lookUp, 1.08 - .06 * lookUp);
    sky(C.noon, C.noonHi, 'schoolsky');
    sun(1480, 170, 70, '#FFF0B8', .8);
    cloud(kf(t, [[31, 300], [47, 640]], x => x), 120, 80, '#F4F8FA', 's1');
    cloud(kf(t, [[31, 1150], [47, 1000]], x => x), 60, 60, '#F4F8FA', 's2');
    hill(...FAR, C.grass2, t, 0, 'c2');
    tree(TX, hillY(TX, ...HILL) + 6, 330, C.leaf, t);
    hill(...HILL, C.grass, t, 20, 'c');

    const grown = t > tGrowC + .04, u = grown ? 24 : 18;
    const mood = emotions(t, [[31, 'playful'], [tGrowC - .1, 'excited'], [tPencil + .3, 'neutral', { lookX: .5, lookY: .4 }], [tSwarm + .15, 'dizzy'],
      [tBulb, 'idea'], [36.8, 'proud'], [tLook, 'thinking', { lookY: -1, lookX: .3 }], [40.2, 'thinking', { lookY: -1, lookX: .8 }], [BIGQ[0], 'confused', { lookY: -1 }]], { take: .8 });
    let pose = { view: 'front' };
    if (t < tGrowC + .3) { const g = seg(t, tGrowC - .12, tGrowC), s = seg(t, tGrowC, tGrowC + .3); pose.sq = t < tGrowC ? .18 * ease(g) : -.35 * Math.exp(-s * 5) * Math.cos(s * 14); }
    if (t > tPencil) pose.aR = lerp(.2, .75, ease(seg(t, tPencil, tPencil + .3))) + (t > tBulb && t < tLook ? .08 * Math.sin(t * 18) : 0);   // writing
    const o = add(mood, pose);
    // the pencil: dropped in from above, it lands in the hand
    const hand = armTip(xc, gc, u, o, 'R');
    const pencil = (u2, sw) => { push(); rotate(-1.1); paint(rectPts(-.25 * u2, -2.4 * u2, .5 * u2, 2.4 * u2), { wash: PAL.ochre, ink: PAL.ink, sw: sw * .7 }); paint([[-.25 * u2, -2.4 * u2], [.25 * u2, -2.4 * u2], [0, -3.1 * u2]], { wash: '#F2D2A8', ink: PAL.ink, sw: sw * .6 }); pop(); };
    clawd(xc, gc, u, { ...o, hat: grown ? 'headphones' : 'party', armR: t > tPencil ? pencil : null });
    if (t > tPencil - .45 && t <= tPencil) { push(); translate(hand[0], lerp(hand[1] - 700, hand[1], easeIn(seg(t, tPencil - .45, tPencil)))); pencil(u, SW(u)); pop(); }
    // the desk slides in front, then the books pile up on it
    if (t > tDesk - .4) {
      const dx = lerp(-900, 0, backOut(seg(t, tDesk - .4, tDesk))), dxc = xc + 20 + dx, top = gc - 3.3 * u;
      boilSeed('desk');
      paint(rectPts(dxc - 9.4 * u, top, 18.8 * u, 1 * u, 1), { wash: C.wood, ink: PAL.ink, sw: SW(u) * .8 });
      for (const s of [-1, 1]) paint(rectPts(dxc + s * 8.4 * u - .5 * u, top + u, u, 2.4 * u, 1), { wash: mixCol(C.wood, PAL.ink, .2), ink: PAL.ink, sw: SW(u) * .7 });
      const books = Math.floor(clamp((t - tBulb) / .25, 0, 6));
      for (let i = 0; i < books; i++) {
        const k = backOut(seg(t, tBulb + i * .25, tBulb + i * .25 + .2)), bx = dxc - 7.3 * u + .4 * u * Math.sin(i * 2.3);
        boilSeed('book' + i);
        paint(rectPts(bx - 1.6 * u, top - (i + 1) * .75 * u * k, 3.2 * u, .7 * u, 1), { wash: [PAL.rose, PAL.teal, PAL.violet, PAL.ochre, PAL.sky, PAL.sap][i], ink: PAL.ink, sw: SW(u) * .6 });
      }
    }
    // a thousand questions: a swarm of ? pops up around the head, then the answers pop them
    if (t > tSwarm && t < tBulb + .5) {
      for (let i = 0; i < 16; i++) {
        const t0 = tSwarm + i * .06, a = i * 2.4, rr = 190 + 90 * hash(i + 11);
        const k = seg(t, t0, t0 + .25) * (1 - seg(t, tBulb + i * .02, tBulb + .2 + i * .02));
        QMARK(xc + Math.cos(a) * rr * 1.4, gc - 4.5 * u + Math.sin(a) * rr * .85, u * (.7 + .4 * hash(i)), k, t - t0);
      }
    }
    // the questions no one can answer: three big ? in the sky, one per question
    BIGQ.forEach((t0, i) => { if (t > t0 - .05) QMARK([760, 1060, 1300][i], [150, 70, 170][i], 40 + 6 * i, seg(t, t0 - .05, t0 + .25), t - t0); });
    camEnd();
    boilSeed('wipeC');
    if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, ['#F2C27E', '#A5C97C']);
  }

  // ---------- D: love ----------
  // 48.2 strolling · 49.9 the partner stops and looks back · 52.1 heart pounds · 54.9 the rush, trip, land · 57.3 sure ·
  // 59.3 the iris narrows to the two ("two people wide") · 63.7 shut
  const tBack = 50.0, tHeart = 52.05, tRush = 54.9, tTrip = 55.55, tUpD = 56.4, tSure = 57.2, tIrisD = 59.4;
  function shotLove(t, lt, dur) {
    camBegin(960 + 20 * Math.sin(t * .3), 560, kf(t, [[47, 1.02], [tIrisD, 1.08], [64.3, 1.14]]));
    sky(C.aft, C.aftHi, 'lovesky');
    sun(1500, 250, 72, '#FFE6A0', .7);
    cloud(kf(t, [[47, 380], [64.3, 560]], x => x), 190, 70, '#FFF8EC', 'l1');
    hill(...FAR, mixCol(C.grass2, C.aft, .25), t, 0, 'd2');
    tree(TX, hillY(TX, ...HILL) + 6, 330, C.leaf, t);
    hill(...HILL, mixCol(C.grass, C.aft, .15), t, 20, 'd');

    // Clawd: strolls the other way, feels the look, its heart goes wild, rushes, trips, lands at its feet, stands tall
    const cw = stroll(t, 47.0, 48.3, 180, 560, 26);
    let xc = t < tRush ? cw.x : t < tTrip ? lerp(560, 740, easeIn(seg(t, tRush, tTrip))) : t < tUpD ? lerp(740, 800, easeOut(seg(t, tTrip, tTrip + .3))) : lerp(800, 830, ease(seg(t, tUpD, tSure)));
    const gc = hillY(xc, ...HILL) + 4;
    const mood = emotions(t, [[47, 'happy', { emote: 'music' }], [48.6, 'happy', { emote: 'music', lookX: 0 }], [tBack + .6, 'surprised', { lookX: 1 }], [tHeart - .15, 'love', { lookX: 1 }], [tTrip + .15, 'ko'],
      [tUpD, 'shy', { lookX: 1 }], [tSure, 'proud'], [58.6, 'love', { lookX: 1 }]], { take: 1 });
    let pose = t < 48.3 ? { view: 'q', walk: cw.walk, dy: cw.dy } : { view: 'q', lookX: clamp((stroll(t, 47.5, tBack, -200, 1080, 26).x - 560) / 300, -1, 1) };
    if (t > tHeart && t < tRush) { const b = pulse(t * 2.2, 5); pose.sq = .12 * b; pose.dy = -.4 * b; }   // the heart forgets how to behave
    if (t >= tRush && t < tTrip) pose = { view: 'side', walk: (t - tRush) * 5, smear: .6, smearDir: 1, rot: .1 };
    else if (t >= tTrip && t < tUpD) { const k = seg(t, tTrip, tTrip + .2), land = t - tTrip - .2; pose = { view: 'front', rot: lerp(.4, .1, k), dy: -1.2 * Math.sin(k * Math.PI) * (1 - k), sq: land > 0 ? .22 + .08 * Math.exp(-land * 8) * Math.cos(land * 30) : -.1, aL: -.5, aR: .8 }; }
    else if (t >= tUpD) { const k = backOut(seg(t, tUpD, tUpD + .4)); pose = { view: 'q', rot: lerp(.1, 0, k), sq: lerp(.22, 0, k) + (t > tSure ? -.08 * Math.exp(-(t - tSure) * 4) : 0) }; }
    const o = add(mood, pose);
    clawd(xc, gc, 26, { ...o, hat: 'headphones' });
    // the partner: walks past Clawd, stops, turns back to look (drawn in front as it passes)
    const pw = stroll(t, 47.5, tBack, -200, 1080, 26), xp = pw.x, gp = hillY(xp, ...HILL) + 4;
    const pm = emotions(t, [[47, 'happy'], [tBack + .35, 'shy', { lookX: -1 }], [tTrip + .1, 'surprised', { lookX: -1, lookY: .5 }], [56.8, 'laugh'], [tSure + .3, 'love', { lookX: -1 }]]);
    let pp = t < tBack ? { view: 'side', walk: pw.walk, dy: pw.dy } : t < tBack + .35 ? turn(t, tBack, tBack + .3, .25, -.25) : { view: 'q', flip: true };
    if (t > tBack + .35 && t < tRush) pp = { view: 'q', flip: true };
    if (t >= tRush) pp = { view: 'q', flip: true };
    clawd(xp, gp, 26, { ...add(pm, pp), ...PARTNER, hat: 'flower', seed: 3, boilKey: 'partner' });

    if (t > tHeart && t < tRush + .2) {   // a big pounding heart beside it
      const b = pulse(t * 2.2, 5), k = seg(t, tHeart, tHeart + .2) * (1 - seg(t, tRush, tRush + .2));
      boilSeed('bigheart'); paint(heartPts(xc + 150, gc - 330, 40 * k * (1 + .35 * b)), { wash: '#E2476E', ink: PAL.ink, sw: .8 });
    }
    const mid = toScreen((xc + xp) / 2, gc - 110);
    camEnd();
    boilSeed('irisD');
    if (lt < .3) brushWipe(.5 + lt / .6, ['#F2C27E', '#A5C97C']);
    if (t > tIrisD) {   // the world narrows until it is only two people wide
      const k = ease(seg(t, tIrisD, 61.2)), shut = easeIn(seg(t, 63.5, 64.3));
      const rx = lerp(1500, 420, k) * (1 - shut), ry = lerp(1500, 260, k) * (1 - shut);
      if (rx < 4) darkFrame(); else irisShape(ellPts(mid[0], mid[1], rx, ry, 40), C.dark);
    }
  }

  // ---------- E: adulthood / F: parenthood (one road, one continuous framing across the cut) ----------
  const X = 900, G = 870, UA = 26;
  function road(t, skyC, dim, warm, part) {
    sky(skyC, mixCol(skyC, '#FFFFFF', .15), 'roadsky');
    if (warm > 0) sun(1420, 250, 70, '#FFE6A0', warm);
    boilSeed('town');
    for (let i = 0; i < 7; i++) { const x = 80 + i * 280 + 40 * hash(i), h = 160 + 150 * hash(i + 20); paint(rectPts(x, G - 30 - h, 150 + 60 * hash(i + 5), h + 30, 2), { wash: mixCol(mixCol(C.town, C.night, dim * .6), C.dawnHill2, warm * .35), ink: PAL.ink, sw: .7 }); }
    cloud(700 - 900 * part, 180, 120, mixCol('#8D949F', C.night, dim * .5), 'd1');
    cloud(1300 + 900 * part, 150, 100, mixCol('#9AA1AB', C.night, dim * .5), 'd2');
  }
  function roadGround(dim, warm, trudge) {
    boilSeed('road');
    paint(rectPts(-500, G - 20, W + 1000, 600, 3), { wash: mixCol(mixCol(C.road, C.night, dim * .5), C.dawnHill, warm * .5), ink: null });
    inkLine([[-500, G - 18], [960, G - 22], [W + 500, G - 16]], 1, PAL.ink, 'ink', .5);
    for (let i = 0; i < 9; i++) { const x = ((i * 300 - trudge) % 2700 + 2700) % 2700 - 400; boilSeed('dash' + i); paint(rectPts(x, G + 70, 140, 16, 1), { wash: mixCol('#D8D2C2', C.night, dim * .4), ink: null }); }
  }
  // E: 66.2 hat · 67.3 box · 69.0/69.9/71.0 bills, deadlines, promises · 73.0 days · 74.4 worries · 76.5 topple ·
  // 77.4 up, 77.8 lift one · 78.6 it slips, caught · 80.8 night rain, sit, look up
  const tHatE = 66.2, BOXES = [67.35, 69.0, 69.85, 70.95], tTopE = 76.55, tStandE = 77.35, tLiftE = 77.75, tSlip = 78.65, tNight = 80.4;
  function shotAdult(t, lt, dur) {
    const s = seg(t, 72.9, 74.4), ph = TAU * (2.2 * s + 1.4 * s * s), flick = t > 72.9 && t < 74.4 ? .5 - .5 * Math.cos(ph) : 0;
    const night = ease(seg(t, tNight - .6, tNight + 1)), dim = Math.max(flick, night);
    const skyC = mixCol(C.grey, C.night, dim * .85);
    camBegin(960 + 15 * Math.sin(t * .4), 540 - 30 * night, kf(t, [[64.3, 1.0], [tNight, 1.0], [85.7, 1.12]]));
    road(t, skyC, dim, 0, 0);
    if (t > 72.9 && t < 74.4) { const f = frac(ph / TAU), day = Math.cos(ph) > 0 ? 0 : 1; boilSeed('dayorb'); paint(ellPts(lerp(-100, 2000, f), 330 - 200 * Math.sin(f * Math.PI), 46, 46, 20), { wash: day ? '#F4EEDC' : '#FFE9A0', ink: PAL.ink, sw: .6 }); }
    const walking = t > 72.6 && t < tTopE, trudge = t < 72.6 ? 0 : (Math.min(t, tTopE) - 72.6) * 170;
    roadGround(dim, 0, trudge);

    const mood = emotions(t, [[64.3, 'neutral'], [tHatE + .03, 'surprised'], [66.7, 'neutral'], [BOXES[0] + .05, 'nervous'], [BOXES[1] + .05, 'scared'], [72.9, 'nervous'], [74.4, 'sad'],
      [tTopE + .1, 'ko'], [tStandE - .1, 'determined'], [tSlip, 'surprised'], [tSlip + .55, 'relieved', { emote: null }], [tNight, 'sad', { lookY: -1, lookX: .4 }]], { take: .8 });
    const loaded = (t < tTopE ? BOXES.filter(b => t > b + .12).length : 0) + (t > tLiftE + .35 ? 1 : 0);
    let pose = { sq: .06 * Math.min(loaded, 4) + ring(t, BOXES.map(b => b + .12), 7, 22) * .14, aL: loaded ? 1.35 : undefined, aR: loaded ? 1.35 : undefined };
    if (walking) { pose.walk = (t - 72.6) * 1.4; pose.dy = -.25 * Math.abs(Math.sin((t - 72.6) * 1.4 * Math.PI)); }
    if (t > tHatE && t < tHatE + .4) pose.sq += take(t, tHatE, .7).sq;
    if (t > tTopE && t < tStandE + .3) { const k = seg(t, tTopE, tTopE + .15); pose = { sq: .3 * k - (t > tStandE ? .3 * ease(seg(t, tStandE, tStandE + .3)) : 0), rot: -.12 * k * (1 - seg(t, tStandE, tStandE + .3)), aL: -.6, aR: -.4 }; }
    if (t > tSlip && t < tSlip + .6) pose.rot = (pose.rot || 0) + .12 * Math.sin(seg(t, tSlip, tSlip + .6) * Math.PI);
    if (t > tNight - .2) pose = { ...pose, sq: pose.sq + .12 * ease(seg(t, tNight - .2, tNight + .3)) };
    const o = add(mood, pose);
    clawd(X, G, UA, { ...o, hat: t > tHatE ? 'hard' : undefined });
    const top = headTop(G, UA, o) - 1.2 * UA;
    if (t > tHatE - .5 && t <= tHatE) { push(); translate(X, lerp(G - 700, G, easeIn(seg(t, tHatE - .5, tHatE)))); hat(UA, 'hard', SW(UA)); pop(); }
    const sway = .05 * Math.sin(t * 2.3) * Math.min(loaded, 3) + ring(t, BOXES.map(b => b + .12), 5, 16) * .06;
    const lands = [[X + 330, G - 4], [X - 380, G - 4], [X + 540, G - 4], [X - 560, G - 4]], tilts = [1.6, -1.2, .4, -.3];
    BOXES.forEach((b0, i) => {
      const col = [C.box, '#D9C9A0', '#C9B7D6', '#E3B5A5'][i];
      if (t < b0 - .45) return;
      if (t < tTopE) { const ly = top - i * 3 * UA, y = t < b0 ? lerp(ly - 900, ly, easeIn(seg(t, b0 - .45, b0))) : ly; box(X + Math.sin(sway) * i * 3 * UA, y, UA, sway * (i + 1) * .6, 'b' + i, col); }
      else if (i > 0 || t < tLiftE) { const k = seg(t, tTopE, tTopE + .55), p = arcPt([X, top - i * 3 * UA], lands[i], 180 + 60 * i, easeOut(k)); box(p[0], p[1], UA, lerp(0, tilts[i], k), 'b' + i, col); }
      else {   // the first box, back on its head; it slips, and is caught this time
        const k = ease(seg(t, tLiftE, tLiftE + .35)), p = arcPt(lands[0], [X, top], 120, k);
        const slip = t > tSlip ? Math.sin(seg(t, tSlip, tSlip + .6) * Math.PI) : 0;
        box(p[0] + 60 * slip, p[1] + 20 * slip, UA, lerp(1.6, 0, k) + .35 * slip + (k >= 1 ? sway * .5 : 0), 'b0', col);
      }
    });
    rain(t, seg(t, tNight - .3, tNight + .5));
    camEnd();
    boilSeed('wipeE');
    if (lt < .3) { const k = 1 - lt / .3; if (k > .02) paint(rectPts(-60, -60, W + 120, H + 120), { wash: C.dark, washOp: 255 * k, ink: null }); }   // out of the love shot's dark
  }
  // F: 87.0 the little one toddles in · 88.9 tug · 91.0 looks up at the rain in wonder, clouds part · 94.6 splash ·
  // 95.9 butterfly · 98.4 the box comes down · 99.9 lifts the little one onto its head · 101 love
  const tTug = 88.9, tWonder = 91.0, tClear = 92.2, tSplash = 94.65, tBfly = 95.8, tBoxDown = 98.4, tLiftF = 99.9, PUDF = [640, G + 120];
  function shotParent(t, lt, dur) {
    const clear = ease(seg(t, tClear, tClear + 3)), night = 1 - clear;
    const skyC = mixCol(mixCol(C.grey, C.night, .85), C.dawnHi, clear);
    camBegin(960 + 15 * Math.sin(t * .4), 510 + 30 * clear, kf(t, [[85.7, 1.12], [89, 1.08], [94, 1.0], [103.7, 1.0]]));
    road(t, skyC, night, clear, ease(seg(t, tClear - .2, tClear + 2)));
    roadGround(night, clear, 0);
    puddle(PUDF[0], PUDF[1], 110, skyC, [tSplash, tSplash + 1.3], t, 'f');

    const mood = emotions(t, [[85.7, 'sad', { lookY: -1, lookX: .4 }], [tTug + .15, 'surprised', { lookX: -.9, lookY: .6 }], [89.9, 'hopeful', { lookX: -.9, lookY: .6 }],
      [tSplash + .1, 'happy', { lookX: -.8, lookY: .4 }], [tBoxDown, 'relieved', { emote: null }], [tLiftF + .7, 'love'], [102.4, 'happy', { lookY: -.6 }]], { take: .8 });
    let pose = { sq: .18 * (1 - ease(seg(t, tTug + .1, tTug + .5))), aL: t > tTug - .3 && t < tLiftF - .2 ? -1.0 : 1.35, aR: 1.35 };
    if (t > tBoxDown - .1 && t < tLiftF - .2) { const k = ease(seg(t, tBoxDown, tBoxDown + .5)); pose.aR = lerp(1.35, -.2, k); }
    if (t > tLiftF - .15) { const k = ease(seg(t, tLiftF - .15, tLiftF + .3)); pose = { sq: -.08 * spring(t, tLiftF + .45, 5, 12), aL: lerp(-1, 1.25, k), aR: lerp(-.2, 1.25, k), dy: -.3 * Math.sin(seg(t, tLiftF, tLiftF + .5) * Math.PI) }; }
    const o = add(mood, pose);
    clawd(X, G, UA, { ...o, hat: 'hard' });
    // the box: on its head, lifted off and set down on the road
    const top = headTop(G, UA, o) - 1.2 * UA;
    if (t < tBoxDown) box(X + 8 * Math.sin(t * 2), top, UA, .03 * Math.sin(t * 2.3), 'b0');
    else { const k = ease(seg(t, tBoxDown, tBoxDown + .8)), p = arcPt([X, top], [X + 380, G - 4], 140, k); box(p[0], p[1], UA, lerp(0, .15, k), 'b0'); }
    for (const [i, lx, tilt] of [[1, X - 380, -1.2], [2, X + 560, .4]]) box(lx, G - 4, UA, tilt, 'b' + i, ['#D9C9A0', '#C9B7D6'][i - 1]);

    // the little one: toddles in, tugs its hand, looks up at the rain in wonder, splashes, chases the butterfly, is lifted up
    const ul = 13, tip = armTip(X, G, UA, { ...o, aL: -1.0 }, 'L'), xl1 = tip[0] - 6.8 * ul;
    let xl, gl = G, lp;
    const lm = emotions(t, [[85.7, 'happy'], [tTug - .1, 'hopeful', { lookX: 1, lookY: -.7 }], [tWonder, 'starstruck', { lookY: -1 }], [tSplash - .3, 'excited'], [tSplash + .1, 'laugh'],
      [tBfly + .2, 'starstruck', { lookX: 1, lookY: -.8 }], [tLiftF + .3, 'laugh']]);
    if (t < 88.4) { const w = stroll(t, 86.9, 88.4, -200, xl1, ul); xl = w.x; lp = { view: 'q', walk: w.walk, dy: w.dy }; }
    else if (t < 93.9) { xl = xl1; lp = { view: t < tWonder ? 'q' : 'front', aR: t < tWonder ? .6 + .12 * Math.sin((t - tTug) * 16) * (t > tTug && t < tTug + .6 ? 1 : 0) : .9, aL: t > tWonder ? .9 : .2 }; }
    else if (t < tSplash) { xl = lerp(xl1, PUDF[0], ease(seg(t, 93.9, tSplash))); lp = { view: 'side', flip: true, ...jump(t, 94.25, tSplash, 2.5) }; gl = lerp(G, PUDF[1], seg(t, 93.9, tSplash)); }
    else if (t < tLiftF - .15) {
      const a = t - tSplash; xl = PUDF[0] + 80 * Math.sin(a * 1.6); gl = PUDF[1];
      lp = { view: 'side', flip: Math.cos(a * 1.6) < 0, ...jump(frac(a / .65), .1, .9, 2) };
    }
    if (t >= tLiftF - .15) {
      const k = ease(seg(t, tLiftF - .15, tLiftF + .3)), x0 = PUDF[0] + 80 * Math.sin((tLiftF - .15 - tSplash) * 1.6);
      xl = lerp(x0, X, k); gl = lerp(PUDF[1], headTop(G, UA, o) - .2 * UA - 1.1 * UA * (1 - k), k) - 160 * Math.sin(k * Math.PI);
      lp = { view: k > .5 ? 'front' : 'side', aL: lerp(.2, 1.2, k), aR: lerp(.6, 1.2, k), noShadow: true };
    }
    if (t > 86.9) clawd(xl, gl, ul, { ...add(lm, lp), ...LITTLE, hat: 'party', seed: 7, boilKey: 'little' });
    if (t > tBfly) {
      const b = t < tLiftF ? flight(t, [[tBfly, [1900, 300]], [97, [PUDF[0] + 120, PUDF[1] - 260]], [tLiftF, [PUDF[0] + 60, PUDF[1] - 280]]], 30)
                           : flight(t, [[tLiftF, [PUDF[0] + 60, PUDF[1] - 280]], [101.5, [X + 120, headTop(G, UA, o) - 420]], [103.7, [X + 260, headTop(G, UA, o) - 520]]], 30);
      butterfly(b[0], b[1], 28, t);
    }
    rain(t, 1 - seg(t, tWonder + .3, tClear + 1.2));
    camEnd();
    boilSeed('wipeF');
    if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, ['#E0874F', '#F2B06B']);
  }

  // ---------- G: old age ----------
  // 105.0 "time slows… moves faster" · 108.9 walks in with small steps, 111.4 sits · 113.3 the partner smiles, 113.9
  // becomes a light, 114.6/115.3 two far lights · 118.3 sets down the box · 123 the far one chases the butterfly · 126.6 dusk, tilt
  const tWalk0 = 108.8, tSit = 111.4, tSmile = 113.2, tGoG = 113.9, tSetG = 118.3, tFarG = 122.6;
  function shotOld(t, lt, dur) {
    const dusk = ease(seg(t, 126.0, 127.4)), up = ease(seg(t, 126.9, 128.0));
    camBegin(lerp(960, 1060, ease(seg(t, tFarG - .3, tFarG + 1.2))), lerp(560, 540 - 1450, up), 1.06 - .04 * up);
    sky(mixCol(C.dusk, C.night, dusk), mixCol(C.duskHi, C.night, dusk), 'oldsky');
    const sunY = kf(t, [[103.7, 300], [104.9, 300], [108.2, 620], [127, 900]], x => x);
    sun(330, sunY, 80, '#FFD98A', .9 * (1 - dusk));
    cloud(kf(t, [[104.8, 1700], [108.2, -300]], x => x), 170, 90, mixCol('#F8D9B0', C.night, dusk), 'o1');   // racing clouds: time moves faster
    cloud(kf(t, [[105.4, 2200], [108.4, 200]], x => x), 110, 60, mixCol('#F8D9B0', C.night, dusk), 'o2');
    hill(...FAR, mixCol('#C99A60', C.nightHill, dusk), t, 0, 'g2');
    // far off: the little one, grown, chasing the butterfly on the next hill
    if (t > tFarG) {
      const a = t - tFarG, fx = lerp(2100, 1760, ease(seg(a, 0, 1))) + 90 * Math.sin(a * .9) * seg(a, 1, 1.5), fg = hillY(fx, ...FAR) + 3, left = a > 1 && Math.cos(a * .9) < 0;
      clawd(fx, fg, 11, { ...feel('playful', t), view: 'side', flip: a < 1 || left, ...jump(frac(a / .6), .1, .9, 2.5), ...LITTLE, hat: 'party', boilKey: 'far' });
      butterfly(fx + (a < 1 || left ? -80 : 80), fg - 150 + 20 * Math.sin(t * 3), 14, t, { key: 'far' });
    }
    tree(TX, hillY(TX, ...HILL) + 6, 330, mixCol(C.rust, C.nightHill, dusk), t);
    hill(...HILL, mixCol(C.duskHill, C.nightHill, dusk), t, 20, 'g');
    for (let i = 0; i < 7; i++) {   // leaves drifting down slowly: time slows down
      const p = frac(t * .06 + hash(i + 40)), lx = 1250 + 420 * hash(i + 41) - 260 * p + 40 * Math.sin(t * 1.1 + i), ly = 560 + p * 480;
      boilSeed('leaf' + i); paint(ellPts(lx, ly, 13, 7, 10, 0, t * 1.2 + i), { wash: i % 2 ? C.rust : '#E8A64E', ink: PAL.ink, sw: .5 });
    }
    // the partner, waiting on the hilltop; smiles; becomes a light that rises. Two more far lights rise after it.
    const xp = 1050, gp = hillY(xp, ...HILL) + 4, gone = seg(t, tGoG, tGoG + .65);
    if (gone < 1) {
      const pm = emotions(t, [[103.7, 'relieved', { emote: null }], [tSmile, 'happy', { lookX: -1 }], [tGoG - .05, 'relieved', { emote: null }]]);
      const pp = { view: t < tSmile - .1 ? 'q' : 'front', flip: true, sq: .1 + .5 * easeIn(gone), sx: 1 - .7 * easeIn(gone) };
      clawd(xp, gp, 26, { ...add(pm, pp), ...OLDP, hat: 'flower', seed: 3, boilKey: 'partner' });
    }
    for (const [t0, from, to, key] of [[tGoG, [xp, gp - 110], [1330, 150], 'p'], [114.6, [1780, 860], [1650, 260], 'l1'], [115.3, [160, 880], [420, 330], 'l2']]) {
      if (t < t0) continue;
      const p = arcPt(from, to, 120, ease(seg(t, t0 + .3, t0 + 2.2))), s = key === 'p' ? 1 : .6;
      glow(p[0], p[1], (140 + 120 * Math.sin(seg(t, t0, t0 + 1.8) * Math.PI)) * s, '#FFE6A0', .9);
      boilSeed('light' + key); paint(starPts(p[0], p[1], 16 * s, .4, 4), { wash: '#FFF3C8', ink: null });
    }
    // Clawd, old: small slow steps up to the hilltop, sits; sees them go; sets down what it carried; watches the far one
    const w = stroll(t, tWalk0, tSit - .3, 260, 690, 26), xc = t < tWalk0 ? 260 : w.x, gc = hillY(xc, ...HILL) + 4;
    const mood = emotions(t, [[103.7, 'relieved', { emote: null }], [tSmile + .2, 'happy', { lookX: 1 }], [tGoG + .6, 'sad', { lookX: .7, lookY: -.9 }],
      [tSetG + .3, 'relieved', { emote: null }], [tFarG + .4, 'hopeful', { lookX: 1, lookY: -.1 }], [124.4, 'happy', { lookX: 1 }]], { take: .6 });
    const walking = t > tWalk0 && t < tSit - .3;
    const pose = { view: 'q', sq: .08 * seg(t, tSit - .3, tSit + .2), aR: .15, aL: -.3, ...(walking ? { walk: w.walk * 1.8, dy: w.dy * .4 } : {}) };
    const o = add(mood, pose);
    const held = t < tSetG;
    const hold = held ? (u2) => box(1.5 * u2, 1.2 * u2, u2 * .38, 0, 'small') : null;
    clawd(xc, gc, 26, { ...o, ...OLD, hat: 'fedora', seed: 1, armR: hold });
    if (!held) { const k = ease(seg(t, tSetG, tSetG + .45)), p = arcPt([xc + 200, gc - 110], [xc + 190, gc + 2], 40, k); box(p[0], p[1], 26 * .38, 0, 'small'); }
    camEnd();
    boilSeed('wipeG');
    if (lt < .3) brushWipe(.5 + lt / .6, ['#E0874F', '#F2B06B']);
  }

  // ---------- H: the end, and the next beginning ----------
  // 129.6 "a life isn't measured in years" · memories: puddle 133.3, pencil 134.3, heart 135.1, box 136.0, all 137.6 ·
  // 141.4 eyes close, 142.4 the butterfly settles · 144.9 it rises as a light · 146.4 the iris closes · 148.3 the coda
  const MEM = [[133.3, 1000, 250, 'puddle'], [134.3, 1560, 330, 'pencil'], [135.1, 1180, 420, 'heart'], [136.0, 1720, 150, 'box']];
  const tAll = 137.6, tClose = 141.4, tLandH = 142.4, tRiseH = 144.9, tIrisH = 146.2, tCodaH = 148.1;
  function memory(kind) {
    if (kind === 'puddle') { paint(ellPts(0, 0, 40, 12, 20), { wash: C.puddle, ink: PAL.ink, sw: .6 }); paint(ellPts(-10, -3, 14, 3, 10), { wash: '#FFFFFF', washOp: 150, ink: null }); }
    else if (kind === 'pencil') { push(); rotate(-.8); paint(rectPts(-6, -34, 12, 50), { wash: PAL.ochre, ink: PAL.ink, sw: .6 }); paint([[-6, -34], [6, -34], [0, -48]], { wash: '#F2D2A8', ink: PAL.ink, sw: .5 }); pop(); }
    else if (kind === 'heart') paint(heartPts(0, 0, 30), { wash: '#E2476E', ink: PAL.ink, sw: .6 });
    else { paint(rectPts(-26, -18, 52, 34), { wash: C.box, ink: PAL.ink, sw: .6 }); paint(rectPts(-5, -18, 10, 34), { wash: C.boxDk, washOp: 150, ink: null }); }
  }
  function shotEnd(t, lt, dur) {
    if (t >= tCodaH) {   // the coda: the glow opens on a new small Clawd at dawn, who opens its eyes
      const bt = kf(t, [[tCodaH, 8.0], [149.3, 8.9], [150.9, 10.9], [155.75, 15.2]], x => x);
      birth(bt, t, { sink: 99, open: 8.9, eyes: 10.9, happy: 11.7, bfly: 0 });
      const f = seg(t, 154.6, 155.7); if (f > 0) paint(rectPts(-60, -60, W + 120, H + 120), { wash: C.dark, washOp: 255 * f, ink: null });
      return;
    }
    const down = ease(seg(t, 128.0, 129.2));
    camBegin(960, lerp(540 - 1450, 520, down), kf(t, [[129.2, 1.0], [141, 1.12]]));
    sky(C.night, '#27306A', 'endsky');
    stars(t, 50, -1500, 760);
    const ps = [1330, 150];
    glow(ps[0], ps[1], 150 + 20 * Math.sin(t * 2), '#FFE6A0', .8);
    boilSeed('pstarH'); paint(starPts(ps[0], ps[1], 18 + 2 * Math.sin(t * 3), .4, 4), { wash: '#FFF3C8', ink: null });
    for (const [t0, mx, my, kind] of MEM) {
      if (t < t0) continue;
      const k = backOut(seg(t, t0, t0 + .45)), fl = Math.exp(-(t - t0) * 2.5) + (t > tAll ? Math.exp(-(t - tAll) * 2) * (.7 + .3 * Math.sin(mx)) : 0);
      glow(mx, my, 90 + 160 * fl, '#FFE6A0', .5 + .5 * clamp(fl));
      push(); translate(mx, my); scale(1.4 * k * (1 + .15 * clamp(fl))); boilSeed('mem' + kind); memory(kind); pop();
    }
    hill(...FAR, C.nightHill, t, 0, 'h2');
    tree(TX, hillY(TX, ...HILL) + 6, 330, C.nightHill, t, true);
    hill(...HILL, mixCol(C.nightHill, '#3A4468', .4), t, 20, 'h');

    const xc = 690, gc = hillY(xc, ...HILL) + 4;
    const mood = emotions(t, [[128, 'relieved', { lookX: .6, lookY: -1, eyes: 'normal', emote: null }], [MEM[0][0] + .2, 'hopeful', { lookX: .5, lookY: -1 }],
      [MEM[2][0] + .3, 'love', { lookX: .6, lookY: -1 }], [139.9, 'sleepy'], [tClose, 'relieved', { emote: null }]], { take: .5 });
    const o = add(mood, { view: 'q', sq: .08, aL: -.3, aR: .1 });
    clawd(xc, gc, 26, { ...o, ...OLD, hat: 'fedora', seed: 1 });
    const brim = [xc + .6 * 26 + (o.dx || 0) * 26, headTop(gc, 26, o) - 1.6 * 26];
    let b = null, rest = false, lightK = 0;
    if (t > 140.6 && t < tLandH) b = flight(t, [[140.6, [300, 120]], [141.5, [560, 330]], [tLandH, brim]], 20 * (1 - seg(t, 142.0, tLandH)));
    else if (t >= tLandH && t < tRiseH) { b = brim; rest = true; }
    else if (t >= tRiseH) { lightK = seg(t, tRiseH, tIrisH); b = arcPt(brim, [960, 300], -60, ease(lightK)); }
    const bs = b ? toScreen(b[0], b[1]) : null;
    if (b) butterfly(b[0], b[1], 28, t, { rest, light: lightK * 1.2 });
    camEnd();
    if (t > tIrisH) {   // the iris closes on the rising light, and ends as the glow from the first frame
      const k = seg(t, tIrisH, 147.6), c = [lerp(bs[0], 960, ease(k)), lerp(bs[1], 640, ease(k))];
      const r = lerp(1400, 0, easeIn(k));
      if (r < 5) darkFrame(); else iris(c[0], c[1], r, C.dark);
      glow(c[0], c[1], 150 + 30 * Math.sin(t * 3.2), C.glowW, seg(t, tIrisH + .3, 147.4));
      glow(c[0], c[1], 40, '#FFF1C8', seg(t, tIrisH + .3, 147.4));
    }
  }

  shots([[0, shotBirth], [13.2, shotChild], [31.0, shotSchool], [47.0, shotLove], [64.3, shotAdult], [85.7, shotParent], [103.7, shotOld], [128.0, shotEnd]]);
})();
