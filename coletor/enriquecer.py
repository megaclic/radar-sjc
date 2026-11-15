"""Extrai do TEXTO da proposicao: tema, rua e bairro. Regras simples e iguais para todos.
So leitura do texto oficial: se nao achar, fica vazio (nao chuta)."""
import re, unicodedata

def _n(s):
    s = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in s if unicodedata.category(c) != "Mn").casefold()

TEMAS = [  # ordem importa: o primeiro que casar vence
    ("Iluminação", r"ilumina|lampada|luminaria|poste\b|postes\b"),
    ("Água e esgoto", r"boca de lobo|bueiro|drenagem|galeria|esgoto|vazamento|sabesp|enchente|alagamento|corrego|agua\b|aguas pluviais"),
    ("Asfalto e buracos", r"tapa.?buraco|buraco|asfalt|recapeamento|pavimenta|calcada|sarjeta|guia rebaixada|cratera|operacao tapa"),
    ("Trânsito", r"transito|trafego|sinaliza|faixa de pedestre|lombada|redutor|semafor|ponto de onibus|estacionamento|mao dupla|radar|cruzamento|rotatoria|ciclofaixa|ciclovia"),
    ("Limpeza e poda", r"poda|arvore|capina|rocagem|limpeza|entulho|supressao|mato\b|lixo|descarte|terreno baldio|desobstru"),
    ("Praças e lazer", r"praca|parquinho|playground|academia ao ar livre|academia da melhor|quadra|campo de futebol|parque\b|bebedouro|skate|areas? de lazer"),
    ("Segurança", r"patrulhamento|policiamento|guarda civil|\bgcm\b|camera|ronda|batalhao|seguranca"),
    ("Saúde e educação", r"\bubs\b|upa\b|saude|escola|creche|emei|emef|posto de saude|medico|hospital"),
]
_T = [(n, re.compile(p)) for n, p in TEMAS]
def tema(assunto):
    a = _n(assunto)
    for n, r in _T:
        if r.search(a): return n
    return "Outros pedidos"

_VIA = r"(?:Rua|Avenida|Av\.|Travessa|Estrada|Alameda|Rodovia)"
_NOME = r"[A-ZÀ-Ú0-9][\wÀ-ú'.ºª°-]*(?:\s+(?:d[aeo]s?\s+|e\s+)?[A-ZÀ-Ú0-9][\wÀ-ú'.ºª°-]*){0,4}"
R_RUA = re.compile(r"\b(" + _VIA + r"\s+(?:d[aeo]s?\s+)?" + _NOME + r")")
def rua(assunto):
    m = R_RUA.search(assunto or "")
    if not m: return ""
    s = m.group(1).strip(" .,;")
    s = re.sub(r"^Av\.\s*", "Avenida ", s)
    s = re.sub(r"\s+(?:n[ºo°]|numero|altura|esquina|em frente|nas|nos|no|na|bairro)\b.*$", "", s, flags=re.I)
    return s.strip(" .,;")

_PREF = r"(?:Jardim|Vila|Parque|Residencial|Conjunto Habitacional|Conjunto Residencial|Chácaras?|Altos d[aeo]s?|Bosque|Colinas?|Cidade|Santa|São|Loteamento|Recanto|Villa|Reserva|Solar|Bairro|Distrito|Condomínio|Portal|Morada|Alto|Novo|Nova|Monte|Parque Industrial|Urbanova|Buquirinha|Centro)"
R_BAIRRO = [
    re.compile(r"\b(?:bairros?|loteamento|distrito|condom[ií]nio)\s+((?:d[aeo]s?\s+)?[A-ZÀ-Ú0-9][\wÀ-ú'.ºª°-]*(?:\s+(?:d[aeo]s?\s+|e\s+)?[A-ZÀ-Ú0-9][\wÀ-ú'.ºª°-]*){0,4})", re.I),
    re.compile(r"\b(" + _PREF + r"\s+(?:d[aeo]s?\s+)?[A-ZÀ-Ú0-9][\wÀ-ú'.ºª°-]*(?:\s+(?:d[aeo]s?\s+|e\s+)?[A-ZÀ-Ú0-9][\wÀ-ú'.ºª°-]*){0,3})"),
]
_RUIM = {'São Paulo','São José Dos Campos','São José','São José dos Campos','Santa Casa','São Paulo Distribuição'}
def bairro(assunto):
    a = assunto or ""
    for r in R_BAIRRO:
        for m in r.finditer(a):
            s = m.group(1).strip(" .,;:")
            s = re.split(r"\s+(?:conforme|em|para|que|junto|com|ao|à|a|no|na|nos|nas|pr[óo]ximo|ponto|esquina|altura|referente|visando)\b", s)[0].strip(" .,;:")
            if s in _RUIM or s.startswith('São Paulo') or s.startswith('São José dos Campos'): continue
            if len(s) >= 4 and not re.match(r"^(?:Rua|Avenida|Av\.|Praça|Travessa|Estrada)\b", s):
                return " ".join(w if w.lower() in ("de","da","do","das","dos","e") else w[:1].upper()+w[1:] for w in s.split())
    return ""

R_INDIVIDUAL = re.compile(r"\b(vaga|matricula|transferencia)\b.{0,160}\b(aluno|aluna|crianca|menor)\b|\b(aluno|aluna)\b.{0,60}\b(vaga|matricula)\b")
def caso_individual_escolar(assunto):
    return bool(R_INDIVIDUAL.search(_n(assunto)))
