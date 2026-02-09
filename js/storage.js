/**
 * Storage Manager for 7th Sea Character Sheets
 * Handles all localStorage operations
 */

import { CampaignService } from './services/CampaignService.js';

const STORAGE_KEY = '7thsea_characters';

export const Storage = {
    /**
     * Get all saved characters
     * @returns {Array} Array of character objects
     */
    getCharacters() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading characters:', e);
            return [];
        }
    },

    /**
     * Get a single character by ID
     * @param {string} id - Character ID
     * @returns {Object|null} Character object or null
     */
    getCharacter(id) {
        const characters = this.getCharacters();
        return characters.find(c => c.id === id) || null;
    },

    /**
     * Save a new character or update existing
     * @param {Object} character - Character object
     * @returns {Object} Saved character with ID
     */
    saveCharacter(character) {
        const characters = this.getCharacters();

        if (character.id) {
            // Update existing or Add if not found (but has ID)
            const index = characters.findIndex(c => c.id === character.id);
            if (index !== -1) {
                character.updatedAt = new Date().toISOString();
                characters[index] = character;
            } else {
                // ID exists but not in storage (New with pre-generated ID)
                if (!character.createdAt) character.createdAt = new Date().toISOString();
                character.updatedAt = new Date().toISOString();
                characters.push(character);
            }
        } else {
            // New character (Generate ID)
            character.id = this.generateId();
            character.createdAt = new Date().toISOString();
            character.updatedAt = character.createdAt;
            characters.push(character);
        }

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));

            // Sync with campaigns (Fire and forget)
            CampaignService.syncCharacterToCampaigns(character).catch(err => console.error("Sync error:", err));

            return { success: true, character: character };
        } catch (e) {
            console.error('Storage Error:', e);

            // Handle Quota Exceeded (likely due to image)
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                if (character.image && character.image.length > 1000) {
                    console.warn('Image too large. Retrying without image.');
                    character.image = null;
                    // Character object is referenced in 'characters' array, so modification persists in array
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
                        return { success: true, warning: 'Immagine troppo grande. Personaggio salvato senza immagine.' };
                    } catch (retryErr) {
                        return { success: false, error: 'Memoria piena. Impossibile salvare.' };
                    }
                }
            }
            return { success: false, error: e.message };
        }
    },

    /**
     * Delete a character by ID
     * @param {string} id - Character ID
     */
    deleteCharacter(id) {
        const characters = this.getCharacters();
        const filtered = characters.filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    },

    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Export all data as JSON
     * @returns {string} JSON string
     */
    exportData() {
        return JSON.stringify(this.getCharacters(), null, 2);
    },

    /**
     * Import data from JSON
     * @param {string} jsonString - JSON data
     * @returns {boolean} Success status
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (Array.isArray(data)) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                return true;
            }
            return false;
        } catch (e) {
            console.error('Import error:', e);
            return false;
        }
    }
};
