/**
 * Simple SPA Router for 7th Sea App
 */

export class Router {
    constructor(app) {
        this.app = app;
        this.routes = {};
        this.currentTab = 'characters';
    }

    /**
     * Register a route/tab
     * @param {string} name - Route name
     * @param {Function} handler - Async function that returns DOM element
     */
    register(name, handler) {
        this.routes[name] = handler;
    }

    /**
     * Navigate to a tab
     * @param {string} tab - Tab name
     * @param {Object} params - Optional parameters
     */
    async navigate(tab, params = {}) {
        if (!this.routes[tab]) {
            console.error(`Route not found: ${tab}`);
            return;
        }

        this.currentTab = tab;
        this.updateNavigation();

        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = '<div class="text-center mt-20">Caricamento...</div>';

        try {
            const content = await this.routes[tab](params);
            mainContent.innerHTML = '';

            if (content instanceof HTMLElement) {
                mainContent.appendChild(content);
            } else {
                mainContent.innerHTML = content;
            }
        } catch (error) {
            console.error('Navigation error:', error);
            mainContent.innerHTML = `<div class="text-center mt-20">Errore nel caricamento</div>`;
        }
    }

    /**
     * Update navigation button states
     */
    updateNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const tab = btn.dataset.tab;
            btn.classList.toggle('active', tab === this.currentTab);
        });
    }

    /**
     * Initialize navigation listeners
     */
    initNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                if (tab) this.navigate(tab);
            });
        });
    }
}
