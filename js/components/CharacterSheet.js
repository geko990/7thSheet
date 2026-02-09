import { Storage } from '../storage.js';
import { Dice } from '../dice.js';
import { AuthService } from '../services/AuthService.js';
import { CampaignService } from '../services/CampaignService.js';
import { PasteHandler } from '../utils/PasteHandler.js';

export default class CharacterSheet {
    constructor(app) {
        this.app = app;
        this.character = null;
        this.dicePool = [];
        this.activeTab = 'sheet'; // sheet, equipment, inventory, journal
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
        if (!this.character.equipment) this.character.equipment = [];
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
        // Container cleanup: ensure we don't have double scrolling
        container.style.height = '100%';
        container.style.overflow = 'hidden';

        container.innerHTML = `
            <div class="card" style="position: relative; display: flex; flex-direction: column; overflow: hidden; padding: 0; margin: 0; border: none; background: transparent; height: 100%;">

                <!-- Tabs Nav -->
                <div class="tabs-nav" style="display: flex; border-bottom: 2px solid var(--border-worn); margin: 0; flex-shrink: 0; background: var(--bg-paper); padding-top: 10px;">
                    <button class="tab-btn active" data-tab="sheet">Scheda</button>
                    <button class="tab-btn" data-tab="equipment">Equip.</button>
                    <button class="tab-btn" data-tab="inventory">Borsa</button>
                    <button class="tab-btn" data-tab="journal">Diario</button>
                </div>

                <!-- Content Area -->
                <div id="tab-content" style="flex: 1; overflow-y: auto; padding: 15px 0 80px 0; -webkit-overflow-scrolling: touch;"></div>
            
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
                                <img src="assets/d10.png?v=0.9.32" alt="Lancia" class="d10-image">
                            </button>
                        </div>
                    </div>
                </div>

                <div id="sheet-tooltip" style="position: fixed; pointer-events: none; opacity: 0; transition: opacity 0.2s; z-index: 1000; padding: 15px; border-radius: 10px; max-width: 250px; text-align: left; font-size: 0.9rem;"></div>
                
                <!-- Generic Item/Entry Modal -->
                <div id="item-modal" class="modal-overlay" style="display: none; z-index: 2000;">
                    <div class="modal-content" style="width: 95%; max-width: 500px; height: 80vh; display: flex; flex-direction: column;">
                         <div id="item-modal-body" style="flex: 1; overflow-y: auto;"></div>
                         <div style="display: flex; gap: 10px; margin-top: 15px; flex-shrink: 0;">
                            <button id="btn-item-cancel" class="btn btn-secondary" style="flex: 1;">Annulla</button>
                            <button id="btn-item-save" class="btn btn-primary" style="flex: 1;">Salva</button>
                         </div>
                    </div>
                </div>
            </div>
            
            <style>
                .tab-btn {
                    flex: 1;
                    padding: 12px 5px;
                    background: none;
                    border: none;
                    border-bottom: 3px solid transparent;
                    font-family: var(--font-display);
                    font-size: 1rem;
                    color: var(--text-faded);
                    transition: all 0.2s;
                    cursor: pointer;
                }
                .tab-btn.active {
                    color: var(--text-ink);
                    border-bottom-color: var(--accent-gold);
                }
                .item-img {
                    width: 50px;
                    height: 50px;
                    border-radius: 8px;
                    background: #eee;
                    object-fit: cover;
                    margin-right: 15px;
                    flex-shrink: 0;
                }
            </style>
        `;

        this.renderTabContent(container.querySelector('#tab-content'), this.activeTab);
        this.attachGlobalListeners(container);
    }

    renderTabContent(container, tabName) {
        container.innerHTML = '';
        if (tabName === 'sheet') this.renderSheetTab(container);
        if (tabName === 'equipment') this.renderEquipmentTab(container);
        if (tabName === 'inventory') this.renderInventoryTab(container);
        if (tabName === 'journal') this.renderJournalTab(container);

        // Re-attach listeners for the new content
        if (tabName === 'sheet') this.attachSheetListeners(container);
        if (tabName === 'equipment') this.attachListListeners(container, 'equipment');
        if (tabName === 'inventory') this.attachListListeners(container, 'inventory');
        if (tabName === 'journal') this.attachListListeners(container, 'journal');
    }

