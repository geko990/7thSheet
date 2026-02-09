
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

    // Update Campaign (Title, Image/Banner, etc.)
    async updateCampaign(campaignId, updates) {
        const { data, error } = await supabaseClient
            .from('campaigns')
            .update(updates)
            .eq('id', campaignId)
            .select();
        return { data: data?.[0] || null, error };
    },

    // Delete Campaign
    async deleteCampaign(campaignId) {
        // RLS should handle cascading deletes usually, but good to be safe
        const { error } = await supabaseClient
            .from('campaigns')
            .delete()
            .eq('id', campaignId);
        return { error };
    },

    // Duplicate Campaign (Basic: Copies Title + ' (Copia)', Settings)
    // Does NOT copy stories/npcs/members for simplicity unless requested
    async duplicateCampaign(campaignId) {
        // 1. Get original
        const { data: original, error: getError } = await this.getCampaignDetails(campaignId);
        if (getError) return { error: getError };

        // 2. Create new
        return this.createCampaign(`${original.title} (Copia)`);
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

    async addStory(campaignId, title, content, isVisible = false, imageUrl = null) {
        const { data, error } = await supabaseClient
            .from('campaign_stories')
            .insert([{
                campaign_id: campaignId,
                title,
                content,
                is_visible: isVisible,
                image_url: imageUrl
            }])
            .select()
            .single();
        return { data, error };
    },

    async deleteStory(storyId) {
        const { error } = await supabaseClient
            .from('campaign_stories')
            .delete()
            .eq('id', storyId);
        return { error };
    },


    // ENTITIES (NPC, Enemy, Item)
    async getEntities(campaignId) {
        const { data, error } = await supabaseClient
            .from('campaign_npcs')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('name', { ascending: true });
        return { data, error };
    },

    async addEntity(campaignId, entityData) {
        // entityData: { name, description, is_visible, type, level, nationality, image_url }
        const { data, error } = await supabaseClient
            .from('campaign_npcs')
            .insert([{
                campaign_id: campaignId,
                name: entityData.name,
                description: entityData.description,
                is_visible: entityData.is_visible,
                type: entityData.type || 'npc',
                level: entityData.level,
                nationality: entityData.nationality,
                image_url: entityData.image_url,
                data: entityData.data || {}
            }])
            .select(); // Remove .single() to be robust
        return { data: data?.[0] || null, error };
    },

    async updateEntity(entityId, updates) {
        const { data, error } = await supabaseClient
            .from('campaign_npcs')
            .update(updates)
            .eq('id', entityId)
            .select();
        return { data: data?.[0] || null, error };
    },

    async updateStory(storyId, updates) {
        const { data, error } = await supabaseClient
            .from('campaign_stories')
            .update(updates)
            .eq('id', storyId)
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

    async updateEntityVisibility(entityId, isVisible) {
        const { data, error } = await supabaseClient
            .from('campaign_npcs')
            .update({ is_visible: isVisible })
            .eq('id', entityId)
            .select()
            .single();
        return { data, error };
    },

    async deleteEntity(entityId) {
        const { error } = await supabaseClient
            .from('campaign_npcs')
            .delete()
            .eq('id', entityId);
        return { error };
    },    // MEMBERS
    async linkCharacter(campaignId, characterData) {
        const user = AuthService.getUser();
        if (!user) return { error: { message: "Not logged in" } };

        const { data, error } = await supabaseClient
            .from('campaign_members')
            .update({ character_data: characterData })
            .match({ campaign_id: campaignId, user_id: user.id })
            .select();

        return { data, error };
    },

    async unlinkCharacter(campaignId) {
        const user = AuthService.getUser();
        if (!user) return { error: { message: "Not logged in" } };

        const { data, error } = await supabaseClient
            .from('campaign_members')
            .update({ character_data: null })
            .match({ campaign_id: campaignId, user_id: user.id })
            .select();

        return { data, error };
    },

    async leaveCampaign(campaignId) {
        const user = AuthService.getUser();
        if (!user) return { error: { message: "Not logged in" } };

        const { error } = await supabaseClient
            .from('campaign_members')
            .delete()
            .match({ campaign_id: campaignId, user_id: user.id });

        return { error };
    },

    // IMAGES
    async uploadImage(file) {
        if (!file) return { error: { message: 'Nessun file selezionato' } };

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabaseClient
                .storage
                .from('campaign-images')
                .upload(filePath, file);

            if (uploadError) {
                console.warn("Supabase Storage Error (Bucket not found?):", uploadError);
                throw uploadError; // Trigger fallback
            }

            const { data } = supabaseClient
                .storage
                .from('campaign-images')
                .getPublicUrl(filePath);

            return { publicUrl: data.publicUrl };

        } catch (e) {
            console.warn("Falling back to Base64 image storage due to upload error.");

            // Fallback: Convert to Resized Base64
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 300;
                        const MAX_HEIGHT = 300;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                            }
                        } else {
                            if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Compress to JPEG 0.7
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                        if (dataUrl.length > 1000000) { // Still too big > 1MB?
                            resolve({ error: { message: "Immagine troppo grande anche dopo ridimensionamento." } });
                        } else {
                            resolve({ publicUrl: dataUrl });
                        }
                    };
                    img.src = ev.target.result;
                };
                reader.onerror = () => {
                    resolve({ error: { message: "Errore lettura file locale" } });
                };
                reader.readAsDataURL(file);
            });
        }
    },

    async updateMemberRole(campaignId, userId, newRole) {
        const { error } = await supabaseClient
            .from('campaign_members')
            .update({ role: newRole })
            .match({ campaign_id: campaignId, user_id: userId });

        return { error };
    },

    async removeMember(campaignId, userId) {
        const { error } = await supabaseClient
            .from('campaign_members')
            .delete()
            .match({ campaign_id: campaignId, user_id: userId });

        return { error };
    }
};
