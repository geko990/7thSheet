import { Storage } from '../storage.js';

export default class CharacterSheet {
    constructor(app) {
        this.app = app;
        this.character = null;
    }

    async renderCharacter(id) {
        this.character = Storage.getCharacter(id);

        const div = document.createElement('div');

        if (!this.character) {
            div.innerHTML = `
                <div class="empty-state">
                    <p>Personaggio non trovato.</p>
                    <button class="btn btn-primary" id="btn-back">Torna alla Lista</button>
                </div>
            `;
            setTimeout(() => {
                div.querySelector('#btn-back').addEventListener('click', () => {
                    this.app.router.navigate('characters');
                });
            }, 0);
            return div;
        }

        div.innerHTML = `
            <div class="card" style="position: relative; padding-top: 40px;">
                <button class="btn btn-secondary" id="btn-close" style="position: absolute; top: 10px; right: 10px; border: none;">✖</button>
                
                ${this.character.image ? `
                <div class="char-sheet-avatar" style="width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; border: 3px solid var(--accent-gold); overflow: hidden; box-shadow: 0 5px 15px var(--shadow-strong);">
                    <img src="${this.character.image}" alt="${this.character.name}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                ` : ''}
                
                <h2 class="page-title" style="margin-bottom: 5px;">${this.character.name}</h2>
                <p class="text-center" style="margin-bottom: 20px; font-style: italic;">${this.character.nation}</p>
                
                <div class="sheet-header-grid">
                    <div class="info-block">
                        <span class="info-label">Concetto</span>
                        <span class="info-val" style="font-size: 0.9rem;">${this.character.concept || '-'}</span>
                    </div>
                     <div class="info-block" style="text-align: center;">
                        <span class="info-label">Ricchezza</span>
                        <span class="info-val">0</span>
                    </div>
                </div>

                <!-- Traits -->
                <div class="sheet-section">
                    <div class="sheet-section-title">Tratti</div>
                    <div class="traits-grid">
                        ${this.renderTraitSpot('brawn')}
                        ${this.renderTraitSpot('finesse')}
                        ${this.renderTraitSpot('resolve')}
                        ${this.renderTraitSpot('wits')}
                        ${this.renderTraitSpot('panache')}
                    </div>
                </div>

                <!-- Hero Points & Wounds -->
                <div class="sheet-section">
                    <div class="sheet-header-grid">
                        <div class="info-block" style="text-align: center; border: 2px solid var(--accent-gold);">
                            <span class="info-label">Punti Eroe</span>
                            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 5px;">
                                <button class="btn-circle" id="hp-minus">-</button>
                                <span class="info-val" id="hp-val" style="font-size: 1.5rem;">1</span>
                                <button class="btn-circle" id="hp-plus">+</button>
                            </div>
                        </div>
                        <div class="info-block" style="text-align: center; border: 2px solid var(--accent-red);">
                            <span class="info-label">Ferite</span>
                            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 5px;">
                                <button class="btn-circle" id="w-minus">-</button>
                                <span class="info-val" id="w-val" style="font-size: 1.5rem;">0</span>
                                <button class="btn-circle" id="w-plus">+</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Skills -->
                <div class="sheet-section">
                    <div class="sheet-section-title">Abilità</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: x 20px;">
                        ${this.renderSkills()}
                    </div>
                </div>

                <!-- Backgrounds & Advantages -->
                <!-- Backgrounds & Advantages -->
                <div class="sheet-section">
                    <div class="sheet-section-title">
                        ${this.character.edition === '1e' ? 'Vantaggi & Scuole' : 'Background & Vantaggi'}
                    </div>
                    
                    ${this.character.edition === '2e' ?
                `<p><strong>Background:</strong> ${this.character.backgrounds.join(', ')}</p>` : ''
            }
                    
                    ${this.character.edition === '1e' && this.character.school ?
                `<p><strong>Scuola:</strong> ${this.character.school}</p>` : ''
            }
                    
                    ${this.character.edition === '1e' && this.character.sorceryLevel ?
                `<p><strong>Stregoneria:</strong> Livello ${this.character.sorceryLevel}</p>` : ''
            }

                    <div style="margin-top: 10px;">
                        <strong>Vantaggi:</strong>
                        <ul style="margin-top: 5px; padding-left: 20px;">
                            ${this.character.advantages.map(adv => `<li>${adv}</li>`).join('')}
                        </ul>
                    </div>
                    
                    ${this.character.edition === '2e' && this.character.stories ?
                `<div class="mt-20">
                           <strong>Storie:</strong>
                           ${this.character.stories.map(s => `<p>${s.name} (Goal: ${s.goal})</p>`).join('')}
                       </div>` : ''
            }
                </div>
                
                 <!-- Delete Character -->
                <div class="mt-20 text-center">
                    <button class="btn btn-danger" id="btn-delete" style="font-size: 0.8rem; padding: 8px 16px;">
                        🗑️ Elimina Personaggio
                    </button>
                </div>
            </div>
        `;

        this.attachListeners(div);
        return div;
    }

    renderTraitSpot(trait) {
        const val = this.character.traits[trait];
        const label = this.translateTrait(trait);
        return `
            <div class="trait-spot">
                <span class="val">${val}</span>
                <span class="lbl">${label}</span>
            </div>
        `;
    }

    renderSkills() {
        // Only show skills with value > 0 for now, or all? Let's show all > 0
        const skills = Object.entries(this.character.skills)
            .filter(([_, val]) => val > 0)
            .map(([id, val]) => `
                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #ccc;">
                    <span>${this.translateSkill(id)}</span>
                    <strong>${val}</strong>
                </div>
            `);

        return skills.length ? skills.join('') : '<p style="font-style: italic; color: #888;">Nessuna abilità appresa.</p>';
    }

    attachListeners(container) {
        container.querySelector('#btn-close').addEventListener('click', () => {
            this.app.router.navigate('characters');
        });

        // Hero Points Logic (Local state for now, ideally persisted)
        let hp = 1;
        const hpVal = container.querySelector('#hp-val');
        container.querySelector('#hp-minus').addEventListener('click', () => { if (hp > 0) hpVal.textContent = --hp; });
        container.querySelector('#hp-plus').addEventListener('click', () => { hpVal.textContent = ++hp; });

        // Wounds Logic
        let wounds = 0;
        const wVal = container.querySelector('#w-val');
        container.querySelector('#w-minus').addEventListener('click', () => { if (wounds > 0) wVal.textContent = --wounds; });
        container.querySelector('#w-plus').addEventListener('click', () => { wVal.textContent = ++wounds; });

        // Delete
        container.querySelector('#btn-delete').addEventListener('click', () => {
            if (confirm('Sei sicuro di voler eliminare questo personaggio?')) {
                Storage.deleteCharacter(this.character.id);
                this.app.router.navigate('characters');
            }
        });
    }

    translateTrait(trait) {
        const map = { 'brawn': 'Muscoli', 'finesse': 'Finezza', 'resolve': 'Risoluz.', 'wits': 'Acume', 'panache': 'Panache' };
        return map[trait] || trait;
    }

    translateSkill(skillId) {
        // Should use skills.json map but for speed doing basic mapping or titlecase
        // If skillId is "aim", return "Mira" etc.
        // For MVP, if we don't have the full map loaded here easily, return capitalized
        return skillId.charAt(0).toUpperCase() + skillId.slice(1);
    }
}
