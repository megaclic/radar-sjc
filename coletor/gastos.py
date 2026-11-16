"""Gastos da Camara pela API oficial do Portal da Transparencia. Uso: python3 coletor/gastos.py
Grava site/data/gastos.json. So le dados publicos; nao inventa nada. Se a coleta vier estranha, sai com erro e nao grava."""
import datetime as dt, html, json, os, re, sys, time, unicodedata, urllib.parse, urllib.request
from pathlib import Path
RAIZ = Path(__file__).resolve().parent.parent
OUT = RAIZ / "site" / "data" / "gastos.json"
PORTAL = "https://portal.camarasjc.sp.gov.br"
API = PORTAL + "/portal-transparencia/api"
REM = PORTAL + "/cmsjc/websis/portal_transparencia/financeiro/contas_publicas/index.php?consulta=../lei_acesso/lai_remuneracoes"
ANOS = [int(a) for a in os.environ.get("RADAR_GASTOS_ANOS", "2025,2026").split(",")]
ALIAS = {"jose luis": "ze luis", "rogerio acasem": "rogerio da acasem"}
UA = {"User-Agent": "RadarPoliticoSJC/1.0 (dados abertos)"}

def req(url, dados=None, tent=4):
    for i in range(tent):
        try:
            r = urllib.request.Request(url, data=dados, headers=UA)
            return urllib.request.urlopen(r, timeout=120).read()
        except Exception as e:
            if i == tent - 1: raise
            time.sleep(2 * (i + 1))

def api(rota, **q):
    return json.loads(req(API + rota + "?" + urllib.parse.urlencode(q)).decode("utf-8"))

def dinheiro(s):
    if isinstance(s, (int, float)): return float(s)
    s = str(s or "").replace("R$", "").strip()
    neg = s.startswith("-")
    v = float(re.sub(r"[^\d,]", "", s).replace(",", ".") or 0)
    return -v if neg else v

def nz(s):
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"\s+", " ", re.sub(r"[^a-z ]", " ", s)).strip()

def chave_nome(s):
    k = nz(s)
    k = re.sub(r"^(gab ver|vereadora?|ver) ", "", k).strip()
    return ALIAS.get(k, k)

ATENCAO = re.compile(r"Gêneros de Alimentação|Copa e Cozinha|Exposições|Recepç|Festiv|Homenag|Brinde|Presente|Condecora|Premia", re.I)

def cat(sub):
    if "Passagens" in sub: return "Passagens"
    if "Hospedagens" in sub: return "Hospedagem"
    if "Diárias" in sub or "Diarias" in sub: return "Diárias"
    if re.search(r"Software|Tecnologia", sub): return "Software e TI"
    if sub.startswith("4.4"): return "Equipamentos e mobiliário"
    if re.search(r"Treinamento|Cursos|Inscri", sub): return "Cursos e treinamento"
    if "Propaganda" in sub or "Publicidade" in sub: return "Publicidade"
    return "Outros"

def despesas(ano):
    d = urllib.parse.quote(dt.date(ano, 12, 31).strftime("%a %b %d %Y") + " 00:00:00 GMT-0300 (Horário Padrão de Brasília)")
    url = f"{API}/execucao/despesas_detalhadas/despesas_detalhadas?id_entidade=1&ano={d}&data_inicial=undefined&data_final=undefined&filtro=undefined"
    j = json.loads(req(url).decode("utf-8"))
    return j["despesas_detalhadas"]

def linhas_html(h):
    out = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", h, re.S | re.I):
        tds = [html.unescape(re.sub(r"<[^>]+>", "", c)).strip() for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, re.S | re.I)]
        tds = [re.sub(r"\s+", " ", c) for c in tds]
        if tds: out.append(tds)
    return out

def competencias():
    hoje = dt.date.today()
    return [f"{m:02d}/{a}" for a in sorted(ANOS) for m in range(1, 13) if (a, m) < (hoje.year, hoje.month)]

