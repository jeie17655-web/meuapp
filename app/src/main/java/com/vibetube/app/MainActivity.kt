package com.vibetube.app

import android.Manifest
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.webkit.WebMessage
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONArray
import org.json.JSONObject
import android.content.ComponentName

class MainActivity : ComponentActivity() {
    private lateinit var web: WebView
    private var controller: MediaController? = null
    private val handler = Handler(Looper.getMainLooper())
    private val notificationPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) {}

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        web = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = true
            webViewClient = WebViewClient()
        }
        setContentView(web)

        installBridge()
        connectController()
        web.loadUrl("file:///android_asset/index.html")

        if (Build.VERSION.SDK_INT >= 33) {
            notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    private fun installBridge() {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return

        WebViewCompat.addWebMessageListener(
            web,
            "NativePlayer",
            setOf("file://"),
            WebViewCompat.WebMessageListener { _, msg, _, _, _ ->
                try {
                    val o = JSONObject(msg.data ?: return@WebMessageListener)
                    when (o.optString("type")) {
                        "play" -> playItem(o)
                        "pause" -> controller?.pause()
                        "resume" -> controller?.play()
                        "toggle" -> controller?.let { if (it.isPlaying) it.pause() else it.play() }
                        "stop" -> controller?.stop()
                        "seek" -> controller?.seekTo(o.optLong("ms"))
                        "seekBy" -> controller?.seekTo((controller?.currentPosition ?: 0L) + o.optLong("ms"))
                        "next" -> controller?.seekToNextMediaItem()
                        "previous" -> controller?.seekToPreviousMediaItem()
                        "shuffle" -> controller?.shuffleModeEnabled = o.optBoolean("enabled")
                        "repeat" -> controller?.repeatMode = o.optInt("mode", Player.REPEAT_MODE_OFF)
                        "speed" -> controller?.setPlaybackSpeed(o.optDouble("value", 1.0).toFloat())
                        "volume" -> controller?.volume = o.optDouble("value", 1.0).toFloat()
                        "setQueue" -> setQueue(o.optJSONArray("items") ?: JSONArray(), o.optInt("start", 0))
                        "state" -> sendState()
                        "saveState" -> sendState()
                        "clearState" -> sendCommandClearState()
                        "accountResume" -> sendState()
                        "download" -> VibeDownloadService.add(this@MainActivity, o.optString("id"), o.optString("url"))
                        "removeDownload" -> VibeDownloadService.remove(this@MainActivity, o.optString("id"))
                    }
                } catch (_: Exception) { }
            }
        )
    }

    private fun mediaItem(o: JSONObject): MediaItem =
        MediaItem.Builder()
            .setUri(o.getString("url"))
            .setMediaId(o.optString("id", o.getString("url")))
            .setMediaMetadata(
                MediaMetadata.Builder()
                    .setTitle(o.optString("title"))
                    .setArtist(o.optString("channel"))
                    .build()
            ).build()

    private fun playItem(o: JSONObject) {
        controller?.setMediaItem(mediaItem(o))
        controller?.prepare()
        controller?.play()
    }

    private fun setQueue(items: JSONArray, start: Int) {
        val list = mutableListOf<MediaItem>()
        for (i in 0 until items.length()) {
            val obj = items.optJSONObject(i) ?: continue
            if (obj.has("url")) list += mediaItem(obj)
        }
        if (list.isEmpty()) return
        controller?.setMediaItems(list, start.coerceIn(0, list.lastIndex), 0L)
        controller?.prepare()
        controller?.play()
    }

    private fun sendCommandClearState() {
        try {
            getSharedPreferences("vibetube_playback", MODE_PRIVATE).edit().clear().apply()
            sendState()
        } catch (_: Exception) {}
    }

    private fun connectController() {
        val token = SessionToken(this, ComponentName(this, PlaybackService::class.java))
        MediaController.Builder(this, token).buildAsync().addListener({
            controller = it.get()
            controller?.addListener(object : Player.Listener {
                override fun onIsPlayingChanged(isPlaying: Boolean) = sendState()
                override fun onPlaybackStateChanged(state: Int) = sendState()
                override fun onMediaItemTransition(item: MediaItem?, reason: Int) = sendState()
                override fun onTimelineChanged(timeline: androidx.media3.common.Timeline, reason: Int) = sendState()
                override fun onShuffleModeEnabledChanged(shuffleModeEnabled: Boolean) = sendState()
                override fun onRepeatModeChanged(repeatMode: Int) = sendState()
                override fun onPlaybackParametersChanged(playbackParameters: androidx.media3.common.PlaybackParameters) = sendState()
                override fun onVolumeChanged(volume: Float) = sendState()
                override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                    sendError(error.message ?: "Erro de reprodução")
                }
            })
            startTicker()
            sendState()
        }, ContextCompat.getMainExecutor(this))
    }

    private fun startTicker() {
        handler.post(object : Runnable {
            override fun run() {
                sendState()
                handler.postDelayed(this, 400)
            }
        })
    }

    private fun sendState() {
        val c = controller ?: return
        val queue = JSONArray()
        for (i in 0 until c.mediaItemCount) {
            val item = c.getMediaItemAt(i)
            queue.put(JSONObject().apply {
                put("id", item.mediaId)
                put("title", item.mediaMetadata.title ?: "")
                put("channel", item.mediaMetadata.artist ?: "")
            })
        }

        val o = JSONObject().apply {
            put("type", "playerState")
            put("positionMs", c.currentPosition)
            put("durationMs", c.duration.coerceAtLeast(0))
            put("isPlaying", c.isPlaying)
            put("state", c.playbackState)
            put("index", c.currentMediaItemIndex)
            put("count", c.mediaItemCount)
            put("hasNext", c.hasNextMediaItem())
            put("hasPrevious", c.hasPreviousMediaItem())
            put("shuffle", c.shuffleModeEnabled)
            put("repeat", c.repeatMode)
            put("speed", c.playbackParameters.speed)
            put("volume", c.volume)
            put("title", c.mediaMetadata.title ?: "")
            put("channel", c.mediaMetadata.artist ?: "")
            put("queue", queue)
        }

        web.postWebMessage(WebMessage(o.toString()), Uri.parse("file:///"))
    }

    private fun sendError(message: String) {
        val o = JSONObject().apply {
            put("type", "playerError")
            put("message", message)
        }
        web.postWebMessage(WebMessage(o.toString()), Uri.parse("file:///"))
    }

    
    fun enterVibePip() {
        if (android.os.Build.VERSION.SDK_INT >= 26) {
            enterPictureInPictureMode(android.app.PictureInPictureParams.Builder().build())
        }
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        if (controller?.isPlaying == true && android.os.Build.VERSION.SDK_INT >= 26) {
            enterVibePip()
        }
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        controller?.release()
        web.destroy()
        super.onDestroy()
    }
}
