
import { CONFIG } from '../config.js';

/**
 * Settings Component - Premium Styled
 */
export default class Settings {
    constructor(app) {
        this.app = app;
    }

    async render() {
        const div = document.createElement('div');
        div.className = 'settings-container';

        // Import Auth dynamically to check status
        const { AuthService } = await import('../services/AuthService.js');
        const user = AuthService.getUser();

        let profileSectionHTML = '';

        if (user) {
            // LOGGED IN: Show Profile + Logout
            const currentUsername = user.user_metadata?.username || '';
            const currentAvatar = user.user_metadata?.avatar_url || '';

            profileSectionHTML = `
                <!-- Profile Management Card -->
                 <div class="settings-card">
                    <div class="settings-card-header">
                        <span class="settings-card-icon">👤</span>
                        <span class="settings-card-title">Profilo Utente</span>
                    </div>
                    <div class="settings-card-body">
                         <!-- Clickable Avatar -->
                         <div class="text-center mb-20" style="position: relative;">
                            <div class="avatar-preview" id="settings-avatar-preview" style="width: 100px; height: 100px; border-radius: 50%; background: #ccc; margin: 0 auto; overflow: hidden; border: 3px solid var(--accent-gold); box-shadow: 0 4px 10px rgba(0,0,0,0.2); cursor: pointer; position: relative;">
                                ${currentAvatar ? `<img src="${currentAvatar}" style="width: 100%; height: 100%; object-fit: cover;">` : '<span style="line-height: 100px; font-size: 3rem;">👤</span>'}
                                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.5); color: white; font-size: 0.7rem; padding: 2px;">📷</div>
                            </div>
                            <input type="file" id="profile-avatar-input" accept="image/*" style="display: none;">
                        </div>
                        
                        <!-- Account Info -->
                        <div style="padding: 0 10px;">
                            <!-- Row 1: Account (always visible) -->
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-worn);">
                                <span style="font-weight: bold; color: var(--accent-navy); font-size: 0.95rem;">Account</span>
                                <span style="color: var(--text-faded); font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%;">${user.email}</span>
                            </div>

                            <!-- Row 2: Nome Pubblico + toggle -->
                            <div id="profile-toggle-row" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; cursor: pointer; user-select: none;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span id="profile-chevron" style="font-size: 0.7rem; color: var(--text-faded); transition: transform 0.3s;">▶</span>
                                    <span style="font-weight: bold; color: var(--accent-navy); font-size: 0.95rem;">Nome Pubblico</span>
                                </div>
                                <input type="text" id="profile-username" placeholder="Il tuo nick..." style="text-align: right; background: transparent; border: none; border-bottom: 1px solid var(--border-worn); padding: 5px; color: var(--text-color); font-family: var(--font-main); width: 45%; font-size: 1rem;" value="${currentUsername}" onclick="event.stopPropagation();">
                            </div>
                        </div>

                        <!-- Collapsible Actions -->
                        <div id="profile-actions-panel" style="display: none; padding: 15px 10px 5px; margin-top: 5px; border-top: 1px solid var(--border-worn);">
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                 <button class="settings-btn" id="btn-save-profile" style="width: 100%; justify-content: center; background: var(--accent-gold); color: white;">
                                    Salva Modifiche
                                </button>
                                 <a href="#" id="btn-change-password" style="text-align: center; font-size: 0.8rem; color: var(--text-faded); text-decoration: none;">Cambia password</a>
                                 <div id="change-password-area" style="display: none; margin-top: 5px;">
                                    <input type="password" id="new-password" placeholder="Nuova password" style="width: 100%; padding: 8px; border: 1px solid var(--border-worn); border-radius: 6px; margin-bottom: 8px; font-size: 0.9rem;">
                                    <input type="password" id="confirm-password" placeholder="Conferma password" style="width: 100%; padding: 8px; border: 1px solid var(--border-worn); border-radius: 6px; margin-bottom: 8px; font-size: 0.9rem;">
                                    <button class="btn btn-secondary btn-sm" id="btn-confirm-password" style="width: 100%; font-size: 0.85rem;">Aggiorna Password</button>
                                 </div>
                                 <button class="btn btn-secondary" id="btn-logout" style="width: 100%; justify-content: center; border-color: var(--accent-red); color: var(--accent-red);">
                                    Esci
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // LOGGED OUT: Show Login/Register Form
            profileSectionHTML = `
                <div class="settings-card" id="auth-card">
                    <div class="settings-card-header">
                        <span class="settings-card-icon">⚓</span>
                        <span class="settings-card-title">Salpiamo</span>
                    </div>
                    <div class="settings-card-body">
                        <form id="auth-form">
                            <!-- Email Row -->
                            <div class="form-group mb-15" style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 5px;">
                                <label style="color: var(--text-faded); font-size: 0.95rem; font-weight: bold;">Email</label>
                                <input type="email" id="auth-email" class="input-field" required style="text-align: right; background: rgba(255, 255, 255, 0.5); border: 1px solid var(--border-worn); border-radius: 4px; padding: 5px 10px; width: 60%; color: var(--text-ink);">
                            </div>
                            
                            <!-- Password Row -->
                            <div class="form-group mb-20" style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 5px;">
                                <label style="color: var(--text-faded); font-size: 0.95rem; font-weight: bold;">Password</label>
                                <input type="password" id="auth-password" class="input-field" required style="text-align: right; background: rgba(255, 255, 255, 0.5); border: 1px solid var(--border-worn); border-radius: 4px; padding: 5px 10px; width: 60%; color: var(--text-ink);">
                            </div>
                            
                            <div class="text-right mb-20">
                                <a href="#" id="btn-forgot-password" style="font-size: 0.8rem; color: var(--accent-gold); text-decoration: none;">Password dimenticata?</a>
                            </div>

                            <div style="display: flex; gap: 10px;">
                                <button type="button" class="btn btn-primary" id="btn-login" style="flex: 1;">Accedi</button>
                                <button type="button" class="btn btn-secondary" id="btn-register" style="flex: 1;">Registrati</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        }

        const bgHtml = `
            <div class="fixed-char-bg" style="position: fixed; bottom: 50px; left: 50%; transform: translateX(-50%); width: 100%; max-width: 500px; z-index: 0; pointer-events: none; opacity: 0.5; mask-image: linear-gradient(to top, black 80%, transparent 100%); -webkit-mask-image: linear-gradient(to top, black 80%, transparent 100%);">
                <img src="assets/opzioni.png" alt="" style="width: 100%;">
            </div>
        `;

        div.innerHTML = bgHtml + `
            <div style="position: relative; z-index: 1;">
                
                <div class="settings-cards" style="margin-top: 20px;">
                    ${profileSectionHTML}

                    <!-- Data Management Card -->
                    <div class="settings-card">
                        <div class="settings-card-header">
                            <span class="settings-card-icon">📦</span>
                            <span class="settings-card-title">Gestione Dati</span>
                        </div>
                        <div class="settings-card-body">
                            <div class="settings-row">
                                <div class="settings-row-info">
                                    <span class="settings-row-label">Esporta</span>
                                    <span class="settings-row-desc">Salva backup dei personaggi</span>
                                </div>
                                <button class="settings-btn" id="btn-export">
                                    <span class="btn-icon">📤</span>
                                </button>
                            </div>
                            <div class="settings-divider"></div>
                            <div class="settings-row">
                                <div class="settings-row-info">
                                    <span class="settings-row-label">Importa</span>
                                    <span class="settings-row-desc">Carica backup esistente</span>
                                </div>
                                <button class="settings-btn" id="btn-import">
                                    <span class="btn-icon">📥</span>
                                </button>
                                <input type="file" id="import-file" accept=".json" style="display: none;">
                            </div>
                        </div>
                    </div>

                    <!-- App Info Card -->
                    <div class="settings-card">
                        <div class="settings-card-header">
                            <span class="settings-card-icon">ℹ️</span>
                            <span class="settings-card-title">Informazioni</span>
                        </div>
                        <div class="settings-card-body">
                             <div class="settings-row">
                                <div class="settings-row-info">
                                    <span class="settings-row-label">Versione</span>
                                    <span class="settings-row-desc">7th Sea Character Sheet</span>
                                </div>
                                <span class="settings-version" id="app-version">${CONFIG.APP_VERSION}</span>
                            </div>
                            <div class="settings-divider"></div>
                            <div class="settings-row">
                                 <div class="settings-row-info">
                                    <span class="settings-row-label">Aggiornamenti</span>
                                    <span class="settings-row-desc">Forza aggiornamento all'ultima versione</span>
                                </div>
                                <button class="settings-btn settings-btn-refresh" id="btn-clear-cache">
                                    <span class="btn-icon">🔄</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Installation Card -->
                    <div class="settings-card">
                        <div class="settings-card-header">
                            <span class="settings-card-icon">📱</span>
                            <span class="settings-card-title">Installazione</span>
                        </div>
                        <div class="settings-card-body">
                            <div class="install-steps">
                                <div class="install-step">
                                    <span class="step-num">1</span>
                                    <span class="step-text">Apri il menu del browser (⋮ o ☐)</span>
                                </div>
                                <div class="install-step">
                                    <span class="step-num">2</span>
                                    <span class="step-text">Seleziona "Aggiungi a Home"</span>
                                </div>
                                <div class="install-step">
                                    <span class="step-num">3</span>
                                    <span class="step-text">Conferma l'installazione</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings-footer">
                    <div class="footer-anchor">⚓</div>
                    <div class="footer-text">7th Sea v${CONFIG.APP_VERSION}</div>
                </div>
            </div>
        `;

        // Async attach because dynamic imports
        setTimeout(async () => {
            const { AuthService } = await import('../services/AuthService.js');
            const currentUser = AuthService.getUser();
            if (currentUser) {
                this.attachProfileListeners(div, currentUser);
            } else {
                this.attachAuthListeners(div);
            }
            this.attachGeneralListeners(div);
        }, 0);

        return div;
    }

