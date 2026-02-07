import { Storage } from '../storage.js';
import { Dice } from '../dice.js';
import { AuthService } from '../services/AuthService.js';

export default class CharacterSheet {
    constructor(app) {
        this.app = app;
        this.character = null;
        this.dicePool = [];
        this.activeTab = 'sheet'; // sheet, inventory, journal
        this.advantagesData = [];
        this.backgroundsData = [];
        this.itemSwiping = false; // Flag to prevent page swipe during item swipe

        // Italian Skills Map
        this.skillMap = {
            'aim': 'Mira',
            'athletics': 'Atletica',
            'brawl': 'Rissa',
            'convince': 'Convincere',
            'empathy': 'Empatia',
            'hide': 'Furtività',
            'intimidate': 'Intimidire',
            'notice': 'Notare',
            'perform': 'Esibirsi',
            'ride': 'Cavalcare',
            'sailing': 'Navigare',
            'scholarship': 'Istruzione',
            'tempt': 'Allettare',
            'theft': 'Furto',
            'warfare': 'Arte della Guerra',
            'weaponry': 'Mischia'
        };

        this.descriptions = {
            'brawn': 'Forza pura, resistenza fisica e capacità di incassare colpi.',
            'finesse': 'Coordinazione, agilità, precisione manuale.',
            'resolve': 'Volontà, determinazione e resistenza mentale.',
            'wits': 'Intelligenza, prontezza di spirito e capacità deduttiva.',
            'panache': 'Carisma, stile, fascino e capacità di ispirare.',
            'aim': 'Colpire bersagli a distanza con armi da fuoco o da lancio.',
            'athletics': 'Correre, saltare, arrampicarsi e nuotare.',
            'brawl': 'Combattimento a mani nude o con armi improvvisate.',
            'convince': 'Persuadere gli altri con la logica o il fascino.',
            'empathy': 'Capire le emozioni e le intenzioni altrui.',
            'hide': 'Muoversi senza essere visti o sentiti.',
            'intimidate': 'Spaventare o costringere gli altri con la forza.',
            'notice': 'Percepire dettagli, indizi o pericoli nascosti.',
            'perform': 'Intrattenere un pubblico con arte o oratoria.',
            'ride': 'Controllare cavalli o altri animali da sella.',
            'sailing': 'Manovrare navi, conoscere il mare e le rotte.',
            'scholarship': 'Conoscenza accademica, storia, scienze.',
            'tempt': 'Manipolare gli altri facendo leva sui loro desideri.',
            'theft': 'Borseggiare, scassinare serrature, giochi di prestigio.',
            'warfare': 'Tattica militare, comando e logistica.',
            'weaponry': 'Combattimento con spade, pugnali o armi in asta.'
        };

        AuthService.init();
    }

    async loadAdvantagesData(edition) {
        try {
            const path = edition === '1e' ? './data/v1/advantages.json' : './data/v2/advantages.json';
            const res = await fetch(path);
            if (res.ok) {
                this.advantagesData = await res.json();
            }
        } catch (e) {
            console.warn('Could not load advantages for tooltip:', e);
        }
    }

    async loadBackgroundsData(edition) {
        try {
            if (edition === '2e') {
                const res = await fetch('./data/v2/backgrounds.json');
                if (res.ok) {
                    this.backgroundsData = await res.json();
                }
            }
        } catch (e) {
            console.warn('Could not load backgrounds for tooltip:', e);
        }
    }

    async renderCharacter(id) {
        this.character = Storage.getCharacter(id);
        const div = document.createElement('div');
        div.className = 'character-sheet-container';

        if (!this.character) {
            div.innerHTML = `
                <div class="empty-state">
                    <p>Personaggio non trovato.</p>
                    <button class="btn btn-primary" id="btn-back">Torna alla Lista</button>
                </div>
            `;
            setTimeout(() => {
                div.querySelector('#btn-back').addEventListener('click', () => {
                    this.app.router.navigate('characters');
                });
            }, 0);
            return div;
        }

        // Data Migration
        if (!this.character.inventory) this.character.inventory = [];
        if (!this.character.journal) this.character.journal = [];
        // Wealth Migration: Number -> Object
        if (typeof this.character.wealth !== 'object') {
            this.character.wealth = { gold: 0, silver: 0, copper: this.character.wealth || 0 };
        }

        // Load Data for Tooltips
        await this.loadAdvantagesData(this.character.edition);
        await this.loadBackgroundsData(this.character.edition);

        this.renderTabs(div);
        return div;
    }

