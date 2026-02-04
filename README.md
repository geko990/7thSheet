# 7th Sea - Character Sheet PWA ⚓

Web App Progressive (PWA) per la gestione delle schede personaggio di **7th Sea: Seconda Edizione**.
Progettata con un'interfaccia "mobile-first" e un tema grafico stile pergamena/mappa antica.

## Funzionalità

*   **Creazione Guidata Personaggio**: Wizard passo-passo per creare Eroi (Nazione, Tratti, Background, Abilità, Vantaggi).
*   **Scheda Digitale**: Visualizza tutti i dati del personaggio, monitora Punti Eroe e Ferite con un'interfaccia touch.
*   **Lancio Dadi**: Roller D10 integrato con calcolo automatico dei **Raise** (somme di 10+).
*   **Gestione Multipla**: Salva e gestisci più personaggi sullo stesso dispositivo.
*   **Offline First**: Funziona completamente offline una volta installata.
*   **Export/Import**: Backup dei dati in formato JSON.

## Installazione (PWA)

### iOS (iPhone/iPad)
1. Apri il sito in Safari.
2. Tocca il pulsante **Condividi** (quadrato con freccia in alto).
3. Scorri e seleziona **"Aggiungi alla schermata Home"**.

### Android
1. Apri il sito in Chrome.
2. Tocca il menu (tre puntini).
3. Seleziona **"Installa app"** o **"Aggiungi a schermata Home"**.

## Sviluppo Locale

Per testare l'app in locale è necessario un web server (a causa dei moduli ES6):

```bash
# Python 3
python3 -m http.server 8000

# Node.js
npx serve .
```

Apri `http://localhost:8000` nel browser.

## Struttura del Progetto

*   `index.html`: Entry point e layout base
*   `css/style.css`: Stili e tema grafico
*   `js/app.js`: Controller principale
*   `js/components/`: Componenti UI (Wizard, Scheda, Dadi)
*   `data/`: File JSON con regole di 7th Sea (Nazioni, Skill, ecc.)

## Licenza

Fan project non ufficiale per 7th Sea.
