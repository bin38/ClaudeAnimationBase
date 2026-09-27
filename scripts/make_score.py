"""make_score.py: synthesizes the 3-minute score and sound effects for src/scenes/shunfang.js.

96 BPM (a bar is 2.5 s), 72 bars, C-major pentatonic over I-V-vi-IV. Every chapter of the film starts on a bar line,
and each sound effect is placed on the event time it belongs to in the picture (see the shot functions).
Run:  python3 scripts/make_score.py   ->  assets/shunfang_score.wav (then encoded to .m4a by the caller)
Needs numpy and scipy.
"""
import numpy as np
from scipy.signal import lfilter, fftconvolve, butter, sosfilt
import wave, sys

SR = 44100
DUR = 180.0
BPM = 96
BEAT = 60 / BPM
BAR = 4 * BEAT
N = int(DUR * SR)
rng = np.random.default_rng(7)

music = np.zeros((2, N + SR * 4))
sfx = np.zeros((2, N + SR * 4))


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(n):
    return np.arange(n) / SR


def add(buf, t0, sig, gain=1.0, pan=0.0):
    i = int(round(t0 * SR))
    if i < 0:
        sig = sig[-i:]
        i = 0
    n = min(len(sig), buf.shape[1] - i)
    if n <= 0:
        return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + n] += sig[:n] * gain * l * 1.414
    buf[1, i:i + n] += sig[:n] * gain * r * 1.414


def env(n, a=.005, d=.1, s=.7, r=.2, hold=None):
    t = tt(n)
    hold = (n / SR - r) if hold is None else hold
    e = np.where(t < a, t / max(a, 1e-6), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-6)))
    rel = np.clip((t - hold) / max(r, 1e-6), 0, 1)
    return e * (1 - rel)


def lp(x, fc, order=2):
    sos = butter(order, min(fc, SR / 2 - 100) / (SR / 2), 'low', output='sos')
    return sosfilt(sos, x)


def hp(x, fc, order=2):
    sos = butter(order, fc / (SR / 2), 'high', output='sos')
    return sosfilt(sos, x)


def bp(x, f1, f2, order=2):
    sos = butter(order, [f1 / (SR / 2), min(f2, SR / 2 - 100) / (SR / 2)], 'band', output='sos')
    return sosfilt(sos, x)


# ---------------- instruments ----------------
def pluck(m, dur=1.6, bright=.5, decay=.996):
    """Karplus-Strong string: a guzheng-ish pluck, with a tiny upward bend into the note."""
    f = hz(m)
    n = int(dur * SR)
    L = max(2, int(round(SR / f)))
    x = np.zeros(n)
    burst = rng.uniform(-1, 1, L)
    burst = lp(burst, 1500 + 6000 * bright)
    x[:L] = burst
    a = np.zeros(L + 2)
    a[0] = 1
    a[L] = -decay * .5
    a[L + 1] = -decay * .5
    y = lfilter([1], a, x)
    y *= env(n, .002, 10, 1, .08)
    return y / (np.max(np.abs(y)) + 1e-9)


def piano(m, dur=1.2):
    f = hz(m)
    n = int((dur + .6) * SR)
    t = tt(n)
    y = np.zeros(n)
    for k in range(1, 8):
        if f * k > 12000:
            break
        y += np.sin(TAU * f * k * t * (1 + .0004 * k * k)) * (1 / k ** 1.6) * np.exp(-t * (1.2 + .9 * k))
    y *= env(n, .004, 10, 1, .35, hold=dur)
    return y * .8


def bell(m, dur=1.5, idx=2.5, ratio=3.5):
    f = hz(m)
    n = int(dur * SR)
    t = tt(n)
    mod = idx * np.exp(-t * 4) * np.sin(TAU * f * ratio * t)
    y = np.sin(TAU * f * t + mod) * np.exp(-t * 3.2)
    return y * env(n, .002, 10, 1, .05)


def musicbox(m, dur=1.0):
    f = hz(m)
    n = int(dur * SR)
    t = tt(n)
    y = (np.sin(TAU * f * t) + .35 * np.sin(TAU * f * 4.02 * t) * np.exp(-t * 6)) * np.exp(-t * 3.5)
    return y * env(n, .002, 10, 1, .05)


