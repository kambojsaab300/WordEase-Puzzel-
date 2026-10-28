"""Compose and render WordEase's background music into android/app/src/main/res/raw.

Like the sound effects (generate-sfx.py), every note is synthesised here, so there are no samples,
recordings or licences. Four calm instrumental pieces of about 2.5 minutes each:

  music_sunny, music_garden   Map, Onboarding, World Trip: warm tunes over a soft lo-fi groove
  music_pages, music_drift    Level and Daily Quiz: slower and without a running tune, so the
                              music never competes with reading the letters

The app plays each pair as a playlist and carries on where a piece stopped, so a player hears about
five minutes of music before anything repeats. The reasoning behind tempo, harmony and form is in
docs/SOUND-FLOW.md ("Background music").

Run: python tools/generate-music.py   (needs numpy, scipy and soundfile)
"""
import os

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

RATE = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'src', 'main', 'res', 'raw')
LOUDNESS_DB = -20.0  # well below the sound effects, which have to cut through the music

NOISE = np.random.default_rng(5)


def hz(name):
    """'Bb4' -> 466.16 Hz"""
    pitch = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}[name[0]]
    rest = name[1:]
    while rest[0] in '#b':
        pitch += 1 if rest[0] == '#' else -1
        rest = rest[1:]
    midi = pitch + 12 * (int(rest) + 1)
    return 440.0 * 2 ** ((midi - 69) / 12)


def pitch_class(freq):
    return round(12 * np.log2(freq / 440.0)) % 12


def times(seconds):
    return np.arange(int(RATE * seconds)) / RATE


def attack(t, seconds):
    return np.minimum(1.0, t / seconds)


def release(t, held, seconds):
    """1 while the key is held, then a smooth fade."""
    return np.where(t < held, 1.0, np.exp(-(t - held) / seconds))


def sos(*args):
    return butter(*args, fs=RATE, output='sos')


BREATH_BAND = sos(4, [1000, 3500], 'bandpass')
PAD_TONE = sos(2, 2400, 'low')
BRUSH_BAND = sos(2, [800, 5000], 'bandpass')
SHAKER_BAND = sos(2, 6000, 'high')
MASTER_LOW_CUT = sos(2, 35, 'high')
MASTER_WARMTH = sos(1, 10000, 'low')


def unit_noise(n, band):
    noise = sosfilt(band, NOISE.standard_normal(n))
    return noise / np.sqrt(np.mean(noise ** 2))


# ---------------------------------------------------------------- instruments

def epiano(freq, held, velocity):
    """Electric piano: 1:1 FM whose brightness fades within a second, plus a faint metal tine."""
    t = times(held + 1.5)
    bright = (0.4 + 1.4 * velocity) * min(1.0, (330 / freq) ** 0.5)
    index = bright * np.exp(-6 * t) + 0.2
    tone = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * t))
    if freq < 1400:
        tone += 0.06 * velocity * np.sin(2 * np.pi * freq * 14 * t) * np.exp(-50 * t)
    ring = np.exp(-t / (2.0 * (220 / freq) ** 0.4))
    return velocity * tone * ring * attack(t, 0.003) * release(t, held, 0.25)


def kalimba(freq, held, velocity):
    """Thumb piano: a round tone and a quick, slightly bell-like overtone. It rings on after the note."""
    t = times(max(held, 0.5) + 1.8)
    tone = np.sin(2 * np.pi * freq * t) * np.exp(-t / (1.1 * (440 / freq) ** 0.3))
    tone += 0.22 * np.sin(2 * np.pi * freq * 5.95 * t) * np.exp(-28 * t)
    return velocity * tone * attack(t, 0.0015) * release(t, held + 1.0, 0.4)


def guitar(freq, held, velocity):
    """Nylon-string pluck: the higher a harmonic, the sooner it dies, like a real string."""
    t = times(held + 1.2)
    tone = np.zeros_like(t)
    for k in range(1, 12):
        if freq * k > 9000:
            break
        # plucked a fifth of the way along the string, which gives the soft, round mix of harmonics
        amp = abs(np.sin(np.pi * k * 0.2)) / k ** 1.1
        tone += amp * np.sin(2 * np.pi * freq * k * t + k) * np.exp(-t * (1.0 + 0.8 * k * (freq / 220) ** 0.5))
    return velocity * tone * attack(t, 0.002) * release(t, held, 0.3)