    renderSheetTab(container) {
        container.innerHTML = `
                <!-- Character Header -->
                <div class="char-header text-center" style="margin-bottom: 20px; position: relative;">
                    <input type="file" id="sheet-image-upload" accept="image/*" style="display: none;">
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
                        <div class="avatar-edit-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s;">
                            <span style="color: white; font-size: 1.5rem;">✏️</span>
                            <span style="color: white; font-size: 0.6rem; margin-top: 2px;">Incolla (CTRL+V)</span>
                            <button id="btn-avatar-paste-mobile" style="pointer-events: auto; background: var(--bg-parchment); border: 1px solid white; border-radius: 50%; width: 30px; height: 30px; font-size: 1rem; margin-top: 5px; display: none;">📋</button>
                        </div>
                    </div>
                    <h2 class="page-title" style="margin-bottom: 0;">${this.character.name}</h2>
                    <div style="font-style: italic; color: var(--text-faded); margin-bottom: 15px;">
                        ${this.character.nation} • Livello <span id="lvl-display">${this.character.level || 1}</span>
                    </div>
                    
                    <!-- Cropper Modal -->
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
                    <div class="info-block details-trigger" id="details-trigger" style="cursor: pointer;">
                        <span class="info-label">Concetto ⓘ</span>
                        <span class="info-val" style="font-size: 0.9rem;">${this.character.concept || '-'}</span>
                    </div>
                     <div class="info-block wealth-block" id="wealth-block" style="text-align: center; cursor: pointer; border: 1px solid var(--border-worn); background: rgba(0,0,0,0.02);">
                        <span class="info-label" style="display: block; margin-bottom: 5px;">Ricchezza</span>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
                            <div style="display: flex; flex-direction: column; align-items: center;">
                                <span style="font-size: 1.2rem; color: #FFD700; margin-bottom: 2px;">●</span>
                                <span style="font-weight: bold; font-size: 0.9rem;">${this.character.wealth.gold || 0}</span>
                            </div>
                             <div style="display: flex; flex-direction: column; align-items: center;">
                                <span style="font-size: 1.2rem; color: #C0C0C0; margin-bottom: 2px;">●</span>
                                <span style="font-weight: bold; font-size: 0.9rem;">${this.character.wealth.silver || 0}</span>
                            </div>
                             <div style="display: flex; flex-direction: column; align-items: center;">
                                <span style="font-size: 1.2rem; color: #CD7F32; margin-bottom: 2px;">●</span>
                                <span style="font-weight: bold; font-size: 0.9rem;">${this.character.wealth.copper || 0}</span>
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
                    <div class="sheet-section-title">${this.character.edition === '1e' ? 'Vantaggi & Scuole' : 'Background & Vantaggi'}</div>
                    ${this.character.edition === '2e' && this.character.backgrounds ?
                `<div style="margin-bottom: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            ${this.character.backgrounds.map(bg => `<div class="interactive-text adv-pill" data-type="background" data-key="${bg.replace(/"/g, '&quot;')}" style="border: 1px solid var(--border-worn);">${bg}</div>`).join('')}
                        </div>` : ''}
                    
                    ${this.character.edition === '1e' && this.character.school ? `<p><strong>Scuola:</strong> ${this.character.school}</p>` : ''}
                    
                    <div style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        ${this.character.advantages ? this.character.advantages.map(adv => `<div class="interactive-text adv-pill" data-type="advantage" data-key="${adv.replace(/"/g, '&quot;')}" style="border: 1px solid transparent;">${adv}</div>`).join('') : ''}
                    </div>
                </div>
                
                <div class="text-center mt-20">
                     <button id="btn-lvl-up" style="background: linear-gradient(135deg, var(--accent-gold), #8a6d3b); color: white; border: none; padding: 12px 24px; font-family: var(--font-display); font-size: 1.1rem; border-radius: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">⚡ Level Up</button>
                </div>
        `;
    }

    renderEquipmentTab(container) {
        this.renderListTab(container, 'equipment', 'Equipaggiamento', this.character.equipment);
    }
    renderInventoryTab(container) {
        this.renderListTab(container, 'inventory', 'Borsa', this.character.inventory);
    }
    renderJournalTab(container) {
        this.renderListTab(container, 'journal', 'Diario', this.character.journal);
    }

    renderListTab(container, type, title, items) {
        const isJournal = type === 'journal';
        container.innerHTML = `
            <div class="sheet-section">
                ${items.length === 0 ? `<p style="font-style:italic; color:var(--text-faded); text-align:center;">${title} è vuoto.</p>` : ''}
                <div id="${type}-list" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                    ${items.map((item, idx) => `
                        <div class="swipe-item-container ${type}" data-idx="${idx}" style="position: relative; border-radius: 8px; overflow: hidden; min-height: ${isJournal ? '80px' : '70px'}; touch-action: pan-y;">
                            <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 100%; background: var(--accent-red); display: flex; justify-content: flex-end; align-items: center; padding-right: 20px; color: white;">🗑️ Elimina</div>
                            
                            <div class="list-item-content" style="position: relative; z-index: 10; background: ${isJournal ? '#fdfaf5' : 'white'}; display: flex; flex-direction: ${isJournal ? 'column' : 'row'}; align-items: ${isJournal ? 'stretch' : 'center'}; padding: 12px; border: 1px solid var(--border-worn); border-radius: 8px; transform: translate3d(0,0,0); transition: transform 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.05); min-height: 100%;">
                                ${!isJournal && item.image ? `<img src="${item.image}" class="item-img" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; margin-right: 15px;">` : ''}
                                
                                ${isJournal ? `
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                        <div style="font-weight: bold; font-family: var(--font-display); color: var(--accent-navy); font-size: 1.1rem;">${item.title || ''}</div>
                                        <div style="font-size: 0.75rem; color: var(--accent-gold); white-space: nowrap; margin-left: 10px;">${item.date || ''}</div>
                                    </div>
                                    <div style="font-family: var(--font-hand); font-size: 1.1rem; color: var(--text-ink); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;">
                                        ${item.content}
                                    </div>
                                ` : `
                                    <div style="flex: 1;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <strong style="font-size: 1.1rem;">${item.name}</strong>
                                            ${item.qty > 1 ? `<span style="background: var(--accent-gold); color: white; padding: 1px 6px; border-radius: 10px; font-size: 0.75rem;">×${item.qty}</span>` : ''}
                                        </div>
                                        ${item.notes ? `<div style="font-size: 0.85rem; color: var(--text-faded); margin-top: 4px;">${item.notes}</div>` : ''}
                                    </div>
                                    <div style="color: var(--text-faded); font-size: 1.2rem; margin-left: 10px;">✎</div>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-primary w-100" id="btn-add-${type}" style="border-radius: 25px; padding: 12px;">
                    ${isJournal ? '✍️ Scrivi Pagina' : '➕ Aggiungi Oggetto'}
                </button>
            </div>
        `;
    }

    attachListListeners(container, type) {
        // Add Button
        container.querySelector(`#btn-add-${type}`).addEventListener('click', () => {
            if (type === 'journal') this.openJournalModal();
            else this.openItemModal(type);
        });

        // Item Interactions
        const items = container.querySelectorAll('.swipe-item-container');
        items.forEach(el => {
            const idx = parseInt(el.dataset.idx);
            const content = el.querySelector('.list-item-content');
            let timer = null;
            let isLongPress = false;
            let startX, startY;

            // TOUCH START
            content.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isLongPress = false;
                timer = setTimeout(() => {
                    isLongPress = true;
                    navigator.vibrate?.(50);
                    this.openItemContextMenu(type, idx);
                }, 500);
            }, { passive: true });

            // TOUCH MOVE (Cancel long press if moved)
            content.addEventListener('touchmove', (e) => {
                const diffX = Math.abs(e.touches[0].clientX - startX);
                const diffY = Math.abs(e.touches[0].clientY - startY);
                if (diffX > 10 || diffY > 10) {
                    clearTimeout(timer);
                }
            }, { passive: true });

            // TOUCH END
            content.addEventListener('touchend', (e) => {
                clearTimeout(timer);
                if (isLongPress) {
                    e.preventDefault();
                }
            });

            // CLICK (Short Press)
            content.addEventListener('click', (e) => {
                if (isLongPress) return;
                this.openViewItemModal(type, idx);
            });

            // CONTEXT MENU (Desktop)
            content.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.openItemContextMenu(type, idx);
            });
        });
    }

