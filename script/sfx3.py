# Sound for the 3-minute "A Life": every effect is synthesised here (no samples), timed to the events in
# src/scenes/life3.js, and mixed under the narration.
#   python3 script/sfx3.py  →  assets/life3_sfx.wav + life3_mix.wav (effects alone, and with the voice; kept as .mp3 in the repo)
# Ambience beds (birds, rain, wind, crickets) duck under the voice; one-shot effects sit ~12 dB below it.
import wave, numpy as np

SR, DUR = 44100, 155.75
N = int(SR * DUR)
rng = np.random.default_rng(7)
fx = np.zeros(N)       # one-shot effects
amb = np.zeros(N)      # ambience beds (ducked under the voice)

# ---------- building blocks ----------
def tt(d): return np.arange(int(d * SR)) / SR
def env(d, a=.005, r=None):   # attack then exponential decay
    t = tt(d); r = r or d / 5
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
def band(x, lo, hi):          # FFT band-pass (static)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))
def noise(d): return rng.standard_normal(int(d * SR))
def norm(x, peak=1.0): m = np.abs(x).max(); return x / m * peak if m > 0 else x
def put(buf, t0, x, gain=1.0):
    i = int(t0 * SR)
    if i >= N or i + len(x) <= 0: return
    a, b = max(0, i), min(N, i + len(x))
    buf[a:b] += gain * x[a - i:b - i]
def db(v): return 10 ** (v / 20)

def chime(f, d=1.6):          # a soft bell: inharmonic partials, long decay
    t = tt(d)
    x = sum(w * np.sin(2 * np.pi * f * p * t) * np.exp(-t * k) for p, w, k in [(1, 1, 2.2), (2.76, .35, 4), (5.4, .15, 7), (2, .2, 3)])
    return norm(x * np.minimum(1, t / .004))
def sparkle(d=.9):            # a quick glissando of tiny bells
    x = np.zeros(int(d * SR))
    for i, f in enumerate([1568, 1976, 2349, 2637, 3136]):
        c = chime(f, .5) * .6; j = int(i * .06 * SR); x[j:j + len(c)] += c[:len(x) - j]
    return norm(x)
def boing(f0=220, f1=520, d=.35):   # cartoon spring: a rising, wobbling tone
    t = tt(d); f = f0 + (f1 - f0) * (1 - np.exp(-t * 18)) + 25 * np.sin(2 * np.pi * 14 * t) * np.exp(-t * 6)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, .004, d / 3))
def pop(f=700, d=.07):
    t = tt(d); return norm(np.sin(2 * np.pi * np.cumsum(f * (1 + 1.5 * t / d)) / SR) * env(d, .002, d / 3))
def thud(f=70, d=.35, click=.4):    # a soft body landing
    t = tt(d); x = np.sin(2 * np.pi * np.cumsum(f * (1 - .45 * t / d)) / SR) * env(d, .003, d / 4)
    return norm(x + click * band(noise(d), 200, 1800) * env(d, .001, .02))
def box_thud(): return norm(thud(95, .3, .7) + .5 * band(noise(.3), 300, 2500) * env(.3, .001, .04))
def clonk(d=.6):              # the hard hat: a hollow plastic knock
    t = tt(d); x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(420, 18), (1130, 26), (1870, 34), (2600, 40)])
    return norm(x * np.minimum(1, t / .001))
def whoosh(d=.6, lo=300, hi=2500, peak=.5):   # air: band noise, swelling then fading
    t = tt(d); e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * np.exp(-(t / d - peak) ** 2 * 1.5)
    x = band(noise(d), lo, hi) * e
    return norm(x)
def swoosh(d=.7): return norm(whoosh(d, 250, 1400, .45) + .6 * whoosh(d, 1400, 5000, .55))   # a brush wipe
def splash(d=.8):
    x = band(noise(d), 700, 7000) * env(d, .003, .12)
    for _ in range(14):   # droplets
        f = rng.uniform(1500, 3500); dd = .05; j = int(rng.uniform(.03, .5) * SR); b = np.sin(2 * np.pi * np.cumsum(np.full(int(dd * SR), f) * np.linspace(1, 1.6, int(dd * SR))) / SR) * env(dd, .001, .012)
        x[j:j + len(b)] += .35 * b[:len(x) - j]
    return norm(x)