def flute(freq, held, velocity):
    """Soft ocarina-like flute: nearly pure tone, a breath at the start, a slow vibrato on long notes."""
    t = times(held + 0.5)
    depth = np.clip((t - 0.25) / 0.4, 0.0, 1.0)
    wobble = 1 + 0.004 * np.sin(2 * np.pi * 5.0 * t) * depth
    phase = 2 * np.pi * freq * np.cumsum(wobble) / RATE
    tone = np.sin(phase) + 0.12 * np.sin(2 * phase) + 0.04 * np.sin(3 * phase)
    # just a hint of air: any more and phone speakers turn it into hiss
    breath = unit_noise(len(t), BREATH_BAND) * (0.006 + 0.04 * np.exp(-14 * t))
    return velocity * (tone + breath) * attack(t, 0.07) * release(t, held, 0.18)


def bell(freq, held, velocity):
    """Small glockenspiel bell for far-away sparkles."""
    t = times(3.0)
    tone = (np.sin(2 * np.pi * freq * t) * np.exp(-1.6 * t)
            + 0.3 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-5 * t)
            + 0.1 * np.sin(2 * np.pi * freq * 5.4 * t) * np.exp(-12 * t))
    return velocity * tone * attack(t, 0.002)


def bass(freq, held, velocity, soft=False):
    """Round bass. The 2nd and 3rd harmonics let small phone speakers carry notes they cannot play."""
    t = times(held + 0.4)
    phase = 2 * np.pi * freq * t
    tone = np.sin(phase) + 0.45 * np.sin(2 * phase) + 0.18 * np.sin(3 * phase) + 0.06 * np.sin(4 * phase)
    body = 0.55 + 0.45 * np.exp(-t / 0.6)
    return velocity * tone * body * attack(t, 0.3 if soft else 0.008) * release(t, held, 0.12)


_CYCLE = np.arange(4096) / 4096
SOFT_SAW = sum(np.sin(2 * np.pi * k * _CYCLE) / k ** 1.4 for k in range(1, 9))


def pad(freqs, held):
    """Warm chord pad: three slightly detuned voices per note, spread left, centre and right."""
    t = times(held + 2.5)
    left, right = np.zeros_like(t), np.zeros_like(t)
    for f in freqs:
        for cents, gain_l, gain_r in ((-8, 1.0, 0.25), (0, 0.7, 0.7), (8, 0.25, 1.0)):
            cycles = f * 2 ** (cents / 1200) * t + NOISE.random()
            voice = SOFT_SAW[(cycles * 4096).astype(np.int64) % 4096]
            left += gain_l * voice
            right += gain_r * voice
    swell = np.sin(np.minimum(1.0, t / 1.6) * np.pi / 2) ** 2 * release(t, held, 1.2)
    return sosfilt(PAD_TONE, np.stack([left, right]), axis=-1) * swell / len(freqs)


def kick():
    t = times(0.5)
    phase = 2 * np.pi * np.cumsum(46 + 64 * np.exp(-28 * t)) / RATE
    return np.sin(phase) * np.exp(-8 * t) * attack(t, 0.002)


def brush():
    t = times(0.3)
    return (0.5 * unit_noise(len(t), BRUSH_BAND) * np.exp(-20 * t)
            + 0.4 * np.sin(2 * np.pi * 190 * t) * np.exp(-40 * t)) * attack(t, 0.004)


def shaker():
    t = times(0.14)
    return unit_noise(len(t), SHAKER_BAND) * attack(t, 0.012) * np.exp(-40 * t)


# ---------------------------------------------------------------- harmony