    openItemContextMenu(type, idx) {
        // Simple Context Menu Modal
        const existingMenu = document.getElementById('ctx-menu-modal');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.id = 'ctx-menu-modal';
        menu.className = 'modal-overlay';
        menu.style.display = 'flex';
        menu.style.alignItems = 'center';
        menu.style.justifyContent = 'center';
        menu.style.background = 'rgba(0,0,0,0.6)';
        menu.style.zIndex = '10000';
        menu.style.backdropFilter = 'blur(2px)';

        const list = type === 'equipment' ? this.character.equipment : (type === 'inventory' ? this.character.inventory : this.character.journal);
        const item = list[idx];

        menu.innerHTML = `
            <div class="modal-content" style="width: 90%; max-width: 320px; background: #fdfaf5; border-radius: 16px; padding: 25px; text-align: center; border: 2px solid var(--accent-gold); box-shadow: 0 10px 40px rgba(0,0,0,0.5); transform: scale(0.9); animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;">
                <h3 style="margin-bottom: 20px; font-family: var(--font-display); font-size: 1.4rem; color: var(--accent-navy); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name || item.title || 'Opzioni'}</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button class="btn btn-primary" id="ctx-view" style="width: 100%; padding: 12px;">👁️ Mostra</button>
                    <button class="btn btn-secondary" id="ctx-edit" style="width: 100%; padding: 12px;">✏️ Modifica</button>
                    <button class="btn btn-secondary" id="ctx-delete" style="width: 100%; padding: 12px; color: var(--accent-red); border-color: var(--accent-red);">🗑️ Elimina</button>
                    <button class="btn btn-secondary" id="ctx-cancel" style="width: 100%; padding: 12px; margin-top: 5px;">Annulla</button>
                </div>
            </div>
            <style> @keyframes popIn { to { transform: scale(1); } } </style>
        `;

        document.body.appendChild(menu);

        menu.querySelector('#ctx-view').onclick = () => { menu.remove(); this.openViewItemModal(type, idx); };
        menu.querySelector('#ctx-edit').onclick = () => { menu.remove(); type === 'journal' ? this.openJournalModal(idx) : this.openItemModal(type, idx); };
        menu.querySelector('#ctx-delete').onclick = () => {
            menu.remove();
            if (confirm("Eliminare definitivamente?")) {
                list.splice(idx, 1);
                Storage.saveCharacter(this.character);
                this.renderTabContent(document.querySelector('#tab-content'), type);
            }
        };
        menu.querySelector('#ctx-cancel').onclick = () => menu.remove();
        menu.onclick = (e) => { if (e.target === menu) menu.remove(); };
    }

    openWealthModal(container) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.background = 'rgba(0,0,0,0.8)';
        modal.style.zIndex = '20000';
        modal.style.backdropFilter = 'blur(4px)';

        const createSelect = (curr, max) => {
            let html = `<select class="wealth-select" style="font-size: 1.2rem; padding: 10px; border-radius: 8px; border: 1px solid var(--accent-gold); background: #fdfaf5; width: 100%;">`;
            for (let i = 0; i <= max; i++) html += `<option value="${i}" ${i === curr ? 'selected' : ''}>${i}</option>`;
            html += `</select>`;
            return html;
        };

