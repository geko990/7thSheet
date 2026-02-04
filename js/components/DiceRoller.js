import { Dice } from '../dice.js';

/**
 * Dice Roller Component
 * Interactive D10 roller with Raise calculator
 */
export default class DiceRoller {
    constructor(app) {
        this.app = app;
        this.diceCount = 5;
        this.results = [];
        this.selectedDice = new Set();
    }

    async render() {
        const div = document.createElement('div');
        div.className = 'dice-area';
        div.innerHTML = `
            <h2 class="page-title">Lancio Dadi</h2>
            
            <div class="card">
                <div class="dice-controls">
                    <div class="dice-count-control">
                        <button class="dice-count-btn" id="btn-dice-minus">−</button>
                        <span class="dice-count-display" id="dice-count">${this.diceCount}</span>
                        <button class="dice-count-btn" id="btn-dice-plus">+</button>
                        <span style="margin-left: 5px;">D10</span>
                    </div>
                </div>
                
                <div class="dice-pool" id="dice-pool">
                    <p style="color: var(--text-faded); font-style: italic;">
                        Premi "Lancia" per tirare i dadi
                    </p>
                </div>
                
                <div class="raises-display" id="raises-display" style="display: none;">
                    <span class="raises-label">Raise</span>
                    <div id="raises-count">0</div>
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
                    In <strong>7th Sea 2a Edizione</strong>, ogni combinazione di dadi che somma a 
                    <strong>10 o più</strong> conta come un <strong>Raise</strong>. 
                    Puoi cliccare sui dadi per selezionarli manualmente.
                </p>
            </div>
        `;

        setTimeout(() => this.attachListeners(div), 0);
        return div;
    }

    attachListeners(container) {
        // Dice count controls
        container.querySelector('#btn-dice-minus').addEventListener('click', () => {
            if (this.diceCount > 1) {
                this.diceCount--;
                this.updateDiceCount(container);
            }
        });

        container.querySelector('#btn-dice-plus').addEventListener('click', () => {
            if (this.diceCount < 20) {
                this.diceCount++;
                this.updateDiceCount(container);
            }
        });

        // Roll button
        container.querySelector('#btn-roll').addEventListener('click', () => {
            this.rollDice(container);
        });
    }

    updateDiceCount(container) {
        container.querySelector('#dice-count').textContent = this.diceCount;
    }

    rollDice(container) {
        const pool = container.querySelector('#dice-pool');
        const raisesDisplay = container.querySelector('#raises-display');
        const raisesCount = container.querySelector('#raises-count');

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
        }, 500);

        // Calculate raises
        const result = Dice.calculateRaises(this.results);
        raisesDisplay.style.display = 'block';
        raisesCount.textContent = result.raises;

        // Add click listeners to dice
        pool.querySelectorAll('.die').forEach(die => {
            die.addEventListener('click', () => {
                const index = parseInt(die.dataset.index);
                if (this.selectedDice.has(index)) {
                    this.selectedDice.delete(index);
                    die.classList.remove('selected');
                } else {
                    this.selectedDice.add(index);
                    die.classList.add('selected');
                }
                this.updateSelectedSum(container);
            });
        });
    }

    updateSelectedSum(container) {
        if (this.selectedDice.size === 0) return;

        const sum = Array.from(this.selectedDice).reduce((acc, idx) => {
            return acc + this.results[idx];
        }, 0);

        // Show sum feedback (could add a UI element for this)
        console.log(`Selection sum: ${sum} ${sum >= 10 ? '= 1 Raise!' : ''}`);
    }
}