def saw_voice(f, t, nh=14, bright=1.0):
    y = np.zeros_like(t)
    for k in range(1, nh + 1):
        if f * k > 9000:
            break
        y += np.sin(TAU * f * k * t) / k * np.exp(-k / (4 + 8 * bright))
    return y


def pad(ms, dur, att=.8, rel=1.2, bright=.3, vib=0.0):
    n = int((dur + rel) * SR)
    t = tt(n)
    y = np.zeros(n)
    for m in ms:
        for d in (-.06, 0, .07):
            f = hz(m + d)
            ph = t + (vib * np.sin(TAU * 5.2 * t) / (TAU * 5.2) if vib else 0)
            y += saw_voice(f, ph, 10, bright)
    y *= env(n, att, 10, 1, rel, hold=dur)
    return y / (3 * len(ms))


def bass(m, dur=.5):
    f = hz(m)
    n = int((dur + .1) * SR)
    t = tt(n)
    y = np.sin(TAU * f * t) + .35 * np.sin(TAU * 2 * f * t) + .12 * np.sin(TAU * 3 * f * t)
    y = np.tanh(1.5 * y) * env(n, .006, .25, .6, .08, hold=dur)
    return y * .7


def kick():
    n = int(.45 * SR)
    t = tt(n)
    f = 45 + 90 * np.exp(-t * 30)
    ph = TAU * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 8) + .3 * rng.uniform(-1, 1, n) * np.exp(-t * 200)


def snare():
    n = int(.3 * SR)
    t = tt(n)
    return .6 * bp(rng.uniform(-1, 1, n), 1500, 8000) * np.exp(-t * 18) + .5 * np.sin(TAU * 190 * t) * np.exp(-t * 25)


def hat(open_=False):
    n = int((.25 if open_ else .06) * SR)
    t = tt(n)
    return hp(rng.uniform(-1, 1, n), 7000) * np.exp(-t * (12 if open_ else 70))


def clap():
    n = int(.25 * SR)
    t = tt(n)
    e = np.zeros(n)
    for o in (0, .011, .022):
        e += np.where(t >= o, np.exp(-(t - o) * 90), 0)
    e += .5 * np.exp(-t * 14)
    return bp(rng.uniform(-1, 1, n), 900, 5000) * e


def tom(f0=180):
    n = int(.6 * SR)
    t = tt(n)
    f = f0 * (.55 + .45 * np.exp(-t * 12))
    return np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t * 6)


def shaker():
    n = int(.08 * SR)
    t = tt(n)
    return hp(rng.uniform(-1, 1, n), 5000) * np.sin(np.pi * np.clip(t / .08, 0, 1)) ** 2


# ---------------- sound effects ----------------
def whoosh(dur=.8, f0=300, f1=3000, rise=True):
    n = int(dur * SR)
    t = tt(n)
    x = rng.uniform(-1, 1, n)
    k = t / dur
    fc = (f0 + (f1 - f0) * k) if rise else (f1 + (f0 - f1) * k)
    y = np.zeros(n)
    a = 0.0
    out = np.zeros(n)
    # time-varying one-pole lowpass then a highpass tilt
    coef = np.exp(-TAU * fc / SR)
    for i in range(n):
        a = (1 - coef[i]) * x[i] + coef[i] * a
        out[i] = a
    y = hp(out, 150) * np.sin(np.pi * k) ** 1.5
    return y / (np.max(np.abs(y)) + 1e-9)


def click(f=2400, d=.012):
    n = int(d * SR)
    t = tt(n)
    return (np.sin(TAU * f * t) * .6 + bp(rng.uniform(-1, 1, n), 1500, 9000)) * np.exp(-t * 400)


def woodblock(f=720):
    n = int(.15 * SR)
    t = tt(n)
    return (np.sin(TAU * f * t) + .5 * np.sin(TAU * f * 2.7 * t)) * np.exp(-t * 45) + .2 * bp(rng.uniform(-1, 1, n), 800, 3000) * np.exp(-t * 200)


