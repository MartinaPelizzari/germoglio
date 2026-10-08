import React from 'react';
import { Sheet } from './ui.jsx';

const W = 280; // larghezza dell'area di ritaglio, in pixel

// Ritaglio quadrato (mostrato tondo, come l'avatar): si trascina la foto e si regola lo zoom
// aspect: larghezza/altezza del ritaglio (1 = quadrato, mostrato tondo); out: lato lungo della foto salvata; quality: qualità JPEG
export default function PhotoCropper({ file, onDone, onCancel, aspect = 1, out = 256, quality = 0.85, title = 'Ritaglia la foto' }) {
  const VW = W;
  const VH = Math.round(W / aspect);
  const [img, setImg] = React.useState(null);
  const [zoom, setZoom] = React.useState(1);
  const [pos, setPos] = React.useState({ x: 0, y: 0 }); // angolo in alto a sinistra della foto rispetto all'area
  const [err, setErr] = React.useState(false);
  const drag = React.useRef(null);

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => {
      const s = Math.max(VW / i.width, VH / i.height);
      setImg(i);
      setPos({ x: (VW - i.width * s) / 2, y: (VH - i.height * s) / 2 });
    };
    i.onerror = () => setErr(true);
    i.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const base = img ? Math.max(VW / img.width, VH / img.height) : 1;
  const scale = base * zoom;
  const clamp = (p, sc = scale) => ({ x: Math.min(0, Math.max(VW - img.width * sc, p.x)), y: Math.min(0, Math.max(VH - img.height * sc, p.y)) });

  const changeZoom = (z) => {
    // lo zoom resta centrato sul punto che si sta guardando
    const cx = (VW / 2 - pos.x) / scale, cy = (VH / 2 - pos.y) / scale;
    const sc = base * z;
    setZoom(z);
    setPos(clamp({ x: VW / 2 - cx * sc, y: VH / 2 - cy * sc }, sc));
  };
  const down = (e) => { e.currentTarget.setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, p: pos }; };
  const move = (e) => { if (drag.current && img) setPos(clamp({ x: drag.current.p.x + e.clientX - drag.current.x, y: drag.current.p.y + e.clientY - drag.current.y })); };
  const up = () => { drag.current = null; };

  const save = () => {
    const c = document.createElement('canvas');
    c.width = aspect >= 1 ? out : Math.round(out * aspect);
    c.height = aspect >= 1 ? Math.round(out / aspect) : out;
    c.getContext('2d').drawImage(img, -pos.x / scale, -pos.y / scale, VW / scale, VH / scale, 0, 0, c.width, c.height);
    onDone(c.toDataURL('image/jpeg', quality));
  };

  return (
    <Sheet title={title} onClose={onCancel} z={90}>
      <div className="p-5 space-y-5">
        {err ? <p className="text-sm text-red-500">Non riesco a leggere questa foto.</p> : !img ? <p className="text-sm text-slate-400">Carico la foto...</p> : (
          <>
            <p className="text-sm text-slate-500">Trascina la foto e usa il cursore per ingrandirla: si vede solo la parte dentro al riquadro.</p>
            <div className="mx-auto relative overflow-hidden rounded-2xl bg-slate-900 touch-none select-none cursor-grab" style={{ width: VW, height: VH, maxWidth: '100%' }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
              <img src={img.src} alt="" draggable={false} className="absolute max-w-none pointer-events-none" style={{ left: pos.x, top: pos.y, width: img.width * scale, height: img.height * scale }} />
              <div className={`absolute inset-0 pointer-events-none ${aspect === 1 ? 'rounded-full' : ''}`} style={{ boxShadow: '0 0 0 999px rgba(0,0,0,0.55)', border: '2px solid rgba(255,255,255,0.9)' }} />
            </div>
            <label className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase">Zoom
              <input type="range" min="1" max="4" step="0.02" value={zoom} onChange={(e) => changeZoom(Number(e.target.value))} className="flex-1 accent-emerald-500" aria-label="Zoom della foto" />
            </label>
          </>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onCancel} className="py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl active:scale-95">Annulla</button>
          <button disabled={!img} onClick={save} className="py-3 bg-brand-600 text-white font-bold rounded-2xl disabled:opacity-40 active:scale-95">Usa questa foto</button>
        </div>
      </div>
    </Sheet>
  );
}
