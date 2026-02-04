import { Storage } from '../storage.js';

/**
 * Character List Component
 * Shows all saved characters with options to view, edit, or delete
 */
export default class CharacterList {
    constructor(app) {
        this.app = app;
    }

    async render() {
        const characters = Storage.getCharacters();
        const div = document.createElement('div');

        if (characters.length === 0) {
            div.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚓</div>
                    <h2 class="empty-state-title">Nessun Personaggio</h2>
                    <p class="empty-state-text">Crea il tuo primo eroe per iniziare l'avventura!</p>
                    <button class="btn btn-primary" id="btn-create-new">
                        ✨ Nuovo Personaggio
                    </button>
                </div>
            `;
        } else {
            div.innerHTML = `
                <h2 class="page-title">I Tuoi Personaggi</h2>
                <div class="character-list" id="character-list">
                    ${characters.map(char => this.renderCharacterCard(char)).join('')}
                </div>
                <div class="text-center mt-20">
                    <button class="btn btn-primary" id="btn-create-new">
                        ✨ Nuovo Personaggio
                    </button>
                </div>
            `;
        }

        setTimeout(() => this.attachListeners(div), 0);
        return div;
    }

    renderCharacterCard(char) {
        const nationEmoji = this.getNationEmoji(char.nation);
        return `
            <div class="card character-card" data-id="${char.id}">
                <div class="character-avatar">${nationEmoji}</div>
                <div class="character-info">
                    <div class="character-name">${char.name || 'Senza Nome'}</div>
                    <div class="character-nation">${char.nation || 'Nazione sconosciuta'}</div>
                </div>
                <span style="font-size: 1.5rem; color: var(--accent-gold);">›</span>
            </div>
        `;
    }

    getNationEmoji(nation) {
        const emojis = {
            'Avalon': '🦁',
            'Castille': '🌹',
            'Montaigne': '⚜️',
            'Ussura': '🐻',
            'Vodacce': '🎭',
            'Eisen': '⚔️',
            'Vestenmennavenjar': '⚡',
            'Sarmatia': '🦅'
        };
        return emojis[nation] || '⚓';
    }

    attachListeners(container) {
        // New character button
        const createBtn = container.querySelector('#btn-create-new');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.app.startCharacterCreation();
            });
        }

        // Character cards
        container.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                this.app.viewCharacter(id);
            });
        });
    }
}
