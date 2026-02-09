import { AuthService } from '../services/AuthService.js';
import { CampaignService } from '../services/CampaignService.js';
import { PasteHandler } from '../utils/PasteHandler.js';

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

        // Banner Image Logic (Fallback to a default if none)
        const bannerUrl = this.campaign.image_url || 'assets/banners/default_campaign.jpg'; // We'll need to ensure this asset exists or use a web placeholder
        // Actually, let's use a nice gradient or a placeholder service if asset missing, or just a dark overlay.
        // For now, I'll rely on the style I set below.

        this.container.innerHTML = `
            <div class="campaign-detail-container" style="padding-bottom: 80px;">
                <!-- Header with Banner -->
                <div class="campaign-banner" style="
                    position: relative;
                    height: 200px;
                    background-image: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url('${bannerUrl}');
                    background-size: cover;
                    background-position: center;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    color: white;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
                ">
                    ${this.myRole === 'gm' ? `
                        <button id="btn-change-banner" class="btn btn-xs btn-secondary" style="position: absolute; right: 15px; top: 15px; background: rgba(0,0,0,0.5); border: none; font-size: 1.2rem;">📷</button>
                    ` : ''}
                    
                    <div style="text-align: center; padding-bottom: 20px; width: 100%;">
                        <h2 class="page-title" style="margin: 0; font-size: 1.8rem; color: var(--accent-gold);">${this.campaign.title}</h2>
                    </div>
                </div>

                <!-- Tabs -->
                <div class="tabs-nav" style="display: flex; justify-content: space-around; padding: 10px; border-bottom: 1px solid var(--border-color); background: var(--bg-main);">
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
            
            <!-- Context Menu (Dynamic) -->
            <!-- Will be created on fly -->
        `;

        this.attachListeners();
        this.loadTabContent();
    }

    attachListeners() {
        if (this.myRole === 'gm') {
            this.container.querySelector('#btn-change-banner')?.addEventListener('click', () => this.openChangeBannerModal());
        }

        this.container.querySelectorAll('.nav-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentTab = btn.dataset.tab;
                this.renderView(); // Re-render logic to update UI state
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
                    <button class="btn btn-primary" id="btn-add-story">➕ Scrivi Diario</button>
                </div>
            `;
        }

        if (!stories || stories.length === 0) {
            html += '<div class="text-center italic" style="color: var(--text-faded)">Ancora nessuna pagina scritta nel diario di questa avventura...</div>';
        } else {
            html += '<div class="story-timeline" style="display: flex; flex-direction: column; gap: 15px;">';
            stories.forEach(story => {
                if (this.myRole !== 'gm' && !story.is_visible) return;

                // "Diary Entry" style
                // Extract first 100 chars for preview
                const previewText = story.content.length > 100 ? story.content.substring(0, 100) + '...' : story.content;
                const dateStr = new Date(story.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

                html += `
                    <div class="card story-card ${!story.is_visible ? 'opacity-70' : ''}" data-id="${story.id}" style="
                        padding: 15px; 
                        background: white; 
                        position: relative; 
                        border-left: 3px solid var(--accent-gold);
                        cursor: pointer;
                        
                        transition: transform 0.1s;
                    " class="card story-card no-select ${!story.is_visible ? 'opacity-70' : ''}">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <h3 style="margin: 0; font-family: var(--font-display); font-size: 1.1rem; color: var(--text-main);">${story.title}</h3>
                            <span style="font-size: 0.75rem; color: var(--text-faded); white-space: nowrap;">${dateStr}</span>
                        </div>
                        
                        ${!story.is_visible ? '<div style="font-size: 0.7rem; color: var(--accent-red); margin-bottom: 5px;">🔒 NASCOSTO</div>' : ''}
                        
                        <div style="font-size: 0.9rem; color: var(--text-faded); line-height: 1.4;">
                            ${previewText}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        container.innerHTML = html;
        this.attachStoryListeners(container, stories);
    }

    attachStoryListeners(container, stories) {
        if (this.myRole === 'gm') {
            container.querySelector('#btn-add-story')?.addEventListener('click', () => this.openAddStoryModal());
        }

        const cards = container.querySelectorAll('.story-card');
        cards.forEach(card => {
            const id = card.dataset.id;
            const story = stories.find(s => s.id === id);

            let timer = null;
            let isLongPress = false;
            let startX, startY;

            // TOUCH
            card.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isLongPress = false;
                timer = setTimeout(() => {
                    isLongPress = true;
                    navigator.vibrate?.(50);
                    this.openStoryContextMenu(story);
                }, 500);
            }, { passive: true });

            card.addEventListener('touchmove', (e) => {
                const diffX = Math.abs(e.touches[0].clientX - startX);
                const diffY = Math.abs(e.touches[0].clientY - startY);
                if (diffX > 10 || diffY > 10) clearTimeout(timer);
            }, { passive: true });

            card.addEventListener('touchend', (e) => {
                clearTimeout(timer);
                if (isLongPress) e.preventDefault();
            });

            // CLICK
            card.addEventListener('click', () => {
                if (isLongPress) return;
                this.openViewStoryModal(story);
            });

            // CONTEXT MENU
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.openStoryContextMenu(story);
            });
        });
    }

    async renderCharactersTab(container) {
        // Use getEntities instead of getNPCs
        const { data: entities } = await CampaignService.getEntities(this.campaignId);
        const { members } = this.campaign;

        let html = '';

        // INVITE CODE Section (Only GM sees it)
        if (this.myRole === 'gm' && this.campaign.join_code) {
            html += `
                <div class="card p-15 mb-20 text-center" style="background: rgba(var(--accent-navy-rgb), 0.05); border: 1px dashed var(--accent-navy);">
                    <div style="font-size: 0.9rem; color: var(--text-faded); margin-bottom: 5px;">📜 CODICE DI INVITO</div>
                    <div style="font-family: monospace; font-size: 1.5rem; letter-spacing: 2px; font-weight: bold; user-select: text;">${this.campaign.join_code}</div>
                    <div style="font-size: 0.8rem; color: var(--text-faded); margin-top: 5px;">Condividi questo codice per far unire altri giocatori.</div>
                </div>
            `;
        }

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
            if (m.role === 'gm') return;
            const hasChar = !!m.character_data;
            html += `
                <div class="card p-10 text-center player-card no-select" data-uid="${m.user_id}" style="background: rgba(255,255,255,0.4); cursor: pointer; transition: transform 0.1s; border: 1px solid var(--border-worn);">
                     <div class="avatar" style="width: 50px; height: 50px; border-radius: 50%; background: #ccc; margin: 0 auto 5px; overflow: hidden; border: 2px solid ${hasChar ? 'var(--accent-gold)' : '#ccc'};">
                        ${(m.character_data?.image_url || m.profile.avatar_url) ? `<img src="${m.character_data?.image_url || m.profile.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;">` : '<span style="line-height: 50px;">👤</span>'}
                     </div>
                     <div style="font-weight: bold; font-family: var(--font-display);">${m.character_data?.name || 'In attesa...'}</div>
                     <div style="font-size: 0.8rem; color: var(--text-faded);">${m.profile.username || 'Sconosciuto'}</div>
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

                // Use a standard grid but content will be card-based
                html += '<div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">';

                visibleList.forEach(e => {
                    const isHidden = !e.is_visible;

                    // Expanded Card View - Image Priority
                    html += `
                        <div class="card entity-card no-select ${isHidden ? 'opacity-70' : ''}" style="padding: 0; overflow: hidden; position: relative; border-top: 4px solid ${categories[type].color}; height: 100%; display: flex; flex-direction: column; background: #fff;" data-id="${e.id}" data-visible="${e.is_visible}">
                             ${isHidden ? '<div style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.6); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; z-index: 2;" title="Nascosto">🔒</div>' : ''}
                            
                            <div class="entity-image-container" style="width: 100%; aspect-ratio: 4/3; background: #eee; position: relative; border-bottom: 1px solid var(--border-color);">
                                 ${e.image_url ? `<img src="${e.image_url}" style="width: 100%; height: 100%; object-fit: cover; object-position: top;">` : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: var(--text-faded);">${categories[type].icon}</div>`}
                            </div>
                            
                            <div style="padding: 10px; text-align: center; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                <div style="font-weight: bold; font-family: var(--font-display); color: var(--text-main); font-size: 1.1rem; line-height: 1.2; margin-bottom: 5px;">${e.name}</div>
                                ${e.nationality ? `<div style="font-size: 0.8rem; color: var(--text-faded); font-style: italic; margin-bottom: 5px;">${e.nationality}</div>` : ''}
                                ${e.level ? `<div style="font-size: 0.8em; background: rgba(0,0,0,0.05); padding: 2px 8px; border-radius: 10px; border: 1px solid var(--border-worn); font-weight: bold;">Liv. ${e.level}</div>` : ''}
                            </div>
                        </div>`;
                });
                html += '</div>';
            }
        }

        container.innerHTML = html;

        // Listeners included in renderCharactersTab scope
        container.querySelector('#btn-link-char')?.addEventListener('click', () => this.openLinkCharacterModal());

        if (this.myRole === 'gm') container.querySelector('#btn-add-entity')?.addEventListener('click', () => this.openAddEntityModal());

        // Player Click & Long Press Listeners
        container.querySelectorAll('.player-card').forEach(card => {
            const uid = card.dataset.uid;
            const member = members.find(m => m.user_id === uid);
            if (!member) return;

            // My interactions
            const isMe = member.user_id === AuthService.user?.id;

            let timer = null;
            let isLongPress = false;
            let startX, startY;

            // TOUCH
            card.addEventListener('touchstart', (e) => {
                // Ensure we don't start multiple timers
                if (timer) clearTimeout(timer);

                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isLongPress = false;

                timer = setTimeout(() => {
                    isLongPress = true;
                    if (navigator.vibrate) navigator.vibrate(50);
                    // Open context menu for ME or if I am GM
                    if (isMe || this.myRole === 'gm') {
                        this.openPlayerContextMenu(member);
                    }
                }, 400); // Reduced to 400ms
            }, { passive: true });

            card.addEventListener('touchmove', (e) => {
                const diffX = Math.abs(e.touches[0].clientX - startX);
                const diffY = Math.abs(e.touches[0].clientY - startY);
                if (diffX > 10 || diffY > 10) {
                    clearTimeout(timer);
                    isLongPress = false;
                }
            }, { passive: true });

            card.addEventListener('touchend', (e) => {
                clearTimeout(timer);
                if (isLongPress) {
                    e.preventDefault();
                    e.stopPropagation(); // Stop click from firing
                }
            });

            // CLICK
            card.addEventListener('click', (e) => {
                if (isLongPress) {
                    e.stopPropagation();
                    return;
                }

                // If it's ME and I have a linked character, open my sheet
                if (member.user_id === AuthService.user?.id && member.character_data?.id) {
                    this.app.router.navigate('character-sheet', { id: member.character_data.id });
                    return;
                }

                if (member.character_data) {
                    this.openPlayerPopup(member);
                }
            });

            // CONTEXT MENU (Right Click for Desktop)
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Allow if GM OR if it's me
                if (this.myRole === 'gm' || isMe) {
                    this.openPlayerContextMenu(member);
                }
            });
        });
        // Attach Long Press Listeners to Entities
        this.attachEntityInteractionListeners(container, entities);
    }

    openPlayerContextMenu(member) {
        const existingMenu = document.getElementById('ctx-menu-player');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.id = 'ctx-menu-player';
        menu.className = 'modal-overlay';
        menu.style.display = 'flex';
        menu.style.alignItems = 'center';
        menu.style.justifyContent = 'center';
        menu.style.background = 'rgba(0,0,0,0.6)';
        menu.style.zIndex = '10000';
        menu.style.backdropFilter = 'blur(2px)';

        const targetName = member.character_data?.name || member.profile.username || 'Giocatore';
        const isMe = member.user_id === this.userId;
        const isGm = this.myRole === 'gm';
        const isTargetGm = member.role === 'gm';

        let actionButtons = '';

        if (isGm && !isMe) {
            // GM Actions on others
            if (!isTargetGm) {
                actionButtons += `<button class="btn btn-primary" id="ctx-promote">⭐ Promuovi a Master</button>`;
            } else {
                actionButtons += `<button class="btn btn-secondary" id="ctx-demote">⬇️ Retrocedi a Player</button>`;
            }
            // Kick option
            if (!isTargetGm) { // Shouldn't kick other GMs easily without demoting first? Or allow it.
                actionButtons += `<button class="btn btn-secondary" id="ctx-kick" style="color: var(--accent-red); border-color: var(--accent-red);">🥾 Espelli</button>`;
            }
        }

        if (isMe) {
            // Self Actions
            // If I am the ONLY GM, I effectively delete the campaign or need to promote someone else?
            // For now, simple "Leave"
            actionButtons += `<button class="btn btn-secondary" id="ctx-leave" style="color: var(--accent-red); border-color: var(--accent-red);">👋 Abbandona</button>`;
        }

        if (!actionButtons) {
            // Nothing to do (e.g. Player clicking on another Player)
            return;
        }

        menu.innerHTML = `
            <div class="modal-content" style="width: 90%; max-width: 300px; background: #fdfaf5; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid var(--accent-gold);">
                <h3 style="margin-bottom: 15px; font-family: var(--font-display); color: var(--accent-navy);">${targetName}</h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${actionButtons}
                    <button class="btn btn-secondary" id="ctx-cancel-player" style="margin-top: 5px;">Annulla</button>
                </div>
            </div>
        `;

        document.body.appendChild(menu);

        // Prevent props
        menu.querySelector('.modal-content').addEventListener('click', (e) => e.stopPropagation());

        menu.querySelector('#ctx-cancel-player').onclick = () => menu.remove();
        menu.onclick = (e) => { if (e.target === menu) menu.remove(); };

        // Bind Actions
        const promoteBtn = menu.querySelector('#ctx-promote');
        if (promoteBtn) {
            promoteBtn.onclick = async () => {
                if (confirm(`Rendere ${targetName} un Game Master? Potrà modificare la campagna.`)) {
                    promoteBtn.textContent = '...';
                    const { error } = await CampaignService.updateMemberRole(this.campaignId, member.user_id, 'gm');
                    menu.remove();
                    if (error) alert("Errore: " + error.message);
                    else this.render(this.container, this.campaignId);
                }
            };
        }

        const demoteBtn = menu.querySelector('#ctx-demote');
        if (demoteBtn) {
            demoteBtn.onclick = async () => {
                if (confirm(`Rimuovere i permessi da GM a ${targetName}?`)) {
                    demoteBtn.textContent = '...';
                    const { error } = await CampaignService.updateMemberRole(this.campaignId, member.user_id, 'player');
                    menu.remove();
                    if (error) alert("Errore: " + error.message);
                    else this.render(this.container, this.campaignId);
                }
            };
        }

        const kickBtn = menu.querySelector('#ctx-kick');
        if (kickBtn) {
            kickBtn.onclick = async () => {
                if (confirm(`Sei sicuro di voler espellere ${targetName}?`)) {
                    kickBtn.textContent = '...';
                    const { error } = await CampaignService.removeMember(this.campaignId, member.user_id);
                    menu.remove();
                    if (error) alert("Errore: " + error.message);
                    else this.render(this.container, this.campaignId);
                }
            };
        }

        const leaveBtn = menu.querySelector('#ctx-leave');
        if (leaveBtn) {
            leaveBtn.onclick = async () => {
                let msg = "Vuoi lasciare questa avventura?";
                if (isGm) msg += " Sei un GM! Se sei l'unico, la campagna potrebbe rimanere orfana.";

                if (confirm(msg)) {
                    leaveBtn.textContent = '...';
                    const { error } = await CampaignService.removeMember(this.campaignId, member.user_id);
                    menu.remove();
                    if (error) alert("Errore: " + error.message);
                    else {
                        // Navigate back or refresh
                        window.app.adventureTab.render(); // Go back to list
                        // Or trigger router
                        window.app.router.navigate('adventures');
                    }
                }
            };
        }
    }
    attachEntityInteractionListeners(container, entities) {
        const cards = container.querySelectorAll('.entity-card');
        cards.forEach(card => {
            const id = card.dataset.id;
            const entity = entities.find(e => e.id === id);

            let timer = null;
            let isLongPress = false;
            let startX, startY;

            // TOUCH EVENTS
            card.addEventListener('touchstart', (e) => {
                if (timer) clearTimeout(timer);
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isLongPress = false;

                timer = setTimeout(() => {
                    isLongPress = true;
                    navigator.vibrate?.(50);
                    this.openEntityContextMenu(entity);
                }, 400);
            }, { passive: true });

            card.addEventListener('touchmove', (e) => {
                const diffX = Math.abs(e.touches[0].clientX - startX);
                const diffY = Math.abs(e.touches[0].clientY - startY);
                if (diffX > 10 || diffY > 10) {
                    clearTimeout(timer);
                    isLongPress = false;
                }
            }, { passive: true });

            card.addEventListener('touchend', (e) => {
                clearTimeout(timer);
                if (isLongPress) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

            // CLICK (Short Press)
            card.addEventListener('click', (e) => {
                if (isLongPress) {
                    e.stopPropagation();
                    return;
                }
                this.openViewEntityModal(entity);
            });

            // CONTEXT MENU (Right Click)
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openEntityContextMenu(entity);
            });
        });
    }

    openEntityContextMenu(entity) {
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

        const isGm = this.myRole === 'gm';

        // Modal Content - Centered
        menu.innerHTML = `
            <div class="modal-content" style="width: 90%; max-width: 320px; background: #fdfaf5; border-radius: 16px; padding: 25px; text-align: center; border: 2px solid var(--accent-gold); box-shadow: 0 10px 40px rgba(0,0,0,0.5); transform: scale(0.9); animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;">
                <h3 style="margin-bottom: 20px; font-family: var(--font-display); font-size: 1.4rem; color: var(--accent-navy);">${entity.name}</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button class="btn btn-primary" id="ctx-open" style="width: 100%; padding: 12px;">📜 Apri</button>
                    ${isGm ? `
                        <button class="btn btn-secondary" id="ctx-edit" style="width: 100%; padding: 12px;">✏️ Modifica</button>
                        <button class="btn btn-secondary" id="ctx-toggle" style="width: 100%; padding: 12px;">${entity.is_visible ? '🔒 Nascondi' : '👁️ Mostra'}</button>
                        <button class="btn btn-secondary" id="ctx-delete" style="width: 100%; padding: 12px; color: var(--accent-red); border-color: var(--accent-red);">🗑️ Elimina</button>
                    ` : ''}
                    <button class="btn btn-secondary" id="ctx-cancel" style="width: 100%; padding: 12px; margin-top: 5px;">Annulla</button>
                </div>
            </div>
            <style>
                @keyframes popIn { to { transform: scale(1); } }
            </style>
        `;

        document.body.appendChild(menu);

        // Prevent props
        menu.querySelector('.modal-content').addEventListener('click', (e) => e.stopPropagation());

        // Listeners
        menu.querySelector('#ctx-open').onclick = () => {
            menu.remove();
            this.openViewEntityModal(entity);
        };

        menu.querySelector('#ctx-cancel').onclick = () => menu.remove();
        menu.onclick = (e) => { if (e.target === menu) menu.remove(); };

        if (isGm) {
            menu.querySelector('#ctx-edit').onclick = () => {
                menu.remove();
                this.openEditEntityModal(entity);
            };

            menu.querySelector('#ctx-toggle').onclick = async () => {
                menu.remove();
                await CampaignService.updateEntityVisibility(entity.id, !entity.is_visible);
                this.loadTabContent();
            };

            menu.querySelector('#ctx-delete').onclick = async () => {
                menu.remove();
                if (confirm("Eliminare definitivamente?")) {
                    await CampaignService.deleteEntity(entity.id);
                    this.loadTabContent();
                }
            };
        }
    }

    openEditEntityModal(entity) {
        // Reuse the add modal logic but pre-fill data and change save action
        const modal = this.container.querySelector('#generic-modal');
        const body = this.container.querySelector('#modal-body');
        const btnAction = this.container.querySelector('#modal-action-btn');

        // Copy paste of add modal HTML, ideally refactored into a shared render function
        body.innerHTML = `
            <h3 class="text-center" style="font-family: var(--font-display); color: var(--accent-gold);">Modifica Elemento</h3>
            
            <div class="mb-15 text-center">
                <label style="margin-right: 10px;">Tipo:</label>
                <select id="ent-type" style="padding: 5px; border-radius: 5px;">
                    <option value="npc" ${entity.type === 'npc' ? 'selected' : ''}>🎭 NPC (Alleato/Neutrale)</option>
                    <option value="enemy" ${entity.type === 'enemy' ? 'selected' : ''}>⚔️ Avversario (Nemico)</option>
                    <option value="item" ${entity.type === 'item' ? 'selected' : ''}>💎 Oggetto / Indizio</option>
                </select>
            </div>

            <div class="input-field mb-10">
                <input type="text" id="ent-name" placeholder="Nome *" style="width: 100%;" value="${entity.name || ''}">
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <input type="text" id="ent-level" placeholder="Livello" class="input-field" style="flex: 1;" value="${entity.level || ''}">
                <select id="ent-nat" class="input-field" style="flex: 1;">
                    <option value="">-- Nazionalità --</option>
                    <option value="Avalon" ${entity.nationality === 'Avalon' ? 'selected' : ''}>Avalon</option>
                    <option value="Castille" ${entity.nationality === 'Castille' ? 'selected' : ''}>Castille</option>
                    <option value="Eisen" ${entity.nationality === 'Eisen' ? 'selected' : ''}>Eisen</option>
                    <option value="Montaigne" ${entity.nationality === 'Montaigne' ? 'selected' : ''}>Montaigne</option>
                    <option value="Sarmatia" ${entity.nationality === 'Sarmatia' ? 'selected' : ''}>Sarmatia</option>
                    <option value="Ussura" ${entity.nationality === 'Ussura' ? 'selected' : ''}>Ussura</option>
                    <option value="Vestenmennavenjar" ${entity.nationality === 'Vestenmennavenjar' ? 'selected' : ''}>Vesten</option>
                    <option value="Vodacce" ${entity.nationality === 'Vodacce' ? 'selected' : ''}>Vodacce</option>
                    <option value="La Bucca" ${entity.nationality === 'La Bucca' ? 'selected' : ''}>La Bucca</option>
                    <option value="Aragosta" ${entity.nationality === 'Aragosta' ? 'selected' : ''}>Aragosta</option>
                    <option value="Numa" ${entity.nationality === 'Numa' ? 'selected' : ''}>Numa</option>
                    <option value="Cathay" ${entity.nationality === 'Cathay' ? 'selected' : ''}>Cathay</option>
                    <option value="Crescent" ${entity.nationality === 'Crescent' ? 'selected' : ''}>Crescent</option>
                </select>
            </div>

            <div class="input-field mb-10" style="text-align: center; border: 1px dashed var(--border-color); padding: 10px; border-radius: 8px;">
                <label for="ent-file" class="btn btn-secondary btn-sm" style="display: block; width: 100%; margin-bottom: 5px; cursor: pointer;">📷 Cambia Immagine</label>
                <input type="file" id="ent-file" style="display: none;" accept="image/*">
                <div id="img-preview" style="width: 100px; height: 100px; background: #eee; margin: 10px auto; overflow: hidden; border-radius: 8px; display: block; border: 2px solid var(--accent-gold);">
                    ${entity.image_url ? `<img src="${entity.image_url}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
                </div>
                <div style="font-size: 0.8rem; color: var(--text-faded); margin: 5px 0;">OPPURE</div>
                <div style="display: flex; gap: 5px;">
                    <input type="text" id="ent-img" placeholder="Incolla URL immagine..." style="flex: 1;" value="${entity.image_url || ''}">
                    <button id="btn-paste-clipboard" class="btn btn-secondary btn-sm" style="padding: 5px 10px;" title="Incolla da Appunti">📋</button>
                </div>
                <div id="paste-hint" style="font-size: 0.75rem; color: var(--text-faded); margin-top: 5px; font-style: italic;">Puoi anche incollare un'immagine (CTRL+V)</div>
            </div>

            <div class="input-field mb-10">
                <textarea id="ent-desc" placeholder="Descrizione..." style="width: 100%; height: 100px; padding: 10px;">${entity.description || ''}</textarea>
            </div>
            
            <div class="input-field mb-10" style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="ent-visible" style="width: auto;" ${entity.is_visible ? 'checked' : ''}>
                <label for="ent-visible">Visibile ai giocatori?</label>
            </div>
        `;

        const fileInput = body.querySelector('#ent-file');
        const preview = body.querySelector('#img-preview');
        const urlInput = body.querySelector('#ent-img');
        const pasteHint = body.querySelector('#paste-hint');

        // Helper to update preview
        const updatePreview = (src) => {
            preview.innerHTML = `<img src="${src}" style="width: 100%; height: 100%; object-fit: cover;">`;
        };

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => updatePreview(ev.target.result);
                reader.readAsDataURL(file);
            }
        });

        // Paste Handler (CTRL+V)
        PasteHandler.attach(urlInput, (file) => {
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInput.files = dt.files;

            const reader = new FileReader();
            reader.onload = (ev) => updatePreview(ev.target.result);
            reader.readAsDataURL(file);

            pasteHint.textContent = "Immagine incollata!";
            pasteHint.style.color = "var(--accent-green)";
            setTimeout(() => {
                pasteHint.textContent = "Puoi anche incollare un'immagine (CTRL+V)";
                pasteHint.style.color = "var(--text-faded)";
            }, 2000);
        });

        // Manual Paste Button (Mobile)
        const pasteBtn = body.querySelector('#btn-paste-clipboard');
        if (pasteBtn && navigator.clipboard && navigator.clipboard.read) {
            pasteBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    const clipboardItems = await navigator.clipboard.read();
                    for (const item of clipboardItems) {
                        const imageType = item.types.find(type => type.startsWith('image/'));
                        if (imageType) {
                            const blob = await item.getType(imageType);
                            const file = new File([blob], "pasted-image.png", { type: imageType });

                            const dt = new DataTransfer();
                            dt.items.add(file);
                            fileInput.files = dt.files;

                            const reader = new FileReader();
                            reader.onload = (ev) => updatePreview(ev.target.result);
                            reader.readAsDataURL(file);

                            pasteHint.textContent = "Immagine incollata dagli appunti!";
                            pasteHint.style.color = "var(--accent-green)";
                            return;
                        }
                    }
                    alert("Nessuna immagine trovata negli appunti.");
                } catch (err) {
                    console.error(err);
                    alert("Impossibile accedere agli appunti. Assicurati di aver dato i permessi.");
                }
            });
        }

        // Also attach to the whole modal body for better UX
        PasteHandler.attach(body, (file) => {
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInput.files = dt.files;
            const reader = new FileReader();
            reader.onload = (ev) => updatePreview(ev.target.result);
            reader.readAsDataURL(file);

            pasteHint.textContent = "Immagine incollata!";
            pasteHint.style.color = "var(--accent-green)";
            setTimeout(() => {
                pasteHint.textContent = "Puoi anche incollare un'immagine (CTRL+V)";
                pasteHint.style.color = "var(--text-faded)";
            }, 2000);
        });

        btnAction.style.display = 'block';
        btnAction.textContent = "Salva";
        btnAction.disabled = false;

        btnAction.onclick = async () => {
            const type = document.getElementById('ent-type').value;
            const name = document.getElementById('ent-name').value;
            const level = document.getElementById('ent-level').value;
            const nationality = document.getElementById('ent-nat').value;
            const description = document.getElementById('ent-desc').value;
            const is_visible = document.getElementById('ent-visible').checked;

            let image_url = urlInput.value;
            const file = fileInput.files[0];

            if (!name) return alert("Inserisci almeno il nome");

            btnAction.disabled = true;

            if (file) {
                btnAction.textContent = "Caricamento Immagine...";
                const { publicUrl, error } = await CampaignService.uploadImage(file);
                if (error) {
                    alert("Errore caricamento immagine: " + (error.message || error));
                    btnAction.disabled = false;
                    btnAction.textContent = "Salva";
                    return;
                }
                image_url = publicUrl;
            }

            const updates = { name, type, level, nationality, image_url, description, is_visible };

            btnAction.textContent = "Aggiornamento...";

            const { error } = await CampaignService.updateEntity(entity.id, updates);
            if (error) {
                console.error(error);
                alert("Errore salvataggio: " + error.message);
                btnAction.disabled = false;
                btnAction.textContent = "Salva";
                return;
            }

            modal.style.display = 'none';
            this.loadTabContent(); // Refresh
        };

        modal.style.display = 'flex';
    }

    // --- NEW MODALS ---

    openPlayerPopup(member) {
        const modal = this.container.querySelector('#generic-modal');
        const body = this.container.querySelector('#modal-body');
        const btnAction = this.container.querySelector('#modal-action-btn');
        btnAction.style.display = 'none';

        const char = member.character_data || {};
        const profile = member.profile || {};

        body.innerHTML = `
            <div class="text-center">
                <div class="avatar" style="width: 100px; height: 100px; border-radius: 50%; background: #ccc; margin: 0 auto 15px; overflow: hidden; border: 4px solid var(--accent-gold); box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                    ${(char.image_url || profile.avatar_url) ? `<img src="${char.image_url || profile.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;">` : '<span style="line-height: 100px; font-size: 3rem;">👤</span>'}
                </div>
                <h2 style="font-family: var(--font-display); color: var(--accent-navy); margin-bottom: 5px;">${char.name || 'Sconosciuto'}</h2>
                <div style="font-size: 0.9rem; color: var(--text-faded); margin-bottom: 20px;">Giocato da: <strong>${profile.username || 'Sconosciuto'}</strong></div>
                
                <div style="background: rgba(255,255,255,0.4); padding: 15px; border-radius: 8px; border: 1px solid var(--border-worn); text-align: left;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Nazione:</span> <strong>${char.nation || '-'}</strong>
                    </div>
                    ${char.concept ? `
                        <div style="margin-top: 10px; font-style: italic; color: var(--text-faded); border-top: 1px dashed var(--border-worn); padding-top: 10px;">
                            "${char.concept}"
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    }

    openChangeBannerModal() {
        const modal = this.container.querySelector('#generic-modal');
        const body = this.container.querySelector('#modal-body');
        const btnAction = this.container.querySelector('#modal-action-btn');

        // Predefined banners (using placeholder colors/gradients if real assets missing, or assume assets exist)
        // I will use some online placeholders or gradients for now if assets don't exist.
        // Or I can use the existing `assets/dadi.png` type things? No.
        // Let's use simple gradients/solid colors as a gallery for now + Upload.
        const gallery = [
            'assets/banners/sea.jpg', // Assumption
            'assets/banners/map.jpg',
            'assets/banners/ship.jpg',
            'assets/banners/tavern.jpg'
        ]; // I don't validly have these.

        // I will just use colors for the gallery demo, or upload.

        body.innerHTML = `
            <h3 class="text-center" style="font-family: var(--font-display); color: var(--accent-gold);">Cambia Banner</h3>
            
            <div class="mb-20">
                <label>Carica Immagine:</label>
                <input type="file" id="banner-file" accept="image/*" style="display: block; width: 100%; margin-top: 5px;">
            </div>
            
            <div class="text-center mb-10">Oppure incolla URL:</div>
            <div style="position: relative; width: 100%; margin-bottom: 20px;">
                <input type="text" id="banner-url" class="input-field w-100" placeholder="https://..." value="${this.campaign.image_url || ''}" style="padding-right: 30px;">
                <button id="btn-clear-url" style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-faded); cursor: pointer; font-size: 1.2rem; display: ${this.campaign.image_url ? 'block' : 'none'};">✕</button>
            </div>
            
            <div id="banner-preview" style="width: 100%; height: 120px; background: #eee; margin-bottom: 20px; background-size: cover; background-position: center; border: 2px solid var(--border-color);"></div>
        `;

        const fileInput = body.querySelector('#banner-file');
        const urlInput = body.querySelector('#banner-url');
        const clearBtn = body.querySelector('#btn-clear-url');
        const preview = body.querySelector('#banner-preview');

        if (this.campaign.image_url) preview.style.backgroundImage = `url('${this.campaign.image_url}')`;

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    preview.style.backgroundImage = `url('${ev.target.result}')`;
                    urlInput.value = ''; // Update UI
                    clearBtn.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });

        urlInput.addEventListener('input', (e) => {
            preview.style.backgroundImage = `url('${e.target.value}')`;
            clearBtn.style.display = e.target.value ? 'block' : 'none';
        });

        clearBtn.addEventListener('click', () => {
            urlInput.value = '';
            preview.style.backgroundImage = 'none';
            clearBtn.style.display = 'none';
            fileInput.value = '';
        });

        btnAction.style.display = 'block';
        btnAction.textContent = "Salva Banner";
        btnAction.onclick = async () => {
            let imageUrl = urlInput.value;
            const file = fileInput.files[0];

            btnAction.disabled = true;
            btnAction.textContent = "Caricamento...";

            if (file) {
                const { publicUrl, error } = await CampaignService.uploadImage(file);
                if (error) {
                    alert("Errore upload: " + error.message);
                    btnAction.disabled = false;
                    return;
                }
                imageUrl = publicUrl;
            }

            const { error } = await CampaignService.updateCampaign(this.campaignId, { image_url: imageUrl });
            if (error) {
                alert("Errore salvataggio: " + error.message);
                btnAction.disabled = false;
            } else {
                this.campaign.image_url = imageUrl; // Optimistic update
                modal.style.display = 'none';
                this.renderView(); // Refresh header
            }
        };

        modal.style.display = 'flex';
    }

    openViewStoryModal(story) {
        // Full screen reading mode
        const modal = this.container.querySelector('#generic-modal');
        const body = this.container.querySelector('#modal-body');
        const btnAction = this.container.querySelector('#modal-action-btn');
        btnAction.style.display = 'none'; // Only Close button needed

        body.innerHTML = `
            <div style="font-family: 'Times New Roman', serif; color: #333;">
                <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid var(--accent-gold); padding-bottom: 15px;">
                    <h2 style="font-family: var(--font-display); color: var(--accent-navy); margin-bottom: 5px;">${story.title}</h2>
                    <div style="font-size: 0.8rem; color: var(--text-faded);">${new Date(story.created_at).toLocaleDateString()}</div>
                </div>
                <div class="markdown-body" style="font-size: 1.1rem; line-height: 1.8; white-space: pre-wrap;">${story.content}</div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    openStoryContextMenu(story) {
        const existingMenu = document.getElementById('ctx-menu-story');
        if (existingMenu) existingMenu.remove();

        // GM Only mostly
        if (this.myRole !== 'gm') return;

        const menu = document.createElement('div');
        menu.id = 'ctx-menu-story';
        menu.className = 'modal-overlay';
        menu.style.display = 'flex';
        menu.style.alignItems = 'center';
        menu.style.justifyContent = 'center';
        menu.style.background = 'rgba(0,0,0,0.6)';
        menu.style.zIndex = '10000';
        menu.style.backdropFilter = 'blur(2px)';

        menu.innerHTML = `
            <div class="modal-content" style="width: 250px; background: #fdfaf5; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid var(--accent-gold); box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                <h4 style="margin-bottom: 20px; font-family: var(--font-display); color: var(--accent-navy);">${story.title}</h4>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button id="st-open" class="btn btn-primary" style="width: 100%;">📖 Leggi</button>
                    <button id="st-toggle" class="btn btn-secondary" style="width: 100%;">${story.is_visible ? '🔒 Nascondi' : '👁️ Mostra'}</button>
                    <button id="st-delete" class="btn btn-secondary" style="width: 100%; color: var(--accent-red); border-color: var(--accent-red);">🗑️ Elimina</button>
                    <button id="st-cancel" class="btn btn-secondary" style="width: 100%; margin-top: 5px;">Annulla</button>
                </div>
            </div>
        `;
        document.body.appendChild(menu);

        // Prevent click inside menu from closing it (bubbling to overlay)
        menu.querySelector('.modal-content').addEventListener('click', (e) => e.stopPropagation());

        menu.querySelector('#st-open').onclick = () => {
            menu.remove();
            this.openViewStoryModal(story);
        };

        menu.querySelector('#st-toggle').onclick = async () => {
            menu.remove();
            await CampaignService.updateStoryVisibility(story.id, !story.is_visible);
            this.loadTabContent();
        };

        menu.querySelector('#st-delete').onclick = async () => {
            if (confirm("Sei sicuro di voler eliminare questo diario?")) {
                menu.remove();
                await CampaignService.deleteStory(story.id);
                this.loadTabContent();
            }
        };

        menu.querySelector('#st-cancel').onclick = () => menu.remove();
        menu.onclick = (e) => { if (e.target === menu) menu.remove(); };
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
        <div id="char-selection-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 15px; padding: 10px; max-height: 400px; overflow-y: auto;">

            ${localChars.length > 0 ? localChars.map(c => `
                    <div class="card char-option" data-id="${c.id}" style="
                        padding: 10px; 
                        display: flex; 
                        flex-direction: column; 
                        align-items: center; 
                        gap: 10px; 
                        cursor: pointer; 
                        border: 2px solid transparent; 
                        transition: all 0.2s;
                        background: white;
                    ">
                        <div class="avatar" style="
                            width: 70px; 
                            height: 70px; 
                            border-radius: 12px; 
                            overflow: hidden; 
                            background: #ddd; 
                            border: 2px solid var(--accent-gold);
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        ">
                            ${c.image ? `<img src="${c.image}" style="width: 100%; height: 100%; object-fit: cover;">` : '<span style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 2rem;">👤</span>'}
                        </div>
                        <div style="font-weight: bold; text-align: center; font-size: 0.9rem; line-height: 1.2;">
                            ${c.name}
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-faded);">${c.nation || ''}</div>
                    </div>
                `).join('') : '<div class="text-center" style="grid-column: 1/-1;">Non hai creato nessun personaggio sul dispositivo!</div>'}
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
            await this.refreshCampaignData();
            modal.style.display = 'none';
            this.loadTabContent();
        };

        modal.style.display = 'flex';
    }

    async refreshCampaignData() {
        const { data, error } = await CampaignService.getCampaignDetails(this.campaignId);
        if (!error && data) {
            this.campaign = data;
            const myId = AuthService.user?.id;
            // Update role/member data
            this.myRole = this.campaign.members.find(m => m.user_id === myId)?.role || 'player';
        }
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
                <select id="ent-nat" class="input-field" style="flex: 1;">
                    <option value="">-- Nazionalità --</option>
                    <option value="Avalon">Avalon</option>
                    <option value="Castille">Castille</option>
                    <option value="Eisen">Eisen</option>
                    <option value="Montaigne">Montaigne</option>
                    <option value="Sarmatia">Sarmatia</option>
                    <option value="Ussura">Ussura</option>
                    <option value="Vestenmennavenjar">Vesten</option>
                    <option value="Vodacce">Vodacce</option>
                    <option value="La Bucca">La Bucca</option>
                    <option value="Aragosta">Aragosta</option>
                    <option value="Numa">Numa</option>
                    <option value="Cathay">Cathay</option>
                    <option value="Crescent">Crescent</option>
                </select>
            </div>

            <div class="input-field mb-10" style="text-align: center; border: 1px dashed var(--border-color); padding: 10px; border-radius: 8px;">
                <label for="ent-file" class="btn btn-secondary btn-sm" style="display: block; width: 100%; margin-bottom: 5px; cursor: pointer;">📷 Carica Immagine</label>
                <input type="file" id="ent-file" style="display: none;" accept="image/*">
                <div id="img-preview" style="width: 100px; height: 100px; background: #eee; margin: 10px auto; overflow: hidden; border-radius: 8px; display: none; border: 2px solid var(--accent-gold);"></div>
                <div style="font-size: 0.8rem; color: var(--text-faded); margin: 5px 0;">OPPURE</div>
                <div style="display: flex; gap: 5px;">
                    <input type="text" id="ent-img" placeholder="Incolla URL immagine..." style="flex: 1;">
                    <button id="btn-paste-clipboard" class="btn btn-secondary btn-sm" style="padding: 5px 10px;" title="Incolla da Appunti">📋</button>
                </div>
                <div id="paste-hint" style="font-size: 0.75rem; color: var(--text-faded); margin-top: 5px; font-style: italic;">Puoi anche incollare un'immagine (CTRL+V)</div>
            </div>

            <div class="input-field mb-10">
                <textarea id="ent-desc" placeholder="Descrizione..." style="width: 100%; height: 100px; padding: 10px;"></textarea>
            </div>
            
            <div class="input-field mb-10" style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="ent-visible" style="width: auto;">
                <label for="ent-visible">Visibile ai giocatori?</label>
            </div>
`;

        const fileInput = body.querySelector('#ent-file');
        const preview = body.querySelector('#img-preview');
        const urlInput = body.querySelector('#ent-img');

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    preview.style.display = 'block';
                    preview.innerHTML = `<img src="${ev.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
                };
                reader.readAsDataURL(file);
            }
        });

        btnAction.style.display = 'block';
        btnAction.textContent = "Crea";
        btnAction.disabled = false;

        btnAction.onclick = async () => {
            const type = document.getElementById('ent-type').value;
            const name = document.getElementById('ent-name').value;
            const level = document.getElementById('ent-level').value;
            const nationality = document.getElementById('ent-nat').value;
            const description = document.getElementById('ent-desc').value;
            const is_visible = document.getElementById('ent-visible').checked;

            let image_url = urlInput.value;
            const file = fileInput.files[0];

            if (!name) return alert("Inserisci almeno il nome");

            btnAction.disabled = true;

            if (file) {
                btnAction.textContent = "Caricamento Immagine...";
                const { publicUrl, error } = await CampaignService.uploadImage(file);
                if (error) {
                    alert("Errore caricamento immagine: " + (error.message || error));
                    btnAction.disabled = false;
                    btnAction.textContent = "Crea";
                    return;
                }
                image_url = publicUrl;
            }

            const entityData = { name, type, level, nationality, image_url, description, is_visible };

            btnAction.textContent = "Salvataggio...";
            const { error: addError } = await CampaignService.addEntity(this.campaignId, entityData);

            if (addError) {
                console.error("Add Entity Error:", addError);
                alert("Errore durante la creazione: " + (addError.message || addError));
                btnAction.textContent = "Crea";
                btnAction.disabled = false;
                return;
            }

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
            <div class="entity-view-modal">
                <div class="entity-image-large" style="width: 100%; aspect-ratio: 16/9; background: #eee; border-radius: 8px; overflow: hidden; border: 2px solid var(--accent-gold); box-shadow: 0 4px 15px rgba(0,0,0,0.3); margin-bottom: 20px; position: relative;">
                    ${e.image_url ?
                `<img src="${e.image_url}" style="width: 100%; height: 100%; object-fit: cover;">` :
                `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 4rem; color: var(--text-faded);">${icons[e.type] || '❓'}</div>`
            }
                    ${e.type ? `<div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; text-transform: uppercase; font-weight: bold;">${e.type === 'item' ? 'Oggetto' : (e.type === 'enemy' ? 'Avversario' : 'NPC')}</div>` : ''}
                </div>
                
                <h2 style="font-family: var(--font-display); color: var(--accent-navy); margin-bottom: 5px; text-align: center; font-size: 1.8rem;">${e.name}</h2>
                
                <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; font-size: 1rem;">
                    ${e.level ? `<span style="background: var(--accent-gold); color: white; padding: 2px 12px; border-radius: 12px; font-weight: bold;">Liv. ${e.level}</span>` : ''}
                    ${e.nationality ? `<span style="font-style: italic; color: var(--text-faded); border: 1px solid var(--border-color); padding: 2px 10px; border-radius: 12px;">${e.nationality}</span>` : ''}
                </div>

                <div style="text-align: left; padding: 20px; background: rgba(255,255,255,0.8); border-radius: 12px; white-space: pre-wrap; line-height: 1.6; border: 1px solid var(--border-worn); font-size: 1.05rem; box-shadow: inset 0 0 10px rgba(0,0,0,0.05);">
                    ${e.description || 'Nessuna descrizione disponibile.'}
                </div>
            </div>
    `;

        btnAction.style.display = 'none';
        modal.style.display = 'flex';
    }
}
