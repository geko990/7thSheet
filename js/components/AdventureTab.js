
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
        const bgHtml = `
            <div class="fixed-char-bg" style="position: fixed; bottom: 50px; left: 50%; transform: translateX(-50%); width: 100%; max-width: 500px; z-index: 0; pointer-events: none; opacity: 0.5; mask-image: linear-gradient(to top, black 80%, transparent 100%); -webkit-mask-image: linear-gradient(to top, black 80%, transparent 100%);">
                <img src="assets/Avventure.png" alt="" style="width: 100%;">
            </div>
        `;

        this.container.innerHTML = bgHtml + `
            <div class="text-center p-20" style="max-width: 400px; margin: 40px auto; position: relative; z-index: 1;">
                <div style="font-size: 4rem; margin-bottom: 20px;">🏴‍☠️</div>
                <h3 style="font-family: var(--font-display); color: var(--accent-gold); margin-bottom: 15px;">Avventure Condivise</h3>
                <p style="margin-bottom: 30px; line-height: 1.6;">
                    Per lanciarti in mare verso avventure condivise, è necessario accedere dalle opzioni.
                </p>
                <button class="btn btn-primary" id="btn-goto-settings">Vai alle Opzioni ⚙️</button>
            </div>
        `;

        this.container.querySelector('#btn-goto-settings').addEventListener('click', () => {
            window.app.router.navigate('settings');
        });
    }

    // attachAuthListeners removed as it is now handled in Settings.js

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
        // Load unread counts for all campaigns
        const { data: unreadCounts } = await CampaignService.getTotalUnreadCounts();
        const counts = unreadCounts || {};

        const bgHtml = `
            <div class="fixed-char-bg" style="position: fixed; bottom: 50px; left: 50%; transform: translateX(-50%); width: 100%; max-width: 500px; z-index: 0; pointer-events: none; opacity: 0.5; mask-image: linear-gradient(to top, black 80%, transparent 100%); -webkit-mask-image: linear-gradient(to top, black 80%, transparent 100%);">
                <img src="assets/Avventure.png" alt="" style="width: 100%;">
            </div>
        `;

        this.container.innerHTML = bgHtml + `
            <div class="settings-container" style="position: relative; z-index: 1;">
                <div class="sheet-section">
                    <div class="sheet-section-title">Le mie Campagne</div>
                    
                    <div class="text-center mb-20">
                        <button class="btn btn-primary" id="btn-create-campaign">+ Crea Nuova</button>
                        <button class="btn btn-secondary" id="btn-join-campaign">Unisciti</button>
                    </div>

                    <div id="campaign-list" style="display: flex; flex-direction: column; gap: 15px;">
                        ${campaigns && campaigns.length > 0 ? campaigns.map(c => {
            const unread = counts[c.id] || 0;
            return `
                            <div class="card campaign-card" data-id="${c.id}" style="border-left: 4px solid ${c.my_role === 'gm' ? 'var(--accent-gold)' : 'var(--accent-navy)'}; padding: 15px; cursor: pointer; transition: transform 0.2s; user-select: none; background: #fdfaf5; position: relative;">
                                ${unread > 0 ? `<div style="position: absolute; top: -8px; right: -8px; background: var(--accent-red); color: white; font-size: 0.8rem; min-width: 24px; height: 24px; line-height: 24px; border-radius: 12px; text-align: center; font-weight: bold; border: 2px solid #fdfaf5; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">💬 ${unread}</div>` : ''}
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <h3 style="margin: 0; font-family: var(--font-display); font-size: 1.1rem;">${c.title}</h3>
                                    <span class="badge" style="background: ${c.my_role === 'gm' ? 'var(--accent-gold)' : 'var(--accent-navy)'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem;">${c.my_role === 'gm' ? 'GM' : 'PLAYER'}</span>
                                </div>
                                <div style="font-size: 0.9rem; color: var(--text-faded); margin-top: 5px;">
                                    Codice: <span style="font-family: monospace; background: rgba(0,0,0,0.1); padding: 2px 5px; border-radius: 3px;">${c.join_code}</span>
                                </div>
                            </div>
                        `;
        }).join('') : '<div class="text-center italic" style="color: var(--text-faded)">Nessuna campagna attiva.</div>'}
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

        // Logout listener removed as button is gone

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

    // MODALS (Create/Join)
    openCreateCampaignModal() {
        const modalHtml = `
            <div class="text-center">
                <h3 style="font-family: var(--font-display); color: var(--accent-gold); margin-bottom: 15px;">Nuova Avventura</h3>
                <input type="text" id="new-campaign-title" class="input-field w-100 mb-20" placeholder="Titolo dell'avventura">
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary w-50" id="btn-cancel-create">Annulla</button>
                    <button class="btn btn-primary w-50" id="btn-confirm-create">Crea</button>
                </div>
            </div>
        `;
        window.app.showModal(modalHtml);

        setTimeout(() => {
            const input = document.getElementById('new-campaign-title');
            if (input) input.focus();

            document.getElementById('btn-cancel-create').onclick = () => window.app.closeModal();
            document.getElementById('btn-confirm-create').onclick = () => {
                const title = input.value.trim();
                if (title) {
                    CampaignService.createCampaign(title).then(res => {
                        window.app.closeModal();
                        if (res.error) this.showErrorPopup(res.error.message);
                        else this.render();
                    });
                }
            };
        }, 100);
    }

    openJoinCampaignModal() {
        const modalHtml = `
            <div class="text-center">
                <h3 style="font-family: var(--font-display); color: var(--accent-navy); margin-bottom: 15px;">Unisciti ad Avventura</h3>
                <input type="text" id="join-campaign-code" class="input-field w-100 mb-20" placeholder="Codice invito (es. ABC-123)">
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary w-50" id="btn-cancel-join">Annulla</button>
                    <button class="btn btn-primary w-50" id="btn-confirm-join">Unisciti</button>
                </div>
            </div>
        `;
        window.app.showModal(modalHtml);

        setTimeout(() => {
            const input = document.getElementById('join-campaign-code');
            if (input) input.focus();

            document.getElementById('btn-cancel-join').onclick = () => window.app.closeModal();
            document.getElementById('btn-confirm-join').onclick = () => {
                const code = input.value.trim();
                if (code) {
                    CampaignService.joinCampaign(code).then(res => {
                        window.app.closeModal();
                        if (res.error) this.showErrorPopup(res.error.message);
                        else this.render();
                    });
                }
            };
        }, 100);
    }

    openEditCampaignModal(campaign) {
        const modalHtml = `
            <div class="text-center">
                <h3 style="font-family: var(--font-display); color: var(--accent-gold); margin-bottom: 15px;">Modifica Titolo</h3>
                <input type="text" id="edit-campaign-title" class="input-field w-100 mb-20" value="${campaign.title}" placeholder="Titolo">
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary w-50" id="btn-cancel-edit">Annulla</button>
                    <button class="btn btn-primary w-50" id="btn-confirm-edit">Salva</button>
                </div>
            </div>
        `;
        window.app.showModal(modalHtml);

        setTimeout(() => {
            const input = document.getElementById('edit-campaign-title');
            if (input) input.focus();

            document.getElementById('btn-cancel-edit').onclick = () => window.app.closeModal();
            document.getElementById('btn-confirm-edit').onclick = () => {
                const newTitle = input.value.trim();
                if (newTitle && newTitle !== campaign.title) {
                    CampaignService.updateCampaign(campaign.id, { title: newTitle }).then(() => {
                        window.app.closeModal();
                        this.render();
                    });
                } else {
                    window.app.closeModal();
                }
            };
        }, 100);
    }
}
