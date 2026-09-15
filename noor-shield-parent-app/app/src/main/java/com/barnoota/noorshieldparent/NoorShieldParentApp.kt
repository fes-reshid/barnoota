package com.barnoota.noorshieldparent

import android.app.Application
import com.barnoota.noorshieldparent.data.SessionStore
import com.barnoota.noorshieldparent.network.SupabaseClient

class NoorShieldParentApp : Application() {
    lateinit var sessionStore: SessionStore
        private set
    lateinit var supabase: SupabaseClient
        private set

    override fun onCreate() {
        super.onCreate()
        sessionStore = SessionStore(this)
        supabase = SupabaseClient(sessionStore)
    }
}
