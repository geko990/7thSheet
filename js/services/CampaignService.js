
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
                    id, title, join_code, gm_id
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
    },

    // Get Campaign Details (including members)
    async getCampaignDetails(campaignId) {
        const { data, error } = await supabaseClient
            .from('campaigns')
            .select(`
                *,
                members:campaign_members (
                    user_id, role, character_data,
                    profile:profiles (username, avatar_url)
                )
            `)
            .eq('id', campaignId)
            .single();

        if (error) return { error };
        return { data };
    },

    // STORIES
    async getStories(campaignId) {
        const { data, error } = await supabaseClient
            .from('campaign_stories')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    async addStory(campaignId, title, content, isVisible = false) {
        const { data, error } = await supabaseClient
            .from('campaign_stories')
            .insert([{ campaign_id: campaignId, title, content, is_visible: isVisible }])
            .select()
            .single();
        return { data, error };
    },

    async updateStoryVisibility(storyId, isVisible) {
        const { data, error } = await supabaseClient
            .from('campaign_stories')
            .update({ is_visible: isVisible })
            .eq('id', storyId)
            .select()
            .single();
        return { data, error };
    },

    // NPCS
    async getNPCs(campaignId) {
        const { data, error } = await supabaseClient
            .from('campaign_npcs')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('name', { ascending: true });
        return { data, error };
    },

    async addNPC(campaignId, name, description, isVisible = false) {
        const { data, error } = await supabaseClient
            .from('campaign_npcs')
            .insert([{ campaign_id: campaignId, name, description, is_visible: isVisible }])
            .select()
            .single();
        return { data, error };
    },

    async updateNPCVisibility(npcId, isVisible) {
        const { data, error } = await supabaseClient
            .from('campaign_npcs')
            .update({ is_visible: isVisible })
            .eq('id', npcId)
            .select()
            .single();
        return { data, error };
    },

    // MEMBERS
    async linkCharacter(campaignId, characterData) {
        const user = AuthService.getUser();
        if (!user) return { error: { message: "Not logged in" } };

        const { data, error } = await supabaseClient
            .from('campaign_members')
            .update({ character_data: characterData })
            .match({ campaign_id: campaignId, user_id: user.id })
            .select();

        return { data, error };
    }
};
