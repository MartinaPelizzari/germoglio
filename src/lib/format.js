export const CATEGORIES = ['Colazione', 'Pranzo', 'Cena', 'Spuntino', 'Contorno'];

export const getCategoryEmoji = (c) =>
  ({ Colazione: '🥐', Pranzo: '🥗', Cena: '🥘', Spuntino: '🍎', Contorno: '🥦' })[c] || '🍽️';

export const categoryTint = (c) =>
  ({ Colazione: 'bg-yellow-50', Pranzo: 'bg-orange-50', Cena: 'bg-indigo-50', Spuntino: 'bg-pink-50', Contorno: 'bg-green-50' })[c] || 'bg-brand-50';

export const FOOD_EMOJIS = [
  '🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🥭','🍍','🥥','🥝','🍅','🥑','🍆','🥔','🥕','🌽','🌶️','🫑','🥒','🥬','🥦','🧄','🧅','🍄','🥜','🌰','🍠','🫛','🫘','🎃','🫒',
  '🍞','🥐','🥖','🫓','🥨','🥞','🧇','🧀','🥚','🍳','🥣','🍔','🍕','🥪','🥙','🧆','🌮','🌯','🥗','🥘','🫕','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🍙','🍚',
  '🍦','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍮','🍯','🥛','☕','🍵','🧃',
];

export const TIME_LABEL = { breve: 'Breve', media: 'Media', lunga: 'Lunga' };

export const timeLabel = (r) => (r.minutes ? `${r.minutes} min` : TIME_LABEL[r.time] || r.time || '');
