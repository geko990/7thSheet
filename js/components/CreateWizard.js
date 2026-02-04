import { Storage } from '../storage.js';

export default class CreateWizard {
    constructor(app) {
        this.app = app;
        this.step = 1;
        this.data = {
            nations: [],
            backgrounds: [],
            skills: [],
            advantages: []
        };
        this.character = {
            name: '',
            concept: '',
            nation: '',
            religion: '',
            traits: { brawn: 2, finesse: 2, resolve: 2, wits: 2, panache: 2 },
            skills: {},
            backgrounds: [],
            advantages: [],
            arcana: null,
            stories: []
        };
        this.tempPoints = {
            traits: 2,
            skills: 10,
            advantages: 5
        };
    }

    async init() {
        try {
            const [nations, backgrounds, skills, advantages] = await Promise.all([
                fetch('data/nations.json').then(r => r.json()),
                fetch('data/backgrounds.json').then(r => r.json()),
                fetch('data/skills.json').then(r => r.json()),
                fetch('data/advantages.json').then(r => r.json())
            ]);

            this.data = { nations, backgrounds, skills, advantages };
        } catch (e) {
            console.error('Error loading data:', e);
        }
    }

    async render() {
        if (this.data.nations.length === 0) await this.init();

        const container = document.createElement('div');
        container.className = 'wizard-container';

        container.innerHTML = `
            <h2 class="page-title">Creazione Personaggio</h2>
            
            <div class="wizard-progress">
                <div class="step-indicator ${this.step === 1 ? 'active' : ''}">1</div>
                <div class="step-line"></div>
                <div class="step-indicator ${this.step === 2 ? 'active' : ''}">2</div>
                <div class="step-line"></div>
                <div class="step-indicator ${this.step === 3 ? 'active' : ''}">3</div>
                <div class="step-line"></div>
                <div class="step-indicator ${this.step === 4 ? 'active' : ''}">4</div>
            </div>

            <div id="step-content" class="wizard-step-content">
                <!-- Content injected here -->
            </div>

            <div class="wizard-controls mt-20">
                <button class="btn btn-secondary" id="btn-prev" ${this.step === 1 ? 'disabled' : ''}>
                    Indietro
                </button>
                <button class="btn btn-primary" id="btn-next">
                    ${this.step === 4 ? 'Completa' : 'Avanti'}
                </button>
            </div>
        `;

        this.updateStepContent(container);
        this.attachGlobalListeners(container);

        return container;
    }

    attachGlobalListeners(container) {
        const btnPrev = container.querySelector('#btn-prev');
        const btnNext = container.querySelector('#btn-next');

        btnPrev.addEventListener('click', () => {
            if (this.step > 1) {
                this.step--;
                this.updateUI(container);
            }
        });

        btnNext.addEventListener('click', () => {
            if (this.validateStep()) {
                if (this.step < 4) {
                    this.step++;
                    this.updateUI(container);
                } else {
                    this.finishCreation();
                }
            }
        });
    }

    updateUI(container) {
        // Update progress
        container.querySelectorAll('.step-indicator').forEach((el, idx) => {
            el.classList.toggle('active', idx + 1 === this.step);
        });

        // Update buttons
        container.querySelector('#btn-prev').disabled = this.step === 1;
        container.querySelector('#btn-next').textContent = this.step === 4 ? 'Completa' : 'Avanti';

        // Update content
        this.updateStepContent(container);
    }

    updateStepContent(container) {
        const contentDiv = container.querySelector('#step-content');

        switch (this.step) {
            case 1:
                this.renderStep1(contentDiv);
                break;
            case 2:
                this.renderStep2(contentDiv);
                break;
            case 3:
                this.renderStep3(contentDiv);
                break;
            case 4:
                this.renderStep4(contentDiv);
                break;
        }
    }

