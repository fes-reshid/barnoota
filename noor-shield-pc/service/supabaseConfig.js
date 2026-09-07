'use strict';

/**
 * Shared Supabase project identity for the cloud-backed pieces of Noor
 * Shield (remote control in cloudSync.js, product-key activation in
 * license.js). Safe to ship in the app — see cloud/schema.sql's top comment
 * for why the anon/publishable key grants no more than any anonymous
 * visitor already has; real access control lives in the database itself.
 */

const SUPABASE_URL = 'https://wjqxbjcmcrjgxnxcowxp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_J-N2ozRX6Rnk1-MI66ORGg_QXG3zJhV';

module.exports = { SUPABASE_URL, SUPABASE_ANON_KEY };
