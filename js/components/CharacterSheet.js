import { Storage } from '../storage.js';
import { Dice } from '../dice.js';

export default class CharacterSheet {
    constructor(app) {
        this.app = app;
        this.character = null;
        this.dicePool = [];
        this.activeTab = 'sheet';
        this.advantagesData = [];

        this.descriptions = {
            'brawn': 'Muscoli: Forza pura, resistenza fisica e capacità di incassare colpi.',
            'finesse': 'Finezza: Coordinazione, agilità, precisione manuale.',
            'resolve': 'Risolutezza: Volontà, determinazione e resistenza mentale.',
            'wits': 'Acume: Intelligenza, prontezza di spirito e capacità deduttiva.',
            'panache': 'Panache: Carisma, stile, fascino e capacità di ispirare.',
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
            'sailing': 'Navigazione: Manovrare navi, conoscere il mare e le rotte.',
            'scholarship': 'Istruzione: Conoscenza accademica, storia, scienze.',
            'tempt': 'Sedurre: Manipolare gli altri facendo leva sui loro desideri.',
            'theft': 'Furto: Borseggiare, scassinare serrature, giochi di prestigio.',
            'warfare': 'Tattica: Strategia militare, comando e logistica.',
            'weaponry': 'Armi Bianche: Combattimento con spade, pugnali o armi in asta.'
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
        if (!this.character.wealth) this.character.wealth = 0;

        // Load Data for Tooltips
        await this.loadAdvantagesData(this.character.edition);

        this.renderTabs(div);
        return div;
    }

    renderTabs(container) {
        container.innerHTML = `
            <div class="card" style="position: relative; padding-top: 10px; min-height: 80vh; display: flex; flex-direction: column;">
                <button class="btn btn-secondary" id="btn-close" style="position: absolute; top: 10px; right: 10px; border: none; z-index: 10;">✖</button>

                <div class="char-header text-center" style="margin-top: 20px;">
                    ${this.character.image ? `
                    <div class="char-sheet-avatar" style="width: 100px; height: 100px; margin: 0 auto 10px; border-radius: 50%; border: 3px solid var(--accent-gold); overflow: hidden; box-shadow: 0 5px 15px var(--shadow-strong);">
                        <img src="${this.character.image}" alt="${this.character.name}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    ` : ''}
                    <h2 class="page-title" style="margin-bottom: 0;">${this.character.name}</h2>
                    <div style="font-style: italic; color: var(--text-faded); margin-bottom: 15px;">
                        ${this.character.nation} • Livello <span id="lvl-display">${this.character.level || 1}</span>
                        <button class="btn-xs btn-primary" id="btn-lvl-up" style="margin-left: 10px;">⚡ Avanza</button>
                    </div>
                </div>

                <div class="tabs-nav" style="display: flex; border-bottom: 2px solid var(--border-color); margin-bottom: 15px;">
                    <button class="tab-btn active" data-tab="sheet" style="flex: 1; padding: 10px; background: none; border: none; border-bottom: 3px solid transparent; font-family: var(--font-display); font-size: 1.1rem; color: var(--text-faded);">Scheda</button>
                    <button class="tab-btn" data-tab="inventory" style="flex: 1; padding: 10px; background: none; border: none; border-bottom: 3px solid transparent; font-family: var(--font-display); font-size: 1.1rem; color: var(--text-faded);">Tasca</button>
                    <button class="tab-btn" data-tab="journal" style="flex: 1; padding: 10px; background: none; border: none; border-bottom: 3px solid transparent; font-family: var(--font-display); font-size: 1.1rem; color: var(--text-faded);">Diario</button>
                </div>

                <div id="tab-content" style="flex: 1;"></div>
            
                <!-- Dice Overlay -->
                <div id="dice-overlay" class="modal-overlay" style="display: none;">
                    <div class="modal-content" style="text-align: center;">
                        <h3 class="mb-20">Risultato Lancio</h3>
                        <div id="dice-results" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 20px;"></div>
                        <div id="dice-summary" style="font-size: 1.2rem; font-weight: bold; margin-bottom: 20px;"></div>
                        <button class="btn btn-primary" id="btn-close-dice">Chiudi</button>
                    </div>
                </div>

                <!-- Dice FAB -->
                <div id="dice-fab" style="position: fixed; bottom: 80px; right: 20px; display: none; flex-direction: column; align-items: end; gap: 10px; z-index: 100;">
                     <div class="dice-pool-bubble" style="background: var(--bg-paper); border: 2px solid var(--accent-gold); padding: 10px; border-radius: 10px; box-shadow: 0 4px 10px var(--shadow); margin-bottom: 5px; max-width: 200px; text-align: right;">
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

                <!-- Tooltip -->
                <div id="sheet-tooltip" style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.9); color: white; padding: 15px; border-radius: 10px; font-size: 0.9rem; pointer-events: none; opacity: 0; transition: opacity 0.3s; z-index: 200; width: 90%; text-align: center; box-shadow: 0 5px 20px rgba(0,0,0,0.5);"></div>
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
    }

