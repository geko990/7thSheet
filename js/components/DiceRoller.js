import { Dice } from '../dice.js';

/**
 * Dice Roller Component
 * Interactive D10 roller with Raise calculator (2e) and Roll & Keep (1e) support
 */
export default class DiceRoller {
    constructor(app) {
        this.app = app;
        this.diceCount = 5;
        this.keepCount = 3;
        this.edition = '2e'; // Default
        this.results = [];
        this.selectedDice = new Set();
    }

    async render() {
        const div = document.createElement('div');
        div.className = 'dice-area';
        div.innerHTML = `
            <h2 class="page-title">Lancio Dadi</h2>
            
            <div class="edition-toggle mb-20 text-center">
                <button class="btn ${this.edition === '1e' ? 'btn-primary' : 'btn-secondary'}" id="btn-ed-1e">1ª Ed (R&K)</button>
                <button class="btn ${this.edition === '2e' ? 'btn-primary' : 'btn-secondary'}" id="btn-ed-2e">2ª Ed (Raise)</button>
            </div>

            <div class="card">
                <div class="dice-controls">
                    <div class="control-group">
                        <label>Dadi Lanciati (Roll)</label>
                        <div class="dice-count-control">
                            <button class="dice-count-btn" id="btn-dice-minus">−</button>
                            <span class="dice-count-display" id="dice-count">${this.diceCount}</span>
                            <button class="dice-count-btn" id="btn-dice-plus">+</button>
                            <span style="margin-left: 5px;">k</span>
                        </div>
                    </div>

                    ${this.edition === '1e' ? `
                    <div class="control-group mt-10">
                        <label>Dadi Tenuti (Keep)</label>
                        <div class="dice-count-control">
                            <button class="dice-count-btn" id="btn-keep-minus">−</button>
                            <span class="dice-count-display" id="keep-count">${this.keepCount}</span>
                            <button class="dice-count-btn" id="btn-keep-plus">+</button>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="dice-pool" id="dice-pool">
                    <p style="color: var(--text-faded); font-style: italic;">
                        Premi "Lancia" per tirare ${this.diceCount}d10${this.edition === '1e' ? `k${this.keepCount}` : ''}
                    </p>
                </div>
                
                <div class="results-display" id="results-display" style="display: none;">
                    <div class="result-box">
                        <span class="result-label">${this.edition === '1e' ? 'Totale' : 'Raise'}</span>
                        <div id="result-value">0</div>
                    </div>
                </div>
                
                <div class="text-center mt-20">
                    <button class="btn btn-primary" id="btn-roll">
                        🎲 Lancia!
                    </button>
                </div>
            </div>
            
            <div class="card mt-20">
                <div class="card-title">Come funziona</div>
                <p style="font-size: 0.9rem; color: var(--text-faded); line-height: 1.6;">
                    ${this.edition === '2e'
                ? '<strong>2ª Edizione:</strong> Combina i dadi per formare somme di 10 (Raise).'
                : '<strong>1ª Edizione:</strong> Tieni i risultati migliori e sommali tra loro.'}
                </p>
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
                // Ensure Keep isn't higher than Roll
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

        // Keep controls (only attached if present)
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
        // Full re-render needed for structure changes
        this.render().then(newContent => {
            container.replaceWith(newContent);
        });
    }

    rollDice(container) {
        const pool = container.querySelector('#dice-pool');
        const resultsDisplay = container.querySelector('#results-display');
        const resultValue = container.querySelector('#result-value');

        // Clear previous
        this.results = Dice.roll(this.diceCount);
        this.selectedDice.clear();

        // Render dice with animation
        pool.innerHTML = this.results.map((val, idx) => `
            <div class="die rolling" data-index="${idx}" data-value="${val}">
                ${val}
            </div>
        `).join('');

        // Remove animation class after animation completes
        setTimeout(() => {
            pool.querySelectorAll('.die').forEach(die => {
                die.classList.remove('rolling');
            });

            // Calculate Logic
            if (this.edition === '2e') {
                const result = Dice.calculateRaises(this.results);
                resultValue.textContent = result.raises;
                // Highlight raises? (Optional enhancement)
            } else {
                const result = Dice.calculateRollAndKeep(this.results, this.keepCount);
                resultValue.textContent = result.total;

                // Highlight kept dice
                pool.querySelectorAll('.die').forEach(die => {
                    const val = parseInt(die.dataset.value);
                    // This is tricky visually as multiple dice might have same value
                    // The simple logic: Highlight the highest N
                });

                // Simplified highlight: Just mark top N
                // Sort indices by value
                const indices = this.results.map((v, i) => ({ v, i }))
                    .sort((a, b) => b.v - a.v)
                    .slice(0, this.keepCount)
                    .map(item => item.i);

                pool.querySelectorAll('.die').forEach(die => {
                    if (indices.includes(parseInt(die.dataset.index))) {
                        die.classList.add('kept'); // Add 'kept' style in CSS
                    } else {
                        die.classList.add('dropped'); // Add 'dropped' style 
                    }
                });
            }

            resultsDisplay.style.display = 'block';

        }, 500);

        // Add click listeners (mostly for V2 manual selection, but kept for V1 fun)
        pool.querySelectorAll('.die').forEach(die => {
            die.addEventListener('click', () => {
                die.classList.toggle('selected');
                // You could implement manual override here
            });
        });
    }
}
