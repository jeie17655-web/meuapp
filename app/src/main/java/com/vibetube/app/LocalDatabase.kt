
package com.vibetube.app

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "cached_media")
data class CachedMedia(
    @PrimaryKey val id: String,
    val title: String,
    val channel: String,
    val url: String,
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "playback_resume")
data class PlaybackResume(
    @PrimaryKey val profileId: String,
    val mediaId: String,
    val positionMs: Long,
    val index: Int,
    val queueJson: String,
    val updatedAt: Long = System.currentTimeMillis()
)

@Dao
interface MediaDao {
    @Query("SELECT * FROM cached_media ORDER BY updatedAt DESC")
    fun observeCached(): Flow<List<CachedMedia>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertMedia(items: List<CachedMedia>)

    @Query("DELETE FROM cached_media WHERE id=:id")
    suspend fun deleteMedia(id: String)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveResume(state: PlaybackResume)

    @Query("SELECT * FROM playback_resume WHERE profileId=:profileId LIMIT 1")
    suspend fun getResume(profileId: String): PlaybackResume?
}

@Database(entities=[CachedMedia::class,PlaybackResume::class],version=1,exportSchema=false)
abstract class VibeDatabase: RoomDatabase() {
    abstract fun mediaDao(): MediaDao
    companion object {
        @Volatile private var INSTANCE: VibeDatabase?=null
        fun get(context: Context): VibeDatabase =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,VibeDatabase::class.java,"vibetube.db"
                ).build().also { INSTANCE=it }
            }
    }
}