def flutter(d=1.0):           # wings: soft noise pulsing at the flap rate
    t = tt(d); return norm(band(noise(d), 500, 3000) * (.5 + .5 * np.sin(2 * np.pi * 15 * t)) ** 3 * np.sin(np.pi * t / d))
def heartbeat():
    return norm(np.concatenate([thud(55, .16, .1), np.zeros(int(.02 * SR)), .7 * thud(50, .2, .1)]))
def tick(): return norm(band(noise(.02), 2000, 8000) * env(.02, .0005, .004))
def step(): return norm(band(noise(.09), 150, 1200) * env(.09, .002, .025))
def swell(d, f=220):          # a warm pad chord, for light breaking through
    t = tt(d); x = sum(np.sin(2 * np.pi * f * m * t + np.sin(t * (1 + m))) for m in [1, 1.25, 1.5, 2])
    return norm(x * np.sin(np.pi * t / d) ** 2)
def hum(d, f=110):            # the glow in the dark: a low breathing drone
    t = tt(d); x = np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 1.5 * t) + .3 * np.sin(2 * np.pi * f * 2.01 * t)
    return norm(x * (.7 + .3 * np.sin(2 * np.pi * .3 * t)) * np.minimum(1, t / 1.5) * np.minimum(1, (d - t) / 1.5))

# ---------- ambience beds ----------
def fade_in_out(x, a, b):
    t = tt(len(x) / SR); return x * np.minimum(1, t / a) * np.minimum(1, (t[-1] - t) / b)
def birds(t0, t1, density=1.2, g=1.0):
    t = t0
    while t < t1:
        n = rng.integers(2, 5); f0 = rng.uniform(2600, 4200)
        for k in range(n):   # a little phrase of chirps
            d = rng.uniform(.05, .11); s = tt(d); f = f0 * (1 + .35 * np.sin(np.pi * s / d)) * rng.uniform(.95, 1.1)
            c = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * s / d) ** 2
            put(amb, t + k * rng.uniform(.09, .16), c, g * rng.uniform(.25, .5) * min(1, (t - t0) / 1.5, (t1 - t) / 1.5))
        t += rng.exponential(1 / density) + .3
def rain(t0, t1, g=1.0):
    d = t1 - t0; x = band(noise(d), 400, 9000) * .5 + band(noise(d), 80, 400) * .6
    for _ in range(int(d * 25)):   # drops on the road
        j = int(rng.uniform(0, d - .05) * SR); b = tick() * rng.uniform(.2, .7); x[j:j + len(b)] += b
    put(amb, t0, fade_in_out(norm(x), 1.2, 2.5), g)
def wind(t0, t1, g=1.0):
    d = t1 - t0; tw = tt(d); x = band(noise(d), 120, 900) * (.55 + .45 * np.sin(2 * np.pi * .13 * tw) * np.sin(2 * np.pi * .07 * tw + 1))
    put(amb, t0, fade_in_out(norm(x), 2, 2), g)
def crickets(t0, t1, g=1.0):
    d = t1 - t0; tw = tt(d)
    x = np.sin(2 * np.pi * 4700 * tw) * (np.sin(2 * np.pi * 30 * tw) > .3) * (np.sin(2 * np.pi * .9 * tw) > 0)
    x += .6 * np.sin(2 * np.pi * 5200 * tw) * (np.sin(2 * np.pi * 26 * tw + 1) > .4) * (np.sin(2 * np.pi * .7 * tw + 2) > .2)
    put(amb, t0, fade_in_out(band(x, 3000, 7000), 2, 2), g)
def room(t0, t1, g=1.0):      # the grey city: a distant low murmur
    d = t1 - t0; put(amb, t0, fade_in_out(norm(band(noise(d), 60, 350)), 2, 2), g)

# ---------- the film, shot by shot (video times, from life3.js) ----------
PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]
S = lambda t, x, g: put(fx, t, x, g)