def folha_mes(comp):
    h = req(REM, urllib.parse.urlencode({"ds_schema": "0|entidade002", "competencia": comp}).encode()).decode("latin-1")
    ls = linhas_html(h)
    cab = next((l for l in ls if l and l[0].startswith("Nome do Servidor")), None)
    if not cab or "Salário Bruto" not in cab[12] or "Salário Líquido" not in cab[13]:
        raise SystemExit("Layout da pagina de Remuneracao mudou; nada foi gravado.")
    return [l for l in ls if len(l) >= 14 and l[0] != cab[0]]

def main():
    resumo = json.load(open(RAIZ / "site" / "data" / "resumo.json", encoding="utf-8"))
    por_chave = {chave_nome(v["nome"]): v["id"] for v in resumo["vereadores"]}
    V = {v["id"]: {"id": v["id"], "nome": v["nome"], "folha": {}, "itens": [], "cats": {}} for v in resumo["vereadores"]}
    nao_map = {}
    geral = {"anos": {}}
    pub = {}
    atencao = {}
    for ano in ANOS:
        rows = despesas(ano)
        emp = sum(dinheiro(r["vl_empenhado"]) for r in rows); pago = sum(dinheiro(r["vl_pago"]) for r in rows)
        geral["anos"][ano] = {"empenhado": round(emp, 2), "pago": round(pago, 2), "empenhos": len(rows)}
        for r in rows:
            cc = r.get("centro_custo") or ""
            sub = r.get("subelemento") or ""
            if re.search(r"Propaganda|Publicidade", sub) or "3.3.90.39.47" in sub:
                k = (ano, r["credor"], sub[:12], r.get("contrato") or "")
                p = pub.setdefault(k, {"ano": ano, "credor": r["credor"], "subelemento": sub, "contrato": r.get("contrato") or "", "objeto": (r.get("objeto_contrato") or "")[:1200], "empenhado": 0.0, "pago": 0.0, "n": 0})
                p["empenhado"] += dinheiro(r["vl_empenhado"]); p["pago"] += dinheiro(r["vl_pago"]); p["n"] += 1
            if ATENCAO.search(sub):
                at = atencao.setdefault(sub, {"sub": sub, "n": 0, "empenhado": 0.0, "pago": 0.0, "itens": []})
                at["n"] += 1; at["empenhado"] += dinheiro(r["vl_empenhado"]); at["pago"] += dinheiro(r["vl_pago"])
                at["itens"].append({"a": ano, "d": (r.get("dt_doc_despesa") or "")[:10], "doc": r.get("doc_despesa"), "cred": r.get("credor"), "cc": re.sub(r"^[\d. ]+-\s*", "", cc), "h": (r.get("historico") or "")[:1200], "emp": round(dinheiro(r["vl_empenhado"]), 2)})
            m = re.search(r"VEREADORA?\s+(.+)$", cc, re.I)
            if not m: continue
            nome = m.group(1).strip(); vid = por_chave.get(chave_nome(nome))
            if vid is None:
                nao_map[nome] = nao_map.get(nome, 0) + 1; continue
            c = cat(sub); e = dinheiro(r["vl_empenhado"]); p_ = dinheiro(r["vl_pago"])
            a = V[vid]["cats"].setdefault(str(ano), {}).setdefault(c, [0.0, 0.0]); a[0] += e; a[1] += p_
            V[vid]["itens"].append({"_id": r.get("id_doc_despesa"), "a": ano, "d": (r.get("dt_doc_despesa") or "")[:10], "doc": r.get("doc_despesa"), "cred": r.get("credor"), "cat": c, "sub": sub, "h": (r.get("historico") or "")[:1200], "emp": round(e, 2), "pago": round(p_, 2)})
        time.sleep(1)
        det = api("/execucao/detalhamento_despesas/detalhamento_despesas", ano=ano, id_entidade=1, classificacao="", dias=0)["detalhamento_despesas"]
        geral["anos"][ano]["elementos"] = [{"nat": x["natureza"], "elem": x["elemento"], "previsto": x["vl_previsto"], "empenhado": x["vl_total_emp"], "pago": x["vl_total_pag"]} for x in det if x["vl_total_emp"] or x["vl_previsto"]]
    # notas fiscais (liquidacoes) de cada compra dos gabinetes
    for v in V.values():
        for i in v["itens"]:
            d = urllib.parse.quote(dt.date(i["a"], 12, 31).strftime("%a %b %d %Y") + " 00:00:00 GMT-0300 (Horário Padrão de Brasília)")
            try:
                j = json.loads(req(f"{API}/execucao/despesas_detalhadas/liquidacoes?ano={d}&data_inicial=undefined&data_final=undefined&id_empenho={i['_id']}").decode("utf-8"))
                i["nf"] = [{"nf": (l.get("ds_nf") or "").strip(), "liq": l.get("liquidacao"), "dt": (l.get("dt_movimento") or "")[:10], "v": l.get("vl_movimento"), "pg": l.get("vl_pago")} for l in j.get("liquidacoes", [])]
            except Exception:
                i["nf"] = []
            if i["emp"] == 0:
                try:
                    j = json.loads(req(f"{API}/execucao/despesas_detalhadas/empenhos?ano={d}&data_inicial=undefined&data_final=undefined&id_empenho={i['_id']}").decode("utf-8"))
                    i["mov"] = [{"t": m.get("tp_movimento"), "v": m.get("vl_movimento")} for m in j.get("empenhos", [])]
                except Exception:
                    i["mov"] = []
            i.pop("_id", None); time.sleep(0.15)
    # folha dos gabinetes
    comps = competencias()
    mes_ok = 0; usadas = []
    for comp in comps:
        mm, aa = comp.split("/")
        linhas = folha_mes(comp)
        if not linhas: continue
        lot = api("/rh/servidores/servidores_ativos", id_entidade=1, competencia=f"{aa}-{mm}-15", tipo="ativos")
        arr = lot if isinstance(lot, list) else next(v for v in lot.values() if isinstance(v, list))
        lot_por_nome = {nz(s["nome"]): s["lotacao"] for s in arr}
        acc = {}
        for l in linhas:
            lo = lot_por_nome.get(nz(l[0]), "")
            if not lo.startswith("GAB.VER."): continue
            vid = por_chave.get(chave_nome(lo))
            if vid is None:
                nao_map["lotacao:" + lo] = nao_map.get("lotacao:" + lo, 0) + 1; continue
            o = acc.setdefault(vid, {"bruto": 0.0, "n": 0}); o["bruto"] += dinheiro(l[12]); o["n"] += 1
        for vid, o in acc.items():
            V[vid]["folha"][comp] = [round(o["bruto"], 2), o["n"]]
        mes_ok += 1; usadas.append(comp); time.sleep(1)
    com_dados = sum(1 for v in V.values() if v["folha"] and v["itens"] is not None)
    if not geral["anos"] or mes_ok < 12 or sum(1 for v in V.values() if v["folha"]) < 18:
        raise SystemExit("Coleta incompleta (folha ou despesas); nada foi gravado.")
    for v in V.values():
        v["itens"].sort(key=lambda i: i["d"], reverse=True)
        for a, d in v["cats"].items():
            for c in d: d[c] = [round(d[c][0], 2), round(d[c][1], 2)]
    pubs = sorted(pub.values(), key=lambda p: (-p["ano"], -p["empenhado"]))
    for p in pubs: p["empenhado"] = round(p["empenhado"], 2); p["pago"] = round(p["pago"], 2)
    saida = {"gerado_em": dt.datetime.now().isoformat(timespec="seconds"), "anos": ANOS, "competencias": usadas,
             "fonte": {"portal": PORTAL + "/portal-transparencia/", "despesas": PORTAL + "/portal-transparencia/execucao/despesas-detalhadas", "remuneracao": REM},
             "geral": geral, "publicidade": pubs, "vereadores": list(V.values()), "atencao": sorted(({**a, "empenhado": round(a["empenhado"], 2), "pago": round(a["pago"], 2), "itens": sorted(a["itens"], key=lambda x: -x["emp"])[:8]} for a in atencao.values()), key=lambda a: -a["empenhado"]), "nao_mapeados": nao_map}
    tmp = OUT.with_suffix(".tmp")
    tmp.write_text(json.dumps(saida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    os.replace(tmp, OUT)
    print("gastos.json gravado:", OUT.stat().st_size, "bytes;", len(comps), "competencias;", "nao mapeados:", nao_map)

if __name__ == "__main__":
    main()
