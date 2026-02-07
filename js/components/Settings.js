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
