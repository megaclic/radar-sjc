# Radar Político SJC

Mostra, só com dados oficiais da Câmara Municipal de São José dos Campos, o que cada vereador faz: presença nas sessões, propostas apresentadas e votos.

- `coletor/atualizar.py`: coleta incremental (API e páginas do Câmara Sem Papel). Não grava nada se a coleta vier incompleta.
- `coletor/classificar.py`: regra única que separa as propostas em grupos (versão 1).
- `coletor/gerar_site.py`: gera `site/data/*.json`.
- `site/`: site estático (HTML, CSS e JS puros), publicado no GitHub Pages.
- `.github/workflows/atualizar.yml`: robô diário.

Rodar localmente: `python3 coletor/atualizar.py && python3 coletor/gerar_site.py`, depois servir a pasta `site/` (por exemplo `python3 -m http.server -d site`).
Variáveis: `RADAR_LEGISLATURA` (19), `RADAR_ANO_INICIO` (2025), `RADAR_PAUSA`, `RADAR_CONTATO`.
Primeira carga de proposições: `coletor/proposicoes.py` e `coletor/consolidar_proposicoes.py`.
