# Germoglio

App web (installabile sul telefono come PWA) per pianificare i pasti della famiglia e generare la lista della spesa. Nata per tre persone con diete diverse che cucinano insieme.

## Come funziona

- **Un account a testa.** Ognuno accede con email e password o con Google e ha il proprio profilo, con foto: dieta (vegana, vegetariana, pescetariana, onnivora), intolleranze, ingredienti da evitare, pasti che mangia, piano alimentare e frequenze settimanali. Il profilo lo modifica solo il suo proprietario.
- **Persone senza app.** Chi non usa l'app si aggiunge da Famiglia ("Persona senza app"): lo modificano tutti. Se poi quella persona si installa l'app, entra nel nucleo e "reclama" il suo profilo: da quel momento lo modifica solo lei. Finché nessuno lo reclama resta libero.
- **Primo accesso.** La prima domanda è "Il tuo nucleo familiare usa già Germoglio?": con il codice d'invito si entra nel nucleo, si vedono le persone già aggiunte, si sceglie quale è il proprio profilo (e si controllano i dati) oppure se ne crea uno nuovo. Senza codice si parte da zero: nome, dieta e piano alimentare.
- **Nucleo familiare.** Da Impostazioni si crea un codice d'invito (vale 48 ore). Chi lo inserisce entra nel nucleo e il suo profilo viene copiato. Il nucleo condivide menù, ricette, lista della spesa, dispensa, preferiti e regole.
- **Quantità per pasto o per giornata.** Per ogni persona (Impostazioni) si sceglie se rispettare le quantità del piano pasto per pasto o nell'arco della giornata: nel secondo caso i gruppi del piano formano un budget unico e l'app propone "mischiotti" (per esempio un frutto a colazione al posto di quello dello spuntino) regolando gli altri pasti. Pane e pasta non si spostano negli spuntini; proteine e latticini restano nel loro pasto.
- **Settimana già pronta.** La prima volta che apri una settimana (oggi o futura) il menù si compila da solo; "Proponi la settimana" serve solo per rifarlo.
- **Piano della nutrizionista da PDF.** Nell'onboarding (o dal profilo) si carica il PDF del piano: viene letto sul telefono, senza inviarlo a nessuno, e si mostra pasto per pasto da controllare e correggere. Riconosce alternative ("oppure", "/"), gruppi ("ed in aggiunta"), note, limiti settimanali ("due volte a settimana", "fino a 3 volte a settimana") e cose da evitare. Legge sia il testo corrente sia le tabelle "alimento base | sostituto" (con pranzo e cena nella stessa sezione). Non legge le scansioni (PDF fatti di immagini): in quel caso si incolla il testo. Per provare un PDF da terminale: `node scripts/read-plan-pdf.mjs piano.pdf`.
- **Piano della nutrizionista a mano.** Per ogni pasto si scrive il piano come è stato dato ("150 g yogurt oppure 30 g pane", una riga vuota separa ciò che si mangia insieme) o si incolla il piano intero. L'app lo legge, propone ricette che lo rispettano, mette le dosi indicate e, per ciò che nessuna ricetta copre, aggiunge l'alimento semplice. Il Planner segnala cosa manca. Le proposte e il "cambia a caso" rispettano sempre il piano; se una ricetta già nel menu non lo rispetta, l'app spiega ingrediente per ingrediente il perché e con "Adatta al piano" crea una tua copia togliendo o sostituendo con un'alternativa del piano. Se una persona non ha un piano, l'app propone pasti equilibrati (carboidrati, proteine, verdure).
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

## Dieta equilibrata senza nutrizionista

- Nell'onboarding, dopo nome e dieta, si sceglie: piano della nutrizionista (PDF o testo), dieta equilibrata proposta dall'app, oppure più tardi.
- Per la dieta equilibrata l'app chiede sesso, età, altezza, peso, lavoro, allenamenti e obiettivo, poi calcola l'energia (`src/lib/needs.js`: metabolismo basale Schofield come nelle tabelle LARN V, livello di attività, allenamenti con i MET, deficit prudente o aumento graduale) e costruisce un piano pasto per pasto (`src/lib/autoPlan.js`) con porzioni e frequenze CREA 2018 interpolate. La quantità di pasta, riso, pane e altro cresce o cala per far tornare l'energia stimata con quella calcolata.
- Il piano generato si controlla e si modifica prima di salvare; la settimana si compila da sola alla prima apertura.
- Cautele: nessun piano automatico per minorenni, gravidanza e allattamento, patologie o terapie, indice di massa corporea sotto 18,5; con storia di disturbi alimentari si usa il mantenimento e non si mostrano calorie; niente diete dimagranti dai 75 anni; soglie minime di sicurezza.
- Ricerca e fonti: `docs/fabbisogni.md` e `docs/porzioni.md`; valori nutrizionali per 100 g in `src/data/nutrition/` (fonte voce per voce, copertura 98% degli ingredienti delle ricette: `node scripts/check-nutrition.mjs`).
- Limiti dichiarati: le stime vanno validate da un dietista prima di un uso più ampio; le mappature attività-PAL e le soglie di deficit sono scelte di progetto indicate come tali nel documento.
- Prova: `node scripts/selftest-needs.mjs`.

## Check-in e segnalazioni

