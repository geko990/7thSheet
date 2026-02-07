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
        const { data: npcs } = await CampaignService.getNPCs(this.campaignId);
        const { members } = this.campaign;

        let html = '';

        // PLAYERS Section
        html += '<h3 class="section-title" style="border-bottom: 2px solid var(--accent-navy); margin-bottom: 15px;">Protagonisti</h3>';

        // Check if I need to link my character
        const myMember = members.find(m => m.user_id === AuthService.user.id);
        if (myMember && !myMember.character_data && this.myRole !== 'gm') {
            html += `
                <div class="alert alert-info text-center mb-20" style="background: rgba(var(--accent-navy-rgb), 0.1); border: 1px solid var(--accent-navy); padding: 15px; border-radius: 8px;">
                    <div>Non hai ancora scelto chi interpretare!</div>
                    <button id="btn-link-char" class="btn btn-sm btn-primary mt-10">Scegli il tuo Personaggio</button>
                </div>
             `;
        }

        html += '<div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px;">';
        members.forEach(m => {
            if (m.role === 'gm') return; // Skip GM in players list logic or show separately?
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

        // NPC Section
        html += '<h3 class="section-title" style="border-bottom: 2px solid var(--accent-red); margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">Personaggi Incontrati';
        if (this.myRole === 'gm') {
            html += '<button id="btn-add-npc" class="btn btn-xs btn-primary">+ NPC</button>';
        }
        html += '</h3>';

        if (!npcs || npcs.length === 0) {
            html += '<div class="italic text-center">Nessuno ancora...</div>';
        } else {
            html += '<div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">';
            npcs.forEach(npc => {
                if (this.myRole !== 'gm' && !npc.is_visible) return;

                html += `
                    <div class="card npc-card ${!npc.is_visible ? 'opacity-70' : ''}" style="padding: 10px; text-align: center; position: relative;" data-id="${npc.id}">
                        ${!npc.is_visible ? '<div style="position: absolute; top: 5px; right: 5px; font-size: 0.8rem;">🔒</div>' : ''}
                        <div class="avatar" style="width: 60px; height: 60px; border-radius: 50%; background: #ddd; margin: 0 auto 10px; overflow: hidden; border: 2px solid var(--accent-gold);">
                             ${npc.image_url ? `<img src="${npc.image_url}" style="width: 100%; height: 100%; object-fit: cover;">` : '<span style="line-height: 60px; font-size: 1.5rem;">🎭</span>'}
                        </div>
                        <div style="font-weight: bold; font-family: var(--font-display); color: var(--accent-navy);">${npc.name}</div>
                        
                        ${this.myRole === 'gm' ? `
                             <div style="margin-top: 5px; display: flex; justify-content: center; gap: 5px;">
                                <button class="btn-xs btn-secondary toggle-npc" data-id="${npc.id}" data-visible="${npc.is_visible}">
                                    ${npc.is_visible ? '👁️' : '🔒'}
                                </button>
                             </div>
                        ` : ''}
                    </div>
                 `;
            });
            html += '</div>';
        }

        container.innerHTML = html;

        // Listeners
        container.querySelector('#btn-link-char')?.addEventListener('click', () => this.openLinkCharacterModal());

        // NPC Listeners (Existing)
        if (this.myRole === 'gm') {
            container.querySelector('#btn-add-npc')?.addEventListener('click', () => this.openAddNPCModal());

            container.querySelectorAll('.toggle-npc').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    const isVisible = btn.dataset.visible === 'true';
                    await CampaignService.updateNPCVisibility(id, !isVisible);
                    this.loadTabContent();
                });
            });

            // View NPC Details (for now just modal with description)
            container.querySelectorAll('.npc-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    // If clicking button, ignore. If clicking card, show details.
                    if (e.target.tagName === 'BUTTON') return;
                    const npc = npcs.find(n => n.id === card.dataset.id);
                    if (npc) this.openViewNPCModal(npc);
                });
            });
        } else {
            // Players can view details too
            container.querySelectorAll('.npc-card').forEach(card => {
                card.addEventListener('click', () => {
                    const npc = npcs.find(n => n.id === card.dataset.id);
                    if (npc) this.openViewNPCModal(npc);
                });
            });
        }
    }

    // MODALS (Add Link)
    openLinkCharacterModal() {
        const modal = this.container.querySelector('#generic-modal');
        const body = this.container.querySelector('#modal-body');
        const btnAction = this.container.querySelector('#modal-action-btn');

        // Logic to get local characters
        const localChars = JSON.parse(localStorage.getItem('characters') || '[]');

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

    openAddNPCModal() {
        const modal = this.container.querySelector('#generic-modal');
        const body = this.container.querySelector('#modal-body');
        const btnAction = this.container.querySelector('#modal-action-btn');

        body.innerHTML = `
            <h3 class="text-center" style="font-family: var(--font-display); color: var(--accent-red);">Nuovo NPC</h3>
            <div class="input-field mb-10">
                <input type="text" id="npc-name" placeholder="Nome" style="width: 100%;">
            </div>
            <div class="input-field mb-10">
                <textarea id="npc-desc" placeholder="Descrizione..." style="width: 100%; height: 100px; padding: 10px;"></textarea>
            </div>
            <div class="input-field mb-10" style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="npc-visible" style="width: auto;">
                <label for="npc-visible">Visibile ai giocatori?</label>
            </div>
        `;

        btnAction.style.display = 'block';
        btnAction.textContent = "Crea";
        btnAction.onclick = async () => {
            const name = document.getElementById('npc-name').value;
            const desc = document.getElementById('npc-desc').value;
            const isVisible = document.getElementById('npc-visible').checked;

            if (!name) return alert("Inserisci almeno il nome");

            await CampaignService.addNPC(this.campaignId, name, desc, isVisible);
            modal.style.display = 'none';
            this.loadTabContent();
        };

        modal.style.display = 'flex';
    }

    openViewNPCModal(npc) {
        const modal = this.container.querySelector('#generic-modal');
        const body = this.container.querySelector('#modal-body');
        const btnAction = this.container.querySelector('#modal-action-btn');

        body.innerHTML = `
            <div class="text-center">
                <div class="avatar" style="width: 100px; height: 100px; border-radius: 50%; background: #ddd; margin: 0 auto 15px; overflow: hidden; border: 3px solid var(--accent-gold);">
                        ${npc.image_url ? `<img src="${npc.image_url}" style="width: 100%; height: 100%; object-fit: cover;">` : '<span style="line-height: 100px; font-size: 2.5rem;">🎭</span>'}
                </div>
                <h2 style="font-family: var(--font-display); color: var(--accent-navy); margin-bottom: 10px;">${npc.name}</h2>
                <div style="text-align: left; padding: 15px; background: rgba(0,0,0,0.05); border-radius: 10px; white-space: pre-wrap;">${npc.description || 'Nessuna descrizione.'}</div>
            </div>
        `;

        btnAction.style.display = 'none'; // Only close button needed
        modal.style.display = 'flex';
    }
}