    // STEP 1: Concept & Nation
    renderStep1(container) {
        container.innerHTML = `
            <div class="card">
                <h3 class="card-title">Concetto e Nazione</h3>
                
                <div class="form-group">
                    <label class="form-label">Nome Eroe</label>
                    <input type="text" class="form-input" id="char-name" value="${this.character.name}" placeholder="Es. Elena de la Cruz">
                </div>

                <div class="form-group">
                    <label class="form-label">Concetto</label>
                    <input type="text" class="form-input" id="char-concept" value="${this.character.concept}" placeholder="Es. Spadaccina in cerca di vendetta">
                </div>

                <div class="form-group">
                    <label class="form-label">Nazione</label>
                    <select class="form-select" id="char-nation">
                        <option value="">Seleziona Nazione...</option>
                        ${this.data.nations.map(n => `<option value="${n.name}" ${this.character.nation === n.name ? 'selected' : ''}>${n.name}</option>`).join('')}
                    </select>
                </div>
                
                <div id="nation-desc" class="mt-20" style="font-style: italic; color: var(--text-faded);"></div>
            </div>
        `;

        const nameInput = container.querySelector('#char-name');
        const conceptInput = container.querySelector('#char-concept');
        const nationSelect = container.querySelector('#char-nation');
        const nationDesc = container.querySelector('#nation-desc');

        nameInput.addEventListener('input', (e) => this.character.name = e.target.value);
        conceptInput.addEventListener('input', (e) => this.character.concept = e.target.value);

        nationSelect.addEventListener('change', (e) => {
            this.character.nation = e.target.value;
            const nation = this.data.nations.find(n => n.name === e.target.value);
            if (nation) {
                // Reset traits to base 2 before applying bonus
                this.character.traits = { brawn: 2, finesse: 2, resolve: 2, wits: 2, panache: 2 };
                // Apply bonus
                this.character.traits[nation.bonus_trait]++;
                nationDesc.textContent = `${nation.description} (+1 ${this.translateTrait(nation.bonus_trait)})`;
            } else {
                nationDesc.textContent = '';
            }
        });

        // Trigger generic description on load if selected
        if (this.character.nation) {
            nationSelect.dispatchEvent(new Event('change'));
        }
    }

