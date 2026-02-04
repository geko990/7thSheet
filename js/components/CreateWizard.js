import { Storage } from '../storage.js';

export default class CreateWizard {
    constructor(app) {
        this.app = app;
        this.step = 0; // Start at edition selection
        this.edition = null;
        this.data = {
            nations: [],
            backgrounds: [],
            skills: [],
            advantages: [],
            schools: [] // V1 specific
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
            stories: [],
            edition: null // Track edition in character data
        };
        this.tempPoints = {
            traits: 2,
            skills: 10,
            advantages: 5
        };
    }

    async init() {
        // Data loading is now deferred to selectEdition
    }

    async loadData(edition) {
        const basePath = edition === '1e' ? 'data/v1' : 'data/v2';
        try {
            // Load common base files (structure differs slightly but files exist)
            const [nations, skills] = await Promise.all([
                fetch(`${basePath}/nations.json`).then(r => r.json()),
                fetch(`${basePath}/skills.json`).then(r => r.json())
            ]);

            this.data.nations = nations;
            this.data.skills = skills;

            if (edition === '2e') {
                const [backgrounds, advantages] = await Promise.all([
                    fetch(`${basePath}/backgrounds.json`).then(r => r.json()),
                    fetch(`${basePath}/advantages.json`).then(r => r.json())
                ]);
                this.data.backgrounds = backgrounds;
                this.data.advantages = advantages;
            } else {
                // V1 Specifics
                const schools = await fetch(`${basePath}/schools.json`).then(r => r.json());
                this.data.schools = schools;
                // V1 might not have backgrounds/advantages in the same format yet
                this.data.backgrounds = [];
                this.data.advantages = [];
            }
        } catch (e) {
            console.error('Error loading data:', e);
            alert('Errore nel caricamento dei dati. Controlla la console.');
        }
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'wizard-container';

        // Conditional progress bar
        const progressHTML = this.step > 0 ? `
            <div class="wizard-progress">
                <div class="step-indicator ${this.step === 1 ? 'active' : ''}">1</div>
                <div class="step-line"></div>
                <div class="step-indicator ${this.step === 2 ? 'active' : ''}">2</div>
                <div class="step-line"></div>
                <div class="step-indicator ${this.step === 3 ? 'active' : ''}">3</div>
                <div class="step-line"></div>
                <div class="step-indicator ${this.step === 4 ? 'active' : ''}">4</div>
            </div>
        ` : '';

        container.innerHTML = `
            <h2 class="page-title">Creazione Personaggio</h2>
            
            ${progressHTML}

            <div id="step-content" class="wizard-step-content">
                <!-- Content injected here -->
            </div>

            ${this.step > 0 ? `
            <div class="wizard-controls mt-20">
                <button class="btn btn-secondary" id="btn-prev">
                    Indietro
                </button>
                <button class="btn btn-primary" id="btn-next">
                    ${this.step === 4 ? 'Completa' : 'Avanti'}
                </button>
            </div>
            ` : ''}
        `;

        this.updateStepContent(container);
        if (this.step > 0) {
            this.attachGlobalListeners(container);
        }

        return container;
    }

