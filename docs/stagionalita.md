# Stagionalita di frutta e verdura (Italia)

Dati in `src/data/seasons.json`. Ogni voce ha `name`, `months` (1-12), `source` e, quando serve, `note`.

## Fonti aperte e lette

1. Dica33, calendario mensile frutta e verdura (fonte principale, copre quasi tutti i prodotti): https://www.dica33.it/guida-alimenti/frutta-verdura-stagione/calendario-frutta-verdura-stagione.asp
2. Calendario del Ministero (campagna MASAF "Sai quel che mangi") pubblicato da ASL VCO, PDF: https://www.aslvco.it/wp-content/uploads/2026/01/6.CALENDARIO-FRUTTA-E-VERDURA-DI-STAGIONE.pdf
3. Altroconsumo, calendario frutta e verdura (aperta solo la parte gennaio-maggio): https://www.altroconsumo.it/alimentazione/fare-la-spesa/consigli/calendario-frutta-verdura
4. Dissapore, frutta di stagione mese per mese (solo frutta): https://www.dissapore.com/spesa/frutta-di-stagione-quale-comprare-mese-per-mese-e-come-conservarla/
5. Altroconsumo, funghi (indicazione generica "tutte le stagioni, picco ago-nov"): https://www.altroconsumo.it/alimentazione/fare-la-spesa/speciali/funghi-come-sceglierli
6. Altroconsumo, piante aromatiche (basilico annuale, prezzemolo biennale, rosmarino/salvia/timo/menta perenni, senza mesi): https://www.altroconsumo.it/vita-privata-famiglia/vivere-sostenibile/consigli/come-coltivare-le-piante-aromatiche

## Fonti note solo dall'estratto del motore di ricerca (pagine non aperte)

- Cose di Casa, patate dolci (ago-dic): https://www.cosedicasa.com/casa-in-fiore/orto/patate-dolci-americane-nellorto-61205
- Il Fatto Quotidiano, sedano rapa: https://www.ilfattoquotidiano.it/2011/02/16/stagioni-in-tavola-febbraio-in-amore-con-il-sedano-rapa/92399/
- Il Fatto Alimentare, noci, nocciole, mandorle: https://ilfattoalimentare.it/noci-salute-importazioni-prezzi.html

Questi mesi sono stime da verificare.

## Fonti non utilizzabili

Non letti: Humanitas, Airc, Fondazione Veronesi, Slow Food, ISMEA, CREA, masaf.gov.it (nessun calendario mensile trovato dalla ricerca), Eroica Fenice e ATS Brescia (HTTP 403), Altroconsumo giugno-dicembre (contenuto troncato), My-Personaltrainer (grafici non leggibili).

## Regola applicata

Quando Dica33 e il calendario MASAF elencano entrambi il prodotto, `months` contiene solo i mesi comuni e la `note` riporta le due serie. I prodotti presenti solo in Dica33 usano i suoi mesi. Per importati (banane, ananas, avocado, mango, cocco) i mesi sono tutto l'anno, come richiesto.

## Discordanze principali

- Il calendario MASAF e' molto sintetico: l'intersezione restringe parecchio alcuni prodotti, per esempio carciofi (Dica33 gen-giu e ott-dic, MASAF gen-apr), zucchine (Dica33 mag-ott, MASAF giu-set), anguria, albicocche, piselli. Se l'app deve essere meno restrittiva, usare la serie Dica33 riportata nelle note.
- Mele e pere: MASAF omette giugno e luglio, quindi sono escluse (in realta' in commercio da frigo).
- Avocado e mango: Dica33 li limita ad alcuni mesi, ma sono importati tutto l'anno (scelta richiesta).
- Barbabietola: Dica33 omette marzo-aprile (mesi non inclusi).
- Erbe aromatiche, funghi, frutta secca: mesi stimati, senza calendario puntuale.
- Il PDF MASAF scrive "Pesce" al posto di "Pesche": interpretato come pesche.
