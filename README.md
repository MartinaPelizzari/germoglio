# Germoglio

App web (installabile sul telefono come PWA) per pianificare i pasti della famiglia e generare la lista della spesa. Nata per tre persone con diete diverse che cucinano insieme.

## Come funziona

- **Un account a testa.** Ognuno accede con email e password o con Google e ha il proprio profilo, con foto: dieta (vegana, vegetariana, pescetariana, onnivora), intolleranze, ingredienti da evitare, pasti che mangia, piano alimentare e frequenze settimanali. Il profilo lo modifica solo il suo proprietario.
- **Persone senza app.** Chi non usa l'app si aggiunge da Famiglia ("Persona senza app"): lo modificano tutti. Se poi quella persona si installa l'app, entra nel nucleo e "reclama" il suo profilo: da quel momento lo modifica solo lei. Finché nessuno lo reclama resta libero.
- **Primo accesso.** La prima domanda è "Il tuo nucleo familiare usa già Germoglio?": con il codice d'invito si entra nel nucleo, si vedono le persone già aggiunte, si sceglie quale è il proprio profilo (e si controllano i dati) oppure se ne crea uno nuovo. Senza codice si parte da zero: nome, dieta e piano alimentare.
- **Nucleo familiare.** Da Impostazioni si crea un codice d'invito (vale 48 ore). Chi lo inserisce entra nel nucleo e il suo profilo viene copiato. Il nucleo condivide menù, ricette, lista della spesa, dispensa, preferiti e regole.
- **Piano della nutrizionista da PDF.** Nell'onboarding (o dal profilo) si carica il PDF del piano: viene letto sul telefono, senza inviarlo a nessuno, e si mostra pasto per pasto da controllare e correggere. Riconosce alternative ("oppure", "/"), gruppi ("ed in aggiunta"), note, limiti settimanali ("due volte a settimana", "fino a 3 volte a settimana") e cose da evitare. Non legge le scansioni (PDF fatti di immagini): in quel caso si incolla il testo. Per provare un PDF da terminale: `node scripts/read-plan-pdf.mjs piano.pdf`.
- **Piano della nutrizionista a mano.** Per ogni pasto si scrive il piano come è stato dato ("150 g yogurt oppure 30 g pane", una riga vuota separa ciò che si mangia insieme) o si incolla il piano intero. L'app lo legge, propone ricette che lo rispettano, mette le dosi indicate e, per ciò che nessuna ricetta copre, aggiunge l'alimento semplice. Il Planner segnala cosa manca. Se una persona non ha un piano, l'app propone pasti equilibrati (carboidrati, proteine, verdure).
- **Pasti condivisi e individuali.** Da Famiglia si sceglie l'impostazione di base: quali pasti sono condivisi da tutti (di default pranzo e cena) e quali individuali (ognuno ha il suo menu). Per un singolo giorno si cambia dal Planner, toccando "Condiviso con la famiglia · cambia" sopra il pasto. Nei pasti individuali ognuno vede solo il proprio menu (non quelli degli altri) e può aggiungere dei familiari al proprio pasto; i pasti condivisi li vedono tutti. Ogni persona sceglie da Impostazioni quali pasti vuole vedere (per esempio solo pranzo e cena): gli altri non compaiono nel suo Planner né nella sua spesa.
- **Menu separati per dieta.** A pranzo e a cena, se nessuna regola impone lo stesso piatto, chi segue una dieta diversa ha il suo menu (per esempio una vegetariana e due onnivore).
- **Regole condivise.** Ad esempio "pranzo in settimana: vegetariano, d'asporto, stesso piatto per 2 giorni". Chi ha una dieta più ampia si adegua nei pasti coperti dalla regola.
- **Vista famiglia e vista personale.** In Planner e Spesa un selettore passa da "Famiglia" a "Solo io".
- **Assenze e ospiti.** Su ogni pasto si segna chi non c'è e si aggiungono ospiti (dieta, porzione, intolleranze) solo per quel pasto.
- **Preferiti e storico, frequenze settimanali, avanzi, intolleranze, dispensa, lista della spesa** per settimana e giorni, raggruppata per reparto.
- **Ricettario.** Circa 220 ricette, in parte da pagine di cucina italiane (con la fonte citata e il procedimento riscritto), con foto del piatto. Tutte si possono modificare, copiare o eliminare, anche quelle precaricate (da Impostazioni si ripristinano). Non c'è più una classificazione in pranzo, cena, ecc.: le ricette si scelgono dal piano di ognuno; un indizio automatico evita solo, per esempio, un dolce a cena quando nessuno ha un piano. Filtri: adatte a (una ricetta con pesce va bene a pescetariani e onnivori), contiene (legumi, pesce, carne, uova, formaggi...), senza (glutine, lattosio...), tempo, asporto, preferite.

