// Visor de imagenes a pantalla completa. Se usa como lightbox (grilla, documentacion)
// y como "vista" de cada parte de un proyecto interactivo.
import { picture, src, esc, watchImages } from './media.js';

let current = null;

/**
 * @param {object} o
 * @param {{img:string, caption?:string}[]} o.items
 * @param {number} [o.index]
 * @param {string} [o.title]      texto en la barra superior
 * @param {string} [o.number]     numero chico antes del titulo (ej. "01")
 * @param {string} [o.text]       parrafo opcional al pie
 * @param {string} [o.backLabel]  si existe, el boton de cerrar dice "<- backLabel"
 * @param {{label:string, onClick:Function}} [o.action]  boton extra al pie (ej. "Siguiente parte")
 * @param {string} [o.emptyText]  mensaje cuando no hay imagenes
 * @param {object} o.labels       {close, prev, next}
 * @param {Function} [o.onClose]
 */
export function openViewer(o) {
  closeViewer(true);
  const items = o.items || [];
  let index = Math.min(Math.max(o.index || 0, 0), Math.max(items.length - 1, 0));
  const opener = document.activeElement;

  const el = document.createElement('div');
  el.className = 'viewer';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', o.title || o.labels.close);
  el.innerHTML = `
    <div class="viewer__bar">
      <button class="viewer__close" type="button">
        ${o.backLabel ? `<span aria-hidden="true">←</span> ${esc(o.backLabel)}` : `${esc(o.labels.close)} <span aria-hidden="true">✕</span>`}
      </button>
      <p class="viewer__title">${o.number ? `<span class="viewer__num">${esc(o.number)}</span>` : ''}${esc(o.title || '')}</p>
      <p class="viewer__count" aria-live="polite"></p>
    </div>
    <div class="viewer__stage">
      ${items.length > 1 ? `<button class="viewer__nav viewer__nav--prev" type="button" aria-label="${esc(o.labels.prev)}"><span aria-hidden="true">←</span></button>` : ''}
      <figure class="viewer__fig"></figure>
      ${items.length > 1 ? `<button class="viewer__nav viewer__nav--next" type="button" aria-label="${esc(o.labels.next)}"><span aria-hidden="true">→</span></button>` : ''}
    </div>
    <div class="viewer__foot">
      <p class="viewer__caption"></p>
      ${items.length > 1 ? `<div class="viewer__thumbs">${items
        .map((it, i) => `<button type="button" class="viewer__thumb" data-i="${i}" aria-label="${i + 1}"><img src="${src(it.img, 200)}" alt="" loading="lazy"></button>`)
        .join('')}</div>` : '<span></span>'}
      ${o.action ? `<button class="viewer__action" type="button">${esc(o.action.label)} <span aria-hidden="true">→</span></button>` : '<span></span>'}
    </div>`;

  const fig = el.querySelector('.viewer__fig');
  const count = el.querySelector('.viewer__count');
  const caption = el.querySelector('.viewer__caption');

  function show(i) {
    if (!items.length) {
      fig.innerHTML = `<p class="viewer__empty">${esc(o.emptyText || '')}</p>`;
      caption.textContent = o.text || '';
      return;
    }
    index = (i + items.length) % items.length;
    const it = items[index];
    fig.innerHTML = picture(it.img, { sizes: '100vw', alt: it.caption || o.title || '', eager: true, cls: 'viewer__img' });
    watchImages(fig);
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    caption.textContent = [it.caption, o.text].filter(Boolean).join(' — ');
    el.querySelectorAll('.viewer__thumb').forEach((t, k) => t.classList.toggle('is-current', k === index));
    // precarga la siguiente
    const nxt = items[(index + 1) % items.length];
    if (nxt && items.length > 1) new Image().src = src(nxt.img, Math.min(window.innerWidth * (window.devicePixelRatio || 1), 2400));
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight' && items.length > 1) show(index + 1);
    else if (e.key === 'ArrowLeft' && items.length > 1) show(index - 1);
    else if (e.key === 'Tab') {
      const f = [...el.querySelectorAll('button')];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  let closed = false;
  function close(silent) {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    document.documentElement.classList.remove('has-viewer');
    el.classList.remove('is-open');
    const remove = () => el.remove();
    if (silent) remove();
    else { el.addEventListener('transitionend', remove, { once: true }); setTimeout(remove, 500); }
    current = null;
    if (!silent) {
      if (opener && opener.focus && document.contains(opener)) opener.focus({ preventScroll: true });
      o.onClose && o.onClose();
    }
  }

  el.querySelector('.viewer__close').addEventListener('click', () => close());
  el.querySelector('.viewer__nav--prev')?.addEventListener('click', () => show(index - 1));
  el.querySelector('.viewer__nav--next')?.addEventListener('click', () => show(index + 1));
  el.querySelector('.viewer__action')?.addEventListener('click', () => o.action.onClick());
  el.querySelectorAll('.viewer__thumb').forEach((t) => t.addEventListener('click', () => show(+t.dataset.i)));
  fig.addEventListener('click', (e) => {
    if (items.length < 2) return;
    const r = fig.getBoundingClientRect();
    show(index + (e.clientX - r.left > r.width / 2 ? 1 : -1));
  });

  // deslizar en pantallas tactiles
  let x0 = null;
  fig.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  fig.addEventListener('touchend', (e) => {
    if (x0 == null || items.length < 2) return;
    const dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50) { e.preventDefault(); show(index + (dx < 0 ? 1 : -1)); }
  });

  document.body.appendChild(el);
  document.documentElement.classList.add('has-viewer');
  document.addEventListener('keydown', onKey);
  show(index);
  requestAnimationFrame(() => {
    el.classList.add('is-open');
    el.querySelector('.viewer__close').focus({ preventScroll: true });
  });

  current = { close };
  return current;
}

export function closeViewer(silent = false) {
  if (current) current.close(silent);
}
