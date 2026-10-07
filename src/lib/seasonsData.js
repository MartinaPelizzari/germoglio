// Carica nell'app il calendario di stagionalità (src/data/seasons.json)
import { setSeasons } from './seasons.js';

const files = import.meta.glob('../data/seasons.json', { eager: true });
setSeasons(Object.values(files).flatMap((m) => m.default));