# chord: (bass note, voicing for keys and pad). Voicings stay between F3 and A4, under the tunes,
# and mostly leave the root to the bass: the 3-5-7-9 shapes are what make lo-fi chords sound soft.
CHORDS = {
    # F major (sunny), shared with C major (pages)
    'Fmaj9': ('F2', 'A3 C4 E4 G4'),
    'Am7': ('A2', 'G3 C4 E4 A4'),
    'Bbmaj9': ('Bb2', 'F3 A3 C4 D4'),
    'C69': ('C3', 'G3 A3 D4 E4'),
    'Dm9': ('D3', 'F3 A3 C4 E4'),
    'Gm9': ('G2', 'F3 Bb3 D4 A4'),
    'C7sus4': ('C3', 'G3 Bb3 C4 F4'),
    'C7': ('C3', 'G3 Bb3 C4 E4'),
    # D major (garden)
    'Dmaj9': ('D3', 'F#3 A3 C#4 E4'),
    'A/C#': ('C#3', 'A3 C#4 E4 A4'),
    'Bm7': ('B2', 'A3 B3 D4 F#4'),
    'F#m7': ('F#2', 'F#3 A3 C#4 E4'),
    'Gmaj9': ('G2', 'B3 D4 F#4 A4'),
    'D/F#': ('F#2', 'A3 C#4 D4 F#4'),
    'Em9': ('E2', 'G3 B3 D4 F#4'),
    'A7sus4': ('A2', 'G3 A3 D4 E4'),
    'A7': ('A2', 'G3 A3 C#4 E4'),
    'Aadd9': ('A2', 'A3 B3 C#4 E4'),
    'Bm9': ('B2', 'A3 C#4 D4 F#4'),
    # C major (pages)
    'Cmaj9': ('C3', 'B3 D4 E4 G4'),
    'Am9': ('A2', 'G3 B3 C4 E4'),
    'G6': ('G2', 'G3 B3 D4 E4'),
    'Gsus4': ('G2', 'G3 C4 D4 F4'),
    'G': ('G2', 'G3 B3 D4 A4'),
    'Em7': ('E2', 'G3 B3 D4 E4'),
    # E-flat major (drift)
    'Ebmaj9': ('Eb2', 'G3 Bb3 D4 F4'),
    'Abmaj9': ('Ab2', 'G3 Bb3 C4 Eb4'),
    'Cm9': ('C3', 'Bb3 D4 Eb4 G4'),
    'Bb6': ('Bb2', 'F3 Bb3 D4 G4'),
    'Gm7': ('G2', 'F3 G3 Bb3 D4'),
    'Bbsus4': ('Bb2', 'F3 Ab3 Bb3 Eb4'),
    'Bb': ('Bb2', 'F3 Ab3 Bb3 D4'),
    'Fm9': ('F2', 'Ab3 C4 Eb4 G4'),
}

# eighth-note orders through a voicing plus its lowest note an octave up (index 4)
ARPS = {'up': [0, 1, 2, 3, 4, 3, 2, 1], 'wave': [0, 2, 1, 3, 2, 4, 3, 1]}


def progression(text):
    """'Fmaj9 | Am7 | C7sus4 C7' -> [(beat, beats, chord)]. Two chords in a bar split it in half,
    and a chord repeated over several bars becomes one long span, so pads and bass do not re-attack."""
    spans = []
    for b, bar in enumerate(text.split('|')):
        names = bar.split()
        for k, name in enumerate(names):
            beat, beats = b * 4 + k * 4 / len(names), 4 / len(names)
            if spans and spans[-1][2] == name:
                spans[-1] = (spans[-1][0], spans[-1][1] + beats, name)
            else:
                spans.append((beat, beats, name))
    return spans


def melody(text):
    """'r:1 A4:.5 C5:.5 | ...' -> [(beat, note, beats)]. Each bar must add up to four beats."""
    notes = []
    for b, bar in enumerate(text.split('|')):
        pos = 0.0
        for token in bar.split():
            name, beats = token.split(':')
            if name != 'r':
                notes.append((b * 4 + pos, name, float(beats)))
            pos += float(beats)
        assert abs(pos - 4) < 1e-6, f'bar {b + 1} has {pos} beats: {bar}'
    return notes


def bars_in(span_beats):
    """Start and length of each bar inside a chord span (the last one may be a half bar)."""
    return [(b, min(4.0, span_beats - b)) for b in np.arange(0, span_beats, 4.0)]


def key_hits(style, beats):
    if style == 'hold':
        return [(0, beats, 0.42)]
    hits = []
    for b, span in bars_in(beats):
        if style == 'lofi':
            # a chord on one and a lighter push on the "and" of three
            hits.append((b, 1.5, 0.55))
            if span == 4:
                hits.append((b + 2.5, 1.5, 0.38))
        elif style == 'arp':
            hits += [(b + i, 1.8, 0.4 if i == 0 else 0.33) for i in range(int(span))]
        elif style == 'pulse':
            hits.append((b, span, 0.32))
    return hits


def bass_hits(style, beats):
    if style in ('long', 'swell'):
        return [(0, beats - 0.2, 0.8)]
    hits = []
    for b, span in bars_in(beats):
        if span == 4:
            hits += [(b, 2.3, 0.85), (b + 2.5, 1.2, 0.6)]
        else:
            hits.append((b, 1.8, 0.8))
    return hits


# ---------------------------------------------------------------- mixing

