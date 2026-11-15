const $=s=>document.querySelector(s),app=$('#app'),CAM='https://camarasempapel.camarasjc.sp.gov.br';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fd=d=>d?d.split('-').reverse().join('/'):'';const nf=n=>(n||0).toLocaleString('pt-BR');
const norm=s=>(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const cache={};const get=async u=>cache[u]??(cache[u]=await (await fetch(u)).json());
let R;
const PAGE=50;
async function init(){try{R=await get('data/resumo.json');}catch(e){app.innerHTML='<h1>Não foi possível carregar os dados</h1><p>Se você abriu o arquivo direto da pasta (endereço começando com file://), o navegador bloqueia a leitura dos dados. Abra pelo servidor local: dê dois cliques em <b>servir.bat</b> (na pasta do projeto) e acesse <b>http://localhost:8000</b>. Online, no GitHub Pages, isso não acontece.</p>';return;}
 $('#atualizado').textContent='Dados atualizados até '+R.estado.camara_ultima_atualizacao+' (coletados em '+fd(R.estado.atualizado_em.slice(0,10))+'). Legislatura atual: desde 01/01/2025.';
 window.addEventListener('hashchange',rota);rota();}
function rota(){const h=location.hash.replace(/^#\/?/,'').split('/');window.scrollTo(0,0);
 if(h[0]==='v')return vereador(+h[1],h[2]||'presenca');if(h[0]==='busca')return busca(decodeURIComponent(h[1]||''));if(h[0]==='sobre')return sobre();home();}
function home(){app.innerHTML=`<h1>O que cada vereador faz</h1>
<p>Vereadores de São José dos Campos nesta legislatura (a partir de 01/01/2025). Escolha um nome para ver presença nas sessões, propostas apresentadas e como votou. Os nomes estão em ordem alfabética.</p>
<ul class="grade">${R.vereadores.map(v=>{const p=v.presenca,tot=(p['Presente']||0)+(p['Falta']||0)+(p['Falta Justificada']||0);
return `<li><a class="card" href="#/v/${v.id}"><img src="${esc(v.foto)}" alt="" loading="lazy"><span><b>${esc(v.nome)}</b>${esc(v.partido)}${v.situacao!=='Ativo'?' · '+esc(v.situacao):''}<br><span class="peq">${nf(p['Presente'])} presenças em ${nf(tot)} sessões com lista · ${nf(v.n_props)} propostas</span></span></a></li>`}).join('')}</ul>
<p class="peq">Fonte: Câmara Sem Papel (sistema oficial da Câmara). Veja <a href="#/sobre">como contamos</a>.</p>`;}
function vereador(id,aba){const v=R.vereadores.find(x=>x.id===id);if(!v)return home();
 const ab=[['presenca','Presença'],['propostas','Propostas'],['votos','Votos']];
 app.innerHTML=`<p><a href="#/">← Todos os vereadores</a></p><div style="display:flex;gap:12px"><img class="foto" src="${esc(v.foto)}" alt=""><div><h1>${esc(v.nome)}</h1>${esc(v.partido)}${v.mesa&&v.mesa!=='não participa'?' · Mesa Diretora: '+esc(v.mesa):''}<br><span class="peq">${esc(v.email)} ${esc(v.telefone)}</span></div></div>
<div class="abas">${ab.map(([k,t])=>`<button class="${k===aba?'on':''}" onclick="location.hash='#/v/${id}/${k}'">${t}</button>`).join('')}</div><div id="aba">Carregando…</div>`;
 get('data/v/'+id+'.json').then(d=>({presenca,propostas,votos})[aba](v,d));}
function presenca(v,d){const p=v.presenca,anos=Object.keys(v.presenca_ano).sort().reverse();
 const linha=(n,c,k)=>`<div class="num"><b>${nf(c[k])}</b>${n}</div>`;
 $('#aba').innerHTML=`<p>Presença em sessões da Câmara, sessão por sessão. Só contam sessões que têm lista de presença registrada. Em ${nf(R.sessoes_sem_lista)} das ${nf(R.sessoes_total)} sessões (quase todas solenes) a Câmara não registrou lista, e elas ficam de fora: <b>"sem lista" não é falta</b>.</p>
${anos.map(a=>{const c=v.presenca_ano[a];return `<h2>${a}</h2><div class="nums">${linha('presente',c,'Presente')}${linha('falta justificada',c,'Falta Justificada')}${linha('falta',c,'Falta')}${linha('licenciado',c,'Licenciado')}</div>`}).join('')}
<details><summary><b>Ver sessão por sessão (${nf(d.presenca.length)})</b></summary><table><tr><th>Data</th><th>Tipo</th><th>Situação</th><th>Fonte</th></tr>${d.presenca.map(r=>`<tr><td>${fd(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td><a href="${CAM}/spl/sessao-parlamentares.aspx?id=${r[0]}" target="_blank" rel="noopener">lista oficial</a></td></tr>`).join('')}</table></details>
<p class="peq">Fonte: Câmara Sem Papel, lista de presença de cada sessão. Os totais conferem com a frequência em plenário informada pela API oficial.</p>`;}
function propostas(v,d){const G=R.grupos,g=v.grupos;
 $('#aba').innerHTML=`<p>${nf(v.n_props)} propostas (sem contar atas e trâmites internos). Todas foram separadas por uma regra única, igual para todos os vereadores (<a href="#/sobre">veja a regra</a>). Escolha um grupo para ler uma por uma.</p>
<div class="nums">${Object.keys(G).filter(k=>g[k]).map(k=>`<button class="num btn" style="text-align:left" data-g="${k}"><b>${nf(g[k])}</b>${esc(G[k])}</button>`).join('')}</div><div id="lista"></div>`;
 document.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>lista(v,d,b.dataset.g));}
function lista(v,d,g,pg=0,q='',ano=''){const all=d.proposicoes.filter(r=>r[5]===g&&(!ano||r[3]===ano)&&(!q||norm(r[6]).includes(norm(q))));
 const anos=[...new Set(d.proposicoes.filter(r=>r[5]===g).map(r=>r[3]))].sort().reverse(),L=$('#lista');
 const ind=g==='saude_individual';
 L.innerHTML=`<h2>${esc(R.grupos[g])}</h2>${ind?'<div class="aviso">Por privacidade (LGPD), o texto desses pedidos não é mostrado, pois citam pessoas. Aparece só a contagem e o link oficial.</div>':''}
<p><input type="search" id="q" placeholder="Buscar no texto (rua, bairro, assunto)" value="${esc(q)}" ${ind?'disabled':''}> <select id="ano"><option value="">Todos os anos</option>${anos.map(a=>`<option ${a===ano?'selected':''}>${a}</option>`).join('')}</select></p>
<p class="peq">${nf(all.length)} resultados</p>${all.slice(pg*PAGE,pg*PAGE+PAGE).map(r=>itemProp(r)).join('')}
<p>${pg>0?'<button class="btn" id="ant">← Anteriores</button> ':''}${(pg+1)*PAGE<all.length?'<button class="btn" id="prox">Próximos →</button>':''}</p>`;
 const re=(p,qq,aa)=>lista(v,d,g,p,qq,aa);
 $('#q').onchange=e=>re(0,e.target.value,$('#ano').value);$('#ano').onchange=e=>re(0,$('#q').value,e.target.value);
 if($('#ant'))$('#ant').onclick=()=>re(pg-1,q,ano);if($('#prox'))$('#prox').onclick=()=>re(pg+1,q,ano);}
const itemProp=r=>`<div class="item"><span class="tag">${esc(r[1])} ${esc(r[2])}/${esc(r[3])}</span>${esc(r[6]||'(texto não exibido)')}<small>${fd(r[4])} · ${esc(r[7])} · <a href="${esc(r[8])}" target="_blank" rel="noopener">documento oficial</a></small></div>`;
function votos(v,d){const t=v.votos,tot=Object.values(t).reduce((a,b)=>a+b,0);
 $('#aba').innerHTML=`<p>Votações nominais (em que a Câmara registra o voto de cada vereador). Votações secretas (${nf(R.votacoes_secretas)}) não têm voto individual. ${nf(R.votacoes_em_verificacao)} votações ficam fora porque o documento oficial se contradiz, e estão em verificação. O presidente da sessão não vota, salvo empate, por isso aparece como "Presidente".</p>
<div class="nums">${['Favorável','Contrário','Abstenção','Presidente'].map(k=>`<div class="num"><b>${nf(t[k])}</b>${k}</div>`).join('')}</div>
<p><select id="st"><option value="">Todos os votos</option><option>Favorável</option><option>Contrário</option><option>Abstenção</option></select> <input type="search" id="vq" placeholder="Buscar no assunto"></p><div id="vl"></div>`;
 const draw=(pg=0)=>{const st=$('#st').value,q=$('#vq').value;const a=d.votos.filter(r=>(!st||r[3]===st)&&(!q||norm(r[2]).includes(norm(q))));
  $('#vl').innerHTML=`<p class="peq">${nf(a.length)} votos</p>`+a.slice(pg*PAGE,pg*PAGE+PAGE).map(r=>`<div class="item"><span class="tag">${esc(r[3])}</span>${esc(r[2])}<small>Sessão de ${fd(r[1])} · resultado: ${esc(r[4])} · <a href="${esc(r[5])}" target="_blank" rel="noopener">extrato oficial</a></small></div>`).join('')+`<p>${pg>0?'<button class="btn" id="a2">← Anteriores</button> ':''}${(pg+1)*PAGE<a.length?'<button class="btn" id="p2">Próximos →</button>':''}</p>`;
  if($('#a2'))$('#a2').onclick=()=>draw(pg-1);if($('#p2'))$('#p2').onclick=()=>draw(pg+1);};
 $('#st').onchange=()=>draw();$('#vq').onchange=()=>draw();draw();}
async function busca(q){app.innerHTML=`<h1>Buscar rua, bairro ou assunto</h1><p>Procura em todas as propostas dos vereadores (indicações, requerimentos, projetos, moções).</p><p><input type="search" id="bq" placeholder="Ex.: Rua Tal, Vila Industrial, poda, buraco" value="${esc(q)}"> <button class="btn" id="go">Buscar</button></p><div id="res">${q?'Buscando…':''}</div>`;
 const go=()=>location.hash='#/busca/'+encodeURIComponent($('#bq').value.trim());$('#go').onclick=go;$('#bq').onkeydown=e=>{if(e.key==='Enter')go()};
 if(!q)return;const B=await get('data/busca.json'),ts=norm(q).split(/\s+/).filter(Boolean),pg=0;
 const a=B.filter(r=>{const t=norm(r[4]);return ts.every(x=>t.includes(x))}).sort((x,y)=>y[2].localeCompare(x[2]));
 const nome=Object.fromEntries(R.vereadores.map(v=>[v.id,v.nome])),por={};a.forEach(r=>r[6].forEach(i=>por[i]=(por[i]||0)+1));
 const ano={};a.forEach(r=>ano[r[2].slice(0,4)]=(ano[r[2].slice(0,4)]||0)+1);
 $('#res').innerHTML=a.length?`<p><b>${nf(a.length)}</b> propostas encontradas, de ${fd(a[a.length-1][2])} até ${fd(a[0][2])}.</p>
<div class="aviso">Vários pedidos sobre o mesmo lugar mostram que o assunto foi levado à Câmara mais de uma vez. <b>Isso não prova que a Prefeitura ignorou</b> o problema: o pedido pode ter sido atendido e voltar depois, ou ser um assunto diferente na mesma rua. Leia cada proposta e o andamento oficial.</div>
<p class="peq">Por ano: ${Object.keys(ano).sort().map(k=>k+': '+ano[k]).join(' · ')}<br>Por vereador: ${Object.entries(por).sort((x,y)=>y[1]-x[1]).map(([i,n])=>esc(nome[i])+' ('+n+')').join(' · ')}</p>
<div id="bl"></div>`:'<p>Nada encontrado. Tente menos palavras ou outra grafia.</p>';
 const draw=p=>{$('#bl').innerHTML=a.slice(p*PAGE,p*PAGE+PAGE).map(r=>`<div class="item"><span class="tag">${esc(r[1])}</span>${esc(r[4])}<small>${fd(r[2])} · ${esc(R.grupos[r[3]])} · ${r[6].map(i=>`<a href="#/v/${i}/propostas">${esc(nome[i])}</a>`).join(', ')} · <a href="${esc(r[5])}" target="_blank" rel="noopener">documento oficial</a></small></div>`).join('')+`<p>${p>0?'<button class="btn" id="a3">← Anteriores</button> ':''}${(p+1)*PAGE<a.length?'<button class="btn" id="p3">Próximos →</button>':''}</p>`;
  if($('#a3'))$('#a3').onclick=()=>draw(p-1);if($('#p3'))$('#p3').onclick=()=>draw(p+1);};if(a.length)draw(0);}
function sobre(){app.innerHTML=`<h1>Como funciona</h1>
<h2>De onde vêm os dados</h2><p>Só do sistema oficial da Câmara, o <a href="${CAM}/" target="_blank" rel="noopener">Câmara Sem Papel</a>: lista de vereadores, listas de presença de cada sessão, propostas apresentadas e extratos da votação eletrônica. Cada número tem um link para o documento oficial.</p>
<h2>O que contamos</h2><ul><li><b>Presença:</b> lista oficial de cada sessão. Sessões sem lista registrada não entram (não é falta). Conferimos nossa contagem com o total que a própria Câmara informa.</li>
<li><b>Votos:</b> lidos dos extratos em PDF e conferidos com os totais de cada votação. Se não bate, a votação fica fora e marcada "em verificação". Votos secretos não têm registro individual.</li>
<li><b>Propostas:</b> tudo o que o vereador apresentou, inclusive com outros autores.</li></ul>
<h2>A regra dos grupos (igual para todos)</h2><p>Usamos só o tipo do documento e as primeiras palavras do assunto, sem julgar o mérito:</p><ul>
<li><b>${esc(R.grupos.melhoria)}:</b> indicações e requerimentos que pedem algo à Prefeitura ou a empresas (poda, reparo, serviço).</li>
<li><b>${esc(R.grupos.cobranca)}:</b> quando o texto pede informações ou esclarecimentos.</li>
<li><b>${esc(R.grupos.homenagem)}:</b> parabéns, agradecimentos, pesar, títulos, medalhas, nome de rua e datas comemorativas.</li>
<li><b>${esc(R.grupos.lei)}:</b> projetos de lei, de decreto, de resolução e emendas à Lei Orgânica.</li>
<li><b>${esc(R.grupos.saude_individual)}:</b> pedidos de agendamento de consulta ou exame de pessoas. O texto não é exibido (privacidade).</li>
<li><b>${esc(R.grupos.posicionamento)}:</b> apoio, repúdio e matérias registradas.</li></ul>
<p>Atas, emendas, substitutivos e licenças não são propostas do vereador e ficam de fora das contagens. Como a regra lê o texto, um caso isolado pode cair no grupo errado: use o link do documento oficial.</p>
<h2>Limites</h2><ul><li>Quantidade de propostas não mede qualidade nem resultado.</li><li>Vários pedidos sobre o mesmo local não provam omissão da Prefeitura.</li><li>Dados coletados por robô uma vez ao dia; o dia da última atualização aparece no rodapé.</li></ul>
<h2>Erro ou correção</h2><p>Se achar algum dado errado, avise com o link da página e do documento oficial (canal de contato será definido na publicação).</p>`;}
init();
