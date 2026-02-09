const SUPABASE_URL = 'https://utdqmrwkiamjjyzvperc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xmxNvA68m6V0W7gqZMoo5g_UYGIMn_h';

// Initialize Supabase client
let supabaseClient = null;

if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });
    console.log('Supabase Client Initialized');
} else {
    console.error('Supabase SDK not loaded on window.supabase. Check internet connection or content blockers.');
    // Attempt lazy load fallback? No, simpler to just warn for now.
}

export { supabaseClient };
