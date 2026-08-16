
package com.vibetube.app

import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.LibraryResult
import androidx.media3.session.MediaLibraryService
import androidx.media3.session.MediaLibrarySession
import androidx.media3.session.MediaSession
import androidx.media3.session.SessionResult
import com.google.common.collect.ImmutableList
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture

class PlaybackService : MediaLibraryService() {
    private lateinit var player: ExoPlayer
    private var librarySession: MediaLibrarySession? = null
    private lateinit var store: PlaybackStateStore

    private val demoItems = listOf(
        MediaItem.Builder().setMediaId("1").setUri("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4")
            .setMediaMetadata(MediaMetadata.Builder().setTitle("Paisagem cinematográfica").setArtist("Vibe Studio").build()).build(),
        MediaItem.Builder().setMediaId("2").setUri("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4")
            .setMediaMetadata(MediaMetadata.Builder().setTitle("Natureza em movimento").setArtist("Vídeos Demo").build()).build(),
        MediaItem.Builder().setMediaId("3").setUri("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4")
            .setMediaMetadata(MediaMetadata.Builder().setTitle("Experiência de vídeo HTML5").setArtist("Web Lab").build()).build()
    )

    override fun onCreate() {
        super.onCreate()
        store = PlaybackStateStore(this)
        player = ExoPlayer.Builder(this)
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                    .setUsage(C.USAGE_MEDIA).build(), true
            )
            .setHandleAudioBecomingNoisy(true)
            .build()

        librarySession = MediaLibrarySession.Builder(this, player, object : MediaLibrarySession.Callback {
            override fun onGetLibraryRoot(
                session: MediaLibrarySession,
                browser: MediaSession.ControllerInfo,
                params: MediaLibraryService.LibraryParams?
            ): ListenableFuture<LibraryResult<MediaItem>> {
                val root = MediaItem.Builder()
                    .setMediaId("root")
                    .setMediaMetadata(
                        MediaMetadata.Builder()
                            .setTitle("VibeTube")
                            .setIsBrowsable(true)
                            .setIsPlayable(false)
                            .build()
                    ).build()
                return Futures.immediateFuture(LibraryResult.ofItem(root, params))
            }

            override fun onGetChildren(
                session: MediaLibrarySession,
                browser: MediaSession.ControllerInfo,
                parentId: String,
                page: Int,
                pageSize: Int,
                params: MediaLibraryService.LibraryParams?
            ): ListenableFuture<LibraryResult<ImmutableList<MediaItem>>> {
                val items = when (parentId) {
                    "root" -> listOf(
                        browsable("library", "Biblioteca"),
                        browsable("history", "Histórico"),
                        browsable("playlists", "Playlists")
                    )
                    "library" -> demoItems
                    "history" -> demoItems.take(2)
                    "playlists" -> listOf(browsable("playlist:demo", "Minha playlist"))
                    "playlist:demo" -> demoItems
                    else -> emptyList()
                }
                return Futures.immediateFuture(LibraryResult.ofItemList(ImmutableList.copyOf(items), params))
            }

            override fun onSearch(
                session: MediaLibrarySession,
                browser: MediaSession.ControllerInfo,
                query: String,
                params: MediaLibraryService.LibraryParams?
            ): ListenableFuture<LibraryResult<ImmutableList<MediaItem>>> {
                val q = query.lowercase()
                val found = demoItems.filter {
                    "${it.mediaMetadata.title} ${it.mediaMetadata.artist}".lowercase().contains(q)
                }
                return Futures.immediateFuture(LibraryResult.ofItemList(ImmutableList.copyOf(found), params))
            }
        }).build()

        restoreState()
    }

    private fun browsable(id: String, title: String) = MediaItem.Builder()
        .setMediaId(id)
        .setMediaMetadata(MediaMetadata.Builder().setTitle(title).setIsBrowsable(true).setIsPlayable(false).build())
        .build()

    private fun restoreState() {
        val saved = store.load() ?: return
        try {
            val arr = org.json.JSONArray(saved.queueJson)
            val items = mutableListOf<MediaItem>()
            for (i in 0 until arr.length()) {
                val o = arr.getJSONObject(i)
                items += MediaItem.Builder().setMediaId(o.optString("id")).setUri(o.getString("url"))
                    .setMediaMetadata(MediaMetadata.Builder().setTitle(o.optString("title")).setArtist(o.optString("channel")).build()).build()
            }
            if (items.isNotEmpty()) {
                player.setMediaItems(items, saved.index.coerceIn(0, items.lastIndex), saved.positionMs)
                player.prepare()
                if (saved.isPlaying) player.play()
            }
        } catch (_: Exception) {}
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaLibrarySession? = librarySession

    override fun onTaskRemoved(rootIntent: android.content.Intent?) {
        saveState()
        super.onTaskRemoved(rootIntent)
    }

    private fun saveState() {
        val queue = org.json.JSONArray()
        for (i in 0 until player.mediaItemCount) {
            val item = player.getMediaItemAt(i)
            queue.put(org.json.JSONObject().apply {
                put("id", item.mediaId)
                put("url", item.localConfiguration?.uri.toString())
                put("title", item.mediaMetadata.title ?: "")
                put("channel", item.mediaMetadata.artist ?: "")
            })
        }
        if (queue.length() > 0) store.save(player.currentPosition, player.currentMediaItemIndex, queue, player.isPlaying)
    }

    override fun onDestroy() {
        saveState()
        librarySession?.release()
        player.release()
        librarySession = null
        super.onDestroy()
    }
}
