
package com.vibetube.app

data class SyncEnvelope<T>(
    val deviceId: String,
    val version: Long,
    val updatedAt: Long,
    val payload: T
)

enum class ConflictPolicy { SERVER_WINS, CLIENT_WINS, MERGE }

object SyncConflictResolver {
    fun newer(serverUpdatedAt: Long, clientUpdatedAt: Long): Boolean =
        serverUpdatedAt >= clientUpdatedAt

    fun <T> choose(
        server: SyncEnvelope<T>,
        client: SyncEnvelope<T>,
        policy: ConflictPolicy = ConflictPolicy.MERGE
    ): SyncEnvelope<T> = when(policy) {
        ConflictPolicy.SERVER_WINS -> server
        ConflictPolicy.CLIENT_WINS -> client
        ConflictPolicy.MERGE -> if (server.updatedAt >= client.updatedAt) server else client
    }
}
