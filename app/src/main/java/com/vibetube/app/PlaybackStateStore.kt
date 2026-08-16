
package com.vibetube.app

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

data class SavedPlayback(
    val positionMs: Long,
    val index: Int,
    val queueJson: String,
    val isPlaying: Boolean
)

class PlaybackStateStore(context: Context) {
    private val prefs = context.getSharedPreferences("vibetube_playback", Context.MODE_PRIVATE)

    fun save(positionMs: Long, index: Int, queue: JSONArray, isPlaying: Boolean) {
        prefs.edit()
            .putLong("position", positionMs)
            .putInt("index", index)
            .putString("queue", queue.toString())
            .putBoolean("playing", isPlaying)
            .apply()
    }

    fun load(): SavedPlayback? {
        val queue = prefs.getString("queue", null) ?: return null
        if (queue == "[]") return null
        return SavedPlayback(
            prefs.getLong("position", 0L),
            prefs.getInt("index", 0),
            queue,
            prefs.getBoolean("playing", false)
        )
    }

    fun clear() = prefs.edit().clear().apply()
}
