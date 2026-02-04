/**
 * Storage Manager for 7th Sea Character Sheets
 * Handles all localStorage operations
 */

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
            // Update existing
            const index = characters.findIndex(c => c.id === character.id);
            if (index !== -1) {
                character.updatedAt = new Date().toISOString();
                characters[index] = character;
            }
        } else {
            // New character
            character.id = this.generateId();
            character.createdAt = new Date().toISOString();
            character.updatedAt = character.createdAt;
            characters.push(character);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
        return character;
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
