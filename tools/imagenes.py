"""
Optimiza las imagenes del sitio.

Uso (doble clic en "actualizar-imagenes.bat" o desde una terminal):

    py tools/imagenes.py

Que hace:
  - Lee todo lo que haya en   _originales/<carpeta>/<nombre>.(jpg|png|tif|webp)
  - Genera versiones livianas en   media/<carpeta>/<nombre>-<ancho>.webp
  - Escribe   media/manifest.json   con el tamano y los anchos de cada imagen.

El "id" de una imagen es  <carpeta>/<nombre>  (sin extension). Ese id es lo
que se escribe en los archivos de content/*.json.

Los nombres se normalizan: minusculas, sin tildes, espacios -> guiones.
Solo se reprocesa lo que cambio. Para forzar todo:  py tools/imagenes.py --todo
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / "_originales"
DESTINO = RAIZ / "media"
MANIFEST = DESTINO / "manifest.json"

ANCHOS = [480, 960, 1600, 2400]      # versiones normales
ANCHO_XL = 4000                      # extra para imagenes muy grandes (zoom en escenas)
UMBRAL_XL = 5000                     # ancho original a partir del cual se genera la XL
CALIDAD = 84
EXTENSIONES = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp"}


def slug(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    texto = re.sub(r"[^a-zA-Z0-9]+", "-", texto).strip("-").lower()
    return texto or "imagen"


def procesar(archivo: Path, forzar: bool) -> tuple[str, dict]:
    carpeta = slug(archivo.parent.name)
    nombre = slug(archivo.stem)
    ident = f"{carpeta}/{nombre}"
    salida = DESTINO / carpeta
    salida.mkdir(parents=True, exist_ok=True)

    with Image.open(archivo) as im:
        im = ImageOps.exif_transpose(im)
        ancho, alto = im.size
        anchos = [a for a in ANCHOS if a < ancho]
        if ancho >= UMBRAL_XL:
            anchos.append(ANCHO_XL)
        elif ancho <= ANCHOS[-1] or not anchos:
            anchos.append(ancho)          # la original ya es chica: se conserva su ancho
        else:
            anchos.append(ANCHOS[-1])
        anchos = sorted(set(anchos))

        pendientes = [
            a for a in anchos
            if forzar
            or not (salida / f"{nombre}-{a}.webp").exists()
            or (salida / f"{nombre}-{a}.webp").stat().st_mtime < archivo.stat().st_mtime
        ]
        if pendientes:
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
            for a in pendientes:
                h = round(alto * a / ancho)
                copia = im if a == ancho else im.resize((a, h), Image.LANCZOS)
                copia.save(salida / f"{nombre}-{a}.webp", "WEBP", quality=CALIDAD, method=5)
            print(f"  + {ident}  {ancho}x{alto}  ->  {pendientes}")

    return ident, {"w": ancho, "h": alto, "sizes": anchos}


def main() -> None:
    forzar = "--todo" in sys.argv
    if not ORIGEN.exists():
        print(f"No existe la carpeta {ORIGEN}")
        return

    manifest: dict[str, dict] = {}
    archivos = sorted(p for p in ORIGEN.rglob("*") if p.suffix.lower() in EXTENSIONES)
    print(f"{len(archivos)} imagenes en _originales/")
    for archivo in archivos:
        try:
            ident, datos = procesar(archivo, forzar)
            if ident in manifest:
                print(f"  ! nombre repetido, se ignora: {archivo}")
                continue
            manifest[ident] = datos
        except Exception as error:  # noqa: BLE001
            print(f"  ! no se pudo procesar {archivo.name}: {error}")

    # borra versiones de imagenes que ya no estan en _originales
    validos = {f"{i}-{a}.webp" for i, d in manifest.items() for a in d["sizes"]}
    for viejo in DESTINO.rglob("*.webp"):
        rel = viejo.relative_to(DESTINO).as_posix()
        if rel not in validos:
            viejo.unlink()
            print(f"  - borrado {rel}")

    DESTINO.mkdir(exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=1, sort_keys=True), encoding="utf-8")
    total = sum(f.stat().st_size for f in DESTINO.rglob("*.webp")) / 1e6
    print(f"Listo: {len(manifest)} imagenes, {total:.1f} MB en media/")


if __name__ == "__main__":
    main()
