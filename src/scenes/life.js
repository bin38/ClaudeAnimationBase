// life.js: "A Life", a 69-second film over a voice-over (assets/life_narration.mp3). See STORYBOARD.md.
// Six shots, one world seen at the times of one day: birth at night → dawn childhood → noon youth → grey adulthood →
// sunset old age → night, and a glow that opens the next life. All times below are VIDEO times (t), taken from the
// narration's real timings (script/life_subtitles.srt).
(() => {
  // ---------- palette ----------
  const C = {
    dark: '#15121E', glowW: '#FFD58A',
    dawn: '#F2C4A8', dawnHi: '#F7DCC0', dawnHill: '#A9C77F', dawnHill2: '#C6D79A',
    noon: '#A8D5EE', noonHi: '#D3ECF6', grass: '#86B764', grass2: '#A5C97C',
    grey: '#A3AAB5', greyDk: '#6F7682', road: '#8B877E', town: '#8C94A0',
    dusk: '#F0A267', duskHi: '#F6C98C', duskHill: '#B98A55', rust: '#DE8440',
    night: '#1C2248', nightHill: '#2C3659',
    trunk: '#7A5234', leaf: '#5E9E4E', butter: '#F7D24A', butter2: '#F0A13A', box: '#C9A06A', boxDk: '#9C7646',
  };
  const PARTNER = { col: '#5FA9A2', dk: '#3D7B76', lt: '#9AD3CB' };
  const LITTLE = { col: '#EB9A77', dk: '#B8664A', lt: '#F8C3A8' };
  const OLDK = .45, GREYC = '#B5ADA6';
  const aged = (c, k = OLDK) => ({ col: mixCol(c.col, GREYC, k), dk: mixCol(c.dk, '#7E7670', k), lt: mixCol(c.lt, '#D8D2CC', k) });
  const OLD = aged({ col: PAL.clay, dk: PAL.clayDk, lt: '#F5B394' }), OLDP = aged(PARTNER);

  // add pose fields that two sources both move (mood and action) instead of letting one replace the other
  const add = (a, b) => ({ ...a, ...b, dy: (a.dy || 0) + (b.dy || 0), sq: (a.sq || 0) + (b.sq || 0), rot: (a.rot || 0) + (b.rot || 0) });

  // Front-view arm tip of clawd(x, y, u, o), in world px: for props held at an arm, or for touching another character.
  function armTip(x, y, u, o, which) {
    const a = which === 'L' ? (o.aL ?? .2) : (o.aR ?? .2), dir = which === 'L' ? -1 : 1, sq = o.sq || 0;
    const px = dir * (4.9 + .55 * clamp((Math.abs(a) - .7) / .9)) + dir * 2.2 * Math.cos(a), py = -4.5 - 2.2 * Math.sin(a);
    return [x + (o.dx || 0) * u + px * u * (1 + sq * .6), y + (o.dy || 0) * u + py * u * (1 - sq)];
  }
  const headTop = (y, u, o) => y + (o.dy || 0) * u - 8 * u * (1 - (o.sq || 0));

  // ---------- set pieces ----------
  function sky(col, hi, key = 'sky') {
    // The flat base colour goes straight onto the canvas: under software WebGL, p5.brush sometimes drops a frame's first
    // full-frame wash (depending on the frame drawn before it). A flat opaque wash looks the same as this fill.
    push(); noStroke(); fill(col); rect(-900, -2400, W + 1800, H + 3000); pop();
    boilSeed(key);
    paint(ellPts(W * .62, 120, W * .55, 330, 26, 12), { wash: hi, washOp: 120, ink: null });   // a soft lighter band
  }
  function hill(cx, cy, rx, ry, col, t, tufts = 0, key = '') {
    boilSeed('hill' + cx + key);
    paint(ellPts(cx, cy, rx, ry, 44, 2), { wash: col, ink: PAL.ink, sw: 1 });
    for (let i = 0; i < tufts; i++) {
      const a = -Math.PI / 2 + (hash(i + cx) - .5) * 1.5, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry + 5, s = wob(t, .45, hash(i) * 3) * 5;
      for (const k of [-1, 1]) inkLine([[x + k * 6, y], [x + k * 10 + s, y - 20 - 7 * hash(i + k)]], .7, mixCol(col, PAL.ink, .35), 'inkfine', .4);
    }
  }
  const hillY = (x, cx, cy, rx, ry) => cy - ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));
  function sun(x, y, r, col = '#FFE7A6', g = .7) {
    glow(x, y, r * 3.2, '#FFD27A', g);
    boilSeed('sun');
    paint(ellPts(x, y, r, r, 26, 1.5), { wash: col, ink: PAL.ink, sw: .7 });
  }
  function cloud(x, y, s, col, key) {
    boilSeed('cloud' + key);
    paint([[-1.6, .4], [-1.5, -.2], [-.9, -.6], [-.3, -1], [.5, -.9], [1, -.4], [1.6, -.2], [1.7, .4]].map(([a, b]) => [x + a * s, y + b * s]),
      { wash: col, ink: PAL.ink, sw: .8, curv: .8 });
  }
  function stars(t, n, y0, y1, bright = 1) {
    for (let i = 0; i < n; i++) {
      boilSeed('st' + i);
      const x = hash(i + 7) * (W + 400) - 200, y = lerp(y0, y1, hash(i + 90)), tw = .55 + .45 * Math.sin(t * (1.6 + 2 * hash(i + 30)) + i);
      paint(starPts(x, y, (3 + 5 * hash(i + 60)) * tw * bright, .35, 4), { wash: PAL.cream, ink: null });
    }
  }
  // The butterfly: s = size in px, flapping (or resting, wings half open), optional light.
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
  // a path with a flutter on top: keys = [[t, [x, y]], ...]
  const flight = (t, keys, amp = 22) => { const [x, y] = kf(t, keys); return [x + amp * .6 * Math.sin(t * 5.3), y + amp * Math.sin(t * 7.9) * Math.abs(Math.sin(t * 2.1))]; };

  function flower(x, y, h, k, t, key) {   // k: 0 bud → 1 open
    boilSeed('flower' + key);
    const sway = .05 * Math.sin(t * 1.3 + x), tx = x + h * sway, ty = y - h;
    inkLine([[x, y], [x + h * sway * .4, y - h * .5], [tx, ty]], 1.1, '#4F7F3E', 'ink', .5);
    paint(ellPts(x + h * .12, y - h * .4, h * .13, h * .05, 10, 0, -.6), { wash: '#6FA353', ink: PAL.ink, sw: .5 });
    const r = h * (.1 + .22 * k);
    if (k < .05) { paint(ellPts(tx, ty, h * .07, h * .11, 12), { wash: '#E27A92', ink: PAL.ink, sw: .6 }); return [tx, ty]; }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * .15; paint(ellPts(tx + Math.cos(a) * r * .9, ty + Math.sin(a) * r * .9, r * .62, r * .42, 12, 0, a), { wash: '#F08EA6', ink: PAL.ink, sw: .55 }); }
    paint(ellPts(tx, ty, r * .45, r * .45, 12), { wash: PAL.ochre, ink: PAL.ink, sw: .55 });
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
  function box(x, y, u, rot = 0, key = '') {   // (x, y) = bottom centre
    boilSeed('box' + key);
    push(); translate(x, y); rotate(rot);
    paint(rectPts(-2.4 * u, -3 * u, 4.8 * u, 3 * u, u * .06), { wash: C.box, ink: PAL.ink, sw: clamp(u / 15, .5, 2) * .8 });
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
  function darkFrame(col = C.dark) { paint(rectPts(-60, -60, W + 120, H + 120), { wash: col, ink: null }); }

  // ---------- A: birth (also the coda, from shot F) ----------
  // bt = birth time. 0–1.5 a glow in the dark; 1.5–3.2 the dark lifts off baby Clawd asleep; 4.3 eyes open; 5.0 happy.
  function birth(bt, t, coda = false) {
    const dawnK = ease(seg(bt, 1.8, 5.2));
    camBegin(960, 560 - 20 * dawnK, kf(bt, [[0, 1.12], [6.5, 1.0]]));
    sky(mixCol('#2A2440', C.dawn, dawnK), mixCol('#3A3050', C.dawnHi, dawnK), 'birthsky');
    if (dawnK > .05) glow(960, 1020, 700, '#FFC58A', .5 * dawnK);   // the sun just under the horizon
    hill(960, 1260, 1500, 420, mixCol('#2E3A45', C.dawnHill, dawnK), t, 22, 'b');
    // the nest
    boilSeed('nest');
    paint(ellPts(960, 866, 330, 64, 26, 3), { wash: mixCol('#4A4034', '#D9B77A', dawnK), ink: PAL.ink, sw: 1 });
    for (let i = 0; i < 14; i++) { const a = Math.PI * (1.05 + .9 * i / 13), x = 960 + Math.cos(a) * 320; inkLine([[x, 860], [x + 30 * Math.cos(a + 1.2), 800 + 20 * hash(i)]], .8, mixCol('#3A3228', '#A8864E', dawnK), 'inkfine', .5); }
    const mood = emotions(bt, [[0, 'sleepy'], [4.3, 'surprised', { lookY: -.3 }], [5.0, 'happy']], { take: 1.2 });
    const look = coda ? {} : bt > 5.55 ? { lookX: clamp((bt - 5.55) * 2.5) * .9, lookY: -.6 } : {};
    const u = 30, o = { ...mood, ...look, sq: (mood.sq || 0) + .06 };
    if (bt < 4.3) o.emoteK = (o.emoteK ?? 1) * seg(bt, 2.4, 2.8);   // the zzz arrives once the dark has lifted
    clawd(960, 866, u, o);
    // the butterfly flutters in at the end of the shot (the film's motif)
    if (!coda && bt > 5.4) { const [bx, by] = flight(bt, [[5.4, [1750, 360]], [6.6, [1290, 470]]]); butterfly(bx, by, 30, bt); }
    camEnd();
    // the dark: full at first, a breathing glow in it, then an iris of warm light opens on the nest
    const r = lerp(0, 1500, easeIn(seg(bt, 1.4, 3.1)));
    if (bt < 3.1) {
      if (r < 5) darkFrame(); else iris(960, 640, r, C.dark);
      const a = 1 - seg(bt, 2.2, 3.1), br = 1 + .08 * Math.sin(bt * 3.2);
      glow(960, 640, (110 + 60 * seg(bt, .2, 1.4) + r * .35) * br, C.glowW, a * seg(bt, 0, .8));
      glow(960, 640, 40 * br, '#FFF1C8', a * seg(bt, .1, .9));
    }
  }
  function shotBirth(t, lt, dur) {
    birth(t, t);
    boilSeed('wipeA');
    if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, ['#EFA27E', '#F4C667']);
  }

  // ---------- B: childhood ----------
  const tFall = 11.5, tHeadLand = 13.2, tUp = 14.45, tOff = 16.1;
  function kidX(t) {
    if (t < 8.6) return kf(t, [[7.1, -160], [8.6, 690]], x => x);
    if (t < 10.8) return 690;
    if (t < tFall) return lerp(690, 1010, easeIn(seg(t, 10.8, tFall)) * .6 + seg(t, 10.8, tFall) * .4);
    if (t < tOff) return lerp(1010, 1090, easeOut(seg(t, tFall, tFall + .3)));
    return lerp(1090, 2200, easeIn(seg(t, tOff + .1, 17.6)));
  }
  function shotChild(t, lt, dur) {
    const G = 868, u = 22, up = ease(seg(t, 17.35, 18.3));
    camBegin(kf(t, [[6.5, 900], [9, 900], [11.8, 1000], [16, 1000], [17.3, 1150]]), 540 - 1450 * up, 1.0 + .03 * seg(t, 6.5, 11) - .03 * up);
    const skyB = up < .5 ? mixCol(C.dawn, '#FBF0D8', up * 2) : mixCol('#FBF0D8', C.noon, up * 2 - 1);
    sky(skyB, mixCol(skyB, '#FFFFFF', .3), 'childsky');
    glow(1550, 330, 380, '#FFD9A0', .55 * (1 - up));
    boilSeed('sunB'); paint(ellPts(1550, 330, 70, 70, 26, 1.5), { wash: '#FFF0C8', ink: PAL.ink, sw: .6 });
    hill(1500, 1090, 900, 330, C.dawnHill2, t, 0, 'b2');
    hill(300, 1120, 800, 300, mixCol(C.dawnHill2, C.dawnHill, .5), t, 0, 'b3');
    boilSeed('meadow');
    paint(rectPts(-500, G - 20, W + 1200, 700, 3), { wash: C.dawnHill, ink: null });
    inkLine([[-500, G - 18], [960, G - 24], [W + 700, G - 16]], 1, PAL.ink, 'ink', .5);
    for (let i = 0; i < 16; i++) { const x = -300 + i * 160 + 60 * hash(i), s = wob(t, .4, hash(i)) * 4; boilSeed('tuft' + i); inkLine([[x, G - 18], [x + 4 + s, G - 44 - 10 * hash(i + 3)]], .7, '#5E8A45', 'inkfine', .3); inkLine([[x + 10, G - 18], [x + 16 + s, G - 38]], .7, '#5E8A45', 'inkfine', .3); }
    for (let i = 0; i < 5; i++) flower(80 + i * 420 + 90 * hash(i + 9), G + 50 + 60 * hash(i + 4), 60, 1, t, 'm' + i);
    const fl = flower(1250, G - 16, 150, backOut(seg(t, 9.05, 9.65)), t, 'big');

    // Clawd, small and new: hop in, see the flower, chase, fall, cry, the butterfly lands, get up, hop off after it
    const x = kidX(t);
    const mood = emotions(t, [[6.5, 'excited'], [9.3, 'starstruck', { lookX: .9, lookY: -.4 }], [10.7, 'excited', { lookX: 1, lookY: -.6 }],
      [tFall + .25, 'ko'], [12.25, 'cry'], [tHeadLand + .08, 'surprised', { lookY: -1 }], [13.7, 'laugh'], [tUp - .15, 'determined'], [15.1, 'proud'], [tOff - .1, 'playful', { lookX: 1, lookY: -.7 }]]);
    let pose = {};
    if (t < 8.6) { const p = frac((t - 7.1) / .5), hop = t > 7.1 ? jump(p, .08, .92, 2.2) : {}; pose = { view: 'side', ...hop, lookX: Math.sin(t * 4) }; }
    else if (t < 10.8) pose = t < 9.05 ? turn(t, 8.75, 8.95, .25, .125) : { view: 'q' };
    else if (t < tFall) pose = { view: 'side', walk: (t - 10.8) * 3.2, dy: -.4 * Math.abs(Math.sin((t - 10.8) * 10)), rot: .08 };
    else if (t < tUp) {   // the trip: pitch forward, slam, a squashed heap that shudders while it cries
      const f = seg(t, tFall, tFall + .22), land = t - (tFall + .22);
      pose = { view: 'front', rot: lerp(.35, .1, f), dy: -1.6 * Math.sin(f * Math.PI) * (1 - f), sq: land > 0 ? .22 + .1 * Math.exp(-land * 8) * Math.cos(land * 30) : -.1, aL: -.5, aR: -.6, noShadow: false };
      if (t > 12.25 && t < tHeadLand) pose.sq += .03 * Math.sin(t * 40);
    } else if (t < tOff) {   // up again
      const k = backOut(seg(t, tUp, tUp + .4));
      pose = { rot: lerp(.1, 0, k), sq: lerp(.22, 0, k), dy: -1.2 * Math.sin(seg(t, tUp, tUp + .35) * Math.PI) };
    } else { const p = frac((t - tOff) / .55); pose = { view: 'side', ...jump(p, .1, .9, 3) }; }
    const o = add(mood, pose);
    if (t < tFall + .25) o.emote = t < 9.3 ? o.emote : o.emote;
    clawd(x, G, u, { ...o, hat: 'party' });

    // the butterfly: circles in, lands on the flower, lifts off (the chase), lands on Clawd's head, then leads it off
    const top = [x + (o.dx || 0) * u, headTop(G, u, o) - 5.2 * u];   // the tip of the party hat
    let b, rest = false;
    if (t < 9.5) b = flight(t, [[6.5, [1350, 420]], [7.8, [760, 330]], [8.8, [1000, 420]], [9.5, [fl[0], fl[1] - 14]]], 26 * (1 - seg(t, 9.1, 9.5)));
    else if (t < 10.6) { b = [fl[0], fl[1] - 14]; rest = true; }
    else if (t < tHeadLand) b = flight(t, [[10.6, [fl[0], fl[1] - 14]], [11.4, [1430, 520]], [12.3, [1320, 330]], [tHeadLand, top]], 26 * (1 - seg(t, 12.8, tHeadLand)));
    else if (t < tOff) { b = top; rest = true; }
    else b = flight(t, [[tOff, top], [17.2, [1700, 250]], [18.3, [1500, -500]]]);
    butterfly(b[0], b[1], 32, t, { rest });
    // dust where it lands
    if (t > tFall + .2 && t < tFall + .9) { const a = seg(t, tFall + .2, tFall + .9); boilSeed('dust'); for (const d of [-1, 1]) paint(ellPts(x + d * (120 + 90 * a), G - 12 - 30 * a, 26 * (1 - a) + 4, 16 * (1 - a) + 3, 12), { wash: '#E9D8BE', ink: PAL.ink, sw: .5 }); }
    camEnd();
    boilSeed('wipeB');
    if (lt < .3) brushWipe(.5 + lt / .6, ['#EFA27E', '#F4C667']);
  }

  // ---------- C: youth ----------
  const HILL = [860, 1180, 1250, 360], TX = 1450;
  const tGrow = 19.6, tSee = 22.55, tDash = 23.3;
  function shotYouth(t, lt, dur) {
    const down = ease(seg(t, 18.3, 19.35)), shade = ease(seg(t, 27.7, 28.4));
    camBegin(960, lerp(540 - 1450, 560, down), 1.04 + .03 * seg(t, 19.4, 28.6));
    sky(mixCol(C.noon, C.grey, shade), mixCol(C.noonHi, C.grey, shade), 'youthsky');
    sun(1480, 220, 72, '#FFF0B8', .8 * (1 - shade));
    cloud(kf(t, [[26.8, 2300], [28.4, 1480]]), 230, 110, '#C9CFD8', 'shade');
    cloud(kf(t, [[18.3, 520], [28.6, 760]], x => x), 250, 70, '#F4F8FA', 'c1');
    hill(1750, 1150, 800, 300, mixCol(C.grass2, C.grey, shade * .6), t, 0, 'y2');
    tree(TX, hillY(TX, ...HILL) + 6, 330, mixCol(C.leaf, '#7D8A78', shade * .7), t);
    hill(...HILL, mixCol(C.grass, '#8A9A80', shade * .6), t, 20, 'y');

    // Clawd grows up, wonders, falls in love too fast, and dances
    const grown = t > tGrow + .04, u = grown ? 26 : 22;
    const xc = t < tDash ? 680 : lerp(680, 860, backOut(seg(t, tDash, tDash + .32))), gc = hillY(xc, ...HILL) + 4;
    const mood = emotions(t, [[18.3, 'playful'], [tGrow - .1, 'excited'], [20.1, 'cool'], [20.35, 'thinking', { lookY: -1, lookX: .3 }], [21.25, 'confused', { lookY: -.8 }],
      [tSee, 'surprised', { lookX: 1 }], [22.95, 'love', { lookX: 1 }], [24.3, 'happy', { emote: 'music', lookX: .8 }], [25.9, 'happy', { lookX: .8, emote: 'hearts' }]]);
    let pose = {};
    if (t < tGrow + .3) { const g = seg(t, tGrow - .12, tGrow), s = seg(t, tGrow, tGrow + .3); pose = { sq: t < tGrow ? .18 * ease(g) : -.35 * Math.exp(-s * 5) * Math.cos(s * 14) }; }
    if (t > tDash - .12 && t < tDash + .45) { const k = seg(t, tDash, tDash + .3); pose = { view: t < tDash ? 'q' : 'side', sq: t < tDash ? .15 : -.12 * Math.sin(k * Math.PI), smear: t > tDash && t < tDash + .2 ? .8 : 0, smearDir: 1, rot: t > tDash + .2 ? -.12 * spring(t, tDash + .25, 5, 14) : 0 }; }
    if (t > 24.3 && t < 25.9) pose = { ...move('sway', t, 1), view: 'q' };
    else if (t >= tDash + .45) pose = { view: 'q' };
    if (t > 25.9) pose = { view: 'q', rot: .06 * ease(seg(t, 25.9, 26.5)) };
    const o = add(mood, pose);
    clawd(xc, gc, u, { ...o, hat: grown ? 'headphones' : 'party' });
    if (t > tGrow && t < tGrow + .6) { const k = seg(t, tGrow, tGrow + .6); boilSeed('growspark'); for (const d of [-1, 1]) paint(starPts(xc + d * 190, gc - 250 - 40 * k, 26 * Math.sin(k * Math.PI), .3, 4), { wash: PAL.cream, ink: PAL.ink, sw: .5 }); }

    // the partner: walks in, is nearly bowled over, then dances too
    if (t > 21.9) {
      const w = stroll(t, 21.9, 22.85, 2150, 1170, 26), xp = w.x, gp = hillY(xp, ...HILL) + 4;
      const pm = emotions(t, [[21.9, 'happy'], [tDash + .15, 'surprised', { lookX: -1 }], [23.75, 'shy', { lookX: -1 }], [24.3, 'happy', { lookX: -.8 }]]);
      let pp = t < 22.85 ? { view: 'q', walk: w.walk, dy: w.dy, flip: true } : { view: 'q', flip: true };
      if (t > tDash + .15 && t < tDash + .6) pp.rot = -.1 * Math.exp(-(t - tDash - .15) * 6);   // a little lean back from the dash
      if (t > 24.3 && t < 25.9) pp = { ...move('sway', t + .3, 2), view: 'q', flip: true };
      if (t > 25.9) pp = { view: 'q', flip: true, rot: -.06 * ease(seg(t, 25.9, 26.5)) };
      clawd(xp, gp, 26, { ...add(pm, pp), ...PARTNER, hat: 'flower', seed: 3, boilKey: 'partner' });
    }
    camEnd();
    boilSeed('wipeC');
    if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, [C.greyDk, C.grey]);
  }

  // ---------- D: adulthood ----------
  const tHat = 29.85, tBoxes = [30.85, 33.35, 33.9], tTopple = 34.85, tStand = 35.75, tLift1 = 36.05, tSit = 36.8, tTug = 40.1, tLift = 41.75, tSun = 42.3;
  function shotAdult(t, lt, dur) {
    const G = 870, u = 26, X = 900;
    // the days: the light flickers day → night → day, faster and faster
    const s = seg(t, 31.8, 33.2), ph = TAU * (2.2 * s + 1.4 * s * s), night = t > 31.8 && t < 33.2 ? .5 - .5 * Math.cos(ph) : 0;
    const warm = ease(seg(t, tSun, 44.6));
    const skyC = mixCol(mixCol(C.grey, C.night, night * .85), C.duskHi, warm);
    camBegin(960 + 15 * Math.sin(t * .4), 540, kf(t, [[28.6, 1.0], [38.4, 1.0], [40.5, 1.1], [tLift, 1.1], [44, 1.0]]));
    sky(skyC, mixCol(skyC, '#FFFFFF', .15), 'adultsky');
    if (t > 31.8 && t < 33.2) {   // a sun (then a moon) races across each day
      const f = frac(ph / TAU), day = Math.cos(ph) > 0 ? 0 : 1;
      boilSeed('dayorb'); paint(ellPts(lerp(-100, 2000, f), 330 - 200 * Math.sin(f * Math.PI), 46, 46, 20), { wash: day ? '#F4EEDC' : '#FFE9A0', ink: PAL.ink, sw: .6 });
    }
    if (warm > 0) sun(1420, 250, 70, '#FFE6A0', warm);
    // the town, far off
    boilSeed('town');
    for (let i = 0; i < 7; i++) { const x = 80 + i * 280 + 40 * hash(i), h = 160 + 150 * hash(i + 20); paint(rectPts(x, G - 30 - h, 150 + 60 * hash(i + 5), h + 30, 2), { wash: mixCol(mixCol(C.town, C.night, night * .6), C.duskHill, warm * .5), ink: PAL.ink, sw: .7 }); }
    // clouds over the head, until the sun breaks through
    const part = ease(seg(t, tSun - .2, tSun + 1.2));
    cloud(700 - 900 * part, 180, 120, mixCol('#8D949F', C.night, night * .5), 'd1');
    cloud(1300 + 900 * part, 150, 100, mixCol('#9AA1AB', C.night, night * .5), 'd2');
    // the road: its dashes slide while Clawd plods
    const walking = t > 31.6 && t < tTopple, trudge = t < 31.6 ? 0 : (Math.min(t, tTopple) - 31.6) * 170;
    boilSeed('road');
    paint(rectPts(-500, G - 20, W + 1000, 600, 3), { wash: mixCol(C.road, C.duskHill, warm * .6), ink: null });
    inkLine([[-500, G - 18], [960, G - 22], [W + 500, G - 16]], 1, PAL.ink, 'ink', .5);
    for (let i = 0; i < 9; i++) { const x = ((i * 300 - trudge) % 2700 + 2700) % 2700 - 400; boilSeed('dash' + i); paint(rectPts(x, G + 70, 140, 16, 1), { wash: '#D8D2C2', ink: null }); }

    // Clawd: the hat, the loads, the fall, getting up, the rain, the small hand, the lift
    const mood = emotions(t, [[28.6, 'neutral'], [tHat + .03, 'surprised'], [30.35, 'neutral'], [tBoxes[0] + .05, 'nervous'], [tBoxes[1] + .05, 'sad'],
      [tTopple + .1, 'ko'], [tStand - .1, 'determined'], [tSit, 'sleepy'], [tTug + .15, 'surprised', { lookX: -.9, lookY: .6 }], [40.85, 'hopeful', { lookX: -.9, lookY: .6 }],
      [tLift + .6, 'love'], [43.4, 'happy', { lookY: -.6 }]], { take: .8 });
    const loaded = tBoxes.filter(b => t > b + .12).length * (t < tTopple ? 1 : 0) + (t > tLift1 + .35 && t < tLift + .2 ? 1 : 0);
    let pose = { sq: .07 * loaded + ring(t, tBoxes.map(b => b + .12), 7, 22) * .14, aL: loaded ? 1.35 : undefined, aR: loaded ? 1.35 : undefined };
    if (walking) { pose.walk = (t - 31.6) * 1.4; pose.dy = -.25 * Math.abs(Math.sin((t - 31.6) * 1.4 * Math.PI)); }
    if (t > tHat && t < tHat + .4) pose.sq += take(t, tHat, .7).sq;
    if (t > tTopple && t < tStand + .3) { const k = seg(t, tTopple, tTopple + .15); pose = { sq: .3 * k + (t > tStand ? -.3 * ease(seg(t, tStand, tStand + .3)) : 0), rot: -.12 * k * (1 - seg(t, tStand, tStand + .3)), aL: -.6, aR: -.4 }; }
    if (t > tSit - .1) pose = { ...pose, sq: pose.sq + .12 * ease(seg(t, tSit - .1, tSit + .3)) * (1 - ease(seg(t, tTug + .1, tTug + .5))), aL: t > tTug - .2 && t < tLift - .2 ? -1.0 : pose.aL };
    if (t > tLift - .15) {   // lift the little one up onto its head, arms up to steady it
      const k = ease(seg(t, tLift - .15, tLift + .3));
      pose = { sq: .1 * (1 - k) + (t > tLift + .45 ? -.08 * spring(t, tLift + .45, 5, 12) : 0), aL: lerp(-1, 1.25, k), aR: lerp(.2, 1.25, k), dy: -.3 * Math.sin(seg(t, tLift, tLift + .5) * Math.PI) };
    }
    const o = add(mood, pose);
    if (t > tSit && t < tTug) o.dy = (o.dy || 0);
    clawd(X, G, u, { ...o, hat: t > tHat ? 'hard' : undefined });
    const top = headTop(G, u, o) - 1.2 * u;
    if (t > tHat - .5 && t <= tHat) { push(); translate(X, lerp(G - 700, G, easeIn(seg(t, tHat - .5, tHat)))); hat(u, 'hard', clamp(u / 15, .45, 2.4)); pop(); }
    // the boxes: dropped on one by one, swaying as a stack; they topple; one is lifted again; it falls off for good
    const sway = .05 * Math.sin(t * 2.3) * Math.min(loaded, 3) + ring(t, tBoxes.map(b => b + .12), 5, 16) * .06;
    tBoxes.forEach((b0, i) => {
      if (t < b0 - .45) return;
      if (t < tTopple) {
        const ly = top - i * 3 * u, y = t < b0 ? lerp(ly - 900, ly, easeIn(seg(t, b0 - .45, b0))) : ly;
        box(X + Math.sin(sway) * i * 3 * u, y, u, sway * (i + 1) * .6, 'b' + i);
      } else if (i > 0 || t < tLift1) {   // flung off on arcs, landing on the road
        const land = [[X + 330, G - 4], [X - 380, G - 4], [X + 520, G - 4]][i], from = [X, top - i * 3 * u], k = seg(t, tTopple, tTopple + .55);
        const p = arcPt(from, land, 180 + 60 * i, easeOut(k));
        box(p[0], p[1], u, lerp(0, [1.6, -1.2, .4][i], k) * (1 - .0) + (k >= 1 ? 0 : 0), 'b' + i);
      } else if (t < tLift - .1) {   // the first box, lifted back onto the head
        const k = ease(seg(t, tLift1, tLift1 + .35)), p = arcPt([X + 330, G - 4], [X, top], 120, k);
        box(p[0], p[1], u, lerp(1.6, 0, k) + (k >= 1 ? sway : 0), 'b0');
      } else {   // …and dropped behind for good when the little one goes up
        const k = seg(t, tLift - .1, tLift + .35), p = arcPt([X, top], [X + 380, G - 4], 90, easeIn(k));
        box(p[0], p[1], u, lerp(0, 1.4, k), 'b0');
      }
    });

    // the little one: toddles in, tugs at Clawd's hand, is lifted onto its head
    if (t > 38.3) {
      const ul = 13, tip = armTip(X, G, u, { ...o, aL: -1.0 }, 'L');
      const reach = 6.8 * ul, xl1 = tip[0] - reach, w = stroll(t, 38.35, 39.75, -200, xl1, ul);
      const lm = emotions(t, [[38.3, 'happy'], [tTug - .1, 'hopeful', { lookX: 1, lookY: -.7 }], [tLift + .3, 'laugh']]);
      let lp = t < 39.75 ? { view: 'q', walk: w.walk, dy: w.dy } : { view: 'q', aR: .6 + .12 * Math.sin((t - tTug) * 16) * (t > tTug && t < tTug + .6 ? 1 : 0) };
      let xl = w.x, gl = G;
      if (t > tLift - .15) {   // up onto the head
        const k = ease(seg(t, tLift - .15, tLift + .3));
        xl = lerp(xl1, X, k); gl = lerp(G, headTop(G, u, o) - .2 * u, k) - 120 * Math.sin(k * Math.PI);
        lp = { view: k > .5 ? 'front' : 'q', aL: lerp(.2, 1.2, k), aR: lerp(.6, 1.2, k), noShadow: true };
      }
      clawd(xl, gl, ul, { ...add(lm, lp), ...LITTLE, hat: 'party', seed: 7, boilKey: 'little' });
    }
    // the rain, while Clawd sits it out
    rain(t, seg(t, tSit - .4, tSit + .3) * (1 - seg(t, tSun - .3, tSun + .3)));
    camEnd();
    boilSeed('wipeD');
    if (lt < .3) brushWipe(.5 + lt / .6, [C.greyDk, C.grey]);
    if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, ['#E0874F', '#F2B06B']);
  }

  // ---------- E: old age ----------
  const tTurnP = 48.85, tGo = 49.6, tSet = 51.0;
  function shotOld(t, lt, dur) {
    const dusk = ease(seg(t, 52.8, 54.3)), up = ease(seg(t, 53.45, 54.3));
    camBegin(960, lerp(560, 540 - 1450, up), 1.06 - .04 * up);
    sky(mixCol(C.dusk, C.night, dusk), mixCol(C.duskHi, C.night, dusk), 'oldsky');
    const sunY = kf(t, [[45, 420], [53.6, 870]], x => x);
    sun(330, sunY, 80, '#FFD98A', .9 * (1 - dusk));
    hill(1750, 1150, 800, 300, mixCol('#C99A60', C.nightHill, dusk), t, 0, 'o2');
    // far off on the next hill: the little one, grown, chasing the butterfly (childhood, again)
    const fx = 1720 + 110 * Math.sin((t - 45) * .9), fg = hillY(fx, 1750, 1150, 800, 300) + 3;
    if (dusk < .9) {
      clawd(fx, fg, 9, { ...feel('playful', t), view: 'side', flip: Math.cos((t - 45) * .9) < 0, ...jump(frac((t - 45) / .6), .1, .9, 2.5), ...LITTLE, hat: 'party', boilKey: 'far' });
      butterfly(fx + (Math.cos((t - 45) * .9) < 0 ? -60 : 60), fg - 120 + 20 * Math.sin(t * 3), 11, t, { key: 'far' });
    }
    tree(TX, hillY(TX, ...HILL) + 6, 330, mixCol(C.rust, C.nightHill, dusk), t);
    hill(...HILL, mixCol(C.duskHill, C.nightHill, dusk), t, 20, 'o');
    // leaves drifting down from the tree
    for (let i = 0; i < 7; i++) {
      const p = frac(t * .09 + hash(i + 40)), lx = 1150 + 420 * hash(i + 41) - 260 * p + 40 * Math.sin(t * 1.3 + i), ly = 560 + p * 480;
      boilSeed('leaf' + i); paint(ellPts(lx, ly, 13, 7, 10, 0, t * 1.5 + i), { wash: i % 2 ? C.rust : '#E8A64E', ink: PAL.ink, sw: .5 });
    }

    // the partner: smiles at Clawd, then becomes a light that rises into the sky
    const xp = 1050, gp = hillY(xp, ...HILL) + 4, gone = seg(t, tGo, 50.25);
    if (gone < 1) {
      const pm = emotions(t, [[45, 'relieved', { emote: null }], [tTurnP, 'happy', { lookX: -1 }], [tGo - .05, 'relieved', { emote: null }]]);
      const pp = { view: t < tTurnP - .1 ? 'q' : 'front', flip: true, sq: .1 + .5 * easeIn(gone), sx: 1 - .7 * easeIn(gone) };
      clawd(xp, gp, 26, { ...add(pm, pp), ...OLDP, hat: 'flower', seed: 3, boilKey: 'partner' });
    }
    const light = seg(t, tGo, 51.6);
    if (t > tGo) {
      const p = arcPt([xp, gp - 110], [1330, 150], 120, ease(seg(t, 50.0, 51.8)));
      glow(p[0], p[1], 140 + 120 * Math.sin(light * Math.PI), '#FFE6A0', .9);
      boilSeed('pstar'); paint(starPts(p[0], p[1], 16, .4, 4), { wash: '#FFF3C8', ink: null });
    }

    // Clawd, old: watches the little one far off, sees its partner go, sets down what it carried, smiles
    const xc = 690, gc = hillY(xc, ...HILL) + 4;
    const mood = emotions(t, [[45, 'relieved', { emote: null }], [45.9, 'hopeful', { lookX: 1, lookY: -.1 }], [tTurnP + .15, 'happy', { lookX: 1 }], [50.1, 'sad', { lookX: .7, lookY: -.9 }],
      [51.35, 'relieved', { emote: null }], [52.45, 'happy', { lookX: .6, lookY: -1 }]], { take: .6 });
    const held = t < tSet;
    const pose = { view: 'q', sq: .08, aR: held ? .15 : .2, aL: -.3 };
    const o = add(mood, pose);
    const hold = held ? (u2, sw) => box(1.5 * u2, 1.2 * u2, u2 * .38, 0, 'small') : null;
    clawd(xc, gc, 26, { ...o, ...OLD, hat: 'fedora', seed: 1, armR: hold });
    if (!held) {   // set down on the grass beside it
      const k = ease(seg(t, tSet, tSet + .45)), p = arcPt([xc + 200, gc - 110], [xc + 190, gc + 2], 40, k);
      box(p[0], p[1], 26 * .38, 0, 'small');
    }
    camEnd();
    boilSeed('wipeE');
    if (lt < .3) brushWipe(.5 + lt / .6, ['#E0874F', '#F2B06B']);
  }

  // ---------- F: the end, and the next beginning ----------
  const MEM = [[58.15, 1060, 250, 'flower'], [58.85, 1560, 330, 'heart'], [59.55, 1200, 420, 'hat']];
  const tClose = 61.2, tLandB = 61.65, tRise = 62.75, tIris = 63.8, tCoda = 65.1;
  function shotEnd(t, lt, dur) {
    if (t >= tCoda) {   // the coda: the glow in the dark again, opening on a new small Clawd at dawn
      const bt = kf(t, [[tCoda, 1.0], [66.6, 3.2], [69.32, 6.0]], x => x);
      birth(bt, t, true);
      const f = seg(t, 68.85, 69.3); if (f > 0) paint(rectPts(-60, -60, W + 120, H + 120), { wash: C.dark, washOp: 255 * f, ink: null });
      return;
    }
    const down = ease(seg(t, 54.3, 55.4));
    camBegin(960, lerp(540 - 1450, 520, down), kf(t, [[55.4, 1.0], [61, 1.12]]));
    sky(C.night, '#27306A', 'endsky');
    stars(t, 50, -1500, 760);
    // the partner's star, and the memories lighting up beside it
    const ps = [1330, 150];
    glow(ps[0], ps[1], 150 + 20 * Math.sin(t * 2), '#FFE6A0', .8);
    boilSeed('pstarF'); paint(starPts(ps[0], ps[1], 18 + 2 * Math.sin(t * 3), .4, 4), { wash: '#FFF3C8', ink: null });
    for (const [t0, mx, my, kind] of MEM) {
      if (t < t0) continue;
      const k = backOut(seg(t, t0, t0 + .45)), fl = Math.exp(-(t - t0) * 2.5);
      glow(mx, my, 90 + 160 * fl, '#FFE6A0', .5 + .5 * fl);
      push(); translate(mx, my); scale(1.4 * k);
      boilSeed('mem' + kind);
      if (kind === 'flower') { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; paint(ellPts(Math.cos(a) * 20, Math.sin(a) * 20, 15, 10, 10, 0, a), { wash: '#F08EA6', ink: PAL.ink, sw: .5 }); } paint(ellPts(0, 0, 10, 10, 10), { wash: PAL.ochre, ink: PAL.ink, sw: .5 }); }
      else if (kind === 'heart') paint(heartPts(0, 0, 30), { wash: '#E2476E', ink: PAL.ink, sw: .6 });
      else { hat(14, 'party', .8); }
      pop();
    }
    hill(1750, 1150, 800, 300, C.nightHill, t, 0, 'f2');
    tree(TX, hillY(TX, ...HILL) + 6, 330, C.nightHill, t, true);
    hill(...HILL, mixCol(C.nightHill, '#3A4468', .4), t, 20, 'f');

    // Clawd, alone, looking up; the memories; eyes close; the butterfly comes to rest on its hat
    const xc = 690, gc = hillY(xc, ...HILL) + 4;
    const mood = emotions(t, [[54.3, 'relieved', { lookX: .6, lookY: -1, eyes: 'normal', emote: null }], [MEM[0][0] + .2, 'hopeful', { lookX: .5, lookY: -1 }], [MEM[2][0] + .3, 'love', { lookX: .6, lookY: -1 }],
      [60.55, 'sleepy'], [tClose, 'relieved', { emote: null }]], { take: .5 });
    const o = add(mood, { view: 'q', sq: .08, aL: -.3, aR: .1 });
    clawd(xc, gc, 26, { ...o, ...OLD, hat: 'fedora', seed: 1 });
    const brim = [xc + .6 * 26 + (o.dx || 0) * 26, headTop(gc, 26, o) - 1.6 * 26];
    let b = null, rest = false, lightK = 0;
    if (t > 60.4 && t < tLandB) b = flight(t, [[60.4, [300, 120]], [61.1, [560, 330]], [tLandB, brim]], 20 * (1 - seg(t, 61.3, tLandB)));
    else if (t >= tLandB && t < tRise) { b = brim; rest = true; }
    else if (t >= tRise) { lightK = seg(t, tRise, tIris); b = arcPt(brim, [960, 300], -60, ease(lightK)); }
    const bs = b ? toScreen(b[0], b[1]) : null;
    if (b) butterfly(b[0], b[1], 28, t, { rest, light: lightK * 1.2 });
    camEnd();
    // the iris closes on the rising light; it ends as the glow in the dark from the first frame
    if (t > tIris) {
      const k = seg(t, tIris, 64.8), c = [lerp(bs[0], 960, ease(k)), lerp(bs[1], 640, ease(k))];
      const r = lerp(1400, 0, easeIn(k));
      if (r < 5) darkFrame(); else iris(c[0], c[1], r, C.dark);
      glow(c[0], c[1], 150 + 30 * Math.sin(t * 3.2), C.glowW, seg(t, tIris + .3, 64.6));
      glow(c[0], c[1], 40, '#FFF1C8', seg(t, tIris + .3, 64.6));
    }
  }

  shots([[0, shotBirth], [6.5, shotChild], [18.3, shotYouth], [28.6, shotAdult], [45.0, shotOld], [54.3, shotEnd]]);
})();
