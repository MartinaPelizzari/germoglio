# Fabbisogni di un adulto sano: base di ricerca per l'app di pianificazione pasti

Data della ricerca: 6 ottobre 2026. Ogni numero porta un codice fonte [S1]... con la legenda in fondo. Le fonti sono state aperte davvero (pagine o PDF letti, tabelle controllate anche come immagine). Quando un dato non è stato trovato c'è scritto "non trovato". Le parti marcate PROPOSTA sono scelte di progetto mie, non dati di fonte: vanno validate da un dietista o da un medico prima del rilascio.

Avvertenza generale: i valori LARN sono riferimenti per popolazioni, non prescrizioni individuali. La stessa SINU precisa che i valori delle tabelle energetiche "sono esemplificativi e non hanno alcun significato normativo o prescrittivo" [S1, note alle tabelle dell'energia].

---

## 1. Metabolismo basale (BMR / MB)

### 1.1 Mifflin-St Jeor (1990), valida per 19-78 anni [S5, tabella 1]

- Donne: BMR = 10 × peso(kg) + 6,25 × altezza(cm) − 5 × età(anni) − 161 [S5]
- Uomini: BMR = 10 × peso(kg) + 6,25 × altezza(cm) − 5 × età(anni) + 5 [S5]

Usa altezza ed età, quindi si adatta meglio al singolo. Fuori dall'intervallo 19-78 anni l'equazione non è stata validata [S5].

### 1.2 Equazioni "Schofield/FAO-OMS" usate dai LARN

Attenzione: esistono due versioni dei coefficienti e nelle fonti italiane si trovano entrambe.

Versione A, LARN storici e IV revisione (FAO/WHO/UNU 1985) [S5, tabella 1; cfr. S4, tabella 5 per i 60+]:

| Età | Donne (kcal/die) | Uomini (kcal/die) |
|---|---|---|
| 18-29 | 14,7 × peso + 496 | 15,3 × peso + 679 |
| 30-59 | 8,7 × peso + 829 | 11,6 × peso + 879 |
| 60-74 | 9,2 × peso + 688 | 11,9 × peso + 700 |
| 75 e oltre | 9,8 × peso + 624 | 8,4 × peso + 819 |

Versione B, riportata dal dossier CREA come "Modificato da Schofield et al., 1985" [S4, tabella 3]:

| Età | Donne (kcal/die) | Uomini (kcal/die) |
|---|---|---|
| 18-29 | 14,82 × peso + 486,6 | 15,06 × peso + 692,2 |
| 30-59 | 8,13 × peso + 845,6 | 11,47 × peso + 873,1 |
| 60 e oltre | 9,08 × peso + 658,8 | 11,71 × peso + 587,7 |
| 10-17 | 13,38 × peso + 692,6 | 17,69 × peso + 658,2 |
| 3-9 | 20,32 × peso + 485,9 | 22,71 × peso + 504,3 |
| sotto i 3 | 58,31 × peso − 31,1 | 59,51 × peso − 30,4 |

Le fasce 3-9, 10-17 e sotto i 3 anni (uguali nella diapositiva SINU [S3]) servono solo per documentare; l'app non dovrebbe calcolare piani per minorenni (sezione 6).

Quale usare per la V revisione LARN (2024)? Una presentazione SINU indica "BMR eq. Schofield, invariato" rispetto alla IV revisione, senza coefficienti [S3]. Le tabelle riassuntive SINU V non nominano l'equazione [S1]. Ho quindi verificato io i valori tabellari con i coefficienti [calcolo mio su S1, S4]:

- uomo 18-29 anni, 68,9 kg: versione B = 1730; tabella S1 = 1730 (la versione A darebbe 1733, indistinguibile)
- uomo 30-59 anni, 68,9 kg: versione B = 1663; tabella S1 = 1660 (la versione A darebbe 1678, non coincide)
- uomo 60-80 anni, 68,9 kg: versione B = 1395; tabella S1 = 1400 (la versione A, 60-74, darebbe 1520, non coincide)
- donna 18-29 anni, 50,6 kg: versione B = 1237; tabella S1 = 1240
- donna 60-80 anni, 61,3 kg: versione B = 1216; tabella S1 = 1220

Conclusione operativa: i valori della V revisione sono riprodotti dalla versione B. Per l'app conviene la versione B (coincide con le tabelle LARN V), con Mifflin-St Jeor come alternativa. Il fatto che la versione B sia quella esatta usata da SINU è un'inferenza mia dai riscontri numerici, non una dichiarazione esplicita delle fonti. Nelle tabelle S1 le età per gli adulti sono 18-29, 30-59, 60-80 per l'energia e 18-64, 65 e oltre per i nutrienti [S1]; la V revisione sembra ridefinire adulto 18-64 e anziano 65+ (lo mostrano le tabelle dei nutrienti [S1]); per l'energia le tabelle usano però 60-80 anni.

Esempio di confronto, uomo di 30 anni, 1,75 m, 68,9 kg: versione B 1663 kcal; Mifflin 10×68,9 + 6,25×175 − 5×30 + 5 = 1638 kcal [calcolo mio].

Limite di accuratezza: a livello di gruppo lo scarto dai valori misurati è in molti casi sotto il 5%, ma per il singolo può essere molto maggiore [S4].

---

## 2. Livelli di attività fisica (PAL/LAF) e allenamenti

### 2.1 Valori LARN

Fabbisogno energetico = BMR × PAL (dispendio energetico totale) [S1, note; S5].

LARN V (2024), tabelle adulti: colonne PAL 1,2 / 1,4 / 1,6 / 1,8 / 2,0. Il PAL 1,2 compare solo per i 60-80 anni e "si osserva fino a 60 anni in condizioni particolari (allettati con forte riduzione della funzione motoria o stili di vita estremamente ipocinetici)" [S1]. Per gli adulti sotto i 60 le colonne partono da 1,4 [S1].

Stima del PAL negli adulti secondo la V revisione, per tipologia di giornata (PAL complessivo della giornata): nessuna occupazione 1,4; lavoro d'ufficio 1,6; lavoro in piedi 1,8; lavoro d'ufficio con attività fisica 2,0 [S3, diapositiva "Livello di attività fisica adulti", tabella di origine EFSA 2013, letta da fotografia a bassa risoluzione: valori da ricontrollare sul libro].

Etichette verbali: la V revisione usa per l'età evolutiva "sedentario o inattivo, poco attivo, attivo, molto attivo", con PAL 1,2-1,4-1,6-1,8 (1-9 anni) e 1,4-1,6-1,8-2,0 (10-17 anni) [S3]. Per gli adulti la corrispondenza ufficiale tra queste etichette e i PAL non è stata trovata in fonte aperta.

LARN IV (2014), adulti: LAF 1,45 / 1,60 / 1,75 / 2,10, "in un intervallo compreso fra un profilo sedentario ipocinetico e un profilo a marcato impegno motorio" [S6]. Le etichette "leggero, moderato, intenso" con questi valori: non trovate.

Altre classificazioni: FAO/WHO/UNU 2004: sedentario o poco attivo 1,40-1,69; attivo o moderatamente attivo 1,70-1,99; molto attivo 2,00-2,40. IOM 2005: sedentario 1,00-1,39; poco attivo 1,40-1,59; attivo 1,60-1,89; molto attivo 1,90-2,50. Quota di dispendio per attività fisica sul totale: 19%, 28%, 35%, 40% per i LAF 1,4, 1,6, 1,8, 2,0 [S5, tabella 2].

PROPOSTA di mappatura per l'app (da validare), coerente con i PAL LARN V:

| Etichetta app | PAL | Descrizione |
|---|---|---|
| Sedentario | 1,4 | poco movimento, nessun allenamento strutturato |
| Leggero | 1,6 | lavoro d'ufficio o simile, camminate regolari |
| Moderato | 1,8 | lavoro in piedi o attività regolare |
| Intenso | 2,0 | lavoro fisico o allenamenti frequenti e intensi |

Nell'onboarding il PAL 1,2 non va offerto (solo allettati o ipocinetici, caso da escludere dal piano automatico).

### 2.2 Come aggiungere gli allenamenti

MET: 1 MET equivale a 3,5 ml O2/kg/min, circa 1 kcal/kg/ora [S5; S19]. Il Compendium 2024 elenca i MET per codice [S7].

Formula: kcal di una seduta = MET × peso(kg) × durata(ore). Esempio: 70 kg, corsa a circa 8 km/h (MET 8,5) per 45 minuti = 8,5 × 70 × 0,75 = 446 kcal lorde [calcolo mio].

Regola per evitare un doppio conteggio (indicazione di metodo mia, non di fonte): se si usa un PAL che già comprende l'attività fisica abituale (per esempio 1,8 o 2,0 "lavoro d'ufficio con attività fisica" [S3]), non sommare gli allenamenti. Due strade coerenti:
1. PAL di base basso (1,4 o 1,6) più allenamenti a parte, sottraendo 1 MET dalla durata dell'allenamento (la spesa a riposo è già dentro BMR×PAL): kcal extra = (MET − 1) × peso × ore;
2. solo PAL con l'attività inclusa, senza allenamenti separati.

Valori MET dal Compendium 2024 [S7]:

| Attività | Codice | MET |
|---|---|---|
| Camminata 2,8-3,4 mph (circa 4,5-5,5 km/h), ritmo moderato | 17190 | 3,8 |
| Camminata 3,5-3,9 mph (circa 5,6-6,3 km/h), sostenuta | 17200 | 4,8 |
| Camminata 4,0-4,4 mph (6,4-7,0 km/h), molto sostenuta | 17220 | 5,5 |
| Corsa 5,0-5,2 mph (circa 8 km/h) | 12030 | 8,5 |
| Corsa 6-6,3 mph (circa 10 km/h) | 12050 | 9,3 |
| Corsa 7 mph (circa 11,3 km/h) | 12070 | 11,0 |
| Bicicletta, andatura facile | 01015 | 4,3 |
| Bicicletta, andatura moderata | 01016 | 7,0 |
| Bicicletta, andatura intensa | 01017 | 9,0 |
| Pesi, esercizi multipli, 8-15 ripetizioni | 02054 | 3,5 |
| Pesi, squat/stacchi, sforzo lento o esplosivo | 02052 | 5,0 |
| Circuito a corpo libero | 02032 | 6,0 |
| Nuoto stile libero lento, ricreativo | 18240 | 5,8 |
| Nuoto a stile libero, intensità vigorosa, ritmo medio | 18290 | 8,0 |
| Yoga hatha | 02150 | 2,3 |

Soglie di intensità (Pate 1995, in S5): leggera sotto 3 MET, moderata 3-6 MET, intensa oltre 6 MET [S5]. Linee guida sull'attività fisica per adulti 18-64 anni: almeno 150 minuti a settimana di attività moderata o 75 di attività vigorosa [S4].

Nota: i MET del Compendium sono medie di popolazione; la stima di kcal per seduta ha un errore ampio. L'app dovrebbe arrotondare (per esempio a 10 kcal) e non presentare i valori come precisi.

---

## 3. Aggiustamenti per obiettivo

### 3.1 Dimagrire

Dati di fonte:
- Linea guida dell'Academy of Nutrition and Dietetics (2014): obiettivo realistico "fino a due libbre a settimana" (circa 0,9 kg) oppure fino al 10% del peso iniziale; 3-5% se ci sono fattori di rischio cardiovascolare [S8].
- Strategie di riduzione calorica indicate: 1200-1500 kcal/die per le donne e 1500-1800 kcal/die per gli uomini (livelli di solito adattati al peso corporeo), oppure un deficit di circa 500 o 750 kcal/die [S8].
- Nello stesso documento: "ricerche limitate riportano riduzioni di adeguatezza nutrizionale" con una restrizione di almeno 500 kcal/die o un consumo sotto 1200 kcal/die [S8]. È questo l'unico appiglio di fonte per una soglia minima di 1200 kcal.
- NIDDK: obiettivo iniziale del 5-10% del peso entro 6 mesi; la pagina non indica soglie settimanali né calorie minime e rimanda al professionista sanitario [S18].
- ISSN (per sportivi in preparazione): velocità settimanale di 0,5-1,0% del peso corporeo; con 0,7% a settimana la massa magra si conserva meglio che con 1,4% [S11].
- Per le sole fonti LARN: nelle tabelle riassuntive non c'è una indicazione di deficit [S1]. Non trovato.

PROPOSTA di regole per l'app (da validare):
- deficit predefinito: 10-15% del fabbisogno (TDEE), massimo 500 kcal/die, mai 750 kcal/die in automatico;
- velocità attesa non oltre 0,5% del peso a settimana (circa 0,35-0,5 kg per un adulto di 70-90 kg), limite superiore assoluto 0,9 kg/settimana [da S8 e S11];
- soglia minima di sicurezza: apporto non inferiore a 1500 kcal per gli uomini e 1200 kcal per le donne (il punto di partenza è S8, ma S8 non lo dichiara come soglia assoluta) e comunque non inferiore al BMR calcolato; se il calcolo scende sotto, l'app mantiene la soglia e lo spiega;
- durata: proporre una pausa di mantenimento dopo 8-12 settimane (scelta di progetto, non trovata in fonte);
- non proporre diete con meno di 800 kcal/die o a digiuno: non trovata una fonte aperta che le tratti, ma sono interventi medici da escludere.

### 3.2 Mantenere

Apporto = BMR × PAL (+ eventuali allenamenti, sezione 2) [S1; S5]. Rivalutare ogni 4 settimane con il peso medio.

### 3.3 Aumentare di peso o massa

ISSN: non fissa una percentuale di surplus; indica surplus maggiori per i non allenati e più piccoli per i più avanzati, per limitare l'aumento di grasso; citati studi con +544 kcal/die [S11]. Un valore standard da fonte ufficiale: non trovato.

PROPOSTA: surplus del 5-10% del TDEE (circa 150-300 kcal/die), aumento atteso 0,25-0,5% del peso a settimana (stima mia, non di fonte), con proteine nell'intervallo della sezione 4. Per chi è sottopeso (BMI sotto 18,5) non si propone nessun piano automatico (sezione 6).

---

## 4. Macronutrienti: LARN V (2024), adulti

Valori su base giornaliera, come media per un ragionevole periodo [S1].

### 4.1 Carboidrati, zuccheri, fibra [S1]

- Carboidrati totali: RI 45-60% En. Il limite superiore può arrivare al 65% En in caso di elevato dispendio energetico da attività fisica intensa. Minimo desiderabile di carboidrati disponibili: 2 g/kg di peso al giorno per prevenire la chetosi.
- Zuccheri (totali, incluso latte, frutta e verdura): obiettivo di prevenzione SDT inferiore al 15% En; un apporto sopra il 25% En è da considerare potenzialmente legato a eventi avversi.
- Fibra: almeno 25 g/die negli adulti anche con meno di 2000 kcal/die; 12,6-16,7 g ogni 1000 kcal (3-4 g/MJ).

### 4.2 Lipidi [S1]

- Lipidi totali: RI 20-35% En. I valori alti dell'intervallo sono coerenti con diete in cui i carboidrati sono vicini al limite inferiore; negli altri casi si raccomanda di restare a 30% En o meno.
- Acidi grassi saturi (SFA): SDT inferiore al 10% En.
- PUFA totali: RI 5-10% En; n-6: 4-8% En; n-3: 0,5-2,0% En.
- EPA+DHA: AI 250 mg/die.
- Acidi grassi trans: il meno possibile.

### 4.3 Proteine [S1; S14; S15]

Adulti 18-64 anni (peso di riferimento 70 kg uomini e 60 kg donne): AR 0,71 g/kg (50 g/die uomini, 43 g/die donne); PRI 0,90 g/kg (63 g/die uomini, 54 g/die donne) [S1].

Over 65 (65-74 e 75 e oltre): nella tabella è indicato l'obiettivo nutrizionale di prevenzione SDT di 1,1 g/kg, pari a 77 g/die uomini e 66 g/die donne; AR e PRI non indicati per queste fasce [S1].

Intervallo in percentuale: le proteine dovrebbero fornire il 12-20% dell'energia totale (prima 12-18%) [S14; S15].

Sportivi: i LARN V dedicano un gruppo di lavoro all'attività fisica [S2], ma la tabella riassuntiva non contiene un valore proteico g/kg per gli sportivi e il testo completo è a pagamento [S2]. Valore LARN per sportivi: non trovato. Riferimento esterno: ISSN, 1,4-2,0 g/kg/die per chi si allena per costruire e mantenere massa muscolare; in ipocalorica e con allenamento di forza intervalli più alti (2,3-3,1 g per kg di massa magra), da non usare come valore automatico [S10; S11].

Gravidanza: aggiunta di proteine rispetto all'inizio della gestazione AR +0,5, +6, +19,9 g/die nei tre trimestri, PRI +1, +8, +25 g/die; allattamento primo semestre PRI +20 g/die e secondo +13 g/die [S1].

Per l'app: proteine tra 0,9 g/kg (minimo) e circa 1,6 g/kg per chi si allena con regolarità (PROPOSTA, estremo basso dell'intervallo ISSN rivisto in prudenza); per gli over 65 almeno 1,1 g/kg [S1]. Non superare il 20% En come regola di base [S14; S15].

