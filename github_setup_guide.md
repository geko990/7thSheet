# Guida Configurazione GitHub & PWA

Ecco come creare la repository e caricare il progetto.

## 1. Crea la Repository su GitHub
1. Vai su [github.com/new](https://github.com/new) (assicurati di essere loggato).
2. **Repository name**: `7th-sea-sheet` (o il nome che preferisci).
3. **Public/Private**: Scegli "Public" (necessario per GitHub Pages gratuito).
4. **Non** inizializzare con README, .gitignore o License (li abbiamo già o li creeremo).
5. Clicca **Create repository**.

## 2. Collega il progetto locale
Dopo aver creato la repo, vedrai una pagina con delle istruzioni. Copia l'URL della repo (es. `https://github.com/tuonome/7th-sea-sheet.git`).

Poi, esegui questi comandi nel terminale (posso farlo io se mi dai l'URL):

```bash
# 1. Aggiungi tutti i file attuali
git add .

# 2. Fai il primo commit
git commit -m "Initial commit for 7th Sea Sheet PWA"

# 3. Rinomina il ramo principale in 'main' (standard moderno)
git branch -M main

# 4. Collega la repository remota (Sostituisci URL!)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# 5. Carica i file
git push -u origin main
```

## 3. Attiva GitHub Pages (per la PWA)
Una volta caricato il codice:
1. Vai su **Settings** della repository su GitHub.
2. Clicca su **Pages** nel menu a sinistra.
3. Sotto **Build and deployment** > **Source**, scegli `Deploy from a branch`.
4. Sotto **Branch**, seleziona `main` e cartella `/ (root)`.
5. Clicca **Save**.

Dopo qualche minuto, il tuo sito sarà online! (GitHub ti fornirà il link, es. `https://tuonome.github.io/7th-sea-sheet/`).

## "Darmi Accesso"
Poiché io lavoro direttamente nel tuo terminale locale, **ho già accesso** a tutto ciò a cui hai accesso tu!

- Se tu sei autenticato con Git sul tuo computer, io posso eseguire `git push` per te.
- Non devi aggiungermi come collaboratore su GitHub.

**Cosa fare ora?**
Dimmi semplicemente l'URL della repository che hai creato. Io eseguirò i comandi di collegamento e caricamento per te.
