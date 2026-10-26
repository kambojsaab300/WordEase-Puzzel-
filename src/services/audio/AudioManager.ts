import { useSettings } from '../../store/settings';

export type SfxEvent =
  | 'letterTouch'
  | 'dragTick'
  | 'wordFound'
  | 'wrongSelection'
  | 'levelComplete'
  | 'coinGain'
  | 'stampThump'
  | 'buttonTap';

class AudioManagerService {
  private lastDragStep = 0;

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
  public play(event: SfxEvent, meta?: { step?: number }) {
    if (!this.isSfxEnabled()) return;

    switch (event) {
      case 'letterTouch':
        this.lastDragStep = 0;
        break;
      case 'dragTick':
        this.lastDragStep = meta?.step ?? this.lastDragStep + 1;
        break;
      case 'wordFound':
      case 'wrongSelection':
      case 'levelComplete':
      case 'coinGain':
      case 'stampThump':
      case 'buttonTap':
        break;
    }
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
}

export const AudioManager = new AudioManagerService();