---

## 5. Micronutrienti da tenere d'occhio in diete vegetariane e vegane

Valori LARN V (2024) per adulti, per sesso ed età [S1]. PRI = assunzione raccomandata per la popolazione; AI = assunzione adeguata. Per indicare se un valore è PRI o AI ho seguito la formattazione della tabella (grassetto = PRI, corsivo = AI) [S1].

| Nutriente | Uomini 18-64 | Uomini 65+ | Donne 18-64 | Donne 65+ | Tipo |
|---|---|---|---|---|---|
| Vitamina B12 | 4,0 µg | 4,0 µg | 4,0 µg | 4,0 µg | AI |
| Ferro | 10 mg | 10 mg | 18 mg (10 mg dopo la menopausa) | 10 mg | PRI |
| Calcio | 950 mg | 1100 mg | 950 mg in premenopausa, 1100 mg in postmenopausa | 1100 mg | PRI |
| Zinco | 12 mg | 12 mg | 9 mg | 9 mg | PRI |
| Iodio | 150 µg | 150 µg | 150 µg | 150 µg | AI |
| Vitamina D | 15 µg | 15 µg (20 µg dopo i 75 anni) | 15 µg | 15 µg (20 µg dopo i 75 anni) | PRI |
| Omega-3 (EPA+DHA) | 250 mg/die | 250 mg/die | 250 mg/die | 250 mg/die | AI (lipidi) |
| Omega-3 totali (PUFA n-3) | 0,5-2,0% En | idem | idem | idem | RI |

