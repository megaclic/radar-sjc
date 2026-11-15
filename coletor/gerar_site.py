"""Gera os JSONs do site (site/data) a partir de data/. Sem inventar nada: so reorganiza o que foi coletado."""
import json, collections, re
from pathlib import Path
RAIZ = Path(__file__).resolve().parent.parent
D, S = RAIZ / "data", RAIZ / "site" / "data"
(S / "v").mkdir(parents=True, exist_ok=True)
L = lambda n: json.load(open(D / n, encoding="utf-8"))
def W(p, o): json.dump(o, open(p, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
iso = lambda s: (s[6:10] + "-" + s[3:5] + "-" + s[0:2]) if s and len(s) >= 10 else ""

ver, sess, pres, vot, props = L("vereadores.json"), L("sessoes.json"), L("presencas.json"), L("votacoes.json"), L("proposicoes.json")
estado = L("estado.json"); grupos = L("grupos.json")
nome2id = {v["parlamentarNome"]: v["parlamentarID"] for v in ver}
sess_por_id = {str(s["id"]): s for s in sess}

# presenca
pres_v = collections.defaultdict(list)       # id -> [[sessao_id, data, tipo, status]]
sem_lista = {sid for sid in sess_por_id if not pres.get(sid)}
for sid, lista in pres.items():
    s = sess_por_id.get(sid)
    if not s or not lista: continue
    for nome, st in lista.items():
        if nome in nome2id: pres_v[nome2id[nome]].append([int(sid), iso(s["data"]), s["tipo"], st])
# votos
votos_v = collections.defaultdict(list)
em_verificacao = 0
for v in vot:
    if v["conferencia"] == "DIVERGE": em_verificacao += 1; continue
    for nome, x in v["votos"].items():
        if x.get("parlamentarID"):
            votos_v[x["parlamentarID"]].append([v["sessao_id"], iso(v["sessao_data"]), v["assunto"], x["status"], v["resultado"], v["pdf"]])
# proposicoes
prop_v = collections.defaultdict(list)
busca = []
for p in props:
    if p["grupo"] == "tramite": continue
    d = iso(p["data"])
    reg = [p["id"], p["sigla"], p["numero"], p["ano"], d, p["grupo"], p["assunto"], p["situacao"], p["arquivo"], p["autores"]]
    for a in p["autores"]: prop_v[a].append(reg)
    if p["grupo"] != "saude_individual":
        busca.append([p["id"], f'{p["sigla"]} {p["numero"]}/{p["ano"]}', d, p["grupo"], p["assunto"], p["arquivo"], p["autores"]])

resumo = []
for v in ver:
    i = v["parlamentarID"]
    pr = sorted(pres_v[i], key=lambda r: r[1], reverse=True)
    cont = collections.Counter(); por_ano = collections.defaultdict(collections.Counter)
    for r in pr: cont[r[3]] += 1; por_ano[r[1][:4]][r[3]] += 1
    gp = collections.Counter(r[5] for r in prop_v[i])
    vt = collections.Counter(r[3] for r in votos_v[i])
    pl = sorted(prop_v[i], key=lambda r: (r[4], r[0]), reverse=True)
    vv = sorted(votos_v[i], key=lambda r: r[1], reverse=True)
    resumo.append({"id": i, "nome": v["parlamentarNome"].replace("Ver. ", ""), "partido": v["partidoSigla"], "foto": v["parlamentarFoto"],
                   "situacao": v["parlamentarSituacao"], "mesa": v["parlamentarMesaCargo"], "email": v["parlamentarEmail"], "telefone": v["parlamentarTelefone"],
                   "presenca": dict(cont), "presenca_ano": {a: dict(c) for a, c in por_ano.items()},
                   "grupos": dict(gp), "votos": dict(vt), "n_props": len(pl)})
    # saude_individual: so a contagem, sem texto (LGPD)
    pl = [r if r[5] != "saude_individual" else r[:6] + ["", r[7], r[8], r[9]] for r in pl]
    W(S / "v" / f"{i}.json", {"presenca": pr, "proposicoes": pl, "votos": vv})
resumo.sort(key=lambda r: r["nome"])
W(S / "resumo.json", {"vereadores": resumo, "grupos": grupos["grupos"], "estado": estado,
                      "sessoes_total": len(sess), "sessoes_sem_lista": len(sem_lista), "votacoes_em_verificacao": em_verificacao,
                      "votacoes_total": len(vot), "votacoes_secretas": sum(1 for v in vot if v["conferencia"] == "secreta_sem_voto_nominal")})
W(S / "busca.json", busca)
print("site/data gerado:", len(resumo), "vereadores,", len(busca), "itens na busca,", em_verificacao, "votacoes em verificacao")
