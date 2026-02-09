
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
                        
                        <!-- Account Info Grid -->
                        <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 15px 15px; align-items: center; margin-bottom: 25px; padding: 0 10px;">
                            <!-- Row 1 -->
                            <span style="font-weight: bold; color: var(--accent-navy); font-size: 0.95rem;">Account</span>
                            <span style="text-align: right; color: var(--text-faded); font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.email}</span>

                            <!-- Row 2 -->
                            <span style="font-weight: bold; color: var(--accent-navy); font-size: 0.95rem;">Nome Pubblico</span>
                            <input type="text" id="profile-username" placeholder="Il tuo nick..." style="text-align: right; background: transparent; border: none; border-bottom: 1px solid var(--border-worn); padding: 5px; color: var(--text-color); font-family: var(--font-main); width: 100%; font-size: 1rem;" value="${currentUsername}">
                        </div>

                        <!-- Actions -->
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                             <button class="settings-btn" id="btn-save-profile" style="width: 100%; justify-content: center; background: var(--accent-gold); color: white;">
                                Salva Modifiche
                            </button>
                             <button class="btn btn-secondary" id="btn-logout" style="width: 100%; justify-content: center; border-color: var(--accent-red); color: var(--accent-red);">
                                Esci
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // LOGGED OUT: Show Login/Register Form
            profileSectionHTML = `
                <div class="settings-card" id="auth-card">
                    <div class="settings-card-header">
                        <span class="settings-card-icon">🔒</span>
                        <span class="settings-card-title">Accesso Pirata</span>
                    </div>
                    <div class="settings-card-body">
                         <div class="tabs mb-20" style="display: flex; justify-content: center; gap: 10px;">
                            <button class="btn btn-sm btn-primary active" id="tab-login">Accedi</button>
                            <button class="btn btn-sm btn-secondary" id="tab-register">Registrati</button>
                        </div>

                        <form id="auth-form">
                            <div class="form-group mb-15">
                                <label style="display: block; margin-bottom: 5px; color: var(--text-faded); font-size: 0.9rem;">Email</label>
                                <input type="email" id="auth-email" class="input-field w-100" required>
                            </div>
                            
                            <div class="form-group mb-20">
                                <label style="display: block; margin-bottom: 5px; color: var(--text-faded); font-size: 0.9rem;">Password</label>
                                <input type="password" id="auth-password" class="input-field w-100" required>
                            </div>
                            
                            <div class="text-right mb-20">
                                <a href="#" id="btn-forgot-password" style="font-size: 0.8rem; color: var(--accent-gold); text-decoration: none;">Password dimenticata?</a>
                            </div>

                            <button type="submit" class="btn btn-primary w-100" id="btn-submit">Accedi</button>
                        </form>
                    </div>
                </div>
            `;
        }

        div.innerHTML = `
            <div class="settings-hero">
                <div class="settings-icon">⚙️</div>
                <h2 class="settings-title">Impostazioni</h2>
            </div>
            
            <div class="settings-cards">
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
                                <span class="settings-row-label">Aggiorna Cache</span>
                                <span class="settings-row-desc">Forza aggiornamento app</span>
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
        const btnSubmit = container.querySelector('#btn-submit');
        const tabLogin = container.querySelector('#tab-login');
        const tabRegister = container.querySelector('#tab-register');
        const btnForgot = container.querySelector('#btn-forgot-password');

        let isLogin = true;

        const toggleMode = (login) => {
            isLogin = login;
            tabLogin.className = `btn btn-sm ${isLogin ? 'btn-primary active' : 'btn-secondary'}`;
            tabRegister.className = `btn btn-sm ${!isLogin ? 'btn-primary active' : 'btn-secondary'}`;
            btnSubmit.textContent = isLogin ? 'Accedi' : 'Registrati';
        };

        tabLogin.addEventListener('click', (e) => { e.preventDefault(); toggleMode(true); });
        tabRegister.addEventListener('click', (e) => { e.preventDefault(); toggleMode(false); });

        if (btnForgot) {
            btnForgot.addEventListener('click', (e) => {
                e.preventDefault();
                alert("Non ancora implementato qui!"); // Placeholder or reuse modal logic if I had access to app
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            if (!email || !password) return;

            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Caricamento...';

            const { AuthService } = await import('../services/AuthService.js');
            let result;
            if (isLogin) {
                result = await AuthService.signIn(email, password);
            } else {
                result = await AuthService.signUp(email, password, email.split('@')[0]);
            }

            btnSubmit.disabled = false;
            btnSubmit.textContent = isLogin ? 'Accedi' : 'Registrati';

            if (result.error) {
                alert("Errore: " + result.error.message);
            } else {
                if (!isLogin) alert("Registrazione avvenuta! Controlla la mail.");
                else window.location.reload(); // Reload to refresh state
            }
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
            try {
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) await registration.unregister();
                }
                if ('caches' in window) {
                    const names = await caches.keys();
                    await Promise.all(names.map(name => caches.delete(name)));
                }
                window.location.reload(true);
            } catch (e) {
                alert("Errore aggiornamento: " + e.message);
                window.location.reload();
            }
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
