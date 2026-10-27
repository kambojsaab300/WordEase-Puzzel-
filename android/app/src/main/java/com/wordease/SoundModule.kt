package com.wordease

import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.SoundPool
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

// Short game sound effects from res/raw through SoundPool (low latency, several at once),
// and one looping background track through MediaPlayer.
class SoundModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

  private val attributes =
    AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_GAME)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build()

  private val pool: SoundPool =
    SoundPool.Builder().setMaxStreams(8).setAudioAttributes(attributes).build()

  private val sounds: Map<String, Int> =
    mapOf(
      "tap" to R.raw.sfx_tap,
      "letter" to R.raw.sfx_letter,
      "tick" to R.raw.sfx_tick,
      "word" to R.raw.sfx_word,
      "wrong" to R.raw.sfx_wrong,
      "level" to R.raw.sfx_level,
      "coin" to R.raw.sfx_coin,
      "stamp" to R.raw.sfx_stamp,
      "splash" to R.raw.sfx_splash,
      "open" to R.raw.sfx_open,
      "locked" to R.raw.sfx_locked,
      "hint" to R.raw.sfx_hint,
      "star" to R.raw.sfx_star,
      "landmark" to R.raw.sfx_landmark,
      "world" to R.raw.sfx_world,
      "unlock" to R.raw.sfx_unlock,
      "chest" to R.raw.sfx_chest,
    ).mapValues { (_, res) -> pool.load(context, res, 1) }

  private val tracks: Map<String, Int> = mapOf("calm" to R.raw.music_calm)

  private var music: MediaPlayer? = null
  private var musicName: String? = null

  override fun getName() = "WordEaseSound"

  /** volume 0..1, rate 0.5..2 (pitch) */
  @ReactMethod
  fun play(name: String, volume: Double, rate: Double) {
    val id = sounds[name] ?: return
    val v = volume.coerceIn(0.0, 1.0).toFloat()
    if (v <= 0f) return
    pool.play(id, v, v, 1, 0, rate.coerceIn(0.5, 2.0).toFloat())
  }

  /** Starts (or keeps playing) a looping track; a different track replaces the current one. */
  @ReactMethod
  fun playMusic(name: String, volume: Double) {
    val res = tracks[name] ?: return
    val v = volume.coerceIn(0.0, 1.0).toFloat()
    val current = music
    if (current != null && musicName == name) {
      current.setVolume(v, v)
      if (!current.isPlaying) current.start()
      return
    }
    stopMusic()
    val player = MediaPlayer.create(context, res, attributes, 0) ?: return
    player.isLooping = true
    player.setVolume(v, v)
    player.start()
    music = player
    musicName = name
  }

  @ReactMethod
  fun setMusicVolume(volume: Double) {
    val v = volume.coerceIn(0.0, 1.0).toFloat()
    music?.setVolume(v, v)
  }

  /** Pauses without forgetting the track, e.g. while the app is in the background. */
  @ReactMethod
  fun pauseMusic() {
    music?.let { if (it.isPlaying) it.pause() }
  }

  @ReactMethod
  fun stopMusic() {
    music?.release()
    music = null
    musicName = null
  }

  override fun invalidate() {
    stopMusic()
    pool.release()
    super.invalidate()
  }
}
