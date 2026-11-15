// Portfolio de Franco Boscariol.
// Todo el contenido vive en content/*.json; este archivo solo lo dibuja.
//   content/site.json      -> textos generales, sobre mi / CV, contacto, etiquetas de la interfaz
//   content/projects.json  -> proyectos (con o sin escena interactiva)
//   content/gallery.json   -> grilla de imagenes
// Rutas:  #/about  #/projects  #/projects/<slug>  #/projects/<slug>/<zona>  #/images  #/contact
import { loadManifest, picture, esc, watchImages } from './media.js';
import { mountScene } from './scene.js';
import { openViewer, closeViewer } from './viewer.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n) => String(n).padStart(2, '0');

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } },
};

const state = { lang: 'es', site: null, projects: [], gallery: null, route: null, scene: null, filter: 'all' };

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
    <a class="brand" href="#/about">${esc(site.name)}</a>
    <nav class="nav" id="nav" aria-label="${esc(ui('menu'))}">
      ${site.nav.map((n, i) => `<a href="#/${n.id}" data-nav="${n.id}"><span class="nav__n">${pad(i + 1)}</span>${esc(t(n.label))}</a>`).join('')}
    </nav>
    <div class="header__tools">
      <button class="lang" type="button" aria-label="Idioma / Language">
        <span class="${state.lang === 'es' ? 'is-on' : ''}">ES</span><span aria-hidden="true">/</span><span class="${state.lang === 'en' ? 'is-on' : ''}">EN</span>
      </button>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">${esc(ui('menu'))}</button>
    </div>`;
  $('.site-footer').innerHTML = `
    <span>© ${new Date().getFullYear()} ${esc(site.name)}</span>
    <span>${esc(t(site.location))}</span>
    <a href="#top" class="to-top">${esc(ui('top'))} <span aria-hidden="true">↑</span></a>`;
  $('.skip').textContent = ui('skip');

  $('.lang').addEventListener('click', () => setLang(state.lang === 'es' ? 'en' : 'es'));
  $('.menu-btn').addEventListener('click', () => toggleMenu());
  $('.to-top').addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }); });
  markNav();
}

function toggleMenu(force) {
  const open = force ?? !document.documentElement.classList.contains('is-menu-open');
  document.documentElement.classList.toggle('is-menu-open', open);
  const btn = $('.menu-btn');
  if (btn) { btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? ui('close') : ui('menu'); }
}

function markNav() {
  const page = state.route ? state.route.page : '';
  $$('.nav a').forEach((a) => {
    if (a.dataset.nav === page) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function setLang(lang) {
  state.lang = lang;
  store.set('lang', lang);
  document.documentElement.lang = lang;
  renderChrome();
  draw(state.route);
}

// ---------------------------------------------------------------------------------
// Vistas
// ---------------------------------------------------------------------------------
function viewAbout() {
  const { site } = state;
  const a = site.about;
  const [first, ...rest] = site.name.split(' ');
  return `
  <section class="about">
    <header class="about__hero">
      <h1 class="display display--hero"><span>${esc(first)}</span> <em>${esc(rest.join(' '))}</em></h1>
      <p class="label about__role"><span>${esc(t(site.role))}</span><span>${esc(t(site.location))}</span></p>
    </header>

    <div class="about__lead">
      <figure class="about__figure" data-reveal>
        ${picture(a.image, { sizes: '(max-width: 760px) 100vw, 46vw', alt: t(a.imageCaption), eager: true })}
        <figcaption class="label">${esc(t(a.imageCaption))}</figcaption>
      </figure>
      <div class="about__intro">
        <p class="statement" data-reveal>${esc(t(a.statement))}</p>
        <div class="prose" data-reveal>${a.bio.map((p) => `<p>${esc(t(p))}</p>`).join('')}</div>
        <p class="about__links" data-reveal>
          <a class="link-arrow" href="#/projects">${esc(t(site.nav[1].label))} <span aria-hidden="true">→</span></a>
          <a class="link-arrow" href="#/images">${esc(t(site.nav[2].label))} <span aria-hidden="true">→</span></a>
        </p>
      </div>
    </div>

    <section class="cv" aria-label="CV">
      ${a.cv.map((s) => `
        <div class="cv__section" data-reveal>
          <h2 class="label">${esc(t(s.title))}</h2>
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
        <h2 class="label">${esc(t(a.skillsTitle))}</h2>
        <p class="cv__inline">${a.skills.map((s) => `<span>${esc(s)}</span>`).join('')}</p>
      </div>
      <div class="cv__section" data-reveal>
        <h2 class="label">${esc(t(a.languagesTitle))}</h2>
        <p class="cv__inline">${a.languages.map((s) => `<span>${esc(t(s))}</span>`).join('')}</p>
      </div>
      ${a.cvPdf ? `<p class="cv__download" data-reveal><a class="link-arrow" href="${esc(a.cvPdf)}" target="_blank" rel="noopener">${esc(ui('downloadCv'))} <span aria-hidden="true">↓</span></a></p>` : ''}
    </section>
  </section>`;
}

function viewProjects() {
  return `
  <section class="projects">
    <header class="page-head">
      <h1 class="display display--page">${esc(ui('projectsTitle'))}</h1>
      <p class="lead">${esc(ui('projectsLead'))}</p>
    </header>
    <ol class="project-grid">
      ${state.projects.map((p, i) => `
        <li class="card" data-reveal>
          <a href="#/projects/${esc(p.slug)}">
            <div class="card__media">
              ${picture(p.cover, { sizes: '(max-width: 760px) 100vw, 58vw', alt: t(p.title), eager: i < 2, fallbackRatio: p.coverRatio })}
              ${p.status ? `<span class="card__tag label">${esc(ui(p.status))}</span>` : p.scene ? `<span class="card__tag label">${esc(ui('interactive'))}</span>` : ''}
            </div>
            <div class="card__meta">
              <span class="card__n">${pad(i + 1)}</span>
              <h2 class="card__title">${esc(t(p.title))}</h2>
              <p class="card__kind label"><span>${esc(t(p.kind))}</span><span>${esc(p.year)}</span></p>
            </div>
          </a>
        </li>`).join('')}
    </ol>
  </section>`;
}

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

function galleryFiltered() {
  const { items } = state.gallery;
  return state.filter === 'all' ? items : items.filter((it) => it.group === state.filter);
}

function tilesHTML() {
  return galleryFiltered().map((it, k) => `
    <button type="button" class="tile zoomable" data-tile="${k}" data-reveal aria-label="${esc(t(it.title))}">
      ${picture(it.img, { sizes: '(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 33vw', alt: t(it.title), eager: k < 3 })}
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
  <section class="images">
    <header class="page-head">
      <h1 class="display display--page">${esc(ui('imagesTitle'))}</h1>
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
  <section class="contact">
    <h1 class="label">${esc(ui('contactTitle'))}</h1>
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
  </section>`;
}

const viewNotFound = () => `
  <section class="contact"><p class="statement">${esc(ui('notFound'))}</p>
  <p><a class="link-arrow" href="#/projects">${esc(ui('allProjects'))} <span aria-hidden="true">→</span></a></p></section>`;

// ---------------------------------------------------------------------------------
// Dibujo y enlaces de cada vista
// ---------------------------------------------------------------------------------
let revealer = null;

function draw(r) {
  const main = $('#main');
  if (state.scene) { state.scene.destroy(); state.scene = null; }
  closeViewer(true);
  toggleMenu(false);

  const project = r.page === 'projects' && r.slug ? state.projects.find((p) => p.slug === r.slug) : null;
  let html;
  let title = '';
  if (r.page === 'about') html = viewAbout();
  else if (r.page === 'projects' && !r.slug) { html = viewProjects(); title = ui('projectsTitle'); }
  else if (project) { html = viewProject(project); title = t(project.title); }
  else if (r.page === 'images') { html = viewImages(); title = ui('imagesTitle'); }
  else if (r.page === 'contact') { html = viewContact(); title = ui('contactTitle'); }
  else html = viewNotFound();

  main.innerHTML = html;
  main.dataset.page = project ? 'project' : r.page;
  document.title = `${title ? `${title} — ` : ''}${state.site.name}${title ? '' : ` — ${t(state.site.role)}`}`;
  $('meta[name="description"]').setAttribute('content', project ? t(project.summary) : t(state.site.description));
  markNav();
  watchImages(main);
  bind(main, r, project);
  observeReveals(main);
}

function bind(main, r, project) {
  // Escena interactiva
  if (project && project.scene) {
    const base = `#/projects/${project.slug}`;
    state.scene = mountScene($('#scene', main), project, {
      t, ui, edit: r.edit,
      onZone: (id) => { location.hash = id ? `${base}/${id}` : base; },
    });
    if (r.zone) requestAnimationFrame(() => state.scene && state.scene.setZone(r.zone, { animate: false }));
  }
  // Documentacion del proyecto -> visor
  if (project) {
    const docs = galleryItems(project).map((d) => ({ img: d.img, caption: t(d.caption) }));
    $$('[data-doc]', main).forEach((b) => b.addEventListener('click', () =>
      openViewer({ items: docs, index: +b.dataset.doc, title: t(project.title), labels: viewerLabels() })));
  }
  // Grilla de imagenes
  if (r.page === 'images') {
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
  }
  // Copiar mail
  $$('[data-copy]', main).forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = ui('copied'); setTimeout(() => (b.textContent = ui('copy')), 1600); } catch { /* sin permiso */ }
  }));
}

