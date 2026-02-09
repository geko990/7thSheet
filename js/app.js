import { Router } from './router.js';
import { CONFIG } from './config.js';
import CharacterList from './components/CharacterList.js';
import DiceRoller from './components/DiceRoller.js';
import Settings from './components/Settings.js?v=0.9.63';
import CharacterSheet from './components/CharacterSheet.js?v=0.9.63';
import CreateWizard from './components/CreateWizard.js';
import { AdventureTab } from './components/AdventureTab.js';
import { AuthService } from './services/AuthService.js?v=0.9.63';
import { CampaignDetail } from './components/CampaignDetail.js?v=0.9.63';
import { Dice } from './dice.js?v=0.9.63';
import { Storage } from './storage.js?v=0.9.63';
import { CampaignService } from './services/CampaignService.js?v=0.9.63';

class App {
    constructor() {
        this.router = new Router(this);
        this.adventureTab = new AdventureTab();
        this.init();
    }

    async init() {
        try {
            // Initialize Auth service first
            await AuthService.init();

            // Register routes
            this.router.register('characters', () => new CharacterList(this).render());
            this.router.register('dice', () => new DiceRoller(this).render());
            this.router.register('settings', () => new Settings(this).render());
            this.router.register('adventures', async () => {
                const div = document.createElement('div');
                await this.adventureTab.render(div, (route, params) => this.router.navigate(route, params));
                return div;
            });
            this.router.register('create-wizard', () => new CreateWizard(this).render());
            this.router.register('character-sheet', (params) => new CharacterSheet(this).renderCharacter(params.id));
            this.router.register('campaign-detail', (params) => {
                const div = document.createElement('div');
                new CampaignDetail(this).render(div, params.id);
                return div;
            });

            // Initialize update mechanisms
            this.initUpdateMechanisms();

            // Initial navigation
            this.router.initNavigation();

            // Force navigation to characters on load to ensure content
            await this.router.navigate('characters');

            // Service Worker Registration
            if ('serviceWorker' in navigator) {
                try {
                    const isGitHubPages = window.location.hostname.includes('github.io');
                    const scope = isGitHubPages ? '/7thSheet/' : '/';
                    const swPath = isGitHubPages ? '/7thSheet/service-worker.js' : '/service-worker.js';

                    await navigator.serviceWorker.register(swPath, { scope });
                    console.log('ServiceWorker registered');
                } catch (err) {
                    console.log('ServiceWorker registration failed:', err);
                }
            }
        } catch (e) {
            console.error("Critical App Init Error:", e);
            document.getElementById('main-content').innerHTML = `
                <div class="text-center p-20">
                    <h3>Errore di Caricamento</h3>
                    <p>${e.message}</p>
                    <button onclick="window.location.reload(true)" class="btn btn-primary">Ricarica</button>
                </div>
            `;
        }
    }

    // Helper to start creation flow
    startCharacterCreation() {
        this.router.navigate('create-wizard');
    }

    // Helper to view character
    viewCharacter(id) {
        this.router.navigate('character-sheet', { id });
    }

    // Modal Helper
    showModal(content) {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');

        if (typeof content === 'string') {
            modalContent.innerHTML = content;
        } else {
            modalContent.innerHTML = '';
            modalContent.appendChild(content);
        }

        modalOverlay.classList.remove('hidden');

        const closeHandler = (e) => {
            if (e.target === modalOverlay) {
                this.closeModal();
                modalOverlay.removeEventListener('click', closeHandler);
            }
        };
        modalOverlay.addEventListener('click', closeHandler);
    }

    closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        modalOverlay.classList.add('hidden');
    }

    initUpdateMechanisms() {
        // 1. Hidden Update Button (Anchor)
        const anchorBtn = document.getElementById('header-anchor');
        if (anchorBtn) {
            anchorBtn.addEventListener('click', () => {
                if (confirm('Forzare aggiornamento app?')) {
                    this.forceAppUpdate();
                }
            });
        }

        // 2. Auto-Update on Idle (Fresh Launch)
        const isFreshLaunch = !sessionStorage.getItem('app_session_active');

        if (isFreshLaunch) {
            sessionStorage.setItem('app_session_active', 'true');
            // Logic removed to prevent unwanted reloads
        }
    }

    async forceAppUpdate() {
        try {
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
            }
            window.location.reload(true);
        } catch (e) {
            console.warn('Update failed:', e);
            window.location.reload();
        }
    }
}

// Initialize App
window.app = new App();
