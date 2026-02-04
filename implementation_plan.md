# 7th Sea 2nd Edition - Character Sheet PWA

App per la creazione, visualizzazione e gestione di schede personaggio per 7th Sea 2a Edizione, con tema pergamena/mappa antica.

## User Review Required

> [!IMPORTANT]
> Metti il PDF della scheda personaggio nella cartella `/Users/enrico/Documents/Antigravity/7th Sea sheetcart/` così posso analizzarlo per ricavare la struttura dei dati.

## Funzionalità Principali

### 1. Dual Edition Support (V1 & V2)
- **Selezione Edizione**: All'avvio della creazione personaggio, l'utente sceglie tra 1a e 2a Edizione.
- **Regole Differenziate**:
  - **V1**: Roll & Keep (Lancia X Tieni Y), Abilità + Knacks, Scuole di Scherma, Stregoneria specifica per nazione.
  - **V2**: Roll & Keep (tutto), Raise (Somme di 10), Background, Vantaggi, Storie.

### 2. Character Creation Wizard
Creazione guidata completa (V1 & V2):

#### Common Fields (All Editions)
- **Step 0: Edition Selection**: Scelta tra 1ª Edizione (Roll & Keep) e 2ª Edizione.
- **Step 1: Identity**:
  - Nome, Concetto, Religione.
  - **[NEW] Immagine Personaggio**: Upload o URL.
  - **Nazione**: Caricamento dinamico bonus in base all'edizione.

#### V2 Flow (2nd Edition)
- **Step 2: Traits**: Assegnazione punti a Brawn, Finesse, Resolve, Wits, Panache.
- **Step 3: Backgrounds**: Selezione 2 Background (Skill e Vantaggi automatici).
- **Step 4: Skills & Advantages**:
  - Spesa punti residui per Skill e Vantaggi.
  - **Arcana**: Selezione Virtue/Hubris (Opzionale).
  - **Stories**: Definizione prima storia (Goal, Reward, Step).
- **Step 5: Review**: Riepilogo e Salvataggio.

#### V1 Flow (1st Edition)
- **Step 2: Traits**: Brawn, Finesse, Wits, Resolve, Panache.
- **Step 3: Civil Skills & Knacks**:
  - Selezione Skill Civili e relativi Knack.
  - Spesa punti Hero/Building.
- **Step 4: Martial Skills & Schools**:
  - Selezione Skill Marziali.
  - Selezione Scuola di Scherma (se applicabile).
- **Step 5: Sorcery**:
  - Se la nazione lo permette, acquisto Stregoneria e gradi (es. Porte, Sorté).
- **Step 6: Advantages & Arcana**:
  - Acquisto vantaggi.
  - Selezione Arcana (Carte dei Tarocchi).

### 4. Character Sheet & Evolution
- **Visualizzazione**: Scheda completa adattiva (V1/V2).
- **[NEW] Edit Mode (Level Up)**:
  - Possibilità di modificare valori (Tratti, Skill) direttamente dalla scheda.
  - Aggiunta esperienza (XP) e tracciamento spesa.
  - Cambio immagine e dettagli.

### 3. Character Sheet View
Layout adattivo:
- **V1**: Mostra Knacks sotto le Abilità, HP (Ferite Classiche), Reputation, Panache/Drama.
- **V2**: Mostra Background, Spiral Wounds, Hero Points.

### 3. Gameplay Features
- **Dice Roller D10** con animazione 3D/2D
- **Raise Calculator** - inserisci risultati, calcola automaticamente i Raise (somme di 10+)
- **Hero Points Tracker** - incrementa/decrementa
- **Wounds Tracker** - spirale ferite interattiva

---

## Proposed Changes

### [NEW] Project Structure

```
7th Sea sheetcart/
├── index.html
├── manifest.json
├── service-worker.js
├── css/
│   └── style.css          # Parchment/nautical theme
├── js/
│   ├── app.js             # Main app controller
│   ├── config.js          # Version, constants
│   ├── router.js          # SPA navigation
│   ├── storage.js         # LocalStorage manager
│   ├── dice.js            # D10 roller logic
│   └── components/
│       ├── CharacterList.js   # Home - list saved characters
│       ├── CreateWizard.js    # Multi-step creation
│       ├── CharacterSheet.js  # Full sheet view
│       ├── DiceRoller.js      # D10 roller UI
│       └── Settings.js        # App settings
├── data/
│   ├── v1/                # 1st Edition Data
│   │   ├── nations.json
│   │   ├── skills.json    # Skills + Knacks
│   │   ├── advantages.json
│   │   └── schools.json   # Swordsman Schools
│   ├── v2/                # 2nd Edition Data
│   │   ├── nations.json
│   │   ├── backgrounds.json
│   │   ├── skills.json
│   │   └── advantages.json
└── assets/
    ├── icon-192.png
    ├── icon-512.png
    └── parchment-bg.jpg   # Background texture
```

---

## Design Theme: Pergamena & Mappa Antica

| Element | Style |
|---------|-------|
| **Background** | Texture pergamena ingiallita |
| **Font Headings** | Serif classico (Cinzel, Pirata One) |
| **Font Body** | Leggibile ma antico (EB Garamond) |
| **Colors** | Seppia, marrone scuro, oro antico, inchiostro nero |
| **Buttons** | Stile sigillo di cera, bordi consumati |
| **Cards** | Ombra sottile, bordi irregolari |
| **Icons** | Rosa dei venti, ancore, spade, teschi |

---

## Verification Plan

### Browser Testing
- Test creazione personaggio completo
- Verifica salvataggio/caricamento da localStorage
- Test dice roller con animazioni
- Verifica PWA installabile su iPhone

### Data Validation
- Controllo corrispondenza dati con manuale 7th Sea 2e
- Verifica calcoli automatici (punti spesi, raise)

## Deployment & Versioning Workflow

### Versioning
Adottiamo **Semantic Versioning** (MAJOR.MINOR.PATCH):
1. Aggiornare `APP_VERSION` in `js/config.js`.
2. Aggiornare `CACHE_NAME` in `service-worker.js` (es. `7thsea-vX.Y.Z`).

### GitHub Push
Per ogni aggiornamento stabile:
```bash
git add .
git commit -m "vX.Y.Z: Descrizione modifiche"
git push
```
Questo garantisce che la PWA su GitHub Pages sia sempre allineata e l'aggiornamento della cache forzi la nuova versione.
