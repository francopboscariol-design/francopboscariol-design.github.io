# Portfolio de Franco Boscariol

Sitio estático del portfolio de Franco Boscariol (arquitecto, UTDT 2025; trabaja en el estudio de
visualización ethandeclerk). Hablar con Franco en español rioplatense. No es programador: explicar
los cambios en términos de lo que se ve, y preferir tocar `content/*.json` antes que el código.

## Cómo está armado

Sin framework ni paso de build: HTML + CSS + módulos JS que leen JSON. Se publica tal cual.

```
index.html                 esqueleto (cabecera, <main>, pie); carga assets/js/app.js
assets/css/styles.css      todos los estilos (índice numerado arriba del archivo)
assets/js/app.js           rutas, idioma, scroll del inicio, y una función view*() por sección
assets/js/intro.js         portada animada (fases en data-phase: load → flash → last → expand → rest)
assets/js/scene.js         escena interactiva (zonas, zoom, editor ?editar)
assets/js/viewer.js        visor a pantalla completa (lightbox y vista de cada zona)
assets/js/media.js         arma <img> con srcset a partir de media/manifest.json
content/site.json          nombre, portada (cover), navegación, Sobre mí + CV, contacto, textos de interfaz (ui)
content/projects.json      proyectos, en el orden en que se muestran
content/gallery.json       grilla de Imágenes (grupos: studio / freelance / academic)
media/                     imágenes optimizadas (.webp) + manifest.json  -> GENERADO, no editar a mano
_originales/               originales pesados (no se suben a Git); una carpeta por proyecto
                           (_originales/portada/ = las imágenes de la portada)
imagenes para usar/        originales de trabajo (cientos de MB); ignorada por Git, no es parte del sitio
tools/imagenes.py          _originales/ -> media/  (Python + Pillow, ya instalados)
DESIGN.md                  sistema visual: leerlo antes de tocar estilos
COMO-ACTUALIZAR.md         guía para Franco, paso a paso
```

El inicio es **una sola página continua**: portada + Sobre mí + Proyectos + Imágenes + Contacto.
`#/`, `#/about`, `#/projects`, `#/images` y `#/contact` son esa misma página en distinta posición: el
índice de la cabecera hace scroll hasta cada parte y la dirección se actualiza sola al hacer scroll.
Solo cada proyecto es una página aparte: `#/projects/<slug>` y `#/projects/<slug>/<zona>`; al volver
a `#/projects` se recupera la posición de scroll. Agregar `?editar` a la ruta de un proyecto abre el
editor de zonas.

La portada (`intro.js`, estilos en «5a — Portada» de `styles.css`) es negra con letras blancas. Las
imágenes de `cover.flash` y la final (hoy 7 + 1) pasan en unos 3 s (`TOTAL_FLASH`, repartidos en
partes iguales), todas en un mismo cuadro chico centrado, de proporción `cover.ratio`, encuadradas
con `object-fit: cover`. La final aparece en ese cuadro mostrando solo el recorte `cover.crop`;
después el cuadro crece hasta la pantalla completa, el recorte se abre a la imagen entera y se
desenfoca, todo al mismo tiempo (2,2 s: `EXPAND` en `intro.js` = `--expand` en el CSS, cambiar los
dos juntos). Al final aparece el nombre. Corre una vez, al entrar por `#/`; un clic, tecla o scroll
la saltea; con `prefers-reduced-motion` o entrando directo a una sección se muestra terminada.
Mientras corre no hay scroll y la cabecera no se ve (sin transición, para que no aparezca una franja
gris). Terminada la animación, el fondo sigue suavemente al mouse (`MOVE = 0.05` es el
recorrido total: 2,5 % del tamaño de la imagen hacia cada lado del centro; la imagen se agranda lo
necesario para no mostrar bordes negros, ~11 % en 1440×900, más `EDGE = 24` px de margen por el
desenfoque, así se ve casi entera); se apaga en pantallas táctiles, con `prefers-reduced-motion` y
cuando la portada no está a la vista. Encuadre final: en pantallas apaisadas la imagen queda
centrada, completa como la foto (la torre a la derecha); solo en pantallas verticales (celular) se
corre hacia la zona del recorte (la torre) para que no quede fuera de cuadro.

Textos de la portada: arriba del nombre la etiqueta `cover.label`; el nombre en mayúsculas con
**Syne** (Google Fonts, peso 650, variable `--font-name`, solo para esto), las dos palabras iguales;
abajo a la derecha `location` (el mismo dato del pie y de Contacto) y «Bajar ↓». No figura
«Arquitecto» debajo del nombre. Las etiquetas son IBM Plex Mono con mucho espaciado.

Cabecera: a la izquierda el nombre (link al inicio) y al lado el botón ES/EN; a la derecha el
índice, sin números. Sobre la portada es transparente y blanca, el nombre se pliega y ES/EN queda
solo a la izquierda; al bajar aparece el nombre. En celular: nombre + ES/EN a la izquierda y «Menú»
a la derecha. Al cambiar de idioma se conserva la posición dentro de la sección visible (los textos
en inglés ocupan otro alto).

## Reglas de contenido

- Todo texto visible es `"texto"` o `{ "es": "...", "en": "..." }`. Siempre cargar los dos idiomas.
- Una imagen se nombra por su **id**: `carpeta/nombre` sin extensión (ej. `re-casino/render-naval`).
  Para agregar una: copiar el original a `_originales/<carpeta>/`, correr `py -X utf8 tools/imagenes.py`
  y usar el id en el JSON. Un id que no existe se dibuja como un bloque gris con el id escrito.
