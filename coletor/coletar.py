"""Coletor do Radar: baixa dados oficiais da Camara Sem Papel (CM SJC).
Uso: python3 coletor/coletar.py [--limite N]
So biblioteca padrao. Pausa entre pedidos para nao pesar no servidor.
Contato opcional no User-Agent: defina a variavel RADAR_CONTATO."""
import json, os, re, sys, time, html
import urllib.request
from pathlib import Path

BASE = "https://camarasempapel.camarasjc.sp.gov.br"
_contato = os.environ.get("RADAR_CONTATO", "")
UA = "RadarSJC/0.1 (projeto cidadao, dados oficiais)" + (f" {_contato}" if _contato else "")
PAUSA = float(os.environ.get("RADAR_PAUSA", "0.6"))
DATA = Path(__file__).resolve().parent.parent / "data"

def get(path, tentativas=3):
    for t in range(1, tentativas + 1):
        try:
            req = urllib.request.Request(BASE + path, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=45) as r:
                corpo = r.read().decode("utf-8", errors="replace")
            time.sleep(PAUSA)
            return corpo
        except Exception as e:
            if t == tentativas:
                raise
            time.sleep(3 * t)

def api(path):
    return json.loads(get(path))

def paginado(path, chave):
    itens, pag = [], 1
    while True:
        sep = "&" if "?" in path else "?"
        d = api(f"{path}{sep}pag={pag}&qtd=100")
        itens += d[chave]
        if not d.get("Paginacao") or not d["Paginacao"].get("proxima"):
            break
        pag += 1
    return itens

def presenca(sessao_id):
    h = get(f"/spl/sessao-parlamentares.aspx?id={sessao_id}")
    t = html.unescape(re.sub(r"<[^>]+>", "\n", h))
    linhas = [l.strip() for l in t.splitlines() if l.strip()]
    res, i = {}, 0
    while i < len(linhas) - 1:
        if linhas[i].startswith("Ver."):
            res[linhas[i]] = linhas[i + 1]
            i += 2
        else:
            i += 1
    return res

def main():
    limite = int(sys.argv[sys.argv.index("--limite") + 1]) if "--limite" in sys.argv else None
    DATA.mkdir(exist_ok=True)

    d = api("/api/publico/parlamentar/?pag=1&qtd=100")
    vereadores = d["parlamentares"]
    print("vereadores:", len(vereadores), "de", d["total"])

    sessoes = paginado("/api/publico/spl/sessoes", "Data")
    sessoes = [s for s in sessoes if s["legislatura"] == "19"]
    print("sessoes da 19a legislatura:", len(sessoes))
    if limite:
        sessoes = sessoes[:limite]

    pres = {}
    for n, s in enumerate(sessoes, 1):
        try:
            pres[s["id"]] = presenca(s["id"])
        except Exception as e:
            pres[s["id"]] = {"_erro": str(e)}
        if n % 25 == 0:
            print(" presencas", n, "/", len(sessoes))

    (DATA / "vereadores.json").write_text(json.dumps(vereadores, ensure_ascii=False, indent=1), encoding="utf-8")
    (DATA / "sessoes.json").write_text(json.dumps(sessoes, ensure_ascii=False, indent=1), encoding="utf-8")
    (DATA / "presencas.json").write_text(json.dumps(pres, ensure_ascii=False, indent=1), encoding="utf-8")
    print("ok")

if __name__ == "__main__":
    main()
