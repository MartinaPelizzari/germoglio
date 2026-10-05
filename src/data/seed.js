import colazione from './recipes/colazione.json';
import spuntino from './recipes/spuntino.json';
import pranzo from './recipes/pranzo.json';
import cena from './recipes/cena.json';
import contorno from './recipes/contorno.json';
import pranzoOnnivoro from './recipes/pranzo-onnivoro.json';
import cenaOnnivoro from './recipes/cena-onnivoro.json';
import colazioneOnnivoro from './recipes/colazione-onnivoro.json';
import asporto from './recipes/asporto.json';

// Ricettario precaricato: uguale per tutti, in sola lettura. Le ricette personali stanno su Firestore.
export const SEED_RECIPES = [...colazione, ...colazioneOnnivoro, ...pranzo, ...pranzoOnnivoro, ...asporto, ...cena, ...cenaOnnivoro, ...spuntino, ...contorno].map((r) => ({
  ...r,
  seed: true,
}));
