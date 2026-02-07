
const SUPABASE_URL = 'https://utdqmrwkiamjjyzvperc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xmxNvA68m6V0W7gqZMoo5g_UYGIMn_h';

// Initialize Supabase client
// We assume 'supabase' is available globally from the CDN script
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export { supabaseClient };