    attachGlobalListeners(container) {
        const btnPrev = container.querySelector('#btn-prev');
        const btnNext = container.querySelector('#btn-next');

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                if (this.step > 1) {
                    this.step--;
                    this.render().then(newContent => {
                        container.replaceWith(newContent);
                    });
                } else if (this.step === 1) {
                    // Go back to edition selection
                    this.step = 0;
                    this.edition = null;
                    this.render().then(newContent => {
                        container.replaceWith(newContent);
                    });
                }
            });
        }

        if (btnNext) {
            btnNext.addEventListener('click', () => {
                if (this.validateStep()) {
                    if (this.step < 4) {
                        this.step++;
                        this.render().then(newContent => {
                            container.replaceWith(newContent);
                        });
                    } else {
                        this.finishCreation();
                    }
                }
            });
        }
    }

    updateStepContent(container) {
        const contentDiv = container.querySelector('#step-content');

        switch (this.step) {
            case 0:
                this.renderStep0(contentDiv);
                break;
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

    // STEP 0: Edition Selection
    renderStep0(container) {
        container.innerHTML = `
            <div class="edition-selector">
                <h3 class="mb-20 text-center">Seleziona Edizione</h3>
                <div class="edition-cards" style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
                    
                    <div class="card edition-card" onclick="window.selectEdition('1e')" style="cursor: pointer; width: 250px; text-align: center; hover: border-color: var(--accent-gold);">
                        <h3 class="card-title">1ª Edizione</h3>
                        <p>Roll & Keep Classico</p>
                        <ul style="text-align: left; margin-top: 10px; font-size: 0.9em;">
                            <li>Abilità & Knacks</li>
                            <li>Scuole di Scherma</li>
                            <li>Stregoneria per Nazione</li>
                        </ul>
                    </div>

                    <div class="card edition-card" onclick="window.selectEdition('2e')" style="cursor: pointer; width: 250px; text-align: center;">
                        <h3 class="card-title">2ª Edizione</h3>
                        <p>Narrativa & Raise</p>
                        <ul style="text-align: left; margin-top: 10px; font-size: 0.9em;">
                            <li>Backgrounds & Vantaggi</li>
                            <li>Storie & Arcani</li>
                            <li>Approccio Cinematografico</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        window.selectEdition = async (ed) => {
            this.edition = ed;
            this.character.edition = ed;
            await this.loadData(ed);
            this.step = 1;
            // Re-render whole component to show controls
            const newContent = await this.render();
            // Since method is likely called within an existing container, we need to find the root
            // But render returns a disconnected element.
            // We need to replace the current container in the DOM.
            const currentContainer = document.querySelector('.wizard-container');
            if (currentContainer) {
                currentContainer.replaceWith(newContent);
            }
        };
    }

    // STEP 1: Concept & Nation
    renderStep1(container) {
        container.innerHTML = `
            <div class="card">
                <h3 class="card-title">Concetto e Nazione (${this.edition === '1e' ? '1ª Ed' : '2ª Ed'})</h3>
                
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
                if (nation.bonus_trait && this.character.traits[nation.bonus_trait] !== undefined) {
                    this.character.traits[nation.bonus_trait]++;
                    nationDesc.textContent = `${nation.description} (+1 ${this.translateTrait(nation.bonus_trait)})`;
                } else {
                    nationDesc.textContent = nation.description;
                }
            } else {
                nationDesc.textContent = '';
            }
        });

        if (this.character.nation) {
            nationSelect.dispatchEvent(new Event('change'));
        }
    }

    // STEP 2: Traits (Shared logic for now, V1 might need tweak)
    renderStep2(container) {
        container.innerHTML = `
            <div class="card">
                <h3 class="card-title">Tratti</h3>
                <p class="mb-20">Distribuisci punti aggiuntivi.</p>
                
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
                    Punti Rimanenti: <span id="points-remaining" style="font-weight: bold; color: var(--accent-gold);">Verifica manuale per ora</span>
                </div>
            </div>
        `;

        window.adjustTrait = (trait, delta) => {
            const current = this.character.traits[trait];
            const newVal = current + delta;
            if (newVal < 2) return;
            // Allow going high for now, enforcement can come later
            this.character.traits[trait] = newVal;
            document.getElementById(`val-${trait}`).textContent = newVal;
        };
    }

    // STEP 3: Backgrounds (V2 Only) or Skills/Knacks (V1)
    renderStep3(container) {
        if (this.edition === '2e') {
            this.renderStep3V2(container);
        } else {
            this.renderStep3V1(container); // Implement placeholder for V1
        }
    }

    renderStep3V2(container) {
        container.innerHTML = `
            <div class="card">
                <h3 class="card-title">Background (2ª Ed)</h3>
                <p class="mb-20">Seleziona 2 Background.</p>
                
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

    renderStep3V1(container) {
        container.innerHTML = `
            <div class="card">
                <h3 class="card-title">Abilità & Knacks (1ª Ed)</h3>
                <p>Implementazione V1 in corso. Qui apparirà la selezione di Knacks.</p>
                <div class="skill-list">
                    ${this.data.skills.map(skill => `
                        <div class="skill-item">
                            <strong>${skill.name}</strong> (${this.translateTrait(skill.trait)})
                            <ul style="font-size: 0.8em; color: var(--text-faded);">
                                ${skill.knacks ? skill.knacks.join(', ') : ''}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // STEP 4: Review
    renderStep4(container) {
        container.innerHTML = `
            <div class="card text-center">
                <h3 class="card-title">Riepilogo</h3>
                <ul style="text-align: left; list-style: none; padding: 0;">
                    <li><strong>Edizione:</strong> ${this.edition === '1e' ? '1ª Edizione' : '2ª Edizione'}</li>
                    <li><strong>Nome:</strong> ${this.character.name}</li>
                    <li><strong>Nazione:</strong> ${this.character.nation}</li>
                    <li><strong>Tratti:</strong> ${Object.entries(this.character.traits).map(([k, v]) => `${this.translateTrait(k)} ${v}`).join(', ')}</li>
                    ${this.edition === '2e' ? `<li><strong>Backgrounds:</strong> ${this.character.backgrounds.join(', ')}</li>` : ''}
                </ul>
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
        if (this.step === 3 && this.edition === '2e') {
            if (this.character.backgrounds.length !== 2) {
                alert('Seleziona esattamente 2 Background');
                return false;
            }
        }
        return true;
    }

    finishCreation() {
        if (this.edition === '2e') {
            // Process V2 Backgrounds
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
        }

        Storage.saveCharacter(this.character);
        this.app.router.navigate('characters');
    }

    translateTrait(trait) {
        const map = {
            'brawn': 'Muscoli', 'finesse': 'Finezza', 'resolve': 'Risolutezza',
            'wits': 'Acume', 'panache': 'Panache',
            'balance': 'Equilibrio' // V1 trait sometimes used? Or just knacks
        };
        return map[trait.toLowerCase()] || trait;
    }

    translateSkill(skillId) {
        const skill = this.data.skills.find(s => s.id === skillId);
        return skill ? skill.name : skillId;
    }
}
