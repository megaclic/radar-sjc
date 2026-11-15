"""Regra unica de classificacao das proposicoes em grupos que o morador entende.
Mesma regra para todos os vereadores. Baseada so no TIPO e no inicio do ASSUNTO.
Versao da regra: 1. Uso: python3 coletor/classificar.py  (mostra contagens e sobras)"""
import json, re, sys, unicodedata, collections
from pathlib import Path

VERSAO = 1
GRUPOS = {
    "melhoria": "Pedidos de melhoria e serviços",
    "cobranca": "Perguntas e cobranças (pedidos de informação)",
    "homenagem": "Homenagens (parabéns, pesar, título, nome de rua, data comemorativa)",
    "lei": "Propostas de lei e de decreto",
    "saude_individual": "Encaminhamento de caso individual de saúde",
    "posicionamento": "Moções, registros e manifestações (apoio, repúdio, matérias registradas)",
    "tramite": "Trâmites internos (atas, emendas, licenças)",
    "outros": "Outros",
}

def norm(s):
    s = unicodedata.normalize("NFD", s or "")
    return re.sub(r"\s+", " ", "".join(c for c in s if unicodedata.category(c) != "Mn")).strip().casefold().lstrip("​ ")

R_SAUDE = re.compile(r"regulacao de saude|agendamento de (consulta|cirurgia|exame|avaliacao|procedimento|tratamento|atendimento)")
R_HOMENAGEM = re.compile(r"^(agradece|registro voto|cumprimenta|apresenta votos|registra e parabeniza|parabeniza|congratula)|^(parabeniza|homenageia|manifesta (louvor|pesar|congratulacoes|aplauso)|registra mocao de (louvor|aplauso|congratulacoes|honra|pesar)|voto de (pesar|louvor|congratulacoes|aplauso))|^(manifesta|registra).{0,30}(pesar|louvor|congratulacoes)")
R_INFO = re.compile(r"\b(informacoes|esclarecimentos)\b")
R_DATA = re.compile(r"^(institui|inclui|cria).{0,40}\b(dia|semana|mes|calendario)\b.{0,12}(municipal|oficial|de|do|da|no)")
R_INTERNO = re.compile(r"justifica a ausencia|comunica que|autorizacao plenaria|licenca da verean|licenca para|afastamento")

def grupo(tipo, assunto):
    t, a = norm(tipo), norm(assunto)
    if t.startswith(("ata ", "documentos diversos", "emenda", "substitutivo", "recurso")):
        return "tramite"
    if t.startswith("mocao"):
        return "homenagem" if R_HOMENAGEM.search(a) else "posicionamento"
    if t.startswith("projeto de decreto legislativo"):
        return "homenagem" if re.match(r"^(concede|confere|institui o premio|entrega).{0,40}(titulo|medalha|premio|honraria)", a) or a.startswith(("concede", "confere")) and ("titulo" in a or "medalha" in a) else "lei"
    if t.startswith(("projeto de lei", "projeto de resolucao", "proposta de emenda")):
        if a.startswith("denomina") or R_DATA.search(a):
            return "homenagem"
        return "lei"
    if t.startswith("requerimento"):
        if R_SAUDE.search(a): return "saude_individual"
        if R_HOMENAGEM.search(a): return "homenagem"
        if R_INTERNO.search(a[:80]): return "tramite"
        if re.match(r"^registra\b", a): return "posicionamento"
        if R_INFO.search(a[:200]): return "cobranca"
        if a.startswith(("solicita",)) or a.startswith(("requer a ", "requer ao ", "requer aos ", "requer as ", "requer à ", "requer à")) or a.startswith("requer"):
            return "melhoria"
        return "outros"
    if t.startswith("indicacao"):
        return "cobranca" if R_INFO.search(a[:200]) else "melhoria"
    return "outros"

def aplicar():
    base = Path(__file__).resolve().parent.parent / "data"
    p = json.load(open(base / "proposicoes.json", encoding="utf-8"))
    for x in p: x["grupo"] = grupo(x["tipo"], x["assunto"])
    json.dump(p, open(base / "proposicoes.json.tmp", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    (base / "proposicoes.json.tmp").replace(base / "proposicoes.json")
    json.dump({"versao": VERSAO, "grupos": GRUPOS}, open(base / "grupos.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

if __name__ == "__main__":
    if "--aplicar" in sys.argv: aplicar(); print("grupo gravado em data/proposicoes.json"); sys.exit()
    p = json.load(open(Path(__file__).resolve().parent.parent / "data" / "proposicoes.json", encoding="utf-8"))
    c = collections.Counter(); sobras = collections.defaultdict(list)
    for x in p:
        g = grupo(x["tipo"], x["assunto"]); c[g] += 1
        if len(sobras[g]) < 400: sobras[g].append(x)
    print("regra v%d | total %d" % (VERSAO, len(p)))
    for g, n in c.most_common(): print(f"  {n:6d}  {g}  ({GRUPOS[g]})")
    if len(sys.argv) > 1:
        import random; random.seed(3)
        for x in random.sample(sobras[sys.argv[1]], min(14, len(sobras[sys.argv[1]]))): print("  -", x["tipo"], "|", x["assunto"][:140])
