package com.wordease

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.SoundPool
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

// Short game sound effects from res/raw through SoundPool (low latency, several at once),
// and background music through MediaPlayer: a playlist per screen that fades in and out
// and remembers where each piece stopped.
class SoundModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

  private val attributes =
    AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_GAME)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build()

  private val musicAttributes =
    AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_GAME)
      .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
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

  // Composed by tools/generate-music.py
  private val tracks: Map<String, Int> =
    mapOf(
      "sunny" to R.raw.music_sunny,
      "garden" to R.raw.music_garden,
      "pages" to R.raw.music_pages,
      "drift" to R.raw.music_drift,
    )

  // MediaPlayer calls and fades all run on the main thread, so a quick screen change
  // can never race a fade that is still running.
  private val main = Handler(Looper.getMainLooper())

  private var music: MediaPlayer? = null
  private var musicName: String? = null
  private var playlist: List<String> = emptyList()
  private var musicVolume = 0f // MediaPlayer cannot report its volume, so it is tracked here
  private var targetVolume = 0f
  private var ramp: ValueAnimator? = null

  private class Fading(val player: MediaPlayer, val fade: ValueAnimator, var volume: Float)

  private val fading = mutableMapOf<String, Fading>()

  // A level usually ends long before a 2.5 minute piece does. Remembering the spot (and which
  // piece each playlist was on) keeps the next level from replaying the same opening bars.
  private val resumeAt = mutableMapOf<String, Int>()
  private val playlistTrack = mutableMapOf<List<String>, String>()

  override fun getName() = "WordEaseSound"

  /** volume 0..1, rate 0.5..2 (pitch) */
  @ReactMethod
  fun play(name: String, volume: Double, rate: Double) {
    val id = sounds[name] ?: return
    val v = volume.coerceIn(0.0, 1.0).toFloat()
    if (v <= 0f) return
    pool.play(id, v, v, 1, 0, rate.coerceIn(0.5, 2.0).toFloat())
  }

  /** Plays the pieces in turn; the same playlist again only adjusts the volume. */
  @ReactMethod
  fun playMusic(names: ReadableArray, volume: Double) {
    val list = (0 until names.size()).mapNotNull { names.getString(it) }.filter { it in tracks }
    val v = volume.coerceIn(0.0, 1.0).toFloat()
    main.post { startPlaylist(list, v) }
  }

  @ReactMethod
  fun setMusicVolume(volume: Double) {
    val v = volume.coerceIn(0.0, 1.0).toFloat()
    main.post {
      targetVolume = v
      rampTo(v)
    }
  }

  /** Pauses without forgetting the piece, e.g. while the app is in the background. */
  @ReactMethod
  fun pauseMusic() {
    main.post {
      ramp?.cancel()
      music?.let { if (it.isPlaying) it.pause() }
    }
  }

  /** Fades out; the next playMusic carries on from where the piece was. */
  @ReactMethod
  fun stopMusic() {
    main.post { fadeOutCurrent() }
  }

  private fun startPlaylist(list: List<String>, volume: Float) {
    if (list.isEmpty()) return
    targetVolume = volume
    val current = music
    if (current != null && list == playlist) {
      if (!current.isPlaying) {
        musicVolume = 0f
        current.setVolume(0f, 0f)
        current.start()
      }
      rampTo(volume)
      return
    }
    fadeOutCurrent()
    playlist = list
    startTrack(playlistTrack[list] ?: list.first())
  }

  private fun startTrack(name: String) {
    playlistTrack[playlist] = name
    musicName = name
    // Back within a second of leaving (e.g. Level -> Result -> Next level): take the
    // fading player back instead of starting the piece again.
    fading.remove(name)?.let { back ->
      back.fade.cancel()
      music = back.player
      musicVolume = back.volume
      rampTo(targetVolume)
      return
    }
    val player = MediaPlayer.create(context, tracks.getValue(name), musicAttributes, 0) ?: return
    resumeAt[name]?.let { player.seekTo(it) }
    player.setOnCompletionListener { if (it === music) playNext() }
    musicVolume = 0f
    player.setVolume(0f, 0f)
    player.start()
    music = player
    rampTo(targetVolume)
  }

  /** A piece ended on its own: the playlist moves on to the next one. */
  private fun playNext() {
    val name = musicName ?: return
    resumeAt.remove(name)
    ramp?.cancel()
    music?.release()
    music = null
    startTrack(playlist[(playlist.indexOf(name) + 1) % playlist.size])
  }

  private fun fadeOutCurrent() {
    val player = music ?: return
    val name = musicName ?: return
    ramp?.cancel()
    music = null
    musicName = null
    playlist = emptyList()
    if (!player.isPlaying) {
      resumeAt[name] = player.currentPosition
      player.release()
      return
    }
    val fade = ValueAnimator.ofFloat(musicVolume, 0f).setDuration(FADE_MS)
    val leaving = Fading(player, fade, musicVolume)
    fade.addUpdateListener {
      leaving.volume = it.animatedValue as Float
      player.setVolume(leaving.volume, leaving.volume)
    }
    fade.addListener(
      object : AnimatorListenerAdapter() {
        override fun onAnimationEnd(animation: Animator) {
          // a player taken back by startTrack is no longer in `fading` and keeps playing
          if (fading[name] !== leaving) return
          fading.remove(name)
          resumeAt[name] = player.currentPosition
          player.release()
        }
      },
    )
    fading[name] = leaving
    fade.start()
  }

  private fun rampTo(volume: Float) {
    val player = music ?: return
    ramp?.cancel()
    ramp =
      ValueAnimator.ofFloat(musicVolume, volume).setDuration(FADE_MS).apply {
        addUpdateListener {
          musicVolume = it.animatedValue as Float
          player.setVolume(musicVolume, musicVolume)
        }
        start()
      }
  }

  override fun invalidate() {
    main.post {
      ramp?.cancel()
      fading.values.toList().forEach { it.fade.cancel() }
      music?.release()
      music = null
    }
    pool.release()
    super.invalidate()
  }

  private companion object {
    const val FADE_MS = 1200L
  }
}
