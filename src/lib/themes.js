// Temi di piatto: servono a far mangiare piatti "della stessa famiglia" a chi in un pasto ha menu diversi per dieta o piano.
// Una ricetta può dichiarare il suo tema (campo "theme", con "variant": vegan, vegetarian, omnivore); altrimenti si deduce dal titolo.
const FAMILIES = [
  ['frittata', /frittat|omelette|tortino di uov|tortilla spagnola/],
  ['risotto', /risott|riso |riso$|orzott|farrott/],
  ['pasta', /pasta|spaghett|penne|fusilli|orecchiett|linguine|tagliatell|lasagn|cannelloni/],
  ['gnocchi', /gnocchi/],
  ['insalata', /insalat/],
  ['polpette', /polpett|burger|hamburger|polpettone|crocchett|falafel/],
  ['zuppa', /zupp|minestr|vellutat|crema di/],
  ['torta salata', /torta salata|quiche|sformato|flan|parmigiana/],
  ['wrap', /piadina|wrap|tramezz|sandwich|toast|tacos|burrito/],
  ['pizza', /pizza|focaccia|pinsa/],
  ['polenta', /polent/],
  ['cereali', /cous ?cous|bulgur|quinoa|bowl/],
  ['carne al forno', /arrosto|al forno|tagliata|cotoletta|scaloppin|spezzatin|spiedin|filetto|petto|bistecca|fettine/],
  ['pesce', /salmone|merluzzo|orata|branzino|tonno|gamber|cozze|pesce|sgombro|baccal/],
];

export const themeOf = (recipe) => {
  if (recipe.theme) return recipe.theme;
  const t = (recipe.title || '').toLowerCase();
  return FAMILIES.find(([, re]) => re.test(t))?.[0] || null;
};
export const hasExplicitTheme = (recipe) => Boolean(recipe.theme);
