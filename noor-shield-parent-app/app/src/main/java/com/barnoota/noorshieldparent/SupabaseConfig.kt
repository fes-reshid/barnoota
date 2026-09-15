package com.barnoota.noorshieldparent

/**
 * Same Supabase project the PC app and web dashboard use (see
 * noor-shield-pc/service/supabaseConfig.js and cloud/schema.sql) — one
 * shared backend behind the Windows app, the web dashboard, and this phone
 * app. Safe to ship: the anon/publishable key grants no more than any
 * anonymous visitor already has; real access control lives in Supabase's
 * Row Level Security and the device_secret checks inside each
 * SECURITY DEFINER function, not in keeping this key secret.
 */
object SupabaseConfig {
    const val URL = "https://wjqxbjcmcrjgxnxcowxp.supabase.co"
    const val ANON_KEY = "sb_publishable_J-N2ozRX6Rnk1-MI66ORGg_QXG3zJhV"
}
