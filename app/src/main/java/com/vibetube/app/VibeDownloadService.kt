
package com.vibetube.app

import android.app.Notification
import android.content.Context
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.offline.DownloadManager
import androidx.media3.exoplayer.offline.DownloadRequest
import androidx.media3.exoplayer.offline.DownloadService
import androidx.media3.exoplayer.offline.DownloadNotificationHelper

@UnstableApi
class VibeDownloadService : DownloadService(
    1001,
    DEFAULT_FOREGROUND_NOTIFICATION_UPDATE_INTERVAL,
    "downloads",
    0,
    0
) {
    companion object {
        fun add(context: Context, id: String, uri: String) {
            val request=DownloadRequest.Builder(id, android.net.Uri.parse(uri)).build()
            sendAddDownload(context, VibeDownloadService::class.java, request, false)
        }
        fun remove(context: Context, id: String) =
            sendRemoveDownload(context, VibeDownloadService::class.java, id, false)
    }

    private val manager by lazy {
        DownloadManager(
            applicationContext,
            VibeDatabaseProvider.dataSource(applicationContext),
            VibeDatabaseProvider.cache(applicationContext),
            androidx.media3.exoplayer.upstream.DefaultHttpDataSource.Factory(),
            Runnable::run
        )
    }

    override fun getDownloadManager(): DownloadManager = manager

    override fun getForegroundNotification(
        downloads: MutableList<androidx.media3.exoplayer.offline.Download>,
        notMetRequirements: Int
    ): Notification =
        DownloadNotificationHelper(applicationContext, "downloads")
            .buildProgressNotification(
                applicationContext,
                androidx.media3.ui.R.drawable.exo_notification_small_icon,
                null, "Downloads do VibeTube", downloads
            )
}

@UnstableApi
object VibeDatabaseProvider {
    private var cacheInstance: androidx.media3.datasource.cache.SimpleCache?=null
    fun dataSource(context: Context): androidx.media3.exoplayer.database.DatabaseProvider =
        androidx.media3.database.StandaloneDatabaseProvider(context)
    fun cache(context: Context): androidx.media3.datasource.cache.SimpleCache {
        return cacheInstance ?: synchronized(this) {
            cacheInstance ?: androidx.media3.datasource.cache.SimpleCache(
                java.io.File(context.cacheDir,"media"),
                androidx.media3.datasource.cache.NoOpCacheEvictor(),
                dataSource(context)
            ).also { cacheInstance=it }
        }
    }
}