class Mix:
    def __init__(self, bpm, bars, swing=0.0, seed=1):
        self.beat = 60 / bpm
        self.swing = swing
        self.rng = np.random.default_rng(seed)
        self.length = int(RATE * (bars * 4 * self.beat + 8))
        self.stems = {}

    def seconds(self, beats):
        return beats * self.beat

    def add(self, sound, beat, stem, gain=1.0, pan=0.0, delay=0.0, loose=True):
        """Place a sound at a beat. Off-beat eighths are pushed a little late (swing), and loose notes
        get a few milliseconds of timing and a touch of loudness drift, like a person playing."""
        if abs(beat % 1 - 0.5) < 1e-6:
            beat += self.swing
        start = self.seconds(beat) + delay
        if loose:
            start += self.rng.normal(0, 0.005)
            gain *= 1 + self.rng.normal(0, 0.05)
        if sound.ndim == 1:
            angle = (pan + 1) * np.pi / 4  # constant-power pan
            sound = np.stack([sound * np.cos(angle), sound * np.sin(angle)])
        i = max(0, int(RATE * start))
        end = min(self.length, i + sound.shape[1])
        if stem not in self.stems:
            self.stems[stem] = np.zeros((2, self.length), np.float32)
        self.stems[stem][:, i:end] += gain * sound[:, :end - i]

    def render(self, name, levels, sends, room=2.2):
        """Balance the stems to `levels` (dB while playing), add the shared room, and encode Ogg Vorbis."""
        dry = np.zeros((2, self.length), np.float32)
        send = np.zeros((2, self.length), np.float32)
        for stem, audio in self.stems.items():
            audio *= 10 ** (levels[stem] / 20) / playing_rms(audio)
            dry += audio
            send += audio * sends.get(stem, 0.2)
        verb = room_impulse(room)
        out = dry + np.stack([fftconvolve(send[c], verb[c])[:self.length] for c in range(2)])
        out = sosfilt(MASTER_WARMTH, sosfilt(MASTER_LOW_CUT, out, axis=-1), axis=-1)
        out *= 10 ** (LOUDNESS_DB / 20) / playing_rms(out)
        out = 0.89 * np.tanh(out / 0.89)  # only rounds off the rare peak
        # end once the last chord has rung out, with a gentle fade so nothing clicks
        audible = np.nonzero(np.abs(out).max(axis=0) > 10 ** (-66 / 20))[0]
        out = out[:, :audible[-1] + int(RATE * 0.3)]
        fade = int(RATE * 1.5)
        out[:, -fade:] *= np.cos(np.linspace(0, np.pi / 2, fade)) ** 2
        out[:, :int(RATE * 0.02)] *= np.linspace(0, 1, int(RATE * 0.02))
        path = os.path.join(OUT, name + '.ogg')
        frames = out.T.astype(np.float32)
        with sf.SoundFile(path, 'w', RATE, 2, format='OGG', subtype='VORBIS') as ogg:
            # libsndfile's Vorbis encoder crashes on one huge write, so feed it in blocks
            for i in range(0, len(frames), 32768):
                ogg.write(frames[i:i + 32768])
        print(f'{name}: {out.shape[1] / RATE:5.1f} s, {os.path.getsize(path) / 1e6:.2f} MB, '
              f'peak {20 * np.log10(np.abs(out).max()):.1f} dB')