    renderTabs(container) {
        container.innerHTML = `
            <div class="card" style="position: relative; padding-top: 10px; min-height: 80vh; display: flex; flex-direction: column; overflow: hidden;">

                <!-- Tabs Nav (FIXED position, always same place) -->
                <div class="tabs-nav" style="display: flex; border-bottom: 2px solid var(--border-worn); margin: 10px 0 0 0; flex-shrink: 0;">
                    <button class="tab-btn active" data-tab="sheet" style="flex: 1; padding: 10px; background: none; border: none; border-bottom: 3px solid transparent; font-family: var(--font-display); font-size: 1.1rem; color: var(--text-faded);">Scheda</button>
                    <button class="tab-btn" data-tab="inventory" style="flex: 1; padding: 10px; background: none; border: none; border-bottom: 3px solid transparent; font-family: var(--font-display); font-size: 1.1rem; color: var(--text-faded);">Borsa</button>
                    <button class="tab-btn" data-tab="journal" style="flex: 1; padding: 10px; background: none; border: none; border-bottom: 3px solid transparent; font-family: var(--font-display); font-size: 1.1rem; color: var(--text-faded);">Diario</button>
                </div>

                <!-- Content Area (Swipeable) -->
                <div id="tab-content" style="flex: 1; overflow-y: auto; padding: 15px 0 80px 0; touch-action: pan-y pinch-zoom;"></div>
            
                <!-- Dice Overlay & FAB & Tooltip -->
                <div id="dice-overlay" class="modal-overlay" style="display: none;">
                    <div class="modal-content" style="text-align: center;">
                        <h3 class="mb-20">Risultato Lancio</h3>
                        <div id="dice-results" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 20px;"></div>
                        <div id="dice-summary" style="font-size: 1.2rem; font-weight: bold; margin-bottom: 20px;"></div>
                        <button class="btn btn-primary" id="btn-close-dice">Chiudi</button>
                    </div>
                </div>

                <div id="dice-fab" class="dice-fab-popup" style="display: none;">
                    <div class="dice-fab-card">
                        <div id="dice-pool-list" class="dice-fab-list"></div>
                        <div class="dice-fab-total">
                            Totale: <span id="dice-pool-total" class="total-number">0</span> Dadi
                        </div>
                        <div class="dice-fab-buttons">
                            <button class="dice-fab-btn reset" id="btn-pool-reset">🗑️</button>
                            <button class="dice-fab-btn add" id="btn-pool-add">+1</button>
                        </div>
                        <div class="dice-fab-roll-wrapper">
                            <button class="dice-fab-roll-btn" id="btn-pool-roll">
                                <img src="assets/d10.png" alt="Lancia" class="d10-image">
                            </button>
                        </div>
                    </div>
                </div>

                <div id="sheet-tooltip" style="position: fixed; pointer-events: none; opacity: 0; transition: opacity 0.2s; z-index: 1000; padding: 15px; border-radius: 10px; max-width: 250px; text-align: left; font-size: 0.9rem;"></div>
            </div>
        `;

        this.renderTabContent(container.querySelector('#tab-content'), this.activeTab);
        this.attachGlobalListeners(container);
    }



    renderTabContent(container, tabName) {
        container.innerHTML = '';
        if (tabName === 'sheet') this.renderSheetTab(container);
        if (tabName === 'inventory') this.renderInventoryTab(container);
        if (tabName === 'journal') this.renderJournalTab(container);

        // Re-attach listeners for the new content
        if (tabName === 'sheet') this.attachSheetListeners(container);
        if (tabName === 'inventory') this.attachInventoryListeners(container);
        if (tabName === 'journal') this.attachJournalListeners(container);
    }