Gravidanza e allattamento (da non automatizzare, sezione 6): B12 4,5 e 5,0 µg; ferro 27 e 11 mg; calcio 1100 mg; zinco 11 e 12 mg; iodio 200 µg; vitamina D 15 µg; EPA+DHA 250 mg più 100 mg di DHA in gravidanza, più 100-200 mg di DHA in allattamento [S1].

Limiti massimi (UL) per la vitamina D: 100 µg/die per adulti [S1]. Per iodio, ferro, zinco e calcio gli UL nelle tabelle riassuntive non li ho riportati: non letti.

Cosa dice la letteratura per chi non mangia carne o prodotti animali (Academy of Nutrition and Dietetics, 2016) [S9]:
- B12: i vegani hanno bisogno di fonti affidabili (alimenti fortificati o integratori); anche molti vegetariani, perché una tazza di latte e un uovo al giorno forniscono circa due terzi dell'RDA statunitense; l'assorbimento intestinale si satura a circa metà dell'RDA, quindi gli alimenti fortificati vanno distribuiti in due momenti; sono citate dosi elevate di cianocobalamina (testo estratto: 500-1000, unità degradata nell'estrazione, di solito µg) più volte alla settimana [S9]. L'app non deve dare dosi: deve segnalare la necessità e rimandare a medico o dietista.
- Ferro: l'RDA statunitense per i vegetariani è stato fissato nel 2001 all'80% in più rispetto agli onnivori (biodisponibilità assunta 10% contro 18%), ma la sezione sostiene che l'organismo si adatta e che l'assorbimento del ferro non emico varia dall'1% al 23% in base allo stato del ferro e a potenziatori/inibitori come la vitamina C e i fitati [S9]. I LARN V non indicano un fattore correttivo per vegetariani nelle tabelle riassuntive [S1]: non trovato.
- Zinco: nessun dato numerico di fabbisogno aggiuntivo; negli adulti occidentali vegetariani non si osserva carenza franca, per i gruppi a rischio (anziani, bambini, gravide e nutrici) non ci sono prove sufficienti [S9]. Fattore correttivo numerico: non trovato.
- Calcio: i latto-ovo-vegetariani di solito raggiungono le raccomandazioni; i vegani variano molto. L'assorbimento dipende dall'ossalato e dalle fibre (spinaci e bietole ricchi di ossalati, cavoli, rape e tofu cotto con sali di calcio, latti vegetali fortificati meglio assorbiti) [S9].
- Iodio: le diete vegetali possono essere povere; i vegani che non usano sale iodato o alghe possono avere carenze; UL statunitense 1100 µg negli adulti; le donne vegane in età fertile devono assumere 150 µg/die con integratore [S9]. Il sale marino, il sale kosher e i condimenti salati come il tamari in genere non sono iodati [S9].
- Omega-3: EPA e DHA nel sangue sono più bassi in vegani e vegetariani, con rilevanza clinica sconosciuta; l'ALA si converte in modo poco efficiente; DRI statunitense per l'ALA 1,6 g/die uomini e 1,1 g/die donne, con prudenza verso apporti più alti nei vegetariani; rapporto linoleico/ALA suggerito non oltre 4:1; fonti: lino, chia, canapa, noci, olio di colza; microalghe per il DHA se servono apporti maggiori [S9].
- Vitamina D: dipende dall'esposizione solare, dalla latitudine, dalla stagione; in assenza di sole sufficiente e di alimenti fortificati sono raccomandati integratori, soprattutto per gli anziani [S9]. Il testo cita apporti di 1000-2000 UI, anche superiori, in questo contesto [S9]; i LARN fissano 15 µg (600 UI) come PRI [S1]; per dosi di integrazione l'app non deve proporre numeri.

