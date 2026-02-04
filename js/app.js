import { Router } from './router.js';
import { CONFIG } from './config.js';
import CharacterList from './components/CharacterList.js';
import DiceRoller from './components/DiceRoller.js';
import Settings from './components/Settings.js';
import CharacterSheet from './components/CharacterSheet.js';

class App {
    constructor() {
        this.router = new Router(this);
        this.init();
    }

    async init() {
        // Register routes
        this.router.register('characters', () => new CharacterList(this).render());
        this.router.register('dice', () => new DiceRoller(this).render());
        this.router.register('settings', () => new Settings(this).render());
        this.router.register('create-wizard', () => new CreateWizard(this).render());
        this.router.register('character-sheet', (params) => new CharacterSheet(this).renderCharacter(params.id));

        // Initial navigation
        this.router.initNavigation();

        // Load clean router state or default
        await this.router.navigate('characters');

        // Service Worker Registration
        if ('serviceWorker' in navigator) {
            try {
                // Determine scope based on location (GitHub Pages vs Localhost)
                const isGitHubPages = window.location.hostname.includes('github.io');
                const scope = isGitHubPages ? '/7thSheet/' : '/';
                const swPath = isGitHubPages ? '/7thSheet/service-worker.js' : '/service-worker.js';

                await navigator.serviceWorker.register(swPath, { scope });
                console.log('ServiceWorker registered');
            } catch (err) {
                console.log('ServiceWorker registration failed:', err);
            }
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
}

// Initialize App
window.app = new App();
