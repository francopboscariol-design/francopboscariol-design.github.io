# Cómo actualizar el portfolio

Todo lo que se lee o se ve en la página sale de tres archivos de texto en la carpeta `content/`.
Se abren con el Bloc de notas (o se lo pedís a Claude). No hace falta tocar el código.

| Quiero cambiar… | Archivo |
|---|---|
| La portada (qué imágenes pasan, cuál queda de fondo y la frase de arriba del nombre) | `content/site.json` |
| Sobre mí, CV, herramientas, idiomas, mail, Instagram | `content/site.json` |
| Proyectos: textos, créditos, imágenes, zonas interactivas | `content/projects.json` |
| La grilla de Imágenes | `content/gallery.json` |

Cada texto aparece dos veces, en español y en inglés: `{ "es": "…", "en": "…" }`.

El inicio es una sola página larga: arriba la portada y, bajando, Sobre mí, Proyectos, Imágenes y
Contacto. Los nombres del menú de arriba a la derecha te llevan bajando hasta cada parte; arriba a
la izquierda están tu nombre (vuelve al principio) y el botón ES/EN. Lo único que se abre aparte es
cada proyecto.

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

`"group"` dice de dónde es el trabajo:

- `"freelance"`: particular.
- `"studio"`: hecho en el estudio.
- `"academic"`: de la facultad.

Cuando hay imágenes de al menos dos grupos, arriba de la grilla aparecen solos los botones para
filtrar (por ejemplo Todo / Particular / Facultad).

## Cambiar la portada

La portada es la pantalla negra del principio. En unos 3 segundos pasan varias imágenes, todas en
un mismo cuadro chico y vertical en el centro. La última es la imagen final, que al principio
muestra solo un pedazo (hoy, la torre); enseguida ese cuadro se agranda hasta ocupar toda la
pantalla, se va viendo la imagen entera y se desenfoca, y aparece tu nombre encima. Después, el
fondo se mueve apenas siguiendo al mouse (en el celular queda quieto). La imagen final de hoy es
apaisada: en la computadora se ve entera, con la torre a la derecha; en el celular, como la pantalla
es vertical, se corre sola hacia la torre para que no quede afuera.

Se arma en `content/site.json`, en el bloque `"cover"`:

```json
"cover": {
  "image": "portada/hijo-de-la-noche",
  "ratio": [3000, 3500],
  "crop": [61.5, 5.4, 86.8, 89.3],
  "label": { "es": "Architect — Portfolio", "en": "Architect — Portfolio" },
  "flash": [ "portada/render-naval", "portada/exterior-02", "..." ]
},
```

- `"image"`: la imagen que queda de fondo al final. Para cambiarla, poné el nombre de otra imagen.
  Usala en buena calidad, porque se ve a pantalla completa (aunque queda desenfocada).
- `"ratio"`: la forma del cuadro chico donde pasan las imágenes: ancho y alto. `[3000, 3500]` es un
  cuadro vertical, un poco más alto que ancho. Importa la relación entre los dos números, no el
  tamaño: `[6, 7]` daría lo mismo. Las imágenes que no tienen esa forma se recortan solas para
  llenar el cuadro, sin deformarse.
- `"crop"`: qué parte de la imagen final se ve primero, antes de que se agrande. Son cuatro
  porcentajes, en este orden: **izquierda, arriba, derecha, abajo**. Imaginá un rectángulo dibujado
  sobre la imagen, alrededor de lo que querés mostrar: los dos primeros números dicen dónde empieza
  (medido desde el borde izquierdo y desde el borde de arriba) y los dos últimos dónde termina
  (medido desde esos mismos bordes). `[61.5, 5.4, 86.8, 89.3]` quiere decir: desde el 61,5 % hasta el
  86,8 % del ancho, y desde el 5,4 % hasta el 89,3 % del alto (la torre, que está a la derecha). Podés calcularlo a ojo, probar y corregir. Si el
  rectángulo no tiene la misma forma que el cuadro (`"ratio"`), la página lo agranda sola lo
  necesario, sin moverle el centro.
- `"label"`: la frase chiquita que va arriba de tu nombre, en español y en inglés.
- `"flash"`: las imágenes que pasan antes de la final, en ese orden (hoy son 7). Escribí sus nombres
  entre comillas, separados por comas. Pasan todas en los mismos 3 segundos: cuantas más pongas,
  más rápido pasa cada una. Si la dejás vacía (`[]`), pasan todas las de la grilla de Imágenes.

Las imágenes de la portada van en la carpeta `_originales/portada/`; después de copiarlas ahí, doble
clic en `actualizar-imagenes.bat`, y su nombre queda como `portada/nombre-del-archivo`. (La carpeta
`imagenes para usar/` es solo tu material de trabajo: lo que está ahí no se sube ni se publica.)

Tu nombre en la portada sale de `"name"`, al principio de `content/site.json`, y la línea de abajo a
la derecha («Jujuy — Buenos Aires — Argentina») de `"location"`, que también aparece en el pie de la
página y en Contacto.

La animación se ve una sola vez, cuando entrás por la portada. Para volver a verla, recargá la
página (F5) estando arriba de todo. Si hacés clic o bajás, se saltea.

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
- `"cover"`: la imagen principal del proyecto (no confundir con el bloque `"cover"` de
  `site.json`, que es la portada del sitio).
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

El sitio está publicado en **https://francopboscariol-design.github.io/** (GitHub Pages, cuenta
`francopboscariol-design`). Cada actualización son tres comandos en una terminal abierta en esta
carpeta, o pedirle a Claude «publicá los cambios»:

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