    async attachProfileListeners(container, user) {
        const avatarInput = container.querySelector('#profile-avatar-input');
        const avatarPreview = container.querySelector('#settings-avatar-preview');
        const usernameInput = container.querySelector('#profile-username');
        const saveProfileBtn = container.querySelector('#btn-save-profile');
        const logoutBtn = container.querySelector('#btn-logout');

        // Toggle profile actions panel
        const toggleRow = container.querySelector('#profile-toggle-row');
        const actionsPanel = container.querySelector('#profile-actions-panel');
        const chevron = container.querySelector('#profile-chevron');
        if (toggleRow) {
            toggleRow.addEventListener('click', (e) => {
                if (e.target.tagName === 'INPUT') return; // don't toggle when typing
                const isOpen = actionsPanel.style.display !== 'none';
                actionsPanel.style.display = isOpen ? 'none' : 'block';
                chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
            });
        }

        let currentAvatarUrl = null;

        // Fetch Profile Data
        const { supabaseClient } = await import('../services/SupabaseClient.js');
        const { data } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();

        if (data) {
            if (data.avatar_url) {
                currentAvatarUrl = data.avatar_url;
                avatarPreview.innerHTML = `
                    <img src="${data.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;">
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.5); color: white; font-size: 0.7rem; padding: 2px;">📷</div>
                `;
            }
            if (data.username) {
                usernameInput.value = data.username;
            }
        }

        // Avatar Click Listener
        avatarPreview.addEventListener('click', () => avatarInput.click());

        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const { CampaignService } = await import('../services/CampaignService.js');

            const originalContent = avatarPreview.innerHTML;
            avatarPreview.innerHTML = '<div class="spinner"></div>';

            const { publicUrl, error } = await CampaignService.uploadImage(file);
            if (error) {
                alert('Errore caricamento immagine: ' + error.message);
                avatarPreview.innerHTML = originalContent; // Restore
                return;
            }

            currentAvatarUrl = publicUrl;
            avatarPreview.innerHTML = `
                <img src="${publicUrl}" style="width: 100%; height: 100%; object-fit: cover;">
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.5); color: white; font-size: 0.7rem; padding: 2px;">📷</div>
            `;
        });

        saveProfileBtn.addEventListener('click', async () => {
            const username = usernameInput.value.trim();
            if (!username) {
                alert("Il nome utente non può essere vuoto.");
                return;
            }

            saveProfileBtn.innerHTML = '<span class="spinner"></span> Salva...';
            saveProfileBtn.disabled = true;

            const { AuthService } = await import('../services/AuthService.js');
            const { error } = await AuthService.updateProfile({
                username: username,
                avatar_url: currentAvatarUrl
            });

            if (error) {
                alert("Errore salvataggio profilo: " + error.message);
            } else {
                alert("Profilo aggiornato con successo!");
            }
            saveProfileBtn.innerHTML = 'Salva Profilo';
            saveProfileBtn.disabled = false;
        });

        // Change password toggle
        const changePwLink = container.querySelector('#btn-change-password');
        const changePwArea = container.querySelector('#change-password-area');
        if (changePwLink) {
            changePwLink.addEventListener('click', (e) => {
                e.preventDefault();
                changePwArea.style.display = changePwArea.style.display === 'none' ? 'block' : 'none';
            });
        }

        const confirmPwBtn = container.querySelector('#btn-confirm-password');
        if (confirmPwBtn) {
            confirmPwBtn.addEventListener('click', async () => {
                const newPw = container.querySelector('#new-password').value;
                const confirmPw = container.querySelector('#confirm-password').value;
                if (!newPw || newPw.length < 6) return alert('La password deve avere almeno 6 caratteri.');
                if (newPw !== confirmPw) return alert('Le password non coincidono.');
                confirmPwBtn.disabled = true;
                confirmPwBtn.textContent = 'Aggiornamento...';
                const { supabaseClient } = await import('../services/SupabaseClient.js');
                const { error } = await supabaseClient.auth.updateUser({ password: newPw });
                if (error) {
                    alert('Errore: ' + error.message);
                } else {
                    alert('Password aggiornata con successo!');
                    changePwArea.style.display = 'none';
                    container.querySelector('#new-password').value = '';
                    container.querySelector('#confirm-password').value = '';
                }
                confirmPwBtn.disabled = false;
                confirmPwBtn.textContent = 'Aggiorna Password';
            });
        }

        logoutBtn.addEventListener('click', async () => {
            if (confirm("Vuoi davvero uscire?")) {
                const { AuthService } = await import('../services/AuthService.js');
                await AuthService.signOut();
                window.location.reload();
            }
        });
    }

    async attachAuthListeners(container) {
        const form = container.querySelector('#auth-form');
        const emailInput = container.querySelector('#auth-email');
        const passwordInput = container.querySelector('#auth-password');
        const btnLogin = container.querySelector('#btn-login');
        const btnRegister = container.querySelector('#btn-register');
        const btnForgot = container.querySelector('#btn-forgot-password');

        if (btnForgot) {
            btnForgot.addEventListener('click', (e) => {
                e.preventDefault();
                alert("Non ancora implementato qui!");
            });
        }

        const handleAuth = async (isLogin) => {
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                alert("Inserisci Email e Password.");
                return;
            }

            const btn = isLogin ? btnLogin : btnRegister;
            const originalText = btn.textContent;

            // Disable interactions
            btnLogin.disabled = true;
            btnRegister.disabled = true;
            btn.textContent = 'Caricamento...';

            const { AuthService } = await import('../services/AuthService.js');
            let result;

            if (isLogin) {
                result = await AuthService.signIn(email, password);
            } else {
                result = await AuthService.signUp(email, password, email.split('@')[0]);
            }

            // Re-enable
            btnLogin.disabled = false;
            btnRegister.disabled = false;
            btn.textContent = originalText;

            if (result.error) {
                alert("Errore: " + result.error.message);
            } else {
                if (!isLogin) alert("Registrazione avvenuta! Controlla la mail.");

                // Force App State Refresh
                window.dispatchEvent(new CustomEvent('auth:change', { detail: result.data.session?.user }));

                // Navigate to Characters (Profile)
                this.app.router.navigate('characters');
            }
        };

        btnLogin.addEventListener('click', (e) => {
            e.preventDefault();
            handleAuth(true);
        });

        btnRegister.addEventListener('click', (e) => {
            e.preventDefault();
            handleAuth(false);
        });
    }

    attachGeneralListeners(container) {
        // Export
        container.querySelector('#btn-export').addEventListener('click', () => {
            this.exportData();
        });

        // Import
        const importBtn = container.querySelector('#btn-import');
        const importFile = container.querySelector('#import-file');

        importBtn.addEventListener('click', () => {
            importFile.click();
        });

        importFile.addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // Clear cache
        const clearCacheAndReload = async () => {
            const btn = container.querySelector('#btn-clear-cache');
            if (btn) btn.innerHTML = '<span class="btn-icon">⏳</span>';
            await this.app.fullReset();
        };

        container.querySelector('#btn-clear-cache').addEventListener('click', clearCacheAndReload);
        const versionEl = container.querySelector('#app-version');
        versionEl.style.cursor = 'pointer';
        versionEl.addEventListener('click', clearCacheAndReload);
    }

    exportData() {
        const data = localStorage.getItem('7thsea_characters') || '[]';
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '7thsea_characters_backup.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    localStorage.setItem('7thsea_characters', JSON.stringify(data));
                    alert('Importazione completata!');
                    this.app.router.navigate('characters');
                } else {
                    alert('Formato file non valido');
                }
            } catch (err) { alert("Errore importazione"); }
        };
        reader.readAsText(file);
    }
}
