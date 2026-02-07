
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
        `;

        this.container.querySelector('#btn-logout').addEventListener('click', async () => {
            await AuthService.signOut();
        });

        this.container.querySelector('#btn-create-campaign').addEventListener('click', () => {
            const title = prompt("Nome della Campagna:");
            if (title) {
                CampaignService.createCampaign(title).then(({ error }) => {
                    if (error) alert("Errore: " + error.message);
                    else this.render();
                });
            }
        });

        this.container.querySelector('#btn-join-campaign').addEventListener('click', () => {
            const code = prompt("Inserisci codice invito:");
            if (code) {
                CampaignService.joinCampaign(code).then(({ error }) => {
                    if (error) alert("Errore: " + error.message);
                    else this.render();
                });
            }
        });
    }
}
