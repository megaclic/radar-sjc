"""Baixa os extratos de votacao (PDF) das sessoes da 19a legislatura e extrai
o voto de cada vereador. Confere cada votacao com o quadro de totais do PDF.
Uso: python3 coletor/votos.py   (depois de coletar.py)"""
import json, os, re, subprocess, sys, time, html, urllib.parse, urllib.request, http.cookiejar
from pathlib import Path

BASE = "https://camarasempapel.camarasjc.sp.gov.br"
_c = os.environ.get("RADAR_CONTATO", "")
UA = "RadarSJC/0.1 (projeto cidadao, dados oficiais)" + (f" {_c}" if _c else "")
PAUSA = float(os.environ.get("RADAR_PAUSA", "0.6"))
RAIZ = Path(__file__).resolve().parent.parent
DATA, CACHE = RAIZ / "data", RAIZ / "cache" / "pdfs"
ALVO = "ctl00$ContentPlaceHolder1$lvSessoes_lbNext"
STATUS = ["Favorável", "Contrário", "Abstenção"]

cj = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
op.addheaders = [("User-Agent", UA)]

def req(url, dados=None, tentativas=3):
    d = urllib.parse.urlencode(dados).encode() if dados else None
    for t in range(1, tentativas + 1):
        try:
            with op.open(urllib.request.Request(url, data=d), timeout=60) as r:
                corpo = r.read()
            time.sleep(PAUSA)
            return corpo
        except Exception:
            if t == tentativas:
                raise
            time.sleep(3 * t)

def campos(h):
    return {k: html.unescape(v) for k, v in re.findall(
        r'<input type="hidden" name="([^"]+)"[^>]*value="([^"]*)"', h)}

def links_votacao(h):
    # href em aspas simples ou duplas; so PDFs de sessao cujo texto cita "Votação"
    achados = {}
    for href, txt in re.findall(r"<a [^>]*href=['\"]([^'\"]+/SES/\d+/[^'\"]+)['\"][^>]*>(.*?)</a>", h, re.S):
        if "Vota" in html.unescape(txt):
            sid = int(re.search(r"/SES/(\d+)/", href).group(1))
            achados.setdefault(sid, []).append(html.unescape(href))
    return achados

def ids_na_pagina(h):
    return {int(i) for i in re.findall(r"sessao-parlamentares\.aspx\?id=(\d+)", h)} | \
           {int(i) for i in re.findall(r"/SES/(\d+)/", h)}

def listar_pdfs(ids_alvo):
    h = req(BASE + "/spl/sessoes.aspx").decode("utf-8", "replace")
    total = int(re.search(r'lvSessoes_TotalPages"[^>]*value="(\d+)"', h).group(1))
    todos, pag = {}, 1
    while True:
        for sid, urls in links_votacao(h).items():
            todos.setdefault(sid, set()).update(urls)
        if not (ids_na_pagina(h) & ids_alvo) or pag >= total:
            break
        f = campos(h); f["__EVENTTARGET"] = ALVO; f["__EVENTARGUMENT"] = ""
        h = req(BASE + "/spl/sessoes.aspx", f).decode("utf-8", "replace")
        pag += 1
        if pag % 5 == 0: print(" lista, pagina", pag)
    return {k: sorted(v) for k, v in todos.items() if k in ids_alvo}

def baixar(url, sid):
    CACHE.mkdir(parents=True, exist_ok=True)
    nome = CACHE / (f"{sid}_" + re.sub(r"\W", "", url.split("/")[-1].split("?")[0])[-24:] + ".pdf")
    if not nome.exists():
        nome.write_bytes(req(url if url.startswith("http") else BASE + url))
    return nome

def texto(pdf):
    return subprocess.run(["pdftotext", "-layout", str(pdf), "-"], capture_output=True, text=True).stdout

from votos_parse import extrair, confere, chave

def main():
    global MAPA
    MAPA = {chave(v["parlamentarNome"]): v["parlamentarID"] for v in json.load(open(DATA / "vereadores.json", encoding="utf-8"))}
    sessoes = {s["id"]: s for s in json.load(open(DATA / "sessoes.json", encoding="utf-8"))}
    pdfs = listar_pdfs(set(sessoes))
    print("sessoes com PDF de votacao:", len(pdfs))
    saida, estat = [], {}
    for n, (sid, urls) in enumerate(sorted(pdfs.items()), 1):
        for u in urls:
            try:
                vs = extrair(texto(baixar(u, sid)), MAPA)
            except Exception as e:
                print("erro", sid, e); continue
            for v in vs:
                v["sessao_id"], v["sessao_data"], v["pdf"] = sid, sessoes[sid]["data"], u
                v["conferencia"] = confere(v)
                estat[v["conferencia"]] = estat.get(v["conferencia"], 0) + 1
                saida.append(v)
        if n % 20 == 0: print(" pdfs", n, "/", len(pdfs))
    (DATA / "votacoes.json").write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
    print("votacoes:", len(saida), "| conferencia:", estat)

if __name__ == "__main__":
    main()