Il documento Academy conclude che diete vegetariane e vegane "pianificate in modo appropriato" sono adeguate in tutte le fasi della vita [S9]. Una presa di posizione italiana (SINU o SIO) sulle diete vegetali è non trovata in fonte aperta; il comunicato SINU sulla V revisione segnala solo una "maggiore propensione verso un'alimentazione vegetale" [S3; S14].

Per il motore di piani: marcare come "da monitorare" B12, ferro, calcio, zinco, iodio, vitamina D, EPA/DHA quando la dieta è vegana (tutti) o vegetariana (B12, ferro, zinco, iodio, omega-3), e mostrare un promemoria generico "parlane con il tuo medico o dietista prima di integrare".

---

## 6. Quando l'app NON deve proporre un piano calorico automatico

Dato di partenza: non ho trovato una fonte ufficiale aperta che elenchi cosa un'app di pianificazione pasti non deve fare. Le linee guida NICE (disturbi alimentari NG69, obesità NG246) risultano non verificate: le pagine hanno risposto con errore 403. La tabella seguente è quindi una PROPOSTA di cautela, con le basi di fonte dove esistono.

| Condizione | Comportamento proposto | Base di fonte |
|---|---|---|
| Minorenni (sotto i 18 anni) | Nessun piano calorico; solo educazione alimentare e rinvio a pediatra/dietista | I LARN usano peso di riferimento, equazioni e PAL specifici per età evolutiva (PAL 1,4-2,0 a 10-17 anni, +1% di energia per la crescita) [S1; S3; S6]. Un'app per adulti non li replica |
| Gravidanza | Nessun deficit e nessun calcolo automatico; messaggio di rinvio a ostetrica/ginecologo | La linea guida ISS sulla gravidanza fisiologica (2025) definisce il tema del peso "complesso e sensibile", con rischio di giudizio e stigma soprattutto con storia di disturbi alimentari [S12]. I LARN V hanno fabbisogni specifici (energia: non trovato nelle tabelle riassuntive; proteine +0,5/+6/+19,9 g) [S1] |
| Allattamento | Come sopra | LARN V: fabbisogni specifici (proteine +16/+11 g AR) [S1]; energia aggiuntiva: non trovato |
| Patologie (diabete, malattie renali, cardiopatie, celiachia, tumori, ecc.) o terapie in corso | Nessun piano automatico; solo informazioni generali e invito a un professionista | La linea guida dietetica AND prevede un piano individualizzato per stato di salute, condotto da un dietista [S8]; i valori LARN sono riferimenti di popolazione e non prescrittivi [S1] |
| Storia o sospetto di disturbi alimentari | Non mostrare calorie, deficit o obiettivi di peso; messaggio di supporto neutro e invito a un professionista | S12 (stigma e sensibilità del tema peso in chi ha avuto disturbi alimentari). Lo screening con questionari validati (per esempio SCOFF): non verificato in fonte aperta, da valutare con un clinico |
| BMI inferiore a 18,5 (sottopeso) | Nessun deficit; nessuna proposta di dimagrimento; invito a verificare con un medico | Soglia OMS di sottopeso 18,5 [S13]. Per i sottopeso non è stata trovata una indicazione di fonte aperta su piani di aumento di peso, quindi nessun piano automatico |
| Ritmo di calo ipotizzato eccessivo o calorie sotto la soglia minima | Rifiutare l'obiettivo e spiegare perché | Soglie di S8 e S11 (sezione 3) |
| Dichiarata dieta medica in corso, farmaci per il peso, chirurgia bariatrica | Nessun piano automatico | PROPOSTA di cautela, nessuna fonte aperta |
| Età avanzata (75 anni e oltre) o perdita di peso involontaria | Nessun deficit; messaggio di valutazione medica | I LARN V trattano gli anziani con obiettivi proteici più alti (SDT 1,1 g/kg) [S1]; per le diete dimagranti negli over 75 fonte: non trovata |

