# Radar Político SJC

Mostra, só com dados oficiais da Câmara Municipal de São José dos Campos, o que cada vereador faz: presença nas sessões, propostas apresentadas e votos.

- `coletor/atualizar.py`: coleta incremental (API e páginas do Câmara Sem Papel). Não grava nada se a coleta vier incompleta.
- `coletor/classificar.py`: regra única que separa as propostas em grupos (versão 1).
- `coletor/gerar_site.py`: gera `site/data/*.json`.
- `site/`: site estático (HTML, CSS e JS puros), publicado no GitHub Pages.
- `.github/workflows/atualizar.yml`: robô diário.

Rodar localmente: `python coletor/atualizar.py` e `python coletor/gerar_site.py`. Para ver o site, dê dois cliques em `servir.bat` e abra http://localhost:8000 (abrir o index.html direto não funciona, o navegador bloqueia a leitura dos dados).
Variáveis: `RADAR_LEGISLATURA` (19), `RADAR_ANO_INICIO` (2025), `RADAR_PAUSA`, `RADAR_CONTATO`.
Primeira carga de proposições: `coletor/proposicoes.py` e `coletor/consolidar_proposicoes.py`.
