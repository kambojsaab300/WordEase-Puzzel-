"""Synthesise WordEase's sound effects into android/app/src/main/res/raw.

Every sound is generated here from sine waves and noise, so there are no third-party
recordings or licences. Soft, rounded tones to match the calm, large-print game.

Run: python tools/generate-sfx.py
"""
import math
import os
import random
import struct
import wave

RATE = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'src', 'main', 'res', 'raw')


def silence(seconds):
    return [0.0] * int(RATE * seconds)


def mix(base, layer, at=0.0, gain=1.0):
    start = int(RATE * at)
    end = start + len(layer)
    if end > len(base):
        base.extend([0.0] * (end - len(base)))
    for i, v in enumerate(layer):
        base[start + i] += v * gain
    return base


def bell(freq, seconds, decay=6.0, partials=((1, 1.0), (2.0, 0.35), (3.0, 0.12)), attack=0.004):
    """Soft bell: a few harmonics with an exponential fade."""
    n = int(RATE * seconds)
    out = []
    for i in range(n):
        t = i / RATE
        env = math.exp(-decay * t) * min(1.0, t / attack)
        out.append(env * sum(a * math.sin(2 * math.pi * freq * k * t) for k, a in partials))
    return out


def sweep(f0, f1, seconds, decay=30.0):
    """Short pitch-sliding blip, for taps and ticks."""
    n = int(RATE * seconds)
    out, phase = [], 0.0
    for i in range(n):
        t = i / RATE
        f = f0 + (f1 - f0) * (i / n)
        phase += 2 * math.pi * f / RATE
        env = math.exp(-decay * t) * min(1.0, t / 0.002)
        out.append(env * math.sin(phase))
    return out


def thump(seconds=0.22):
    """Rubber stamp: low body plus a puff of filtered noise."""
    rng = random.Random(7)
    n = int(RATE * seconds)
    out, lp = [], 0.0
    for i in range(n):
        t = i / RATE
        body = math.sin(2 * math.pi * (110 - 50 * t / seconds) * t) * math.exp(-18 * t)
        lp += 0.15 * (rng.uniform(-1, 1) - lp)
        out.append(0.9 * body + 0.5 * lp * math.exp(-30 * t))
    return out


def pluck(freq, seconds, brightness=0.5, seed=1):
    """Karplus-Strong plucked string: a warm, guitar/harp-like note."""
    rng = random.Random(seed)
    period = max(2, int(RATE / freq))
    buf = [rng.uniform(-1, 1) for _ in range(period)]
    out = []
    # averaging neighbours softens the string; brightness keeps more of it ringing
    keep = 0.985 + 0.0145 * brightness
    for i in range(int(RATE * seconds)):
        k = i % period
        v = buf[k]
        buf[k] = keep * 0.5 * (v + buf[(k + 1) % period])
        out.append(v)
    return out


def mallet(freq, seconds):
    """Marimba-like mallet: a round fundamental and a quick, bright overtone."""
    n = int(RATE * seconds)
    out = []
    for i in range(n):
        t = i / RATE
        attack = min(1.0, t / 0.003)
        out.append(attack * (
            math.exp(-5 * t) * math.sin(2 * math.pi * freq * t)
            + 0.35 * math.exp(-22 * t) * math.sin(2 * math.pi * freq * 4 * t)
        ))
    return out


def pad(freqs, seconds, attack=0.25, release=1.4):
    """Soft chord pad: slightly detuned sines that swell in and fade out."""
    n = int(RATE * seconds)
    out = []
    for i in range(n):
        t = i / RATE
        env = min(1.0, t / attack) * (1.0 if t < seconds - release else max(0.0, (seconds - t) / release))
        v = 0.0
        for f in freqs:
            v += math.sin(2 * math.pi * f * t) + 0.5 * math.sin(2 * math.pi * f * 1.004 * t)
        out.append(env * v / len(freqs))
    return out


