"""Junta data/proposicoes/*.json (brutos, 1 por vereador e ano) em um unico
data/proposicoes.json enxuto, sem repetir proposicoes de mais de um autor."""
import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
CAMPOS = ("id", "processo", "ano", "sigla", "tipo", "numero", "assunto", "data", "situacao", "arquivo")

def main():
    por_id = {}
    for f in sorted((DATA / "proposicoes").glob("*.json")):
        pid = int(f.name.split("_")[0])
        for it in json.load(open(f, encoding="utf-8"))["itens"]:
            reg = por_id.setdefault(it["id"], {k: (it[k].strip() if isinstance(it[k], str) else it[k]) for k in CAMPOS} | {"autores": []})
            if pid not in reg["autores"]:
                reg["autores"].append(pid)
    saida = sorted(por_id.values(), key=lambda r: int(r["id"]), reverse=True)
    (DATA / "proposicoes.json").write_text(json.dumps(saida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("proposicoes unicas:", len(saida), "| coautoria:", sum(len(r["autores"]) > 1 for r in saida))

if __name__ == "__main__":
    main()