function bindTiles(main) {
  const items = galleryFiltered().map((it) => ({ img: it.img, caption: [t(it.title), it.year].filter(Boolean).join(', ') }));
  $$('[data-tile]', main).forEach((b) => b.addEventListener('click', () =>
    openViewer({ items, index: +b.dataset.tile, title: ui('imagesTitle'), labels: viewerLabels() })));
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
  return { page: parts[0] || 'about', slug: parts[1] || '', zone: parts[2] || '', edit: /(^|&)editar/.test(query) };
}

function navigate() {
  if (location.hash === '#top') return;
  const r = parse();
  const prev = state.route;
  state.route = r;

  // Mismo proyecto: solo cambia la zona abierta, sin redibujar la pagina.
  if (prev && state.scene && r.page === 'projects' && prev.page === 'projects' && r.slug === prev.slug && r.edit === prev.edit) {
    state.scene.setZone(r.zone || null);
    return;
  }

  const swap = () => { draw(r); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); };
  if (prev && document.startViewTransition && !reduced() && !document.hidden) {
    const vt = document.startViewTransition(swap);
    // Si el navegador cancela la transicion (pestana oculta, otra navegacion), la pagina ya cambio igual.
    [vt.ready, vt.finished, vt.updateCallbackDone].forEach((p) => p && p.catch(() => {}));
  } else swap();
}

async function start() {
  state.lang = store.get('lang') || ((navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en');
  document.documentElement.lang = state.lang;
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
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMenu(false); });
  navigate();
  document.documentElement.classList.add('is-ready');
}

start();
