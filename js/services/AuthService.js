
import { supabaseClient } from './SupabaseClient.js';

export const AuthService = {
    user: null,

    async init() {
        if (!supabaseClient) return;

        // Get initial session
        const { data: { session } } = await supabaseClient.auth.getSession();
        this.user = session?.user || null;

        // Listen for changes
        supabaseClient.auth.onAuthStateChange((_event, session) => {
            this.user = session?.user || null;
            // Dispatch event for UI updates
            window.dispatchEvent(new CustomEvent('auth:change', { detail: this.user }));
        });
    },

    async signUp(email, password, username) {
        if (!supabaseClient) return { error: { message: 'Supabase not configured' } };

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                    avatar_url: ''
                }
            }
        });
        return { data, error };
    },

    async signIn(email, password) {
        if (!supabaseClient) return { error: { message: 'Supabase not configured' } };

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
    },

    async signOut() {
        if (!supabaseClient) return;
        const { error } = await supabaseClient.auth.signOut();
        return { error };
    },

    async resetPasswordForEmail(email) {
        if (!supabaseClient) return { error: { message: 'Supabase not configured' } };
        const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '?reset_password=true',
        });
        return { data, error };
    },

    getUser() {
        return this.user;
    }
};