        modal.innerHTML = `
            <div class="modal-content" style="width: 90%; max-width: 350px; background: #fdfaf5; border-radius: 16px; padding: 25px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); text-align: center;">
                <h3 style="margin-bottom: 20px; font-family: var(--font-display); color: var(--accent-navy);">Gestione Ricchezza</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        <span style="color: #FFD700; font-size: 1.5rem; margin-bottom: 5px;">●</span>
                        <input type="number" id="w-gold" value="${this.character.wealth.gold}" min="0" max="1000" style="width: 100%; border-radius: 8px; border: 1px solid var(--accent-gold); padding: 10px; font-size: 1.2rem; text-align: center; background: #fff;">
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        <span style="color: #C0C0C0; font-size: 1.5rem; margin-bottom: 5px;">●</span>
                        ${createSelect(this.character.wealth.silver, 9)}
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        <span style="color: #CD7F32; font-size: 1.5rem; margin-bottom: 5px;">●</span>
                        ${createSelect(this.character.wealth.copper, 9)}
                    </div>
                </div>

                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary" id="btn-wealth-cancel" style="flex: 1;">Annulla</button>
                    <button class="btn btn-primary" id="btn-wealth-save" style="flex: 1;">Salva</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const sSelect = modal.querySelectorAll('select')[0];
        const cSelect = modal.querySelectorAll('select')[1];
        const gInput = modal.querySelector('#w-gold');

        modal.querySelector('#btn-wealth-cancel').onclick = () => modal.remove();
        modal.querySelector('#btn-wealth-save').onclick = () => {
            const g = parseInt(gInput.value) || 0;
            const s = parseInt(sSelect.value) || 0;
            const c = parseInt(cSelect.value) || 0;

            this.character.wealth = { gold: g, silver: s, copper: c };
            Storage.saveCharacter(this.character);
            this.renderTabContent(container.parentElement, 'sheet'); // Refresh Sheet Tab
            modal.remove();
        };
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }

    openViewItemModal(type, idx) {
        const list = type === 'equipment' ? this.character.equipment : (type === 'inventory' ? this.character.inventory : this.character.journal);
        const item = list[idx];
        const isJournal = type === 'journal';

        // Helper to close
        const close = () => {
            const overlay = document.getElementById('view-modal-overlay');
            if (overlay) overlay.remove();
        };

        const overlay = document.createElement('div');
        overlay.id = 'view-modal-overlay';
        overlay.className = 'modal-overlay';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.background = 'rgba(0,0,0,0.8)';
        overlay.style.zIndex = '10000';
        overlay.style.backdropFilter = 'blur(5px)';

        overlay.onclick = (e) => { if (e.target === overlay) close(); };

        const imageHtml = item.image ?
            `<div style="width: 100%; height: 200px; background-image: url('${item.image}'); background-size: cover; background-position: center; border-bottom: 2px solid var(--accent-gold);"></div>` : '';

        const contentHtml = isJournal ? `
            <div style="font-size: 0.85rem; color: var(--text-faded); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; text-align: right; border-bottom: 1px solid var(--border-worn); padding-bottom: 5px;">${item.date || ''}</div>
            ${item.title ? `<h2 style="font-family: var(--font-display); color: var(--accent-navy); font-size: 1.8rem; margin-bottom: 20px; text-align: center;">${item.title}</h2>` : ''}
            <div style="font-family: var(--font-hand); font-size: 1.3rem; line-height: 1.6; color: var(--text-ink); text-align: justify; white-space: pre-wrap;">${item.content || ''}</div>
        ` : `
            <h2 style="font-family: var(--font-display); color: var(--accent-navy); font-size: 1.8rem; margin-bottom: 5px; text-align: center;">${item.name}</h2>
            ${item.qty > 1 ? `<div style="text-align: center; margin-bottom: 15px;"><span style="background: var(--accent-gold); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.9rem;">Quantità: ${item.qty}</span></div>` : ''}
            <div style="font-family: var(--font-serif); font-size: 1.1rem; line-height: 1.5; color: var(--text-ink); margin-top: 15px; border-top: 1px solid var(--border-worn); padding-top: 15px;">${item.notes || 'Nessuna descrizione.'}</div>
        `;

        overlay.innerHTML = `
            <div class="modal-content" style="width: 90%; max-width: 450px; background: #fdfaf5; border-radius: 16px; overflow: hidden; box-shadow: 0 15px 50px rgba(0,0,0,0.6); animation: slideUp 0.3s ease-out;">
                ${imageHtml}
                <div style="padding: 30px; max-height: 60vh; overflow-y: auto;">
                    ${contentHtml}
                </div>
                <div style="padding: 15px; background: rgba(0,0,0,0.03); text-align: center; border-top: 1px solid var(--border-worn);">
                    <button id="btn-close-view" class="btn btn-primary" style="padding: 10px 40px; border-radius: 25px;">Chiudi</button>
                </div>
            </div>
            <style> @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } </style>
        `;

        document.body.appendChild(overlay);
        overlay.querySelector('#btn-close-view').onclick = close;
    }

    openViewImageModal(imageUrl) {
        const close = () => {
            const overlay = document.getElementById('view-image-overlay');
            if (overlay) overlay.remove();
        };

        const overlay = document.createElement('div');
        overlay.id = 'view-image-overlay';
        overlay.className = 'modal-overlay';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.background = 'rgba(0,0,0,0.9)'; // Darker background for image view
        overlay.style.zIndex = '20000';
        overlay.style.backdropFilter = 'blur(5px)';
        overlay.onclick = (e) => { if (e.target === overlay) close(); };

        overlay.innerHTML = `
            <div class="modal-content" style="background: transparent; box-shadow: none; padding: 0; max-width: 90%; max-height: 90%; position: relative; animation: zoomIn 0.2s ease-out;">
                <img src="${imageUrl}" style="max-width: 100%; max-height: 80vh; border-radius: 8px; box-shadow: 0 0 20px rgba(0,0,0,0.5); object-fit: contain;">
                <button id="btn-close-image" style="position: absolute; top: -40px; right: 0; background: none; border: none; color: white; font-size: 2rem; cursor: pointer;">&times;</button>
            </div>
            <style> @keyframes zoomIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } } </style>
        `;

        document.body.appendChild(overlay);
        overlay.querySelector('#btn-close-image').onclick = close;
    }

    openItemModal(type, idx = null) {
        const list = type === 'equipment' ? this.character.equipment : this.character.inventory;
        const item = idx !== null ? list[idx] : { name: '', qty: 1, notes: '', image: '' };

        const modal = document.querySelector('#item-modal');
        const body = document.querySelector('#item-modal-body');
        const btnSave = document.querySelector('#btn-item-save');
        const btnCancel = document.querySelector('#btn-item-cancel');

        body.innerHTML = `
            <h3 class="text-center" style="color: var(--accent-gold);">${idx !== null ? 'Modifica' : 'Nuovo'} Oggetto</h3>
            
            <div style="text-align: center; margin-bottom: 20px;">
                <label for="item-img-upload" style="display: inline-block; width: 100px; height: 100px; background: #eee; border-radius: 12px; overflow: hidden; position: relative; cursor: pointer; border: 2px dashed #ccc;">
                    <img id="item-img-preview" src="${item.image || ''}" style="width: 100%; height: 100%; object-fit: cover; display: ${item.image ? 'block' : 'none'};">
                    <span id="item-img-placeholder" style="display: ${item.image ? 'none' : 'flex'}; height: 100%; align-items: center; justify-content: center; font-size: 2rem;">📷</span>
                    <div style="position: absolute; bottom: 0; width: 100%; background: rgba(0,0,0,0.5); color: white; font-size: 0.7rem; padding: 2px;">MODIFICA</div>
                </label>
                <input type="file" id="item-img-upload" accept="image/*" style="display: none;">
                <input type="text" id="item-img-url" placeholder="Incolla URL immagine..." style="width: 100%; margin-top: 5px; font-size: 0.8rem; padding: 5px;">
            </div>

            <div class="input-field mb-10">
                <input type="text" id="item-name" placeholder="Nome Oggetto" value="${item.name}" style="width: 100%; padding: 10px;">
            </div>

            <div class="input-field mb-10">
                <label style="font-size: 0.9rem;">Quantità:</label>
                <input type="number" id="item-qty" value="${item.qty}" min="1" style="width: 80px; padding: 8px;">
            </div>

            <div class="input-field">
                <textarea id="item-notes" placeholder="Descrizione..." style="width: 100%; height: 120px; padding: 10px;">${item.notes}</textarea>
            </div>
        `;

        // Image Preview Logic
        const imgInput = body.querySelector('#item-img-upload');
        const urlInput = body.querySelector('#item-img-url');
        const preview = body.querySelector('#item-img-preview');
        const placeholder = body.querySelector('#item-img-placeholder');

        let currentImage = item.image;

        imgInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                // Try upload if online
                const { publicUrl, error } = await CampaignService.uploadImage(file);
                if (!error && publicUrl) {
                    currentImage = publicUrl;
                } else {
                    // Fallback to base64
                    const reader = new FileReader();
                    reader.onload = (ev) => { currentImage = ev.target.result; renderImg(); };
                    reader.readAsDataURL(file);
                    return;
                }
                renderImg();
            }
        });

        urlInput.addEventListener('input', (e) => {
            if (e.target.value) {
                currentImage = e.target.value;
                renderImg();
            }
        });

        const renderImg = () => {
            preview.src = currentImage;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        };

        const saveHandler = () => {
            const name = body.querySelector('#item-name').value;
            if (!name) return alert("Inserisci un nome.");

            const newItem = {
                name,
                qty: parseInt(body.querySelector('#item-qty').value) || 1,
                notes: body.querySelector('#item-notes').value,
                image: currentImage
            };

            if (idx !== null) list[idx] = newItem;
            else list.push(newItem);

            Storage.saveCharacter(this.character);
            this.renderTabContent(document.querySelector('#tab-content'), type);
            modal.style.display = 'none';
        };

        btnSave.onclick = saveHandler;
        btnCancel.onclick = () => modal.style.display = 'none';
        modal.style.display = 'flex';
    }

    openJournalModal(idx = null) {
        const entry = idx !== null ? this.character.journal[idx] : { title: '', content: '', image: '', date: new Date().toLocaleDateString() };

        const modal = document.querySelector('#item-modal');
        const body = document.querySelector('#item-modal-body');
        const btnSave = document.querySelector('#btn-item-save');
        const btnCancel = document.querySelector('#btn-item-cancel');

        body.innerHTML = `
            <h3 class="text-center" style="color: var(--accent-gold);">${idx !== null ? 'Modifica' : 'Nuova'} Pagina</h3>
            
            <div style="text-align: center; margin-bottom: 20px;">
                 <label for="j-img-upload" style="display: inline-block; width: 100%; height: 120px; background: #eee; border-radius: 8px; overflow: hidden; position: relative; cursor: pointer; border: 2px dashed #ccc;">
                    <img id="j-img-preview" src="${entry.image || ''}" style="width: 100%; height: 100%; object-fit: cover; display: ${entry.image ? 'block' : 'none'};">
                    <span id="j-img-placeholder" style="display: ${entry.image ? 'none' : 'flex'}; height: 100%; align-items: center; justify-content: center; color: #888;">Agigiungi Immagine (Opzionale)</span>
                </label>
                <input type="file" id="j-img-upload" accept="image/*" style="display: none;">
                <input type="text" id="j-img-url" placeholder="Incolla URL immagine..." style="width: 100%; margin-top: 5px; font-size: 0.8rem; padding: 5px;">
            </div>

            <div class="input-field mb-10">
                <input type="text" id="j-title" placeholder="Titolo (es. L'incontro al porto)" value="${entry.title}" style="width: 100%; padding: 10px; font-weight: bold;">
            </div>
             <div class="input-field mb-10">
                <input type="text" id="j-date" value="${entry.date}" style="width: 100%; padding: 10px; color: var(--text-faded);">
            </div>

            <div class="input-field">
                <textarea id="j-content" placeholder="Caro diario..." style="width: 100%; height: 300px; padding: 10px; font-family: var(--font-hand); font-size: 1.1rem; line-height: 1.5;">${entry.content}</textarea>
            </div>
        `;

        // Image Logic (Shared or Copied)
        const imgInput = body.querySelector('#j-img-upload');
        const urlInput = body.querySelector('#j-img-url');
        const preview = body.querySelector('#j-img-preview');
        const placeholder = body.querySelector('#j-img-placeholder');
        let currentImage = entry.image;

        imgInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const { publicUrl, error } = await CampaignService.uploadImage(file);
                if (!error && publicUrl) currentImage = publicUrl;
                else { /* fallback */
                    const reader = new FileReader();
                    reader.onload = (ev) => { currentImage = ev.target.result; renderImg(); };
                    reader.readAsDataURL(file);
                    return;
                }
                renderImg();
            }
        });
        urlInput.addEventListener('input', (e) => { if (e.target.value) { currentImage = e.target.value; renderImg(); } });
        const renderImg = () => { preview.src = currentImage; preview.style.display = 'block'; placeholder.style.display = 'none'; };

        const saveHandler = () => {
            const content = body.querySelector('#j-content').value;
            if (!content) return alert("Scrivi qualcosa!");

            const newEntry = {
                title: body.querySelector('#j-title').value,
                date: body.querySelector('#j-date').value,
                content,
                image: currentImage
            };

            if (idx !== null) this.character.journal[idx] = newEntry;
            else this.character.journal.unshift(newEntry);

            Storage.saveCharacter(this.character);
            this.renderTabContent(document.querySelector('#tab-content'), 'journal');
            modal.style.display = 'none';
        };

        btnSave.onclick = saveHandler;
        btnCancel.onclick = () => modal.style.display = 'none';
        modal.style.display = 'flex';
    }

    // ... Helpers ...
    translateTrait(trait) { return this.descriptions[trait] ? this.descriptions[trait].split(':')[0] : trait; }
    translateSkill(skillId) { return this.skillMap[skillId] || skillId; }
    translateKey(key) { return this.translateTrait(key) || this.translateSkill(key) || key; }
    renderTraitSpot(trait) {
        const val = this.character.traits[trait];
        const label = { 'brawn': 'Muscoli', 'finesse': 'Finezza', 'resolve': 'Risoluz.', 'wits': 'Acume', 'panache': 'Panache' }[trait] || trait;
        return `<div class="trait-spot"><span class="val interactive-stat" data-type="trait" data-key="${trait}" data-val="${val}">${val}</span><span class="lbl interactive-label" data-type="trait" data-key="${trait}">${label}</span></div>`;
    }
    renderSkills() {
        const skills = Object.entries(this.character.skills).filter(([_, v]) => v > 0).map(([id, val]) => `
             <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #ccc; align-items: center;">
                 <span class="interactive-label" data-type="skill" data-key="${id}">${this.translateSkill(id)}</span>
                 <strong class="interactive-stat" data-type="skill" data-key="${id}" data-val="${val}" style="background: var(--bg-paper-dark); padding: 2px 8px; border-radius: 10px; cursor: pointer;">${val}</strong>
             </div>
         `);
        return skills.length ? skills.join('') : '<p style="font-style: italic; color: #888;">Nessuna abilità appresa.</p>';
    }

    // ... Global Listeners, Swipe for Page, Dice etc ...
    attachGlobalListeners(container) {
        // Tab Clicks
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state in UI immediately
                container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeTab = btn.dataset.tab;
                this.renderTabContent(container.querySelector('#tab-content'), this.activeTab);
            });
        });

        // Dice FAB
        if (container.querySelector('#dice-fab')) {
            container.querySelector('#btn-pool-reset')?.addEventListener('click', () => { this.dicePool = []; this.updateDiceFab(); });
            container.querySelector('#btn-pool-add')?.addEventListener('click', () => this.addToPool(1, 'Bonus'));
            container.querySelector('#btn-pool-roll')?.addEventListener('click', () => this.rollDicePool());
            container.querySelector('#btn-close-dice')?.addEventListener('click', () => { document.querySelector('#dice-overlay').style.display = 'none'; this.dicePool = []; this.updateDiceFab(); });
        }

        // Swipe Page
        const contentArea = container.querySelector('#tab-content');
        let startX = 0; let startY = 0;
        contentArea.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
        contentArea.addEventListener('touchend', (e) => {
            if (this.itemSwiping) return;
            const diffX = e.changedTouches[0].clientX - startX;
            const diffY = e.changedTouches[0].clientY - startY;
            if (Math.abs(diffX) > 60 && Math.abs(diffY) < 50) {
                const tabs = ['sheet', 'equipment', 'inventory', 'journal'];
                let idx = tabs.indexOf(this.activeTab);
                if (diffX > 0 && idx > 0) idx--;
                else if (diffX < 0 && idx < tabs.length - 1) idx++;

                const newTab = tabs[idx];
                if (newTab !== this.activeTab) {
                    this.activeTab = newTab;
                    container.querySelectorAll('.tab-btn').forEach(b => {
                        b.classList.toggle('active', b.dataset.tab === newTab);
                    });
                    this.renderTabContent(contentArea, newTab);
                }
            }
        });
    }

    addToPool(val, source) { this.dicePool.push({ val, source }); this.updateDiceFab(); }
    updateDiceFab() {
        const fab = document.querySelector('#dice-fab');
        if (!fab) return;
        if (this.dicePool.length === 0) fab.style.display = 'none';
        else {
            fab.style.display = 'flex';
            document.querySelector('#dice-pool-list').innerHTML = this.dicePool.map(d => `<div>${d.source}: <strong style="color:var(--accent-gold);">+${d.val}</strong></div>`).join('');
            document.querySelector('#dice-pool-total').textContent = this.dicePool.reduce((a, b) => a + b.val, 0);
        }
    }
    rollDicePool() {
        const total = this.dicePool.reduce((a, b) => a + b.val, 0);
        if (total === 0) return;
        const results = Dice.roll(total);
        const raises = Dice.calculateRaises(results).raises;

        document.querySelector('#dice-results').innerHTML = results.map(r => `<div class="die ${r >= 10 ? 'crit' : ''}" style="width:50px;height:50px;background:${r === 10 ? 'var(--accent-gold)' : '#fff'};border:2px solid #ccc;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.4rem;color:${r === 10 ? '#fff' : '#000'};border-radius:8px;">${r}</div>`).join('');
        document.querySelector('#dice-summary').innerHTML = `Incrementi: <span style="color:var(--accent-gold);font-size:2rem;">${raises}</span>`;
        document.querySelector('#dice-overlay').style.display = 'flex';
    }

    showTooltip(type, key, x, y, targetElement = null) {
        let text = key;
        if (type === 'trait' || type === 'skill') text = this.descriptions[key] || key;
        else if (type === 'advantage') {
            const adv = this.advantagesData.find(a => a.name === key);
            text = adv ? `(${adv.cost} PE) ${adv.description}` : key;
        } else if (type === 'background') {
            const bg = this.backgroundsData.find(b => b.name === key);
            text = bg ? `<em>${bg.quirk}</em>` : key;
        }

        const t = document.querySelector('#sheet-tooltip');
        t.innerHTML = text;
        t.style.opacity = 0;
        t.style.display = 'block';

        const rect = t.getBoundingClientRect();
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        let left, top;

        if (targetElement) {
            const targetRect = targetElement.getBoundingClientRect();
            left = targetRect.left + (targetRect.width / 2) - (rect.width / 2);
            top = targetRect.top - rect.height - 10;
            if (top < 10) top = targetRect.bottom + 10;
        } else {
            left = x - (rect.width / 2);
            top = y - rect.height - 20;
            if (top < 10) top = y + 20;
        }

        if (left < 10) left = 10;
        if (left + rect.width > winW - 10) left = winW - rect.width - 10;

        t.style.left = left + 'px';
        t.style.top = top + 'px';
        t.style.opacity = 1;

        const dismiss = () => { t.style.opacity = 0; setTimeout(() => t.style.display = 'none', 200); document.removeEventListener('touchstart', dismiss); document.removeEventListener('click', dismiss); };
        setTimeout(() => { document.addEventListener('touchstart', dismiss, { once: true }); document.addEventListener('click', dismiss, { once: true }); }, 100);
    }





    showDetailsPopup() {
        const popup = document.createElement('div');
        popup.className = 'details-popup-overlay';

        // Arcana logic
        let arcanaContent = '';
        if (this.character.edition === '2e') {
            arcanaContent = `
                <div class="popup-section">
                    <h3 class="popup-subtitle">Arcano</h3>
                    <div class="popup-row"><span class="popup-label">Virtù:</span><span class="popup-value">${this.character.virtue || '-'}</span></div>
                    <div class="popup-row"><span class="popup-label">Hubris:</span><span class="popup-value">${this.character.hubris || '-'}</span></div>
                </div>`;
        } else {
            arcanaContent = `
                <div class="popup-section">
                    <h3 class="popup-subtitle">Arcano</h3>
                     <div class="popup-row"><span class="popup-value">${this.character.arcana || '-'}</span></div>
                </div>`;
        }

        popup.innerHTML = `
            <div class="details-popup-card">
                <button class="btn-close-popup">×</button>
                <h2 class="popup-title">Dettagli Eroe</h2>
                <div class="popup-content">
                    <div class="popup-section">
                        <h3 class="popup-subtitle">Identità</h3>
                        <div class="popup-row"><span class="popup-label">Religione:</span><span class="popup-value">${this.character.religion || '-'}</span></div>
                         <div class="popup-row"><span class="popup-label">Concetto:</span><span class="popup-value">${this.character.concept || '-'}</span></div>
                    </div>
                    ${arcanaContent}
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        popup.querySelector('.btn-close-popup').onclick = () => popup.remove();
        popup.onclick = (e) => { if (e.target === popup) popup.remove(); };
    }

    openAvatarContextMenu() {
        // Remove existing if any
        const existing = document.getElementById('ctx-avatar-menu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.id = 'ctx-avatar-menu';
        menu.className = 'modal-overlay';
        menu.style.display = 'flex';
        menu.style.alignItems = 'center';
        menu.style.justifyContent = 'center';
        menu.style.background = 'rgba(0,0,0,0.6)';
        menu.style.zIndex = '10000';
        menu.style.backdropFilter = 'blur(2px)';

        menu.innerHTML = `
            <div class="modal-content" style="width: 280px; background: #fff; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <h3 style="margin-bottom: 15px; font-family: var(--font-display); color: var(--accent-navy);">Opzioni Avatar</h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button class="btn btn-primary" id="ctx-av-upload">📁 Carica Foto</button>
                    <button class="btn btn-secondary" id="ctx-av-url">🔗 Incolla URL</button>
                    ${this.character.image ? `<button class="btn btn-secondary" id="ctx-av-remove" style="color: var(--accent-red); border-color: var(--accent-red);">🗑️ Rimuovi Foto</button>` : ''}
                    <button class="btn btn-secondary" id="ctx-av-cancel" style="margin-top: 5px;">Annulla</button>
                </div>
            </div>
        `;

        document.body.appendChild(menu);

        menu.querySelector('#ctx-av-upload').onclick = () => {
            menu.remove();
            document.getElementById('sheet-image-upload')?.click();
        };

        menu.querySelector('#ctx-av-url').onclick = () => {
            menu.remove();
            const url = prompt("Incolla l'URL dell'immagine:");
            if (url) {
                // Pre-load to check validity (optional) or just crop
                // For simplicity, we can load it into cropper directly if we want cropping, or just save.
                // Let's pass it to cropper?
                // The cropper expects a file reader result usually, but we can hack it.
                // Or just set it directly. Let's set it directly for now, user can crop if they upload. 
                // Wait, user complained about "white image" after change. Best to use cropper if possible?
                // Let's just set it.
                this.character.image = url;
                Storage.saveCharacter(this.character);
                this.render();
            }
        };

        if (this.character.image) {
            menu.querySelector('#ctx-av-remove').onclick = () => {
                if (confirm("Rimuovere l'immagine attuale?")) {
                    this.character.image = null;
                    Storage.saveCharacter(this.character);
                    this.render();
                    menu.remove();
                }
            };
        }

        menu.querySelector('#ctx-av-cancel').onclick = () => menu.remove();
        menu.onclick = (e) => { if (e.target === menu) menu.remove(); };
    }

    attachSheetListeners(container) {
        const wealthBlock = container.querySelector('#wealth-block');
        if (wealthBlock) wealthBlock.addEventListener('click', () => {
            this.openWealthModal(container);
        });

        const detailsTrigger = container.querySelector('#details-trigger');
        if (detailsTrigger) detailsTrigger.addEventListener('click', () => this.showDetailsPopup());

        const lvlBtn = container.querySelector('#btn-lvl-up');
        if (lvlBtn) lvlBtn.addEventListener('click', () => {
            const l = prompt("Nuovo Livello:", this.character.level || 1);
            if (l) { this.character.level = parseInt(l); document.querySelector('#lvl-display').textContent = l; Storage.saveCharacter(this.character); }
        });

        const hpVal = container.querySelector('#hp-val');
        if (hpVal) {
            container.querySelector('#hp-minus').addEventListener('click', () => { let v = parseInt(hpVal.textContent); if (v > 0) { hpVal.textContent = --v; this.character.heroPoints = v; Storage.saveCharacter(this.character); } });
            container.querySelector('#hp-plus').addEventListener('click', () => { let v = parseInt(hpVal.textContent); hpVal.textContent = ++v; this.character.heroPoints = v; Storage.saveCharacter(this.character); });
        }

        const wVal = container.querySelector('#w-val');
        if (wVal) {
            container.querySelector('#w-minus').addEventListener('click', () => { let v = parseInt(wVal.textContent); if (v > 0) { wVal.textContent = --v; this.character.wounds = v; Storage.saveCharacter(this.character); } });
            container.querySelector('#w-plus').addEventListener('click', () => { let v = parseInt(wVal.textContent); wVal.textContent = ++v; this.character.wounds = v; Storage.saveCharacter(this.character); });
        }

        container.querySelectorAll('.interactive-label, .interactive-text').forEach(el => {
            el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.showTooltip(el.dataset.type, el.dataset.key, e.clientX, e.clientY); });
        });

        container.querySelectorAll('.interactive-stat').forEach(el => {
            el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.addToPool(parseInt(el.dataset.val), this.translateKey(el.dataset.key)); });
        });

        // AVATAR        // Image Upload
        // AVATAR INTERACTIONS
        const avatarContainer = container.querySelector('.char-sheet-avatar-container');
        const fileInput = container.querySelector('#sheet-image-upload');

        if (avatarContainer && fileInput) {
            let timer = null;
            let isLongPress = false;
            let startX, startY;

            const handleSingleTap = () => {
                if (this.character.image) {
                    this.openViewImageModal(this.character.image);
                } else {
                    this.openAvatarContextMenu(); // Or just trigger upload? Context menu is better for options
                }
            };

            const handleLongPress = () => {
                navigator.vibrate?.(50);
                this.openAvatarContextMenu();
            };

            // MOUSE (Desktop)
            avatarContainer.addEventListener('click', (e) => {
                if (isLongPress) return;
                handleSingleTap();
            });

            avatarContainer.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.openAvatarContextMenu();
            });

            // TOUCH (Mobile)
            avatarContainer.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isLongPress = false;
                timer = setTimeout(() => {
                    isLongPress = true;
                    handleLongPress();
                }, 500);
            }, { passive: true });

            avatarContainer.addEventListener('touchmove', (e) => {
                const diffX = Math.abs(e.touches[0].clientX - startX);
                const diffY = Math.abs(e.touches[0].clientY - startY);
                if (diffX > 10 || diffY > 10) clearTimeout(timer);
            }, { passive: true });

            avatarContainer.addEventListener('touchend', (e) => {
                clearTimeout(timer);
                if (isLongPress) e.preventDefault();
            });
        }

        // CROPPER LOGIC
        const cropperOverlay = container.querySelector('#sheet-cropper-overlay');
        const cropperImg = container.querySelector('#sheet-cropper-img');
        const cropperMask = container.querySelector('#sheet-cropper-mask');
        const zoomSlider = container.querySelector('#sheet-cropper-zoom');
        const btnCancel = container.querySelector('#btn-sheet-cancel-crop');
        const btnConfirm = container.querySelector('#btn-sheet-confirm-crop');

        let cropState = { img: null, scale: 1, posX: 0, posY: 0, isDragging: false, lastX: 0, lastY: 0 };

        // CSS uses translate(-50%, -50%) to center by default. We add our offsets to that.
        const updateCropperTransform = () => {
            if (cropperImg) {
                // We combine the centering translate with the user's drag offset
                cropperImg.style.transform = `translate(calc(-50% + ${cropState.posX}px), calc(-50% + ${cropState.posY}px)) scale(${cropState.scale})`;
            }
        };

        if (fileInput) {
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        const img = new Image();
                        img.onload = () => {
                            cropState.img = img;
                            cropperImg.src = img.src;

                            // Initialize logic: fit shortest side to container (COVER strategy)
                            const containerSize = 300;
                            const scaleX = containerSize / img.width;
                            const scaleY = containerSize / img.height;
                            let startScale = Math.max(scaleX, scaleY);

                            if (startScale < 0.1) startScale = 0.1;

                            cropState.scale = startScale;
                            cropState.posX = 0;
                            cropState.posY = 0;

                            // Setup Slider
                            zoomSlider.min = (startScale * 0.5).toString();
                            zoomSlider.max = (startScale * 3).toString();
                            zoomSlider.step = (startScale * 0.1).toString();
                            zoomSlider.value = startScale;

                            updateCropperTransform();
                            cropperOverlay.style.display = 'flex';
                        };
                        img.onerror = () => alert("Errore caricamento immagine.");
                        img.src = evt.target.result;
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            };
        }
        reader.readAsDataURL(file);
    }
                e.target.value = ''; // Reset input
};
        }

