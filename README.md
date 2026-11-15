# Radar Político SJC

Site estático que mostra o que cada vereador de São José dos Campos faz, usando **só dados oficiais** da Câmara Municipal. Não dá nota, não opina e não tem ligação com a Câmara, com a Prefeitura ou com partido.

Site: https://megaclic.github.io/radar-sjc/

## O que o site mostra

- **Presença:** lista oficial de cada sessão.
- **Propostas:** tudo o que cada vereador apresentou, separado em grupos por uma regra única, igual para todos, com tema, rua e bairro lidos do texto oficial. Cada item tem o link do documento original.
- **Votos:** lidos dos extratos oficiais da votação eletrônica e conferidos com os totais de cada votação. Se a conta não bate, a votação fica fora e marcada "em verificação".
- **Gastos:** equipe do gabinete (salário bruto de quem está lotado ali), outros gastos ligados ao centro de custo do vereador (passagens, hospedagem, diárias e outros), nota fiscal informada pelo portal, publicidade da Câmara e classificações que merecem atenção. Há ranking dos gabinetes e tela para comparar dois vereadores.
- **Seu bairro:** busca por rua ou bairro em todos os pedidos.
- Legislatura 19, desde 1º de janeiro de 2025.

## De onde vêm os dados

| Dado | Fonte |
|---|---|
| Vereadores, presença, propostas, votações | [Câmara Sem Papel](https://camarasempapel.camarasjc.sp.gov.br/) |
| Gastos, folha, contratos, publicidade | [Portal da Transparência da Câmara](https://portal.camarasjc.sp.gov.br/portal-transparencia/home) (API pública, sem login) |
| Subsídio dos vereadores | Resolução nº 5/2022 da Câmara |

## Regras do projeto

- Só dado oficial, sem estimativa apresentada como fato. O que é estimativa (como o contador de salário) diz isso na tela.
- Pedidos de pessoas físicas (consulta, exame ou vaga escolar) têm o texto escondido, por privacidade (LGPD).
- O site não afirma irregularidade. "Gastos para olhar com atenção" são classificações oficiais da Câmara, não acusações.
- O ranking de gastos mede valor, não qualidade de mandato.

## Estrutura

```
coletor/     scripts em Python (só biblioteca padrão)
  atualizar.py              coleta incremental no Câmara Sem Papel; não grava nada se a coleta vier incompleta
  classificar.py            regra única dos grupos de proposta
  votos.py, votos_parse.py  leitura dos extratos de votação
  gerar_site.py             gera site/data/*.json
  gastos.py                 coleta do Portal da Transparência e gera site/data/gastos.json
data/        dados coletados (JSON)
site/        HTML, CSS e JavaScript puros; rotas por hash (#/, #/v/ID/..., #/gastos, #/comparar, #/busca/..., #/sobre)
.github/workflows/publicar.yml        publica a pasta site/ no GitHub Pages a cada push em site/
.github/workflows/coleta-nuvem.yml    teste manual de coleta na nuvem
```

## Rodar localmente

Requer Python 3. Para coletar e gerar:

```
python3 coletor/atualizar.py
python3 coletor/gerar_site.py
python3 coletor/gastos.py
```

Para ver o site: `python3 -m http.server -d site` e abrir http://localhost:8000. No Windows, `servir.bat` faz isso.

`atualizar_e_publicar.bat` roda a coleta, gera o site, comita e envia ao GitHub, que publica sozinho. Funciona dentro de um clone do repositório e pode ser agendado no Agendador de Tarefas. Se a coleta falhar, nada é publicado.

Variáveis de ambiente opcionais: `RADAR_LEGISLATURA` (19), `RADAR_ANO_INICIO` (2025), `RADAR_GASTOS_ANOS` (`2025,2026`), `RADAR_PAUSA` (pausa entre requisições, em segundos) e `RADAR_CONTATO` (identificação enviada nas requisições).

O Portal da Transparência não responde a partir de alguns servidores na nuvem; por isso a coleta de gastos roda no computador do mantenedor.

## Limites conhecidos

- Salário individual de 2026 só até o último mês fechado; estagiários não aparecem com lotação no portal e ficam fora da conta da equipe.
- O portal informa número, emissão e valor da nota fiscal, mas não o arquivo da nota nem a lista de itens comprados.
- "Empenhado" é o valor reservado para pagar; "pago" pode ser menor.
- Tema, rua e bairro são lidos por palavras-chave e podem errar; confira sempre no documento oficial.
- Legislaturas anteriores ainda não foram incluídas.

## Erro ou correção

Se achar um dado errado, abra o documento oficial pelo link do item e compare. Para avisar, abra uma [issue](https://github.com/megaclic/radar-sjc/issues).