BMI da calcolare con peso(kg) / altezza(m)². Soglie OMS adulti: sottopeso sotto 18,5; normopeso 18,5-24,9; sovrappeso da 25; obesità da 30 [S13].

Per BMI da 30 in poi e per obiettivi di calo del peso oltre il 10% si suggerisce di indicare "con il supporto di un professionista" (coerente con S8 e S18).

---

## 7. Parametri da raccogliere in onboarding

Elenco derivato dalle formule delle sezioni 1-6 (PROPOSTA). Per ogni voce indico perché serve.

Obbligatori per il calcolo:
1. Sesso (come usato dalle equazioni: maschio o femmina) [S5; S4]
2. Data di nascita: età anagrafica, usata per le fasce 18-29, 30-59, 60+ e per i controlli sui minorenni [S1; S4]
3. Altezza in cm (Mifflin e BMI) [S5]
4. Peso in kg (tutte le equazioni e le proteine in g/kg) [S4; S5; S1]
5. Livello di attività quotidiana (sedentario, leggero, moderato, intenso, con esempi concreti di lavoro e movimento) [S3]
6. Allenamenti: tipo di attività, giorni a settimana, minuti a seduta, intensità (percepita o MET) [S7]
7. Obiettivo (perdere, mantenere, aumentare) e, se perdere o aumentare, peso obiettivo e tempo desiderato, per controllare il ritmo massimo [S8; S11]

