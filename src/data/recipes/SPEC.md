# Specifica ricette precaricate

Ogni file `<categoria>.json` è un array JSON di oggetti con questo schema (tutti i campi obbligatori salvo `source` e `notes`):

```json
{
  "id": "pranzo-pasta-ceci-rosmarino",
  "title": "Pasta e ceci al rosmarino",
  "category": "Pranzo",
  "time": "media",
  "minutes": 30,
  "emoji": "🍝",
  "diet": "vegan",
  "takeaway": false,
  "tags": ["legumi", "piatto unico"],
  "ingredients": [
    { "name": "Pasta integrale corta", "qty": 80, "unit": "g", "group": "carb" },
    { "name": "Ceci cotti", "qty": 120, "unit": "g", "group": "protein" },
    { "name": "Sale", "qty": 0, "unit": "q.b.", "group": "other" }
  ],
  "steps": ["Primo passaggio.", "Secondo passaggio."],
  "source": { "name": "Nome sito o autore", "url": "https://..." },
  "notes": "Facoltativo: varianti o conservazione."
}
```

Regole:
- `id`: slug minuscolo, prefisso categoria in minuscolo (colazione-, spuntino-, pranzo-, cena-, contorno-), unico.
- `category`: Colazione | Pranzo | Cena | Spuntino | Contorno.
- `time`: breve (fino a 20 min), media (21-45), lunga (oltre 45); `minutes` coerente.
- `takeaway`: true se il piatto regge bene l'asporto (si trasporta in contenitore, buono freddo o tiepido o scaldabile in ufficio: insalate di cereali, torte salate, polpette, burger, wrap, frittate, pasta fredda, zuppe in thermos...), altrimenti false.
- `diet` (4 livelli, dal più restrittivo): "vegan" (nessun derivato animale: niente miele, latte, burro, uova, formaggi, parmigiano, yogurt non vegetale, gelatina) oppure "vegetarian" (uova e latticini ammessi, niente carne né pesce), oppure "pescetarian" (contiene pesce o frutti di mare ma non carne), oppure "omnivore" (contiene carne, anche solo brodo di carne, salumi o pancetta). Se un ingrediente non è vegano, la ricetta NON è "vegan".
- `ingredients`: quantità per UNA porzione adulta. `unit` in: g, ml, pz, cucchiai, cucchiaini, q.b. (con q.b. qty = 0). Mai "gr". `group` in: carb (pasta, riso, cereali, pane, patate, farine), protein (legumi, tofu, tempeh, seitan, uova, formaggi, proteine vegetali), veg (verdure), fat (oli, frutta secca, semi, burri di semi, avocado, olive), fruit (frutta fresca/secca zuccherina, datteri), dairy (latte e yogurt, anche vegetali), other (spezie, condimenti, lievito alimentare, sale, acqua, aceto, dolcificanti, cioccolato).
  Usa quantità realistiche; i gruppi carb/protein/veg/fat devono contenere gli ingredienti che davvero costituiscono quella componente, perché l'app scala le dosi per gruppo.
  Nomi ingredienti: singolari/generici e coerenti tra ricette (es. "Pomodori pelati", "Olio extravergine d'oliva", "Cipolla", "Latte di soia", "Tofu", "Ceci cotti"), così la lista della spesa li somma.
- `steps`: 3-8 passaggi chiari, in italiano, frasi complete.
- `tags`: 1-4 etichette brevi in minuscolo.
- `source`: solo se la ricetta è davvero ispirata a una pagina che hai consultato; metti nome e URL reale della pagina. Altrimenti `null`.

Diritto d'autore: NON copiare il testo delle fonti. Gli elenchi di ingredienti sono fatti, ma il procedimento va riscritto con parole tue, con la tua struttura. Non inserire foto né link a foto.

Stile: italiano naturale e corretto, con accenti e apostrofi giusti (è, perché, l'olio). Nessuna lineetta lunga (usa virgole o due punti). Niente emoji nei testi, tranne il campo `emoji`.

## Aggiornamenti (ricette dal web)

- `category` è un indizio interno (non compare più nell'app): serve solo a capire se un piatto va bene per colazione, spuntino o pasto principale quando nessuno ha un piano scritto. Usa Colazione, Spuntino, Pranzo (o Cena) per i piatti principali, Contorno per i contorni.
- `diet`: una ricetta con pesce è "pescetarian" (va bene anche agli onnivori: l'app lo sa), con carne "omnivore".
- Ricette prese dal web: `source` è OBBLIGATORIO con nome del sito e URL della pagina che hai davvero aperto con WebFetch. Se non riesci ad aprire la pagina, non aggiungere la ricetta. Il procedimento va riscritto con parole tue (mai copiato); gli ingredienti si riportano come fatti, riscalati a UNA porzione adulta.
- Id con prefisso `web-` (es. `web-pranzo-pasta-ceci`).
- Preferisci piatti equilibrati (una fonte di carboidrati, una di proteine e verdure) o contorni/colazioni/spuntini chiaramente completi.
