// Varietà del pasto: consistenza e colore. Evita il pasto tutto liquido (zuppa più frullato) e quello tutto "beige"
// (pollo, purè di patate, cavolfiore): in ogni pasto principale deve esserci almeno qualcosa di colorato e di solido.
const LIQUID = /zupp|vellutat|minestr|minestrone|crema di|frullat|smoothie|brodo|passato|gazpacho|congee/i;
const CREAMY = /pur[eè]|hummus|crema|mousse|budino|besciamella/i;
const COLORFUL = /pomodor|carot|peperon|spinaci|bietol|zucca|barbabiet|rucola|broccol|fagiolin|piselli|melanzan|zucchin|radicchio|cavolo (nero|rosso)|cetriol|mirtill|fragol|frutti|arancia|kiwi|mango|avocado|cavolini|asparag|carciof|edamame|mais|lattuga|insalata|basilico|prezzemolo|peperoncino|ravanell|rape rosse|susine|uva nera|melograno/i;

export const consistencyOf = (recipe) => (LIQUID.test(recipe.title || '') ? 'liquido' : CREAMY.test(recipe.title || '') ? 'cremoso' : 'solido');

const grams = (ing) => (['g', 'ml'].includes(ing.unit) ? ing.qty : ing.unit === 'pz' ? ing.qty * 80 : ing.unit === 'cucchiai' ? ing.qty * 10 : 0);
// grammi di ingredienti colorati di un piatto
export const colorMass = (recipe) => (recipe.ingredients || []).reduce((a, i) => a + (COLORFUL.test(i.name || '') ? grams(i) : 0), 0);

export const MIN_COLOR_GRAMS = 40;