def thump(f=70):
    n = int(.4 * SR)
    t = tt(n)
    return np.sin(TAU * np.cumsum(f * (1 + np.exp(-t * 25))) / SR) * np.exp(-t * 10) + .35 * lp(rng.uniform(-1, 1, n), 1200) * np.exp(-t * 40)


def pop(f0=420, f1=1100):
    n = int(.09 * SR)
    t = tt(n)
    f = f0 + (f1 - f0) * (t / .09)
    return np.sin(TAU * np.cumsum(f) / SR) * np.sin(np.pi * t / .09)


def sparkle(base=84, n_=4, gap=.045):
    y = np.zeros(int((n_ * gap + 1) * SR))
    for i in range(n_):
        s = bell(base + [0, 4, 7, 12, 16, 19][i % 6], .9, 1.2, 3.01)
        j = int(i * gap * SR)
        y[j:j + len(s)] += s * (1 - i * .12)
    return y


def bubble():
    d = .12
    n = int(d * SR)
    t = tt(n)
    f0 = rng.uniform(300, 700)
    f = f0 * (1 + 1.5 * t / d)
    return np.sin(TAU * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 2


def zap(dur=.5):
    n = int(dur * SR)
    t = tt(n)
    f = 1800 * np.exp(-t * 3) + 300 + 60 * np.sin(TAU * 30 * t)
    y = np.sign(np.sin(TAU * np.cumsum(f) / SR)) * .3
    return lp(y, 4000) * env(n, .01, 10, 1, .1)


def horn(dur=1.6):
    n = int(dur * SR)
    t = tt(n)
    y = saw_voice(hz(45), t, 20, .6) + .8 * saw_voice(hz(52), t, 20, .6)
    return lp(y, 900) * env(n, .12, 10, 1, .35) * .7


def firework():
    n = int(1.6 * SR)
    t = tt(n)
    boom = lp(rng.uniform(-1, 1, n), 300) * np.exp(-t * 4) * 3
    crack = np.zeros(n)
    for _ in range(40):
        i = int(rng.uniform(.15, 1.3) * SR)
        c = click(rng.uniform(2000, 6000), .006)
        crack[i:i + len(c)] += c * rng.uniform(.2, .6)
    return boom + crack


def riser(dur=2.0):
    n = int(dur * SR)
    t = tt(n)
    k = t / dur
    y = whoosh(dur, 200, 6000) * .7 + .3 * np.sin(TAU * np.cumsum(200 + 900 * k ** 2) / SR) * k
    return y * k


TAU = 2 * np.pi

# ---------------- composition ----------------
PROG = ['C', 'G', 'Am', 'F']
PADV = {'C': [60, 64, 67], 'G': [59, 62, 67], 'Am': [57, 60, 64], 'F': [57, 60, 65]}
ROOT = {'C': 36, 'G': 43, 'Am': 45, 'F': 41}
ARP = {'C': [72, 76, 79, 84], 'G': [71, 74, 79, 83], 'Am': [72, 76, 81, 84], 'F': [72, 77, 81, 84]}
# motif A and B: (beat within the 4-bar phrase, midi, beats)
MA = [(0, 76, 1), (1, 79, .5), (1.5, 81, .5), (2, 79, 1), (3, 76, 1),
      (4, 74, 1.5), (5.5, 76, .5), (6, 74, 1), (7, 67, 1),
      (8, 69, 1), (9, 72, .5), (9.5, 74, .5), (10, 76, 1.5), (11.5, 74, .5),
      (12, 72, 1.5), (13.5, 69, .5), (14, 72, 2)]
MB = [(0, 79, .5), (.5, 81, .5), (1, 84, 1), (2, 81, .5), (2.5, 79, .5), (3, 76, 1),
      (4, 74, 1), (5, 79, 1), (6, 76, .5), (6.5, 74, .5), (7, 74, 1),
      (8, 76, .5), (8.5, 79, .5), (9, 81, 1.5), (10.5, 79, .5), (11, 76, 1),
      (12, 74, 1), (13, 72, 1), (14, 72, 2)]


def bar_t(b):
    return b * BAR


def melody(b0, motif, inst='pluck', gain=.3, oct_=0, pan=-.15):
    for (bt, m, d) in motif:
        t0 = bar_t(b0) + bt * BEAT
        if t0 >= DUR:
            continue
        m += 12 * oct_
        if inst == 'pluck':
            add(music, t0, pluck(m, max(1.2, d * BEAT + .9), .6), gain, pan)
        elif inst == 'piano':
            add(music, t0, piano(m, d * BEAT), gain, pan)
        elif inst == 'box':
            add(music, t0, musicbox(m, 1.2), gain, pan)
        elif inst == 'lead':
            add(music, t0, pad([m], d * BEAT, .03, .25, .8, vib=.004), gain, pan)


def section(b):
    for name, a, z in [('intro', 0, 6), ('origin', 6, 15), ('fabric', 15, 23), ('design', 23, 31), ('factory', 31, 41),
                       ('green', 41, 51), ('global', 51, 60), ('team', 60, 67), ('outro', 67, 72)]:
        if a <= b < z:
            return name, b - a
    return 'outro', 0


for b in range(72):
    ch = PROG[b % 4]
    t0 = bar_t(b)
    sec, sb = section(b)
    last = b == 71
    # pad under everything (fades at the very end)
    padg = {'intro': .16, 'origin': .14, 'fabric': .12, 'design': .1, 'factory': .12, 'green': .16, 'global': .18, 'team': .16, 'outro': .15}[sec]
    add(music, t0, pad(PADV[ch], BAR * (1.6 if last else 1) + .1, .35, .9, .25), padg, 0)
    # music box arpeggio: intro, green breakdown, outro
    if sec in ('intro', 'outro') or (sec == 'green' and sb < 4) or sec == 'team':
        for i in range(8):
            m = ARP[ch][[0, 1, 2, 3, 2, 1, 2, 3][i]] + (12 if sec == 'team' else 0)
            if last and i > 3:
                break
            add(music, t0 + i * BEAT / 2, musicbox(m, 1.0), .1 if sec != 'team' else .06, .35 if i % 2 else -.35)
    # piano comping
    if sec in ('origin', 'fabric', 'factory', 'global', 'outro') or (sec == 'green' and sb >= 4):
        for q in range(4):
            if sec == 'outro' and last and q > 0:
                break
            for m in PADV[ch]:
                add(music, t0 + q * BEAT, piano(m, BEAT * (4 if last else .9)), .07 if q % 2 else .09, .1)
    # bass
    if sec in ('fabric', 'design', 'factory', 'global', 'team') or (sec == 'green' and sb >= 6):
        r = ROOT[ch]
        if sec in ('factory', 'global', 'team'):
            for e in range(8):
                add(music, t0 + e * BEAT / 2, bass(r + (12 if e % 2 else 0), BEAT / 2 * .9), .22, 0)
        elif sec == 'design':
            for e, (o, d) in enumerate([(0, .9), (7, .4), (12, .4), (7, .9)]):
                add(music, t0 + [0, 1.5, 2, 3][e] * BEAT, bass(r + o, d * BEAT), .22, 0)
        else:
            for q in range(4):
                add(music, t0 + q * BEAT, bass(r, BEAT * .9), .2, 0)
    # strings swell: time-lapse, global, team, green build
    if (sec == 'origin' and 4 <= sb < 8) or sec in ('global', 'team') or (sec == 'green' and sb >= 5) or (sec == 'factory' and sb >= 6):
        add(music, t0, pad([m + 12 for m in PADV[ch]], BAR + .2, .6, .8, .55, vib=.003), .1 if sec != 'global' else .14, 0)
    # drums
    if sec in ('fabric', 'design', 'factory', 'global', 'team') or (sec == 'green' and sb >= 7):
        for q in range(4):
            tq = t0 + q * BEAT
            if q in (0, 2) or sec in ('factory', 'team', 'global'):
                add(music, tq, kick(), .5 if q in (0, 2) else .35, 0)
            if q in (1, 3) and sec in ('factory', 'global', 'team'):
                add(music, tq, snare(), .22, .05)
            if q in (1, 3) and sec in ('design', 'team'):
                add(music, tq, clap(), .2, -.05)
            for e in range(2):
                add(music, tq + e * BEAT / 2, hat(open_=(e == 1 and sec == 'team')), .07 if e else .05, .3)
        if sec == 'global':
            for i, f in enumerate([200, 170, 140, 120]):
                if (b - 51) % 2 == 1:
                    add(music, t0 + 3 * BEAT + i * BEAT / 4, tom(f), .25, -.3 + .2 * i)
    if (sec == 'origin' and sb >= 4) or sec == 'fabric':
        for s in range(8):
            add(music, t0 + s * BEAT / 2, shaker(), .06, -.4)

# melodies
for b0 in (2,):
    melody(b0, MA, 'pluck', .28)
for b0, mo in [(6, MA), (10, MB)]:
    melody(b0, mo, 'pluck', .3)
melody(14, [(0, 79, 1), (1, 76, 1), (2, 74, 1), (3, 72, 1)], 'pluck', .25)
for b0, mo in [(15, MA), (19, MB)]:
    melody(b0, mo, 'pluck', .28)
    melody(b0, mo, 'box', .06, 1)
for b0, mo in [(23, MA), (27, MB)]:
    melody(b0, [(bt, m, .4) for bt, m, d in mo], 'pluck', .3, 0, .2)
for b0, mo in [(31, MA), (35, MB)]:
    melody(b0, mo, 'piano', .22)
    melody(b0, mo, 'pluck', .18, 0, .25)
melody(39, MA[:9], 'pluck', .25)
for b0, mo in [(41, MA[:9]), (45, MB), (49, MA[:9])]:
    melody(b0, mo, 'pluck', .24)
for b0, mo in [(51, MA), (55, MB)]:
    melody(b0, mo, 'lead', .12, 0, 0)
    melody(b0, mo, 'pluck', .22, 0, -.25)
for b0, mo in [(60, MA), (64, MB[:13])]:
    melody(b0, mo, 'lead', .1, 0, 0)
    melody(b0, mo, 'pluck', .2, 1, -.2)
melody(67, MB, 'pluck', .3)
melody(67, MB, 'box', .05, 1)
add(music, bar_t(71), pluck(72, 4, .5, .998), .3, -.1)
add(music, bar_t(71), pluck(60, 4, .4, .998), .25, .1)
add(music, bar_t(71), bell(84, 3, 1.2, 3.01), .08, 0)

# ---------------- sound effects on the picture's events ----------------
W = lambda t, d=.8, g=.25, up=True: add(sfx, t - d * .5, whoosh(d, 300, 3500, up), g, 0)
# shot 1: needle stitching, the title, the seal, the tug, the run
for i in range(20):
    add(sfx, .3 + i * .15, click(3000 + 400 * (i % 3), .01), .12, -.6 + i * .05)
for i in range(4):
    add(sfx, 3.4 + i * .17, bell(79 + [0, 2, 4, 7][i], 1.4, 1.5, 2.0), .1, -.3 + .2 * i)
add(sfx, 4.8, thump(60), .5, .3)
add(sfx, 6.4, whoosh(.5, 400, 2500), .15, -.4)
add(sfx, 6.95, pop(300, 700), .2, -.4)
add(sfx, 7.5, pop(700, 1400), .15, -.3)
add(sfx, 10.1, thump(110), .2, -.3)
add(sfx, 10.15, pluck(55, 1.2, .9), .2, -.3)
W(15.0, .9, .3)
# shot 2: the treadle machine, the shirt, the time-lapse, the flash
for i in range(int(5.6 / (BEAT / 4))):
    add(sfx, 15.2 + i * BEAT / 4, click(1800 if i % 2 else 1300, .018), .1, .2)
add(sfx, 21.0, sparkle(84), .1, 0)
add(sfx, 23.6, riser(1.6), .1, 0)
for i in range(5):
    add(sfx, 27.5 + i * 1.25 + .45, thump(55), .3, -.6 + .3 * i)
    add(sfx, 27.5 + i * 1.25 + .45, sparkle(79 + i * 2, 3), .05, -.6 + .3 * i)
add(sfx, 36.2, riser(1.3), .18, 0)
# shot 3: loom clacks on the beat, the idea, swatches pinned one per beat, the seams
for i in range(int(6.8 / BEAT)):
    add(sfx, 37.5 + i * BEAT, woodblock(620 if i % 2 else 760), .16, -.3)
add(sfx, 37.5 + 9.4, bell(88, 1.2, 1.5, 2.0), .12, .2)
for i in range(9):
    add(sfx, 37.5 + 10.6 + i * BEAT, whoosh(.35, 600, 3000), .06, .2)
    add(sfx, 37.5 + 10.6 + i * BEAT + .5, pop(500 + 60 * i, 1200 + 60 * i), .16, .4)
for i in range(12):
    add(sfx, 37.5 + 16.2 + i * .15, click(2600, .01), .08, .3)
add(sfx, 56.3, riser(1.2), .15, 0)
# shot 4: the idea, the pencil, the colour, the peel, outfit swaps, the whip
add(sfx, 57.5 + 2.6, bell(88, 1.2, 1.5, 2.0), .12, .2)
for i in range(40):
    add(sfx, 57.5 + 3.4 + i * .1, bp(rng.uniform(-1, 1, int(.08 * SR)), 2000, 7000) * np.hanning(int(.08 * SR)), .05, -.2)
add(sfx, 57.5 + 7.6, sparkle(76, 5), .08, -.2)
add(sfx, 57.5 + 9.0, whoosh(1.2, 400, 2500), .15, 0)
add(sfx, 57.5 + 10.3, thump(90), .2, .4)
for i in range(4):
    add(sfx, 57.5 + 11.25 + i * 2 * BEAT, pop(500, 1300), .16, .4)
    add(sfx, 57.5 + 11.25 + i * 2 * BEAT, sparkle(84 + i, 3), .05, .4)
W(77.4, .8, .35)
# shot 5: teammates' machines, the check, cartons packed and stacked
for i in range(int(25 / (BEAT / 4))):
    add(sfx, 77.5 + i * BEAT / 4, click(1500 + 300 * (i % 4), .012), .035, (i % 5 - 2) * .25)
add(sfx, 77.5 + 6.8, sparkle(84), .1, 0)
for tp in (13.2, 15.7, 18.2):
    add(sfx, 77.5 + tp, whoosh(.5, 500, 2000), .08, .3)
    add(sfx, 77.5 + tp + .9, woodblock(420), .12, .3)
for td in (13.2 + 1.9, 15.7 + 1.9, 18.2 + 1.9, 19.7, 19.7 + 2 * BEAT, 19.7 + 4 * BEAT):
    add(sfx, 77.5 + td, thump(75), .3, .4)
add(sfx, 102.5 - .3, whoosh(.7, 300, 2500), .25, 0)
# shot 6: the washer, the laser, the count-up, the tilt, the panels, the sprouts, the push into the sun
for i in range(55):
    add(sfx, 102.5 + rng.uniform(0, 11), bubble(), .05, -.5)
hum = lp(rng.uniform(-1, 1, int(11 * SR)), 180) * 0.6
add(sfx, 102.5, hum * env(len(hum), .5, 10, 1, 1.0), .12, -.4)
add(sfx, 102.5 + 4.0, zap(3.4), .06, .5)
for i in range(18):
    add(sfx, 102.5 + 8.1 + i * .095, click(3200, .008), .08, 0)
add(sfx, 102.5 + 10.0, bell(84, 1.4, 1.5, 2.0), .1, 0)
add(sfx, 102.5 + 11.0, whoosh(2.2, 200, 1800), .18, 0)
add(sfx, 102.5 + 13.6, pop(300, 900), .2, .5)
for i in range(6):
    add(sfx, 102.5 + 15 + i * .25, bell(84 + [0, 2, 4, 7, 9, 12][i], 1.0, .8, 3.01), .08, -.5 + .2 * i)
for i in range(18):
    add(sfx, 102.5 + 20 + i * .08, pop(600 + 40 * i, 1500 + 40 * i), .05, -.8 + .09 * i)
add(sfx, 102.5 + 23.0, riser(2.2), .22, 0)
# shot 7: the globe, threads launched one per beat, pins, the wipe, the crane, the horn, the fireworks
for i in range(8):
    add(sfx, 127.5 + 1.9 + i * BEAT, pluck(79 + [0, 2, 4, 7, 9, 12, 14, 16][i], 1.2, .8), .12, -.6 + .15 * i)
    add(sfx, 127.5 + 1.9 + i * BEAT + .55, pop(700, 1500), .08, -.6 + .15 * i)
W(127.5 + 8.4, .8, .3)
add(sfx, 127.5 + 8.4 + 3.0, thump(55), .45, .3)
add(sfx, 127.5 + 8.4 + 4.2, horn(1.8), .35, .4)
for i, d in enumerate((12.4, 12.9, 13.3)):
    add(sfx, 127.5 + 8.4 + d, firework(), .18, -.4 + .4 * i)
add(sfx, 150 - .3, whoosh(.7, 300, 3000), .25, 0)
# shot 8: medals, the photo, the thread, hearts
for i, td in enumerate((1.9, 3.15, 4.4)):
    add(sfx, 150 + td + .4, bell(88 + [0, 4, 7][i], 1.8, 2.0, 1.41), .16, -.3 + .3 * i)
    add(sfx, 150 + td + .4, thump(95), .15, -.3 + .3 * i)
for i in range(7):
    add(sfx, 150 + 8.0 + i * .08, pop(350, 800), .08, -.8 + .25 * i)
add(sfx, 150 + 9.3, click(1200, .03), .4, 0)
add(sfx, 150 + 9.32, hp(rng.uniform(-1, 1, int(.12 * SR)), 3000) * np.exp(-tt(int(.12 * SR)) * 40), .25, 0)
add(sfx, 150 + 9.4, sparkle(88, 6, .06), .08, 0)
add(sfx, 150 + 12.4, whoosh(1.6, 500, 3000), .1, 0)
add(sfx, 150 + 14.2, sparkle(84, 5), .08, 0)
add(sfx, 167.5 - .4, whoosh(.9, 300, 2500), .3, 0)
# shot 9: the name, the seal, the tie, the iris
for i in range(4):
    add(sfx, 167.5 + .9 + i * .17, bell(79 + [0, 2, 4, 7][i], 1.4, 1.5, 2.0), .08, -.3 + .2 * i)
add(sfx, 167.5 + 2.2, thump(60), .45, .3)
add(sfx, 167.5 + 7.7, sparkle(84, 6), .1, 0)
add(sfx, 167.5 + 10.2, whoosh(.9, 2500, 300, False), .1, 0)

# ---------------- mix ----------------
def reverb(x, secs=2.2, wet=.25, seed=3):
    r = np.random.default_rng(seed)
    n = int(secs * SR)
    t = tt(n)
    out = np.zeros_like(x)
    for c in range(2):
        ir = r.uniform(-1, 1, n) * np.exp(-t * 3.0 / secs * 2.3)
        ir = lp(ir, 6000)
        ir[:int(.012 * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2))
        out[c] = fftconvolve(x[c], ir)[:x.shape[1]]
    return x * (1 - wet) + out * wet * 1.6


mix = reverb(music, 2.4, .28) + reverb(sfx, 1.2, .15, 5) * .9
mix = mix[:, :N]
# gentle bus compression-ish soft clip, fade in/out
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
fi, fo = int(.3 * SR), int(2.0 * SR)
mix[:, :fi] *= np.linspace(0, 1, fi)
mix[:, -fo:] *= np.linspace(1, 0, fo) ** 1.5
mix *= .89 / (np.max(np.abs(mix)) + 1e-9)
out = sys.argv[1] if len(sys.argv) > 1 else 'assets/shunfang_score.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype('<i2').tobytes())
print('wrote', out, f'{mix.shape[1] / SR:.1f}s')
