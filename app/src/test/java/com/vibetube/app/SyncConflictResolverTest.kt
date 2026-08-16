
package com.vibetube.app

import org.junit.Assert.*
import org.junit.Test

class SyncConflictResolverTest {
    @Test fun newer_server_wins_when_timestamp_is_newer() {
        assertTrue(SyncConflictResolver.newer(20,10))
        assertFalse(SyncConflictResolver.newer(10,20))
    }

    @Test fun merge_chooses_latest_update() {
        val server=SyncEnvelope("a",2,200,"server")
        val client=SyncEnvelope("b",1,100,"client")
        assertEquals("server",SyncConflictResolver.choose(server,client).payload)
    }

    @Test fun explicit_client_policy_works() {
        val server=SyncEnvelope("a",2,200,"server")
        val client=SyncEnvelope("b",1,100,"client")
        assertEquals("client",SyncConflictResolver.choose(server,client,ConflictPolicy.CLIENT_WINS).payload)
    }
}
