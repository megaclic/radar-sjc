@echo off
rem Coleta os dados oficiais, gera o site e envia ao GitHub (que publica sozinho).
rem Se a coleta falhar, nada e enviado. Pode ser agendado no Agendador de Tarefas do Windows.
cd /d "%~dp0"
python coletor\atualizar.py || (echo Coleta incompleta. Nada foi publicado. & exit /b 1)
python coletor\gerar_site.py || exit /b 1
git add data site
git diff --cached --quiet && (echo Sem novidades. & exit /b 0)
git commit -m "Dados atualizados em %date%"
git push
