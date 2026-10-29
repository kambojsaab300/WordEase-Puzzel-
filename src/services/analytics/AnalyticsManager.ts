import { sendToFirebase } from './firebaseSink';

export type AnalyticsEvent =
  | { name: 'app_open'; params: { type: 'cold' | 'warm' } }
  | { name: 'consent_result'; params: { status: string } }
  | { name: 'tutorial_step'; params: { step: number } }
  | { name: 'level_start'; params: { level_id: number; world: number } }
  | { name: 'word_found'; params: { level_id: number; word_length: number; direction?: string } }
  | { name: 'hint_used'; params: { type: string; source: 'coins' | 'ad' | 'free' } }
  | { name: 'level_complete'; params: { level_id: number; stars: number; hints: number; seconds?: number } }
  | { name: 'level_quit'; params: { level_id: number; words_found: number; seconds: number } }
  | { name: 'ad_impression'; params: { format: string; placement: string; value?: number } }
  | { name: 'rewarded_complete'; params: { placement: string } }
  | { name: 'iap_purchase'; params: { product_id: string } }
  | { name: 'daily_complete'; params: { streak: number } }
  | { name: 'world_unlock'; params: { world: number } }
  | { name: 'setting_change'; params: { key: string; value: string | number | boolean } };

class AnalyticsManagerService {
  private eventLog: { event: AnalyticsEvent; timestamp: number }[] = [];

  /**
   * Dispatches an event to analytics providers (Firebase, dev logs).
   * Safe and non-blocking.
   */
  public logEvent(event: AnalyticsEvent) {
    this.eventLog.push({ event, timestamp: Date.now() });
    sendToFirebase(event.name, event.params);

    // Truncate memory buffer if exceeding 200 events
    if (this.eventLog.length > 200) {
      this.eventLog.shift();
    }
  }

  public getRecentEvents() {
    return [...this.eventLog];
  }

  public clearForTesting() {
    this.eventLog = [];
  }

  public logLevelStart(levelId: number, world: number) {
    this.logEvent({ name: 'level_start', params: { level_id: levelId, world } });
  }

  public logWordFound(levelId: number, wordLength: number, direction?: string) {
    this.logEvent({ name: 'word_found', params: { level_id: levelId, word_length: wordLength, direction } });
  }

  public logHintUsed(type: string, source: 'coins' | 'ad' | 'free') {
    this.logEvent({ name: 'hint_used', params: { type, source } });
  }

  /** `seconds` is active play time only (pauses and the background are not counted) */
  public logLevelComplete(levelId: number, stars: number, hints: number, seconds?: number) {
    this.logEvent({ name: 'level_complete', params: { level_id: levelId, stars, hints, seconds } });
  }

  public logLevelQuit(levelId: number, wordsFound: number, seconds: number) {
    this.logEvent({ name: 'level_quit', params: { level_id: levelId, words_found: wordsFound, seconds } });
  }

  public logDailyComplete(streak: number) {
    this.logEvent({ name: 'daily_complete', params: { streak } });
  }

  public logSettingChange(key: string, value: string | number | boolean) {
    this.logEvent({ name: 'setting_change', params: { key, value } });
  }
}

export const AnalyticsManager = new AnalyticsManagerService();
