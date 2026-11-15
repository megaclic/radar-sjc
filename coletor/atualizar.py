"""Atualizacao incremental do Radar. Uso: python3 coletor/atualizar.py
Busca so o que e novo (sessoes, presencas, PDFs de votacao, proposicoes) e
rele uma janela recente, porque situacao e presenca mudam depois.
Confere o resultado ANTES de gravar; se vier estranho, sai com erro e nao
mexe nos dados anteriores.
Variaveis: RADAR_LEGISLATURA (19), RADAR_ANO_INICIO (2025), RADAR_PAUSA, RADAR_CONTATO."""
import datetime as dt, html, json, os, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import coletar as C
import votos as V
from classificar import grupo as _grupo
from votos_parse import extrair, confere, chave

DATA = C.DATA
LEG = os.environ.get("RADAR_LEGISLATURA", "19")
ANO_INICIO = int(os.environ.get("RADAR_ANO_INICIO", "2025"))
JANELA_SESSAO, JANELA_PROP = 30, 60
CAMPOS = ("id", "processo", "ano", "sigla", "tipo", "numero", "assunto", "data", "situacao", "arquivo")

def dia(s):
    return dt.datetime.strptime(s[:10], "%d/%m/%Y").date()

def carregar(nome, padrao):
    p = DATA / nome
    return json.load(open(p, encoding="utf-8")) if p.exists() else padrao

def gravar(nome, obj, compacto=False):
    p = DATA / nome
    tmp = p.with_suffix(".tmp")
    tmp.write_text(json.dumps(obj, ensure_ascii=False, indent=None if compacto else 1, separators=(",", ":") if compacto else None), encoding="utf-8")
    os.replace(tmp, p)

def ultima_atualizacao_camara():
    t = html.unescape(re.sub(r"<[^>]+>", " ", C.get("/")))
    m = re.search(r"[ÚU]ltima atualiza[^\d]{0,12}(\d{2}/\d{2}/\d{4})", t)
    return m.group(1) if m else None

def enxuto(it):
    return {k: (it[k].strip() if isinstance(it[k], str) else it[k]) for k in CAMPOS}

