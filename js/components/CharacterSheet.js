import { Storage } from '../storage.js';

export default class CharacterSheet {
    constructor(app) {
        this.app = app;
        this.character = null;
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

        // Data Migration (Ensure fields exist)
        if (!this.character.inventory) this.character.inventory = [];
        if (!this.character.journal) this.character.journal = [];
        if (!this.character.wealth) this.character.wealth = 0;

        // Render
        this.activeTab = 'sheet';
        this.renderTabs(div);

        return div;
    }

    renderTabs(container) {
        container.innerHTML = `
            <div class="card" style="position: relative; padding-top: 10px; min-height: 80vh; display: flex; flex-direction: column;">
                <button class="btn btn-secondary" id="btn-close" style="position: absolute; top: 10px; right: 10px; border: none; z-index: 10;">✖</button>

                <!-- Header -->
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

                <!-- Tabs Nav -->
                <div class="tabs-nav" style="display: flex; border-bottom: 2px solid var(--border-color); margin-bottom: 15px;">
                    <button class="tab-btn active" data-tab="sheet" style="flex: 1; padding: 10px; background: none; border: none; border-bottom: 3px solid transparent; font-family: var(--font-display); font-size: 1.1rem; color: var(--text-faded);">Scheda</button>
                    <button class="tab-btn" data-tab="inventory" style="flex: 1; padding: 10px; background: none; border: none; border-bottom: 3px solid transparent; font-family: var(--font-display); font-size: 1.1rem; color: var(--text-faded);">Tasca</button>
                    <button class="tab-btn" data-tab="journal" style="flex: 1; padding: 10px; background: none; border: none; border-bottom: 3px solid transparent; font-family: var(--font-display); font-size: 1.1rem; color: var(--text-faded);">Diario</button>
                </div>

                <!-- Tab Content -->
                <div id="tab-content" style="flex: 1;"></div>
            
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

    // --- SHEET TAB ---
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
                    
                    ${this.character.edition === '1e' && this.character.sorceryLevel ?
                `<p><strong>Stregoneria:</strong> Livello ${this.character.sorceryLevel}</p>` : ''
            }

                    <div style="margin-top: 10px;">
                        <strong>Vantaggi:</strong>
                        <ul style="margin-top: 5px; padding-left: 20px;">
                            ${this.character.advantages ? this.character.advantages.map(adv => `<li>${adv}</li>`).join('') : ''}
                        </ul>
                    </div>
                </div>
        `;
        this.attachSheetListeners(container);
    }

