# Benessere, check-in e sintomi: base di ricerca per l'app di pianificazione pasti

Data della ricerca: 6 ottobre 2026. Destinatari dell'app: adulti sani, 18 anni o più. Ogni dato porta un codice fonte [S1]... con la legenda e gli URL in fondo. Le pagine sono state aperte davvero (pagine web, PDF, abstract tramite Europe PMC); dove la fonte non è stata aperta o non dice quello che serve, c'è scritto "non trovato" o "non verificato". Le parti marcate PROPOSTA sono scelte di progetto mie, senza fonte diretta: vanno validate da un medico o da un dietista prima del rilascio. La numerazione delle fonti è propria di questo file e non coincide con quella di fabbisogni.md e porzioni.md.

Avvertenza sul metodo: le pagine NHS sono britanniche (numeri di emergenza 999 e 111, valori nutrizionali UK). Le ho usate perché sono le uniche fonti ufficiali aperte con elenchi chiari di segnali d'allarme; per l'Italia ho affiancato ISS, Ministero della Salute e LARN dove ho potuto aprirli. I numeri di emergenza italiani (112, 118) nell'app vanno verificati su fonte ministeriale: la pagina del Ministero non si è aperta (vedi "Non letti").

---

## 0. Sintesi per chi ha fretta

- Cadenza proposta: una domanda breve "come ti senti?" a settimana, una rivalutazione del piano ogni 2 settimane e solo su segnalazione o dopo almeno 2 settimane dall'ultima modifica, una revisione di fondo ogni 4 settimane. Peso: mai richiesto di default, mai ricordato con notifiche, opzionale non più di una volta al mese (la linea guida CREA indica circa una volta al mese [S1]). Dettagli e motivazioni nella sezione 1.6, tutta marcata PROPOSTA.
- Le evidenze sulla frequenza ottimale di auto-monitoraggio vengono da programmi di dimagrimento, non da programmi di "cambio dieta" per adulti sani. Per i check-in di benessere (non di peso) non ho trovato studi diretti.
- Un aggiustamento del piano è plausibile solo per sintomi lievi, recenti e senza segnali d'allarme. Con un segnale d'allarme l'app non propone nulla e rimanda al medico (sezione 3).
- Per chi ha storia di disturbi alimentari, calorie, peso e contatori sono il punto critico: le revisioni sistematiche trovano un'associazione fra uso di tracker e comportamenti alimentari disordinati, senza poter dire quale sia la causa [S16]. Nessun ente consultato dà una regola specifica per le app di pianificazione pasti; le regole di design della sezione 4 sono PROPOSTA ricavata da linee guida su comunicazione e prevenzione.
- Per chi ha già il piano di un professionista non ho trovato una fonte che dica "un'app non deve modificarlo". Ho trovato fonti collegate (ambito di competenza, rinvio al professionista, regole dell'Ordine dei biologi sulle diete personalizzate) che sostengono la regola, ma la regola è PROPOSTA.
- Rischio regolatorio da verificare con un legale: le linee guida dell'Ordine Nazionale dei Biologi (2019) dicono che l'attività nutrizionale personalizzata "non può essere svolta online" per il biologo nutrizionista [S29]. Non riguarda direttamente un'app, ma indica che un piano alimentare personalizzato generato a distanza è un tema sensibile in Italia.

---

## 1. Ogni quanto chiedere "come ti senti?"

### 1.1 Evidenze sull'auto-monitoraggio

- Revisione sistematica di Burke e colleghi (22 studi pubblicati tra il 1993 e il 2009): in tutti i 15 studi sul monitoraggio alimentare, chi si monitora più spesso o più regolarmente perde più peso; l'aderenza al monitoraggio cala nel tempo, e in uno studio solo il 25% continuava a registrare a fine intervento [S4]. Limite: campioni quasi tutti di donne bianche in programmi di dimagrimento.
- Revisione sistematica di Raber e colleghi (59 studi, 2021): sia un monitoraggio di intensità alta (registrare tutto) sia uno di intensità bassa (registrare solo alcuni comportamenti) risultano associati a perdita di peso. Gli autori scrivono che la variabilità delle misure di aderenza limita il confronto tra le due modalità [S6].
- Revisione di Lister e colleghi (2026) su 26 studi di programmi di gestione del peso che misuravano il rischio di disturbo alimentare: il contatto con i partecipanti era tipicamente graduato "da settimanale a mensile"; il monitoraggio alimentare era presente nell'80% dei bracci. Strategie psicologiche e legate al sonno erano poco usate o poco riportate [S9].
- Linea guida dell'Academy of Nutrition and Dietetics sulla gestione del peso negli adulti (2014): per il dimagrimento almeno 14 incontri di terapia nutrizionale in almeno 6 mesi; per il mantenimento almeno un incontro al mese per almeno un anno [S7]. È una dose pensata per persone in sovrappeso o obese seguite da un dietista, non per adulti sani.
- Meta-analisi di Mudaliar e colleghi (44 studi): i programmi con una fase di mantenimento dopo il ciclo principale ottengono una perdita di peso maggiore (1,66 kg in più) [S8].

Cosa non ho trovato: studi che confrontino check-in settimanali, quindicinali e mensili di benessere soggettivo (energia, digestione, sonno) in persone che cambiano dieta. Quindi la scelta fra le tre cadenze è PROPOSTA.

### 1.2 Tempi in cui un cambio alimentare mostra effetti

- Stitichezza e fibra: l'NHS scrive che i miglioramenti con più fibra e più acqua "possono manifestarsi entro pochi giorni o richiedere alcune settimane"; i lassativi agiscono di solito entro 3 giorni [S18].
- Diarrea: si risolve di solito in 5-7 giorni; oltre i 7 giorni l'NHS dice di chiamare il servizio sanitario [S22].
- Anemia da carenza di ferro in trattamento medico: compresse per circa 6 mesi con esami del sangue ripetuti nei mesi successivi [S27]. L'NHS non dice dopo quanto migliorano i sintomi; dati su tempi di risposta di emoglobina e ferritina li ho visti solo su siti commerciali non aperti, quindi non li uso.
- Carenza di B12 in trattamento: controllo del sangue dopo 7-10 giorni e poi a 8 settimane [S31]. Anche qui è una terapia medica, non un cambio di dieta.
- Formazione di un'abitudine: in uno studio di Lally e colleghi la media è stata di 66 giorni per arrivare all'automatismo, con un intervallo da 18 a 254 giorni; saltare un solo giorno ha avuto poco effetto [S10]. Dato su comportamenti semplici (non specifico per l'alimentazione) letto sulla sintesi del BPS Research Digest, non sull'articolo originale.
- Tempi di effetto di calo o aumento di carboidrati o energia sull'energia percepita: non trovato in una fonte aperta. Per l'adattamento alle diete molto ipocaloriche l'ISSN elenca freddo, stanchezza, mal di testa, capogiri, crampi e stitichezza come effetti avversi, e la perdita di capelli come lamentela più frequente dopo uso prolungato, senza dare tempi [S25]. Quel passaggio riguarda diete a bassissimo apporto energetico, che l'ISSN stesso dice di scarsa rilevanza per popolazioni sane e atletiche.

### 1.3 Rivalutazione del piano e del peso

- CREA, linea guida 1: "Non occorre pesarsi ogni giorno, ma è sufficiente farlo all'incirca una volta al mese, facendo attenzione alle eventuali variazioni" [S1].
- CREA, capitolo sull'acqua: le variazioni di peso a breve termine dovute a perdita o ritenzione di acqua sono "ingannevoli e momentanee" [S1]. Ottimo motivo per non basare il check-in sulla pesata giornaliera.
- CREA: se serve dimagrire, meglio puntare alla riduzione della massa grassa che "concentrarsi in maniera ossessiva sui chili indicati dalla bilancia" [S1].
- Errore delle stime energetiche: la revisione sistematica di Frankenfield e colleghi (2005) trova che l'equazione di Mifflin-St Jeor stima il metabolismo a riposo entro il 10% del valore misurato nella maggior parte dei soggetti non obesi e obesi, "ma con errori e limiti notevoli" sul singolo [S12]. Questo sostiene, come ragionamento, l'idea di aggiustamenti dell'ordine del 5-10% (vedi sezione 2), ma la cifra dell'aggiustamento non è in nessuna fonte aperta.
- Velocità di perdita di peso: l'ISSN cita, per persone magre, che una perdita settimanale dello 0,7% del peso corporeo ha conservato più massa magra di una dell'1,4% [S25]. Un tetto "0,5-1 kg a settimana" attribuito a NHS e OMS compare solo in risultati di ricerca che non sono riuscito ad aprire (la pagina NHS dà 404): non verificato.

### 1.4 Rischi dell'autopesata frequente

- Meta-analisi di Madigan e colleghi (24 trial, 2015): l'autopesata dà risultati (-3,4 kg) solo dentro programmi con più componenti; da sola non ha mostrato efficacia (-0,5 kg, su un solo studio). Nessuna differenza significativa fra pesata giornaliera e settimanale. Tra i trial, solo tre hanno misurato esiti psicologici avversi e non hanno trovato differenze fra gruppi nei sintomi depressivi, nella preoccupazione per il peso o nei sintomi di disturbo alimentare; la maggior parte dei trial non ha riportato eventi avversi [S3].
- Trial di Steinberg e colleghi (91 adulti in sovrappeso, 6 mesi): la pesata quotidiana non ha prodotto esiti psicologici avversi [S5]. Limite decisivo per noi: partecipanti in sovrappeso che cercavano di dimagrire, quindi popolazione diversa dalle persone con storia di disturbi alimentari.
- Revisione del 2008 sulle pesate regolari (12 studi, qualità eterogenea, solo uno di livello A): i partecipanti che si pesavano ogni giorno perdevano circa 1 unità di BMI in più di chi si pesava ogni settimana. Gli autori dichiarano di aver escluso dall'analisi gli esiti psicologici (depressione, ossessività, binge eating, immagine corporea) [S2].
- Il documento ISS e Ministero della Salute per i familiari cita il "controllo frequente del peso e della forma del corpo" tra i sintomi dei disturbi dell'alimentazione [S13]; l'NHS cita fra i segni psicologici lo "spendere molto tempo a preoccuparsi del peso e della forma del corpo" [S33].
- Per i rischi in chi ha storia di disturbo alimentare non ho trovato un trial sull'autopesata: i dati favorevoli (S3, S5) non si applicano a questa popolazione, e le fonti che raccomandano prudenza sono pareri di enti (sezione 4). Prudenza: PROPOSTA.

### 1.5 Fatica da notifiche

- Micro-trial randomizzato su 1255 utenti di un'app di benessere in 89 giorni (Bidargaddi e colleghi, 2018): un messaggio push personalizzato aumentava del 3,9% la probabilità di usare l'app nelle 24 ore successive (rischio relativo 1,039; IC 95% 1,01-1,08); l'effetto si attenuava nel corso dello studio, ma la riduzione non era statisticamente significativa. Effetto maggiore nel weekend, massimo alle 12:30 [S11].
- Revisione sistematica sulle notifiche push (Wohllebe, 2020, 17 studi): l'uso dell'app cresce con la frequenza dei messaggi, gli utenti più attivi tollerano frequenze più alte, una frequenza eccessiva viene percepita come fastidiosa; manca ricerca sul comportamento realmente osservato, rispetto a quello dichiarato [S14].
- Gli studi sull'aderenza al monitoraggio mostrano un calo nel tempo [S4].
- Cosa non ho trovato: una soglia di notifiche a settimana oltre la quale scatta la fatica, e studi di notifiche specifici per app alimentari su persone vulnerabili.

### 1.6 Cadenza proposta (PROPOSTA)

| Elemento | Cadenza | Motivazione |
|---|---|---|
| Check-in "come ti senti?" | 1 volta a settimana, 3-5 domande, risposta in meno di un minuto, giorno scelto dall'utente | Contatto da settimanale a mensile è la prassi nei programmi studiati [S9]; l'effetto delle notifiche cala e la frequenza eccessiva infastidisce [S11, S14]; per 2 domande al giorno non ho trovato giustificazioni |
| Nuovo piano o aggiustamento | non prima di 2 settimane dall'ultima modifica, salvo red flag | Le abitudini richiedono settimane o mesi per consolidarsi [S10]; la stitichezza risponde in giorni o settimane [S18]; cambiare troppo spesso confonde la causa |
| Revisione di fondo del piano | ogni 4 settimane, più un controllo dopo eventuali cambi di attività o di obiettivo | Compromesso fra le prassi di contatto mensile dei programmi [S7, S9] e i tempi di effetto; scelta di progetto |
| Peso | mai richiesto di default; se l'utente lo vuole, al massimo 1 volta al mese, senza promemoria e senza grafico in primo piano | CREA: circa una volta al mese [S1]; acqua e peso a breve termine ingannevoli [S1]; rischio nelle persone vulnerabili [S13, S16] |
| Notifiche | al massimo 1 a settimana per il check-in, disattivabili; nessuna notifica di "serie" o di mancato accesso | Fatica da notifiche [S11, S14]; evitare meccanismi di controllo [S16, S17] |
| Silenzio | se l'utente salta 2 check-in consecutivi, nessun sollecito colpevolizzante; un solo messaggio neutro dopo 4 settimane | Un giorno saltato pesa poco sull'abitudine [S10]; linguaggio neutro (sezione 4) |

Il check-in settimanale potrebbe anche essere meno frequente per chi non ha cambiato dieta di recente: scelta di progetto da testare con utenti reali.

---

## 2. Sintomi comuni: cause alimentari, aggiustamenti prudenti, attesa

Regole generali (PROPOSTA, salvo dove indicato):

- Prima di ogni aggiustamento l'app controlla i segnali d'allarme (sezione 3). Se ce n'è uno, nessun aggiustamento.
- Un solo cambiamento alla volta, per poter attribuire l'effetto.
- Aumento di energia: 5-10% delle kcal giornaliere. Non c'è una fonte aperta che dia questa cifra. Ragionamento: le equazioni di stima hanno un errore tipico fino al 10% sul singolo [S12], quindi un aggiustamento di quell'ordine rientra nell'incertezza della stima. Soglie più alte vanno decise da un dietista.
- Attesa minima prima di rivalutare: 1-2 settimane per sintomi digestivi, 2 settimane per energia e sonno (PROPOSTA); se il sintomo peggiora, non si aspetta.
- Mai suggerire integratori di ferro, B12, vitamina D o iodio come correzione di un sintomo: sono terapie che si decidono con un medico dopo esami (S27, S31, S35). Gli alimenti fonte sono ammessi.
- Valori di riferimento per adulti dai LARN V: acqua adeguata 2500 mL/die per gli uomini e 2000 mL/die per le donne, da bevande e cibi; fibra almeno 25 g/die; ferro PRI 10 mg/die per gli uomini e 18 mg/die per le donne fino alla menopausa (10 mg dopo); vitamina D PRI 15 µg/die; vitamina B12 AI 4,0 µg/die; iodio PRI 150 µg/die [S19]. Il CREA indica mediamente 1,5-2 litri di acqua al giorno (6-8 bicchieri) [S1].

### 2.1 Stanchezza costante

- Cause alimentari plausibili: energia insufficiente per l'attività svolta, carboidrati molto bassi, ferro basso (anemia sideropenica: stanchezza e mancanza di energia [S26]), B12 bassa (anemia: "extreme tiredness" [S30]), disidratazione [S45: sete, mal di testa, capogiri, urine scure, affaticamento]. L'NHS indica come cause comuni anche sonno insufficiente, stress, depressione e alcune malattie; elenca "dieta sana ed esercizio regolare" tra i consigli [S20]. La pagina NHS non cita esplicitamente i pasti saltati.
- Aggiustamento prudente (PROPOSTA): verificare prima che l'utente non stia sotto il fabbisogno stimato; se sì, +5-10% di energia, più carboidrati nei pasti principali e nel pasto prima dell'attività; fonti di ferro con alimenti ricchi di vitamina C e meno tè o caffè ai pasti (l'NHS indica di ridurre tè, caffè, latticini e cereali integrali, che ostacolano l'assorbimento, e di prendere succo d'arancia dopo la compressa [S27]; il ruolo della vitamina C negli alimenti non l'ho trovato in fonte aperta, ODS NIH inaccessibile).
- Attesa: 2 settimane per un cambio di piano.
- Rinvio al medico: stanchezza "da alcune settimane senza capirne il motivo", che influisce sulla vita quotidiana o con perdita di peso o cambi d'umore [S20, S56]. Il numero esatto di settimane non è dato dall'NHS; l'app potrebbe usare 2 settimane di persistenza dopo un aggiustamento e comunque un tetto di 4 settimane (PROPOSTA, in linea con "alcune settimane").

### 2.2 Fame continua

- Cause plausibili: energia troppo bassa, poche proteine o poca fibra nei pasti, pasti distanziati. Fonti: la fibra "facilita il raggiungimento del senso di sazietà" aumentando il volume del cibo e rallentando lo svuotamento gastrico [S1]; una meta-analisi di trial (49 studi sugli effetti acuti, 19 su quelli a lungo termine) trova che la proteina riduce la fame e aumenta la sazietà nel breve termine, mentre i dati a lungo termine sono inconcludenti [S44]. Il sonno scarso come causa di fame non l'ho verificato in una fonte aperta.
- Aggiustamento prudente (PROPOSTA): più proteine e fibra nei pasti (legumi, verdura, cereali integrali), ripartire meglio le calorie nella giornata, spuntino pianificato; se persiste con peso in calo, +5-10% di energia. CREA: gli spuntini sono previsti (frutta o verdura) [S1].
- Attesa: 1-2 settimane.
- Rinvio: fame con sete eccessiva, minzione frequente e calo di peso (vedi 2.15 e sezione 3). L'app non deve interpretare la fame come "debolezza di volontà".

### 2.3 Sazietà, pesantezza dopo i pasti

- Cause plausibili: porzioni grandi o pasti serali abbondanti, molta fibra introdotta di colpo, pasti ricchi di grassi. CREA: alcune persone sono sensibili alla fibra, con "pesantezza e gonfiore addominale, flatulenza", e per loro conviene scegliere frutta e verdura con meno fibra, senza rinunciarvi [S1]. Per i pasti serali abbondanti vedi 2.8.
- Aggiustamento prudente: porzioni più piccole e più frequenti [S24, per reflusso e gonfiore]; alleggerire la cena (PROPOSTA); ridurre temporaneamente le fibre grezze scegliendo le varietà meno ricche [S1].
- Attesa: 1-2 settimane.
- Rinvio: pesantezza con vomito, dolore addominale intenso, perdita di peso, difficoltà a deglutire [S23, S24].

### 2.4 Gonfiore

- Cause: gas intestinali legati ad alcuni alimenti (verdure, bevande gassate) o all'aria ingerita; stitichezza, intolleranze, celiachia, colon irritabile [S24].
- Aggiustamenti (fonte NHS [S24]): esercizio regolare, bere molta acqua, porzioni piccole e frequenti, evitare bevande gassate, alcol, caffè, cibi processati e piccanti. Fibra: introdurla gradualmente [S18]; CREA per i sensibili alla fibra [S1].
- Attesa: 1-2 settimane (PROPOSTA); per la stitichezza NHS dice giorni o poche settimane [S18].
- Rinvio: gonfiore regolare o che persiste nonostante i cambi alimentari; con perdita di peso involontaria o sangue nelle feci; urgente con vomito, diarrea, dolore addominale, febbre [S24]. Una dieta di esclusione "fai da te" (senza glutine, per esempio) non deve essere suggerita dall'app: il CREA invita a evitare autodiagnosi e autoprescrizioni, "oltre a quella di celiachia" [S1].

### 2.5 Stitichezza

- Cause: poca fibra, disidratazione, sedentarietà, stress [S18].
- Aggiustamenti [S18]: aumentare gradualmente la fibra (frutta come mele, albicocche, uva; cereali integrali; semi di lino), più acqua, evitare alcol, movimento. CREA: apporto di fibra almeno 25 g/die [S1]; con poca acqua, più fibra può peggiorare (nessuna fonte aperta diretta: PROPOSTA di aumentare acqua e fibra insieme).
- Attesa: da pochi giorni ad alcune settimane [S18].
- Rinvio: stitichezza che persiste nonostante il trattamento, ricorrente, con gonfiore, sangue nelle feci, perdita di peso involontaria, stanchezza persistente, cambi improvvisi nelle abitudini intestinali, dolore addominale [S18]. Nessun suggerimento di lassativi da parte dell'app: spettano al farmacista [S18].

### 2.6 Diarrea e reflusso

- Diarrea: dura di solito 5-7 giorni; liquidi a piccoli sorsi, mangiare quando possibile, evitare grassi e piccante [S22]. Cause alimentari: aumento molto rapido della fibra o di cibi ricchi di grassi, dolcificanti: la fonte aperta non le elenca, quindi restano ipotesi (PROPOSTA di ridurre temporaneamente la fibra). Rinvio: oltre 7 giorni, urine scure, impossibilità a trattenere liquidi, sangue [S22].
- Reflusso: porzioni più piccole e più frequenti, evitare caffè, pomodori, alcol, cioccolato, cibi grassi e piccanti, cena non vicina al sonno (sollevare la testata del letto) [S23]. Attesa: PROPOSTA 2 settimane. Rinvio: bruciore quotidiano, difficoltà a deglutire, perdita di peso inspiegata, vomito frequente, peggioramento [S23].

### 2.7 Mal di testa

- Cause alimentari: saltare i pasti, disidratazione; altre cause: stress, alcol, vista, postura, abuso di antidolorifici [S46].
- Aggiustamenti [S46]: bere acqua, non saltare i pasti, riposare. L'app non propone farmaci.
- Attesa: 1 settimana per un mal di testa lieve legato ai pasti o all'idratazione (PROPOSTA).
- Rinvio: mal di testa che non migliora con l'autotrattamento o è ricorrente (medico); problemi visivi, dolore che scatta con tosse o sforzo, vomito (contatto urgente); crisi convulsive, debolezza, dolore improvviso intenso, confusione, difficoltà a parlare, rigidità del collo, febbre alta (emergenza) [S46]. Per il mal di testa all'inizio di una dieta molto povera di carboidrati: non ho trovato una fonte aperta.

### 2.8 Difficoltà di sonno

- Cause alimentari e di stile di vita: caffeina, alcol, pasti abbondanti serali [S21].
- Aggiustamenti [S21]: niente tè, caffè o alcol nelle 6 ore prima di dormire, evitare pasti abbondanti la sera, orari regolari. Il legame tra restrizione calorica e insonnia non l'ho trovato in fonte aperta. Il documento ISS e Ministero indica "riposo notturno disturbato con vera e propria insonnia" tra i segnali di emergenza nei disturbi alimentari [S13].
- Attesa: l'NHS parla di "settimane" prima di rivolgersi al medico [S21]. PROPOSTA: 2 settimane.
- Rinvio: l'insonnia che non risolve con i cambi di abitudini entro settimane o dura mesi [S21]; insonnia con altri segnali di disturbo alimentare [S13].

### 2.9 Calo di concentrazione

- Cause alimentari plausibili: energia bassa, pasti saltati, disidratazione (la fonte NHS sulla disidratazione non cita la concentrazione; l'NHS cita i problemi di concentrazione fra i segni di disturbi alimentari [S33] e di ipotiroidismo [S28]). Il legame diretto con la dieta di un adulto sano non l'ho trovato in fonte aperta.
- Aggiustamenti (PROPOSTA): come per la stanchezza (2.1); regolarità dei pasti; idratazione.
- Attesa: 2 settimane.
- Rinvio: calo di concentrazione con stanchezza persistente, freddo, umore basso (ipotiroidismo [S28]) o con altri segni di disturbo alimentare [S33].

### 2.10 Crampi o calo di performance negli allenamenti

- Cause: crampi: sforzo muscolare, disidratazione, farmaci, malattie epatiche legate all'alcol [S32]. Performance: l'ISSN scrive che la restrizione di carboidrati può avere un potenziale ergolitico (peggiorativo della prestazione), soprattutto negli sport di resistenza, e che una dieta chetogenica a deficit energetico ha ridotto l'economia di corsa in camminatori d'élite [S25]. L'IOC (2023) descrive la sindrome REDs, cioè salute e prestazione compromesse da bassa disponibilità energetica, con un ruolo crescente della bassa disponibilità di carboidrati [S34].
- Aggiustamenti prudenti (PROPOSTA): più energia (+5-10%) e carboidrati attorno all'allenamento, più liquidi; ridurre il deficit se il piano era dimagrante. Per allenamenti intensi o atleti, l'Academy of Nutrition and Dietetics e l'ACSM indicano di indirizzare gli atleti a un dietista per un piano personalizzato [S35].
- Attesa: 2 settimane.
- Rinvio: crampi che durano oltre 10 minuti, disturbano il sonno, con intorpidimento o gonfiore delle gambe [S32]; svenimento durante l'esercizio [S36]; calo di performance con cicli mestruali irregolari o assenti, perdita di peso: segni compatibili con carenza energetica, da inviare a medico (la mancanza di ciclo è indicata come segno critico nei disturbi alimentari [S13]).

### 2.11 Vertigini e capogiri

- Cause: disidratazione, ipoglicemia, anemia sideropenica, stress, emicrania, farmaci; calo di pressione nei movimenti posturali [S47].
- Aggiustamenti prudenti (PROPOSTA): bere regolarmente, non saltare i pasti, spuntino con carboidrati, alzarsi lentamente. Non esiste una fonte aperta che dica quanta acqua in più.
- Attesa: massimo pochi giorni; se i capogiri si ripetono, rinvio.
- Rinvio: capogiri che non passano o ritornano di frequente; con difficoltà uditive o del linguaggio, acufeni, problemi visivi, intorpidimento o debolezza, alterazioni del battito, svenimenti, mal di testa [S47]. Svenimento: vedi sezione 3.

### 2.12 Freddo

- Cause: sensazione di freddo, stanchezza e capogiri sono segni fisici di disturbo alimentare [S33]; intolleranza al freddo fra gli effetti delle diete molto ipocaloriche [S25]; sintomo dell'ipotiroidismo [S28]. L'NHS (iodio) dice che con una dieta varia in genere si copre il fabbisogno di iodio (140 µg/die) e che l'eccesso altera la tiroide [S38]; un nesso fra poco iodio e sensazione di freddo non l'ho trovato in fonte aperta.
- Aggiustamenti prudenti (PROPOSTA): verificare che l'energia non sia troppo bassa; fonti alimentari di iodio previste dal piano (latticini, uova, pesce di mare, molluschi; per chi non usa prodotti animali, alimenti fortificati [S38]; LARN iodio 150 µg/die [S19]).
- Attesa: 2 settimane.
- Rinvio: freddo persistente, soprattutto con stanchezza, aumento di peso, stitichezza, pelle secca o diradamento dei capelli, umore basso [S28]; freddo con forte restrizione alimentare [S33].

### 2.13 Umore basso

- Cause alimentari: non ho trovato una fonte aperta ufficiale che colleghi un tipo di dieta all'umore basso in adulti sani. L'ISS indica che depressione, tristezza, rabbia, isolamento, ossessioni e ansia possono accompagnare i disturbi alimentari e sono accentuati dalla malnutrizione [S13]; l'ipotiroidismo e la carenza di B12 hanno fra i sintomi umore depresso [S28, S30].
- Aggiustamenti: l'app non propone cambi di dieta per l'umore basso, salvo verificare la regolarità dei pasti (PROPOSTA).
- Rinvio: umore basso che dura, interferisce con la vita quotidiana o è accompagnato da pensieri sul farsi del male: indirizzare a un professionista; pensieri suicidari e autolesionismo sono indicati come segnali di emergenza nei disturbi alimentari [S13]. L'NHS tra i motivi per rivolgersi al medico per la stanchezza include "cambiamenti dell'umore" [S20].

### 2.14 Perdita di capelli e unghie fragili

- Cause: l'NHS indica come cause temporanee di perdita di capelli malattia, stress, terapie oncologiche, calo di peso e carenza di ferro; 50-100 capelli al giorno sono normali [S37]. L'ISSN: perdita di capelli come lamentela più frequente nell'uso prolungato di diete molto ipocaloriche [S25]. Capelli fragili e unghie deboli sono fra i segni fisici dei disturbi alimentari [S13]; diradamento dei capelli nell'ipotiroidismo [S28].
- Unghie fragili: non trovato in fonte aperta un legame con singoli nutrienti.
- Aggiustamenti prudenti (PROPOSTA): verificare apporto di energia e proteine (LARN proteine: vedi fabbisogni.md), fonti di ferro (carne, legumi, frutta secca, cereali fortificati [S49]).
- Attesa: i capelli ricrescono con tempi lunghi; l'NHS dice che quando la causa è una condizione medica di solito si ferma o ricresce dopo la guarigione [S37]. Per l'app: nessuna rivalutazione prima di 4 settimane (PROPOSTA).
- Rinvio: l'NHS invita a rivolgersi al medico se si è preoccupati [S37]; perdita di capelli con calo di peso, stanchezza, freddo o umore basso: medico.

### 2.15 Sete

- Cause: disidratazione (sete, mal di testa, capogiri, urine scure e maleodoranti [S45]). L'NHS indica che le urine devono essere pallide [S45].
- Aggiustamenti [S1, S45]: bere regolarmente e in piccole quantità durante la giornata, mediamente 1,5-2 litri al giorno [S1]; bere durante e dopo l'attività fisica [S1]; evitare alcol e caffeina [S45]. Valore LARN: 2000 mL/die donne e 2500 mL/die uomini da bevande e cibo [S19]. Il CREA dice anche di non ridurre l'acqua per timore di ingrassare: l'acqua non apporta calorie [S1].
- Attesa: pochi giorni.
- Rinvio: sete "sempre" (feeling thirsty all the time) con urinare più del solito, stanchezza forte, perdita di peso involontaria: sintomi del diabete, contattare il servizio sanitario [S39]; l'ISS elenca sete, aumentata quantità di urine, stanchezza e perdita di peso per il diabete di tipo 1 [S40]. Disidratazione con urine molto scure o scarse, capogiri da seduti, respiro affannoso, battito alto: urgente [S45].

---

## 3. Segnali d'allarme: l'app non aggiusta, rimanda al medico

Regola (PROPOSTA): se l'utente segnala uno di questi elementi, l'app blocca ogni suggerimento di cambio di dieta, mostra un messaggio sobrio che invita a sentire un medico (o il 112 per i casi urgenti, da verificare), e non riprende gli aggiustamenti finché l'utente non conferma di aver parlato con il medico (o dopo un periodo da definire).

### 3.1 Emergenza (chiamare i soccorsi)

| Segnale | Fonte e cosa dice |
|---|---|
| Dolore o fastidio al petto improvviso che non passa, con irradiazione a braccia, collo, mascella, stomaco o schiena, sudorazione, nausea, capogiri, fiato corto | NHS: chiamare il 999 [S48] |
| Svenimento con: assenza di respiro, mancato risveglio entro 1 minuto, mancato recupero completo, difficoltà di linguaggio o movimento, dolore al petto o battito irregolare, ferite gravi, convulsioni, svenimento durante esercizio o da sdraiati | NHS: chiamare il 999 [S36] |
| Sangue rosso abbondante dal retto o sanguinamento continuo | NHS: 999 o pronto soccorso [S41] |
| Vomito con sangue o con aspetto di "fondi di caffè"; mal di testa o dolore addominale improvviso e grave; difficoltà respiratoria o confusione | NHS: emergenza [S22] |
| Mal di testa con convulsioni, debolezza, dolore improvviso e intenso, trauma cranico, difficoltà a parlare, confusione, perdita della vista, rigidità del collo con febbre | NHS: 999 o pronto soccorso [S46] |
| Disidratazione con pelle pallida o bluastra, difficoltà respiratoria, confusione, sonnolenza eccessiva | NHS: emergenza [S45] |
| Dolore toracico oppressivo con irradiazione, sudorazione fredda, nausea, svenimento: chiamare subito 112/118 | Versione italiana non verificata: la pagina del Ministero non si è aperta e il testo mi è arrivato solo da un risultato di ricerca (vedi "Non letti"); in app usare il testo NHS sopra, adattato ai numeri italiani dopo verifica |

### 3.2 Contatto urgente o rapido con il medico

| Segnale | Fonte e cosa dice |
|---|---|
| Feci nere o rosso scuro, diarrea con sangue | NHS: contattare subito il 111 [S41] |
| Gonfiore con vomito, diarrea o dolore addominale, febbre, difficoltà a urinare o defecare, acidità severa | NHS: richiedere un appuntamento urgente o chiamare 111 [S24] |
| Diarrea oltre 7 giorni; urine scure o poche; impossibilità a trattenere liquidi | NHS: chiamare 111 [S22] |
| Disturbi visivi, mal di testa scatenato da tosse, starnuti o sforzo, vomito, dolore alla mascella mentre si mastica, cuoio capelluto dolorante | NHS: contatto urgente [S46] |
| Capogiri persistenti da seduti, urine molto scure o minzioni rare, respiro affannoso, battito alto | NHS: 111 o medico [S45] |
| Sete continua, minzione frequente, grande stanchezza, perdita di peso senza volerlo | NHS: contattare 111 se compaiono questi sintomi [S39] |
| Segnali di emergenza nei disturbi alimentari: aritmie, dolori al torace, forti dolori addominali, perdite di coscienza, svenimenti, difficoltà respiratorie, stanchezza, gonfiori alle gambe, formicolii, pensieri suicidari, autolesionismo, insonnia | ISS e Ministero della Salute (2018, rivolti ai familiari) [S13] |

### 3.3 Da riferire al medico di base (non urgente)

| Segnale | Fonte e cosa dice |
|---|---|
| Perdita di peso involontaria | NHS (stitichezza): consultare il medico [S18]; HSE: perdita involontaria e continuativa di oltre il 5% del peso in 6-12 mesi "spesso causa di preoccupazione", anche con stanchezza, perdita di appetito, cambi dell'intestino, più infezioni [S42]; MSD Manuali (italiano): calo clinicamente rilevante se supera 4-5 kg o, nei soggetti più minuti, il 5% del peso in pochi mesi [S43] |
| Stanchezza persistente | NHS: se si è stanchi da alcune settimane senza sapere perché, o se la stanchezza influisce sulla vita quotidiana o si accompagna a perdita di peso o cambi d'umore [S20, S56]. Il numero di settimane preciso (4) l'ho letto solo in un riassunto di ricerca, non in una pagina aperta: non verificato |
| Sangue nelle feci, cambi improvvisi delle abitudini intestinali, dolore addominale | NHS: consultare il medico [S18, S44] |
| Stitichezza o gonfiore persistenti nonostante il piano | NHS [S18, S24] |
| Reflusso quotidiano, difficoltà a deglutire, perdita di peso inspiegata, vomito frequente | NHS [S23] |
| Sintomi da possibile carenza: formicolii, lingua dolente, afte, debolezza muscolare, problemi visivi, confusione, problemi di memoria | NHS sulla carenza di B12: consultare il medico, perché alcuni danni possono essere irreversibili se non trattati [S30] |
| Respiro corto, battito percepibile, pallore, mal di testa, acufeni | NHS sull'anemia sideropenica: consultare il medico [S26] |
| Crampi lunghi (oltre 10 minuti), che disturbano il sonno, o con intorpidimento o gonfiore | NHS [S32] |
| Cicli mestruali irregolari o assenti, forte restrizione, esercizio compulsivo, pensieri ossessivi su cibo e peso | Segnali di disturbo alimentare: ISS e Ministero [S13], NHS [S33] |
| Diradamento dei capelli, freddo, stipsi, aumento di peso, umore basso | NHS sull'ipotiroidismo [S28] |

Cosa non ho trovato: una fonte italiana ufficiale (Ministero, ISS) con un elenco unico di segnali d'allarme per sintomi alimentari comuni; le fonti italiane aperte coprono diabete (ISS [S40]), disturbi alimentari (Ministero e ISS [S13]), peso (MSD [S43], non ufficiale), infarto (non aperta).

---

## 4. Disturbi alimentari e uso ossessivo dell'app

### 4.1 Cosa dicono le fonti

- Revisione sistematica di Moody e colleghi (2025, 27 studi): gli studi trasversali trovano un'associazione abbastanza coerente fra uso di tracker di fitness e dieta e disturbo alimentare, in particolare restrizione, esercizio eccessivo e comportamenti legati alla muscolarità; l'associazione non è stata replicata negli studi sperimentali; "non è possibile concludere" se i tracker aumentino i comportamenti disordinati né in quale direzione vada la relazione [S16].
- Revisione sistematica di Wallace e colleghi (2026, 15 studi su adulti non clinici): il monitoraggio alimentare aiuta ad adottare abitudini sane nel breve termine ma può anche favorire abitudini disordinate; ci sono popolazioni in cui è associato a disturbi alimentari e a esiti negativi di salute mentale [S17].
- Studio di Simpson e Mazzeo (2017, 493 studenti): chi usa app che contano le calorie mostra più preoccupazione per il cibo e più restrizione dietetica, a parità di BMI; autori prudenti: "per alcuni individui questi strumenti potrebbero fare più male che bene" [S15].
- Segnali che l'ISS e il Ministero indicano nei disturbi alimentari: restrizione (dieta, eliminazione di cibi, pasti saltati, "calcolare le calorie degli alimenti", bevande dietetiche, passaggio a diete vegane o vegetariane), esercizio eccessivo, desiderio di magrezza e "controllo frequente del peso e della forma del corpo"; i campanelli d'allarme includono la drasticità e la repentinità del cambio di dieta; non si riconosce un disturbo dal solo peso [S13]. Il CREA elenca, per preadolescenti e adolescenti, la "denuncia frequente di disagio o malessere fisico al momento dei pasti", selettività esasperata, discorsi su alimenti "contaminati, non sani, cancerogeni", valutazione sproporzionata della fame [S1].
- NHS, segni di disturbo alimentare: abitudini molto rigide e routine sul cibo, mangiare pochissimo, mentire su quanto e quando si mangia, evitare occasioni sociali con cibo, esercizio eccessivo, sentire freddo, stanchezza, capogiri, preoccupazione per peso e forma; consultare il medico [S33].
- Beat (associazione britannica): sul programma di dimagrimento del servizio sanitario inglese ha segnalato "rischi di tutela più ampi" per persone con disturbi alimentari di un'app che promuove il conteggio delle calorie e riduzioni significative dell'apporto; ha accolto con favore la rimozione dell'accesso per chi ha BMI basso e l'avviso "solo per adulti", chiedendo una revisione più ampia [S51]. Beat sull'etichettatura delle calorie nei menu: "Calorie labelling exacerbates eating disorders of all kinds" e il numero di calorie non è un indicatore affidabile della salute [S50].
- NEDA (associazione statunitense): documento "Giving safe presentations on eating disorders" (adattato da Doley e colleghi, 2017) per presentazioni pubbliche, non per app. Indica come potenzialmente dannoso insegnare o promuovere il conteggio di calorie o nutrienti, citare numeri, pesi, BMI e quantità di peso perso; indica come utile spiegare che tutti i cibi si possono mangiare, evitare il linguaggio morale sul cibo ("buono", "cattivo", "spazzatura"), non puntare su taglia o aspetto, spiegare i danni delle diete lampo, offrire opzioni invece di ordini ("ecco cose che potresti provare") [S52]. Posizione di NEDA su app per adulti: nella sua dichiarazione su una app per ragazzi (Kurbo) NEDA segnala rischi di monitorare ogni boccone senza supervisione; l'ho letta solo in riassunti di ricerca, perché il sito NEDA risponde 403: non verificato.
- Beat sul linguaggio: evitare "Just eat normally" e "You look well" (letti come commento sul peso), non commentare l'aspetto, chiedere come ci si sente anziché parlare di cibo e peso [S53].
- ISS e Ministero (indicazioni per i familiari): non parlare solo di cibo a tavola; non far sentire in colpa; non è questione di volontà [S13].
- Academy of Nutrition and Dietetics: nella valutazione per un programma di gestione del peso fra i dati da raccogliere c'è l'adeguatezza del dimagrimento "in certe popolazioni (come disturbi alimentari, gravidanza...)" [S7].

### 4.2 Come impostare check-in e domande (PROPOSTA, ricavata dalle fonti sopra)

- Domande su sensazioni, non su numeri: "Come ti senti di energia questa settimana?", "Come hai digerito?", "Come hai dormito?", con scala semplice (bene, così così, non bene). Mai "Quanto pesi?" né "Quante calorie hai mangiato?".
- Nessun conteggio di calorie come obiettivo da raggiungere o superare, nessuna notifica "hai superato", nessun semaforo rosso o verde sui cibi, nessun punteggio, nessuna serie di giorni consecutivi (come nei tracker problematici [S16, S17]). Le calorie del piano possono esistere come informazione secondaria, non come obiettivo giornaliero; da decidere con un clinico.
- Peso: opzionale, non richiesto, mai in grafico principale, mai con obiettivi di perdita senza un criterio d'ingresso; vedi 1.6.
- Schermata d'ingresso con domande di esclusione (PROPOSTA): storia di disturbi alimentari, gravidanza o allattamento, patologie, farmaci, BMI basso (la Public Health England ha tolto l'accesso all'app di dimagrimento per chi ha BMI basso [S51]); per chi risponde sì, versione dell'app senza obiettivi di peso né calorie, e invito a parlare con il medico o il professionista che lo segue.
- Segnali nelle risposte che fermano l'app (PROPOSTA, dai segnali dell'ISS e del Ministero [S13] e dell'NHS [S33]): richieste di ridurre sotto il fabbisogno, richieste di cibo di "zero calorie", ripetuti sensi di colpa dopo i pasti, esercizio compulsivo, ciclo assente. Messaggio sobrio, senza etichette diagnostiche, che invita a parlarne con il medico; riferimenti di aiuto da definire (in Italia ho trovato solo il documento ISS e Ministero sui servizi; elenco di numeri verdi non verificato).
- Linguaggio (PROPOSTA): niente "dieta" come regime di rinuncia, niente "peccato", "sgarro", "premio", "colpa", "pulito", "detox", "cheat", niente complimenti sul corpo, niente "stai andando bene" riferito al peso; sì a "il piano", "come ti senti", "se ti va", opzioni al posto di ordini. Riferimenti: NEDA (evitare linguaggio morale sul cibo, offrire opzioni, non puntare sull'aspetto) [S52]; Beat (non commentare l'aspetto, chiedere come ci si sente) [S53]; ISS e Ministero (non ridurre tutto al cibo) [S13].
- Il CREA dà un riferimento istituzionale italiano per un'impostazione non ossessiva: non pesarsi ogni giorno, evitare diete drastiche "fai da te", puntare alla massa grassa invece che ai chili, non razionare l'acqua per timore di ingrassare [S1].

---

## 5. Chi ha il piano di una nutrizionista

### 5.1 Cosa ho trovato

- Fonte diretta che dica "un'app etica non deve modificare il piano redatto da un professionista": non trovata.
- Codice di condotta dei dietisti e nutrizionisti di Dietitians Australia (2022, emendato 2023): il professionista deve lavorare entro il proprio ambito di competenza, riconoscere quando una richiesta di consiglio esula dalla sua esperienza e indirizzare il cliente ad altri servizi adeguati; riconosce che più professionisti possono fornire servizi dietetici allo stesso cliente [S54]. È un codice per professionisti australiani, non per app; non dice nulla sul modificare il piano altrui.
- Linee guida dell'Ordine Nazionale dei Biologi (2019): il biologo nutrizionista può elaborare autonomamente diete per soggetti sani e, per i malati, solo previo accertamento medico; per rilasciare un programma personalizzato fa un'anamnesi preliminare; in presenza di patologie riferite dal paziente senza referti, la prassi corretta è chiedere la collaborazione del medico di medicina generale; "l'attività professionale in campo nutrizionale non può essere svolta online", con misure rilevate dal professionista e non dal cliente; dopo un rapporto consolidato la trasmissione della dieta e i chiarimenti possono avvenire con strumenti informatici; sono ammessi siti di informazione generale non legati al singolo caso [S29]. Una testata di settore riporta un provvedimento disciplinare dell'Ordine contro una nutrizionista che operava solo con schede online (fonte secondaria) [S55].
- Linea guida dell'Academy of Nutrition and Dietetics: la terapia nutrizionale per il dimagrimento è affidata a un dietista; per il dimagrimento la telenutrizione con componenti in presenza risulta più efficace di quella solo a distanza, e nella valutazione iniziale va considerata l'appropriatezza del dimagrimento in popolazioni come quelle con disturbi alimentari [S7]. Posizione congiunta con ACSM e Dietitians of Canada: gli atleti vanno indirizzati a un dietista per un piano personalizzato [S35].
- Tre fonti, tre ambiti diversi: nessuna parla di app che affiancano un piano esistente.

### 5.2 Comportamento proposto per l'app (PROPOSTA)

- Domanda iniziale: "Stai già seguendo un piano di un professionista?". Se sì, modalità "affiancamento": l'app non genera né modifica pasti, quantità o obiettivi, e può solo mostrare il piano caricato dall'utente, ricordare i pasti, raccogliere il check-in di benessere.
- Se l'utente riferisce sintomi, l'app li registra e propone di condividerli con la persona che ha redatto il piano, con un riepilogo (data, sintomo, durata), senza suggerire cambi: "Parlane con chi ha preparato il tuo piano".
- Nessuna correzione di quantità, nessuna sostituzione di alimenti rispetto al piano che non sia già prevista dal professionista, nessun "ottimizza il tuo piano".
- L'app non contraddice mai il professionista e non dà giudizi sul piano.
- Verifica legale e deontologica con un professionista del settore: non ho trovato regole italiane specifiche per app di questo tipo.

---

## 6. Cosa è completo e cosa no

Completo (con fonte aperta):
- Valori di riferimento LARN V per acqua, fibra, ferro, B12, vitamina D e iodio; indicazione CREA su pesata mensile, acqua, fibra, diete drastiche (S1, S19).
- Evidenze su autopesata e auto-monitoraggio nei programmi di dimagrimento, compresi limiti sugli esiti psicologici (S2-S9).
- Elenco di segnali d'allarme NHS e italiani (ISS e Ministero) per i sintomi trattati, con classificazione per urgenza (sezione 3).
- Segnali dei disturbi alimentari (ISS e Ministero, NHS, CREA) e rischi dei tracker (revisioni 2025-2026).

Parziale:
- Cadenza dei check-in: nessuno studio diretto; la cadenza è PROPOSTA basata su prassi di programmi e studi sulle notifiche.
- Tempi di effetto: solo per stitichezza, diarrea, abitudini, terapie di ferro e B12; per energia, carboidrati, sonno e mal di testa non trovati.
- Aggiustamenti per sintomo: ricavati da pagine NHS di autogestione, CREA e ISSN; la cifra del 5-10% di energia è PROPOSTA.
- NEDA e Beat: letti solo documenti su comunicazione e su programmi pubblici, non una linea guida specifica per app di pianificazione pasti.
- Ente italiano su app di dieta e disturbi alimentari: non trovato.

Non trovato:
- Fonte che dica che un'app non debba modificare il piano di un professionista.
- Soglie di notifiche oltre le quali scatta la fatica.
- Ruolo della vitamina C negli alimenti per l'assorbimento del ferro, fonte NIH ODS (403).
- Legame fra specifici nutrienti e unghie fragili, umore basso, concentrazione, mal di testa da dieta povera di carboidrati.
- Numeri di emergenza italiani su fonte ministeriale (112, 118): da verificare.
- Soglia di 4 settimane di stanchezza su pagina NHS aperta.

---

## Legenda delle fonti (URL aperti)

Le fonti sono elencate in ordine di codice approssimato; ogni codice è unico.

- S1: CREA, Linee guida per una sana alimentazione, 2018 (PDF letto in locale). https://www.crea.gov.it/documents/59764/0/LINEE-GUIDA+DEFINITIVO.pdf
- S2: Revisione "The Impact of Regular Self-weighing on Weight Management: A Systematic Literature Review", Int J Behav Nutr Phys Act 2008. https://pmc.ncbi.nlm.nih.gov/articles/PMC2588640/
- S3: Madigan C.D. e colleghi, "Is self-weighing an effective tool for weight loss: a systematic literature review and meta-analysis", Int J Behav Nutr Phys Act 2015 (testo integrale via Europe PMC). https://pmc.ncbi.nlm.nih.gov/articles/PMC4546162
- S4: Burke L.E. e colleghi, "Self-monitoring in weight loss: a systematic review of the literature", J Am Diet Assoc 2011. https://pmc.ncbi.nlm.nih.gov/articles/PMC3268700
- S5: Steinberg D.M. e colleghi, "Daily self-weighing and adverse psychological outcomes: a randomized controlled trial", Am J Prev Med 2014. https://pmc.ncbi.nlm.nih.gov/articles/PMC4157390
- S6: Raber M. e colleghi, "A systematic review of the use of dietary self-monitoring in behavioural weight loss interventions: delivery, intensity and effectiveness", Public Health Nutr 2021;24(17):5885-5913 (PDF letto). https://www.cambridge.org/core/services/aop-cambridge-core/content/view/476B83589088637C6740BA801B92185D/S136898002100358Xa.pdf/a-systematic-review-of-the-use-of-dietary-self-monitoring-in-behavioural-weight-loss-interventions-delivery-intensity-and-effectiveness.pdf
- S7: Academy of Nutrition and Dietetics, Adult Weight Management Guideline 2014, riepilogo raccomandazioni (PDF letto). https://www.andeal.org/vault/pq130.pdf
- S8: Mudaliar U. e colleghi, "Cardiometabolic Risk Factor Changes Observed in Diabetes Prevention Programs in US Settings", PLoS Med 2016. https://pmc.ncbi.nlm.nih.gov/articles/PMC4961455
- S9: Lister N.B. e colleghi, "Unpacking weight management interventions measuring eating disorder risk in adults", J Eat Disord 2026 (abstract via Europe PMC, PMID 42310783). https://doi.org/10.1186/s40337-026-01667-x
- S10: Lally P. e colleghi, "How are habits formed", Eur J Soc Psychol 2010, letto tramite BPS Research Digest (non l'articolo originale). https://bps.org.uk/research-digest/how-form-habit
- S11: Bidargaddi N. e colleghi, "To Prompt or Not to Prompt? A Microrandomized Trial...", JMIR mHealth uHealth 2018;6(11):e10123 (abstract via Europe PMC). https://mhealth.jmir.org/2018/11/e10123
- S12: Frankenfield D., Roth-Yousey L., Compher C., "Comparison of predictive equations for resting metabolic rate in healthy nonobese and obese adults: a systematic review", J Am Diet Assoc 2005 (abstract via Europe PMC, PMID 15883556). https://pubmed.ncbi.nlm.nih.gov/15883556/
- S13: Ministero della Salute (con ISS), "Disturbi della Nutrizione e dell'Alimentazione: Raccomandazioni per familiari", 26 marzo 2018 (PDF letto). https://piattaformadisturbialimentari.iss.it/documents/20121/42551/RACCOMANDAZIONI per FAMILIARI 26.03.2018-1.pdf/ff98cfdd-dba5-a713-0149-817f9a75965b
- S14: Wohllebe A., "Consumer Acceptance of App Push Notifications: Systematic Review on the Influence of Frequency", Int J Interact Mob Technol 2020;14(13). https://online-journals.org/index.php/i-jim/article/view/14563
- S15: Simpson C.C., Mazzeo S.E., "Calorie counting and fitness tracking technology: associations with eating disorder symptomatology", Eating Behaviors 2017 (abstract via Europe PMC, PMID 28214452). https://doi.org/10.1016/j.eatbeh.2017.02.002
- S16: Moody S. e colleghi, "Associations Between the Use of Fitness and Diet Tracking Technology and Disordered Eating Behaviour: A Systematic Review", Eur Eat Disord Rev 2025 (abstract via Europe PMC, PMID 40640999). https://doi.org/10.1002/erv.70006
- S17: Wallace T., Koebbel C., Heath J., "A systematic search and review focusing on the influence of health-tracking technologies on eating habits and attitudes", J Health Psychol 2026 (abstract via Europe PMC, PMID 40667816). https://doi.org/10.1177/13591053251351222
- S18: NHS, Constipation. https://www.nhs.uk/conditions/constipation/
- S50: Beat, risposta al piano governativo sulle calorie nei menu. https://www.beateatingdisorders.org.uk/news/beats-response-government-plan-calorie-count/
- S19: SINU, LARN V revisione, Tabelle riassuntive (acqua p. 786; vitamine p. 797-798; minerali p. 800-801; fibra), PDF letto come testo e immagine. http://sinu.it/wp-content/uploads/2025/07/Tabelle-riassuntive_online.pdf
- S51: Beat, notizia su miglioramenti all'app NHS. https://beateatingdisorders.org.uk/news/beat-campaigners-celebrate-improvement-in-nhs-app
- S20: NHS, Why am I tired all the time? https://www.nhs.uk/live-well/sleep-and-tiredness/why-am-i-tired-all-the-time/
- S52: NEDA, "Giving Safe Presentations on Eating Disorders" (PDF letto; adattamento di Doley et al., 2017). https://www.nationaleatingdisorders.org/wp-content/uploads/2024/09/GivingSafePresentationsupdate-2.pdf
- S21: NHS, Insomnia. https://www.nhs.uk/conditions/insomnia/
- S56: NHS 111 Wales, Tiredness and fatigue. https://111.wales.nhs.uk/Encyclopaedia/t/article/tirednessandfatigue
- S53: Beat, Tips for supporting somebody with an eating disorder. https://www.beateatingdisorders.org.uk/get-information-and-support/support-someone-else/tips-for-supporting-somebody-with-an-eating-disorder/
- S22: NHS, Diarrhoea and vomiting. https://www.nhs.uk/conditions/diarrhoea/
- S23: NHS, Heartburn and acid reflux. https://www.nhs.uk/conditions/heartburn-and-acid-reflux/
- S24: NHS, Bloating. https://www.nhs.uk/conditions/bloating/
- S25: Aragon A.A. e colleghi, "International society of sports nutrition position stand: diets and body composition", J Int Soc Sports Nutr 2017 (testo integrale via Europe PMC). https://pmc.ncbi.nlm.nih.gov/articles/PMC5470183/
- S46: NHS, Headaches. https://www.nhs.uk/conditions/headaches/
- S26: NHS, Iron deficiency anaemia. https://www.nhs.uk/conditions/iron-deficiency-anaemia/
- S47: NHS, Dizziness. https://www.nhs.uk/conditions/dizziness/
- S27: NHS, Iron deficiency anaemia: treatment. https://www.nhs.uk/conditions/iron-deficiency-anaemia/treatment/
- S54: Dietitians Australia, Code of Conduct for Dietitians and Nutritionists (PDF letto). https://dietitiansaustralia.org.au/sites/default/files/2023-03/Code-of-Conduct-for-dietitians-and-nutritionists.pdf
- S28: NHS, Underactive thyroid. https://www.nhs.uk/conditions/underactive-thyroid-hypothyroidism/
- S29: Ordine Nazionale dei Biologi, "Linee guida per la professione di Biologo Nutrizionista", delibera n. 433 del 26 settembre 2019 (PDF letto). https://www.fnob.it/wp-content/uploads/2019/12/LINEE-GUIDA-ONB.pdf
- S55: Il Fatto Alimentare, Diete online e posizione dell'Ordine dei biologi (fonte secondaria). https://ilfattoalimentare.it/diete-online-nutrizionista-onb.html
- S30: NHS, Vitamin B12 or folate deficiency anaemia. https://www.nhs.uk/conditions/vitamin-b12-or-folate-deficiency-anaemia/
- S31: NHS, Vitamin B12 or folate deficiency anaemia: treatment. https://www.nhs.uk/conditions/vitamin-b12-or-folate-deficiency-anaemia/treatment/
- S32: NHS, Leg cramps (cause). https://www.nhs.uk/conditions/leg-cramps/causes/
- S33: NHS, Eating disorders: overview. https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/behaviours/eating-disorders/overview/
- S34: Mountjoy M. e colleghi, "2023 IOC consensus statement on Relative Energy Deficiency in Sport (REDs)", Br J Sports Med 2023 (abstract via Europe PMC, PMID 37752011). https://pubmed.ncbi.nlm.nih.gov/37752011/
- S35: Thomas D.T. e colleghi, "Position of the Academy of Nutrition and Dietetics, Dietitians of Canada, and the American College of Sports Medicine: Nutrition and Athletic Performance", 2016 (abstract via Europe PMC, PMID 26917108). https://pubmed.ncbi.nlm.nih.gov/26917108/
- S36: NHS, Fainting. https://www.nhs.uk/conditions/fainting/
- S48: NHS, Chest pain. https://www.nhs.uk/conditions/chest-pain/
- S49: NHS, Iron (vitamins and minerals). https://www.nhs.uk/conditions/vitamins-and-minerals/iron/
- S37: NHS, Hair loss. https://www.nhs.uk/conditions/hair-loss/
- S38: NHS, Iodine. https://www.nhs.uk/conditions/vitamins-and-minerals/iodine/
- S39: NHS, Diabetes: symptoms. https://www.nhs.uk/conditions/diabetes/
- S40: EpiCentro ISS, Diabete. https://www.epicentro.iss.it/Igea/diabete/
- S41: NHS, Bowel cancer: symptoms. https://www.nhs.uk/conditions/bowel-cancer/symptoms/
- S42: HSE (Irlanda), Unintentional weight loss. https://www.hse.ie/conditions/unintentional-weight-loss/
- S43: MSD Manuali, Calo ponderale involontario. https://www.msdmanuals.com/it/casa/argomenti-speciali/sintomi-aspecifici/calo-ponderale-involontario
- S45: NHS, Dehydration. https://www.nhs.uk/conditions/dehydration/
- S44: Kohanmoo A. e colleghi, "Effect of short- and long-term protein consumption on appetite and appetite-regulating gastrointestinal hormones: a systematic review and meta-analysis of randomized controlled trials", Physiol Behav 2020 (abstract via Europe PMC, PMID 32768415). https://doi.org/10.1016/j.physbeh.2020.113123

## Non letti (pagine tentate senza esito)

- NIH Office of Dietary Supplements (ferro, B12, vitamina D, iodio): HTTP 403.
- EFSA, parere su acqua e fibra: reindirizzamento a Wiley, HTTP 403.
- NEDA, pagine su app e Kurbo: HTTP 403 (documento sulle presentazioni letto da PDF).
- Ministero della Salute, pagina sull'infarto: blocco Cloudflare.
- NHS, pagine sul peso corporeo e sul dimagrimento sano, e sul sangue nelle feci: 404.
- NICE NG69 sui disturbi alimentari: non aperto (nessuna lettura diretta).
- Cochrane: nessuna revisione Cochrane consultata per questi temi.
- Articolo originale di Lally e colleghi (2010): non aperto; usato un riassunto.