Per la sicurezza (decidono se il piano si può proporre):
8. Dichiarazione di maggiore età
9. Gravidanza o allattamento, in corso o pianificati
10. Patologie e terapie rilevanti (risposta sì/no e rinvio a un professionista, senza raccogliere dettagli clinici non necessari)
11. Storia di disturbi alimentari (domanda con formulazione non giudicante, trattamento riservato)
12. Peso minimo e massimo recente e variazione involontaria di peso (opzionale)

Per i piani pasti:
13. Dieta (onnivora, pescetariana, vegetariana, vegana), allergie e intolleranze, alimenti da escludere (per vegetariani e vegani attivare il promemoria micronutrienti della sezione 5)
14. Numero di pasti, tempo di cucina, budget, attrezzatura (non derivano dalle fonti: dati di prodotto)

Dati sensibili: salute, disturbi alimentari e gravidanza sono categorie particolari dei dati personali nel diritto europeo (GDPR, art. 9): non verificato in questa ricerca con fonte aperta; da far valutare per consenso esplicito e informativa prima del rilascio.

---

## Stato della ricerca

Completo e verificato su fonte aperta:
- coefficienti Mifflin-St Jeor e FAO/Schofield nelle due versioni (con confronto numerico con le tabelle LARN V)
- PAL LARN IV e V (valori numerici), classificazione FAO/IOM
- MET da Compendium 2024 per i principali allenamenti
- macronutrienti LARN V (carboidrati, lipidi, proteine, zuccheri, SFA, fibra) per adulti e over 65
- micronutrienti LARN V (B12, ferro, calcio, zinco, iodio, vitamina D, EPA+DHA) per sesso ed età
- soglie di calo di peso e calorie (Academy, 2014)