def shimmer(seconds, seed=3):
    """Tambourine-like shimmer: bright noise in a fast fade."""
    rng = random.Random(seed)
    out, prev = [], 0.0
    for i in range(int(RATE * seconds)):
        t = i / RATE
        x = rng.uniform(-1, 1)
        hp = x - prev  # crude high-pass keeps it airy, not hissy-low
        prev = x
        out.append(hp * math.exp(-9 * t))
    return out


def write(name, samples, peak=0.7, fade_out=True):
    top = max(abs(s) for s in samples) or 1.0
    # a short fade-out so nothing clicks at the end
    if fade_out:
        fade = int(RATE * 0.01)
        for i in range(fade):
            samples[-1 - i] *= i / fade
    data = b''.join(struct.pack('<h', int(32767 * peak * s / top)) for s in samples)
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(data)


def note(semitones_from_a4):
    return 440.0 * 2 ** (semitones_from_a4 / 12)


C5, E5, G5, A5, B5 = note(3), note(7), note(10), note(12), note(14)
C6, E6, G6 = note(15), note(19), note(22)

os.makedirs(OUT, exist_ok=True)

# Button tap: a soft rounded pop
write('sfx_tap', sweep(900, 560, 0.06, decay=55), peak=0.45)

# First letter touched: a light wooden tick
write('sfx_letter', mix(sweep(1300, 1100, 0.05, decay=70), bell(2600, 0.03, decay=120), gain=0.2), peak=0.4)

# Dragging over letters: tiny blip (pitch rises with each letter at playback)
write('sfx_tick', sweep(1500, 1450, 0.035, decay=90), peak=0.3)

# Word found: two bright bell notes going up
word = silence(0.0)
mix(word, bell(E6, 0.5, decay=7))
mix(word, bell(G6, 0.6, decay=6), at=0.09)
write('sfx_word', word, peak=0.6)

# Wrong selection: a gentle low "bonk" that falls, never harsh
wrong = silence(0.0)
mix(wrong, bell(note(-5), 0.25, decay=14, partials=((1, 1.0), (2, 0.15))))
mix(wrong, bell(note(-9), 0.3, decay=12, partials=((1, 1.0), (2, 0.15))), at=0.11)
write('sfx_wrong', wrong, peak=0.45)

# Level complete: a short, happy celebration jingle (no voice), about 3.5 s.
# Mallet + harp melody climbs G-C-E-G, steps up A-B and lands on a high C,
# over a plucked bass, then a warm C-major pad, a tambourine shimmer and falling sparkles.
G2, C3, G4 = note(-26), note(-21), note(-2)
C4, E4, G4b, B5n = note(-9), note(-5), note(-2), note(14)
C7, E7, G7 = note(27), note(31), note(34)
BEAT = 0.15


def jingle(seconds=3.6):
    level = silence(seconds)
    melody = [(0, G4, 1), (1, C5, 1), (2, E5, 1), (3, G5, 2), (5, A5, 1), (6, B5n, 1), (7, C6, 6)]
    for step, f, beats in melody:
        length = BEAT * beats + 0.5
        mix(level, mallet(f, length), at=step * BEAT, gain=0.55)
        mix(level, pluck(f, length, brightness=0.7, seed=step + 1), at=step * BEAT, gain=0.35)
    # harmony under the landing note
    for f in (E5, G5):
        mix(level, mallet(f, 1.4), at=7 * BEAT, gain=0.25)
    # plucked bass: C, G, C
    for step, f in ((0, C3), (3, G2), (7, C3)):
        mix(level, pluck(f, 1.6, brightness=0.4, seed=10 + step), at=step * BEAT, gain=0.45)
    # warm chord swelling under the end
    mix(level, pad([C4, E4, G4b, C5], 2.5), at=7 * BEAT, gain=0.22)
    # light tambourine on the beats, a bigger shimmer on the landing
    for step in (0, 2, 3, 5):
        mix(level, shimmer(0.12, seed=step), at=step * BEAT, gain=0.06)
    mix(level, shimmer(0.6, seed=99), at=7 * BEAT, gain=0.12)
    # sparkles tumbling down from the top
    for k, f in enumerate((C7, G7, E7, C7)):
        mix(level, bell(f, 0.5, decay=8), at=7 * BEAT + 0.2 + 0.09 * k, gain=0.12)
    return level


