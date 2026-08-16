
package com.vibetube.app

import android.content.Context
import androidx.work.*
import java.util.concurrent.TimeUnit

class SyncScheduler {
    companion object {
        fun schedule(context: Context) {
            val request=PeriodicWorkRequestBuilder<SyncWorker>(15,TimeUnit.MINUTES)
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build()
                ).build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "vibetube-sync", ExistingPeriodicWorkPolicy.UPDATE, request
            )
        }
    }
}

class SyncWorker(ctx: Context, params: WorkerParameters): CoroutineWorker(ctx,params) {
    override suspend fun doWork(): Result {
        // Sync is intentionally server-driven through the Web/API layer.
        // This worker provides retryable scheduling without storing account secrets.
        return Result.success()
    }
}
