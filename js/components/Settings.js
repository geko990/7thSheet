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
        div.innerHTML = `
            <div class="settings-hero">
                <div class="settings-icon">⚙️</div>
                <h2 class="settings-title">Impostazioni</h2>
            </div>
            
            <div class="settings-cards">
                <!-- Profile Management Card -->
                 <div class="settings-card">
                    <div class="settings-card-header">
                        <span class="settings-card-icon">👤</span>
                        <span class="settings-card-title">Profilo Utente</span>
                    </div>
                    <div class="settings-card-body">
                         <div class="text-center mb-15">
                            <div class="avatar-preview" id="settings-avatar-preview" style="width: 80px; height: 80px; border-radius: 50%; background: #ccc; margin: 0 auto 10px; overflow: hidden; border: 3px solid var(--accent-gold); box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                <span style="line-height: 80px; font-size: 2.5rem;">👤</span>
                            </div>
                            <button class="settings-btn" id="btn-change-avatar" style="width: auto; padding: 5px 15px; font-size: 0.8rem;">
                                📷 Cambia Foto
                            </button>
                            <input type="file" id="profile-avatar-input" accept="image/*" style="display: none;">
                        </div>
                        
                        <div class="settings-row" style="flex-direction: column; align-items: flex-start; gap: 5px;">
                            <label class="settings-row-label" style="font-size: 0.9rem;">Nome Pubblico</label>
                            <input type="text" id="profile-username" class="input-field" placeholder="Es. Enrico" style="width: 100%; text-align: left; padding: 10px;">
                        </div>

                        <div class="text-center mt-20">
                            <button class="settings-btn" id="btn-save-profile" style="width: 100%; justify-content: center; background: var(--accent-gold); color: white;">
                                Salva Profilo
                            </button>
                        </div>
                    </div>
                </div>

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

        setTimeout(() => this.attachListeners(div), 0);
        return div;
    }

    attachListeners(container) {
        // --- Profile Logic ---
        const avatarInput = container.querySelector('#profile-avatar-input');
        const avatarPreview = container.querySelector('#settings-avatar-preview');
        const usernameInput = container.querySelector('#profile-username');
        const saveProfileBtn = container.querySelector('#btn-save-profile');
        let currentAvatarUrl = null;

        // Load current profile
        import('../services/AuthService.js').then(({ AuthService }) => {
            const user = AuthService.getUser();
            if (user) {
                // We need to fetch the profile data primarily, but auth metadata might have it
                // Better to fetch from supabase directly via matching profile row
                // Or just use what we have. Since we don't have a specific getUserProfile method, 
                // we rely on the fact that we can fetch it or it's potentially in user_metadata if we synced it.
                // For now, let's just fetch it via a direct query helper or assume the user knows.
                // Actually, let's fetch it on load.
                import('../services/SupabaseClient.js').then(({ supabaseClient }) => {
                    supabaseClient.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
                        if (data) {
                            if (data.avatar_url) {
                                currentAvatarUrl = data.avatar_url;
                                avatarPreview.innerHTML = `<img src="${data.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;">`;
                            }
                            if (data.username) {
                                usernameInput.value = data.username;
                            }
                        }
                    });
                });
            }
        });

        container.querySelector('#btn-change-avatar').addEventListener('click', () => avatarInput.click());

        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Reuse CampaignService logic or similar
            const { CampaignService } = await import('../services/CampaignService.js');

            // Show loading
            avatarPreview.innerHTML = '<div class="spinner"></div>';

            const { publicUrl, error } = await CampaignService.uploadImage(file);
            if (error) {
                alert('Errore caricamento immagine: ' + error.message);
                avatarPreview.innerHTML = '<span style="line-height: 80px; font-size: 2.5rem;">⚠️</span>';
                return;
            }

            currentAvatarUrl = publicUrl;
            avatarPreview.innerHTML = `<img src="${publicUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
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
                saveProfileBtn.innerHTML = 'Salva Profilo';
                saveProfileBtn.disabled = false;
            } else {
                alert("Profilo aggiornato con successo!");
                saveProfileBtn.innerHTML = 'Salva Profilo';
                saveProfileBtn.disabled = false;
            }
        });

        // --- End Profile Logic ---

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

        // Clear cache logic - no confirmation, user clicked the button
        const clearCacheAndReload = async () => {
            // Execute directly

            const btn = container.querySelector('#btn-clear-cache');
            if (btn) btn.innerHTML = '<span class="btn-icon">⏳</span>';

            try {
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                    }
                }

                if ('caches' in window) {
                    const names = await caches.keys();
                    await Promise.all(names.map(name => caches.delete(name)));
                }

                window.location.reload(true);
            } catch (e) {
                alert("Errore durante l'aggiornamento: " + e.message);
                window.location.reload();
            }
        };

        container.querySelector('#btn-clear-cache').addEventListener('click', clearCacheAndReload);

        // Version click
        const versionEl = container.querySelector('#app-version');
        versionEl.style.cursor = 'pointer';
        versionEl.title = 'Clicca per aggiornare';
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
            } catch (err) {
                alert("Errore durante l'importazione");
            }
        };
        reader.readAsText(file);
    }
}