    renderSheetTab(container) {
        container.innerHTML = `
                <div class="sheet-header-grid">
                    <div class="info-block">
                        <span class="info-label">Concetto</span>
                        <span class="info-val" style="font-size: 0.9rem;">${this.character.concept || '-'}</span>
                    </div>
                     <div class="info-block" style="text-align: center;">
                        <span class="info-label">Ricchezza</span>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 5px;">
                            <span class="info-val" id="wealth-display">${this.character.wealth}</span>
                            <button class="btn-xs btn-secondary" id="btn-edit-wealth">✏️</button>
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
                    
                    <div style="margin-top: 10px;">
                        <strong>Vantaggi:</strong>
                        <ul style="margin-top: 5px; padding-left: 20px;">
                            ${this.character.advantages ? this.character.advantages.map(adv => `
                                <li class="interactive-text" data-type="advantage" data-key="${adv.replace(/"/g, '&quot;')}">${adv}</li>
                            `).join('') : ''}
                        </ul>
                    </div>
                </div>
        `;
        this.attachSheetListeners(container);
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
                <div class="sheet-section-title">Tasca & Equipaggiamento</div>
                <div id="inventory-list" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                    ${this.character.inventory.length === 0 ? '<p style="font-style:italic; color:var(--text-faded);">Nessun oggetto.</p>' : ''}
                    ${this.character.inventory.map((item, idx) => `
                        <div class="inv-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 5px; border: 1px dashed var(--border-color);">
                            <div>
                                <strong style="font-size: 1.1rem;">${item.name}</strong>
                                ${item.qty > 1 ? `<span style="background: var(--accent-gold); color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.8rem; margin-left: 5px;">x${item.qty}</span>` : ''}
                                <div style="font-size: 0.9rem; color: var(--text-faded); white-space: pre-wrap;">${item.notes || ''}</div>
                            </div>
                            <button class="btn-xs btn-danger btn-del-item" data-idx="${idx}">🗑️</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-primary w-100" id="btn-add-item">➕ Aggiungi Oggetto</button>
            </div>
        `;
        container.querySelectorAll('.btn-del-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('Rimuovere oggetto?')) {
                    this.character.inventory.splice(e.target.closest('button').dataset.idx, 1);
                    Storage.saveCharacter(this.character);
                    this.renderInventoryTab(container);
                }
            });
        });
        container.querySelector('#btn-add-item').addEventListener('click', () => {
            const name = prompt("Nome oggetto:");
            if (name) {
                const qty = prompt("Quantità:", "1");
                const notes = prompt("Note/Descrizione:");
                this.character.inventory.push({ name, qty: qty || 1, notes: notes || '' });
                Storage.saveCharacter(this.character);
                this.renderInventoryTab(container);
            }
        });
    }

    renderJournalTab(container) {
        container.innerHTML = `
            <div class="sheet-section">
                <div class="sheet-section-title">Diario di Bordo</div>
                 <button class="btn btn-primary w-100 mb-20" id="btn-add-entry">✍️ Nuova Pagina</button>
                <div id="journal-list" style="display: flex; flex-direction: column; gap: 15px;">
                     ${this.character.journal.length === 0 ? '<p style="font-style:italic; color:var(--text-faded);">Il diario è vuoto.</p>' : ''}
                     ${this.character.journal.map((entry, idx) => `
                        <div class="journal-entry" style="background: rgba(255,255,255,0.6); padding: 15px; border-radius: 5px; border: 1px solid var(--border-worn); position: relative;">
                            <div style="font-size: 0.8rem; color: var(--accent-gold); font-weight: bold; margin-bottom: 5px;">${entry.date || 'Data Sconosciuta'}</div>
                            ${entry.title ? `<h4 style="margin: 0 0 5px 0;">${entry.title}</h4>` : ''}
                             <div style="font-family: var(--font-hand); font-size: 1.1rem; line-height: 1.4; white-space: pre-wrap;">${entry.content}</div>
                             <div style="margin-top: 10px; text-align: right;">
                                <button class="btn-xs btn-secondary btn-edit-entry" data-idx="${idx}">Modifica</button>
                                <button class="btn-xs btn-danger btn-del-entry" data-idx="${idx}">Elimina</button>
                             </div>
                        </div>
                     `).join('')}
                </div>
            </div>
        `;
        container.querySelector('#btn-add-entry').addEventListener('click', () => this.editJournalEntry(null, container));
        container.querySelectorAll('.btn-del-entry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('Strappare questa pagina?')) {
                    this.character.journal.splice(e.target.closest('button').dataset.idx, 1);
                    Storage.saveCharacter(this.character);
                    this.renderJournalTab(container);
                }
            });
        });
        container.querySelectorAll('.btn-edit-entry').forEach(btn => {
            btn.addEventListener('click', (e) => this.editJournalEntry(e.target.closest('button').dataset.idx, container));
        });
    }

    editJournalEntry(idx, container) {
        const entry = idx !== null ? this.character.journal[idx] : { title: '', content: '' };
        const date = new Date().toLocaleDateString();
        const title = prompt("Titolo (opzionale):", entry.title || '');
        const content = prompt("Contenuto:", entry.content || '');
        if (content !== null) {
            const newEntry = { date, title: title || '', content };
            if (idx !== null) this.character.journal[idx] = newEntry;
            else this.character.journal.unshift(newEntry);
            Storage.saveCharacter(this.character);
            this.renderJournalTab(container);
        }
    }

    attachGlobalListeners(container) {
        container.querySelector('#btn-close').addEventListener('click', () => this.app.router.navigate('characters'));

        container.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === this.activeTab) {
                btn.style.borderBottomColor = 'var(--accent-gold)';
                btn.style.color = 'var(--text-ink)';
            }
            btn.addEventListener('click', () => {
                this.activeTab = btn.dataset.tab;
                container.querySelectorAll('.tab-btn').forEach(b => {
                    b.style.borderBottomColor = 'transparent';
                    b.style.color = 'var(--text-faded)';
                });
                btn.style.borderBottomColor = 'var(--accent-gold)';
                btn.style.color = 'var(--text-ink)';
                this.renderTabContent(container.querySelector('#tab-content'), this.activeTab);
            });
        });

        const lvlBtn = container.querySelector('#btn-lvl-up');
        if (lvlBtn) {
            lvlBtn.addEventListener('click', () => {
                const newLvl = prompt("Nuovo Livello:", this.character.level || 1);
                if (newLvl && !isNaN(newLvl)) {
                    this.character.level = parseInt(newLvl);
                    container.querySelector('#lvl-display').textContent = this.character.level;
                    Storage.saveCharacter(this.character);
                }
            });
        }

        const fab = container.querySelector('#dice-fab');
        if (fab) {
            container.querySelector('#btn-pool-reset').addEventListener('click', () => {
                this.dicePool = [];
                this.updateDiceFab();
            });
            container.querySelector('#btn-pool-add').addEventListener('click', () => this.addToPool(1, 'Bonus'));
            container.querySelector('#btn-pool-roll').addEventListener('click', () => this.rollDicePool());
            container.querySelector('#btn-close-dice').addEventListener('click', () => {
                document.querySelector('#dice-overlay').style.display = 'none';
            });
        }
    }

    attachSheetListeners(container) {
        const wealthBtn = container.querySelector('#btn-edit-wealth');
        if (wealthBtn) wealthBtn.addEventListener('click', () => {
            const val = prompt("Modifica Ricchezza:", this.character.wealth);
            if (val !== null) {
                this.character.wealth = val;
                container.querySelector('#wealth-display').textContent = val;
                Storage.saveCharacter(this.character);
            }
        });

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

        // TOOLTIPS
        container.querySelectorAll('.interactive-label, .interactive-text').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const key = e.target.dataset.key;
                const type = e.target.dataset.type;
                this.showTooltip(type, key);
            });
        });

        // DICE POOL
        container.querySelectorAll('.interactive-stat').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const key = e.target.dataset.key;
                const val = parseInt(e.target.dataset.val);
                this.addToPool(val, this.translateKey(key));
            });
        });
    }

    addToPool(val, sourceName) {
        this.dicePool.push({ val, source: sourceName });
        this.updateDiceFab();
    }

    updateDiceFab() {
        const fab = document.querySelector('#dice-fab');
        if (!fab) return;

        if (this.dicePool.length === 0) {
            fab.style.display = 'none';
            return;
        }
        fab.style.display = 'flex';

        const list = document.querySelector('#dice-pool-list');
        list.innerHTML = this.dicePool.map(d => `<div>${d.source}: <strong style="color:var(--accent-gold);">+${d.val}</strong></div>`).join('');

        const total = this.dicePool.reduce((sum, d) => sum + d.val, 0);
        document.querySelector('#dice-pool-total').textContent = total;
    }

    showTooltip(type, key) {
        let text = '';
        if (type === 'trait' || type === 'skill') {
            text = this.descriptions[key] || key;
        } else if (type === 'advantage') {
            const adv = this.advantagesData.find(a => a.name === key);
            text = adv ? `<strong>${adv.name}</strong> (${adv.cost} PE)<br>${adv.description}` : key;
        }

        const tooltip = document.querySelector('#sheet-tooltip');
        tooltip.innerHTML = text; // Use innerHTML for bolding
        tooltip.style.opacity = '1';

        setTimeout(() => {
            tooltip.style.opacity = '0';
        }, 4000);
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
        // Auto clear pool? Maybe not, user might want to re-roll
        // this.dicePool = [];
        // this.updateDiceFab();
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
        return skillId.charAt(0).toUpperCase() + skillId.slice(1);
    }
}