    renderSheetTab(container) {
        container.innerHTML = `
                <!-- Character Header (only in Sheet tab) -->
                <div class="char-header text-center" style="margin-bottom: 20px; position: relative;">
                    <!-- Hidden File Input -->
                    <input type="file" id="sheet-image-upload" accept="image/*" style="display: none;">

                    <!-- Avatar with Edit Overlay -->
                    <div class="char-sheet-avatar-container" style="position: relative; width: 100px; height: 100px; margin: 0 auto 10px; cursor: pointer;">
                        ${this.character.image ? `
                        <div class="char-sheet-avatar" style="width: 100%; height: 100%; border-radius: 50%; border: 3px solid var(--accent-gold); overflow: hidden; box-shadow: 0 5px 15px var(--shadow-strong);">
                            <img src="${this.character.image}" alt="${this.character.name}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        ` : `
                        <div class="char-sheet-avatar placeholder" style="width: 100%; height: 100%; border-radius: 50%; border: 3px dashed var(--accent-gold); display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.05);">
                            <span style="font-size: 2rem; color: var(--accent-gold);">📷</span>
                        </div>
                        `}
                        
                        <!-- Edit Icon Overlay -->
                        <div class="avatar-edit-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s;">
                            <span style="color: white; font-size: 1.5rem;">✏️</span>
                        </div>
                    </div>

                    <h2 class="page-title" style="margin-bottom: 0;">${this.character.name}</h2>
                    <div style="font-style: italic; color: var(--text-faded); margin-bottom: 15px;">
                        ${this.character.nation} • Livello <span id="lvl-display">${this.character.level || 1}</span>
                    </div>

                    <!-- Cropper Modal (Hidden) -->
                    <div id="sheet-cropper-overlay" class="cropper-overlay">
                        <h3 style="color: white; margin-bottom: 20px; font-family: var(--font-display);">Ritaglia Immagine</h3>
                        <div class="cropper-container">
                            <img id="sheet-cropper-img" class="cropper-img">
                            <div id="sheet-cropper-mask" class="cropper-mask">
                                    <div class="cropper-circle"></div>
                            </div>
                        </div>
                        <div class="cropper-controls">
                            <input type="range" id="sheet-cropper-zoom" min="0.5" max="3" step="0.1" value="1" style="width: 200px;">
                        </div>
                        <div class="cropper-buttons">
                            <button class="btn btn-secondary" id="btn-sheet-cancel-crop">Annulla</button>
                            <button class="btn btn-primary" id="btn-sheet-confirm-crop">Salva</button>
                        </div>
                    </div>
                </div>

                <div class="sheet-header-grid">
                    <div class="info-block details-trigger" id="details-trigger" style="cursor: pointer; position: relative;">
                        <span class="info-label">Concetto <span style="font-size: 0.7rem; opacity: 0.6;">ⓘ</span></span>
                        <span class="info-val" style="font-size: 0.9rem;">${this.character.concept || '-'}</span>
                    </div>
                     <div class="info-block wealth-block" id="wealth-block" style="text-align: center; cursor: pointer;">
                        <span class="info-label">Monete</span>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                            <div class="coin-stack" style="text-align:center;">
                                <span style="font-size:1.2rem; color: #FFD700;">●</span>
                                <div style="font-weight:bold;">${this.character.wealth.gold || 0}</div>
                            </div>
                            <div class="coin-stack" style="text-align:center;">
                                <span style="font-size:1.2rem; color: #C0C0C0;">●</span>
                                <div style="font-weight:bold;">${this.character.wealth.silver || 0}</div>
                            </div>
                            <div class="coin-stack" style="text-align:center;">
                                <span style="font-size:1.2rem; color: #CD7F32;">●</span>
                                <div style="font-weight:bold;">${this.character.wealth.copper || 0}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="sheet-section">
                    <div class="sheet-section-title">Tratti</div>
                    <div class="traits-grid">
                        ${this.renderTraitSpot('brawn')}
                        ${this.renderTraitSpot('finesse')}
                        ${this.renderTraitSpot('resolve')}
                        ${this.renderTraitSpot('wits')}
                        ${this.renderTraitSpot('panache')}
                    </div>
                </div>

                <div class="sheet-section">
                    <div class="sheet-header-grid">
                        <div class="info-block" style="text-align: center; border: 2px solid var(--accent-gold);">
                            <span class="info-label">Punti Eroe</span>
                            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 5px;">
                                <button class="btn-circle" id="hp-minus">-</button>
                                <span class="info-val" id="hp-val" style="font-size: 1.5rem;">${this.character.heroPoints || 1}</span>
                                <button class="btn-circle" id="hp-plus">+</button>
                            </div>
                        </div>
                        <div class="info-block" style="text-align: center; border: 2px solid var(--accent-red);">
                            <span class="info-label">Ferite</span>
                            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 5px;">
                                <button class="btn-circle" id="w-minus">-</button>
                                <span class="info-val" id="w-val" style="font-size: 1.5rem;">${this.character.wounds || 0}</span>
                                <button class="btn-circle" id="w-plus">+</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="sheet-section">
                    <div class="sheet-section-title">Abilità</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px;">
                        ${this.renderSkills()}
                    </div>
                </div>

                 <div class="sheet-section">
                    <div class="sheet-section-title">
                        ${this.character.edition === '1e' ? 'Vantaggi & Scuole' : 'Background & Vantaggi'}
                    </div>
                    
                    ${this.character.edition === '2e' && this.character.backgrounds && this.character.backgrounds.length > 0 ?
                `<div style="margin-bottom: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            ${this.character.backgrounds.map(bg => `
                                <div class="interactive-text adv-pill" data-type="background" data-key="${bg.replace(/"/g, '&quot;')}" style="background: rgba(0,0,0,0.05); padding: 8px; border-radius: 5px; font-size: 0.9rem; text-align: center; border: 1px solid var(--border-worn); cursor: help;">
                                    ${bg}
                                </div>
                            `).join('')}
                        </div>` : ''
            }
                    
                    ${this.character.edition === '1e' && this.character.school ?
                `<p><strong>Scuola:</strong> ${this.character.school}</p>` : ''
            }
                    
                    <div style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        ${this.character.advantages ? this.character.advantages.map(adv => `
                            <div class="interactive-text adv-pill" data-type="advantage" data-key="${adv.replace(/"/g, '&quot;')}" style="background: rgba(0,0,0,0.05); padding: 8px; border-radius: 5px; font-size: 0.9rem; text-align: center; border: 1px solid transparent; cursor: help;">
                                ${adv}
                            </div>
                        `).join('') : ''}
                    </div>
                </div>
                
                <div class="text-center mt-20">
                     <button id="btn-lvl-up" style="background: linear-gradient(135deg, var(--accent-gold), #8a6d3b); color: white; border: none; padding: 12px 24px; font-family: var(--font-display); font-size: 1.1rem; border-radius: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                        ⚡ Level Up
                     </button>
                </div>
        `;
    }

    renderTraitSpot(trait) {
        const val = this.character.traits[trait];
        const label = this.translateTrait(trait);
        return `
            <div class="trait-spot">
                <span class="val interactive-stat" data-type="trait" data-key="${trait}" data-val="${val}">${val}</span>
                <span class="lbl interactive-label" data-type="trait" data-key="${trait}">${label}</span>
            </div>
        `;
    }

    renderSkills() {
        const skills = Object.entries(this.character.skills)
            .filter(([_, val]) => val > 0)
            .map(([id, val]) => `
                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #ccc; align-items: center;">
                    <span class="interactive-label" data-type="skill" data-key="${id}">${this.translateSkill(id)}</span>
                    <strong class="interactive-stat" data-type="skill" data-key="${id}" data-val="${val}" style="background: var(--bg-paper-dark); padding: 2px 8px; border-radius: 10px; cursor: pointer;">${val}</strong>
                </div>
            `);
        return skills.length ? skills.join('') : '<p style="font-style: italic; color: #888;">Nessuna abilità appresa.</p>';
    }

    renderInventoryTab(container) {
        container.innerHTML = `
            <div class="sheet-section">
                <!-- Swipe Actions handled via JS -->
                <div id="inventory-list" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                    ${this.character.inventory.length === 0 ? '<p style="font-style:italic; color:var(--text-faded);">La borsa è vuota.</p>' : ''}
                    ${this.character.inventory.map((item, idx) => `
                        <div class="swipe-item-container" data-idx="${idx}" style="position: relative; border-radius: 8px; overflow: hidden; min-height: 60px; touch-action: pan-y;">
                            <!-- Delete Background (Right) -->
                            <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 100%; background: var(--accent-red); display: flex; justify-content: flex-end; align-items: center; padding-right: 20px; color: white;">
                                🗑️ Elimina
                            </div>
                            <!-- Content -->
                            <div class="inv-item-content" style="position: relative; z-index: 10; background: linear-gradient(135deg, #fdfaf5 0%, #f5edd8 100%); min-height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; border: 1px solid var(--border-worn); border-radius: 8px; transform: translate3d(0,0,0); transition: transform 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                <div style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <strong style="font-size: 1.1rem; color: var(--text-ink);">${item.name}</strong>
                                        ${item.qty > 1 ? `<span style="background: var(--accent-gold); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">×${item.qty}</span>` : ''}
                                    </div>
                                    ${item.notes ? `<div style="font-size: 0.85rem; color: var(--text-faded); margin-top: 4px; font-style: italic;">${item.notes}</div>` : ''}
                                </div>
                                <div style="color: var(--text-faded); font-size: 1.2rem;">⟨</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-primary w-100" id="btn-add-item" style="border-radius: 25px; padding: 12px;">➕ Aggiungi Oggetto</button>
            </div>
        `;
    }

    renderJournalTab(container) {
        container.innerHTML = `
            <div class="sheet-section">
                
                <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 15px;">
                     <!-- No redundant title -->
                     <button class="btn btn-primary" id="btn-add-entry" style="margin-left: auto;">✍️ Scrivi</button>
                </div>

                <div id="journal-list" style="display: flex; flex-direction: column; gap: 15px;">
                     ${this.character.journal.length === 0 ? '<p style="font-style:italic; color:var(--text-faded);">Il diario è vuoto.</p>' : ''}
                     ${this.character.journal.map((entry, idx) => `
                        <div class="swipe-item-container journal" data-idx="${idx}" style="position: relative; border-radius: 5px; overflow: hidden; min-height: 80px;">
                            <!-- Actions: Edit (Left Green), Delete (Right Red) -->
                            <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 50%; background: var(--accent-green); display: flex; align-items: center; padding-left: 20px; color: white;">✏️</div>
                            <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 50%; background: var(--accent-red); display: flex; justify-content: flex-end; align-items: center; padding-right: 20px; color: white;">🗑️</div>
                            
                            <!-- Content -->
                            <div class="journal-content" style="position: relative; z-index: 10; background: #fdfaf5; padding: 15px; border: 1px solid var(--border-worn); transform: translate3d(0,0,0); transition: transform 0.2s;">
                                <div style="font-size: 0.8rem; color: var(--accent-gold); font-weight: bold; margin-bottom: 5px;">${entry.date || ''}</div>
                                ${entry.title ? `<h4 style="margin: 0 0 5px 0;">${entry.title}</h4>` : ''}
                                <div style="font-family: var(--font-hand); font-size: 1.1rem; line-height: 1.4; white-space: pre-wrap;">${entry.content}</div>
                            </div>
                        </div>
                     `).join('')}
                </div>
            </div>
        `;
    }

    // LISTENER ATTACHMENT
    attachGlobalListeners(container) {
        const tabs = container.querySelectorAll('.tab-btn');
        tabs.forEach(btn => {
            if (btn.dataset.tab === this.activeTab) {
                btn.style.borderBottomColor = 'var(--accent-gold)';
                btn.style.color = 'var(--text-ink)';
            }
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Swipe Navigation for PAGE (Sheet <-> Borsa <-> Diario)
        // Only trigger on the 'tab-content' area to avoid conflicts?
        // Actually, conflicts are real. Let's try to detect if we are on a swipeable ITEM.
        const contentArea = container.querySelector('#tab-content');
        let pageStartX = 0;
        let pageStartY = 0;

        contentArea.addEventListener('touchstart', (e) => {
            pageStartX = e.touches[0].clientX;
            pageStartY = e.touches[0].clientY;
        }, { passive: true });

        contentArea.addEventListener('touchend', (e) => {
            // Skip page swipe if an item is being swiped
            if (this.itemSwiping) {
                this.itemSwiping = false;
                return;
            }

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = endX - pageStartX;
            const diffY = endY - pageStartY;

            // Only horizontal swipe
            if (Math.abs(diffX) > 60 && Math.abs(diffY) < 50) {
                // Determine direction
                const direction = diffX > 0 ? 'prev' : 'next';
                this.handlePageSwipe(direction);
            }
        });

        const fab = container.querySelector('#dice-fab');
        if (fab) {
            // ... Dice Listeners existing code ...
            container.querySelector('#btn-pool-reset').addEventListener('click', () => {
                this.dicePool = [];
                this.updateDiceFab();
            });
            container.querySelector('#btn-pool-add').addEventListener('click', () => this.addToPool(1, 'Bonus'));
            container.querySelector('#btn-pool-roll').addEventListener('click', () => this.rollDicePool());
            container.querySelector('#btn-close-dice').addEventListener('click', () => {
                document.querySelector('#dice-overlay').style.display = 'none';
                this.dicePool = [];
                this.updateDiceFab();
            });
        }
    }

    handlePageSwipe(dir) {
        const tabs = ['sheet', 'inventory', 'journal'];
        const currentIdx = tabs.indexOf(this.activeTab);
        let newIdx = currentIdx;

        if (dir === 'next' && currentIdx < tabs.length - 1) newIdx++;
        if (dir === 'prev' && currentIdx > 0) newIdx--;

        if (newIdx !== currentIdx) {
            this.switchTab(tabs[newIdx]);
        }
    }

    switchTab(tabName) {
        this.activeTab = tabName;
        const container = document.querySelector('.character-sheet-container');
        if (!container) return;

        // Update Nav UI
        container.querySelectorAll('.tab-btn').forEach(b => {
            b.style.borderBottomColor = 'transparent';
            b.style.color = 'var(--text-faded)';
            if (b.dataset.tab === tabName) {
                b.style.borderBottomColor = 'var(--accent-gold)';
                b.style.color = 'var(--text-ink)';
            }
        });

        this.renderTabContent(container.querySelector('#tab-content'), tabName);
    }

    attachSheetListeners(container) {
        // Wealth block - entire block is clickable
        const wealthBlock = container.querySelector('#wealth-block');
        if (wealthBlock) wealthBlock.addEventListener('click', () => {
            const gold = prompt("Monete d'Oro:", this.character.wealth.gold || 0);
            if (gold === null) return;
            const silver = prompt("Monete d'Argento:", this.character.wealth.silver || 0);
            if (silver === null) return;
            const copper = prompt("Monete di Bronzo:", this.character.wealth.copper || 0);
            if (copper === null) return;

            this.character.wealth = {
                gold: parseInt(gold) || 0,
                silver: parseInt(silver) || 0,
                copper: parseInt(copper) || 0
            };
            Storage.saveCharacter(this.character);
            this.renderTabContent(document.querySelector('#tab-content'), 'sheet');
        });

        // Details popup trigger
        const detailsTrigger = container.querySelector('#details-trigger');
        if (detailsTrigger) {
            detailsTrigger.addEventListener('click', () => this.showDetailsPopup());
        }

        // ... Existing HP/Wounds listeners ...
        const lvlBtn = container.querySelector('#btn-lvl-up');
        if (lvlBtn) {
            lvlBtn.addEventListener('click', () => {
                const newLvl = prompt("Nuovo Livello:", this.character.level || 1);
                if (newLvl && !isNaN(newLvl)) {
                    this.character.level = parseInt(newLvl);
                    const lvlDisplay = document.querySelector('#lvl-display');
                    if (lvlDisplay) lvlDisplay.textContent = this.character.level;
                    Storage.saveCharacter(this.character);
                }
            });
        }

        const hpVal = container.querySelector('#hp-val');
        if (hpVal) {
            container.querySelector('#hp-minus').addEventListener('click', () => {
                let val = parseInt(hpVal.textContent);
                if (val > 0) {
                    hpVal.textContent = --val;
                    this.character.heroPoints = val;
                    Storage.saveCharacter(this.character);
                }
            });
            container.querySelector('#hp-plus').addEventListener('click', () => {
                let val = parseInt(hpVal.textContent);
                hpVal.textContent = ++val;
                this.character.heroPoints = val;
                Storage.saveCharacter(this.character);
            });
        }

        const wVal = container.querySelector('#w-val');
        if (wVal) {
            container.querySelector('#w-minus').addEventListener('click', () => {
                let val = parseInt(wVal.textContent);
                if (val > 0) {
                    wVal.textContent = --val;
                    this.character.wounds = val;
                    Storage.saveCharacter(this.character);
                }
            });
            container.querySelector('#w-plus').addEventListener('click', () => {
                let val = parseInt(wVal.textContent);
                wVal.textContent = ++val;
                this.character.wounds = val;
                Storage.saveCharacter(this.character);
            });
        }

        // TOOLTIPS & DICE
        container.querySelectorAll('.interactive-label, .interactive-text').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                this.showTooltip(e.target.dataset.type, e.target.dataset.key, e.clientX, e.clientY);
            });
        });

        container.querySelectorAll('.interactive-stat').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                this.addToPool(parseInt(e.target.dataset.val), this.translateKey(e.target.dataset.key));
            });
        });

        /* ========================================
           AVATAR EDITING & CROPPER LOGIC
           ======================================== */
        const avatarContainer = container.querySelector('.char-sheet-avatar-container');
        const fileInput = container.querySelector('#sheet-image-upload');
        const cropperOverlay = container.querySelector('#sheet-cropper-overlay');
        const cropperImg = container.querySelector('#sheet-cropper-img');
        const cropperMask = container.querySelector('#sheet-cropper-mask');
        const zoomSlider = container.querySelector('#sheet-cropper-zoom');
        const btnCancel = container.querySelector('#btn-sheet-cancel-crop');
        const btnConfirm = container.querySelector('#btn-sheet-confirm-crop');

        if (avatarContainer && fileInput) {
            avatarContainer.addEventListener('click', () => fileInput.click());
        }

        let cropState = {
            img: null,
            scale: 1,
            posX: 0,
            posY: 0,
            isDragging: false,
            lastX: 0,
            lastY: 0
        };

        const updateCropperTransform = () => {
            if (!cropperImg) return;
            cropperImg.style.transform = `translate(${cropState.posX}px, ${cropState.posY}px) scale(${cropState.scale})`;
        };

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        cropperImg.src = evt.target.result;
                        cropState.img = new Image();
                        cropState.img.src = evt.target.result;
                        cropState.img.onload = () => {
                            // Reset state
                            cropState.scale = 1;
                            cropState.posX = 0;
                            cropState.posY = 0;
                            zoomSlider.value = 1;
                            updateCropperTransform();
                            cropperOverlay.style.display = 'flex';
                        };
                    };
                    reader.readAsDataURL(file);
                }
                // Reset input value to allow re-selecting same file
                e.target.value = '';
            });
        }

        // Cropper Interactions
        if (cropperMask) {
            cropperMask.addEventListener('mousedown', (e) => {
                cropState.isDragging = true;
                cropState.lastX = e.clientX;
                cropState.lastY = e.clientY;
                e.preventDefault(); // Prevent text selection
            });

            window.addEventListener('mousemove', (e) => {
                if (cropState.isDragging && cropperOverlay.style.display === 'flex') {
                    const deltaX = e.clientX - cropState.lastX;
                    const deltaY = e.clientY - cropState.lastY;
                    cropState.posX += deltaX;
                    cropState.posY += deltaY;
                    cropState.lastX = e.clientX;
                    cropState.lastY = e.clientY;
                    updateCropperTransform();
                }
            });

            window.addEventListener('mouseup', () => {
                cropState.isDragging = false;
            });

            // Touch support
            cropperMask.addEventListener('touchstart', (e) => {
                cropState.isDragging = true;
                cropState.lastX = e.touches[0].clientX;
                cropState.lastY = e.touches[0].clientY;
                e.preventDefault();
            }, { passive: false });

            window.addEventListener('touchmove', (e) => {
                if (cropState.isDragging && cropperOverlay.style.display === 'flex') {
                    const deltaX = e.touches[0].clientX - cropState.lastX;
                    const deltaY = e.touches[0].clientY - cropState.lastY;
                    cropState.posX += deltaX;
                    cropState.posY += deltaY;
                    cropState.lastX = e.touches[0].clientX;
                    cropState.lastY = e.touches[0].clientY;
                    updateCropperTransform();
                    e.preventDefault();
                }
            }, { passive: false });

            window.addEventListener('touchend', () => {
                cropState.isDragging = false;
            });
        }

        if (zoomSlider) {
            zoomSlider.addEventListener('input', (e) => {
                cropState.scale = parseFloat(e.target.value);
                updateCropperTransform();
            });
        }

        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                cropperOverlay.style.display = 'none';
                cropState.img = null;
            });
        }

        if (btnConfirm) {
            btnConfirm.addEventListener('click', () => {
                if (!cropState.img) return;

                const canvas = document.createElement('canvas');
                const size = 200; // Output size
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');

                // Fill background (optional, but good for transparency)
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, size, size);

                ctx.save();
                ctx.translate(size / 2, size / 2);
                ctx.translate(cropState.posX, cropState.posY);
                ctx.scale(cropState.scale, cropState.scale);
                ctx.drawImage(cropState.img, -cropState.img.width / 2, -cropState.img.height / 2);
                ctx.restore();

                const resultImage = canvas.toDataURL('image/jpeg', 0.8);

                // Update Character
                this.character.image = resultImage;

                // Save and Re-render
                Storage.saveCharacter(this.character);
                this.render();

                // Close overlay
                cropperOverlay.style.display = 'none';
            });
        }
    }

    // GENERIC SWIPE LOGIC FOR ITEMS
    attachItemSwipe(container, selector, onSwipeLeft, onSwipeRight) {
        const items = container.querySelectorAll(selector);
        items.forEach(item => {
            const content = item.querySelector('div[style*="z-index: 10"]'); // The front face
            let startX = 0;
            let currentTranslate = 0;
            let isDragging = false;

            content.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = false;
                content.style.transition = 'none';
            }, { passive: true });

            content.addEventListener('touchmove', (e) => {
                const x = e.touches[0].clientX;
                const diff = x - startX;
                if (Math.abs(diff) > 10) {
                    isDragging = true;
                    this.itemSwiping = true; // Flag to prevent page swipe
                    // Cap drag
                    let translate = diff;
                    if (translate < -100) translate = -100;
                    if (translate > 100) translate = 100;

                    content.style.transform = `translate3d(${translate}px, 0, 0)`;
                    currentTranslate = translate;
                }
            }, { passive: true });

            content.addEventListener('touchend', (e) => {
                content.style.transition = 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                if (isDragging) {
                    e.stopPropagation();
                    if (currentTranslate < -60 && onSwipeLeft) { // Left Swipe (e.g. Delete)
                        content.style.transform = 'translate3d(0,0,0)';
                        onSwipeLeft(item.dataset.idx);
                    } else if (currentTranslate > 60 && onSwipeRight) { // Right Swipe (e.g. Edit)
                        content.style.transform = 'translate3d(0,0,0)';
                        onSwipeRight(item.dataset.idx);
                    } else {
                        content.style.transform = 'translate3d(0,0,0)';
                    }
                }
                isDragging = false;
            });
        });
    }

    attachInventoryListeners(container) {
        container.querySelector('#btn-add-item').addEventListener('click', () => {
            const name = prompt("Nome oggetto:");
            if (name) {
                const qty = prompt("Quantità:", "1");
                const notes = prompt("Note/Descrizione:");
                this.character.inventory.push({ name, qty: qty || 1, notes: notes || '' });
                Storage.saveCharacter(this.character);
                this.renderTabContent(document.querySelector('#tab-content'), 'inventory');
            }
        });

        // Swipe Left to DELETE
        this.attachItemSwipe(container, '.swipe-item-container', (idx) => {
            if (confirm('Rimuovere oggetto?')) {
                this.character.inventory.splice(idx, 1);
                Storage.saveCharacter(this.character);
                this.renderTabContent(document.querySelector('#tab-content'), 'inventory');
            }
        }, null);
    }

    attachJournalListeners(container) {
        container.querySelector('#btn-add-entry').addEventListener('click', () => this.editJournalEntry(null));

        // Swipe Left (Delete), Swipe Right (Edit)
        this.attachItemSwipe(container, '.swipe-item-container.journal',
            (idx) => { // Left: Delete
                if (confirm('Strappare questa pagina?')) {
                    this.character.journal.splice(idx, 1);
                    Storage.saveCharacter(this.character);
                    this.renderTabContent(document.querySelector('#tab-content'), 'journal');
                }
            },
            (idx) => { // Right: Edit
                this.editJournalEntry(idx);
            }
        );
    }

    editJournalEntry(idx) {
        const entry = idx !== null ? this.character.journal[idx] : { title: '', content: '' };
        const date = new Date().toLocaleDateString();
        const title = prompt("Titolo (opzionale):", entry.title || '');
        const content = prompt("Contenuto:", entry.content || '');
        if (content !== null) {
            const newEntry = { date, title: title || '', content };
            if (idx !== null) this.character.journal[idx] = newEntry;
            else this.character.journal.unshift(newEntry);
            Storage.saveCharacter(this.character);
            this.renderTabContent(document.querySelector('#tab-content'), 'journal');
        }
    }

    // Shared Methods
    addToPool(val, sourceName) {
        this.dicePool.push({ val, source: sourceName });
        this.updateDiceFab();
    }
    updateDiceFab() { /* Same as before */
        const fab = document.querySelector('#dice-fab');
        if (!fab) return;
        if (this.dicePool.length === 0) { fab.style.display = 'none'; return; }
        fab.style.display = 'flex';
        const list = document.querySelector('#dice-pool-list');
        list.innerHTML = this.dicePool.map(d => `<div>${d.source}: <strong style="color:var(--accent-gold);">+${d.val}</strong></div>`).join('');
        const total = this.dicePool.reduce((sum, d) => sum + d.val, 0);
        document.querySelector('#dice-pool-total').textContent = total;
    }
    rollDicePool() {
        const total = this.dicePool.reduce((sum, d) => sum + d.val, 0);
        if (total === 0) return;

        const results = Dice.roll(total);
        const raisesData = Dice.calculateRaises(results);

        const overlay = document.querySelector('#dice-overlay');
        const resultsDiv = document.querySelector('#dice-results');
        const summaryDiv = document.querySelector('#dice-summary');

        resultsDiv.innerHTML = results.map(r => `
            <div class="die ${r >= 10 ? 'crit' : ''}" style="width: 50px; height: 50px; border-radius: 8px; background: ${r === 10 ? 'var(--accent-gold)' : 'var(--bg-paper)'}; border: 2px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.4rem; box-shadow: 0 4px 8px rgba(0,0,0,0.2); color: ${r === 10 ? 'var(--bg-paper)' : 'var(--text-ink)'};">
                ${r}
            </div>
        `).join('');

        summaryDiv.innerHTML = `Incrementi: <span style="color: var(--accent-gold); font-size: 2rem;">${raisesData.raises}</span>`;
        if (this.character.edition === '1e') {
            const sum = results.reduce((a, b) => a + b, 0);
            summaryDiv.innerHTML += `<div style="font-size: 1rem; color: var(--text-faded); margin-top: 5px;">Somma Totale: ${sum}</div>`;
        }

        overlay.style.display = 'flex';
    }

    showTooltip(type, key, x, y) {
        let text = '';
        if (type === 'trait' || type === 'skill') {
            text = this.descriptions[key] || key;
        } else if (type === 'advantage') {
            const adv = this.advantagesData.find(a => a.name === key);
            text = adv ? `(${adv.cost} PE) ${adv.description}` : key;
        } else if (type === 'background') {
            const bg = this.backgroundsData.find(b => b.name === key);
            text = bg ? `<em>${bg.quirk}</em>` : key;
        }

        const tooltip = document.querySelector('#sheet-tooltip');
        tooltip.innerHTML = text;
        tooltip.style.opacity = '1';

        // Positioning
        let left = x - 125;
        if (left < 10) left = 10;
        if (left + 250 > window.innerWidth) left = window.innerWidth - 260;

        let top = y - 100;
        if (top < 50) top = y + 40;

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';

        if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
        this.tooltipTimeout = setTimeout(() => {
            tooltip.style.opacity = '0';
        }, 4000);

        // Allow dismissing tooltip on any touch/click
        const dismissTooltip = () => {
            if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
            tooltip.style.opacity = '0';
            document.removeEventListener('touchstart', dismissTooltip);
            document.removeEventListener('click', dismissTooltip);
        };
        // Delay adding the listener so the current click doesn't immediately dismiss
        setTimeout(() => {
            document.addEventListener('touchstart', dismissTooltip, { once: true, passive: true });
            document.addEventListener('click', dismissTooltip, { once: true });
        }, 100);
    }

    translateKey(key) {
        if (this.descriptions[key]) return this.descriptions[key].split(':')[0];
        return this.translateSkill(key) || this.translateTrait(key) || key;
    }
    translateTrait(trait) {
        const map = { 'brawn': 'Muscoli', 'finesse': 'Finezza', 'resolve': 'Risoluz.', 'wits': 'Acume', 'panache': 'Panache' };
        return map[trait] || trait;
    }
    translateSkill(skillId) {
        return this.skillMap[skillId] || (skillId.charAt(0).toUpperCase() + skillId.slice(1));
    }

    showDetailsPopup() {
        // Create popup container
        const popup = document.createElement('div');
        popup.className = 'details-popup-overlay';

        let arcanaContent = '';
        if (this.character.edition === '2e') {
            arcanaContent = `
                <div class="popup-section">
                    <h3 class="popup-subtitle">Arcano</h3>
                    <div class="popup-row">
                        <span class="popup-label">Virtù:</span>
                        <span class="popup-value">${this.character.virtue || '-'}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Hubris:</span>
                        <span class="popup-value">${this.character.hubris || '-'}</span>
                    </div>
                </div>
            `;
        } else {
            arcanaContent = `
                <div class="popup-section">
                    <h3 class="popup-subtitle">Arcano</h3>
                     <div class="popup-row">
                        <span class="popup-value">${this.character.arcana || '-'}</span>
                    </div>
                </div>
            `;
        }

        let storiesContent = '';
        if (this.character.stories && this.character.stories.length > 0) {
            storiesContent = `
                <div class="popup-section">
                    <h3 class="popup-subtitle">Storia Personale</h3>
                    ${this.character.stories.map(s => `
                        <div class="story-block">
                            <div class="popup-row">
                                <span class="popup-label">Nome:</span>
                                <span class="popup-value bold">${s.name || '-'}</span>
                            </div>
                            <div class="popup-row">
                                <span class="popup-label">Obiettivo:</span>
                                <span class="popup-value">${s.goal || '-'}</span>
                            </div>
                            <div class="popup-row">
                                <span class="popup-label">Ricompensa:</span>
                                <span class="popup-value">${s.reward || '-'}</span>
                            </div>
                            <div class="popup-row">
                                <span class="popup-label">Passi:</span>
                                <ul class="popup-list">
                                    ${s.steps ? s.steps.map(step => `<li>${step}</li>`).join('') : ''}
                                </ul>
                            </div>
                        </div>
                    `).join('<hr class="popup-divider">')}
                </div>
            `;
        }

        popup.innerHTML = `
            <div class="details-popup-card">
                <button class="btn-close-popup">×</button>
                <h2 class="popup-title">Dettagli Eroe</h2>
                
                <div class="popup-content">
                    <div class="popup-section">
                        <h3 class="popup-subtitle">Identità</h3>
                        <div class="popup-row">
                            <span class="popup-label">Religione:</span>
                            <span class="popup-value">${this.character.religion || '-'}</span>
                        </div>
                         <div class="popup-row">
                            <span class="popup-label">Concetto:</span>
                            <span class="popup-value">${this.character.concept || '-'}</span>
                        </div>
                    </div>

                    ${arcanaContent}
                    ${storiesContent}
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        // Close logic
        const closeBtn = popup.querySelector('.btn-close-popup');
        closeBtn.addEventListener('click', () => popup.remove());
        popup.addEventListener('click', (e) => {
            if (e.target === popup) popup.remove();
        });
    }
}
