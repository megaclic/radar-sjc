"""Baixa as proposicoes de cada vereador (por autorID) de 2025 em diante.
Grava data/proposicoes/<parlamentarID>_<ano>.json (retomavel) e atualiza
data/vereadores.json com o autorID.
Uso: python3 coletor/proposicoes.py"""
import json, os, time, urllib.request
from pathlib import Path

BASE = "https://camarasempapel.camarasjc.sp.gov.br"
_c = os.environ.get("RADAR_CONTATO", "")
UA = "RadarSJC/0.1 (projeto cidadao, dados oficiais)" + (f" {_c}" if _c else "")
PAUSA = float(os.environ.get("RADAR_PAUSA", "0.6"))
DATA = Path(__file__).resolve().parent.parent / "data"
ANOS = [2025, 2026]

def api(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as r:
        j = json.loads(r.read().decode("utf-8"))
    time.sleep(PAUSA)
    return j

def main():
    vf = DATA / "vereadores.json"
    ver = json.load(open(vf, encoding="utf-8"))
    for v in ver:
        if not v.get("autorID"):
            p = api(f"/api/publico/parlamentar/?parlamentarID={v['parlamentarID']}")["parlamentares"][0]
            v["autorID"] = p["autorID"]
    vf.write_text(json.dumps(ver, ensure_ascii=False, indent=1), encoding="utf-8")
    pasta = DATA / "proposicoes"; pasta.mkdir(exist_ok=True)
    import sys
    parte, de = (int(x) for x in sys.argv[sys.argv.index("--parte")+1].split("/")) if "--parte" in sys.argv else (0, 1)
    for i, v in enumerate(ver):
        if i % de != parte:
            continue
        for ano in ANOS:
            arq = pasta / f"{v['parlamentarID']}_{ano}.json"
            if arq.exists():
                continue
            itens, pag = [], 1
            while True:
                d = api(f"/api/publico/proposicao/?autorID={v['autorID']}&ano={ano}&pag={pag}&qtd=100")
                itens += d["Data"]
                pg = d.get("Paginacao") or {}
                if not pg.get("proxima"):
                    break
                pag += 1
            arq.write_text(json.dumps({"total_api": d["total"], "itens": itens}, ensure_ascii=False), encoding="utf-8")
            print(v["parlamentarNome"], ano, "total_api", d["total"], "baixadas", len(itens))

if __name__ == "__main__":
    main()
