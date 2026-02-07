import { Dice } from '../dice.js';

/**
 * Dice Roller Component - Premium Redesign
 * Compact popup with D10 roll button at bottom
 */
export default class DiceRoller {
    constructor(app) {
        this.app = app;
        this.diceCount = 5;
        this.keepCount = 3;
        this.edition = '2e';
        this.results = [];
        this.selectedDice = new Set();
    }

    async render() {
        const div = document.createElement('div');
        div.className = 'dice-roller-container';
        div.innerHTML = `
            <div class="dice-popup">
                <!-- Edition Toggle Tabs -->
                <div class="dice-edition-tabs">
                    <button class="edition-tab ${this.edition === '1e' ? 'active' : ''}" id="btn-ed-1e">
                        1ª Edizione
                    </button>
                    <button class="edition-tab ${this.edition === '2e' ? 'active' : ''}" id="btn-ed-2e">
                        2ª Edizione
                    </button>
                </div>

                <!-- Dice Controls -->
                <div class="dice-controls-section">
                    <div class="dice-control-row">
                        <span class="dice-label">Dadi</span>
                        <div class="dice-counter">
                            <button class="counter-btn" id="btn-dice-minus">−</button>
                            <span class="counter-value" id="dice-count">${this.diceCount}</span>
                            <button class="counter-btn" id="btn-dice-plus">+</button>
                        </div>
                    </div>
                    
                    ${this.edition === '1e' ? `
                    <div class="dice-control-row">
                        <span class="dice-label">Tenuti</span>
                        <div class="dice-counter">
                            <button class="counter-btn" id="btn-keep-minus">−</button>
                            <span class="counter-value" id="keep-count">${this.keepCount}</span>
                            <button class="counter-btn" id="btn-keep-plus">+</button>
                        </div>
                    </div>
                    ` : ''}
                </div>

                <!-- Results Area -->
                <div class="dice-results-area">
                    <div class="dice-pool" id="dice-pool">
                        <p class="dice-hint">Tocca il D10 per lanciare ${this.diceCount}d10${this.edition === '1e' ? `k${this.keepCount}` : ''}</p>
                    </div>
                    
                    <div class="dice-result-box" id="results-display" style="display: none;">
                        <span class="result-type">${this.edition === '1e' ? 'Totale' : 'Incrementi'}</span>
                        <span class="result-number" id="result-value">0</span>
                    </div>
                </div>

                <!-- Edition Info -->
                <div class="dice-info">
                    ${this.edition === '2e'
                ? 'Combina i dadi per formare somme di 10'
                : 'Somma i dadi migliori tenuti'}
                </div>

                <!-- D10 Roll Button (half outside) -->
                <div class="dice-roll-wrapper">
                    <button class="dice-roll-btn" id="btn-roll">
                        <img src="assets/d10.png" alt="Lancia" class="d10-image">
                    </button>
                </div>
            </div>
        `;

        setTimeout(() => this.attachListeners(div), 0);
        return div;
    }

    attachListeners(container) {
        // Edition Toggle
        container.querySelector('#btn-ed-1e').addEventListener('click', () => {
            this.edition = '1e';
            this.updateView(container);
        });
        container.querySelector('#btn-ed-2e').addEventListener('click', () => {
            this.edition = '2e';
            this.updateView(container);
        });

        // Dice count controls
        container.querySelector('#btn-dice-minus').addEventListener('click', () => {
            if (this.diceCount > 1) {
                this.diceCount--;
                if (this.keepCount > this.diceCount) this.keepCount = this.diceCount;
                this.updateView(container);
            }
        });

        container.querySelector('#btn-dice-plus').addEventListener('click', () => {
            if (this.diceCount < 20) {
                this.diceCount++;
                this.updateView(container);
            }
        });

        // Keep controls (1e only)
        const btnKeepMinus = container.querySelector('#btn-keep-minus');
        if (btnKeepMinus) {
            btnKeepMinus.addEventListener('click', () => {
                if (this.keepCount > 1) {
                    this.keepCount--;
                    this.updateView(container);
                }
            });

            container.querySelector('#btn-keep-plus').addEventListener('click', () => {
                if (this.keepCount < this.diceCount) {
                    this.keepCount++;
                    this.updateView(container);
                }
            });
        }

        // Roll button
        container.querySelector('#btn-roll').addEventListener('click', () => {
            this.rollDice(container);
        });
    }

    updateView(container) {
        this.render().then(newContent => {
            container.replaceWith(newContent);
        });
    }

    rollDice(container) {
        const pool = container.querySelector('#dice-pool');
        const resultsDisplay = container.querySelector('#results-display');
        const resultValue = container.querySelector('#result-value');

        this.results = Dice.roll(this.diceCount);
        this.selectedDice.clear();

        // Render dice with animation
        pool.innerHTML = this.results.map((val, idx) => `
            <div class="die rolling" data-index="${idx}" data-value="${val}">
                ${val}
            </div>
        `).join('');

        // Remove animation after completion
        setTimeout(() => {
            pool.querySelectorAll('.die').forEach(die => {
                die.classList.remove('rolling');
            });

            if (this.edition === '2e') {
                const result = Dice.calculateRaises(this.results);
                resultValue.textContent = result.raises;
            } else {
                const result = Dice.calculateRollAndKeep(this.results, this.keepCount);
                resultValue.textContent = result.total;

                // Highlight kept dice
                const indices = this.results.map((v, i) => ({ v, i }))
                    .sort((a, b) => b.v - a.v)
                    .slice(0, this.keepCount)
                    .map(item => item.i);

                pool.querySelectorAll('.die').forEach(die => {
                    if (indices.includes(parseInt(die.dataset.index))) {
                        die.classList.add('kept');
                    } else {
                        die.classList.add('dropped');
                    }
                });
            }

            resultsDisplay.style.display = 'flex';

        }, 500);

        // Click listeners for selection
        pool.querySelectorAll('.die').forEach(die => {
            die.addEventListener('click', () => {
                die.classList.toggle('selected');
            });
        });
    }
}
