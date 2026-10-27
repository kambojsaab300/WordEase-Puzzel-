import { AppState, NativeModules } from 'react-native';
import { useSettings } from '../../store/settings';

// Native player (android/app/src/main/java/com/wordease/SoundModule.kt): effects through SoundPool,
// one looping music track through MediaPlayer. Missing in tests, so every call is optional.
// Where each sound plays in the game: docs/SOUND-FLOW.md
type SoundPlayer = {
  play: (name: string, volume: number, rate: number) => void;
  playMusic: (name: string, volume: number) => void;
  setMusicVolume: (volume: number) => void;
  pauseMusic: () => void;
  stopMusic: () => void;
};
const player: SoundPlayer | undefined = NativeModules.WordEaseSound;

export type SfxEvent =
  | 'letterTouch'
  | 'dragTick'
  | 'wordFound'
  | 'wrongSelection'
  | 'levelComplete'
  | 'coinGain'
  | 'stampThump'
  | 'buttonTap'
  | 'splash'
  | 'popupOpen'
  | 'locked'
  | 'hint'
  | 'star'
  | 'landmark'
  | 'worldComplete'
  | 'unlock'
  | 'chest';

const SOUND_OF: Record<SfxEvent, string> = {
  letterTouch: 'letter',
  dragTick: 'tick',
  wordFound: 'word',
  wrongSelection: 'wrong',
  levelComplete: 'level',
  coinGain: 'coin',
  stampThump: 'stamp',
  buttonTap: 'tap',
  splash: 'splash',
  popupOpen: 'open',
  locked: 'locked',
  hint: 'hint',
  star: 'star',
  landmark: 'landmark',
  worldComplete: 'world',
  unlock: 'unlock',
  chest: 'chest',
};
// Each letter in a drag sounds a little higher, up to this many steps
const MAX_TICK_STEP = 12;
// Stars 1, 2, 3 ring a little higher each time
const STAR_RATES = [1, 1.12, 1.26];

/** 'map' plays at full music volume; 'level' a little softer so it never distracts from the grid */
export type MusicMood = 'map' | 'level';
const MOOD_VOLUME: Record<MusicMood, number> = { map: 1, level: 0.6 };

function safely(call: () => void) {
  try {
    call();
  } catch {
    // sound is a nicety; never let it break the game
  }
}

class AudioManagerService {
  private lastDragStep = 0;
  private mood: MusicMood | null = null;

  constructor() {
    // Music pauses with the app and picks up again when the player comes back
    AppState.addEventListener?.('change', state => {
      if (state === 'active') this.applyMusic();
      else safely(() => player?.pauseMusic());
    });
    // Settings switches take effect at once
    useSettings.subscribe?.((now, before) => {
      if (now.music !== before.music) this.applyMusic();
    });
  }

  private isSfxEnabled(): boolean {
    return useSettings.getState().sfx > 0;
  }

  private isMusicEnabled(): boolean {
    return useSettings.getState().music > 0;
  }

  public getSfxVolume(): number {
    return useSettings.getState().sfx;
  }

  public getMusicVolume(): number {
    return useSettings.getState().music;
  }

  /**
   * Dispatches sound effect playback.
   * Fully safe and non-blocking.
   */
  public play(event: SfxEvent, meta?: { step?: number; rate?: number }) {
    if (!this.isSfxEnabled()) return;

    let rate = meta?.rate ?? 1;
    if (event === 'letterTouch') {
      this.lastDragStep = 0;
    } else if (event === 'dragTick') {
      this.lastDragStep = meta?.step ?? this.lastDragStep + 1;
      rate = 1 + Math.min(this.lastDragStep, MAX_TICK_STEP) * 0.05;
    }
    safely(() => player?.play(SOUND_OF[event], this.getSfxVolume(), rate));
  }

  public playLetterTouch() {
    this.play('letterTouch');
  }

  public playDragTick(step: number) {
    this.play('dragTick', { step });
  }

  public playWordFound() {
    this.play('wordFound');
  }

  public playWrongSelection() {
    this.play('wrongSelection');
  }

  public playLevelComplete() {
    this.play('levelComplete');
  }

  public playCoinGain() {
    this.play('coinGain');
  }

  public playStampThump() {
    this.play('stampThump');
  }

  public playButtonTap() {
    this.play('buttonTap');
  }

  public playSplash() {
    this.play('splash');
  }

  public playPopupOpen() {
    this.play('popupOpen');
  }

  public playLocked() {
    this.play('locked');
  }

  public playHint() {
    this.play('hint');
  }

  /** index 0, 1, 2 for the first, second and third star */
  public playStar(index: number) {
    this.play('star', { rate: STAR_RATES[Math.max(0, Math.min(2, index))] });
  }

  public playLandmark() {
    this.play('landmark');
  }

  public playWorldComplete() {
    this.play('worldComplete');
  }

  public playUnlock() {
    this.play('unlock');
  }

  public playChest() {
    this.play('chest');
  }

  /** Calm background loop for the screen in front; call again on every focus */
  public startMusic(mood: MusicMood) {
    this.mood = mood;
    this.applyMusic();
  }

  /** Silence the background loop, e.g. while a celebration jingle plays */
  public stopMusic() {
    this.mood = null;
    safely(() => player?.stopMusic());
  }

  private applyMusic() {
    if (!this.mood || !this.isMusicEnabled()) {
      safely(() => player?.stopMusic());
      return;
    }
    const volume = this.getMusicVolume() * MOOD_VOLUME[this.mood];
    safely(() => player?.playMusic('calm', volume));
  }
}

export const AudioManager = new AudioManagerService();
