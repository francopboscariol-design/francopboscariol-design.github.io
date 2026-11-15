@echo off
rem Abre el sitio en el navegador para verlo en esta computadora.
rem Dejar esta ventana abierta mientras se usa; cerrarla apaga la vista previa.
cd /d "%~dp0"
start "" http://localhost:4173/
py -m http.server 4173 --bind 127.0.0.1