level = jingle()
write('sfx_level', level, peak=0.75)

# Coin: the classic two-step shimmer
coin = silence(0.0)
mix(coin, bell(B5 * 2, 0.08, decay=20, partials=((1, 1.0), (3, 0.2))))
mix(coin, bell(E6 * 2, 0.35, decay=9, partials=((1, 1.0), (3, 0.2))), at=0.07)
write('sfx_coin', coin, peak=0.5)

# Passport stamp
write('sfx_stamp', thump(), peak=0.7)

A6, D6 = note(24), note(17)
F2, A2 = note(-28), note(-24)
F4, A4, B4, D5 = note(-4), note(0), note(2), note(5)
F3, G3, A3, B3, D4, F5 = note(-16), note(-14), note(-12), note(-10), note(-7), note(8)

# Splash logo jingle, timed to the splash animation:
# letters pop in (0-0.8 s), WORD highlights (0.85 s), EASE highlights (1.4 s), name appears (2 s)
splash = silence(3.2)
for k, f in enumerate((C5, E5, G5, C6, E6, G6)):
    mix(splash, pluck(f, 0.6, brightness=0.6, seed=k + 20), at=0.1 * k, gain=0.18)
for f in (E6, G6):
    mix(splash, bell(f, 0.9, decay=5), at=0.85, gain=0.35)
for f in (G6, C7):
    mix(splash, bell(f, 1.0, decay=4.5), at=1.4, gain=0.35)
mix(splash, pad([C4, E4, G4b, C5], 1.4, attack=0.15, release=0.9), at=1.95, gain=0.3)
mix(splash, mallet(C6, 1.2), at=2.0, gain=0.35)
mix(splash, shimmer(0.5, seed=5), at=2.0, gain=0.08)
write('sfx_splash', splash, peak=0.6)

# Popup opens: a soft paper swish (noise that swells and fades, low-passed)
rng = random.Random(11)
swish, lp = [], 0.0
n = int(RATE * 0.22)
for i in range(n):
    lp += 0.08 * (rng.uniform(-1, 1) - lp)
    swish.append(lp * math.sin(math.pi * i / n) ** 2)
write('sfx_open', swish, peak=0.3)

# Locked level: two soft wooden knocks, "not yet", never a buzzer
locked = silence(0.0)
mix(locked, bell(note(-14), 0.15, decay=30, partials=((1, 1.0), (2.7, 0.3))))
mix(locked, bell(note(-14), 0.15, decay=30, partials=((1, 1.0), (2.7, 0.3))), at=0.12, gain=0.8)
write('sfx_locked', locked, peak=0.45)

# Hint: a quick magic sparkle running up a pentatonic scale
hint = silence(0.0)
for k, f in enumerate((C6, D6, E6, G6, A6, C7, E7)):
    mix(hint, bell(f, 0.5, decay=9), at=0.045 * k, gain=0.5 - 0.04 * k)
mix(hint, shimmer(0.5, seed=8), at=0.05, gain=0.12)
write('sfx_hint', hint, peak=0.5)

# Star pop on the celebration screen (played higher for star 2 and 3)
star = silence(0.0)
mix(star, bell(A6, 0.7, decay=6, partials=((1, 1.0), (2.0, 0.4), (3.0, 0.15), (4.2, 0.08))))
mix(star, shimmer(0.25, seed=4), gain=0.1)
write('sfx_star', star, peak=0.5)

# Landmark reached: the level jingle with a little bell tune on top
landmark = jingle(4.0)
for k, f in enumerate((E6, G6, C7, G6, C7)):
    mix(landmark, bell(f, 0.8, decay=5), at=1.25 + 0.16 * k, gain=0.22)
