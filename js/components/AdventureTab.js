
import { AuthService } from '../services/AuthService.js';
import { supabaseClient } from '../services/SupabaseClient.js';
import { CampaignService } from '../services/CampaignService.js';

export class AdventureTab {
    constructor() {
        this.container = null;
        this.loading = false;

        // Listen for auth changes to re-render
        window.addEventListener('auth:change', (e) => {
            this.render();
        });
    }

    async render(container, navigateCallback) {
        if (container) this.container = container;
        if (navigateCallback) this.navigateCallback = navigateCallback;
        if (!this.container) return;

        try {
            const user = AuthService.getUser(); // Sync get from cached state
            console.log('AdventureTab: User state:', user);

            if (this.loading) {
                this.container.innerHTML = '<div class="text-center p-20">Caricamento...</div>';
                return;
            }

            if (!user) {
                this.renderAuthForm();
            } else {
                await this.renderDashboard(user);
            }
        } catch (error) {
            console.error('AdventureTab Render Error:', error);
            this.container.innerHTML = `<div class="text-center p-20" style="color: red;">Errore nel caricamento: ${error.message}</div>`;
        }
    }

    // ... (renderAuthForm remains same) ...

    async renderDashboard(user) {
        const { data: campaigns } = await CampaignService.getMyCampaigns();

        this.container.innerHTML = `
            <div class="settings-container">
                <div class="char-header text-center" style="position: relative;">
                    <div style="font-size: 0.8rem; color: var(--text-faded); margin-bottom: 5px;">ACCOUNT</div>
                    <div style="font-family: var(--font-display); font-size: 1.2rem;">${user.email.split('@')[0]}</div>
                    <button class="btn btn-xs btn-secondary" id="btn-logout" style="margin-top: 10px;">Esci</button>
                </div>

                <div class="sheet-section">
                    <div class="sheet-section-title">Le mie Campagne</div>
                    
                    <div class="text-center mb-20">
                        <button class="btn btn-primary" id="btn-create-campaign">+ Crea Nuova</button>
                        <button class="btn btn-secondary" id="btn-join-campaign">Unisciti</button>
                    </div>

                    <div id="campaign-list" style="display: flex; flex-direction: column; gap: 15px;">
                        ${campaigns && campaigns.length > 0 ? campaigns.map(c => `
                            <div class="card campaign-card" data-id="${c.id}" style="border-left: 4px solid ${c.role === 'gm' ? 'var(--accent-gold)' : 'var(--accent-navy)'}; padding: 15px; cursor: pointer; transition: transform 0.2s;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <h3 style="margin: 0; font-size: 1.1rem;">${c.title}</h3>
                                    <span class="badge" style="background: ${c.role === 'gm' ? 'var(--accent-gold)' : 'var(--accent-navy)'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem;">${c.role === 'gm' ? 'GM' : 'PLAYER'}</span>
                                </div>
                                <div style="font-size: 0.9rem; color: var(--text-faded); margin-top: 5px;">
                                    Codice: <span style="font-family: monospace; background: rgba(0,0,0,0.1); padding: 2px 5px; border-radius: 3px;">${c.join_code}</span>
                                </div>
                            </div>
                        `).join('') : `
                            <div class="text-center" style="color: var(--text-faded); font-style: italic;">
                                Nessuna campagna attiva.
                            </div>
                        `}
                    </div>
                </div>
            </div>

            <!-- Campaign Modal -->
            <div id="campaign-modal" class="modal-overlay" style="display: none; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; backdrop-filter: blur(2px); background: rgba(0,0,0,0.4);">
                <div class="modal-content" style="width: 90%; max-width: 350px; padding: 25px; border: 2px solid var(--accent-gold); box-shadow: 0 10px 40px rgba(0,0,0,0.6); border-radius: 16px; background: #fdfaf5;">
                    <h3 id="modal-title" style="text-align: center; margin-bottom: 20px; font-family: var(--font-display); color: var(--accent-gold); font-size: 1.5rem;"></h3>
                    <input type="text" id="modal-input" class="input-field mb-20" style="width: 100%; text-align: center;">
                    <div style="display: flex; gap: 10px;">
                        <button id="modal-cancel" class="btn btn-secondary w-50">Annulla</button>
                        <button id="modal-confirm" class="btn btn-primary w-50">Conferma</button>
                    </div>
                </div>
            </div>
        `;

        this.attachDashboardListeners();

        // Add click listeners to cards
        this.container.querySelectorAll('.campaign-card').forEach(card => {
            card.addEventListener('click', () => {
                if (this.navigateCallback) {
                    this.navigateCallback('campaign-detail', { id: card.dataset.id });
                }
            });
        });
    }

    attachDashboardListeners() {
        // Logout
        this.container.querySelector('#btn-logout').addEventListener('click', async () => {
            await AuthService.signOut();
        });

        const modal = this.container.querySelector('#campaign-modal');
        const modalTitle = this.container.querySelector('#modal-title');
        const modalInput = this.container.querySelector('#modal-input');
        const btnConfirm = this.container.querySelector('#modal-confirm');
        const btnCancel = this.container.querySelector('#modal-cancel');

        let currentAction = null; // 'create' or 'join'

        const openModal = (action) => {
            currentAction = action;
            modal.style.display = 'flex';
            modalInput.value = '';
            if (action === 'create') {
                modalTitle.textContent = "Nuova Campagna";
                modalInput.placeholder = "Nome della campagna";
            } else {
                modalTitle.textContent = "Unisciti";
                modalInput.placeholder = "Codice invito";
            }
            modalInput.focus();
        };

        const closeModal = () => {
            modal.style.display = 'none';
            currentAction = null;
        };

        // Modal triggers
        this.container.querySelector('#btn-create-campaign').addEventListener('click', () => openModal('create'));
        this.container.querySelector('#btn-join-campaign').addEventListener('click', () => openModal('join'));

        // Modal Actions
        btnCancel.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        btnConfirm.addEventListener('click', async () => {
            const value = modalInput.value.trim();
            if (!value) return;

            btnConfirm.disabled = true;
            btnConfirm.textContent = "...";

            let result;
            if (currentAction === 'create') {
                result = await CampaignService.createCampaign(value);
            } else {
                result = await CampaignService.joinCampaign(value);
            }

            btnConfirm.disabled = false;
            btnConfirm.textContent = "Conferma";

            if (result.error) {
                alert("Errore: " + result.error.message);
            } else {
                closeModal();
                this.render(); // Refresh list
            }
        });
    }
}
