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
        div.className = 'character-list-page';

        div.innerHTML = `
            <!-- Search Bar -->
            <div style="padding: 20px 20px 0;">
                <h2 class="page-title text-left" style="text-align: left; margin-bottom: 10px; border: none; font-size: 1.8rem;">Personaggi</h2>
                <div class="search-bar" style="position: relative;">
                    <span style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); font-size: 1.2rem; opacity: 0.5;">🔍</span>
                    <input type="text" id="char-search" placeholder="Cerca personaggio..." 
                           style="width: 100%; padding: 12px 15px 12px 45px; border-radius: 12px; border: 1px solid var(--border-worn); background: rgba(255,255,255,0.5);">
                </div>
            </div>

            <!-- List -->
            <div class="character-list" id="character-list-container" style="padding: 20px; padding-bottom: 100px;">
                ${this.renderList(characters)}
            </div>

            <!-- FAB Create Button -->
            <div class="fab-container">
                <button class="btn-fab" id="btn-create-new">
                    <span>✨</span> Nuovo Personaggio
                </button>
            </div>
        `;

        setTimeout(() => this.attachListeners(div, characters), 0);
        return div;
    }

    renderList(characters) {
        if (characters.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">⚓</div>
                    <p class="empty-state-text">Nessun personaggio trovato.</p>
                </div>
            `;
        }
        return characters.map(char => this.renderCharacterCard(char)).join('');
    }

    renderCharacterCard(char) {
        const nationEmoji = this.getNationEmoji(char.nation);

        // Build details string: "Liv. X • Nazione" + maybe " • Fede"
        let details = `Liv. ${char.level || 1} • ${char.nation || 'Apolide'}`;

        if (char.religion) {
            details += ` • ${char.religion}`;
        }

        const imageStyle = char.image ?
            `background-image: url('${char.image}'); background-size: cover; background-position: center;` :
            `display: flex; align-items: center; justify-content: center; font-size: 1.5rem; background: var(--accent-navy); color: white;`;

        const content = char.image ? '' : nationEmoji;

        return `
            <div class="card character-card" data-id="${char.id}" style="display: flex; align-items: center; gap: 15px; padding: 12px; border-radius: 12px; border: 1px solid var(--border-worn); background: rgba(255, 255, 255, 0.6); margin-bottom: 12px;">
                <div class="character-avatar" style="width: 60px; height: 60px; border-radius: 12px; flex-shrink: 0; border: 2px solid var(--accent-gold); overflow: hidden; ${imageStyle}">
                    ${content}
                </div>
                <div class="character-info" style="flex: 1; overflow: hidden;">
                    <div class="character-name" style="font-weight: 700; font-size: 1.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-ink);">${char.name || 'Senza Nome'}</div>
                    <div class="character-details" style="font-size: 0.85rem; color: var(--text-faded); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">
                        ${details}
                    </div>
                </div>
                <div style="color: var(--accent-gold); font-size: 1.2rem;">›</div>
            </div>
        `;
    }

    getNationEmoji(nation) {
        const emojis = {
            'Avalon': '🦁', 'Castille': '🌹', 'Montaigne': '⚜️', 'Ussura': '🐻',
            'Vodacce': '🎭', 'Eisen': '⚔️', 'Vestenmennavenjar': '⚡', 'Sarmatia': '🦅',
            'La Bucca': '🏴‍☠️', 'Numa': '🏛️', 'Aragosta': '🦞'
        };
        return emojis[nation] || '⚓';
    }

    attachListeners(container, allCharacters) {
        // Create Button
        const btnCreate = container.querySelector('#btn-create-new');
        if (btnCreate) {
            btnCreate.addEventListener('click', () => {
                this.app.startCharacterCreation();
            });
        }

        // Search Logic
        const searchInput = container.querySelector('#char-search');
        const listContainer = container.querySelector('#character-list-container');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = allCharacters.filter(c =>
                    (c.name && c.name.toLowerCase().includes(term)) ||
                    (c.nation && c.nation.toLowerCase().includes(term)) ||
                    (c.concept && c.concept.toLowerCase().includes(term))
                );
                listContainer.innerHTML = this.renderList(filtered);
                this.attachCardListeners(listContainer);
            });
        }

        this.attachCardListeners(listContainer);
    }

    attachCardListeners(container) {
        container.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                this.app.viewCharacter(id);
            });
        });
    }
}
