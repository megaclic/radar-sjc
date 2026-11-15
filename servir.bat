@echo off
cd /d "%~dp0site"
echo Abra http://localhost:8000 no navegador. Feche esta janela para parar.
start http://localhost:8000
python -m http.server 8000
