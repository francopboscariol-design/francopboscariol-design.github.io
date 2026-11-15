@echo off
rem Convierte todo lo que haya en _originales\ a versiones livianas en media\.
cd /d "%~dp0"
py -X utf8 tools\imagenes.py
echo.
pause
