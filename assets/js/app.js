// Portfolio de Franco Boscariol.
// Todo el contenido vive en content/*.json; este archivo solo lo dibuja.
//   content/site.json      -> portada, textos generales, sobre mi / CV, contacto, etiquetas (ui)
//   content/projects.json  -> proyectos (con o sin escena interactiva)
//   content/gallery.json   -> grilla de imagenes
//
// Hay dos vistas:
//   INICIO   una sola pagina continua: portada + sobre mi + proyectos + imagenes + contacto.
//            #/  #/about  #/projects  #/images  #/contact  llevan a esa parte con scroll.
//   PROYECTO #/projects/<slug>   y   #/projects/<slug>/<zona>
import { loadManifest, picture, ratio, esc, watchImages } from './media.js';
import { mountScene } from './scene.js';
import { mountCover } from './intro.js';
import { openViewer, closeViewer } from './viewer.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n) => String(n).padStart(2, '0');
const SECTIONS = ['about', 'projects', 'images', 'contact'];

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } },
};

const state = {
  lang: 'es', site: null, projects: [], gallery: null,
  route: null, view: null,          // view: 'home' | 'project'
  active: 'cover',                  // seccion visible del inicio
  scene: null, cover: null, filter: 'all',
  introPlayed: false, homeScroll: null,
};

/** Texto en el idioma actual. Acepta "texto" o { es: "...", en: "..." }. */
const t = (v) => (v == null ? '' : typeof v === 'string' ? v : v[state.lang] ?? v.es ?? v.en ?? '');
const ui = (k) => t(state.site.ui[k]);
const viewerLabels = () => ({ close: ui('close'), prev: ui('prev'), next: ui('next') });

async function getJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------------
// Cabecera y pie
// ---------------------------------------------------------------------------------
function renderChrome() {
  const { site } = state;
  $('.site-header').innerHTML = `
    <div class="header__id">
      <a class="brand" href="#/">${esc(site.name)}</a>
      <button class="lang" type="button" aria-label="${state.lang === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish'}" lang="${state.lang === 'es' ? 'en' : 'es'}">
        <span class="${state.lang === 'es' ? 'is-on' : ''}">ES</span><span aria-hidden="true">/</span><span class="${state.lang === 'en' ? 'is-on' : ''}">EN</span>
      </button>
    </div>
    <nav class="nav" id="nav" aria-label="${esc(ui('menu'))}">
      ${site.nav.map((n) => `<a href="#/${n.id}" data-nav="${n.id}">${esc(t(n.label))}</a>`).join('')}
    </nav>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">${esc(ui('menu'))}</button>`;
  $('.site-footer').innerHTML = `
    <span>© ${new Date().getFullYear()} ${esc(site.name)}</span>
    <span>${esc(t(site.location))}</span>
    <a href="#/" class="to-top">${esc(ui('top'))} <span aria-hidden="true">↑</span></a>`;
  $('.skip').textContent = ui('skip');

  $('.lang').addEventListener('click', () => setLang(state.lang === 'es' ? 'en' : 'es'));
  $('.menu-btn').addEventListener('click', () => toggleMenu());
  // Un clic en la seccion donde ya estoy no cambia la direccion: igual hay que hacer scroll.
  $$('.site-header a, .to-top').forEach((a) => a.addEventListener('click', () => {
    toggleMenu(false);
    if (a.getAttribute('href') === (location.hash || '#/') && state.view === 'home') goToSection(parse().page, true);
  }));
  markNav();
  updateHeader();
}

function toggleMenu(force) {
  const open = force ?? !document.documentElement.classList.contains('is-menu-open');
  document.documentElement.classList.toggle('is-menu-open', open);
  const btn = $('.menu-btn');
  if (btn) { btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? ui('close') : ui('menu'); }
}

