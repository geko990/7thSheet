import { Storage } from '../storage.js';

export default class CharacterList {
    constructor(app) {
        this.app = app;
        this.swipeState = { startX: 0, currentX: 0, activeCard: null };
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
            <div class="character-list" id="character-list-container" style="padding: 20px; padding-bottom: 100px; overflow-x: hidden;">
                ${this.renderList(characters)}
            </div>

            <!-- FAB Create Button -->
            <div class="fab-container">
                <button class="btn-fab" id="btn-create-new">
                    <span>✨</span> Nuovo Personaggio
                </button>
            </div>
            
             <!-- Edit Modal -->
            <div id="edit-modal" class="modal-overlay" style="display: none;">
                <div class="modal-content">
                    <h3>Modifica Profilo</h3>
                    <form id="edit-form">
                        <input type="hidden" id="edit-id">
                        <div class="form-group">
                            <label>Nome</label>
                            <input type="text" id="edit-name" class="input-field" required>
                        </div>
                         <div class="form-group">
                            <label>Concetto</label>
                            <input type="text" id="edit-concept" class="input-field">
                        </div>
                        <div class="form-group">
                            <label>Nazione</label>
                             <select id="edit-nation" class="input-field">
                                <option value="Avalon">Avalon</option>
                                <option value="Castille">Castille</option>
                                <option value="Eisen">Eisen</option>
                                <option value="Montaigne">Montaigne</option>
                                <option value="Sarmatia">Sarmatia</option>
                                <option value="Ussura">Ussura</option>
                                <option value="Vestenmennavenjar">Vestenmennavenjar</option>
                                <option value="Vodacce">Vodacce</option>
                                <option value="La Bucca">La Bucca</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Religione</label>
                            <input type="text" id="edit-religion" class="input-field">
                        </div>
                        <div class="form-group">
                           <label>Arcano (Virtù/Hubris)</label>
                           <input type="text" id="edit-arcana" class="input-field" placeholder="Es: Il Folle">
                       </div>
                    
                        <div style="display: flex; gap: 10px; margin-top: 20px;">
                            <button type="button" class="btn btn-secondary" id="btn-cancel-edit" style="flex: 1;">Annulla</button>
                            <button type="submit" class="btn btn-primary" style="flex: 1;">Salva</button>
                        </div>
                    </form>
                </div>
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
        let details = `Liv. ${char.level || 1} • ${char.nation || 'Apolide'}`;
        if (char.religion) details += ` • ${char.religion}`;

        const imageStyle = char.image ?
            `background-image: url('${char.image}'); background-size: cover; background-position: center;` :
            `display: flex; align-items: center; justify-content: center; font-size: 1.5rem; background: var(--accent-navy); color: white;`;

        const content = char.image ? '' : nationEmoji;

        // Swipe container structure
        return `
            <div class="swipe-container" style="position: relative; margin-bottom: 15px; border-radius: 12px; overflow: hidden;">
                <!-- Background Actions -->
                <div class="swipe-action action-left" style="position: absolute; top: 0; bottom: 0; left: 0; width: 100%; background: var(--accent-blue); display: flex; align-items: center; padding-left: 20px; color: white; font-weight: bold; z-index: 1;">
                    ✏️ Modifica
                </div>
                <div class="swipe-action action-right" style="position: absolute; top: 0; bottom: 0; right: 0; width: 100%; background: var(--accent-red); display: flex; align-items: center; justify-content: flex-end; padding-right: 20px; color: white; font-weight: bold; z-index: 1;">
                    🗑️ Elimina
                </div>

                <!-- Card Content -->
                <div class="card character-card" data-id="${char.id}" style="position: relative; z-index: 2; display: flex; align-items: center; gap: 15px; padding: 12px; border-radius: 12px; border: 1px solid var(--border-worn); background: rgba(255, 255, 255, 0.95); transition: transform 0.2s ease-out;">
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
        if (btnCreate) btnCreate.addEventListener('click', () => {
            if (confirm("Creare un nuovo personaggio?")) {
                this.app.createNewCharacter();
            }
        });

        // Search
        const searchInput = container.querySelector('#char-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = allCharacters.filter(c => c.name.toLowerCase().includes(term));
                container.querySelector('#character-list-container').innerHTML = this.renderList(filtered);
                // Re-attach listeners for filtered items?
                // For simplicity, we just won't attach swipe listeners to filtered results yet,
                // or we'd need to extract attachCardListeners. 
                // Let's extract it.
                this.attachCardListeners(container.querySelector('#character-list-container'));
            });
        }

        // Modal Listeners
        const modal = container.querySelector('#edit-modal');
        container.querySelector('#btn-cancel-edit').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        container.querySelector('#edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEdit(modal);
        });

        this.attachCardListeners(container.querySelector('#character-list-container'));
    }

    attachCardListeners(listContainer) {
        const cards = listContainer.querySelectorAll('.character-card');

        cards.forEach(card => {
            // Click to Navigate (if not swiping)
            card.addEventListener('click', () => {
                if (!card.classList.contains('swiped')) {
                    this.app.router.navigate(`character/${card.dataset.id}`);
                }
            });

            // Swipe Logic
            let startX = 0;
            let currentTranslate = 0;
            let isDragging = false;

            card.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
                card.style.transition = 'none';
            });

            card.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                const currentX = e.touches[0].clientX;
                const diff = currentX - startX;

                // Limit swipe range
                if (diff > 100) currentTranslate = 100; // Right (Edit)
                else if (diff < -100) currentTranslate = -100; // Left (Delete)
                else currentTranslate = diff;

                card.style.transform = `translateX(${currentTranslate}px)`;
            });

            card.addEventListener('touchend', (e) => {
                isDragging = false;
                card.style.transition = 'transform 0.2s ease-out';

                if (currentTranslate > 80) {
                    // Swipe Right -> Edit
                    // Reset position first
                    card.style.transform = 'translateX(0)';
                    this.openEditModal(card.dataset.id);
                } else if (currentTranslate < -80) {
                    // Swipe Left -> Delete
                    card.style.transform = 'translateX(0)';
                    this.confirmDelete(card.dataset.id);
                } else {
                    // Reset
                    card.style.transform = 'translateX(0)';
                }
                currentTranslate = 0;
            });
        });
    }

    openEditModal(id) {
        const char = Storage.getCharacter(id);
        if (!char) return;

        const modal = document.querySelector('#edit-modal');
        modal.querySelector('#edit-id').value = char.id;
        modal.querySelector('#edit-name').value = char.name;
        modal.querySelector('#edit-concept').value = char.concept || '';
        modal.querySelector('#edit-nation').value = char.nation || 'Avalon';
        modal.querySelector('#edit-religion').value = char.religion || '';
        modal.querySelector('#edit-arcana').value = char.arcana || '';

        modal.style.display = 'flex';
    }

    saveEdit(modal) {
        const id = modal.querySelector('#edit-id').value;
        const char = Storage.getCharacter(id);
        if (char) {
            char.name = modal.querySelector('#edit-name').value;
            char.concept = modal.querySelector('#edit-concept').value;
            char.nation = modal.querySelector('#edit-nation').value;
            char.religion = modal.querySelector('#edit-religion').value;
            char.arcana = modal.querySelector('#edit-arcana').value; // if we had this field

            Storage.saveCharacter(char);
            this.render().then(newDiv => {
                // Re-render whole page to refresh list
                const main = document.getElementById('main-content');
                main.innerHTML = '';
                main.appendChild(newDiv);
            });
        }
        modal.style.display = 'none';
    }

    confirmDelete(id) {
        if (confirm("Sei sicuro di voler eliminare questo personaggio?")) {
            Storage.deleteCharacter(id);
            this.render().then(newDiv => {
                const main = document.getElementById('main-content');
                main.innerHTML = '';
                main.appendChild(newDiv);
            });
        }
    }
}