    // STEP 2: Traits
    renderStep2(container) {
        container.innerHTML = `
            <div class="card">
                <h3 class="card-title">Tratti</h3>
                <p class="mb-20">Distribuisci 2 punti aggiuntivi. (Max 3 all'inizio)</p>
                
                <div class="traits-container">
                    ${Object.keys(this.character.traits).map(trait => `
                        <div class="trait-row">
                            <span class="trait-label">${this.translateTrait(trait)}</span>
                            <div class="trait-controls">
                                <button class="btn-circle" onclick="window.adjustTrait('${trait}', -1)">-</button>
                                <span class="trait-value" id="val-${trait}">${this.character.traits[trait]}</span>
                                <button class="btn-circle" onclick="window.adjustTrait('${trait}', 1)">+</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="mt-20 text-center">
                    Punti Rimanenti: <span id="points-remaining" style="font-weight: bold; color: var(--accent-gold);">2</span>
                </div>
            </div>
        `;

        // Global handler for the inline onclicks (simple solution for now)
        window.adjustTrait = (trait, delta) => {
            const current = this.character.traits[trait];
            const newVal = current + delta;

            // Logic: Base is determined by Nation (2 or 3). 
            // We are adding on top. Simplified: Total points check.
            // Let's assume base sum is 11 (4 traits at 2, 1 at 3 from nation).
            // User adds 2 points -> Total sum should be 13.

            const currentSum = Object.values(this.character.traits).reduce((a, b) => a + b, 0);
            const targetSum = 13; // 10 base + 1 nation + 2 free

            if (delta > 0) {
                if (newVal > 3) return; // Max 3 start
                if (currentSum >= targetSum) return; // No points left
            } else {
                if (newVal < 2) return; // Min 2
                // Also prevent going below nation bonus? complex validation, skipping for MVP
            }

            this.character.traits[trait] = newVal;
            document.getElementById(`val-${trait}`).textContent = newVal;
            const remaining = targetSum - (currentSum + delta);
            document.getElementById('points-remaining').textContent = remaining;
        };

        // Initial calc
        setTimeout(() => {
            const currentSum = Object.values(this.character.traits).reduce((a, b) => a + b, 0);
            const targetSum = 13;
            const remaining = targetSum - currentSum;
            const remainEl = document.getElementById('points-remaining');
            if (remainEl) remainEl.textContent = remaining;
        }, 0);
    }

    // STEP 3: Backgrounds
    renderStep3(container) {
        container.innerHTML = `
            <div class="card">
                <h3 class="card-title">Background</h3>
                <p class="mb-20">Seleziona 2 Background. (Definiscono abilità e vantaggi)</p>
                
                <div class="background-list" style="max-height: 400px; overflow-y: auto;">
                    ${this.data.backgrounds.map(bg => `
                        <div class="background-item ${this.character.backgrounds.includes(bg.name) ? 'selected' : ''}" 
                             data-name="${bg.name}">
                            <div class="bg-header">
                                <strong>${bg.name}</strong>
                                <span class="bg-quirk">${bg.quirk}</span>
                            </div>
                            <div class="bg-details">
                                Skills: ${bg.skills.map(s => this.translateSkill(s)).join(', ')}<br>
                                Advantages: ${bg.advantages.join(', ')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.querySelectorAll('.background-item').forEach(item => {
            item.addEventListener('click', () => {
                const name = item.dataset.name;
                const index = this.character.backgrounds.indexOf(name);

                if (index > -1) {
                    this.character.backgrounds.splice(index, 1);
                    item.classList.remove('selected');
                } else {
                    if (this.character.backgrounds.length < 2) {
                        this.character.backgrounds.push(name);
                        item.classList.add('selected');
                    }
                }
            });
        });
    }

    // STEP 4: Skills & Finish
    renderStep4(container) {
        container.innerHTML = `
            <div class="card text-center">
                <h3 class="card-title">Riepilogo</h3>
                <ul style="text-align: left; list-style: none; padding: 0;">
                    <li><strong>Nome:</strong> ${this.character.name}</li>
                    <li><strong>Nazione:</strong> ${this.character.nation}</li>
                    <li><strong>Tratti:</strong> ${Object.entries(this.character.traits).map(([k, v]) => `${this.translateTrait(k)} ${v}`).join(', ')}</li>
                    <li><strong>Backgrounds:</strong> ${this.character.backgrounds.join(', ')}</li>
                </ul>
                <p class="mt-20"><em>(Skills e Vantaggi verranno calcolati automaticamente dai background per questo MVP)</em></p>
            </div>
        `;
    }

    validateStep() {
        if (this.step === 1) {
            if (!this.character.name || !this.character.nation) {
                alert('Inserisci Nome e Nazione');
                return false;
            }
        }
        if (this.step === 3) {
            if (this.character.backgrounds.length !== 2) {
                alert('Seleziona esattamente 2 Background');
                return false;
            }
        }
        return true;
    }

    finishCreation() {
        // Calculate derived skills/advantages from backgrounds
        this.character.backgrounds.forEach(bgName => {
            const bgData = this.data.backgrounds.find(b => b.name === bgName);
            if (bgData) {
                bgData.skills.forEach(skillId => {
                    this.character.skills[skillId] = (this.character.skills[skillId] || 0) + 1;
                });
                bgData.advantages.forEach(adv => {
                    this.character.advantages.push(adv);
                });
            }
        });

        Storage.saveCharacter(this.character);
        this.app.router.navigate('characters');
    }

    translateTrait(trait) {
        const map = {
            'brawn': 'Muscoli', 'finesse': 'Finezza', 'resolve': 'Risolutezza',
            'wits': 'Acume', 'panache': 'Panache'
        };
        return map[trait.toLowerCase()] || trait;
    }

    translateSkill(skillId) {
        const skill = this.data.skills.find(s => s.id === skillId);
        return skill ? skill.name : skillId;
    }
}