write('sfx_landmark', landmark, peak=0.75)

# World complete: the jingle, then a grand F - G - C close with a big shimmer
world = jingle(6.0)
for at, chord, bass in ((1.6, (F4, A4, C5), F2), (2.2, (G4b, B4, D5), G2), (2.8, (C5, E5, G5, C6), C3)):
    last = chord[-1] == C6
    mix(world, pad(list(chord), 2.6 if last else 0.8, attack=0.05, release=1.8 if last else 0.3), at=at, gain=0.3)
    for f in chord:
        mix(world, mallet(f, 1.6 if last else 0.7), at=at, gain=0.2)
    mix(world, pluck(bass, 1.5, brightness=0.4, seed=int(at * 10)), at=at, gain=0.45)
mix(world, shimmer(1.0, seed=42), at=2.8, gain=0.15)
for k, f in enumerate((C7, E7, G7, E7, C7, G6)):
    mix(world, bell(f, 0.6, decay=7), at=3.0 + 0.1 * k, gain=0.12)
write('sfx_world', world, peak=0.8)

# World unlocked on the globe: a rising sweep that opens into a bright chord
unlock = silence(0.0)
mix(unlock, sweep(300, 1200, 0.35, decay=3), gain=0.25)
for f in (C6, E6, G6):
    mix(unlock, bell(f, 1.0, decay=4), at=0.3, gain=0.3)
mix(unlock, shimmer(0.6, seed=12), at=0.3, gain=0.12)
write('sfx_unlock', unlock, peak=0.55)

# Mystery chest: the lid pops, then coins tumble out
chest = silence(0.0)
mix(chest, thump(0.15), gain=0.6)
mix(chest, sweep(400, 900, 0.12, decay=15), at=0.05, gain=0.3)
for k in range(4):
    mix(chest, bell((B5 if k % 2 else E6) * 2, 0.3, decay=10, partials=((1, 1.0), (3, 0.2))), at=0.18 + 0.08 * k, gain=0.35)
write('sfx_chest', chest, peak=0.6)


def music_loop():
    """Calm background loop: C - Am - F - G, 80 bpm, 8 bars (24 s). The tail wraps to the start so it loops cleanly."""
    beat = 0.75
    length = 32 * beat
    out = silence(length + 4.0)
    chords = [
        ((C4, E4, G4b), C3, (C5, E5, G5, A5, C6)),
        ((A3, C4, E4), A2, (A4, C5, E5, G5, A5)),
        ((F3, A3, C4), F2, (F4, A4, C5, D5, F5)),
        ((G3, B3, D4), G2, (G4b, B4, D5, G5, A5)),
    ]
    rng = random.Random(2026)
    for c, (pad_notes, bass, scale) in enumerate(chords):
        start = c * 8 * beat
        mix(out, pad(list(pad_notes), 8 * beat + 1.0, attack=1.2, release=1.8), at=start, gain=0.3)
        for b in (0, 4):
            mix(out, pluck(bass, 2.5, brightness=0.3, seed=c * 10 + b), at=start + b * beat, gain=0.35)
        # a few gentle mallet notes per chord, on the eighth-note grid
        for slot in sorted(rng.sample(range(16), 6)):
            f = rng.choice(scale)
            mix(out, mallet(f, 1.4), at=start + slot * beat / 2, gain=0.16)
        # a high, far-away bell now and then
        if c % 2 == 1:
            mix(out, bell(rng.choice(scale) * 2, 1.5, decay=2.5), at=start + 6 * beat, gain=0.05)
    # fold the tail back over the start so the loop has no seam
    n = int(RATE * length)
    loop = out[:n]
    for i, v in enumerate(out[n:]):
        loop[i] += v
    return loop


RATE = 22050  # music is long, so a lower rate keeps the file small
write('music_calm', music_loop(), peak=0.45, fade_out=False)

print('Wrote sounds to', os.path.abspath(OUT))
