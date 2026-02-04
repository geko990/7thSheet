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
            image: null, // New image field
            traits: { brawn: 2, finesse: 2, resolve: 2, wits: 2, panache: 2 },
            skills: {},
            backgrounds: [],
            advantages: [],
            arcana: null,
            stories: [],
            edition: null, // Track edition in character data
            level: 1 // Default Level 1
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
                const [schools, advantages] = await Promise.all([
                    fetch(`${basePath}/schools.json`).then(r => r.json()),
                    fetch(`${basePath}/advantages.json`).then(r => r.json())
                ]);
                this.data.schools = schools;
                this.data.advantages = advantages;
                this.data.backgrounds = [];
            }
        } catch (e) {
            console.error('Error loading data:', e);
            alert('Errore nel caricamento dei dati. Controlla la console.');
        }
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'wizard-container';
        const totalSteps = 6;

        // Conditional progress bar
        let progressHTML = '';
        if (this.step > 0) {
            progressHTML = '<div class="wizard-progress">';
            for (let i = 1; i <= totalSteps; i++) {
                progressHTML += `
                    <div class="step-indicator ${this.step === i ? 'active' : ''}">${i}</div>
                    ${i < totalSteps ? '<div class="step-line"></div>' : ''}
                `;
            }
            progressHTML += '</div>';
        }

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
                    ${this.step === totalSteps ? 'Completa' : 'Avanti'}
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
        const totalSteps = 6;

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
                    if (this.step < totalSteps) {
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
                this.renderStep3(contentDiv); // V1: Skills, V2: Background
                break;
            case 4:
                this.renderStep4(contentDiv); // V1: Advantages, V2: Skills/Adv
                break;
            case 5:
                this.renderStep5(contentDiv); // V1: Schools/Sorcery, V2: Story/Arcana
                break;
            case 6:
                this.renderStep6(contentDiv); // Review
                break;
        }
    }

    // STEP 0: Edition Selection
    renderStep0(container) {
        container.innerHTML = `
            <div class="edition-selector">
    <h3 class="mb-20 text-center" style="font-family: var(--font-display); letter-spacing: 1px; color: var(--accent-gold); font-size: 1.4rem;">Seleziona Edizione</h3>

                <div class="edition-grid">
                    
                    <div class="edition-card-box" onclick="window.selectEdition('1e')">
                        <div class="edition-icon-box">⚔️</div>
                        <h3 class="card-title">1ª Edizione</h3>
                        <p class="edition-subtitle">Roll & Keep</p>
                        <div class="edition-select-btn-box">Seleziona</div>
                    </div>

                    <div class="edition-card-box" onclick="window.selectEdition('2e')">
                        <div class="edition-icon-box">🎭</div>
                        <h3 class="card-title">2ª Edizione</h3>
                        <p class="edition-subtitle">Narrativa</p>
                        <div class="edition-select-btn-box">Seleziona</div>
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
            < div class="card" >
                <h3 class="card-title">Identità (${this.edition === '1e' ? '1ª Ed' : '2ª Ed'})</h3>
                
                <div class="form-group" style="text-align: center; margin-bottom: 20px;">
                    <div class="char-image-preview" id="image-preview" style="width: 100px; height: 100px; border-radius: 50%; background: #ccc; margin: 0 auto 10px; background-size: cover; background-position: center; border: 2px solid var(--accent-gold);"></div>
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('char-image-upload').click()">Carica Immagine</button>
                    <input type="file" id="char-image-upload" accept="image/*" style="display: none;">
                    <div style="margin-top: 5px; font-size: 0.8rem; color: var(--text-faded);">o incolla URL</div>
                    <input type="text" class="form-input" id="char-image-url" placeholder="https://..." style="margin-top: 5px; font-size: 0.8rem;">
                </div>

                <div class="form-group">
                    <label class="form-label">Nome Eroe</label>
                    <input type="text" class="form-input" id="char-name" value="${this.character.name}" placeholder="Es. Elena de la Cruz">
                </div>

                <div class="form-group">
                    <label class="form-label">Concetto</label>
                    <input type="text" class="form-input" id="char-concept" value="${this.character.concept}" placeholder="Es. Spadaccina in cerca di vendetta">
                </div>

                <div class="form-group">
                    <label class="form-label">Religione</label>
                    <input type="text" class="form-input" id="char-religion" value="${this.character.religion}" placeholder="Es. Vaticina, Objectionist...">
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
        const religionInput = container.querySelector('#char-religion');
        const nationSelect = container.querySelector('#char-nation');
        const nationDesc = container.querySelector('#nation-desc');

        // Image logic
        const imageUpload = container.querySelector('#char-image-upload');
        const imageUrl = container.querySelector('#char-image-url');
        const imagePreview = container.querySelector('#image-preview');

        const updatePreview = (src) => {
            if (src) {
                imagePreview.style.backgroundImage = `url('${src}')`;
                this.character.image = src;
            }
        };

        if (this.character.image) updatePreview(this.character.image);

        imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => updatePreview(evt.target.result);
                reader.readAsDataURL(file);
            }
        });

        imageUrl.addEventListener('input', (e) => updatePreview(e.target.value));

        // Details Logic
        nameInput.addEventListener('input', (e) => this.character.name = e.target.value);
        conceptInput.addEventListener('input', (e) => this.character.concept = e.target.value);
        religionInput.addEventListener('input', (e) => this.character.religion = e.target.value);

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

    // STEP 2: Traits
    renderStep2(container) {
        if (this.edition === '1e') {
            this.renderStep2V1(container);
        } else {
            this.renderStep2V2(container);
        }
    }

    renderStep2V2(container) {
        // V2 Logic: Start 2, Nation +1, +2 Points to distribute
        // Max start 3 (usually), 4 with nation bonus? 
        // Let's enforce: Base 2. Nation +1 is already applied in step 1.
        // We track "spent" points against the pool of 2.

        container.innerHTML = `
            < div class="card" >
                <h3 class="card-title">Tratti (2ª Ed)</h3>
                <p class="mb-20">Hai <strong>2 punti</strong> da distribuire sui Tratti.</p>
                
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
                    <p>Punti disponibili: <span id="points-remaining" style="font-weight: bold; font-size: 1.2rem; color: var(--accent-gold);">2</span></p>
                    <p id="error-msg" style="color: var(--accent-red); font-size: 0.9rem; margin-top: 5px;"></p>
                </div>
            </div >
            `;

        // Calculate initial spent points (delta from base)
        // Base is 2 + Nation Bonus.
        // We need to know the base to calculate delta.
        // Simplified: We assume current values are correct Base + Previous Edits.
        // Actually, we must track "added" points separately or deduce them.
        // Problem: If user goes back/forth, we lose track of "base" vs "added" if we just modify character.traits directly without history.
        // FIX: We can deduce base from Nation.

        const getBaseTrait = (trait) => {
            let base = 2;
            const nationName = this.character.nation;
            const nation = this.data.nations.find(n => n.name === nationName);
            if (nation && nation.bonus_trait === trait) base = 3;
            return base;
        };

        const updateUI = () => {
            let spent = 0;
            Object.keys(this.character.traits).forEach(t => {
                spent += (this.character.traits[t] - getBaseTrait(t));
            });
            const remaining = 2 - spent;

            const el = document.getElementById('points-remaining');
            if (el) {
                el.textContent = remaining;
                el.style.color = remaining < 0 ? 'var(--accent-red)' : 'var(--accent-gold)';
            }
            return remaining;
        };

        setTimeout(updateUI, 0);

        window.adjustTrait = (trait, delta) => {
            const current = this.character.traits[trait];
            const base = getBaseTrait(trait);
            const newVal = current + delta;

            // Calc current spent to check limits
            const remaining = updateUI();

            if (delta > 0 && remaining <= 0) return; // No points left
            if (newVal < base) return; // Cannot go below base (2 or 3)
            if (newVal > 5) return; // Hard cap 5

            this.character.traits[trait] = newVal;
            document.getElementById(`val - ${trait} `).textContent = newVal;
            updateUI();
        };
    }

    renderStep2V1(container) {
        // V1 Logic: 100 Hero Points total pool. Traits cost 8 HP.
        // Starts at 2. Nation bonus +1 (free?). Usually yes.

        container.innerHTML = `
            < div class="card" >
                <h3 class="card-title">Tratti (1ª Ed)</h3>
                <p class="mb-20">Usa i Punti Eroe (100 totali) per i Tratti.<br>Costo: <strong>8 PE</strong> per punto.</p>
                
                <div class="traits-container">
                    ${Object.keys(this.character.traits).map(trait => `
                        <div class="trait-row">
                            <span class="trait-label">${this.translateTrait(trait)}</span>
                            <div class="trait-controls">
                                <button class="btn-circle" onclick="window.adjustTraitV1('${trait}', -1)">-</button>
                                <span class="trait-value" id="val-${trait}">${this.character.traits[trait]}</span>
                                <button class="btn-circle" onclick="window.adjustTraitV1('${trait}', 1)">+</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="mt-20 text-center">
                    <p>Costo Totale Tratti: <span id="traits-cost" style="font-weight: bold; color: var(--accent-gold);">0</span> PE</p>
                    <p style="font-size: 0.9rem; color: var(--text-faded);">PE residui per Skill/Vantaggi: <span id="hp-remaining">100</span></p>
                </div>
            </div >
            `;

        const getBaseTrait = (trait) => {
            let base = 2;
            const nationName = this.character.nation;
            const nation = this.data.nations.find(n => n.name === nationName);
            if (nation && nation.bonus_trait === trait) base = 3;
            return base;
        };

        const updateCost = () => {
            let cost = 0;
            Object.keys(this.character.traits).forEach(t => {
                const added = this.character.traits[t] - getBaseTrait(t);
                cost += added * 8;
            });

            document.getElementById('traits-cost').textContent = cost;
            document.getElementById('hp-remaining').textContent = 100 - cost;

            // Store total spent for next steps?
            this.tempPoints.spentTraits = cost;
        };

        setTimeout(updateCost, 0);

        window.adjustTraitV1 = (trait, delta) => {
            const current = this.character.traits[trait];
            const base = getBaseTrait(trait);
            const newVal = current + delta;

            if (newVal < base) return;
            if (newVal > 5) return; // Cap

            this.character.traits[trait] = newVal;
            document.getElementById(`val-${trait}`).textContent = newVal;
            updateCost();
        };
    }

    // STEP 3: Backgrounds (V2 Only) or Skills/Knacks (V1)
    renderStep3(container) {
        if (this.edition === '2e') {
            this.renderStep3V2(container);
        } else {
            this.renderStep3V1(container);
        }
    }

    renderStep3V2(container) {
        container.innerHTML = `
            < div class="card" >
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
            </div >
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
        // Init v1 skills tracking if needed
        if (!this.character.v1_purchased_skills) {
            this.character.v1_purchased_skills = [];
        }

        container.innerHTML = `
            < div class="card" >
                <h3 class="card-title">Abilità & Knacks (1ª Ed)</h3>
                <p>Costo Skill: <strong>2 PE</strong>. Costo Knack: <strong>1 PE</strong>/grado.</p>
                <div class="text-center mb-20">
                    <span style="font-size: 0.9rem; color: var(--text-faded);">PE Residui: <strong id="hp-remaining-step3">--</strong></span>
                </div>

                <div class="skill-list">
                    ${this.data.skills.map(skill => {
            const isBought = this.character.v1_purchased_skills.includes(skill.id);
            return `
                        <div class="skill-item-v1" style="border: 1px solid var(--border-worn); border-radius: 6px; padding: 10px; margin-bottom: 10px; background: rgba(255,255,255,0.3);">
                            <div class="skill-header" style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>${skill.name}</strong> <span style="font-size: 0.8em; color: var(--text-faded);">(${this.translateTrait(skill.trait)})</span>
                                </div>
                                <button class="btn btn-sm ${isBought ? 'btn-danger' : 'btn-secondary'}" 
                                        onclick="window.toggleSkillV1('${skill.id}')"
                                        style="font-size: 0.8rem; padding: 4px 8px;">
                                    ${isBought ? 'Rimuovi (2 PE)' : 'Acquista (2 PE)'}
                                </button>
                            </div>
                            
                            ${isBought ? `
                            <div class="knacks-list" style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border-worn);">
                                ${skill.knacks.map(knack => {
                const val = this.character.skills[knack] || 0;
                return `
                                    <div class="knack-row" style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
                                        <span style="font-size: 0.9rem;">${knack}</span>
                                        <div class="trait-controls">
                                            <button class="btn-circle" onclick="window.adjustKnackV1('${knack}', -1)" style="width: 20px; height: 20px; font-size: 1rem;">-</button>
                                            <span class="trait-value" id="val-knack-${knack.replace(/\s+/g, '-')}" style="font-size: 1rem; min-width: 20px;">${val}</span>
                                            <button class="btn-circle" onclick="window.adjustKnackV1('${knack}', 1)" style="width: 20px; height: 20px; font-size: 1rem;">+</button>
                                        </div>
                                    </div>
                                    `;
            }).join('')}
                            </div>
                            ` : ''}
                        </div>
                        `;
        }).join('')}
                </div>
            </div >
            `;

        // Calculate Cost Shared logic
        const getBaseTrait = (trait) => {
            let base = 2;
            const nationName = this.character.nation;
            const nation = this.data.nations.find(n => n.name === nationName);
            if (nation && nation.bonus_trait === trait) base = 3;
            return base;
        };

        const calculateTotalSpent = () => {
            let cost = 0;
            // Traits (re-calc here as source of truth)
            Object.keys(this.character.traits).forEach(t => {
                const added = this.character.traits[t] - getBaseTrait(t);
                cost += added * 8;
            });
            // Skills
            cost += this.character.v1_purchased_skills.length * 2;
            // Knacks
            Object.values(this.character.skills).forEach(val => {
                cost += val; // 1pt per rank logic (Simplified)
            });
            return cost;
        };

        const updateDisplay = () => {
            const spent = calculateTotalSpent();
            const remaining = 100 - spent;
            const el = document.getElementById('hp-remaining-step3');
            if (el) {
                el.textContent = remaining;
                el.style.color = remaining < 0 ? 'var(--accent-red)' : 'var(--text-ink)';
            }
            return remaining;
        };

        setTimeout(updateDisplay, 0);

        window.toggleSkillV1 = (skillId) => {
            const index = this.character.v1_purchased_skills.indexOf(skillId);
            if (index > -1) {
                // Remove
                this.character.v1_purchased_skills.splice(index, 1);
                // Also remove associated knacks
                const skill = this.data.skills.find(s => s.id === skillId);
                if (skill) {
                    skill.knacks.forEach(k => delete this.character.skills[k]);
                }
            } else {
                // Buy
                this.character.v1_purchased_skills.push(skillId);
            }
            // Re-render to show/hide knacks
            this.renderStep3V1(container);
        };

        window.adjustKnackV1 = (knack, delta) => {
            const current = this.character.skills[knack] || 0;
            const newVal = current + delta;

            if (newVal < 0) return;
            if (newVal > 5) return; // Cap

            if (delta > 0) {
                const remaining = 100 - calculateTotalSpent();
                if (remaining <= 0) return;
            }

            if (newVal === 0) {
                delete this.character.skills[knack];
            } else {
                this.character.skills[knack] = newVal;
            }

            // Update UI specific element
            const id = `val - knack - ${knack.replace(/\s+/g, '-')} `;
            const el = document.getElementById(id);
            if (el) el.textContent = newVal;

            updateDisplay();
        };
    }

    // STEP 4: V2 (Skills & Advantages) / V1 (Advantages)
    renderStep4(container) {
        if (this.edition === '1e') {
            this.renderStep4V1(container);
        } else {
            this.renderStep4V2(container);
        }
    }



    renderStep4V2(container) {
        container.innerHTML = `
            < div class="card" >
                <h3 class="card-title">Abilità & Vantaggi (2ª Ed)</h3>
                <p>Hai <strong>10 punti</strong> da distribuire.</p>
                <div class="text-center mb-20">
                    <span style="font-size: 1rem;">Punti Residui: <strong id="v2-points-step4" style="color: var(--accent-gold);">10</strong></span>
                </div>

                <div class="sheet-section">
                    <h4 class="sheet-section-title">Abilità (1 punto/grado)</h4>
                    <div class="skills-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto; padding-right: 5px;">
                        ${this.data.skills.map(skill => `
                            <div class="skill-row" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px dotted var(--border-color); background: rgba(255,255,255,0.3); border-radius: 5px;">
                                <span style="font-weight: 600; font-size: 1rem;">${skill.name}</span>
                                <div class="trait-controls">
                                    <button class="btn-circle btn-skill-dec" data-id="${skill.id}" style="width: 32px; height: 32px; font-size: 1.2rem;">-</button>
                                    <span class="trait-value" id="val-skill-${skill.id}" style="font-size: 1.2rem; min-width: 24px; text-align: center;">${this.character.skills[skill.id] || 0}</span>
                                    <button class="btn-circle btn-skill-inc" data-id="${skill.id}" style="width: 32px; height: 32px; font-size: 1.2rem;">+</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="sheet-section mt-20">
                    <h4 class="sheet-section-title">Vantaggi</h4>
                    <div class="adv-list" style="max-height: 250px; overflow-y: auto;">
                        ${this.data.advantages.map(adv => `
                            <div class="adv-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px; border-bottom: 1px dashed var(--border-worn);">
                                <div>
                                    <strong>${adv.name}</strong> (${adv.cost} pti)
                                    <div style="font-size: 0.8em; color: var(--text-faded);">${adv.description || ''}</div>
                                </div>
                                <button class="btn btn-sm ${this.character.advantages.includes(adv.name) ? 'btn-danger' : 'btn-secondary'} btn-adv-toggle"
                                        data-name="${adv.name.replace(/'/g, "\\'")}" data-cost="${adv.cost}"
                                        style="font-size: 0.8rem; padding: 4px 8px;">
                                    ${this.character.advantages.includes(adv.name) ? 'Rimuovi' : 'Prendi'}
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div >
            `;

        // V2 Point Logic
        const getBackgroundSkillBonus = (skillId) => {
            let bonus = 0;
            this.character.backgrounds.forEach(bgName => {
                const bg = this.data.backgrounds.find(b => b.name === bgName);
                if (bg && bg.skills.includes(skillId)) bonus++;
            });
            return bonus;
        };

        const calcSpent = () => {
            let spent = 0;
            // Skills
            Object.keys(this.character.skills).forEach(sId => {
                const current = this.character.skills[sId];
                const base = getBackgroundSkillBonus(sId);
                if (current > base) {
                    spent += (current - base);
                }
            });
            // Advantages
            this.character.advantages.forEach(advName => {
                const adv = this.data.advantages.find(a => a.name === advName);
                if (adv) {
                    let free = false;
                    this.character.backgrounds.forEach(bgName => {
                        const bg = this.data.backgrounds.find(b => b.name === bgName);
                        if (bg && bg.advantages.includes(advName)) free = true;
                    });
                    if (!free) spent += adv.cost;
                }
            });
            return spent;
        };

        const updateUI = () => {
            const spent = calcSpent();
            const remaining = 10 - spent;
            const el = document.getElementById('v2-points-step4');
            if (el) {
                el.textContent = remaining;
                el.style.color = remaining < 0 ? 'var(--accent-red)' : 'var(--accent-gold)';
            }
            return remaining;
        };

        // Initialize background bonuses
        this.data.skills.forEach(s => {
            const base = getBackgroundSkillBonus(s.id);
            if ((this.character.skills[s.id] || 0) < base) {
                this.character.skills[s.id] = base;
            }
        });

        setTimeout(updateUI, 0);

        // Event Delegation for Skills
        const adjustSkillV2 = (skillId, delta) => {
            const base = getBackgroundSkillBonus(skillId);
            const current = this.character.skills[skillId] || 0;
            const newVal = current + delta;

            if (newVal < base) return;
            if (newVal > 3) return;

            if (delta > 0) {
                const rem = 10 - calcSpent(); // Re-calc fresh
                if (rem <= 0) return;
            }

            this.character.skills[skillId] = newVal;
            document.getElementById(`val - skill - ${skillId} `).textContent = newVal;
            updateUI();
        };

        // Initialize background bonuses
        this.data.skills.forEach(s => {
            const base = getBackgroundSkillBonus(s.id);
            if ((this.character.skills[s.id] || 0) < base) {
                this.character.skills[s.id] = base;
            }
        });

        setTimeout(updateUI, 0);

        // Use a flag on the container to prevent duplicate listeners
        if (!container.dataset.step4ListenerAttached) {
            container.addEventListener('click', (e) => {
                if (e.target.closest('.btn-skill-inc')) {
                    const btn = e.target.closest('.btn-skill-inc');
                    adjustSkillV2(btn.dataset.id, 1);
                }
                if (e.target.closest('.btn-skill-dec')) {
                    const btn = e.target.closest('.btn-skill-dec');
                    adjustSkillV2(btn.dataset.id, -1);
                }

                if (e.target.closest('.btn-adv-toggle')) {
                    const btn = e.target.closest('.btn-adv-toggle');
                    const advName = btn.dataset.name;
                    const cost = parseInt(btn.dataset.cost);

                    const index = this.character.advantages.indexOf(advName);
                    if (index > -1) {
                        // Remove? Check if background
                        let free = false;
                        this.character.backgrounds.forEach(bgName => {
                            const bg = this.data.backgrounds.find(b => b.name === bgName);
                            if (bg && bg.advantages.includes(advName)) free = true;
                        });
                        if (free) {
                            alert('Questo vantaggio è fornito dal Background e non può essere rimosso.');
                            return;
                        }
                        this.character.advantages.splice(index, 1);
                    } else {
                        const rem = 10 - calcSpent();
                        if (rem < cost) {
                            alert('Punti insufficienti.');
                            return;
                        }
                        this.character.advantages.push(advName);
                    }

                    // Re-render UI only (keeping listener)
                    // We need to re-run the HTML generation part but NOT re-attach listener.
                    // The easiest way is to call renderStep4V2 again, which now has the guard clause.
                    this.renderStep4V2(container);
                }
            });
            container.dataset.step4ListenerAttached = 'true';
        }
    }

    renderStep4V1(container) {
        // V1 Advantages
        container.innerHTML = `
            < div class="card" >
                <h3 class="card-title">Vantaggi (1ª Ed)</h3>
                <p>Acquista Vantaggi usando i Punti Eroe residui.</p>
                <div class="text-center mb-20">
                    <span style="font-size: 0.9rem; color: var(--text-faded);">PE Residui: <strong id="hp-remaining-step4">--</strong></span>
                </div>

                <div class="adv-list" style="max-height: 400px; overflow-y: auto;">
                    ${this.data.advantages.map(adv => `
                        <div class="adv-item" style="display: flex; justify-content: space-between; align-items: center; padding: 5px; border-bottom: 1px dashed var(--border-worn);">
                            <div>
                                <strong>${adv.name}</strong> (${adv.cost} PE)
                                <div style="font-size: 0.8em; color: var(--text-faded);">${adv.description || ''}</div>
                            </div>
                            <button class="btn btn-sm ${this.character.advantages.includes(adv.name) ? 'btn-danger' : 'btn-secondary'}"
                                    onclick="window.toggleAdvV1('${adv.name.replace(/'/g, "\\'")}', ${adv.cost})"
                                    style="font-size: 0.8rem; padding: 4px 8px;">
                                ${this.character.advantages.includes(adv.name) ? 'Rimuovi' : 'Acquista'}
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div >
            `;

        // Need access to total HP calculation from Step 2/3
        // We really need a shared 'calculateHPSpent' method.
        // For now, I'll copy the logic logic or approximate.
        // Actually, since this is a class, I can add a method?
        // But renderStep4V1 is inside renderStep4.

        // REFACTOR: Centralize calc into class method `calculateV1Cost()`

        const updateDisplay = () => {
            const spent = this._calculateTotalSpentV1(); // Call helper
            const remaining = 100 - spent;
            const el = document.getElementById('hp-remaining-step4');
            if (el) {
                el.textContent = remaining;
                el.style.color = remaining < 0 ? 'var(--accent-red)' : 'var(--text-ink)';
            }
            return remaining;
        };

        setTimeout(updateDisplay, 0);

        window.toggleAdvV1 = (advName, cost) => {
            const index = this.character.advantages.indexOf(advName);
            if (index > -1) {
                this.character.advantages.splice(index, 1);
            } else {
                const rem = 100 - this._calculateTotalSpentV1();
                if (rem < cost) {
                    alert('Punti Eroe insufficienti.');
                    return;
                }
                this.character.advantages.push(advName);
            }
            this.renderStep4V1(container);
        };
    }

    // Helper for V1 Costs
    _calculateTotalSpentV1() {
        let cost = 0;
        // Traits
        const getBaseTrait = (trait) => {
            let base = 2;
            const nationName = this.character.nation;
            const nation = this.data.nations.find(n => n.name === nationName);
            if (nation && nation.bonus_trait === trait) base = 3;
            return base;
        };
        Object.keys(this.character.traits).forEach(t => {
            const added = this.character.traits[t] - getBaseTrait(t);
            cost += added * 8;
        });

        // Skills (V1)
        if (this.character.v1_purchased_skills) {
            cost += this.character.v1_purchased_skills.length * 2;
            Object.values(this.character.skills).forEach(val => {
                cost += val;
            });
        }

        // Advantages
        this.character.advantages.forEach(advName => {
            const adv = this.data.advantages.find(a => a.name === advName);
            if (adv) cost += adv.cost;
        });

        return cost;
    }

    validateStep() {
        if (this.step === 1) {
            if (!this.character.name || !this.character.nation) {
                alert('Inserisci Nome e Nazione');
                return false;
            }
        }
        if (this.step === 2) {
            if (this.edition === '2e') {
                // Check if 2 points are spent
                // We can roughly check based on traits sum vs base
                // Base sum = 10 (2*5) + 1 (Nation) = 11.
                // Target sum = 13.
                const currentSum = Object.values(this.character.traits).reduce((a, b) => a + b, 0);
                const nationBonus = 1; // Always 1 in our logic
                const baseSum = 10 + nationBonus;
                const spent = currentSum - baseSum;
                if (spent < 2) {
                    alert(`Hai ancora ${2 - spent} punti da assegnare ai Tratti.`);
                    return false;
                }
            }
            // V1: Just check if we didn't overspend 100 points? 
            // Logic in render handles it, but maybe verify here 
        }
        if (this.step === 3 && this.edition === '2e') {
            if (this.character.backgrounds.length !== 2) {
                alert('Seleziona esattamente 2 Background');
                return false;
            }
        }
        return true;
    }

    // STEP 5: V1 (Schools/Sorcery) / V2 (Stories/Arcana)
    renderStep5(container) {
        if (this.edition === '1e') {
            this.renderStep5V1(container);
        } else {
            this.renderStep5V2(container);
        }
    }

    renderStep5V2(container) {
        container.innerHTML = `
            < div class="card" >
                <h3 class="card-title">Storie & Arcani (2ª Ed)</h3>
                
                <div class="sheet-section">
                    <h4 class="sheet-section-title">Arcano</h4>
                    <p class="mb-20" style="font-size: 0.9em;">Seleziona la tua Virtù e il tuo Hubris (Opzionale).</p>
                    <div class="form-group">
                        <label class="form-label">Virtù</label>
                        <input type="text" class="form-input" id="char-virtue" value="${this.character.virtue || ''}" placeholder="Es. Coraggioso">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Hubris</label>
                        <input type="text" class="form-input" id="char-hubris" value="${this.character.hubris || ''}" placeholder="Es. Arrogante">
                    </div>
                </div>

                <div class="sheet-section mt-20">
                    <h4 class="sheet-section-title">Storia Personale</h4>
                    <div class="form-group">
                        <label class="form-label">Nome Storia</label>
                        <input type="text" class="form-input" id="story-name" placeholder="Es. Vendetta contro il Conte">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Obiettivo (Goal)</label>
                        <input type="text" class="form-input" id="story-goal" placeholder="Uccidere l'uomo a sei dita">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Ricompensa</label>
                        <input type="text" class="form-input" id="story-reward" placeholder="Es. +1 a Scherma">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Primo Passo</label>
                        <input type="text" class="form-input" id="story-step1" placeholder="Trovare dove si nasconde">
                    </div>
                </div>
            </div >
            `;

        // Bind inputs
        const virtueInput = container.querySelector('#char-virtue');
        const hubrisInput = container.querySelector('#char-hubris');

        virtueInput.addEventListener('input', (e) => this.character.virtue = e.target.value);
        hubrisInput.addEventListener('input', (e) => this.character.hubris = e.target.value);

        // Story logic: saving to temporary object or direct to array?
        // Character schema has `stories: []`.
        // We'll create/update the first story object.
        if (this.character.stories.length === 0) {
            this.character.stories.push({ name: '', goal: '', reward: '', steps: [''] });
        }
        const story = this.character.stories[0];

        const sName = container.querySelector('#story-name');
        const sGoal = container.querySelector('#story-goal');
        const sReward = container.querySelector('#story-reward');
        const sStep1 = container.querySelector('#story-step1');

        sName.value = story.name;
        sGoal.value = story.goal;
        sReward.value = story.reward;
        sStep1.value = story.steps[0] || '';

        sName.addEventListener('input', (e) => story.name = e.target.value);
        sGoal.addEventListener('input', (e) => story.goal = e.target.value);
        sReward.addEventListener('input', (e) => story.reward = e.target.value);
        sStep1.addEventListener('input', (e) => story.steps[0] = e.target.value);
    }

    renderStep5V1(container) {
        container.innerHTML = `
            < div class="card" >
                <h3 class="card-title">Scuole & Stregoneria (1ª Ed)</h3>
                <p>Costo elevato (20-30 PE). Solitamente uno solo.</p>
                <div class="text-center mb-20">
                    <span style="font-size: 0.9rem; color: var(--text-faded);">PE Residui: <strong id="hp-remaining-step5">--</strong></span>
                </div>

                <div class="sheet-section">
                    <h4 class="sheet-section-title">Scuole di Scherma</h4>
                    ${this.data.schools.length > 0 ?
                `
                        <select class="form-select" id="char-school">
                            <option value="">Nessuna Scuola</option>
                            ${this.data.schools.map(s => `<option value="${s.id}" ${this.character.school === s.id ? 'selected' : ''}>${s.name} (${s.cost} PE)</option>`).join('')}
                        </select>
                        <div id="school-desc" class="mt-20" style="font-style: italic; font-size: 0.8em; color: var(--text-faded);"></div>
                        `
                : '<p>Nessuna scuola disponibile.</p>'
            }
                </div>

                <div class="sheet-section mt-20">
                    <h4 class="sheet-section-title">Stregoneria</h4>
                    <p style="font-size: 0.8em;">Stregoneria specifica della nazione (${this.character.nation}). Implementazione parziale.</p>
                    <div class="form-group">
                        <label class="form-label">Livello Stregoneria (Costo 7 PE/livello)</label>
                        <div class="trait-controls" style="justify-content: center;">
                            <button class="btn-circle" onclick="window.adjustSorcery( -1)">-</button>
                            <span class="trait-value" id="val-sorcery">${this.character.sorceryLevel || 0}</span>
                            <button class="btn-circle" onclick="window.adjustSorcery( 1)">+</button>
                        </div>
                    </div>
                </div>
            </div >
            `;

        const schoolSelect = container.querySelector('#char-school');
        const schoolDesc = container.querySelector('#school-desc');

        const updateDisplay = () => {
            const cost = this._calculateTotalSpentV1();
            const remaining = 100 - cost;
            const el = document.getElementById('hp-remaining-step5');
            if (el) {
                el.textContent = remaining;
                el.style.color = remaining < 0 ? 'var(--accent-red)' : 'var(--text-ink)';
            }
            return remaining;
        };

        const updateSchoolDesc = () => {
            if (schoolSelect) {
                const s = this.data.schools.find(sch => sch.id === schoolSelect.value);
                if (s) schoolDesc.textContent = s.description || 'Nessuna descrizione.';
                else schoolDesc.textContent = '';
            }
        };

        setTimeout(() => {
            updateDisplay();
            updateSchoolDesc();
        }, 0);

        if (schoolSelect) {
            schoolSelect.addEventListener('change', (e) => {
                this.character.school = e.target.value;
                updateSchoolDesc();
                updateDisplay();
            });
        }

        window.adjustSorcery = (delta) => {
            const current = this.character.sorceryLevel || 0;
            const newVal = current + delta;
            if (newVal < 0) return;
            // Check cost? 7 pts/level usually (Full blooded 40pts = level 5ish?)
            // Simplified: 7 pts per rank.
            if (delta > 0) {
                const rem = 100 - this._calculateTotalSpentV1();
                if (rem < 7) return;
            }
            this.character.sorceryLevel = newVal;
            document.getElementById('val-sorcery').textContent = newVal;
            updateDisplay();
        };
    }

    // STEP 6: Review & Finalize (Actually step 6 in UI)
    renderStep6(container) {
        container.innerHTML = `
            < div class="card text-center" >
                <h3 class="card-title">Riepilogo</h3>
                <ul style="text-align: left; list-style: none; padding: 0; font-size: 0.9rem;">
                    <li><strong>${this.character.name}</strong>, ${this.character.nation}</li>
                    <li><strong>Concetto:</strong> ${this.character.concept || '-'}</li>
                    <li><strong>Tratti:</strong> ${Object.entries(this.character.traits).map(([k, v]) => `${this.translateTrait(k)} ${v}`).join(', ')}</li>
                    
                    ${this.edition === '2e' ?
                `<li><strong>Backgrounds:</strong> ${this.character.backgrounds.join(', ')}</li>` :
                `<li><strong>Total Spend:</strong> ${this._calculateTotalSpentV1()}/100 PE</li>`
            }
                    
                    ${this.character.advantages.length ? `<li><strong>Vantaggi:</strong> ${this.character.advantages.join(', ')}</li>` : ''}
                    
                    ${this.edition === '1e' && (this.character.school || this.character.sorceryLevel) ?
                `<li><strong>Speciali:</strong> ${this.character.school || ''} ${this.character.sorceryLevel ? `(Stregoneria ${this.character.sorceryLevel})` : ''}</li>` : ''
            }
                </ul>
                <p class="mt-20">Se sei soddisfatto, clicca Completa per salvare!</p>
            </div >
            `;
    }

    _calculateTotalSpentV1() {
        // ... (Already added in previous step replacer, assuming it exists or needs to be ensured)
        // If previous step didn't add it globally, need to add it here.
        // But since I'm overwriting the whole class bottom effectively, I should include it.
        // Wait, I am using 'EndLine: 1003' which implies Append or complete replacement of bottom?
        // My previous Replace added it.
        // I will duplicate logic to be safe if scope issue, but assuming same class instance.
        // Better: Reference the method added in renderStep4 if available. 
        // Oh, the previous 'Replace' targeted 'renderStep4' and added helper. 
        // So I can just rely on 'this._calculateTotalSpentV1'.

        // However, I need to update it to include School and Sorcery cost!

        let cost = 0;
        // Traits
        const getBaseTrait = (trait) => {
            let base = 2;
            const nationName = this.character.nation;
            const nation = this.data.nations.find(n => n.name === nationName);
            if (nation && nation.bonus_trait === trait) base = 3;
            return base;
        };
        Object.keys(this.character.traits).forEach(t => {
            const added = this.character.traits[t] - getBaseTrait(t);
            cost += added * 8;
        });

        // Skills (V1)
        if (this.character.v1_purchased_skills) {
            cost += this.character.v1_purchased_skills.length * 2;
            Object.values(this.character.skills).forEach(val => {
                cost += val;
            });
        }

        // Advantages
        this.character.advantages.forEach(advName => {
            const adv = this.data.advantages.find(a => a.name === advName);
            if (adv) cost += adv.cost;
        });

        // Schools
        if (this.character.school) {
            const s = this.data.schools.find(sch => sch.id === this.character.school);
            if (s) cost += s.cost;
        }

        // Sorcery
        if (this.character.sorceryLevel) {
            cost += this.character.sorceryLevel * 7;
        }

        return cost;
    }

    finishCreation() {
        if (this.edition === '2e') {
            // Process V2 Backgrounds bonuses (Apply them permanently?)
            // Usually in 2e you note where bonuses come from but on sheet they are just numbers.
            // But we applied logic in Step 4 to track "total". 
            // So character.skills already has the final values.
            // We just need to add Advantages from Backgrounds if not already in list.

            this.character.backgrounds.forEach(bgName => {
                const bgData = this.data.backgrounds.find(b => b.name === bgName);
                if (bgData) {
                    // Skills already handled by user adjustments (starting from base)
                    // Advantages: Ensure they are in the list
                    bgData.advantages.forEach(adv => {
                        if (!this.character.advantages.includes(adv)) {
                            this.character.advantages.push(adv);
                        }
                    });
                }
            });
        }

        // Generate ID
        if (!this.character.id) {
            this.character.id = Storage.generateId();
            this.character.createdAt = new Date().toISOString();
        }
        this.character.updatedAt = new Date().toISOString();

        const result = Storage.saveCharacter(this.character);

        if (result.success) {
            if (result.warning) {
                alert(result.warning);
            }
            this.app.router.navigate('characters');
        } else {
            alert('Errore durante il salvataggio: ' + (result.error || 'Sconosciuto'));
        }
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
