
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
            let user = AuthService.getUser();

            // Double check session if user is missing (fixes refresh bounce)
            if (!user && supabaseClient) {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session?.user) {
                    user = session.user;
                    // Sync back to AuthService if needed (optional, but good for consistency)
                    if (AuthService.setUser) AuthService.setUser(user);
                    else AuthService.user = user;
                }
            }

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

    renderAuthForm() {
        this.container.innerHTML = `
            <div class="auth-container" style="max-width: 400px; margin: 0 auto; padding: 20px;">
                <div class="card p-20">
                    <h3 class="text-center mb-20" style="font-family: var(--font-display); color: var(--accent-gold); font-size: 1.5rem;">Avventure Online</h3>
                    
                    <div class="tabs mb-20" style="display: flex; justify-content: center; gap: 10px;">
                        <button class="btn btn-sm btn-primary active" id="tab-login">Accedi</button>
                        <button class="btn btn-sm btn-secondary" id="tab-register">Registrati</button>
                    </div>

                    <form id="auth-form">
                        <div class="form-group mb-15">
                            <label style="display: block; margin-bottom: 5px; color: var(--text-faded);">Email</label>
                            <input type="email" id="auth-email" class="input-field w-100" required>
                        </div>
                        
                        <div class="form-group mb-20">
                            <label style="display: block; margin-bottom: 5px; color: var(--text-faded);">Password</label>
                            <input type="password" id="auth-password" class="input-field w-100" required>
                        </div>
                        
                        <div class="text-right mb-20">
                            <a href="#" id="btn-forgot-password" style="font-size: 0.8rem; color: var(--accent-gold); text-decoration: none;">Password dimenticata?</a>
                        </div>

                        <div id="auth-error" class="mb-15 text-center" style="color: red; font-size: 0.9rem; display: none;"></div>

                        <button type="submit" class="btn btn-primary w-100" id="btn-submit">Accedi</button>
                    </form>
                    
                    <div class="text-center mt-20" style="font-size: 0.8rem; color: var(--text-faded);">
                        Sincronizza le tue schede e gioca online.
                    </div>
                </div>
            </div>
        `;

        this.attachAuthListeners();
    }

    attachAuthListeners() {
        const form = this.container.querySelector('#auth-form');
        const emailInput = this.container.querySelector('#auth-email');
        const passwordInput = this.container.querySelector('#auth-password');
        const btnSubmit = this.container.querySelector('#btn-submit');
        // const errorDiv = this.container.querySelector('#auth-error'); // Removed inline error
        const tabLogin = this.container.querySelector('#tab-login');
        const tabRegister = this.container.querySelector('#tab-register');
        const btnForgot = this.container.querySelector('#btn-forgot-password');

        let isLogin = true;

        const toggleMode = (login) => {
            isLogin = login;
            /* Update UI */
            tabLogin.className = `btn btn-sm ${isLogin ? 'btn-primary active' : 'btn-secondary'}`;
            tabRegister.className = `btn btn-sm ${!isLogin ? 'btn-primary active' : 'btn-secondary'}`;
            btnSubmit.textContent = isLogin ? 'Accedi' : 'Registrati';
            // btnForgot.style.display = isLogin ? 'inline-block' : 'none'; // Optional: hide on register
        };

        tabLogin.addEventListener('click', (e) => { e.preventDefault(); toggleMode(true); });
        tabRegister.addEventListener('click', (e) => { e.preventDefault(); toggleMode(false); });

        // Forgot Password Handler
        if (btnForgot) {
            btnForgot.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPasswordResetModal(emailInput.value);
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) return;

            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Caricamento...';
            // errorDiv.style.display = 'none';

            let result;
            if (isLogin) {
                result = await AuthService.signIn(email, password);
            } else {
                result = await AuthService.signUp(email, password, email.split('@')[0]);
            }

            btnSubmit.disabled = false;
            btnSubmit.textContent = isLogin ? 'Accedi' : 'Registrati';

            if (result.error) {
                // errorDiv.textContent = result.error.message;
                // errorDiv.style.display = 'block';
                this.showErrorPopup(result.error.message);
            } else {
                // Success
                if (!isLogin) {
                    // Registration success
                    this.showSuccessPopup("Registrazione avvenuta! Controlla la tua email per confermare l'account.");
                }
            }
        });
    }

    showErrorPopup(message) {
        const modalHtml = `
            <div class="text-center">
                <div style="font-size: 3rem; margin-bottom: 10px;">☠️</div>
                <h3 style="font-family: var(--font-display); color: var(--accent-red); margin-bottom: 15px;">Errore Pirata!</h3>
                <p style="margin-bottom: 20px;">${message}</p>
                <button class="btn btn-primary w-100" id="btn-close-error">Riprova</button>
            </div>
        `;
        window.app.showModal(modalHtml); // Assuming window.app is accessible or pass app instance
        // Or implement simplified modal here if window.app not reliable
    }

    showSuccessPopup(message) {
        const modalHtml = `
            <div class="text-center">
                <div style="font-size: 3rem; margin-bottom: 10px;">⚓</div>
                <h3 style="font-family: var(--font-display); color: var(--accent-gold); margin-bottom: 15px;">Successo!</h3>
                <p style="margin-bottom: 20px;">${message}</p>
                <button class="btn btn-primary w-100" id="btn-close-success">Avanti</button>
            </div>
        `;
        window.app.showModal(modalHtml);
    }

    showPasswordResetModal(initialEmail = '') {
        const modalHtml = `
            <div class="text-center">
                <h3 style="font-family: var(--font-display); color: var(--accent-gold); margin-bottom: 15px;">Recupero Password</h3>
                <p class="mb-15" style="font-size: 0.9rem;">Inserisci la tua email. Se esiste un account, riceverai un link per resettare la password.</p>
                <input type="email" id="reset-email" class="input-field w-100 mb-20" value="${initialEmail}" placeholder="tua@email.com">
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary w-50" id="btn-reset-cancel">Annulla</button>
                    <button class="btn btn-primary w-50" id="btn-reset-confirm">Invia</button>
                </div>
            </div>
        `;
        window.app.showModal(modalHtml);

        // Attach listeners (Need to wait for modal to be in DOM)
        setTimeout(() => {
            document.getElementById('btn-reset-cancel').addEventListener('click', () => window.app.closeModal());
            document.getElementById('btn-reset-confirm').addEventListener('click', async () => {
                const email = document.getElementById('reset-email').value.trim();
                if (!email) return;

                const btn = document.getElementById('btn-reset-confirm');
                btn.disabled = true;
                btn.textContent = "...";

                const { error } = await AuthService.resetPasswordForEmail(email);

                if (error) {
                    this.showErrorPopup(error.message);
                } else {
                    this.showSuccessPopup("Email di recupero inviata! Controlla la tua casella di posta.");
                }
            });
        }, 100);
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
                            <div class="card campaign-card" data-id="${c.id}" style="border-left: 4px solid ${c.my_role === 'gm' ? 'var(--accent-gold)' : 'var(--accent-navy)'}; padding: 15px; cursor: pointer; transition: transform 0.2s; user-select: none;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <h3 style="margin: 0; font-family: var(--font-display); font-size: 1.1rem;">${c.title}</h3>
                                    <span class="badge" style="background: ${c.my_role === 'gm' ? 'var(--accent-gold)' : 'var(--accent-navy)'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem;">${c.my_role === 'gm' ? 'GM' : 'PLAYER'}</span>
                                </div>
                                <div style="font-size: 0.9rem; color: var(--text-faded); margin-top: 5px;">
                                    Codice: <span style="font-family: monospace; background: rgba(0,0,0,0.1); padding: 2px 5px; border-radius: 3px;">${c.join_code}</span>
                                </div>
                            </div>
                        `).join('') : '<div class="text-center italic" style="color: var(--text-faded)">Nessuna campagna attiva.</div>'}
                    </div>
                </div>
            </div>
        `;

        this.attachDashboardListeners(campaigns);
    }

    attachDashboardListeners(campaigns) {
        // Create/Join Buttons
        this.container.querySelector('#btn-create-campaign')?.addEventListener('click', () => this.openCreateCampaignModal());
        this.container.querySelector('#btn-join-campaign')?.addEventListener('click', () => this.openJoinCampaignModal());
        this.container.querySelector('#btn-logout')?.addEventListener('click', async () => {
            await AuthService.signOut();
            window.location.reload();
        });

        // Campaign Cards
        const cards = this.container.querySelectorAll('.campaign-card');
        cards.forEach(card => {
            const id = card.dataset.id;
            const campaign = campaigns.find(c => c.id === id);

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
                    if (navigator.vibrate) navigator.vibrate(50);
                    this.openCampaignContextMenu(campaign);
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
                // Navigate
                if (this.navigateCallback) this.navigateCallback('campaign-detail', { id });
            });

            // CONTEXT MENU
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.openCampaignContextMenu(campaign);
            });
        });
    }

    openCampaignContextMenu(campaign) {
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

        const isGm = campaign.my_role === 'gm';

        menu.innerHTML = `
            <div class="modal-content" style="width: 90%; max-width: 320px; background: #fdfaf5; border-radius: 16px; padding: 25px; text-align: center; border: 2px solid var(--accent-gold); box-shadow: 0 10px 40px rgba(0,0,0,0.5); transform: scale(0.9); animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;">
                <h3 style="margin-bottom: 20px; font-family: var(--font-display); font-size: 1.4rem; color: var(--accent-navy);">${campaign.title}</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button class="btn btn-primary" id="ctx-open" style="width: 100%; padding: 12px;">Desidera Entrare</button>
                    ${isGm ? `
                        <button class="btn btn-secondary" id="ctx-edit" style="width: 100%; padding: 12px;">✏️ Modifica Titolo</button>
                        <button class="btn btn-secondary" id="ctx-dup" style="width: 100%; padding: 12px;">👯 Duplica</button>
                        <button class="btn btn-secondary" id="ctx-del" style="width: 100%; padding: 12px; color: var(--accent-red); border-color: var(--accent-red);">🗑️ Elimina</button>
                    ` : ''}
                    <button class="btn btn-secondary" id="ctx-cancel" style="width: 100%; padding: 12px; margin-top: 5px;">Annulla</button>
                </div>
            </div>
            <style>@keyframes popIn { to { transform: scale(1); } }</style>
        `;

        document.body.appendChild(menu);

        // Actions
        menu.querySelector('#ctx-open').onclick = () => {
            menu.remove();
            if (this.navigateCallback) this.navigateCallback('campaign-detail', { id: campaign.id });
        };
        menu.querySelector('#ctx-cancel').onclick = () => menu.remove();
        menu.onclick = (e) => { if (e.target === menu) menu.remove(); };

        if (isGm) {
            menu.querySelector('#ctx-edit').onclick = () => {
                menu.remove();
                this.openEditCampaignModal(campaign);
            };
            menu.querySelector('#ctx-dup').onclick = async () => {
                menu.remove();
                if (!confirm("Duplicare la campagna?")) return;
                const { error } = await CampaignService.duplicateCampaign(campaign.id);
                if (error) this.showErrorPopup(error.message);
                else this.render();
            };
            menu.querySelector('#ctx-del').onclick = async () => {
                menu.remove();
                if (!confirm("SEI SICURO? Questa azione è irreversibile e cancellerà tutto.")) return;
                const { error } = await CampaignService.deleteCampaign(campaign.id);
                if (error) this.showErrorPopup(error.message);
                else this.render();
            };
        }
    }

    openEditCampaignModal(campaign) {
        const newTitle = prompt("Nuovo titolo:", campaign.title);
        if (newTitle && newTitle !== campaign.title) {
            CampaignService.updateCampaign(campaign.id, { title: newTitle }).then(() => this.render());
        }
    }

    // MODALS (Create/Join)
    openCreateCampaignModal() {
        const title = prompt("Nome della nuova Avventura:");
        if (title) {
            CampaignService.createCampaign(title).then(res => {
                if (res.error) this.showErrorPopup(res.error.message);
                else this.render();
            });
        }
    }

    openJoinCampaignModal() {
        const code = prompt("Inserisci codice invito:");
        if (code) {
            CampaignService.joinCampaign(code).then(res => {
                if (res.error) this.showErrorPopup(res.error.message);
                else this.render();
            });
        }
    }
}
