# Germoglio

App web (installabile sul telefono come PWA) per pianificare i pasti della famiglia e generare la lista della spesa. Nata per tre persone con diete diverse che cucinano insieme.

## Come funziona

- **Un account a testa.** Ognuno accede con email e password o con Google e ha il proprio profilo: dieta (vegana, vegetariana, pescetariana, onnivora), intolleranze, ingredienti da evitare, pasti che mangia, porzione o grammi per componente e frequenze settimanali indicate dalla nutrizionista. Il profilo lo modifica solo il suo proprietario.
- **Nucleo familiare.** Da Impostazioni si crea un codice d'invito (vale 48 ore). Chi lo inserisce entra nel nucleo e il suo profilo viene copiato. Il nucleo condivide menù, ricette, lista della spesa, dispensa, preferiti e regole condivise. Chi non entra in un nucleo usa l'app da solo.
- **Vista famiglia e vista personale.** In Planner e Spesa un selettore passa da "Famiglia" (tutti) a "Solo io" (solo i miei pasti, le mie dosi e la mia spesa).
- **Assenze e ospiti.** Su ogni pasto si tocca un avatar per segnare chi non c'è; con "Ospite" si aggiunge una persona (dieta, porzione, intolleranze) solo per quel pasto. Dieta, dosi e spesa si adeguano.
- **Pasti equilibrati.** "Proponi" sceglie piatti adatti a tutti quelli presenti e completa il pasto se mancano carboidrati, proteine o verdure.
- **Regole condivise.** Ad esempio "pranzo in settimana: vegetariano, d'asporto, stesso piatto per 2 giorni". Chi ha una dieta più ampia si adegua nei pasti coperti dalla regola.
- **Dosi per persona.** Ogni ricetta è scritta per una porzione; l'app calcola le quantità di ciascuno e le somma.
- **Preferiti e storico.** La proposta evita i piatti fatti nelle ultime settimane e privilegia i preferiti.
- **Frequenze settimanali.** Ad esempio legumi almeno 3 volte: la proposta ne tiene conto e il Planner mostra l'avanzamento.
- **Avanzi.** "Riporta come avanzo" su un piatto, o la regola "stesso piatto per 2-3 giorni".
- **Intolleranze.** Senza glutine, lattosio, uova, frutta a guscio, soia, pesce: filtro e vincolo delle proposte.
- **Dispensa.** Ciò che hai già in casa viene tolto dalla lista della spesa.
- **Ricettario.** Circa 170 ricette precaricate più le tue, con foto del piatto.

## Avvio in locale

```bash
npm install
npm run dev
```

Controlli: `npm run check:recipes` (valida le ricette), `node scripts/selftest.mjs` e `node scripts/selftest-features.mjs` (logica di dosi, diete, obiettivi, dispensa, assenze, ospiti), `node scripts/render-test.mjs` (rendering delle schermate).

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

Le ricette stanno in `src/data/recipes/*.json` (schema in `src/data/recipes/SPEC.md`). Dopo ogni modifica esegui `npm run check:recipes`. Le ricette create nell'app restano nel nucleo e non toccano questi file.

## Struttura

- `src/lib`: logica (dosi, diete e regole, proposta dei pasti, obiettivi, spesa, dispensa, storico).
- `src/screens`: schermate. `src/hooks/data.jsx`: dati su Firestore.
- Dati su Firestore: `users/<uid>` (puntatore al nucleo), `households/<id>` (account con accesso) e, sotto di esso, `profiles/<uid>`, `settings/household` (regole), `settings/prefs`, `recipes`, `plans/<settimana>`, `shopping`, `shoppingExtras`, `pantry`; `invites/<codice>` per gli inviti.
- `_vecchia-versione/`: la versione precedente, tenuta solo come archivio.

## Limiti noti

- Le foto sono ridotte (800 px) e salvate nel documento della ricetta: niente Firebase Storage, quindi nessun piano a pagamento.
- Intolleranze e frequenze sono stimate da parole chiave negli ingredienti: possono sbagliare. Per le allergie controlla sempre l'etichetta.
- La dispensa non scala da sola quando cucini.
- Le ricette importate dal vecchio formato (Impostazioni > Importa da JSON) hanno dieta sconosciuta e valgono come onnivore finché non la imposti.
- Le regole di sicurezza del nucleo condiviso non sono state provate con l'emulatore Firebase: provale con due account.
- Entrando in un altro nucleo si perde la vista sui dati del vecchio (ricette e menù): esporta prima una copia da Impostazioni.