# A birth
S(0.3, hum(8.8, 110), .35)
S(1.7, chime(PENTA[0], 3), .5)                      # "a small light in the dark"
S(5.8, whoosh(3.1, 120, 700, .8), .35)              # it sinks toward the world
S(8.9, swell(3.0, 262), .3); S(9.0, sparkle(), .35) # the iris of dawn opens
birds(9.5, 30.0, 1.0, .55)
S(10.9, boing(300, 620, .3), .45); S(11.7, chime(PENTA[2], 1.2), .4)
S(12.0, flutter(1.2), .3)
S(12.85, swoosh(.8), .6)                            # brush wipe

# B childhood
for k in range(7): S(13.6 + k * .5 + .44, boing(260, 480, .22), .3)   # hops in
S(17.25, splash(), .8); S(17.3, pop(900, .09), .3)
S(18.3, sparkle(), .35); S(18.0, flutter(1.0), .3)
for a, b in [[21.15, 21.75], [22.3, 22.95], [23.45, 24.15]]:
    S(a + .17, thud(80, .35, .5), .8); S(a + .2, pop(420, .08), .25); S(b, boing(200, 420, .25), .3)
S(25.2, chime(PENTA[4], 1.5), .45)                  # proud
S(26.8, flutter(1.6), .25)
for k in range(4): S(28.7 + k * .5 + .45, boing(280, 520, .2), .28)   # hops off
S(29.6, whoosh(1.4, 300, 3000, .6), .45)            # tilt into the sky

# C school
birds(31.0, 47.0, .5, .35)
S(32.15, boing(180, 700, .4), .45)                  # grows up
S(32.45, tick(), .7); S(32.5, pop(1200, .05), .35)  # the pencil lands
S(32.75, whoosh(.45, 200, 1500, .7), .45); S(33.15, box_thud(), .5)   # the desk slides in
for i in range(16): S(33.9 + i * .06, pop(600 + 40 * (i % 7), .06), .22)   # a thousand questions
S(35.7, chime(PENTA[5], 1.4), .45)                  # the bulb
for i in range(6): S(35.72 + i * .25, thud(140, .15, .8), .3)   # books
for i, t0 in enumerate([42.85, 43.55, 44.45]): S(t0, pop(380 - 40 * i, .12), .45)
S(46.65, swoosh(.8), .6)

# D love
birds(47.0, 63.0, .35, .3)
for k in range(8): S(47.3 + k * .42, step(), .22)   # the two walking
S(50.0, whoosh(.35, 600, 3000, .5), .25)            # the partner turns back
S(50.6, boing(330, 700, .3), .45)
for k in range(8): S(52.05 + k * .34, heartbeat(), .55)   # the heart forgets how to behave
S(54.85, whoosh(.7, 400, 4000, .7), .5)             # the rush
S(55.72, thud(75, .4, .6), .85)                     # trip
S(57.2, sparkle(), .4)                              # completely sure
S(59.4, swell(3.6, 220), .28); S(59.4, whoosh(2.0, 150, 900, .5), .25)   # the world narrows
S(63.5, whoosh(.8, 100, 600, .7), .35)

# E adulthood
room(64.3, 80.8, .5)
S(65.72, whoosh(.5, 800, 3000, .9), .3); S(66.2, clonk(), .55)          # the hard hat
for b in [67.35, 69.0, 69.85, 70.95]: S(b - .4, whoosh(.4, 600, 2500, .95), .25); S(b, box_thud(), .7)
for k in range(22): S(72.9 + 1.5 * (k / 22) ** .8, tick(), .5)          # the days, faster and faster
S(74.4, whoosh(1.5, 100, 400, .5), .3)
S(76.55, box_thud(), .7)
for i, d in enumerate([.5, .55, .6, .58]): S(76.55 + d, box_thud(), .55 - .05 * i)   # the stack comes down
S(76.62, thud(70, .4, .5), .6)
S(77.35, boing(200, 430, .3), .35); S(78.1, box_thud(), .45)
S(78.65, whoosh(.4, 500, 2500, .5), .3); S(79.05, pop(500, .07), .3)   # slips… caught
S(80.3, whoosh(2.5, 40, 180, .6), .45)              # a low rumble as night falls
rain(80.0, 94.5, .8)

