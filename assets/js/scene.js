// Escena interactiva: una imagen general del proyecto (render o axonometria) con zonas.
// Al pasar el cursor la zona se "enciende"; al hacer clic la camara se acerca y se abre
// la vista de esa parte con sus imagenes.
//
// Las zonas se definen en content/projects.json -> scene.zones[].points, como una lista
// de vertices [x, y] en PORCENTAJE de la imagen (0-100). Para dibujarlas sin calcular
// nada a mano, abrir el proyecto con  ?editar  al final de la direccion.
import { picture, ratio as imageRatio, esc, watchImages } from './media.js';
import { openViewer, closeViewer } from './viewer.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n) => String(n).padStart(2, '0');
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

export function mountScene(root, project, ctx) {
  const { t, ui } = ctx;
  const sc = project.scene;
  const zones = sc.zones || [];
  const r = imageRatio(sc.image, sc.ratio || 1.5);
  const wide = r > 1.5;
  let openId = null;
  let timer = null;

  root.className = `scene ${wide ? 'scene--wide' : 'scene--tall'}${ctx.edit ? ' is-editing' : ''}`;
  root.dataset.tone = sc.tone || 'light';
  root.style.setProperty('--r', r);
  root.style.setProperty('--mz', sc.mobileZoom || 1);   // en celulares, agranda una imagen apaisada

  const center = (z) => {
    const xs = z.points.map((p) => p[0]), ys = z.points.map((p) => p[1]);
    return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  };
  const countLabel = (z) => {
    const n = (z.images || []).length;
    return n ? `${n} ${n === 1 ? ui('image') : ui('images')}` : ui('inProgress');
  };

  root.innerHTML = `
    <div class="scene__stage">
      <div class="scene__canvas" style="aspect-ratio:${r}">
        ${picture(sc.image, {
          sizes: wide ? '(max-width: 760px) 260vw, 100vw' : '(max-width: 760px) 100vw, 62vw',
          alt: t(sc.alt) || t(project.title),
          eager: true,
          cls: 'scene__img',
          fallbackRatio: r,
        })}
        <svg class="scene__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path class="scene__dim" d="M0 0H100V100H0Z" fill-rule="evenodd"/>
          ${zones.map((z) => `<polygon class="scene__zone" data-zone="${esc(z.id)}" points="${z.points.map((p) => p.join(',')).join(' ')}"/>`).join('')}
          <polygon class="scene__draft" points=""/>
        </svg>
        ${zones.map((z, i) => {
          const [cx, cy] = center(z);
          return `<button class="scene__pin" type="button" data-zone="${esc(z.id)}" style="left:${cx}%;top:${cy}%" tabindex="-1" aria-hidden="true">${pad(i + 1)}</button>`;
        }).join('')}
      </div>
      <div class="scene__tag" aria-hidden="true"></div>
    </div>
    <div class="scene__side">
      <p class="scene__hint label"><span class="hint--mouse">${esc(ui('sceneHint'))}</span><span class="hint--touch">${esc(ui('sceneHintTouch'))}</span></p>
      <ol class="scene__index">
        ${zones.map((z, i) => `
          <li><button type="button" data-zone="${esc(z.id)}">
            <span class="scene__n">${pad(i + 1)}</span>
            <span class="scene__name">${esc(t(z.title))}</span>
            <span class="scene__count">${esc(countLabel(z))}</span>
          </button></li>`).join('')}
      </ol>
    </div>`;

  const stage = root.querySelector('.scene__stage');
  const canvas = root.querySelector('.scene__canvas');
  const svg = root.querySelector('.scene__svg');
  const dim = root.querySelector('.scene__dim');
  const tag = root.querySelector('.scene__tag');
  watchImages(root);

  // En pantallas angostas una imagen apaisada se recorre de costado: arrancar centrada.
  requestAnimationFrame(() => { stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2; });

  function highlight(id) {
    const z = zones.find((x) => x.id === id);
    root.classList.toggle('has-hover', !!z);
    root.querySelectorAll('[data-zone]').forEach((el) => el.classList.toggle('is-active', el.dataset.zone === id));
    if (z) {
      dim.setAttribute('d', `M0 0H100V100H0Z M${z.points.map((p) => p.join(' ')).join(' L')} Z`);
      tag.innerHTML = `<span>${pad(zones.indexOf(z) + 1)}</span>${esc(t(z.title))}<small>${esc(countLabel(z))}</small>`;
    }
  }

  // --- Interaccion ---------------------------------------------------------------
  root.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' || openId || ctx.edit) return;
    const el = e.target.closest('[data-zone]');
    if (el) highlight(el.dataset.zone);
  });
  root.addEventListener('pointerout', (e) => {
    if (e.pointerType !== 'mouse' || openId) return;
    const el = e.target.closest('[data-zone]');
    if (el && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(`[data-zone="${el.dataset.zone}"]`))) highlight(null);
  });
  root.addEventListener('focusin', (e) => {
    const el = e.target.closest('.scene__index [data-zone]');
    if (el && !openId) highlight(el.dataset.zone);
  });
  root.addEventListener('focusout', () => { if (!openId) highlight(null); });
  stage.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const s = stage.getBoundingClientRect();
    const x = Math.min(e.clientX - s.left + 16, s.width - tag.offsetWidth - 8);
    const y = Math.min(e.clientY - s.top + 18, s.height - tag.offsetHeight - 8);
    tag.style.transform = `translate(${x}px, ${y}px)`;
  });
  root.addEventListener('click', (e) => {
    if (ctx.edit) return;
    const el = e.target.closest('[data-zone]');
    if (el) ctx.onZone(el.dataset.zone);
  });

  // --- Camara --------------------------------------------------------------------
  function zoomTo(id, animate) {
    const poly = svg.querySelector(`.scene__zone[data-zone="${CSS.escape(id)}"]`);
    if (!poly) return;
    canvas.style.transition = 'none';
    canvas.style.transform = '';
    const b = poly.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const c = canvas.getBoundingClientRect();
    const scale = clamp(Math.min(s.width / b.width, s.height / b.height) * 0.7, 1.15, 7);
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    canvas.style.transformOrigin = `${cx - c.left}px ${cy - c.top}px`;
    void canvas.offsetWidth;
    canvas.style.transition = animate ? '' : 'none';
    canvas.style.transform = `translate(${s.left + s.width / 2 - cx}px, ${s.top + s.height / 2 - cy}px) scale(${scale})`;
    root.classList.add('is-zoomed');
  }

  function zoomOut() {
    canvas.style.transition = '';
    canvas.style.transform = '';
    root.classList.remove('is-zoomed');
    highlight(null);
  }

  function showZone(id) {
    const i = zones.findIndex((z) => z.id === id);
    const z = zones[i];
    const next = zones[(i + 1) % zones.length];
    openViewer({
      items: (z.images || []).map((img) => (typeof img === 'string' ? { img } : { img: img.img, caption: t(img.caption) })),
      title: t(z.title),
      number: pad(i + 1),
      text: t(z.text),
      backLabel: ui('backToOverview'),
      emptyText: ui('noImages'),
      labels: { close: ui('close'), prev: ui('prev'), next: ui('next') },
      action: zones.length > 1 ? { label: `${ui('nextPart')}: ${t(next.title)}`, onClick: () => ctx.onZone(next.id) } : null,
      onClose: () => ctx.onZone(null),
    });
  }

  /** Abre una zona (o vuelve a la vista general con null). Lo llama el router. */
  function setZone(id, { animate = true } = {}) {
    clearTimeout(timer);
    const z = zones.find((x) => x.id === id);
    if (!z) {
      if (openId) { openId = null; closeViewer(true); zoomOut(); }
      return;
    }
    const switching = !!openId;
    const move = animate && !switching && !reduced();
    openId = z.id;
    highlight(z.id);
    closeViewer(true);
    zoomTo(z.id, move);
    timer = setTimeout(() => showZone(z.id), move ? 560 : 0);
  }

  // --- Editor de zonas (direccion terminada en ?editar) ---------------------------
  if (ctx.edit) {
    const draft = root.querySelector('.scene__draft');
    const pts = [];
    const panel = document.createElement('div');
    panel.className = 'scene-editor';
    panel.innerHTML = `
      <p><strong>Editor de zonas.</strong> Hacé clic sobre la imagen para marcar los vértices de una parte del proyecto. Después copiá el resultado y pegalo en <code>content/projects.json</code>, dentro de la zona que corresponda.</p>
      <textarea readonly rows="3" aria-label="points"></textarea>
      <div class="scene-editor__row">
        <button type="button" data-act="undo">Deshacer punto</button>
        <button type="button" data-act="clear">Empezar otra zona</button>
        <button type="button" data-act="copy">Copiar</button>
      </div>`;
    root.appendChild(panel);
    const out = panel.querySelector('textarea');
    const draw = () => {
      draft.setAttribute('points', pts.map((p) => p.join(',')).join(' '));
      out.value = `"points": [${pts.map((p) => `[${p[0]},${p[1]}]`).join(',')}]`;
    };
    canvas.addEventListener('click', (e) => {
      const c = canvas.getBoundingClientRect();
      pts.push([+(((e.clientX - c.left) / c.width) * 100).toFixed(1), +(((e.clientY - c.top) / c.height) * 100).toFixed(1)]);
      draw();
    });
    panel.addEventListener('click', (e) => {
      const act = e.target.dataset && e.target.dataset.act;
      if (act === 'undo') pts.pop();
      if (act === 'clear') pts.length = 0;
      if (act === 'copy') navigator.clipboard?.writeText(out.value).then(() => { e.target.textContent = 'Copiado'; setTimeout(() => (e.target.textContent = 'Copiar'), 1200); });
      draw();
    });
    draw();
  }

  return {
    setZone,
    destroy() { clearTimeout(timer); closeViewer(true); },
  };
}