if (cropperMask) {
    const startDrag = (x, y) => { cropState.isDragging = true; cropState.lastX = x; cropState.lastY = y; };
    const moveDrag = (x, y) => {
        if (cropState.isDragging && cropperOverlay.style.display === 'flex') {
            cropState.posX += x - cropState.lastX;
            cropState.posY += y - cropState.lastY;
            cropState.lastX = x;
            cropState.lastY = y;
            updateCropperTransform();
        }
    };

    cropperMask.addEventListener('mousedown', (e) => { startDrag(e.clientX, e.clientY); e.preventDefault(); });
    window.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => cropState.isDragging = false);

    cropperMask.addEventListener('touchstart', (e) => {
        if (cropperOverlay.style.display === 'flex') {
            startDrag(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (cropState.isDragging && cropperOverlay.style.display === 'flex') {
            moveDrag(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        }
    }, { passive: false });

    window.addEventListener('touchend', () => cropState.isDragging = false);
}

if (zoomSlider) zoomSlider.addEventListener('input', (e) => { cropState.scale = parseFloat(e.target.value); updateCropperTransform(); });

if (btnCancel) btnCancel.onclick = () => { cropperOverlay.style.display = 'none'; cropState.img = null; };

if (btnConfirm) btnConfirm.onclick = () => {
    if (!cropState.img) return;

    const canvas = document.createElement('canvas');
    const size = 300; // Increased resolution
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // White background (optional, but good for transparency)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    // Center Canvas
    ctx.translate(size / 2, size / 2);
    // Translate Image Position
    ctx.translate(cropState.posX, cropState.posY);
    // Scale
    ctx.scale(cropState.scale, cropState.scale);
    // Draw Image Centered
    ctx.drawImage(cropState.img, -cropState.img.width / 2, -cropState.img.height / 2);
    ctx.restore();

    this.character.image = canvas.toDataURL('image/jpeg', 0.85);
    Storage.saveCharacter(this.character);
    this.render(); // Re-render whole sheet to update avatar
    cropperOverlay.style.display = 'none';
};
    }

render() {
    this.renderCharacter(this.character.id).then(div => {
        const old = document.querySelector('.character-sheet-container');
        if (old && old.parentNode) old.parentNode.replaceChild(div, old);
        else this.app.container.appendChild(div);
    });
}
}