function markNav() {
  const current = state.view === 'project' ? 'projects' : state.active;
  $$('.nav a').forEach((a) => {
    if (a.dataset.nav === current) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

/** Sobre la portada (fondo negro) la cabecera es transparente con letras blancas. */
function updateHeader() {
  const header = $('.site-header');
  const cover = $('#cover');
  header.classList.toggle('is-over-cover', !!cover && window.scrollY < cover.offsetHeight - header.offsetHeight);
}

function setLang(lang) {
  // En otro idioma los textos ocupan otro alto: se guarda la posicion relativa a la seccion
  // visible (y no el scroll absoluto) para quedar en el mismo lugar despues de redibujar.
  const y = window.scrollY;
  const anchorId = state.view === 'home' && state.active !== 'cover' ? state.active : null;
  const anchor = anchorId && document.getElementById(anchorId);
  const offset = anchor ? y - (anchor.getBoundingClientRect().top + y) : 0;
  state.lang = lang;
  store.set('lang', lang);
  document.documentElement.lang = lang;
  renderChrome();
  draw(state.route);
  const target = anchorId && document.getElementById(anchorId);
  const top = target ? target.getBoundingClientRect().top + window.scrollY + offset : y;
  window.scrollTo({ top, behavior: 'instant' });
  if (anchorId) setActive(anchorId);
  updateHeader();
  const btn = $('.lang');
  if (btn) btn.focus({ preventScroll: true });
}

// ---------------------------------------------------------------------------------
// Inicio: portada + cuatro secciones
// ---------------------------------------------------------------------------------
function coverConfig() {
  const c = state.site.cover || {};
  const last = c.image || (state.gallery.items[0] && state.gallery.items[0].img);
  const auto = state.gallery.items.map((it) => it.img);
  const flash = [...new Set([...(c.flash && c.flash.length ? c.flash : auto), ...(c.flashExtra || [])])].filter((id) => id !== last);
  // cover.ratio: [ancho, alto] del cuadro de las que pasan y del recorte inicial (ej. [3000, 3500])
  const frameRatio = Array.isArray(c.ratio) && c.ratio[1] ? c.ratio[0] / c.ratio[1] : 0;
  return { last, flash, crop: c.crop, frameRatio };
}

function viewCover() {
  const { site } = state;
  const { last } = coverConfig();
  const r = ratio(last, 1);
  const [first, ...rest] = site.name.split(' ');
  const eyebrow = t((site.cover || {}).label);
  return `
  <section class="cover" id="cover" data-section="cover" data-ratio="${r}" style="--r:${r}" aria-label="${esc(site.name)}">
    <div class="cover__bg"><div class="cover__move">${picture(last, { sizes: '100vw', alt: '', eager: true, cls: 'cover__img' })}</div></div>
    <div class="cover__flash" aria-hidden="true"></div>
    <div class="cover__content">
      <div>
        ${eyebrow ? `<p class="label cover__eyebrow">${esc(eyebrow)}</p>` : ''}
        <h1 class="cover__name"><span>${esc(first)}</span> <span>${esc(rest.join(' '))}</span></h1>
      </div>
      <p class="label cover__side">
        <span>${esc(t(site.location))}</span>
        <a href="#/about">${esc(ui('scroll'))} <span aria-hidden="true">↓</span></a>
      </p>
    </div>
  </section>`;
}

function viewAbout() {
  const { site } = state;
  const a = site.about;
  return `
  <section class="section about" id="about" data-section="about">
    <header class="page-head">
      <h2 class="display display--page">${esc(t(site.nav[0].label))}</h2>
    </header>
    <div class="about__lead">
      <figure class="about__figure" data-reveal>
        ${picture(a.image, { sizes: '(max-width: 760px) 100vw, 46vw', alt: t(a.imageCaption) })}
        <figcaption class="label">${esc(t(a.imageCaption))}</figcaption>
      </figure>
      <div class="about__intro">
        <p class="statement" data-reveal>${esc(t(a.statement))}</p>
        <div class="prose" data-reveal>${a.bio.map((p) => `<p>${esc(t(p))}</p>`).join('')}</div>
      </div>
    </div>

    <div class="cv" aria-label="CV">
      ${a.cv.map((s) => `
        <div class="cv__section" data-reveal>
          <h3 class="label">${esc(t(s.title))}</h3>
          <ul class="cv__list">
            ${s.items.map((it) => `
              <li>
                <span class="cv__period">${esc(t(it.period))}</span>
                <span class="cv__title">${esc(t(it.title))}</span>
                <span class="cv__place">${esc(t(it.place))}</span>
              </li>`).join('')}
          </ul>
        </div>`).join('')}
      <div class="cv__section" data-reveal>
        <h3 class="label">${esc(t(a.skillsTitle))}</h3>
        <p class="cv__inline">${a.skills.map((s) => `<span>${esc(s)}</span>`).join('')}</p>
      </div>
      <div class="cv__section" data-reveal>
        <h3 class="label">${esc(t(a.languagesTitle))}</h3>
        <p class="cv__inline">${a.languages.map((s) => `<span>${esc(t(s))}</span>`).join('')}</p>
      </div>
      ${a.cvPdf ? `<p class="cv__download" data-reveal><a class="link-arrow" href="${esc(a.cvPdf)}" target="_blank" rel="noopener">${esc(ui('downloadCv'))} <span aria-hidden="true">↓</span></a></p>` : ''}
    </div>
  </section>`;
}

function viewProjects() {
  return `
  <section class="section projects" id="projects" data-section="projects">
    <header class="page-head">
      <h2 class="display display--page">${esc(ui('projectsTitle'))}</h2>
      <p class="lead">${esc(ui('projectsLead'))}</p>
    </header>
    <ol class="project-grid">
      ${state.projects.map((p, i) => `
        <li class="card" data-reveal>
          <a href="#/projects/${esc(p.slug)}">
            <div class="card__media">
              ${picture(p.cover, { sizes: '(max-width: 760px) 100vw, 58vw', alt: t(p.title), fallbackRatio: p.coverRatio })}
              ${p.status ? `<span class="card__tag label">${esc(ui(p.status))}</span>` : p.scene ? `<span class="card__tag label">${esc(ui('interactive'))}</span>` : ''}
            </div>
            <div class="card__meta">
              <span class="card__n">${pad(i + 1)}</span>
              <h3 class="card__title">${esc(t(p.title))}</h3>
              <p class="card__kind label"><span>${esc(t(p.kind))}</span><span>${esc(p.year)}</span></p>
            </div>
          </a>
        </li>`).join('')}
    </ol>
  </section>`;
}

function galleryFiltered() {
  const { items } = state.gallery;
  return state.filter === 'all' ? items : items.filter((it) => it.group === state.filter);
}

function tilesHTML() {
  return galleryFiltered().map((it, k) => `
    <button type="button" class="tile zoomable" data-tile="${k}" data-reveal aria-label="${esc(t(it.title))}">
      ${picture(it.img, { sizes: '(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 33vw', alt: t(it.title) })}
      <span class="tile__cap label"><span>${esc(t(it.title))}</span><span>${esc(it.year || '')}</span></span>
    </button>`).join('');
}

function viewImages() {
  const { groups, items } = state.gallery;
  const used = groups.filter((g) => items.some((it) => it.group === g.id));
  if (!used.some((g) => g.id === state.filter)) state.filter = 'all';
  const filters = used.length > 1
    ? `<div class="filters" role="group" aria-label="${esc(ui('imagesTitle'))}">
        ${[{ id: 'all', label: state.site.ui.all }, ...used].map((g) => `<button type="button" class="label" data-filter="${g.id}" aria-pressed="${state.filter === g.id}">${esc(t(g.label))}</button>`).join('')}
       </div>`
    : '';
  return `
  <section class="section images" id="images" data-section="images">
    <header class="page-head">
      <h2 class="display display--page">${esc(ui('imagesTitle'))}</h2>
      <p class="lead">${esc(ui('imagesLead'))}</p>
      ${filters}
    </header>
    <div class="masonry">${tilesHTML()}</div>
  </section>`;
}

function viewContact() {
  const c = state.site.contact;
  const [user, domain] = c.email.split('@');
  return `
  <section class="section contact" id="contact" data-section="contact">
    <header class="page-head">
      <h2 class="display display--page">${esc(ui('contactTitle'))}</h2>
    </header>
    <div class="contact__body">
      <p class="statement" data-reveal>${esc(t(c.lead))}</p>
      <p class="contact__email" data-reveal>
        <a class="display display--email" href="mailto:${esc(c.email)}">${esc(user)}<wbr>@${esc(domain)}</a>
        <button type="button" class="copy label" data-copy="${esc(c.email)}">${esc(ui('copy'))}</button>
      </p>
      <dl class="contact__list" data-reveal>
        ${c.instagram ? `<div><dt class="label">Instagram</dt><dd><a href="https://www.instagram.com/${esc(c.instagram)}/" target="_blank" rel="noopener">@${esc(c.instagram)} <span aria-hidden="true">↗</span></a></dd></div>` : ''}
        ${c.linkedin ? `<div><dt class="label">LinkedIn</dt><dd><a href="${esc(c.linkedin)}" target="_blank" rel="noopener">LinkedIn <span aria-hidden="true">↗</span></a></dd></div>` : ''}
        ${c.phone ? `<div><dt class="label">Tel.</dt><dd><a href="tel:${esc(c.phone.replace(/\s/g, ''))}">${esc(c.phone)}</a></dd></div>` : ''}
        <div><dt class="label">${state.lang === 'es' ? 'Ubicación' : 'Location'}</dt><dd>${esc(t(state.site.location))}</dd></div>
      </dl>
    </div>
  </section>`;
}

const viewHome = () => viewCover() + viewAbout() + viewProjects() + viewImages() + viewContact();

// ---------------------------------------------------------------------------------
// Pagina de un proyecto
// ---------------------------------------------------------------------------------
const galleryItems = (p) => (p.gallery || []).map((g) => (typeof g === 'string' ? { img: g } : g));

function viewProject(p) {
  const i = state.projects.indexOf(p);
  const next = state.projects[(i + 1) % state.projects.length];
  const docs = galleryItems(p);
  return `
  <article class="project">
    <header class="project__head">
      <p class="label project__crumb"><a href="#/projects"><span aria-hidden="true">←</span> ${esc(ui('allProjects'))}</a><span>${pad(i + 1)} / ${pad(state.projects.length)}</span></p>
      <h1 class="display display--project">${esc(t(p.title))}</h1>
      <div class="project__intro">
        <p class="label project__meta">
          <span>${esc(t(p.kind))}</span><span>${esc(p.year)}</span><span>${esc(t(p.place))}</span>
          ${p.status ? `<span class="is-status">${esc(ui(p.status))}</span>` : ''}
        </p>
        <p class="statement">${esc(t(p.summary))}</p>
      </div>
    </header>

    ${p.scene
      ? '<div id="scene" class="scene"></div>'
      : `<figure class="project__cover" data-reveal>${picture(p.cover, { sizes: '100vw', alt: t(p.title), eager: true })}</figure>`}

    <div class="project__body">
      <dl class="facts" data-reveal>
        ${(p.facts || []).map((f) => `
          <div><dt class="label">${esc(t(f.label))}</dt>
          <dd>${f.href ? `<a href="${esc(f.href)}" target="_blank" rel="noopener">${esc(t(f.value))} <span aria-hidden="true">↗</span></a>` : esc(t(f.value))}</dd></div>`).join('')}
      </dl>
      <div class="prose prose--project" data-reveal>${(p.text || []).map((x) => `<p>${esc(t(x))}</p>`).join('')}</div>
    </div>

    ${docs.length ? `
    <section class="docs">
      <h2 class="label">${esc(ui('documentation'))}</h2>
      <div class="docs__grid">
        ${docs.map((d, k) => `
          <figure class="docs__item${d.wide ? ' docs__item--wide' : ''}" data-reveal>
            <button type="button" class="zoomable" data-doc="${k}" aria-label="${esc(t(d.caption) || t(p.title))}">
              ${picture(d.img, { sizes: d.wide ? '100vw' : '(max-width: 760px) 100vw, 50vw', alt: t(d.caption) || t(p.title) })}
            </button>
            ${d.caption ? `<figcaption class="label">${esc(t(d.caption))}</figcaption>` : ''}
          </figure>`).join('')}
      </div>
    </section>` : ''}

    <nav class="project__next" aria-label="${esc(ui('nextProject'))}">
      <a href="#/projects/${esc(next.slug)}">
        <span class="label">${esc(ui('nextProject'))}</span>
        <span class="display display--next">${esc(t(next.title))} <span aria-hidden="true">→</span></span>
      </a>
    </nav>
  </article>`;
}

// ---------------------------------------------------------------------------------
// Dibujo y enlaces
// ---------------------------------------------------------------------------------
let revealer = null;
let spy = null;

/** Dibuja la vista que corresponde a la ruta. `intro`: reproducir la animacion de portada. */
function draw(r, { intro = false } = {}) {
  const main = $('#main');
  if (state.scene) { state.scene.destroy(); state.scene = null; }
  if (state.cover) { state.cover.destroy(); state.cover = null; }
  if (spy) { spy.disconnect(); spy = null; }
  closeViewer(true);
  toggleMenu(false);

  const project = r.slug ? state.projects.find((p) => p.slug === r.slug) : null;
  state.view = project ? 'project' : 'home';
  main.innerHTML = project ? viewProject(project) : viewHome();
  main.dataset.page = state.view;
  document.title = project ? `${t(project.title)} — ${state.site.name}` : `${state.site.name} — ${t(state.site.role)}`;
  $('meta[name="description"]').setAttribute('content', project ? t(project.summary) : t(state.site.description));

  watchImages(main);
  if (project) bindProject(main, r, project);
  else bindHome(main, intro);
  observeReveals(main);
  markNav();
  updateHeader();
}

function bindHome(main, intro) {
  // Portada
  const cover = $('#cover', main);
  const cc = coverConfig();
  state.cover = mountCover(cover, {
    flashIds: cc.flash,
    crop: cc.crop,
    frameRatio: cc.frameRatio,
    play: intro && !state.introPlayed,
    onDone: () => { state.introPlayed = true; },
  });
  state.introPlayed = true;

  // Seccion visible -> indice activo y direccion
  state.active = 'cover';
  spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.dataset.section); });
  }, { rootMargin: '-45% 0px -54% 0px' });
  $$('[data-section]', main).forEach((s) => spy.observe(s));

  // Grilla de imagenes
  bindTiles(main);
  $$('[data-filter]', main).forEach((b) => b.addEventListener('click', () => {
    state.filter = b.dataset.filter;
    $$('[data-filter]', main).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const grid = $('.masonry', main);
    grid.innerHTML = tilesHTML();
    watchImages(grid);
    bindTiles(main);
    observeReveals(grid);
  }));

  // Copiar mail
  $$('[data-copy]', main).forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = ui('copied'); setTimeout(() => (b.textContent = ui('copy')), 1600); } catch { /* sin permiso */ }
  }));
}

