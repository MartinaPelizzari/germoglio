// Tipi di alimento riconosciuti dai nomi degli ingredienti (frequenze settimanali e abbinamento al piano)
export const FOOD_TYPES = [
  { id: 'legumi', label: 'Legumi', words: ['ceci', 'lenticchie', 'fagioli', 'piselli', 'fave', 'edamame', 'lupini', 'hummus', 'farina di ceci', 'soia gialla', 'cicerchie', 'borlotti', 'cannellini', 'tofu', 'tempeh'] },
  { id: 'pesce', label: 'Pesce', words: ['tonno', 'salmone', 'merluzzo', 'gamberi', 'gamberetti', 'acciughe', 'alici', 'orata', 'branzino', 'pesce', 'calamari', 'polpo', 'cozze', 'vongole', 'sgombro', 'sardine', 'baccalà', 'trota', 'seppie'] },
  { id: 'carne-bianca', label: 'Carne bianca', words: ['pollo', 'tacchino', 'coniglio'] },
  { id: 'carne-rossa', label: 'Carne rossa', words: ['manzo', 'maiale', 'vitello', 'agnello', 'salsiccia', 'bistecca', 'macinato', 'hamburger', 'polpette di carne', 'ragù di carne'] },
  { id: 'salumi', label: 'Salumi', words: ['prosciutto', 'pancetta', 'speck', 'bresaola', 'salame', 'mortadella', 'guanciale', 'wurstel'] },
  { id: 'uova', label: 'Uova', words: ['uova', 'uovo', 'frittata', 'omelette'] },
  { id: 'formaggi', label: 'Formaggi', words: ['formaggio', 'parmigiano', 'ricotta', 'feta', 'mozzarella', 'pecorino', 'grana', 'caprino', 'stracchino', 'mascarpone', 'scamorza', 'halloumi'] },
  { id: 'frutta-secca', label: 'Frutta secca e semi', words: ['frutta secca', 'noci', 'mandorl', 'nocciol', 'pistacch', 'anacard', 'pinoli', 'semi di', 'arachid', 'tahin'] },
  { id: 'cereali-integrali', label: 'Cereali integrali', words: ['integral', 'farro', 'orzo', 'avena', 'quinoa', 'grano saraceno', 'miglio', 'riso nero', 'bulgur'] },
  { id: 'verdure-foglia', label: 'Verdure a foglia', words: ['spinaci', 'bietol', 'rucola', 'lattuga', 'insalata', 'cavolo nero', 'radicchio', 'valeriana', 'cicoria', 'cime di rapa', 'broccol'] },
];

export const foodLabel = (id) => FOOD_TYPES.find((f) => f.id === id)?.label || id;
