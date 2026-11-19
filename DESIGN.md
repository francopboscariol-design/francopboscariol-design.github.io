# Sistema visual

Portfolio editorial y sobrio: las imágenes mandan, la tipografía es el único gesto fuerte, y no hay
color decorativo. Referencia para la grilla de imágenes: ethandeclerk.com. Referencia para los
proyectos interactivos: `referencias paginas web/` (torre con pisos que se encienden y zoom).

Prioridades, en orden: 1) calidad y protagonismo de las imágenes, 2) composición editorial,
3) navegación intuitiva, 4) tipografía y jerarquía, 5) animación, 6) facilidad de actualización.

## Color

Solo neutros. Definidos como variables al principio de `assets/css/styles.css`.

| Variable | Valor | Uso |
|---|---|---|
| `--paper` | `#f3f2ef` | fondo del sitio |
| `--block` | `#e5e3de` | fondo de una imagen mientras carga |
| `--line` | `#d6d4ce` | líneas finas entre filas |
| `--ink` | `#0d0d0d` | texto y líneas principales |
| `--ink-2` | `#4f4e4a` | texto secundario |
| `--ink-3` | `#8a8983` | etiquetas, numeración |
| `--night` | `#0a0a0a` | visor de imágenes |

El color lo ponen las imágenes. No agregar acentos, degradados ni sombras.

Los únicos fondos oscuros son el visor y la **portada**, que es negra (`#000`, puesto directo en
la sección «5a — Portada» del CSS) con letras blancas (y la cabecera, mientras está encima de
ella, transparente con letras blancas y sin el nombre). Al bajar, todo vuelve a `--paper` y `--ink`.
No llevar el fondo negro a otras secciones.

## Tipografía

- **Archivo** (variable, ancho 108 %, peso 500, tracking −0.045em): títulos enormes y texto corrido.
- **Instrument Serif** itálica: la segunda palabra de un título y las frases destacadas (`.statement`).
- **IBM Plex Mono** en mayúsculas, 11 px: etiquetas, numeración, fechas (`.label`). En la portada
  las etiquetas llevan mucho más espacio entre letras (0.28em; 0.2em en celular).
- **Syne** (Google Fonts, peso 650, variable `--font-name`): **solo** el nombre de la portada,
  «FRANCO BOSCARIOL» en mayúsculas, las dos palabras iguales (ahí no va la serif itálica). No usarla
  en ningún otro lugar.

Los títulos usan tamaños fluidos con `clamp()` (clases `.display--hero`, `--page`, `--project`,
`--next`, `--email`). Un solo título gigante por pantalla.

## Composición

- Grilla de 12 columnas, márgenes `--gutter` y separación `--gap`. Texto a la izquierda en 4–5
  columnas, contenido principal desde la columna 6: composiciones asimétricas, mucho blanco.
- Líneas de 1 px en negro para abrir secciones; grises para separar filas.
- Las imágenes van siempre en su proporción original, sin recortes ni bordes redondeados.
- Bajo cada imagen solo una etiqueta mínima, si hace falta.
- El inicio es una sola página continua: portada a pantalla completa y, debajo, Sobre mí, Proyectos,
  Imágenes y Contacto, cada una abierta por su propio título grande (`.display--page`). Cada
  proyecto es una página aparte.
- Portada: abajo a la izquierda, la etiqueta (`cover.label`, «Architect — Portfolio») y debajo el
  nombre; abajo a la derecha, la ubicación y «Bajar ↓». En celular todo se apila a la izquierda.
- Cabecera: a la izquierda el nombre y, al lado, ES/EN; a la derecha el índice, sin números. Sobre
  la portada el nombre se pliega y ES/EN queda solo a la izquierda; al bajar, el nombre aparece. En
  celular: nombre + ES/EN a la izquierda y «Menú» a la derecha.

## Movimiento

Sutil y corto. Curvas `--ease` (salida) y `--ease-inout` (zoom de la escena).

- Portada (`assets/js/intro.js`, fases `load → flash → last → expand → rest`): las imágenes (hoy 7
  más la final) pasan en unos 3 s en total, todas en un mismo cuadro chico centrado, vertical
  (`cover.ratio`, 6:7), encuadradas sin deformarse. La final aparece en ese cuadro mostrando solo su
  recorte (`cover.crop`, la torre); después el cuadro crece hasta cubrir la pantalla, el recorte se
  abre a la imagen entera y se desenfoca, las tres cosas a la vez (2,2 s), y aparece el nombre abajo
  a la izquierda. Corre una sola vez; un clic, tecla o scroll la saltea, y mientras corre no hay
  scroll ni se ve la cabecera (se oculta sin transición, para que no aparezca una franja gris).
- Fondo de la portada: terminada la animación, la imagen desenfocada sigue suavemente al mouse
  (recorrido total de 5 % de su tamaño, o sea 2,5 % hacia cada lado del centro; se agranda lo justo
  para no mostrar bordes negros, ~11 % en 1440×900, y se ve casi entera). Se apaga en pantallas
  táctiles, con `prefers-reduced-motion` y cuando la portada no está a la vista.
- Encuadre final de la portada: la imagen es apaisada (1920×1080). En pantallas apaisadas queda
  centrada, completa como la foto, con la torre a la derecha; solo en pantallas verticales (celular)
  se corre hacia la torre para que no quede fuera de cuadro.
- Índice de la cabecera: scroll suave hasta cada sección del inicio.
- Cambio de página (inicio ↔ proyecto): fundido con View Transitions (0.3–0.5 s).
- Aparición al entrar en pantalla: `data-reveal` (opacidad + 20 px, 1 s). Las imágenes hacen fundido al cargar.
- Hover: imagen escala 1.02; subrayados que se dibujan; flechas que se desplazan 4 px.
- Escena: la zona se enciende atenuando el resto; clic = zoom de 0.95 s y se abre la vista.
- `prefers-reduced-motion` desactiva todo (la portada aparece ya terminada). No sumar parallax,
  scroll-jacking ni animaciones en bucle. La única excepción es el fondo de la portada que sigue al
  mouse, pedida por Franco: no extenderla a otras secciones.

## Responsive

Cortes en 1024 px y 760 px. En celular: menú a pantalla completa, todo a una columna, la grilla de
imágenes a una columna, y la escena apaisada se recorre deslizando de costado (`mobileZoom` la
agranda). En pantallas táctiles las zonas se eligen con los números.