def playing_rms(audio):
    """Loudness while the part is actually playing: silent stretches (a tacet section) do not count."""
    mono = np.asarray(audio, np.float64).mean(axis=0)
    frames = mono[:len(mono) // 2048 * 2048].reshape(-1, 2048)
    energy = np.mean(frames ** 2, axis=1)
    return np.sqrt(np.mean(energy[energy > energy.max() * 1e-4]))


def room_impulse(rt60, seconds=3.0):
    """A soft hall: decaying noise, different in each ear, whose tail darkens like a real room."""
    t = times(seconds)
    decay = 10 ** (-3 * t / rt60)
    darker = t / seconds
    channels = []
    for _ in range(2):
        noise = NOISE.standard_normal(len(t)) * decay
        ir = sosfilt(sos(2, 7000, 'low'), noise) * (1 - darker) + sosfilt(sos(2, 2500, 'low'), noise) * darker
        ir = np.concatenate([np.zeros(int(RATE * 0.02)), ir])  # pre-delay keeps the notes clear
        channels.append(ir / np.sqrt(np.sum(ir ** 2)))
    return channels


INSTRUMENTS = {'epiano': epiano, 'kalimba': kalimba, 'flute': flute, 'bell': bell, 'guitar': guitar}
STEM_PAN = {'keys': -0.15, 'kalimba': 0.1, 'flute': 0.0, 'eplead': 0.05, 'shaker': 0.3, 'brush': -0.1}


def section(mix, bar, chords, keys=None, bass_style=None, pads=False, arp=None, drums='', voices=()):
    """Lay down one section from `bar` and return the bar after it.
    keys/bass_style name a pattern, arp is (instrument, order, octave), drums a list of parts, and
    voices are (melody, instrument, stem) tunes written against this section's bars."""
    start = bar * 4
    long_notes = [(start + beat, start + beat + beats, pitch_class(hz(name)))
                  for text, _, _ in voices for beat, name, beats in melody(text) if beats >= 1]
    for beat, beats, name in progression(chords):
        root, voicing = CHORDS[name]
        at = start + beat
        sung = {p for s, e, p in long_notes if s < at + beats and e > at}
        # A chord tone a semitone under a long tune note rubs against it (a minor ninth, e.g. the
        # major 7th under a melody on the root). Lift that tone onto the tune's note, as a pianist would.
        notes = [f * 2 ** (1 / 12) if (pitch_class(f) + 1) % 12 in sung else f
                 for f in (hz(n) for n in voicing.split())]
        if pads:
            mix.add(pad(notes, mix.seconds(beats)), at, 'pad', loose=False)
        if keys:
            for hit, held, velocity in key_hits(keys, beats):
                chosen = notes if keys != 'arp' else [notes[[0, 2, 1, 3][int(hit) % 4]]]
                for k, f in enumerate(chosen):
                    # a slight roll from the bottom note up, as a hand would play it
                    mix.add(epiano(f, mix.seconds(held), velocity), at + hit, 'keys', pan=STEM_PAN['keys'], delay=0.012 * k)
        if bass_style:
            for hit, held, velocity in bass_hits(bass_style, beats):
                mix.add(bass(hz(root), mix.seconds(held), velocity, soft=bass_style == 'swell'), at + hit, 'bass')
        if arp:
            instrument, order, octave = arp
            tones = [f * octave for f in notes] + [notes[0] * octave * 2]
            for step, hit in enumerate(np.arange(0, beats, 0.5)):
                k = ARPS[order][step % 8]
                velocity = 0.5 if hit % 1 == 0 else 0.38
                mix.add(INSTRUMENTS[instrument](tones[k], mix.seconds(1.5), velocity), at + hit, 'arp', pan=0.25 if k % 2 else -0.25)
    bars = len(chords.split('|'))
    for b in range(bars):
        at = start + b * 4
        if 'kick' in drums:
            mix.add(kick(), at, 'kick', 0.9)
            mix.add(kick(), at + 2.5, 'kick', 0.55)
        if 'brush' in drums:
            mix.add(brush(), at + 1, 'brush', pan=STEM_PAN['brush'])
            mix.add(brush(), at + 3, 'brush', pan=STEM_PAN['brush'])
        if 'shaker' in drums:
            for i in range(8):
                mix.add(shaker(), at + i / 2, 'shaker', 0.6 if i % 2 else 0.35, pan=STEM_PAN['shaker'])
    for text, instrument, stem in voices:
        for k, (beat, name, beats) in enumerate(melody(text)):
            velocity = 0.7 if beat % 4 == 0 else 0.6
            pan = (0.4 if k % 2 else -0.4) if stem == 'bells' else STEM_PAN.get(stem, 0.0)
            mix.add(INSTRUMENTS[instrument](hz(name), mix.seconds(beats), velocity), start + beat, stem, pan=pan)
    return bar + bars


# ---------------------------------------------------------------- the pieces
# Map pieces: 76-84 bpm, a singable tune that moves mostly by step, and a section of contrast
# (bridge, then a drum-less break) so the ear has somewhere new to go every 25-30 seconds.

SUNNY_HINT = 'r:4 | r:4 | r:1 A4:.5 C5:.5 E5:2 | D5:1 C5:1 r:2'
SUNNY_A = ('r:1 A4:.5 C5:.5 E5:1.5 D5:.5 | C5:2 r:.5 A4:.5 C5:.5 D5:.5 | F5:1.5 E5:.5 D5:1 C5:1 | '
           'C5:1 D5:.5 E5:2.5 | r:.5 A4:.5 D5:.5 E5:.5 F5:1.5 E5:.5 | E5:1 D5:.5 C5:1.5 A4:1 | '
           'Bb4:1 C5:.5 D5:1.5 F5:.5 D5:.5 | G5:1.5 F5:.5 E5:2')
SUNNY_A2 = ('r:1 A4:.5 C5:.5 E5:1.5 G5:.5 | E5:2 r:.5 C5:.5 D5:.5 E5:.5 | F5:1.5 E5:.5 D5:.5 C5:.5 D5:1 | '
            'E5:1.5 D5:.5 C5:2 | r:.5 A4:.5 D5:.5 E5:.5 F5:1 A5:1 | G5:1 E5:.5 C5:1.5 A4:1 | '
            'Bb4:.5 C5:.5 D5:.5 F5:.5 A5:1.5 G5:.5 | F5:2 E5:2')
SUNNY_B = ('A4:2 C5:1 D5:1 | F5:3 E5:.5 D5:.5 | D5:2 Bb4:1 C5:1 | E5:3 r:1 | '
           'A4:1 C5:1 D5:1 E5:1 | F5:2 A5:1 G5:1 | F5:1.5 D5:.5 Bb4:1 D5:1 | F5:2 E5:2')
SUNNY_BELLS = 'r:4 | A5:1 C6:1 E6:2 | r:4 | r:4 | r:4 | D6:1 C6:1 A5:2 | r:4 | r:4'
SUNNY_END = 'r:1 A4:.5 C5:.5 E5:2 | D5:1 C5:1 D5:2 | r:.5 A4:.5 C5:.5 E5:.5 F5:2 | r:4'


def sunny():
    """Map 1, F major, 76 bpm: a kalimba tune over electric piano, a flute bridge, the tune again on piano."""
    mix = Mix(bpm=76, bars=48, swing=0.06, seed=11)
    verse = 'Fmaj9 | Am7 | Bbmaj9 | C69 | Dm9 | Am7 | Gm9 | C7sus4 C7'
    bridge = 'Dm9 | Bbmaj9 | Gm9 | Am7 | Dm9 | Bbmaj9 | Gm9 | C7sus4 C7'
    pause = 'Bbmaj9 | Am7 | Gm9 | Fmaj9 | Bbmaj9 | Am7 | Gm9 | C7sus4'
    bar = section(mix, 0, 'Fmaj9 | Bbmaj9 | Fmaj9 | Bbmaj9', keys='hold', pads=True, bass_style='long',
                  voices=[(SUNNY_HINT, 'kalimba', 'kalimba')])
    bar = section(mix, bar, verse, keys='lofi', bass_style='lofi', pads=True, drums=['shaker'],
                  voices=[(SUNNY_A, 'kalimba', 'kalimba')])
    bar = section(mix, bar, verse, keys='lofi', bass_style='lofi', pads=True, drums=['kick', 'brush', 'shaker'],
                  voices=[(SUNNY_A2, 'kalimba', 'kalimba')])
    bar = section(mix, bar, bridge, keys='arp', bass_style='long', pads=True, drums=['brush', 'shaker'],
                  voices=[(SUNNY_B, 'flute', 'flute')])
    bar = section(mix, bar, verse, keys='lofi', bass_style='lofi', pads=True, drums=['kick', 'brush', 'shaker'],
                  voices=[(SUNNY_A, 'epiano', 'eplead')])
    bar = section(mix, bar, pause, keys='arp', bass_style='long', pads=True, voices=[(SUNNY_BELLS, 'bell', 'bells')])
    section(mix, bar, 'Fmaj9 | Bbmaj9 | Fmaj9 | Fmaj9', keys='hold', bass_style='long', pads=True,
            voices=[(SUNNY_END, 'kalimba', 'kalimba')])
    mix.render('music_sunny',
               levels={'keys': -13, 'pad': -20, 'bass': -13, 'kalimba': -9, 'flute': -11, 'eplead': -9,
                       'bells': -22, 'kick': -18, 'brush': -25, 'shaker': -29},
               sends={'keys': 0.3, 'pad': 0.4, 'bass': 0.04, 'kalimba': 0.3, 'flute': 0.3, 'eplead': 0.3,
                      'bells': 0.6, 'kick': 0.0, 'brush': 0.18, 'shaker': 0.12})


GARDEN_A = ('F#5:1.5 E5:.5 D5:1 A4:1 | C#5:1.5 B4:.5 C#5:1 E5:1 | D5:1.5 C#5:.5 B4:2 | A4:2 r:1 A4:.5 B4:.5 | '
            'D5:1.5 B4:.5 D5:1 G5:1 | F#5:2 A5:1 F#5:1 | G5:1.5 F#5:.5 E5:1 B4:1 | D5:2 C#5:2')
GARDEN_A2 = ('F#5:1.5 E5:.5 D5:.5 E5:.5 F#5:1 | E5:1.5 C#5:.5 A4:1 E5:1 | D5:1.5 C#5:.5 B4:.5 C#5:.5 D5:1 | '
             'C#5:2 r:1 A4:.5 B4:.5 | D5:1 G5:1 F#5:.5 E5:.5 D5:1 | A5:2 F#5:1 D5:1 | '
             'G5:1 F#5:.5 E5:.5 B4:1 E5:1 | D5:2 C#5:2')
GARDEN_B = ('B4:1 D5:1 F#5:2 | E5:1.5 C#5:.5 B4:2 | A4:1 C#5:1 E5:2 | F#5:1.5 E5:.5 D5:2 | '
            'G5:1.5 F#5:.5 E5:1 B4:1 | A4:1 C#5:1 E5:1 F#5:1 | G5:1.5 F#5:.5 D5:1 B4:1 | E5:1 D5:1 C#5:2')
GARDEN_BELLS = 'r:4 | C#6:1 A5:1 E5:2 | r:4 | r:4 | r:4 | A5:1 C#6:1 E6:2 | r:4 | r:4'
GARDEN_END = 'F#5:1.5 E5:.5 D5:2 | B4:1 D5:1 E5:2 | A4:1 D5:3 | r:4'


def garden():
    """Map 2, D major, 84 bpm: fingerpicked guitar and a flute tune over a gently falling bass line."""
    mix = Mix(bpm=84, bars=48, swing=0.05, seed=23)
    verse = 'Dmaj9 | A/C# | Bm7 | F#m7 | Gmaj9 | D/F# | Em9 | A7sus4 A7'
    bridge = 'Gmaj9 | Aadd9 | F#m7 | Bm9 | Em9 | F#m7 | Gmaj9 | A7sus4 A7'
    pause = 'Gmaj9 | F#m7 | Em9 | Dmaj9 | Gmaj9 | F#m7 | Em9 | A7sus4'
    picking = ('guitar', 'wave', 1)
    bar = section(mix, 0, 'Dmaj9 | Gmaj9 | Dmaj9 | Gmaj9', pads=True, arp=('guitar', 'up', 1), bass_style='long')
    bar = section(mix, bar, verse, arp=picking, bass_style='lofi', pads=True, drums=['shaker'],
                  voices=[(GARDEN_A, 'flute', 'flute')])
    bar = section(mix, bar, verse, arp=picking, keys='pulse', bass_style='lofi', pads=True,
                  drums=['kick', 'brush', 'shaker'], voices=[(GARDEN_A2, 'flute', 'flute')])
    bar = section(mix, bar, bridge, keys='lofi', arp=('guitar', 'up', 1), bass_style='long', pads=True,
                  drums=['brush', 'shaker'], voices=[(GARDEN_B, 'epiano', 'eplead')])
    bar = section(mix, bar, verse, arp=picking, keys='pulse', bass_style='lofi', pads=True,
                  drums=['kick', 'brush', 'shaker'], voices=[(GARDEN_A, 'kalimba', 'kalimba')])
    bar = section(mix, bar, pause, arp=('guitar', 'up', 1), bass_style='long', pads=True,
                  voices=[(GARDEN_BELLS, 'bell', 'bells')])
    section(mix, bar, 'Dmaj9 | Gmaj9 | Dmaj9 | Dmaj9', keys='hold', bass_style='long', pads=True,
            voices=[(GARDEN_END, 'flute', 'flute')])
    mix.render('music_garden',
               levels={'arp': -14, 'keys': -16, 'pad': -20, 'bass': -13, 'flute': -10, 'eplead': -10,
                       'kalimba': -9, 'bells': -22, 'kick': -18, 'brush': -25, 'shaker': -29},
               sends={'arp': 0.25, 'keys': 0.3, 'pad': 0.4, 'bass': 0.04, 'flute': 0.3, 'eplead': 0.3,
                      'kalimba': 0.3, 'bells': 0.6, 'kick': 0.0, 'brush': 0.18, 'shaker': 0.12})


# Level pieces: 62-66 bpm, two bars per chord, no running tune. Reading studies find that music which
# asks for attention (words, busy melodies) costs comprehension, so these change by layers instead:
# every 30 seconds something enters or leaves, and the bells only hint at a tune.

PAGES_BELLS_1 = 'r:4 | r:4 | E5:2 G5:2 | A5:4 | r:4 | r:4 | G5:2 E5:2 | D5:4'
PAGES_BELLS_2 = 'r:4 | r:4 | r:4 | C6:2 A5:2 | r:4 | r:4 | r:4 | G5:2 D5:2'
PAGES_BELLS_3 = 'r:4 | A5:2 C6:2 | r:4 | G5:2 E5:2 | r:4 | A5:2 F5:2 | r:4 | D5:4'
PAGES_BELLS_4 = 'r:4 | r:4 | E5:2 G5:2 | C6:4 | r:4 | r:4 | r:4 | r:4'


def pages():
    """Level 1, C major, 66 bpm: slow chords and a soft kalimba ripple."""
    mix = Mix(bpm=66, bars=40, seed=37)
    ripple, ripple2 = ('kalimba', 'up', 2), ('kalimba', 'wave', 2)
    bar = section(mix, 0, 'Cmaj9 | Cmaj9 | Fmaj9 | Fmaj9 | Am9 | Am9 | G6 | G6', pads=True, bass_style='swell',
                  voices=[(PAGES_BELLS_1, 'bell', 'bells')])
    bar = section(mix, bar, 'Cmaj9 | Cmaj9 | Fmaj9 | Fmaj9 | Am9 | Am9 | Fmaj9 | Gsus4 G', pads=True,
                  bass_style='swell', arp=ripple, voices=[(PAGES_BELLS_2, 'bell', 'bells')])
    bar = section(mix, bar, 'Am9 | Am9 | Fmaj9 | Fmaj9 | Cmaj9 | Cmaj9 | Gsus4 | G', pads=True, bass_style='swell',
                  arp=ripple2, keys='pulse', drums=['shaker'])
    bar = section(mix, bar, 'Fmaj9 | Fmaj9 | Em7 | Em7 | Dm9 | Dm9 | Gsus4 | G', pads=True, bass_style='swell',
                  arp=ripple, keys='pulse', drums=['shaker'], voices=[(PAGES_BELLS_3, 'bell', 'bells')])
    section(mix, bar, 'Cmaj9 | Cmaj9 | Fmaj9 | Fmaj9 | Cmaj9 | Cmaj9 | Cmaj9 | Cmaj9', pads=True,
            bass_style='swell', keys='hold', voices=[(PAGES_BELLS_4, 'bell', 'bells')])
    mix.render('music_pages',
               levels={'arp': -13, 'pad': -15, 'bass': -16, 'keys': -19, 'bells': -20, 'shaker': -33},
               sends={'arp': 0.35, 'pad': 0.45, 'bass': 0.05, 'keys': 0.35, 'bells': 0.6, 'shaker': 0.15},
               room=2.8)


DRIFT_FLUTE_1 = 'G4:3 Bb4:1 | C5:4 | r:4 | r:4 | Bb4:2 G4:2 | F4:4 | r:4 | r:4'
DRIFT_FLUTE_2 = 'Eb5:3 C5:1 | Bb4:4 | r:4 | r:4 | D5:2 Bb4:2 | G4:4 | r:4 | r:4'
DRIFT_BELLS = 'r:4 | r:4 | Eb6:2 Bb5:2 | G5:4 | r:4 | r:4 | r:4 | r:4'


def drift():
    """Level 2, E-flat major, 62 bpm: fingerpicked guitar, warm pad and a few long flute tones."""
    mix = Mix(bpm=62, bars=40, seed=41)
    picking, picking2 = ('guitar', 'up', 1), ('guitar', 'wave', 1)
    bar = section(mix, 0, 'Ebmaj9 | Ebmaj9 | Abmaj9 | Abmaj9 | Cm9 | Cm9 | Bb6 | Bb6', pads=True, arp=picking)
    bar = section(mix, bar, 'Ebmaj9 | Ebmaj9 | Gm7 | Gm7 | Abmaj9 | Abmaj9 | Bbsus4 | Bb', pads=True, arp=picking,
                  bass_style='swell', keys='pulse')
    bar = section(mix, bar, 'Cm9 | Cm9 | Abmaj9 | Abmaj9 | Ebmaj9 | Ebmaj9 | Bbsus4 | Bb', pads=True, arp=picking2,
                  bass_style='swell', drums=['shaker'], voices=[(DRIFT_FLUTE_1, 'flute', 'flute')])
    bar = section(mix, bar, 'Abmaj9 | Abmaj9 | Fm9 | Fm9 | Cm9 | Cm9 | Bbsus4 | Bb', pads=True, arp=picking2,
                  bass_style='swell', keys='pulse', drums=['shaker'], voices=[(DRIFT_FLUTE_2, 'flute', 'flute')])
    section(mix, bar, 'Ebmaj9 | Ebmaj9 | Abmaj9 | Abmaj9 | Ebmaj9 | Ebmaj9 | Ebmaj9 | Ebmaj9', pads=True,
            arp=picking, bass_style='swell', voices=[(DRIFT_BELLS, 'bell', 'bells')])
    mix.render('music_drift',
               levels={'arp': -13, 'pad': -15, 'bass': -16, 'keys': -19, 'flute': -15, 'bells': -21, 'shaker': -33},
               sends={'arp': 0.3, 'pad': 0.45, 'bass': 0.05, 'keys': 0.35, 'flute': 0.35, 'bells': 0.6,
                      'shaker': 0.15},
               room=2.8)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    sunny()
    garden()
    pages()
    drift()
    print('Wrote music to', os.path.abspath(OUT))
