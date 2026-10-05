// Firestore finto: nessuna rete, tutto vuoto
export const doc = () => ({}); export const collection = () => ({}); export const query = () => ({}); export const where = () => ({});
export const documentId = () => ({}); export const setDoc = async () => {}; export const addDoc = async () => {}; export const deleteDoc = async () => {};
export const onSnapshot = (ref, cb) => { cb({ exists: () => false, data: () => ({}), docs: [] }); return () => {}; };