def main():
    hoje = dt.date.today()
    ult = ultima_atualizacao_camara()
    print("Ultima atualizacao informada pela Camara:", ult)

    # vereadores (autorID so e buscado para quem ainda nao tem)
    ver_old = {v["parlamentarID"]: v for v in carregar("vereadores.json", [])}
    ver = C.api("/api/publico/parlamentar/?pag=1&qtd=100")["parlamentares"]
    for v in ver:
        ant = ver_old.get(v["parlamentarID"], {})
        v["autorID"] = ant.get("autorID") or C.api(f"/api/publico/parlamentar/?parlamentarID={v['parlamentarID']}")["parlamentares"][0]["autorID"]
    mapa = {chave(v["parlamentarNome"]): v["parlamentarID"] for v in ver}

    # sessoes novas
    sess = {s["id"]: s for s in carregar("sessoes.json", [])}
    n_sess_antes, pag = len(sess), 1
    while True:
        d = C.api(f"/api/publico/spl/sessoes?pag={pag}&qtd=50")
        novas = [s for s in d["Data"] if s["legislatura"] == LEG and s["id"] not in sess]
        for s in novas:
            sess[s["id"]] = s
        if not novas or not (d.get("Paginacao") or {}).get("proxima"):
            break
        pag += 1
    print("sessoes novas:", len(sess) - n_sess_antes)

    # presencas: novas, com erro, ou vazias na janela recente
    pres = carregar("presencas.json", {})
    n_pres_antes = len(pres)
    for s in sess.values():
        k = str(s["id"]); p = pres.get(k)
        recente = (hoje - dia(s["data"])).days <= JANELA_SESSAO
        if p is None or "_erro" in (p or {}) or (not p and recente):
            try:
                pres[k] = C.presenca(s["id"])
            except Exception as e:
                pres[k] = {"_erro": str(e)}

    # votos: sessoes novas ou na janela recente
    vot = carregar("votacoes.json", [])
    conhecidas = {str(v["sessao_id"]) for v in vot}
    alvo = {s["id"] for s in sess.values() if str(s["id"]) not in conhecidas or (hoje - dia(s["data"])).days <= JANELA_SESSAO}
    pdfs = V.listar_pdfs(alvo) if alvo else {}
    vot = [v for v in vot if v["sessao_id"] not in pdfs]
    novas_vot = []
    for sid, urls in pdfs.items():
        for u in urls:
            for v in extrair(V.texto(V.baixar(u, sid)), mapa):
                v["sessao_id"], v["sessao_data"], v["pdf"] = sid, sess[sid]["data"], u
                v["conferencia"] = confere(v)
                novas_vot.append(v)
    vot += novas_vot
    print("votacoes relidas:", len(novas_vot), "de", len(pdfs), "sessoes")

    # proposicoes: por vereador (em paralelo), mais novas primeiro, ate achar so conhecidas fora da janela
    props = {p["id"]: p for p in carregar("proposicoes.json", [])}
    n_props_antes, novas_p, mudou = len(props), 0, 0
    limite = hoje - dt.timedelta(days=JANELA_PROP)

    def buscar(v):
        achados, pag = [], 1
        while True:
            d = C.api(f"/api/publico/proposicao/?autorID={v['autorID']}&pag={pag}&qtd=100")
            itens = d["Data"]
            conhecidos, fora_janela, antigo = True, True, False
            for it in itens:
                r = enxuto(it)
                if int(r["ano"]) < ANO_INICIO:
                    antigo = True; continue
                if r["id"] not in props:
                    conhecidos = False
                if dia(r["data"]) >= limite:
                    fora_janela = False
                achados.append(r)
            if antigo or not itens or not (d.get("Paginacao") or {}).get("proxima") or (conhecidos and fora_janela):
                return v["parlamentarID"], achados
            pag += 1

    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=4) as ex:
        resultados = list(ex.map(buscar, ver))
    for pid, achados in resultados:
        for r in achados:
            a = props.get(r["id"])
            if a:
                if a["situacao"] != r["situacao"]:
                    mudou += 1
                r["autores"] = sorted(set(a["autores"]) | {pid})
            else:
                novas_p += 1
                r["autores"] = [pid]
            props[r["id"]] = r
    print("proposicoes novas:", novas_p, "| com situacao alterada:", mudou)

    # conferencias antes de gravar
    problemas = []
    if len(ver) < 15: problemas.append(f"so {len(ver)} vereadores")
    if len(sess) < n_sess_antes: problemas.append("menos sessoes que antes")
    if len(pres) < n_pres_antes: problemas.append("menos presencas que antes")
    if len(props) < n_props_antes: problemas.append("menos proposicoes que antes")
    if novas_vot:
        ruim = sum(v["conferencia"] in ("DIVERGE", "sem_total") for v in novas_vot) / len(novas_vot)
        if ruim > 0.10: problemas.append(f"{ruim:.0%} das votacoes relidas nao conferem")
    if problemas:
        print("NAO GRAVEI. Problemas:", "; ".join(problemas)); sys.exit(1)

    gravar("vereadores.json", ver)
    gravar("sessoes.json", sorted(sess.values(), key=lambda s: -s["id"]))
    gravar("presencas.json", pres)
    gravar("votacoes.json", vot)
    for r in props.values(): r["grupo"] = _grupo(r["tipo"], r["assunto"])
    gravar("proposicoes.json", sorted(props.values(), key=lambda r: -int(r["id"])), compacto=True)
    gravar("estado.json", {"atualizado_em": dt.datetime.now().isoformat(timespec="seconds"), "camara_ultima_atualizacao": ult,
                           "contagens": {"vereadores": len(ver), "sessoes": len(sess), "votacoes": len(vot), "proposicoes": len(props)}})
    print("ok:", len(sess), "sessoes,", len(vot), "votacoes,", len(props), "proposicoes")

if __name__ == "__main__":
    main()
