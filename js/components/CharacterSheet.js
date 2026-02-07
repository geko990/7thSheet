import { Storage } from '../storage.js';
import { Dice } from '../dice.js';

export default class CharacterSheet {
    constructor(app) {
        this.app = app;
        this.character = null;
        this.dicePool = [];
        this.activeTab = 'sheet'; // sheet, inventory, journal
        this.advantagesData = [];
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
            'brawn': 'Muscoli: Forza pura, resistenza fisica e capacità di incassare colpi.',
            'finesse': 'Finezza: Coordinazione, agilità, precisione manuale.',
            'resolve': 'Risolutezza: Volontà, determinazione e resistenza mentale.',
            'wits': 'Acume: Intelligenza, prontezza di spirito e capacità deduttiva.',
            'panache': 'Panache: Carisma, stile, fascino e capacità di ispirare.',
            // Updated Italian Descriptions
            'aim': 'Mira: Colpire bersagli a distanza con armi da fuoco o da lancio.',
            'athletics': 'Atletica: Correre, saltare, arrampicarsi e nuotare.',
            'brawl': 'Rissa: Combattimento a mani nude o con armi improvvisate.',
            'convince': 'Convincere: Persuadere gli altri con la logica o il fascino.',
            'empathy': 'Empatia: Capire le emozioni e le intenzioni altrui.',
            'hide': 'Furtività: Muoversi senza essere visti o sentiti.',
            'intimidate': 'Intimidire: Spaventare o costringere gli altri con la forza.',
            'notice': 'Notare: Percepire dettagli, indizi o pericoli nascosti.',
            'perform': 'Esibirsi: Intrattenere un pubblico con arte o oratoria.',
            'ride': 'Cavalcare: Controllare cavalli o altri animali da sella.',
            'sailing': 'Navigare: Manovrare navi, conoscere il mare e le rotte.',
            'scholarship': 'Istruzione: Conoscenza accademica, storia, scienze.',
            'tempt': 'Allettare: Manipolare gli altri facendo leva sui loro desideri.',
            'theft': 'Furto: Borseggiare, scassinare serrature, giochi di prestigio.',
            'warfare': 'Arte della Guerra: Tattica militare, comando e logistica.',
            'weaponry': 'Mischia: Combattimento con spade, pugnali o armi in asta.'
        };
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

        this.renderTabs(div);
        return div;
    }

    renderTabs(container) {
        container.innerHTML = `
            <div class="card" style="position: relative; padding-top: 10px; min-height: 80vh; display: flex; flex-direction: column; overflow: hidden;">
                <button class="btn btn-secondary" id="btn-close" style="position: absolute; top: 10px; right: 10px; border: none; z-index: 100;">✖</button>

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

                <div id="dice-fab" style="position: fixed; bottom: 80px; right: 20px; display: none; flex-direction: column; align-items: end; gap: 10px; z-index: 100;">
                    <div class="dice-pool-bubble" style="background: var(--bg-paper); border: 2px solid var(--accent-gold); padding: 10px; border-radius: 10px; box-shadow: 0 4px 10px var(--shadow-strong); margin-bottom: 5px; max-width: 200px; text-align: right;">
                        <div id="dice-pool-list" style="font-size: 0.8rem; color: var(--text-faded); margin-bottom: 5px;"></div>
                        <div style="font-weight: bold;">Totale: <span id="dice-pool-total">0</span> Dadi</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-circle" id="btn-pool-reset" style="background: var(--accent-red); width: 40px; height: 40px;">🗑️</button>
                        <button class="btn-circle" id="btn-pool-add" style="background: var(--accent-blue); width: 40px; height: 40px;">+1</button>
                        <button class="btn btn-primary" id="btn-pool-roll" style="border-radius: 30px; padding: 10px 20px; box-shadow: 0 4px 15px var(--accent-gold);">
                            🎲 Lancia!
                        </button>
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
                <div class="char-header text-center" style="margin-bottom: 20px;">
                    ${this.character.image ? `
                    <div class="char-sheet-avatar" style="width: 100px; height: 100px; margin: 0 auto 10px; border-radius: 50%; border: 3px solid var(--accent-gold); overflow: hidden; box-shadow: 0 5px 15px var(--shadow-strong);">
                        <img src="${this.character.image}" alt="${this.character.name}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    ` : ''}
                    <h2 class="page-title" style="margin-bottom: 0;">${this.character.name}</h2>
                    <div style="font-style: italic; color: var(--text-faded); margin-bottom: 15px;">
                        ${this.character.nation} • Livello <span id="lvl-display">${this.character.level || 1}</span>
                    </div>
                </div>

                <div class="sheet-header-grid">
                    <div class="info-block">
                        <span class="info-label">Concetto</span>
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
                    
                    ${this.character.edition === '2e' ?
                `<p><strong>Background:</strong> ${this.character.backgrounds ? this.character.backgrounds.join(', ') : ''}</p>` : ''
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
        container.querySelector('#btn-close').addEventListener('click', () => this.app.router.navigate('characters'));

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
            text = adv ? `<strong>${adv.name}</strong> (${adv.cost} PE)<br>${adv.description}` : key;
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
}