    // --- INVENTORY TAB ---
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
                const idx = e.target.closest('button').dataset.idx;
                if (confirm('Rimuovere oggetto?')) {
                    this.character.inventory.splice(idx, 1);
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

    // --- JOURNAL TAB ---
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

        container.querySelector('#btn-add-entry').addEventListener('click', () => {
            this.editJournalEntry(null, container);
        });

        container.querySelectorAll('.btn-del-entry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.closest('button').dataset.idx;
                if (confirm('Strappare questa pagina?')) {
                    this.character.journal.splice(idx, 1);
                    Storage.saveCharacter(this.character);
                    this.renderJournalTab(container);
                }
            });
        });

        container.querySelectorAll('.btn-edit-entry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.closest('button').dataset.idx;
                this.editJournalEntry(idx, container);
            });
        });
    }

    editJournalEntry(idx, container) {
        // Use a simple prompt flow for now, or replace container with form
        const entry = idx !== null ? this.character.journal[idx] : { title: '', content: '' };

        // Quick dirty edit with prompts (Better UX: Modal, but user asked for functionality first)
        const date = new Date().toLocaleDateString();
        const title = prompt("Titolo (opzionale):", entry.title || '');
        const content = prompt("Contenuto:", entry.content || '');

        if (content !== null) {
            const newEntry = { date, title: title || '', content };
            if (idx !== null) {
                this.character.journal[idx] = newEntry;
            } else {
                this.character.journal.unshift(newEntry); // Newest first
            }
            Storage.saveCharacter(this.character);
            this.renderJournalTab(container);
        }
    }

    attachGlobalListeners(container) {
        // Close
        container.querySelector('#btn-close').addEventListener('click', () => {
            this.app.router.navigate('characters');
        });

        // Tab Switching
        container.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === this.activeTab) {
                btn.style.borderBottomColor = 'var(--accent-gold)';
                btn.style.color = 'var(--text-ink)';
            }

            btn.addEventListener('click', () => {
                this.activeTab = btn.dataset.tab;
                // Update styles
                container.querySelectorAll('.tab-btn').forEach(b => {
                    b.style.borderBottomColor = 'transparent';
                    b.style.color = 'var(--text-faded)';
                });
                btn.style.borderBottomColor = 'var(--accent-gold)';
                btn.style.color = 'var(--text-ink)';

                // Render content
                this.renderTabContent(container.querySelector('#tab-content'), this.activeTab);
            });
        });

        // Level Up
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
    }

    attachSheetListeners(container) {
        // Wealth Edit
        const wealthBtn = container.querySelector('#btn-edit-wealth');
        if (wealthBtn) {
            wealthBtn.addEventListener('click', () => {
                const val = prompt("Modifica Ricchezza:", this.character.wealth);
                if (val !== null) {
                    this.character.wealth = val; // String is fine for wealth (e.g. "100 G")
                    container.querySelector('#wealth-display').textContent = val;
                    Storage.saveCharacter(this.character);
                }
            });
        }

        // Hero Points Logic
        const hpVal = container.querySelector('#hp-val');
        if (hpVal) {
            container.querySelector('#hp-minus').addEventListener('click', () => {
                // In future: update this.character.heroPoints and save
                let val = parseInt(hpVal.textContent);
                if (val > 0) hpVal.textContent = --val;
            });
            container.querySelector('#hp-plus').addEventListener('click', () => {
                let val = parseInt(hpVal.textContent);
                hpVal.textContent = ++val;
            });
        }

        // Wounds Logic
        const wVal = container.querySelector('#w-val');
        if (wVal) {
            container.querySelector('#w-minus').addEventListener('click', () => {
                let val = parseInt(wVal.textContent);
                if (val > 0) wVal.textContent = --val;
            });
            container.querySelector('#w-plus').addEventListener('click', () => {
                let val = parseInt(wVal.textContent);
                wVal.textContent = ++val;
            });
        }
    }

    renderTraitSpot(trait) {
        const val = this.character.traits[trait];
        const label = this.translateTrait(trait);
        return `
            <div class="trait-spot">
                <span class="val">${val}</span>
                <span class="lbl">${label}</span>
            </div>
        `;
    }

    renderSkills() {
        // Only show skills with value > 0 for now, or all? Let's show all > 0
        const skills = Object.entries(this.character.skills)
            .filter(([_, val]) => val > 0)
            .map(([id, val]) => `
                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #ccc;">
                    <span>${this.translateSkill(id)}</span>
                    <strong>${val}</strong>
                </div>
            `);

        return skills.length ? skills.join('') : '<p style="font-style: italic; color: #888;">Nessuna abilità appresa.</p>';
    }



    translateTrait(trait) {
        const map = { 'brawn': 'Muscoli', 'finesse': 'Finezza', 'resolve': 'Risoluz.', 'wits': 'Acume', 'panache': 'Panache' };
        return map[trait] || trait;
    }

    translateSkill(skillId) {
        // Map common IDs to Italian names if data not loaded
        const fallbackMap = {
            'aim': 'Mira', 'athletics': 'Atletica', 'brawl': 'Rissa',
            'convince': 'Convincere', 'empathy': 'Empatia', 'hide': 'Nascondersi',
            'intimidate': 'Intimidire', 'notice': 'Notare', 'perform': 'Esibirsi',
            'ride': 'Cavalcare', 'sailing': 'Navigare', 'scholarship': 'Istruzione',
            'tempt': 'Allettare', 'theft': 'Furto', 'warfare': 'Arte della Guerra',
            'weaponry': 'Mischia'
        };
        return fallbackMap[skillId] || skillId.charAt(0).toUpperCase() + skillId.slice(1);
    }
}
