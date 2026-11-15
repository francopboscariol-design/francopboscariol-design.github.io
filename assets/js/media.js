// Imagenes: lee media/manifest.json (lo genera tools/imagenes.py) y arma <img> con srcset.
// Un "id" de imagen es  carpeta/nombre  (sin extension), por ejemplo  re-casino/render-naval.
// Tambien se acepta una ruta directa a un archivo (ej. assets/img/algo.svg).

let manifest = {};

export async function loadManifest() {
  try {
    const res = await fetch('media/manifest.json', { cache: 'no-cache' });
    manifest = res.ok ? await res.json() : {};
  } catch {
    manifest = {};
  }
}

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const isPath = (id) => /\.(svg|png|jpe?g|webp|gif|avif)$/i.test(id || '');

export function info(id) {
  return manifest[id] || null;
}

/** Proporcion ancho/alto de una imagen (o `fallback` si no se conoce). */
export function ratio(id, fallback = 1.5) {
  const m = manifest[id];
  return m ? m.w / m.h : fallback;
}

/** URL de la version cuyo ancho es >= w (o la mas grande). */
export function src(id, w = 960) {
  const m = manifest[id];
  if (!m) return isPath(id) ? id : '';
  const size = m.sizes.find((s) => s >= w) ?? m.sizes[m.sizes.length - 1];
  return `media/${id}-${size}.webp`;
}

/** Devuelve el HTML de un <img> responsive. */
export function picture(id, { sizes = '100vw', alt = '', eager = false, cls = '', fallbackRatio } = {}) {
  const m = manifest[id];
  const load = eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
  if (m) {
    const srcset = m.sizes.map((s) => `media/${id}-${s}.webp ${s}w`).join(', ');
    return `<img class="${cls}" src="${src(id, 960)}" srcset="${srcset}" sizes="${sizes}" width="${m.w}" height="${m.h}" alt="${esc(alt)}" ${load} decoding="async">`;
  }
  if (isPath(id)) {
    const r = fallbackRatio || 1.5;
    return `<img class="${cls}" src="${esc(id)}" width="${Math.round(1000 * r)}" height="1000" alt="${esc(alt)}" ${load} decoding="async">`;
  }
  // Imagen que todavia no existe en media/: bloque neutro con el id, para que se note que falta.
  return `<span class="ph ${cls}" role="img" aria-label="${esc(alt)}"><span>${esc(id || 'sin imagen')}</span></span>`;
}

/** Marca las imagenes como cargadas para el fundido de entrada. */
export function watchImages(root = document) {
  root.querySelectorAll('img:not([data-w])').forEach((img) => {
    img.dataset.w = '1';
    const done = () => img.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) done();
    else {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    }
  });
}