- Chi sceglie "Creiamo insieme la dieta" risponde alle domande su corpo e abitudini; chi ha il piano della nutrizionista non ne riceve (il piano non viene mai modificato dall'app). La scelta si cambia da Profilo > Piano alimentare.
- Una domanda breve a settimana "Come ti senti?" (energia, digestione, sonno, fame) con risposte bene / così così / non bene, mai peso né calorie; si disattiva dal profilo e "Non ora" la rimanda di 7 giorni.
- Il pulsante con il cuore in alto apre "Ho una segnalazione da fare": sintomo, da quanto tempo, segnali d'allarme. Con un segnale d'allarme l'app consiglia di sentire un medico e non cambia nulla; altrimenti dà consigli e, solo per i piani creati dall'app, può ritoccarli (energia +5%, poi +10% al massimo; più legumi per il ferro), un cambio alla volta e non prima di 14 giorni dall'ultimo. Dopo 14 giorni chiede com'è andata.
- Base e fonti: `docs/benessere.md`; regole in `src/lib/wellbeing.js`; prova: `node scripts/selftest-wellbeing.mjs`. Le cadenze e le soglie di ritocco sono scelte di progetto da far validare a un dietista o a un medico.

## Settimane pianificate in anticipo

- Non c'è più "Proponi la settimana": l'app tiene sempre pianificate 3 settimane, la corrente e le due successive (`src/hooks/useAutoWeeks.js`, costante `HORIZON_WEEKS`). Quando ne passa una, ne aggiunge una in fondo, tenendo conto dei piatti già pianificati per non ripeterli.
- Le settimane proposte dall'app sono segnate `auto` e portano l'impronta (`sig`) di persone, diete, piani, pasti condivisi e regole con cui sono state fatte: una modifica a mano toglie il segno `auto` e la settimana non viene più toccata; se l'impronta cambia (per esempio dopo aver cambiato il piano di qualcuno), le settimane `auto` si rifanno da sole, una ogni pochi secondi. Ogni settimana si tenta una sola volta per sessione, così un errore di scrittura non provoca cicli.
- Un singolo pasto si può comunque rifare con "Proponi" sul pasto.
- Nei pasti individuali si vede solo chi li mangia; i pasti condivisi mostrano tutti. La lista della spesa è sempre per tutto il nucleo, anche per i pasti individuali di ognuno.

## Lista della spesa: righe accorpate

- Lo stesso ingrediente scritto in modi diversi finisce in una sola riga: maiuscole, singolare e plurale, parole che non cambiano cosa si compra ("fresco", "in polvere", "congelato", "parmigiano reggiano"/"parmigiano") e ordine delle parole (`canonicalName` in `src/lib/scale.js`).
- Le unità diverse si convertono quando ha senso: g e ml alla pari (1 ml = 1 g), un cucchiaio 12 e un cucchiaino 4, un pezzo il suo peso medio (100 g se non si conosce) quando c'è già una quantità in g o ml, "q.b." assorbito da una quantità vera. Ceci cotti e secchi, farine diverse, pelati e pomodori restano separati.
- Le conversioni sono approssimate (per esempio 1 ml = 1 g): vanno bene per la spesa, non per la dieta. Prova: `node scripts/selftest-shopping.mjs`.

## Prestazioni

- Le settimane si generano in un worker (`src/workers/weekGen.worker.js`), non sul thread principale: durante la preparazione delle settimane l'interfaccia non si blocca.
- I piani delle settimane e lo storico d'uso stanno in un contesto a parte (`usePlans`): ogni settimana scritta non rifà il rendering di tutta l'app.
- Schermate secondarie (Ricette, Spesa, Famiglia, Impostazioni, Profilo, Onboarding), valori nutrizionali e lettore PDF si caricano solo quando servono; il lettore PDF non è nella cache di installazione. Font solo latini; firebase in un file a parte.
- All'avvio: Firestore usa un solo gestore di schede e il rilevamento automatico del long polling (evita attese di diversi secondi su alcuni telefoni); il nucleo si ricorda sul telefono; le settimane si preparano solo dopo che i dati sono arrivati dal server e circa un secondo dopo la comparsa dell'app. Se l'app si rompe compare un messaggio con il motivo e il pulsante Ricarica (`ErrorBoundary`); un pezzo dell'app non scaricato dopo un aggiornamento fa ricaricare una volta da solo.

## Menu settimanali: regole di coerenza

- Colazione dolce di default: niente bruschette, hummus, crostini o popcorn; i piatti salati (uova col prosciutto, toast col tacchino...) compaiono solo se il piano di qualcuno prevede proteine o verdure a colazione.
- Un pasto principale ha una sola fonte di proteine e una sola di carboidrati, per ogni persona (`compatible` in `src/lib/planGen.js`).
- Se una regola condivisa impone un piatto unico (per esempio pranzo feriale d'asporto uguale per tutti) e nessuna ricetta rispetta alla lettera tutti i piani, si sceglie quella che li copre di più (segnalata "fuori piano" dove serve) invece di dare a ognuno alimenti diversi; gli alimenti semplici dei piani sono gli stessi per tutti quando possibile.
- Le frequenze settimanali di ogni persona pesano sempre di più man mano che restano meno pasti (nelle prove sono rispettate nel 100% delle settimane); un massimo già raggiunto scoraggia il cibo in più.
- Nei piani, "legumi cotti", "carne rossa", "pesce fresco" ecc. valgono per tutte le ricette di quel tipo (ceci, lenticchie, manzo...).
- Prova: `node scripts/selftest-menus.mjs` (famiglia con regola d'asporto, piani diversi, intolleranza, frequenze).
