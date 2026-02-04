import { CONFIG } from '../config.js';

/**
 * Settings Component
 */
export default class Settings {
    constructor(app) {
        this.app = app;
    }

    async render() {
        const div = document.createElement('div');
        div.innerHTML = `
            <h2 class="page-title">Impostazioni</h2>
            
            <div class="card">
                <div class="settings-section">
                    <h3 class="settings-title">Dati</h3>
                    
                    <div class="settings-item">
                        <span class="settings-label">Esporta Personaggi</span>
                        <button class="btn btn-secondary" id="btn-export" style="padding: 8px 16px; font-size: 0.8rem;">
                            📤 Esporta
                        </button>
                    </div>
                    
                    <div class="settings-item">
                        <span class="settings-label">Importa Personaggi</span>
                        <button class="btn btn-secondary" id="btn-import" style="padding: 8px 16px; font-size: 0.8rem;">
                            📥 Importa
                        </button>
                        <input type="file" id="import-file" accept=".json" style="display: none;">
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="settings-section">
                    <h3 class="settings-title">Informazioni</h3>
                    
                    <div class="settings-item">
                        <span class="settings-label">Versione</span>
                        <span class="settings-value" id="app-version">${CONFIG.APP_VERSION}</span>
                    </div>
                    
                    <div class="settings-item">
                        <span class="settings-label">Aggiorna Cache</span>
                        <button class="btn btn-secondary" id="btn-clear-cache" style="padding: 8px 16px; font-size: 0.8rem;">
                            🔄 Aggiorna
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="settings-section">
                    <h3 class="settings-title">Installazione</h3>
                    <p style="font-size: 0.9rem; color: var(--text-faded); line-height: 1.6;">
                        Per installare l'app sul tuo smartphone:
                    </p>
                    <ol style="font-size: 0.9rem; color: var(--text-faded); margin-top: 10px; padding-left: 20px; line-height: 1.8;">
                        <li>Apri il menu del browser (⋮ o ☐)</li>
                        <li>Seleziona "Aggiungi a Home" o "Installa app"</li>
                        <li>Conferma l'installazione</li>
                    </ol>
                </div>
            </div>
            
            <div class="text-center mt-20" style="padding-bottom: 20px;">
                <p style="font-size: 0.8rem; color: var(--text-faded);">
                    7th Sea Character Sheet v${CONFIG.APP_VERSION}<br>
                    Basato su 7th Sea 2a Edizione
                </p>
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

        // Clear cache logic
        const clearCacheAndReload = async () => {
            if (!confirm('Vuoi forzare l\'aggiornamento dell\'app?')) return;

            const btn = container.querySelector('#btn-clear-cache');
            if (btn) btn.textContent = 'Aggiornamento...';

            try {
                // 1. Unregister Service Worker
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                    }
                }

                // 2. Delete all Caches
                if ('caches' in window) {
                    const names = await caches.keys();
                    await Promise.all(names.map(name => caches.delete(name)));
                }

                // 3. Reload
                window.location.reload(true);
            } catch (e) {
                alert('Errore durante l\'aggiornamento: ' + e.message);
                window.location.reload();
            }
        };

        container.querySelector('#btn-clear-cache').addEventListener('click', clearCacheAndReload);

        // Make version clickable as requested
        const versionEl = container.querySelector('#app-version');
        versionEl.style.cursor = 'pointer';
        versionEl.style.textDecoration = 'underline';
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
                alert('Errore durante l\'importazione');
            }
        };
        reader.readAsText(file);
    }
}