function setActive(id) {
  if (state.view !== 'home' || state.active === id) return;
  state.active = id;
  markNav();
  // La direccion acompana al scroll, asi "atras" y "compartir" llevan a la parte correcta.
  const hash = id === 'cover' ? '#/' : `#/${id}`;
  if ((location.hash || '#/') !== hash) history.replaceState(null, '', hash);
  state.route = parse();
}

function bindTiles(main) {
  const items = galleryFiltered().map((it) => ({ img: it.img, caption: [t(it.title), it.year].filter(Boolean).join(', ') }));
  $$('[data-tile]', main).forEach((b) => b.addEventListener('click', () =>
    openViewer({ items, index: +b.dataset.tile, title: ui('imagesTitle'), labels: viewerLabels() })));
}

function bindProject(main, r, project) {
  if (project.scene) {
    const base = `#/projects/${project.slug}`;
    state.scene = mountScene($('#scene', main), project, {
      t, ui, edit: r.edit,
      onZone: (id) => { location.hash = id ? `${base}/${id}` : base; },
    });
    if (r.zone) requestAnimationFrame(() => state.scene && state.scene.setZone(r.zone, { animate: false }));
  }
  const docs = galleryItems(project).map((d) => ({ img: d.img, caption: t(d.caption) }));
  $$('[data-doc]', main).forEach((b) => b.addEventListener('click', () =>
    openViewer({ items: docs, index: +b.dataset.doc, title: t(project.title), labels: viewerLabels() })));
}