## Avvio in locale

```bash
npm install
npm run dev
```

Controlli: `npm run check:recipes` (valida le ricette), `node scripts/selftest.mjs` e `node scripts/selftest-features.mjs` (logica di dosi, diete, obiettivi, dispensa, assenze, ospiti), `node scripts/render-test.mjs` (rendering delle schermate). Per provare la vista mobile con dati finti e le aree sicure di iPhone simulate: `npx vite --config scripts/harness/vite.config.js` e apri l'indirizzo con una finestra stretta (390 px).

## Configurazione Firebase (una volta sola)

Il progetto usa il Firebase già creato (`planner-alimentare`, configurato in `src/firebase.js`). Le chiavi in quel file non sono segrete: i dati sono protetti dalle regole.

1. Console Firebase > Authentication > Metodo di accesso: attiva **Email/password** e **Google**; disattiva **Anonimo**.
2. Authentication > Impostazioni > Domini autorizzati: aggiungi `TUO-UTENTE.github.io`.
3. Firestore Database > Regole: incolla il contenuto di `firestore.rules` e pubblica. Con queste regole si accede solo ai dati del proprio nucleo e ognuno scrive solo il proprio profilo. I vecchi dati condivisi restano nel database ma non sono più raggiungibili dall'app.

## Pubblicazione su GitHub

1. Crea un repository e carica tutti i file di questa cartella (`node_modules` e `_vecchia-versione` sono già esclusi da `.gitignore`).
2. Impostazioni del repository > Pages > Source: **GitHub Actions**.
3. Ad ogni push su `main` il workflow `.github/workflows/deploy.yml` valida le ricette, compila e pubblica su `https://TUO-UTENTE.github.io/NOME-REPO/`.

Sul telefono: apri l'indirizzo in Safari (iPhone) o Chrome (Android) e scegli "Aggiungi a schermata Home".

## Aggiungere ricette al ricettario precaricato

Le ricette stanno in `src/data/recipes/*.json` (schema in `src/data/recipes/SPEC.md`). Dopo ogni modifica esegui `npm run check:recipes`; `node scripts/check-sources.mjs` controlla che le pagine citate come fonte esistano. Le ricette create nell'app restano nel nucleo e non toccano questi file.

## Struttura

- `src/lib`: logica (dosi, diete e regole, proposta dei pasti, obiettivi, spesa, dispensa, storico).
- `src/screens`: schermate. `src/hooks/data.jsx`: dati su Firestore.
- Dati su Firestore: `users/<uid>` (puntatore al nucleo), `households/<id>` (account con accesso) e, sotto di esso, `profiles/<id>`, `settings/household` (regole), `settings/prefs`, `recipes`, `plans/<settimana>`, `shopping`, `shoppingExtras`, `pantry`; `invites/<codice>` per gli inviti.
- `_vecchia-versione/`: la versione precedente, tenuta solo come archivio.

## Limiti noti

- Le foto sono ridotte (800 px) e salvate nel documento della ricetta: niente Firebase Storage, quindi nessun piano a pagamento.
- Intolleranze e frequenze sono stimate da parole chiave negli ingredienti: possono sbagliare. Per le allergie controlla sempre l'etichetta.
- La dispensa non scala da sola quando cucini.
- Il piano della nutrizionista si legge con regole semplici sul testo (quantità, unità, "oppure", righe vuote): se una riga non viene capita, l'anteprima "Ho capito" lo mostra subito. L'abbinamento alle ricette confronta i nomi degli alimenti e può sbagliare.
- Le ricette importate dal vecchio formato (Impostazioni > Importa da JSON) hanno dieta sconosciuta e valgono come onnivore finché non la imposti.
- Le regole di sicurezza del nucleo condiviso non sono state provate con l'emulatore Firebase: provale con due account.
- Entrando in un altro nucleo si perde la vista sui dati del vecchio (ricette e menù): esporta prima una copia da Impostazioni.
