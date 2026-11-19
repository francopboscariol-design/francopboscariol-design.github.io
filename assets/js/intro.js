// Portada animada.
// 1) pasan los renders en el centro de la pantalla negra, todos en un mismo cuadro chico
//    (proporcion fija, cover.ratio en site.json); el ultimo es la imagen final recortada
// 2) ese cuadro se agranda hasta cubrir la pantalla y, al mismo tiempo, se va abriendo el
//    recorte hasta mostrar la imagen completa y se va desenfocando
// 3) aparece el nombre; desde ahi el fondo sigue suavemente al mouse
// Fases (atributo data-phase de .cover):  load -> flash -> last -> expand -> rest
// Que imagenes pasan, cual es la final y su recorte se define en content/site.json -> "cover".
import { src } from './media.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const TOTAL_FLASH = 3000;   // ms que tardan en pasar todas las imagenes (las que pasan + la final)
const EXPAND = 2200;        // ms de la ampliacion (igual que --expand en el CSS)
const MOVE = 0.05;          // recorrido total del fondo con el mouse (fraccion del tamano de la imagen):
                            // 0.05 = 2,5 % hacia cada lado; asi la imagen se agranda poco y se ve casi entera
const EDGE = 24;            // px de imagen de sobra en cada borde (tapa el borde del desenfoque)
const SMOOTH = 0.06;        // suavizado del movimiento (0 = quieto, 1 = sin suavizado)

/**
 * Ajusta el recorte [x0, y0, x1, y1] (fracciones) a la proporcion `fr` (ancho / alto) sin moverle
 * el centro: lo agranda en el sentido que haga falta y, si se sale de la imagen, lo corre.
 */
function fitCrop([x0, y0, x1, y1], r, fr) {
  if (!fr) return [x0, y0, x1, y1];
  let w = (x1 - x0) * r, h = y1 - y0;          // en unidades del alto de la imagen
  if (w / h < fr) w = h * fr; else h = w / fr;
  const k = Math.min(1, r / w, 1 / h);           // si no entra en la imagen, se achica
  w *= k; h *= k;
  const fw = w / r;                              // ancho en fraccion
  const cx = Math.min(Math.max((x0 + x1) / 2, fw / 2), 1 - fw / 2);
  const cy = Math.min(Math.max((y0 + y1) / 2, h / 2), 1 - h / 2);
  return [cx - fw / 2, cy - h / 2, cx + fw / 2, cy + h / 2];
}

/**
 * @param {HTMLElement} cover   la seccion .cover
 * @param {object} o
 * @param {string[]} o.flashIds ids de las imagenes que pasan (sin la final)
 * @param {number[]} [o.crop]   zona de la imagen final que se ve al principio: [izq, arriba, der, abajo] en %
 * @param {number}   [o.frameRatio] proporcion (ancho / alto) del cuadro de las que pasan y del recorte
 * @param {boolean} o.play      false = mostrar directamente el estado final
 * @param {Function} [o.onDone]
 */
