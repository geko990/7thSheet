
import { supabaseClient } from './SupabaseClient.js';

export const AuthService = {
    user: null,

    async init() {
        if (!supabaseClient) {
            console.error('AuthService: Supabase client missing');
            return;
        }

        try {
            // Get initial session
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error) console.warn('AuthService Init Error:', error);

            this.user = session?.user || null;
            console.log('AuthService Initialized. User:', this.user ? this.user.email : 'None');

            // Listen for changes
            supabaseClient.auth.onAuthStateChange((event, session) => {
                console.log('AuthService: Auth State Change:', event, session?.user?.email);
                this.user = session?.user || null;
                window.dispatchEvent(new CustomEvent('auth:change', { detail: this.user }));
            });
        } catch (e) {
            console.error('AuthService Init Exception:', e);
        }
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

        if (data?.session?.user) {
            this.user = data.session.user;
            window.dispatchEvent(new CustomEvent('auth:change', { detail: this.user }));
        }

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