function observeReveals(root) {
  const els = $$('[data-reveal]', root);
  if (reduced() || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
  if (!revealer) {
    revealer = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); revealer.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  }
  els.forEach((el) => revealer.observe(el));
}

// ---------------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------------
function parse() {
  const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const page = SECTIONS.includes(parts[0]) ? parts[0] : '';
  return { page, slug: page === 'projects' ? parts[1] || '' : '', zone: parts[2] || '', edit: /(^|&)editar/.test(query) };
}

/** Lleva el scroll a una seccion del inicio ('' = portada). */
function goToSection(page, smooth) {
  const behavior = smooth && !reduced() ? 'smooth' : 'instant';
  const el = page ? document.getElementById(page) : null;
  if (el) el.scrollIntoView({ behavior, block: 'start' });
  else window.scrollTo({ top: 0, behavior });
}

function navigate() {
  const r = parse();
  const prev = state.route;
  const wasView = state.view;
  state.route = r;
  const toProject = !!(r.slug && state.projects.some((p) => p.slug === r.slug));

  // Mismo proyecto: solo cambia la zona abierta.
  if (toProject && wasView === 'project' && state.scene && prev && r.slug === prev.slug && r.edit === prev.edit) {
    state.scene.setZone(r.zone || null);
    return;
  }
  // Ya estoy en el inicio: solo scroll hasta la seccion.
  if (!toProject && wasView === 'home') {
    goToSection(r.page, true);
    return;
  }

  if (wasView === 'home' && toProject) state.homeScroll = window.scrollY;
  const first = !prev;
  const swap = () => {
    draw(r, { intro: first && !toProject && !r.page });
    if (toProject) window.scrollTo({ top: 0, behavior: 'instant' });
    else if (wasView === 'project' && r.page === 'projects' && state.homeScroll != null) window.scrollTo({ top: state.homeScroll, behavior: 'instant' });
    else goToSection(r.page, false);
    updateHeader();
    // Entrada directa a una seccion: cuando terminan de cargar las tipografias los textos cambian
    // de alto, asi que se vuelve a ubicar (solo si la persona todavia no se movio).
    if (first && !toProject && r.page && document.fonts && document.fonts.status !== 'loaded') {
      const y = window.scrollY;
      document.fonts.ready.then(() => { if (state.view === 'home' && Math.abs(window.scrollY - y) < 4) goToSection(r.page, false); });
    }
  };
  if (!first && document.startViewTransition && !reduced() && !document.hidden) {
    const vt = document.startViewTransition(swap);
    // Si el navegador cancela la transicion (pestana oculta, otra navegacion), la pagina ya cambio igual.
    [vt.ready, vt.finished, vt.updateCallbackDone].forEach((p) => p && p.catch(() => {}));
  } else swap();
}

async function start() {
  state.lang = store.get('lang') || ((navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en');
  document.documentElement.lang = state.lang;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  try {
    const [site, projects, gallery] = await Promise.all([
      getJSON('content/site.json'), getJSON('content/projects.json'), getJSON('content/gallery.json'), loadManifest(),
    ]);
    Object.assign(state, { site, projects, gallery });
  } catch (err) {
    $('#main').innerHTML = `<p class="boot-error">No se pudo cargar el contenido (${esc(err.message)}). Si abriste el archivo con doble clic, usá <code>ver-sitio.bat</code>.</p>`;
    return;
  }
  renderChrome();
  window.addEventListener('hashchange', navigate);
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateHeader);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMenu(false); });
  navigate();
  document.documentElement.classList.add('is-ready');
}

start();