- Proyecto interactivo = tiene `scene` { image, tone (`light` para dibujos, `dark` para renders),
  zones[] }. Cada zona: `id`, `title`, `text`, `points` (vértices `[x, y]` en % de la imagen) e
  `images` (ids). Sin `scene`, el proyecto muestra `cover` a todo el ancho.
- Portada = `site.json` → `cover`: `image` es la imagen final (hoy `portada/hijo-de-la-noche`,
  apaisada, 1920×1080, con la torre a la derecha: pedido de Franco del 16/11/2026; la versión
  vertical sigue guardada en `imagenes para usar/portada/` y no se usa); `ratio` = `[ancho, alto]`, la proporción del cuadro chico (hoy
  `[3000, 3500]`, vertical 6:7); `crop` = `[izq, arriba, der, abajo]` en % de la imagen final, la
  zona que se ve primero (hoy `[61.5, 5.4, 86.8, 89.3]`, la torre; el código la agranda a la proporción de
  `ratio` sin moverle el centro); `label` la etiqueta de arriba del nombre («Architect — Portfolio»,
  igual en ES y EN); `flash` las que pasan antes (hoy 7 de `portada/`; vacío = todas las de
  `gallery.json`). Los originales van en `_originales/portada/`. El código todavía acepta
  `flashExtra` (ids que se suman), pero ya no está en el JSON.
- Grupos de `gallery.json`: `studio` (Estudio), `freelance` (Particular), `academic` (Facultad). El
  filtro aparece solo cuando hay imágenes de al menos dos grupos.
- No inventar datos biográficos, fechas ni créditos. Si falta algo, preguntarle a Franco.

## Probar

`ver-sitio.bat` (o `py -m http.server 4173`) y abrir http://localhost:4173/. No funciona con doble
clic sobre index.html (los módulos y el JSON necesitan servidor). En esta app, `preview_start` con
el nombre `portfolio` usa `.claude/launch.json`. Revisar siempre a 1440 px y a 375 px, en ES y EN,
y abrir al menos una zona de una escena. Ver la portada completa entrando por `#/` (sin tocar nada
hasta que aparezca el nombre), probar cada enlace del índice y volver de un proyecto al inicio.

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
5. **Imágenes**: hay trabajos particulares (`freelance`) y de la facultad (`academic`); ninguno del estudio. Cuando haya imágenes del
   estudio se cargan con `"group": "studio"` y se suman solas al filtro.
   Antes de publicar trabajo del estudio, confirmar que Franco tiene permiso.
6. **Textos y zonas sin validar ya están en línea**: todo lo anterior se publicó tal cual el
   15/11/2026. Corregirlo es editar el JSON y volver a publicar.
7. **Torre suspendida** (`galeria/torre-suspendida-01` a `-06`, grupo `academic`): el título y el año
   2025 se dedujeron del nombre de un archivo de 3ds Max (`AW_Torre Suspendida_CIRCULO MILITAR`) y de
   las fechas de la carpeta; Franco no los dijo. Tampoco se sabe si es trabajo grupal. Validar con él.
8. **Imágenes de la portada** (`portada/agus-*`, `render-naval`, `esquina`, `exterior-02`,
   `interior-02`): no se sabe de qué proyecto es cada una ni si son del estudio; confirmar con Franco
   antes de publicar si alguna es trabajo del estudio.
9. **`portada/agus-final`** parece ser el mismo render que `re-casino/render-club` (mismas medidas,
   5000×4286): confirmar.

## Publicación

Publicado en GitHub Pages: https://francopboscariol-design.github.io/
Repositorio (público): `francopboscariol-design/francopboscariol-design.github.io`, rama `main`,
raíz. Pages despliega solo con cada `git push`; tarda uno o dos minutos. Publicar = `git add -A`,
`git commit`, `git push`. Las credenciales están guardadas en el Administrador de credenciales de
Git de Windows. Si `git push` pide autorización de nuevo, correrlo en el panel de Terminal (necesita
una ventana interactiva). Los commits usan el mail `francopboscariol-design@users.noreply.github.com`
(configurado solo en este repositorio) para no exponer el mail personal en el historial.
Publicar es una acción hacia afuera: confirmar con Franco antes de cada `git push`.

**Estado (16/11/2026)**: la página continua, la portada animada y las imágenes de Torre suspendida
están en la rama `portada-y-scroll`, sin publicar; el sitio en línea (`main`) sigue con la versión
anterior. El 16/11/2026 se aplicaron dos tandas de correcciones de Franco a la portada y la
cabecera, también en esa rama y sin publicar. Publicarlos = pasar los cambios a `main` y hacer
`git push`, con el visto bueno de Franco.

## Forma de trabajo

Pedido de Franco (15/11/2026): «a partir de ahora distribuí las tareas entre Fable 5.2 y Opus 5.5 en
función de la complejidad». El modelo principal hace lo complejo (diseño, animación, arquitectura
del sitio) y delega en subagentes con el otro modelo lo simple y bien acotado (importar imágenes,
cargar contenido, actualizar documentación). En la respuesta a Franco, decir qué hizo cada uno.

## Skills instaladas en `.claude/skills/`

- `impeccable` — crítica, pulido, tipografía, animación. Usar sus comandos (`polish`, `audit`,
  `typeset`, `animate`, `adapt`) para refinar; este sitio es modo «Experience».
- `web-design-guidelines` — auditoría de accesibilidad y buenas prácticas de interfaz.
- `playwright-cli` — automatización de navegador (Node.js y `@playwright/cli` ya están instalados).

No se instaló Taste Skill: está pensada para páginas de empresas (sus reglas prohíben epígrafes,
imponen su propio kit y una sección por pantalla) y agrega un hook que ejecuta sus scripts al
terminar cada turno. No reconstruir el sitio con un kit o un framework sin que Franco lo pida.
