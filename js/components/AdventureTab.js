
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

    async render(container) {
        if (container) this.container = container;
        if (!this.container) return;

        const user = AuthService.getUser(); // Sync get from cached state

        if (this.loading) {
            this.container.innerHTML = '<div class="text-center p-20">Caricamento...</div>';
            return;
        }

        if (!user) {
            this.renderAuthForm();
        } else {
            await this.renderDashboard(user);
        }
    }

    renderAuthForm() {
        this.container.innerHTML = `
            <div class="settings-container text-center" style="max-width: 400px; margin: 0 auto;">
                <h2 class="page-title">Avventure Online</h2>
                <p style="color: var(--text-faded); margin-bottom: 30px;">
                    Accedi per salvare i tuoi personaggi nel cloud<br>e partecipare alle campagne condivise.
                </p>

                <div class="settings-card" style="padding: 20px;">
                    <div class="input-field mb-20">
                        <input type="email" id="auth-email" placeholder="Email" style="width: 100%; background: transparent; border: none; outline: none;">
                    </div>
                    <div class="input-field mb-20">
                        <input type="password" id="auth-password" placeholder="Password" style="width: 100%; background: transparent; border: none; outline: none;">
                    </div>
                    
                    <button class="btn btn-primary w-100 mb-20" id="btn-login">Accedi</button>
                    <button class="btn btn-secondary w-100" id="btn-signup">Registrati</button>

                    <div id="auth-error" style="color: var(--accent-red); margin-top: 15px; font-size: 0.9rem; display: none;"></div>
                </div>
            </div>
        `;

        this.attachAuthListeners();
    }

    attachAuthListeners() {
        const emailInput = this.container.querySelector('#auth-email');
        const passInput = this.container.querySelector('#auth-password');
        const errorDiv = this.container.querySelector('#auth-error');

        const showError = (msg) => {
            errorDiv.textContent = msg;
            errorDiv.style.display = 'block';
        };

        this.container.querySelector('#btn-login').addEventListener('click', async () => {
            const email = emailInput.value;
            const pass = passInput.value;
            if (!email || !pass) return showError("Inserisci email e password");

            this.loading = true;
            this.render(); // Show loading

            const { error } = await AuthService.signIn(email, pass);
            this.loading = false;

            if (error) {
                this.render(); // Re-render form
                // Need to re-find error div after re-render
                setTimeout(() => this.container.querySelector('#auth-error').textContent = "Errore: " + error.message, 0);
            } else {
                // Auth change event will trigger re-render
            }
        });

        this.container.querySelector('#btn-signup').addEventListener('click', async () => {
            const email = emailInput.value;
            const pass = passInput.value;
            if (!email || !pass) return showError("Inserisci email e password");

            this.loading = true;
            this.render();

            const { error } = await AuthService.signUp(email, pass);
            this.loading = false;

            if (error) {
                this.render();
                setTimeout(() => this.container.querySelector('#auth-error').textContent = "Errore: " + error.message, 0);
            } else {
                alert("Controlla la tua email per confermare la registrazione!");
                this.render();
            }
        });
    }

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
                            <div class="card campaign-card" style="border-left: 4px solid ${c.role === 'gm' ? 'var(--accent-gold)' : 'var(--accent-navy)'}; padding: 15px;">
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
