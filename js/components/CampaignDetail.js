import { AuthService } from '../services/AuthService.js';
import { CampaignService } from '../services/CampaignService.js';

export class CampaignDetail {
    constructor(app) {
        this.app = app;
        this.container = null;
        this.campaignId = null;
        this.campaign = null;
        this.currentTab = 'story'; // 'story' | 'characters'
    }

    async render(container, campaignId) {
        this.container = container;
        this.campaignId = campaignId;

        this.container.innerHTML = '<div class="text-center p-20">Caricamento avventura...</div>';

        const { data, error } = await CampaignService.getCampaignDetails(campaignId);

        if (error) {
            this.container.innerHTML = `<div class="text-center p-20" style="color: var(--accent-red)">Errore: ${error.message}</div>`;
            return;
        }

        this.campaign = data;

        // Determine my role
        const myId = AuthService.user?.id;
        this.myRole = this.campaign.members.find(m => m.user_id === myId)?.role || 'player';

        this.renderView();
    }

    renderView() {
        if (!this.campaign) return;

        this.container.innerHTML = `
            <div class="campaign-detail-container" style="padding-bottom: 80px;">
                <!-- Header -->
                <div class="campaign-header text-center" style="padding: 20px; background: rgba(0,0,0,0.1); border-bottom: 1px solid var(--border-color);">
                    <button id="btn-back" class="btn btn-secondary btn-sm" style="position: absolute; left: 15px; top: 15px;">⬅ Torna</button>
                    <h2 class="page-title" style="margin-top: 20px;">${this.campaign.title}</h2>
                    ${this.myRole === 'gm' ? `
                        <div style="font-size: 0.9rem; color: var(--text-faded); margin-top: 5px;">
                            Codice Invito: <span style="font-family: monospace; background: rgba(255,255,255,0.2); padding: 2px 5px; border-radius: 4px;">${this.campaign.join_code}</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Tabs -->
                <div class="tabs-nav" style="display: flex; justify-content: space-around; padding: 10px; border-bottom: 1px solid var(--border-color);">
                    <button class="nav-tab ${this.currentTab === 'story' ? 'active' : ''}" data-tab="story" style="background: none; border: none; font-family: var(--font-display); font-size: 1.2rem; color: ${this.currentTab === 'story' ? 'var(--accent-gold)' : 'var(--text-faded)'}; cursor: pointer;">
                        📖 Storia
                    </button>
                    <button class="nav-tab ${this.currentTab === 'characters' ? 'active' : ''}" data-tab="characters" style="background: none; border: none; font-family: var(--font-display); font-size: 1.2rem; color: ${this.currentTab === 'characters' ? 'var(--accent-gold)' : 'var(--text-faded)'}; cursor: pointer;">
                        👥 Personaggi
                    </button>
                </div>

                <!-- Content Area -->
                <div id="tab-content" style="padding: 15px;">
                    Loading tab...
                </div>
            </div>

            <!-- Generic Modal -->
            <div id="generic-modal" class="modal-overlay" style="display: none; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; backdrop-filter: blur(2px); background: rgba(0,0,0,0.6);">
                <div class="modal-content" style="width: 90%; max-width: 500px; padding: 25px; border: 2px solid var(--accent-gold); box-shadow: 0 10px 40px rgba(0,0,0,0.8); border-radius: 16px; background: #fdfaf5; max-height: 90vh; overflow-y: auto;">
                    <div id="modal-body"></div>
                    <div class="text-center mt-20" style="display: flex; gap: 10px; justify-content: center;">
                        <button id="modal-cancel-btn" class="btn btn-secondary">Chiudi</button>
                        <button id="modal-action-btn" class="btn btn-primary" style="display: none;">Conferma</button>
                    </div>
                </div>
            </div>
        `;

        this.attachListeners();
        this.loadTabContent();
    }

    attachListeners() {
        this.container.querySelector('#btn-back').addEventListener('click', () => {
            window.location.hash = 'adventures';
        });

        this.container.querySelectorAll('.nav-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentTab = btn.dataset.tab;
                this.renderView(); // Re-render to update classes and content
            });
        });

        const modal = this.container.querySelector('#generic-modal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
        this.container.querySelector('#modal-cancel-btn').addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    async loadTabContent() {
        const contentDiv = this.container.querySelector('#tab-content');
        contentDiv.innerHTML = '<div class="text-center mt-20">Caricamento dati...</div>';

        if (this.currentTab === 'story') {
            await this.renderStoryTab(contentDiv);
        } else {
            await this.renderCharactersTab(contentDiv);
        }
    }

    async renderStoryTab(container) {
        const { data: stories } = await CampaignService.getStories(this.campaignId);

        let html = '';

        if (this.myRole === 'gm') {
            html += `
                <div class="text-center mb-20">
                    <button class="btn btn-primary" id="btn-add-story">➕ Nuovo Capitolo</button>
                </div>
            `;
        }

        if (!stories || stories.length === 0) {
            html += '<div class="text-center italic" style="color: var(--text-faded)">Nessuna storia scritta ancora...</div>';
        } else {
            html += '<div class="story-timeline" style="display: flex; flex-direction: column; gap: 20px;">';
            stories.forEach(story => {
                if (this.myRole !== 'gm' && !story.is_visible) return;

                html += `
                    <div class="card story-card ${!story.is_visible ? 'opacity-70' : ''}" style="border-left: 4px solid var(--accent-gold); padding: 15px; background: white; position: relative;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <h3 style="margin: 0; font-family: var(--font-display); font-size: 1.2rem;">${story.title}</h3>
                            <span style="font-size: 0.7rem; color: var(--text-faded);">
                                ${new Date(story.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        ${!story.is_visible ? '<div style="font-size: 0.7rem; color: var(--accent-red); margin-bottom: 5px;">🔧 BOZZA (Nascosto ai giocatori)</div>' : ''}
                        
                        <div class="story-content markdown-body" style="font-size: 0.95rem; line-height: 1.5; margin-top: 10px; white-space: pre-wrap;">${story.content}</div>

                        ${this.myRole === 'gm' ? `
                            <div class="mt-10 pt-10" style="border-top: 1px dashed var(--border-color); display: flex; justify-content: flex-end; gap: 10px;">
                                <button class="btn-icon toggle-visibility" data-id="${story.id}" data-visible="${story.is_visible}">
                                    ${story.is_visible ? '👁️ Visibile' : '🔒 Nascosto'}
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            html += '</div>';
        }

        container.innerHTML = html;

        // Listeners for Story Actions
        if (this.myRole === 'gm') {
            container.querySelector('#btn-add-story')?.addEventListener('click', () => this.openAddStoryModal());

            container.querySelectorAll('.toggle-visibility').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation(); // prevent modal opening if card click
                    const id = btn.dataset.id;
                    const isVisible = btn.dataset.visible === 'true';
                    await CampaignService.updateStoryVisibility(id, !isVisible);
                    this.loadTabContent();
                });
            });
        }
    }

    async renderCharactersTab(container) {
        // Use getEntities instead of getNPCs
        const { data: entities } = await CampaignService.getEntities(this.campaignId);
        const { members } = this.campaign;

        let html = '';

        // PLAYERS Section
        html += '<h3 class="section-title" style="border-bottom: 2px solid var(--accent-navy); margin-bottom: 15px;">Protagonisti</h3>';

        // Check if I need to link my character
        const myMember = members.find(m => m.user_id === AuthService.user.id);
        if (myMember && !myMember.character_data) {
            html += `
                <div class="alert alert-info text-center mb-20" style="background: rgba(var(--accent-navy-rgb), 0.1); border: 1px solid var(--accent-navy); padding: 15px; border-radius: 8px;">
                    <div>Non hai ancora scelto chi interpretare!</div>
                    <button id="btn-link-char" class="btn btn-sm btn-primary mt-10">Scegli il tuo Personaggio</button>
                </div>
             `;
        }

        html += '<div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px;">';
        members.forEach(m => {
            if (m.role === 'gm') return;
            html += `
                <div class="card p-10 text-center" style="background: white;">
                     <div class="avatar" style="width: 50px; height: 50px; border-radius: 50%; background: #ccc; margin: 0 auto 5px; overflow: hidden;">
                        ${m.profile.avatar_url ? `<img src="${m.profile.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;">` : '<span style="line-height: 50px;">👤</span>'}
                     </div>
                     <div style="font-weight: bold; font-family: var(--font-display);">${m.character_data?.name || 'In attesa...'}</div>
                     <div style="font-size: 0.8rem; color: var(--text-faded);">${m.profile.username}</div>
                </div>
            `;
        });
        html += '</div>';

        // ENTITIES Section (Grouped by Type)
        const categories = {
            'npc': { title: 'Alleati & NPC', icon: '🎭', color: 'var(--accent-gold)' },
            'enemy': { title: 'Avversari', icon: '⚔️', color: 'var(--accent-red)' },
            'item': { title: 'Oggetti & Indizi', icon: '💎', color: 'var(--accent-navy)' }
        };

        if (this.myRole === 'gm') {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid var(--border-color); padding-bottom: 5px;">
                    <h3 class="section-title" style="margin: 0; border: none;">Elementi di Gioco</h3>
                    <button id="btn-add-entity" class="btn btn-xs btn-primary">+ Nuovo</button>
                </div>
            `;
        } else {
            html += '<h3 class="section-title" style="border-bottom: 2px solid var(--border-color); margin-bottom: 15px;">Elementi di Gioco</h3>';
        }

        if (!entities || entities.length === 0) {
            html += '<div class="italic text-center">Nessun elemento ancora...</div>';
        } else {
            // Group entities
            const grouped = { npc: [], enemy: [], item: [] };
            entities.forEach(e => {
                const type = e.type || 'npc';
                if (grouped[type]) grouped[type].push(e);
                else grouped.npc.push(e); // Fallback
            });

            for (const [type, list] of Object.entries(grouped)) {
                if (list.length === 0) continue;

                // Check visibility for players
                const visibleList = this.myRole === 'gm' ? list : list.filter(e => e.is_visible);
                if (visibleList.length === 0 && this.myRole !== 'gm') continue;

                html += `<h4 style="color: ${categories[type].color}; margin: 20px 0 10px; display: flex; align-items: center; gap: 5px;">${categories[type].icon} ${categories[type].title}</h4>`;
                html += '<div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">';

                visibleList.forEach(e => {
                    const isHidden = !e.is_visible;
                    html += `
                        <div class="card entity-card ${isHidden ? 'opacity-70' : ''}" style="padding: 10px; text-align: center; position: relative; border-top: 3px solid ${categories[type].color};" data-id="${e.id}">
                            ${isHidden ? '<div style="position: absolute; top: 5px; right: 5px; font-size: 0.8rem;" title="Nascosto">🔒</div>' : ''}
                            
                            <div class="avatar" style="width: 60px; height: 60px; border-radius: 50%; background: #eee; margin: 0 auto 10px; overflow: hidden; border: 1px solid #ddd;">
                                 ${e.image_url ? `<img src="${e.image_url}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="line-height: 60px; font-size: 1.5rem;">${categories[type].icon}</span>`}
                            </div>
                            
                            <div style="font-weight: bold; font-family: var(--font-display); color: var(--text-main); font-size: 1rem;">${e.name}</div>
                            ${e.level ? `<div style="font-size: 0.8rem; background: rgba(0,0,0,0.05); display: inline-block; padding: 2px 6px; border-radius: 4px; margin: 3px 0;">${e.level}</div>` : ''}
                            ${e.nationality ? `<div style="font-size: 0.75rem; color: var(--text-faded); font-style: italic;">${e.nationality}</div>` : ''}
                            
                            ${this.myRole === 'gm' ? `
                                 <div style="margin-top: 8px; display: flex; justify-content: center; gap: 5px;">
                                    <button class="btn-xs btn-secondary toggle-entity" data-id="${e.id}" data-visible="${e.is_visible}">
                                        ${e.is_visible ? '👁️' : '🔒'}
                                    </button>
                                    <button class="btn-xs btn-secondary delete-entity" data-id="${e.id}" style="color: var(--accent-red);">🗑️</button>
                                 </div>
                            ` : ''}
                        </div>
                     `;
                });
                html += '</div>';
            }
        }

        container.innerHTML = html;

        // Listeners included in renderCharactersTab scope
        container.querySelector('#btn-link-char')?.addEventListener('click', () => this.openLinkCharacterModal());

        if (this.myRole === 'gm') {
            container.querySelector('#btn-add-entity')?.addEventListener('click', () => this.openAddEntityModal());

            container.querySelectorAll('.toggle-entity').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    const isVisible = btn.dataset.visible === 'true';
                    await CampaignService.updateEntityVisibility(id, !isVisible);
                    this.loadTabContent(); // Refresh
                });
            });

            container.querySelectorAll('.delete-entity').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm("Eliminare definitivamente?")) {
                        const id = btn.dataset.id;
                        await CampaignService.deleteEntity(id);
                        this.loadTabContent();
                    }
                });
            });
        }

        // View Details
        container.querySelectorAll('.entity-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') return;
                const entity = entities.find(n => n.id === card.dataset.id);
                if (entity) this.openViewEntityModal(entity);
            });
        });
    }

    // MODALS (Add Link)
    openLinkCharacterModal() {
        const modal = this.container.querySelector('#generic-modal');
        const body = this.container.querySelector('#modal-body');
        const btnAction = this.container.querySelector('#modal-action-btn');

        // Logic to get local characters
        const localChars = JSON.parse(localStorage.getItem('7thsea_characters') || '[]');

        body.innerHTML = `
            <h3 class="text-center" style="font-family: var(--font-display); color: var(--accent-navy);">Scegli il tuo Eroe</h3>
            <div id="char-selection-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto;">
                ${localChars.length > 0 ? localChars.map(c => `
                    <div class="card char-option" data-id="${c.id}" style="padding: 10px; display: flex; align-items: center; gap: 10px; cursor: pointer; border: 2px solid transparent;">
                        <div class="avatar" style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: #ddd;">
                            ${c.image ? `<img src="${c.image}" style="width: 100%; height: 100%; object-fit: cover;">` : '👤'}
                        </div>
                        <div style="font-weight: bold;">${c.name}</div>
                    </div>
                `).join('') : '<div class="text-center">Non hai creato nessun personaggio sul dispositivo!</div>'}
            </div>
        `;

        let selectedChar = null;

        body.querySelectorAll('.char-option').forEach(el => {
            el.addEventListener('click', () => {
                // Deselect others
                body.querySelectorAll('.char-option').forEach(opt => opt.style.borderColor = 'transparent');
                // Select this
                el.style.borderColor = 'var(--accent-gold)';
                selectedChar = localChars.find(c => c.id === el.dataset.id);
            });
        });

        btnAction.style.display = 'block';
        btnAction.textContent = "Collega";
        btnAction.onclick = async () => {
            if (!selectedChar) return alert("Seleziona un personaggio!");

            // Prepare minimal data to store
            const charData = {
                id: selectedChar.id,
                name: selectedChar.name,
                concept: selectedChar.concept,
                nation: selectedChar.nation
                // We don't store full sheet yet, just identity
            };

            await CampaignService.linkCharacter(this.campaignId, charData);
            modal.style.display = 'none';
            this.loadTabContent();
        };

        modal.style.display = 'flex';
    }

    // MODALS
    openAddStoryModal() {
        const modal = this.container.querySelector('#generic-modal');
        const body = this.container.querySelector('#modal-body');
        const btnAction = this.container.querySelector('#modal-action-btn');

        body.innerHTML = `
            <h3 class="text-center" style="font-family: var(--font-display); color: var(--accent-gold);">Nuovo Paragrafo</h3>
            <div class="input-field mb-10">
                <input type="text" id="story-title" placeholder="Titolo (es. Il Ritrovo)" style="width: 100%;">
            </div>
            <div class="input-field mb-10">
                <textarea id="story-content" placeholder="Scrivi qui cosa è successo..." style="width: 100%; height: 150px; font-family: inherit; padding: 10px;"></textarea>
            </div>
            <div class="input-field mb-10" style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="story-visible" style="width: auto;">
                <label for="story-visible">Visibile subito ai giocatori?</label>
            </div>
        `;

        btnAction.style.display = 'block';
        btnAction.textContent = "Pubblica";
        btnAction.onclick = async () => {
            const title = document.getElementById('story-title').value;
            const content = document.getElementById('story-content').value;
            const isVisible = document.getElementById('story-visible').checked;

            if (!title || !content) return alert("Compila tutto!");

            btnAction.textContent = "...";
            await CampaignService.addStory(this.campaignId, title, content, isVisible);
            modal.style.display = 'none';
            this.loadTabContent(); // Refresh
        };

        modal.style.display = 'flex';
    }

    openAddEntityModal() {
        const modal = this.container.querySelector('#generic-modal');
        const body = this.container.querySelector('#modal-body');
        const btnAction = this.container.querySelector('#modal-action-btn');

        body.innerHTML = `
            <h3 class="text-center" style="font-family: var(--font-display); color: var(--accent-gold);">Nuovo Elemento</h3>
            
            <div class="mb-15 text-center">
                <label style="margin-right: 10px;">Tipo:</label>
                <select id="ent-type" style="padding: 5px; border-radius: 5px;">
                    <option value="npc">🎭 NPC (Alleato/Neutrale)</option>
                    <option value="enemy">⚔️ Avversario (Nemico)</option>
                    <option value="item">💎 Oggetto / Indizio</option>
                </select>
            </div>

            <div class="input-field mb-10">
                <input type="text" id="ent-name" placeholder="Nome *" style="width: 100%;">
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <input type="text" id="ent-level" placeholder="Livello (es. Eroe, 10, Ferito)" class="input-field" style="flex: 1;">
                <input type="text" id="ent-nat" placeholder="Nazionalità" class="input-field" style="flex: 1;">
            </div>

            <div class="input-field mb-10">
                <input type="text" id="ent-img" placeholder="Avatar URL (opzionale)" style="width: 100%;">
                <small style="color: var(--text-faded);">Incolla link immagine</small>
            </div>

            <div class="input-field mb-10">
                <textarea id="ent-desc" placeholder="Descrizione..." style="width: 100%; height: 100px; padding: 10px;"></textarea>
            </div>
            
            <div class="input-field mb-10" style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="ent-visible" style="width: auto;">
                <label for="ent-visible">Visibile ai giocatori?</label>
            </div>
        `;

        btnAction.style.display = 'block';
        btnAction.textContent = "Crea";
        btnAction.onclick = async () => {
            const type = document.getElementById('ent-type').value;
            const name = document.getElementById('ent-name').value;
            const level = document.getElementById('ent-level').value;
            const nationality = document.getElementById('ent-nat').value;
            const image_url = document.getElementById('ent-img').value;
            const description = document.getElementById('ent-desc').value;
            const is_visible = document.getElementById('ent-visible').checked;

            if (!name) return alert("Inserisci almeno il nome");

            const entityData = { name, type, level, nationality, image_url, description, is_visible };

            btnAction.textContent = "...";
            await CampaignService.addEntity(this.campaignId, entityData);
            modal.style.display = 'none';
            this.loadTabContent(); // Refresh
        };

        modal.style.display = 'flex';
    }

    openViewEntityModal(e) {
        const modal = this.container.querySelector('#generic-modal');
        const body = this.container.querySelector('#modal-body');
        const btnAction = this.container.querySelector('#modal-action-btn');

        const icons = { npc: '🎭', enemy: '⚔️', item: '💎' };

        body.innerHTML = `
            <div class="text-center">
                <div class="avatar" style="width: 120px; height: 120px; border-radius: 50%; background: #eee; margin: 0 auto 15px; overflow: hidden; border: 4px solid var(--accent-gold); box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                        ${e.image_url ? `<img src="${e.image_url}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="line-height: 120px; font-size: 3rem;">${icons[e.type] || '❓'}</span>`}
                </div>
                <h2 style="font-family: var(--font-display); color: var(--accent-navy); margin-bottom: 5px;">${e.name}</h2>
                
                <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 15px; font-size: 0.9rem;">
                    ${e.level ? `<span style="background: rgba(0,0,0,0.1); padding: 2px 8px; border-radius: 10px;">${e.level}</span>` : ''}
                    ${e.nationality ? `<span style="font-style: italic; color: var(--text-faded);">${e.nationality}</span>` : ''}
                </div>

                <div style="text-align: left; padding: 20px; background: rgba(0,0,0,0.03); border-radius: 12px; white-space: pre-wrap; line-height: 1.6;">${e.description || 'Nessuna descrizione.'}</div>
            </div>
        `;

        btnAction.style.display = 'none';
        modal.style.display = 'flex';
    }
}