Parziale:
- etichette verbali dei PAL adulti LARN V (la mappatura sedentario/leggero/moderato/intenso è una proposta)
- esclusioni dal piano automatico (basi di fonte solo per gravidanza/ISS, BMI/OMS, linea guida AND; il resto è cautela di progetto)
- vegetariani e vegani (solo Academy 2016, USA; nessuna posizione italiana)

Non trovato:
- valori LARN V per gli sportivi (g/kg di proteine e carboidrati): testo completo a pagamento
- fabbisogno energetico aggiuntivo in gravidanza e allattamento (LARN V)
- fattore correttivo LARN per ferro e zinco nei vegetariani
- UL per iodio, ferro, zinco, calcio (non letti)
- surplus calorico standard da fonte ufficiale per l'aumento di peso
- indicazioni NICE (403) e fonti italiane (SIO, ministero) su diete dimagranti e disturbi alimentari
- GDPR art. 9: non verificato

Cautele: la lettura di alcune tabelle LARN V è avvenuta sulle immagini delle pagine (la versione testo era sfalsata); la tabella dei PAL adulti di S3 è una fotografia a bassa risoluzione. Prima del rilascio conviene un riscontro con il volume LARN V completo e la revisione di un dietista.

---

## Legenda fonti (URL aperti in questa ricerca)

- S1: SINU, LARN V revisione, "Tabelle riassuntive" (acqua, energia, carboidrati, lipidi, proteine, vitamine, minerali). http://sinu.it/wp-content/uploads/2025/07/Tabelle-riassuntive_online.pdf
- S2: SINU, pagina "LARN" (V revisione 2024, disponibilità dei documenti). https://sinu.it/larn/
- S3: Di Profio E., "Gli standard qualitativi in Italia: dalle Linee Guida ai LARN" (diapositive sulle novità LARN V: BMR, PAL). https://www.tsrmpstrpvenezia.it/wp-content/uploads/2025/10/Di-Profio-Elisabetta.pdf
- S4: CREA, "Linee guida per una sana alimentazione, dossier scientifico 2017, capitolo 1 Il Peso". https://www.crea.gov.it/documents/59764/0/Dossier+LG+2017_CAP1.pdf/e8359ac4-5b10-bae6-d7c8-fe25cf9d05fb?t=1575530076206
- S5: Greco E.A., Pinto A., "Valutazione del dispendio energetico" (equazioni, LAF, MET). https://www.societaitalianadiendocrinologia.it/wp-content/uploads/2024/09/import-media-Articolo10.pdf
- S6: Cerutti E., Oberti D., "Tabelle LARN" (riproduzione delle tabelle LARN IV 2014). https://www.datocms-assets.com/37542/1721406489-17_tabelle_larn.pdf
- S7: Compendium of Physical Activities, 2024 Adult Compendium (tabella dei MET). https://pacompendium.com/wp-content/uploads/2024/01/2024-adult-compendium_1_2024.pdf
- S8: Academy of Nutrition and Dietetics, Adult Weight Management Guideline 2014, Executive Summary. https://www.andeal.org/vault/pq130.pdf
- S9: Melina V., Craig W., Levin S., "Position of the Academy of Nutrition and Dietetics: Vegetarian Diets", J Acad Nutr Diet 2016;116:1970-1980. Testo letto da copia PDF salvata in precedenza nella cartella di lavoro; doi: https://doi.org/10.1016/j.jand.2016.09.025 ; abstract aperto: https://digitalcommons.andrews.edu/pubs/648
- S10: Jäger R. et al., ISSN position stand: protein and exercise, 2017. https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/
- S11: Aragon A. et al., ISSN position stand: diets and body composition, 2017. https://pmc.ncbi.nlm.nih.gov/articles/PMC5470183/
- S12: Istituto Superiore di Sanità, Linea guida Gravidanza fisiologica, aggiornamento 2025, parte 2 (Fumagalli). https://www.epicentro.iss.it/materno/pdf/gravidanza-fisiologica/Fumagalli.pdf
- S13: OMS, Global Health Observatory, Body mass index. https://www.who.int/data/gho/data/themes/topics/topic-details/GHO/body-mass-index
- S14: Cairella G. (SINU), "Ci sono novità nei nuovi LARN 2024", Scienza&Ricerca/AIC. https://celiachia.it/assets/uploads/2025/01/CN3_24_Larn.pdf
- S15: AmaperBene, "I LARN 2024" (proteine 12-20% En, 0,9 g/kg). https://www.amaperbene.it/i-larn-2024/
- S18: NIDDK, "Choosing a safe and successful weight-loss program". https://www.niddk.nih.gov/health-information/weight-management/choosing-a-safe-successful-weight-loss-program
- S19: Compendium of Physical Activities, sito (definizione di MET). https://pacompendium.com/

