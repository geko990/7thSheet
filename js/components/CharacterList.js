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
            <!-- Search Bar -->
            <div style="padding: 20px 20px 0;">
                <h2 class="page-title text-left" style="text-align: left; margin-bottom: 15px; border: none; font-size: 1.8rem;">Personaggi</h2>
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
            <div id="edit-modal" class="modal-overlay" style="display: none; align-items: center; justify-content: center; backdrop-filter: blur(2px); z-index: 9999; background: rgba(0,0,0,0.5);">
                <div class="modal-content" style="width: 90%; max-width: 350px; padding: 25px; border: 2px solid var(--accent-gold); box-shadow: 0 10px 40px rgba(0,0,0,0.6); border-radius: 16px; background: var(--bg-paper);">
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

        // FIXED SWIPE COLORS: Split 50/50 to avoid overlap
        return `
            <div class="swipe-container" style="position: relative; margin-bottom: 15px; border-radius: 12px; background: #e0e0e0; overflow: hidden; height: 86px;"> 
                
                <!-- Edit Action (Left Half, Green) -->
                <div style="position: absolute; top: 0; bottom: 0; left: 0; width: 50%; background: var(--accent-green); display: flex; align-items: center; justify-content: flex-start; padding-left: 25px; color: white; font-size: 1.6rem; z-index: 1;">
                    ✏️
                </div>

                <!-- Delete Action (Right Half, Red) -->
                <div style="position: absolute; top: 0; bottom: 0; right: 0; width: 50%; background: var(--accent-red); display: flex; align-items: center; justify-content: flex-end; padding-right: 25px; color: white; font-size: 1.6rem; z-index: 1;">
                    🗑️
                </div>

                <!-- Card Content -->
                <div class="card character-card" data-id="${char.id}" style="position: relative; z-index: 10; display: flex; align-items: center; gap: 15px; padding: 12px; border-radius: 12px; border: 1px solid var(--border-worn); background: #fdfaf5; height: 100%; box-sizing: border-box; transform: translate3d(0,0,0);">
                    <div class="character-avatar" style="width: 60px; height: 60px; border-radius: 12px; flex-shrink: 0; border: 2px solid var(--accent-gold); overflow: hidden; ${imageStyle}">
                        ${content}
                    </div>
                    <div class="character-info" style="flex: 1; overflow: hidden; text-align: left;">
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
                this.attachCardListeners(container.querySelector('#character-list-container'));
            });
        }

        // Modal Listeners
        const modal = container.querySelector('#edit-modal');
        // Click outside to close
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
            let startX = 0;
            let startY = 0;
            let currentTranslate = 0;
            let isDragging = false;
            let isScrolling = false;

            // Click Logic handled via Touchend to avoid conflicts, or native click
            // If we don't preventDefault on touchmove, click should fire.
            // But we do preventDefault on swipe... so we need robustness.

            card.addEventListener('click', (e) => {
                // Native click should work if no swipe happened
                if (!isDragging && Math.abs(currentTranslate) < 5) {
                    this.app.router.navigate(`character/${card.dataset.id}`);
                }
            });

            card.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isDragging = false;
                isScrolling = false;
                card.style.transition = 'none';
            });

            card.addEventListener('touchmove', (e) => {
                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const diffX = currentX - startX;
                const diffY = currentY - startY;

                // Determine if scrolling or swiping
                if (!isDragging && !isScrolling) {
                    if (Math.abs(diffY) > Math.abs(diffX)) {
                        isScrolling = true;
                        // Let native scroll happen (do not preventDefault)
                        return;
                    } else if (Math.abs(diffX) > 10) { // Threshold for swipe start
                        isDragging = true;
                    }
                }

                if (isScrolling) return;

                if (isDragging) {
                    e.preventDefault(); // Prevent scroll while swiping
                    // Limit swipe range
                    if (diffX > 100) currentTranslate = 100; // Right (Edit) limit
                    else if (diffX < -100) currentTranslate = -100; // Left (Delete) limit
                    else currentTranslate = diffX;

                    card.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;
                }
            });

            card.addEventListener('touchend', (e) => {
                card.style.transition = 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);'; // Smooth snap

                if (isDragging) {
                    if (currentTranslate > 80) {
                        // Swipe Right -> Edit
                        card.style.transform = 'translate3d(0, 0, 0)';
                        this.openEditModal(card.dataset.id);
                    } else if (currentTranslate < -80) {
                        // Swipe Left -> Delete
                        card.style.transform = 'translate3d(0, 0, 0)';
                        this.confirmDelete(card.dataset.id);
                    } else {
                        // Snap back
                        card.style.transform = 'translate3d(0, 0, 0)';
                    }
                } else if (!isScrolling) {
                    // Tap detected!
                    // If native click doesn't fire (sometimes happens on weak taps), forcing it here is an option
                    // But usually, if we didn't call preventDefault, click fires.
                    // We only called preventDefault inside 'if(isDragging)'.
                    // So Tap should be safe.
                }

                currentTranslate = 0;
                isDragging = false;
                isScrolling = false;
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