# F parenthood
for k in range(6): S(86.95 + k * .25, step() * .8, .2)   # little steps
S(88.9, pop(1100, .06), .35); S(89.05, pop(1300, .06), .3)   # the tug
S(91.0, chime(PENTA[3], 2), .4)                     # looks up in wonder
S(92.2, swell(4.0, 262), .3)                        # the clouds part
birds(93.5, 103.5, 1.0, .5)
S(94.25, boing(260, 480, .22), .25); S(94.65, splash(), .8); S(95.95, splash(), .55)
S(95.8, flutter(1.6), .3); S(96.2, sparkle(), .3)
S(98.4, whoosh(.6, 300, 1500, .5), .3); S(99.2, box_thud(), .5)   # the box comes down
S(99.9, boing(240, 760, .5), .45); S(100.6, chime(PENTA[4], 2), .45)
S(103.35, swoosh(.8), .6)

# G old age
wind(103.7, 128.5, .6)
S(104.8, whoosh(3.5, 200, 1200, .5), .3)            # clouds race: time moves faster
for k in range(6): S(108.9 + k * .42, step() * .7, .22)   # small, slow steps
S(111.4, thud(90, .3, .3), .35)                     # sits
S(113.2, chime(PENTA[2], 1.4), .3)                  # the partner smiles
S(113.9, sparkle(1.2), .4); S(113.9, swell(3.0, 196), .28)   # becomes a light
S(114.6, chime(PENTA[4], 2.0), .28); S(115.3, chime(PENTA[3], 2.0), .25)
S(118.75, thud(160, .15, .6), .3)                   # sets the box down
S(122.6, flutter(2.5), .15)
S(126.8, whoosh(1.4, 300, 3000, .6), .4)            # tilt to the stars

# H the end
crickets(128.0, 148.0, .22)
for i, t0 in enumerate([133.3, 134.3, 135.1, 136.0]): S(t0, chime(PENTA[i + 1], 2.2), .4)   # memories
S(137.6, sparkle(1.2), .35); S(137.6, swell(3.0, 262), .25)
S(140.6, flutter(1.8), .25); S(141.4, chime(PENTA[0], 2.5), .3)   # eyes close
S(144.9, sparkle(1.2), .35); S(144.9, whoosh(1.3, 800, 5000, .7), .2)   # the light rises
S(146.2, whoosh(1.4, 100, 700, .7), .35)            # the iris closes
S(147.5, hum(2.0, 110), .3)
S(149.2, swell(3.5, 262), .3); birds(149.6, 155.0, 1.2, .5)
S(150.9, boing(300, 620, .3), .4); S(151.7, chime(PENTA[2], 2.5), .45)

# ---------- mix ----------
def read_mono(path):
    with wave.open(path) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
        if w.getnchannels() == 2: a = a.reshape(-1, 2).mean(1)
        assert w.getframerate() == SR
    out = np.zeros(N); out[:min(N, len(a))] = a[:N]; return out
def write(path, x):
    x = np.clip(x, -1, 1); d = (x * 32767).astype(np.int16)
    with wave.open(path, 'w') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())

if __name__ == '__main__':
    import subprocess
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'assets/life3_narration.mp3', '-ac', '1', '-ar', str(SR), '/tmp/voice.wav'], check=True)
    voice = read_mono('/tmp/voice.wav')
    # the voice's loudness envelope (50 ms) ducks the beds while someone is speaking
    k = int(.05 * SR); e = np.sqrt(np.convolve(voice ** 2, np.ones(k) / k, 'same'))
    speaking = np.convolve((e > .02).astype(float), np.ones(int(.4 * SR)) / int(.4 * SR), 'same')
    beds = norm(amb, 1) * db(-27) * (1 - .5 * np.clip(speaking, 0, 1))
    shots = norm(fx, 1) * db(-13)
    write('assets/life3_sfx.wav', beds + shots)
    mix = voice / max(np.abs(voice).max(), 1e-6) * db(-2) + beds + shots
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)          # soft-clip any rare overlaps
    write('assets/life3_mix.wav', mix)
    print('peak', round(float(np.abs(mix).max()), 3), 'voice rms', round(float(np.sqrt((voice ** 2).mean())), 4), 'fx rms', round(float(np.sqrt(((beds + shots) ** 2).mean())), 4))