Pagine tentate e non leggibili: NICE NG69 e NG246 (HTTP 403), PMC10818145 (richiesta reCAPTCHA), PubMed 28642676 (cookie), jandonline (403).

## Revisione del 9 ottobre 2026: metabolismo basale con l'altezza e confronto con le DRI 2023

Motivo: per una donna di 56 anni e 157 cm (lavoro "in piedi o in movimento", nessun allenamento) l'app proponeva 2060-2220 kcal e porzioni da 155 g di pasta; la persona che usa l'app l'ha giudicato eccessivo.

Cosa risulta (calcoli miei sulle formule delle sezioni 1 e 2, confronto con una fonte indipendente):
- Le equazioni di Schofield/Oxford dei LARN (versione B) dipendono solo da peso, età e sesso. Per una donna di 157 cm danno un metabolismo basale più alto di Mifflin-St Jeor, che usa anche l'altezza: a 55 kg 1293 contro 1090 kcal, a 65 kg 1374 contro 1190, a 85 kg 1537 contro 1390 (da +11% a +19%).
- Le equazioni EER delle DRI 2023 (National Academies; riportate da Health Canada), ricavate da misure del dispendio con acqua doppiamente marcata, per la stessa donna danno: inattiva 1730-2090 kcal, poco attiva 1890-2250 kcal, attiva 2020-2390 kcal tra 55 e 85 kg [S16, S17]. Il vecchio calcolo (BMR Schofield × 1,6) stava circa il 9-10% sopra la "poco attiva".
- Nei confronti trovati in letteratura (donne portoghesi normopeso, donne con eccesso di grasso, donne arabe giovani) Mifflin-St Jeor risulta fra le equazioni più vicine alla misura, ma l'errore cambia direzione a seconda della popolazione [S18]: non esiste una formula esatta, per questo l'app mostra anche il riferimento DRI e permette di regolare le calorie del piano (da -20% a +10%).

Cambiamenti nell'app: BMR con Mifflin-St Jeor tra 19 e 78 anni (Schofield versione B fuori da questo intervallo); PAL invariati (1,4 / 1,6 / 1,8); nel riepilogo compare il valore DRI di confronto; nella creazione del piano c'è la regolazione delle calorie. Con questi cambi, per la donna di 56 anni e 157 cm: 1740-2220 kcal per "in piedi o in movimento" tra 55 e 85 kg (DRI poco attiva: 1890-2250).

Resta una scelta dell'utente il livello di attività: la V revisione LARN stima 1,6 per un lavoro d'ufficio e 1,8 per un lavoro in piedi, quindi le etichette dell'app sono già prudenti; per chi si sente meno attiva "Seduto" (1,4) dà 1530-1950 kcal.

- S16: Health Canada, "Dietary reference intakes tables: Equations to estimate energy requirement". https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/equations-estimate-energy-requirement.html
- S17: National Academies, "Dietary Reference Intakes for Energy" (2023), capitoli 7 e 9. https://www.nationalacademies.org/read/26818/chapter/9
- S18: confronto fra equazioni del metabolismo basale in donne (Comparison of predictive equations for resting metabolic rate in Portuguese women, Motricidade 2020; Congruent Validity of Resting Energy Expenditure Predictive Equations in Young Adults, PMC6413219). Non ho verificato i dati dei singoli studi oltre alle sintesi di ricerca.
