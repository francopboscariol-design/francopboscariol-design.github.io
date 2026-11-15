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
| `--night` | `#0a0a0a` | visor de imágenes (único fondo oscuro) |

El color lo ponen las imágenes. No agregar acentos, degradados ni sombras.

## Tipografía

- **Archivo** (variable, ancho 108 %, peso 500, tracking −0.045em): títulos enormes y texto corrido.
- **Instrument Serif** itálica: la segunda palabra de un título y las frases destacadas (`.statement`).
- **IBM Plex Mono** en mayúsculas, 11 px: etiquetas, numeración, fechas (`.label`).

Los títulos usan tamaños fluidos con `clamp()` (clases `.display--hero`, `--page`, `--project`,
`--next`, `--email`). Un solo título gigante por pantalla.

## Composición

- Grilla de 12 columnas, márgenes `--gutter` y separación `--gap`. Texto a la izquierda en 4–5
  columnas, contenido principal desde la columna 6: composiciones asimétricas, mucho blanco.
- Líneas de 1 px en negro para abrir secciones; grises para separar filas.
- Las imágenes van siempre en su proporción original, sin recortes ni bordes redondeados.
- Bajo cada imagen solo una etiqueta mínima, si hace falta.

## Movimiento

Sutil y corto. Curvas `--ease` (salida) y `--ease-inout` (zoom de la escena).

- Cambio de página: fundido con View Transitions (0.3–0.5 s).
- Aparición al entrar en pantalla: `data-reveal` (opacidad + 20 px, 1 s). Las imágenes hacen fundido al cargar.
- Hover: imagen escala 1.02; subrayados que se dibujan; flechas que se desplazan 4 px.
- Escena: la zona se enciende atenuando el resto; clic = zoom de 0.95 s y se abre la vista.
- `prefers-reduced-motion` desactiva todo. No sumar parallax, scroll-jacking ni animaciones en bucle.

## Responsive

Cortes en 1024 px y 760 px. En celular: menú a pantalla completa, todo a una columna, la grilla de
imágenes a una columna, y la escena apaisada se recorre deslizando de costado (`mobileZoom` la
agranda). En pantallas táctiles las zonas se eligen con los números.
