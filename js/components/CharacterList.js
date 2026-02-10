import { Storage } from '../storage.js';

export default class CharacterList {
    constructor(app) {
        this.app = app;
    }

    async render() {
        const characters = Storage.getCharacters();
        const div = document.createElement('div');
        div.className = 'character-list-page';

        // CSS Styles
        const style = document.createElement('style');
        style.innerHTML = `
            .clean-select {
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
                text-align-last: center;
                background-image: none;
            }
            .center-input {
                text-align: center;
            }
            .modal-grid {
                display: grid;
                grid-template-columns: 80px 1fr;
                gap: 15px;
                align-items: center;
            }
            .modal-grid label {
                font-weight: bold;
                color: var(--text-faded);
                text-align: right;
                font-size: 0.9rem;
            }
        `;
        div.appendChild(style);

        div.innerHTML += `
            <!-- Search Bar (Hidden) -->
            <div style="padding: 20px 20px 0; display: none;">
                <h2 class="page-title text-left" style="text-align: left; margin-bottom: 15px; border: none; font-size: 1.8rem;">Personaggi</h2>
                <div class="search-bar" style="position: relative;">
                    <span style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); font-size: 1.2rem; opacity: 0.5;">🔍</span>
                    <input type="text" id="char-search" placeholder="Cerca personaggio..." 
                           style="width: 100%; padding: 12px 15px 12px 45px; border-radius: 8px; border: 1px solid var(--border-worn); background: rgba(255,255,255,0.5);">
                </div>
            </div>

            <!-- List -->
            <div class="character-list" id="character-list-container" style="padding: 20px; padding-bottom: 100px; overflow-x: hidden;">
                ${this.renderList(characters)}
            </div>

            <!-- FAB Create Button -->
            <div class="fab-container" style="position: fixed; bottom: 80px; left: 0; width: 100%; display: flex; justify-content: center; z-index: 90; pointer-events: none;">
                <button class="btn-fab" id="btn-create-new" style="pointer-events: auto;">
                    <span>✨</span> Nuovo Personaggio
                </button>
            </div>
            
             <!-- Edit Modal -->
            <div id="edit-modal" class="modal-overlay" style="display: none; align-items: center; justify-content: center; backdrop-filter: blur(2px); z-index: 9999; background: rgba(0,0,0,0.4);">
                <!-- Modal Content: Solid Background (Parchment/Card Color) -->
                <div class="modal-content" style="width: 90%; max-width: 350px; padding: 25px; border: 2px solid var(--accent-gold); box-shadow: 0 10px 40px rgba(0,0,0,0.6); border-radius: 16px; background: #fdfaf5; opacity: 1;">
                    <h3 style="text-align: center; margin-bottom: 25px; font-family: var(--font-display); color: var(--accent-gold); font-size: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">Modifica Profilo</h3>
                    
                    <form id="edit-form" class="modal-grid">
                        <input type="hidden" id="edit-id">
                        
                        <label>Nome</label>
                        <input type="text" id="edit-name" class="input-field center-input" required>

                        <label>Concetto</label>
                        <input type="text" id="edit-concept" class="input-field center-input">

                        <label>Nazione</label>
                        <select id="edit-nation" class="input-field clean-select">
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

                        <label>Religione</label>
                        <input type="text" id="edit-religion" class="input-field center-input">

                        <label>Virtù</label>
                        <input type="text" id="edit-virtue" class="input-field center-input" placeholder="Es. Coraggio">

                        <label>Hubris</label>
                        <input type="text" id="edit-hubris" class="input-field center-input" placeholder="Es. Arroganza">

                        <label>Arcano</label>
                        <input type="text" id="edit-arcana" class="input-field center-input" placeholder="Es: Il Folle">
                    
                        <div style="grid-column: 1 / -1; margin-top: 20px; text-align: center;">
                            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px;">Salva</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        setTimeout(() => this.attachListeners(div, characters), 0);
        return div;
    }

    renderList(characters) {
        const bgHtml = `
            <div class="fixed-char-bg" style="position: absolute; bottom: 55px; left: 50%; transform: translateX(-50%); width: 100%; max-width: 500px; z-index: 0; pointer-events: none; opacity: 0.5;">
                <img src="assets/empty_characters_transparent.png?v=0.9.25" alt="" style="width: 100%;">
            </div>
        `;

        const bgLayer = document.getElementById('app-background-layer');

        if (characters.length === 0) {
            if (bgLayer) bgLayer.innerHTML = bgHtml;
            return `
                <div class="empty-state" style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; min-height: 400px; overflow: hidden; text-align: center; color: var(--text-faded); padding-bottom: 0;">
                    <div style="margin-bottom: auto; margin-top: 100px;">
                        <h3 style="font-family: var(--font-display); color: var(--accent-gold); margin-bottom: 10px; font-size: 1.5rem;">Nessun Personaggio</h3>
                        <p style="font-size: 1.1rem;">Il tuo equipaggio è ancora vuoto.<br>Crea il tuo primo eroe!</p>
                    </div>
                </div>
            `;
        }

        if (bgLayer) bgLayer.innerHTML = ''; // Clear background if we have characters

        // If characters exist, we still want the background!
        // We prepend the list with the background (or append).
        // Since it's fixed position, order doesn't matter much for layout, but z-index does.
        return bgHtml + characters.map(char => this.renderCharacterCard(char)).join('');
    }

    renderCharacterCard(char) {
        const nationEmoji = this.getNationEmoji(char.nation);
        let details = char.nation || 'Apolide';
        if (char.religion) details += ` • ${char.religion}`;

        const imageStyle = char.image ?
            `background-image: url('${char.image}'); background-size: cover; background-position: center;` :
            `display: flex; align-items: center; justify-content: center; font-size: 1.5rem; background: var(--accent-navy); color: white;`;

        const content = char.image ? '' : nationEmoji;

        // NO SWIPE - Box removed
        return `
            <div class="card character-card" data-id="${char.id}" style="position: relative; margin-bottom: 12px; display: flex; align-items: center; gap: 15px; padding: 12px; border-radius: 8px; border: 1px solid var(--border-worn); background: #fdfaf5; box-shadow: 0 2px 5px rgba(0,0,0,0.05); user-select: none;">
                <div class="character-avatar" style="width: 60px; height: 60px; border-radius: 8px; flex-shrink: 0; border: 2px solid var(--accent-gold); overflow: hidden; ${imageStyle}">
                    ${content}
                </div>
                <div class="character-info" style="flex: 1; overflow: hidden; text-align: left;">
                    <div class="character-name" style="font-weight: 700; font-size: 1.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-ink);">${char.name || 'Senza Nome'}</div>
                    <div class="character-details" style="font-size: 0.85rem; color: var(--text-faded); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">
                        ${details}
                    </div>
                </div>
                <div style="color: var(--text-faded); font-size: 0.8rem;">●●●</div>
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
            if (this.app.startCharacterCreation) {
                this.app.startCharacterCreation();
            } else if (this.app.createNewCharacter) {
                this.app.createNewCharacter();
            } else {
                console.error("No create method found on App");
            }
        });

        // Search
        const searchInput = container.querySelector('#char-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = allCharacters.filter(c => c.name.toLowerCase().includes(term));
                container.querySelector('#character-list-container').innerHTML = this.renderList(filtered);
                this.attachCardListeners(container.querySelector('#character-list-container'));
            });
        }

        // Modal Listeners
        const modal = container.querySelector('#edit-modal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
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
            let timer = null;
            let isLongPress = false;
            let startX, startY;

            // TOUCH EVENTS
            card.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isLongPress = false;

                timer = setTimeout(() => {
                    isLongPress = true;
                    // Trigger Context Menu
                    navigator.vibrate?.(50); // Haptic feedback
                    this.openContextMenu(card.dataset.id);
                }, 500);
            }, { passive: true });

            card.addEventListener('touchmove', (e) => {
                const diffX = Math.abs(e.touches[0].clientX - startX);
                const diffY = Math.abs(e.touches[0].clientY - startY);
                if (diffX > 10 || diffY > 10) {
                    clearTimeout(timer); // Cancel if moved
                }
            }, { passive: true });

            card.addEventListener('touchend', (e) => {
                clearTimeout(timer);
                if (isLongPress) {
                    e.preventDefault(); // Prevent click handling
                }
            });

            // CLICK (Short Press)
            card.addEventListener('click', (e) => {
                if (isLongPress) return; // Ignore acts as click after long press sometimes
                // Regular OPEN
                if (this.app.viewCharacter) {
                    this.app.viewCharacter(card.dataset.id);
                } else {
                    this.app.router.navigate('character-sheet', { id: card.dataset.id });
                }
            });

            // CONTEXT MENU (Right Click on Desktop)
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.openContextMenu(card.dataset.id);
            });
        });
    }

    openContextMenu(id) {
        // Simple Context Menu Modal
        const existingMenu = document.getElementById('ctx-menu-modal');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.id = 'ctx-menu-modal';
        menu.className = 'modal-overlay';
        menu.style.display = 'flex';
        menu.style.alignItems = 'center'; // Center vertically
        menu.style.justifyContent = 'center'; // Center horizontally
        menu.style.background = 'rgba(0,0,0,0.6)'; // Darker overlay
        menu.style.zIndex = '10000';
        menu.style.backdropFilter = 'blur(2px)';

        // Modal Content - Centered Card
        menu.innerHTML = `
            <div class="modal-content" style="width: 90%; max-width: 320px; background: #fdfaf5; border-radius: 16px; padding: 25px; text-align: center; border: 2px solid var(--accent-gold); box-shadow: 0 10px 40px rgba(0,0,0,0.5); transform: scale(0.9); animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;">
                <h3 style="margin-bottom: 20px; font-family: var(--font-display); font-size: 1.5rem; color: var(--accent-navy);">Opzioni Personaggio</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button class="btn btn-primary" id="ctx-open" style="width: 100%; padding: 12px;">📜 Apri Scheda</button>
                    <button class="btn btn-secondary" id="ctx-edit" style="width: 100%; padding: 12px;">✏️ Modifica Dati</button>
                    <button class="btn btn-secondary" id="ctx-delete" style="width: 100%; padding: 12px; color: var(--accent-red); border-color: var(--accent-red);">🗑️ Elimina</button>
                    <button class="btn btn-secondary" id="ctx-cancel" style="width: 100%; padding: 12px; margin-top: 5px;">Annulla</button>
                </div>
            </div>
            <style>
                @keyframes popIn { to { transform: scale(1); } }
            </style>
        `;

        document.body.appendChild(menu);

        // Listeners
        menu.querySelector('#ctx-open').onclick = () => {
            menu.remove();
            if (this.app.viewCharacter) this.app.viewCharacter(id);
        };

        menu.querySelector('#ctx-edit').onclick = () => {
            menu.remove();
            this.openEditModal(id);
        };

        menu.querySelector('#ctx-delete').onclick = () => {
            menu.remove();
            this.confirmDelete(id);
        };

        menu.querySelector('#ctx-cancel').onclick = () => {
            menu.remove();
        };

        menu.onclick = (e) => {
            if (e.target === menu) menu.remove();
        };
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
        modal.querySelector('#edit-virtue').value = char.virtue || '';
        modal.querySelector('#edit-hubris').value = char.hubris || '';
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
            char.virtue = modal.querySelector('#edit-virtue').value;
            char.hubris = modal.querySelector('#edit-hubris').value;
            char.arcana = modal.querySelector('#edit-arcana').value;

            Storage.saveCharacter(char);
            this.render().then(newDiv => {
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
