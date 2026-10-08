// Varianti derivate: nei pasti con menu diversi per dieta si sceglie prima la ricetta base (quella di chi ha la dieta più restrittiva)
// e le altre persone mangiano la stessa ricetta con un'altra fonte proteica: "quinoa con zucchine, carote e prezzemolo" diventa
// "quinoa con zucchine, carote e prezzemolo (variante con pollo)". Stessa base e stessa struttura, cambia solo la proteina.
import { mainProtein, proteinTypeOfName } from './protein.js';

const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const DIET_LEVEL = { vegan: 0, vegetarian: 1, pescetarian: 2, omnivore: 3 };

// fonti proteiche che si aggiungono a un piatto: nome dell'ingrediente, quantità per una porzione, come cuocerlo
export const PROTEIN_ADDS = {
  pesce: [
    { label: 'merluzzo', name: 'Filetto di merluzzo', qty: 150, unit: 'g', how: 'in padella o al forno con un filo d\'olio, sale e limone' },
    { label: 'salmone', name: 'Filetto di salmone', qty: 130, unit: 'g', how: 'in padella o al forno con un filo d\'olio e sale' },
    { label: 'gamberi', name: 'Gamberi sgusciati', qty: 120, unit: 'g', how: 'in padella con un filo d\'olio e uno spicchio d\'aglio' },
    { label: 'tonno', name: 'Tonno al naturale', qty: 80, unit: 'g', how: 'sgocciolato e sbriciolato' },
  ],
  'carne-bianca': [
    { label: 'pollo', name: 'Petto di pollo', qty: 120, unit: 'g', how: 'a straccetti in padella con un filo d\'olio e sale' },
    { label: 'tacchino', name: 'Fesa di tacchino', qty: 120, unit: 'g', how: 'a straccetti in padella con un filo d\'olio e sale' },
  ],
  'carne-rossa': [
    { label: 'manzo', name: 'Fettine di manzo', qty: 100, unit: 'g', how: 'a straccetti in padella con un filo d\'olio e sale' },
    { label: 'maiale', name: 'Filetto di maiale', qty: 100, unit: 'g', how: 'a fettine in padella con un filo d\'olio e sale' },
  ],
  uova: [{ label: 'uova', name: 'Uova', qty: 2, unit: 'pz', how: 'sode o strapazzate' }],
  formaggi: [
    { label: 'mozzarella', name: 'Mozzarella', qty: 100, unit: 'g', how: 'a cubetti' },
    { label: 'ricotta', name: 'Ricotta', qty: 100, unit: 'g', how: 'a cucchiaiate' },
  ],
  legumi: [
    { label: 'ceci', name: 'Ceci cotti', qty: 150, unit: 'g', how: 'scolati e scaldati' },
    { label: 'lenticchie', name: 'Lenticchie cotte', qty: 150, unit: 'g', how: 'scolate e scaldate' },
  ],
};
const TYPE_DIET = { pesce: 'pescetarian', 'carne-bianca': 'omnivore', 'carne-rossa': 'omnivore', salumi: 'omnivore', uova: 'vegetarian', formaggi: 'vegetarian', legumi: 'vegan' };

const grams = (i) => (['g', 'ml'].includes(i.unit) ? i.qty : i.unit === 'pz' ? i.qty * 55 : 0);

// piatti la cui struttura dipende dalla proteina (frittata, polpette, lasagne, torte salate, pizza...): non si derivano, si sceglie un altro piatto simile
const STRUCTURAL = /shakshuka|menemen|alla diavola|^(ricotta|feta|halloumi|mozzarella|uova|uovo|tofu|tempeh|seitan|lenticchie|ceci|fagioli|hummus)\b|rag[uù]|frittat|omelette|polpett|burger|gnocchi di|torta|quiche|sformato|lasagn|parmigiana|pizza|focaccia|panino|toast|wrap|piadina|falafel|crocchett|cotolett|scaloppin|spezzatin|arrosto|tagliata|spiedin|ripien/;

// ingredienti proteici da togliere per metterne un'altra: { drop: [indici], words: [parole del titolo da sostituire] } oppure null se non si può derivare
export const droppableProteins = (base) => {
  const title = norm(base.title);
  if (STRUCTURAL.test(title)) return null;
  const drop = [];
  const words = [];
  for (let i = 0; i < (base.ingredients || []).length; i++) {
    const ing = base.ingredients[i];
    const type = ing.group === 'protein' ? proteinTypeOfName(ing.name) : null;
    if (!type || grams(ing) < 15) continue;
    drop.push(i);
    // la parola con cui il piatto nomina la proteina ("Pasta con ricotta e pomodorini" → "ricotta")
    const w = norm(ing.name).split(' ').find((x) => x.length > 3 && !['filetto', 'petto', 'fesa', 'cotti', 'cotte', 'fresco', 'fresca', 'sgusciati', 'vaccina'].includes(x));
    if (w && title.includes(w.slice(0, 5))) words.push(w.slice(0, 5));
  }
  // più proteine nominate nel titolo ('ragù di fagioli e ricotta') o troppi ingredienti proteici: troppo intrecciato per sostituire una parola sola
  if (words.length > 1 || drop.length > 2) return null;
  return { drop, words };
};

// tutte le varianti possibili di una ricetta base con la fonte proteica di un certo tipo
export const variantSpecs = (base, type) => {
  const d = droppableProteins(base);
  if (d === null) return [];
  const own = mainProtein(base);
  if (own && own.type === type) return []; // stessa fonte: è la ricetta base
  return (PROTEIN_ADDS[type] || []).map((p) => {
    // il titolo cambia nella parola che nominava la proteina; se non c'è, si aggiunge "(variante con ...)"
    let title = base.title;
    let replaced = false;
    for (const w of d.words) { const re = new RegExp(`\\b${w}\\w*(\\s+(sod\\w*|strapazzat\\w*|in camicia))?`, 'i'); if (re.test(title)) { title = title.replace(re, p.label); replaced = true; break; } }
    return {
      key: `${type}-${p.label}`,
      title: replaced ? title : `${base.title} (variante con ${p.label})`,
      drop: d.drop,
      add: { name: p.name, qty: p.qty, unit: p.unit, group: 'protein' },
      diet: Object.entries(DIET_LEVEL).find(([, l]) => l === Math.max(DIET_LEVEL[base.diet] ?? 3, DIET_LEVEL[TYPE_DIET[type]]))[0],
      step: `Variante: cuoci ${p.name.toLowerCase()} ${p.how} e uniscilo al piatto${d.drop.length ? ' al posto della proteina della ricetta base' : ''}.`,
      type,
    };
  });
};

export const deriveRecipe = (base, spec) => ({
  ...base,
  id: `${base.id}~${spec.key}`,
  title: spec.title,
  diet: spec.diet,
  ingredients: [...base.ingredients.filter((_, i) => !spec.drop.includes(i)), spec.add],
  steps: [...(base.steps || []), spec.step],
  derivedFrom: base.id,
  variantSpec: spec,
});
