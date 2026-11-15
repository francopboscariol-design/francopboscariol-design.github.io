# Portfolio de Franco Boscariol

Sitio estático del portfolio de Franco Boscariol (arquitecto, UTDT 2025; trabaja en el estudio de
visualización ethandeclerk). Hablar con Franco en español rioplatense. No es programador: explicar
los cambios en términos de lo que se ve, y preferir tocar `content/*.json` antes que el código.

## Cómo está armado

Sin framework ni paso de build: HTML + CSS + módulos JS que leen JSON. Se publica tal cual.

```
index.html                 esqueleto (cabecera, <main>, pie); carga assets/js/app.js
assets/css/styles.css      todos los estilos (índice numerado arriba del archivo)
assets/js/app.js           rutas, idioma, y una función view*() por página
assets/js/scene.js         escena interactiva (zonas, zoom, editor ?editar)
assets/js/viewer.js        visor a pantalla completa (lightbox y vista de cada zona)
assets/js/media.js         arma <img> con srcset a partir de media/manifest.json
content/site.json          nombre, navegación, Sobre mí + CV, contacto, textos de interfaz (ui)
content/projects.json      proyectos, en el orden en que se muestran
content/gallery.json       grilla de Imágenes (grupos: studio / freelance)
media/                     imágenes optimizadas (.webp) + manifest.json  -> GENERADO, no editar a mano
_originales/               originales pesados (no se suben a Git); una carpeta por proyecto
tools/imagenes.py          _originales/ -> media/  (Python + Pillow, ya instalados)
DESIGN.md                  sistema visual: leerlo antes de tocar estilos
COMO-ACTUALIZAR.md         guía para Franco, paso a paso
```

Rutas (hash): `#/about` (inicio), `#/projects`, `#/projects/<slug>`, `#/projects/<slug>/<zona>`,
`#/images`, `#/contact`. Agregar `?editar` a la ruta de un proyecto abre el editor de zonas.

## Reglas de contenido

- Todo texto visible es `"texto"` o `{ "es": "...", "en": "..." }`. Siempre cargar los dos idiomas.
- Una imagen se nombra por su **id**: `carpeta/nombre` sin extensión (ej. `re-casino/render-naval`).
  Para agregar una: copiar el original a `_originales/<carpeta>/`, correr `py -X utf8 tools/imagenes.py`
  y usar el id en el JSON. Un id que no existe se dibuja como un bloque gris con el id escrito.
- Proyecto interactivo = tiene `scene` { image, tone (`light` para dibujos, `dark` para renders),
  zones[] }. Cada zona: `id`, `title`, `text`, `points` (vértices `[x, y]` en % de la imagen) e
  `images` (ids). Sin `scene`, el proyecto muestra `cover` a todo el ancho.
- No inventar datos biográficos, fechas ni créditos. Si falta algo, preguntarle a Franco.

## Probar

`ver-sitio.bat` (o `py -m http.server 4173`) y abrir http://localhost:4173/. No funciona con doble
clic sobre index.html (los módulos y el JSON necesitan servidor). En esta app, `preview_start` con
el nombre `portfolio` usa `.claude/launch.json`. Revisar siempre a 1440 px y a 375 px, en ES y EN,
y abrir al menos una zona de una escena.

## Pendientes conocidos (noviembre 2026)

1. **Zonas de RE: Casino**: están ubicadas a ojo sobre la axonometría. Falta que Franco confirme qué
   edificio es el «Club» (hoy apunta a las canchas, entre el edificio naranja y la pirámide verde) y
   si quiere zonas para el Casino y las Terrazas. Los textos de cada zona (`text`) están vacíos; los
   capítulos están en el libro de tesis (`E:\Franquito\01_Facu\06_Sexto Año\01_Tesis\UTDT_EAEU_2025_TesProy_G01_Re Casino.pdf`).
2. **Cabañas en Jujuy**: es un lugar reservado. `assets/img/cabanas-provisorio.svg` y sus tres zonas
   son provisorios; reemplazar por el render o la axonometría real y redibujar las zonas.
3. **La ciudad cubierta**: el segundo párrafo de `text` (nave de manufactura y logística, uso de IA)
   lo redactó Claude a partir del programa del curso y las imágenes; Franco tiene que validarlo.
4. **CV**: «3ds Max» y «Corona Renderer» se agregaron porque aparecen en sus archivos, no estaban en
   su CV. La fecha de ingreso a ethandeclerk no está (figura «Actualidad»). `about.cvPdf` está vacío:
   poniendo ahí la ruta de un PDF aparece el botón de descarga.
5. **Imágenes**: los tres trabajos cargados son particulares (`freelance`). Cuando haya imágenes del
   estudio se cargan con `"group": "studio"` y el filtro Todo / Estudio / Particular aparece solo.
   Antes de publicar trabajo del estudio, confirmar que Franco tiene permiso.
6. **Publicación**: destino elegido, GitHub Pages. Ver el estado en COMO-ACTUALIZAR.md.

## Skills instaladas en `.claude/skills/`

- `impeccable` — crítica, pulido, tipografía, animación. Usar sus comandos (`polish`, `audit`,
  `typeset`, `animate`, `adapt`) para refinar; este sitio es modo «Experience».
- `web-design-guidelines` — auditoría de accesibilidad y buenas prácticas de interfaz.
- `playwright-cli` — automatización de navegador (Node.js y `@playwright/cli` ya están instalados).

No se instaló Taste Skill: está pensada para páginas de empresas (sus reglas prohíben epígrafes,
imponen su propio kit y una sección por pantalla) y agrega un hook que ejecuta sus scripts al
terminar cada turno. No reconstruir el sitio con un kit o un framework sin que Franco lo pida.
