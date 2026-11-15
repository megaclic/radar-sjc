"""Leitura do texto do 'Extrato de Votacao Eletronica' (pdftotext -layout).
Cada votacao e ancorada no quadro 'Presentes Favoraveis Contrarios Abstencoes'."""
import re, unicodedata

RUIDO = re.compile(r"Assinado digitalmente|DE OLIVEIRA|^\s*\d{2}/\d{2}/\d{4}\s*$|Autenticar documento|com o identificador|digitalmente conforme|assinado digitalmente|Brasileira - ICP|P[aá]g\. \d+ de \d+|C[aâ]mara Municipal de S[aã]o Jos|Rua Desembargador|Vila Santa Luzia|CEP:|E-mail:|EXTRATO DE VOTA|SESS[AÃ]O LEGISLATIVA|infraestrutura de Chaves|Brasileira\.", re.I)
ITEM = re.compile(r"^\s*\d{1,3}\)\s+\S")
CAB = re.compile(r"Presentes\s+Favor[aá]veis\s+Contr[aá]rios\s+Absten[cç][õo]es")
STATUS = {"Favorável", "Contrário", "Abstenção", "Presidente"}

def sem_acento(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").casefold()

def chave(nome):
    return re.sub(r"\s+", " ", sem_acento(re.sub(r"Ver\.ª?|Vereador[a]?", "", nome))).strip()

def achar_id(nome, mapa):
    k = chave(nome)
    if k in mapa:
        return mapa[k]
    cand = [v for kk, v in mapa.items() if kk.endswith(k) or k.endswith(kk)]
    return cand[0] if len(cand) == 1 and len(k) >= 6 else None

def pares(linha):
    if linha.lstrip().startswith("*"):
        return None
    toks = [t for t in re.split(r"\s{2,}", linha.strip()) if t]
    if len(toks) not in (2, 4):
        return None
    saida = []
    for n, s in zip(toks[0::2], toks[1::2]):
        s = s.rstrip("*").strip()
        if s not in STATUS or not re.fullmatch(r"[A-Za-zÀ-ú' .\-]+", n):
            return None
        saida.append((n.strip(), s))
    return saida

def extrair(txt, mapa):
    linhas = [l for l in txt.splitlines() if l.strip() and not RUIDO.search(l)]
    res, item, label, tem_resultado = [], [], [], None
    i, n = 0, len(linhas)
    while i < n:
        l = linhas[i]
        if ITEM.match(l):
            item, label, tem_resultado = [l.strip()], [], None
            j = i + 1   # titulo do item: linhas ate Resultado: ou quadro
            while j < n and not linhas[j].lstrip().startswith("Resultado:") and not CAB.search(linhas[j]) and not ITEM.match(linhas[j]) and pares(linhas[j]) is None and len(item) < 6:
                item.append(linhas[j].strip()); j += 1
            i = j; continue
        if l.lstrip().startswith("Resultado:"):
            tem_resultado = l.split("Resultado:", 1)[1].strip(); i += 1; continue
        if CAB.search(l):
            quorum = re.sub(CAB, "", l).strip()
            tot, nums_linha = None, ""
            if i + 1 < n:
                nums_linha = linhas[i + 1]
                nums = re.findall(r"\d+", nums_linha)
                if len(nums) >= 4:
                    tot = dict(zip(["presentes", "favoraveis", "contrarios", "abstencoes"], map(int, nums[-4:])))
            ctx = " ".join([quorum, nums_linha] + linhas[i + 2:i + 4])
            secreta = bool(re.search(r"secret", ctx, re.I))
            votos, j = {}, i + 2
            while j < n:
                p = pares(linhas[j])
                if p is None:
                    if linhas[j].lstrip().startswith("*"):
                        j += 1; continue
                    break
                for nome, st in p:
                    votos[nome] = {"status": st, "parlamentarID": achar_id(nome, mapa)}
                j += 1
            proc = re.search(r"Processo n[ºo]\s*(\d+)/(\d{4})", " ".join(item + label))
            res.append({
                "processo": f"{proc.group(1)}/{proc.group(2)}" if proc else None,
                "assunto": re.sub(r"\s+", " ", " ".join(item + label))[:400],
                "resultado": tem_resultado,
                "totais_pdf": tot,
                "secreta": secreta,
                "votos": votos,
            })
            label, tem_resultado = [], None
            i = j; continue
        label.append(l.strip()); i += 1
    return res

def confere(v):
    t = v["totais_pdf"]
    if not t:
        return "sem_total"
    if not v["votos"]:
        return "secreta_sem_voto_nominal" if v["secreta"] else "sem_voto_nominal_no_pdf"
    st = [x["status"] for x in v["votos"].values()]
    c = (st.count("Favorável"), st.count("Contrário"), st.count("Abstenção"))
    return "ok" if c == (t["favoraveis"], t["contrarios"], t["abstencoes"]) else "DIVERGE"
