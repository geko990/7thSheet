/**
 * Helper / Placeholder Component
 * Used while developing full features
 */
export default class Helper {
    constructor(app) {
        this.app = app;
    }

    async render() {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="card text-center" style="padding: 40px;">
                <h2 class="card-title">🚧 In Costruzione 🚧</h2>
                <p>La Creazione Guidata sarà disponibile a breve.</p>
                <div class="mt-20">
                    <button class="btn btn-primary" id="btn-back">
                        🔙 Torna alla Lista
                    </button>
                </div>
            </div>
        `;

        setTimeout(() => {
            div.querySelector('#btn-back').addEventListener('click', () => {
                this.app.router.navigate('characters');
            });
        }, 0);

        return div;
    }

    async renderCharacter(id) {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="card text-center" style="padding: 40px;">
                <h2 class="card-title">📜 Scheda Personaggio</h2>
                <p>Visualizzazione scheda ${id} in arrivo.</p>
                <div class="mt-20">
                    <button class="btn btn-primary" id="btn-back">
                        🔙 Torna alla Lista
                    </button>
                </div>
            </div>
        `;

        setTimeout(() => {
            div.querySelector('#btn-back').addEventListener('click', () => {
                this.app.router.navigate('characters');
            });
        }, 0);

        return div;
    }
}
