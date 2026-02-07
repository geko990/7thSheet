
import { supabaseClient } from './SupabaseClient.js';
import { AuthService } from './AuthService.js';

export const CampaignService = {

    // Create a new campaign (GM Role)
    async createCampaign(title) {
        const user = AuthService.getUser();
        if (!user) return { error: { message: 'Not logged in' } };

        const { data, error } = await supabaseClient
            .from('campaigns')
            .insert([{ gm_id: user.id, title: title }])
            .select()
            .single();

        if (error) return { error };

        // Auto-add GM as member
        const { error: memberError } = await supabaseClient
            .from('campaign_members')
            .insert([{
                campaign_id: data.id,
                user_id: user.id,
                role: 'gm'
            }]);

        if (memberError) return { error: memberError };
        return { data };
    },

    // Join a campaign via code (Player Role)
    async joinCampaign(code) {
        const user = AuthService.getUser();
        if (!user) return { error: { message: 'Not logged in' } };

        // 1. Find campaign by code
        const { data: campaign, error: findError } = await supabaseClient
            .from('campaigns')
            .select('id, title, gm_id')
            .eq('join_code', code)
            .single();

        if (findError || !campaign) return { error: { message: 'Codice non valido o campagna non trovata.' } };

        // 2. Check if already member
        const { data: existing } = await supabaseClient
            .from('campaign_members')
            .select('id')
            .eq('campaign_id', campaign.id)
            .eq('user_id', user.id)
            .single();

        if (existing) return { error: { message: 'Sei già in questa campagna.' } };

        // 3. Add member
        const { error: joinError } = await supabaseClient
            .from('campaign_members')
            .insert([{
                campaign_id: campaign.id,
                user_id: user.id,
                role: 'player'
            }]);

        return { data: campaign, error: joinError };
    },

    // Get my campaigns
    async getMyCampaigns() {
        const user = AuthService.getUser();
        if (!user) return { data: [] };

        const { data, error } = await supabaseClient
            .from('campaign_members')
            .select(`
                role,
                campaign:campaigns (
                    id, title, description, join_code, gm_id
                )
            `)
            .eq('user_id', user.id);

        if (error) return { error, data: [] };

        // Flatten structure
        return {
            data: data.map(item => ({
                ...item.campaign,
                my_role: item.role
            }))
        };
    }
};