export function mountCover(cover, { flashIds = [], crop, frameRatio, play = true, onDone } = {}) {
  const root = document.documentElement;
  const img = cover.querySelector('.cover__img');
  const mover = cover.querySelector('.cover__move');
  const stage = cover.querySelector('.cover__flash');
  const r = Number(cover.dataset.ratio) || 1;
  const raw = Array.isArray(crop) && crop.length === 4
    ? crop.map((v) => Math.min(Math.max(Number(v) / 100, 0), 1))
    : [0, 0, 1, 1];
  const [x0, y0, x1, y1] = fitCrop(raw, r, frameRatio > 0 ? frameRatio : 0);
  const cropR = ((x1 - x0) * r) / Math.max(y1 - y0, 0.01);   // proporcion del recorte (ancho / alto)
  let done = false;
  let maxX = 0, maxY = 0;                                       // desplazamiento maximo con el mouse, en px

  // Medidas del estado inicial (cuadro chico con el recorte) y del final (imagen completa).
  const layout = () => {
    const vw = cover.clientWidth || window.innerWidth;
    const vh = cover.clientHeight || window.innerHeight;
    const iw = Math.max(vw, vh * r), ih = iw / r;              // imagen final cubriendo la pantalla
    const fh = Math.min(vh * 0.52, (vw * 0.62) / cropR);       // alto del cuadro chico
    const fw = fh * cropR;
    const k = fh / ((y1 - y0) * ih);                           // escala para que el recorte llene el cuadro
    const set = (n, v) => cover.style.setProperty(n, v);
    set('--iw', `${iw.toFixed(1)}px`);
    set('--fw', `${fw.toFixed(1)}px`);
    set('--fh', `${fh.toFixed(1)}px`);
    set('--s0', k.toFixed(4));
    set('--tx0', `${(-k * ((x0 + x1) / 2 - 0.5) * iw).toFixed(1)}px`);
    set('--ty0', `${(-k * ((y0 + y1) / 2 - 0.5) * ih).toFixed(1)}px`);
    set('--cx0', `${((vw - fw) / 2).toFixed(1)}px`);
    set('--cy0', `${((vh - fh) / 2).toFixed(1)}px`);

    // Estado final: la imagen completa, centrada como la foto, y agrandada lo justo para que,
    // movida hasta el maximo con el mouse, nunca deje ver el fondo negro.
    // En pantallas verticales (celular) se ve solo una franja: ahi se corre hacia el recorte
    // para que la torre quede a la vista y no fuera de cuadro.
    const m = finePointer() && !reduced() ? MOVE / 2 : 0;
    const S = Math.max(1.06, (vw + 2 * EDGE) / ((1 - 2 * m) * iw), (vh + 2 * EDGE) / ((1 - 2 * m) * ih));
    maxX = m * iw * S;
    maxY = m * ih * S;
    const portrait = vh > vw;
    const toward = (c, size, view, mv) => {
      if (!portrait) return 0;
      const max = Math.max((size * S - view) / 2 - mv - EDGE, 0);
      return Math.min(Math.max(-(c - 0.5) * size * S, -max), max);
    };
    set('--s1', S.toFixed(4));
    set('--tx1', `${toward((x0 + x1) / 2, iw, vw, maxX).toFixed(1)}px`);
    set('--ty1', `${toward((y0 + y1) / 2, ih, vh, maxY).toFixed(1)}px`);
  };
  layout();
  window.addEventListener('resize', layout);

  // ---- Fondo que sigue al mouse (solo con mouse, sin reduced-motion y con la portada a la vista)
  let goalX = 0, goalY = 0, curX = 0, curY = 0, raf = 0, visible = true;
  const tick = () => {
    curX += (goalX - curX) * SMOOTH;
    curY += (goalY - curY) * SMOOTH;
    if (Math.abs(goalX - curX) < 0.05 && Math.abs(goalY - curY) < 0.05) { curX = goalX; curY = goalY; raf = 0; }
    else raf = requestAnimationFrame(tick);
    if (mover) mover.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0)`;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const onMove = (e) => {
    if (!done || !visible || !finePointer() || reduced()) return;
    goalX = (e.clientX / window.innerWidth - 0.5) * 2 * maxX;
    goalY = (e.clientY / window.innerHeight - 0.5) * 2 * maxY;
    kick();
  };
  const onLeave = () => { goalX = 0; goalY = 0; kick(); };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (!visible) { cancelAnimationFrame(raf); raf = 0; }
    })
    : null;
  if (io) io.observe(cover);

  const skipEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
  const skip = () => finish(false);

  function finish(instant) {
    if (done) return;
    done = true;
    skipEvents.forEach((e) => window.removeEventListener(e, skip));
    cover.classList.toggle('no-anim', !!instant);
    cover.dataset.phase = 'rest';
    root.classList.remove('is-intro');
    stage.innerHTML = '';
    if (onDone) onDone();
  }

  const destroy = () => {
    window.removeEventListener('resize', layout);
    window.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    if (io) io.disconnect();
    cancelAnimationFrame(raf);
    finish(true);
  };

  if (!play || reduced() || !img) {
    finish(true);
    return { skip() {}, destroy };
  }

  root.classList.add('is-intro');
  cover.dataset.phase = 'load';
  layout();
  skipEvents.forEach((e) => window.addEventListener(e, skip, { passive: true }));

  (async () => {
    // Precarga de las que pasan y de la imagen final.
    stage.innerHTML = flashIds.map((id) => src(id, 960)).filter(Boolean)
      .map((u) => `<img src="${u}" alt="" decoding="async">`).join('');
    const pending = [...stage.querySelectorAll('img'), img].map((el) =>
      el.complete ? Promise.resolve() : new Promise((res) => {
        el.addEventListener('load', res, { once: true });
        el.addEventListener('error', res, { once: true });
      }));
    await Promise.race([Promise.all(pending), wait(4000)]);
    if (done) return;

    const frames = [...stage.querySelectorAll('img')].filter((el) => el.complete && el.naturalWidth);
    const each = TOTAL_FLASH / (frames.length + 1);   // la final cuenta como una mas
    cover.dataset.phase = 'flash';
    for (let i = 0; i < frames.length; i++) {
      if (done) return;
      if (i) frames[i - 1].classList.remove('is-on');
      frames[i].classList.add('is-on');
      await wait(each);
    }
    if (done) return;
    cover.dataset.phase = 'last';       // la imagen final, recortada, en el mismo cuadro
    if (frames.length) frames[frames.length - 1].classList.remove('is-on');
    await wait(each);
    if (done) return;
    cover.dataset.phase = 'expand';     // crece, se abre el recorte y se desenfoca a la vez
    await wait(EXPAND);
    finish(false);                      // aparece el nombre
  })();

  return { skip, destroy };
}
