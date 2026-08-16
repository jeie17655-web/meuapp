
package com.vibetube.app

import android.content.Context
import androidx.credentials.CredentialManager

class CredentialAuth(context: Context) {
    private val manager = CredentialManager.create(context)

    // v3.6 integration point:
    // 1) request registration/authentication options from the server
    // 2) call CredentialManager.createCredential()/getCredential()
    // 3) send the returned public-key credential to the server
    // 4) receive a normal VibeTube access token
    //
    // The private key remains in the credential provider; the server stores
    // the public key and verifies WebAuthn assertions.
}
