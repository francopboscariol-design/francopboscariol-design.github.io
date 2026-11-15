# Cómo actualizar el portfolio

Todo lo que se lee o se ve en la página sale de tres archivos de texto en la carpeta `content/`.
Se abren con el Bloc de notas (o se lo pedís a Claude). No hace falta tocar el código.

| Quiero cambiar… | Archivo |
|---|---|
| Sobre mí, CV, herramientas, idiomas, mail, Instagram | `content/site.json` |
| Proyectos: textos, créditos, imágenes, zonas interactivas | `content/projects.json` |
| La grilla de Imágenes | `content/gallery.json` |

Cada texto aparece dos veces, en español y en inglés: `{ "es": "…", "en": "…" }`.

## Ver el sitio en tu computadora

Doble clic en **`ver-sitio.bat`**. Se abre el navegador en `http://localhost:4173/`. Dejá abierta la
ventana negra mientras lo usás. Si cambiás algo, recargá la página (F5).

## Agregar o reemplazar una imagen

1. Copiá el archivo original (JPG o PNG, en la mejor calidad que tengas) dentro de
   `_originales/`, en la carpeta del proyecto. Por ejemplo: `_originales/galeria/casa-lago-01.jpg`.
   Para reemplazar una imagen, guardá la nueva con el mismo nombre.
2. Doble clic en **`actualizar-imagenes.bat`**. Genera las versiones livianas en `media/`.
3. El nombre de la imagen para usar en los archivos es `carpeta/nombre`, sin extensión:
   `galeria/casa-lago-01`.

Usá nombres simples: minúsculas, sin tildes ni espacios, con guiones.

## Sumar una imagen a la grilla de Imágenes

En `content/gallery.json`, agregá una línea dentro de `"items"` (el orden de la lista es el orden
en pantalla):

```json
{ "img": "galeria/casa-lago-01", "title": "Casa del lago", "year": "2026", "group": "freelance" },
```

`"group"` es `"freelance"` (particular) o `"studio"` (hecho en el estudio). Cuando haya imágenes de
los dos grupos aparece solo el filtro Todo / Estudio / Particular.

## Cambiar el CV o los datos de contacto

En `content/site.json`:

- `"about"` → `"statement"` y `"bio"`: los textos de presentación.
- `"about"` → `"cv"`: cada bloque (Experiencia, Formación…) tiene una lista de `"items"` con
  `"period"`, `"title"` y `"place"`. Copiá un item, pegalo arriba y cambiale los datos.
- `"about"` → `"cvPdf"`: si guardás tu CV como `assets/cv.pdf` y escribís `"cvPdf": "assets/cv.pdf"`,
  aparece el botón para descargarlo.
- `"contact"`: `"email"`, `"instagram"`. Si agregás `"linkedin": "https://…"` o
  `"phone": "+54 …"`, aparecen solos en la página.

## Agregar un proyecto

En `content/projects.json`, copiá el bloque de un proyecto parecido (de `{` a `}`), pegalo donde
quieras que aparezca y cambiá:

- `"slug"`: el nombre en la dirección web (sin espacios): `casa-lago`.
- `"title"`, `"kind"`, `"year"`, `"place"`, `"summary"`, `"text"`, `"facts"`.
- `"cover"`: la imagen de portada.
- `"gallery"`: la lista de imágenes de documentación. `"wide": true` la pone a todo el ancho.

### Proyecto interactivo (vista general con partes que se encienden)

Dentro del proyecto va un bloque `"scene"`:

- `"image"`: el render general o la axonometría.
- `"tone"`: `"light"` si es un dibujo sobre fondo claro, `"dark"` si es un render.
- `"zones"`: las partes. Cada una tiene `"id"`, `"title"`, `"text"`, `"images"` (las imágenes que se
  ven al entrar) y `"points"` (el contorno de la parte sobre la imagen).

**Para dibujar el contorno de una zona** no hay que calcular nada:

1. Abrí el proyecto y agregá `?editar` al final de la dirección.
   Ejemplo: `http://localhost:4173/#/projects/re-casino?editar`
2. Hacé clic sobre la imagen marcando los vértices de la parte, en orden.
3. Apretá **Copiar** y pegá el resultado reemplazando la línea `"points"` de esa zona.

## Publicar los cambios

El sitio se publica en GitHub Pages. Una vez configurado (ver más abajo), cada actualización son
tres comandos en una terminal abierta en esta carpeta, o pedirle a Claude «publicá los cambios»:

```bash
git add -A
git commit -m "Actualizo el portfolio"
git push
```

A los dos minutos el sitio publicado muestra los cambios.

## Si algo se rompe

- **La página queda en blanco o dice que no pudo cargar el contenido**: casi siempre es una coma o
  una comilla de más o de menos en un `.json`. Deshacé el último cambio o pedile a Claude que lo revise.
- **Aparece un bloque gris con un nombre adentro**: esa imagen no existe en `media/`. Revisá que el
  nombre esté bien escrito y que hayas corrido `actualizar-imagenes.bat`.
