const $=s=>document.querySelector(s),app=$('#app'),CAM='https://camarasempapel.camarasjc.sp.gov.br';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fd=d=>d?d.split('-').reverse().join('/'):'';const nf=n=>(n||0).toLocaleString('pt-BR');
const MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];const fm=d=>d?MES[+d.slice(5,7)-1]+' '+d.slice(0,4):'';
const norm=s=>(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const cache={};const get=async u=>cache[u]??(cache[u]=await (await fetch(u)).json());
const PAGE=40;let R,NOME={};
const dec=s=>{try{return decodeURIComponent(s||'')}catch(e){return s||''}};
const GCOR={melhoria:'az',cobranca:'am',homenagem:'rs',lei:'vd'};
async function init(){try{R=await get('data/resumo.json');}catch(e){app.innerHTML='<h1>Não foi possível carregar os dados</h1><p>Se você abriu o arquivo direto da pasta (endereço começando com file://), o navegador bloqueia a leitura dos dados. Abra pelo servidor local: dê dois cliques em <b>servir.bat</b> (na pasta do projeto) e acesse <b>http://localhost:8000</b>. Online, no GitHub Pages, isso não acontece.</p>';return;}
 R.vereadores.forEach(v=>NOME[v.id]=v.nome);
 $('#atualizado').textContent='Dados atualizados até '+R.estado.camara_ultima_atualizacao+' (coletados em '+fd(R.estado.atualizado_em.slice(0,10))+'). Legislatura atual, desde 01/01/2025.';
 window.addEventListener('hashchange',rota);rota();}
function rota(){const h=location.hash.replace(/^#\/?/,'').split('/');window.scrollTo(0,0);
 switch(h[0]){case 'v':return vereador(+h[1],h[2]||'presenca',h[3]||'');
  case 'busca':return busca(dec(h[1]),dec(h[2]),dec(h[3]),dec(h[4]));
  case 'tema':return busca('',dec(h[1]),'','');case 'grupo':return busca('','',dec(h[1]),'');
  case 'sobre':return sobre();default:return home();}}
const pres=v=>{const p=v.presenca,pr=p['Presente']||0,fj=p['Falta Justificada']||0,f=p['Falta']||0,tot=pr+fj+f;return {pr,fj,f,tot,pct:tot?Math.round(pr*100/tot):0}};
function share(t,u){return `<button class="btn cl share" onclick="(navigator.share?navigator.share({title:'${esc(t)}',url:location.href}):navigator.clipboard.writeText(location.href).then(()=>this.textContent='Link copiado'))">Compartilhar</button>`}
/* ---------- INÍCIO ---------- */
async function home(){const A=R.agreg,G=R.grupos,T=A.grupos_total;
 const bairros=await get('data/bairros.json');
 const top=[...R.vereadores].sort((a,b)=>b.n_props-a.n_props).slice(0,5);
 const temas=Object.entries(A.temas).filter(([k])=>k!=='Outros pedidos').slice(0,5);
 app.innerHTML=`<span class="selo"><i></i>Dados conferidos até ${esc(R.estado.camara_ultima_atualizacao)}</span>
<h1>Raio-X de São José dos Campos</h1><p class="lead">O que cada vereador fez desde a posse, contado dia a dia com os registros oficiais da Câmara.</p>
<div class="hero"><small>DESDE A POSSE, EM 1º DE JANEIRO DE 2025</small><div class="g">${nf(A.n_propostas)} propostas</div><small>apresentadas pelos ${R.vereadores.length} vereadores, e o número sobe toda semana</small>
<div class="mini"><div><b>${nf(R.sessoes_total)}</b><small>sessões</small></div><div><b>${nf(R.votacoes_total-R.votacoes_secretas)}</b><small>votações com voto de cada um</small></div><div><b>${nf(A.n_recorrentes)}</b><small>ruas com pedido repetido</small></div></div></div>
<div class="tiles">${['melhoria','cobranca','homenagem','lei'].map(g=>`<a class="tile ${GCOR[g]}" href="#/grupo/${g}"><b>${nf(T[g])}</b><span>${esc(G[g])}</span></a>`).join('')}</div>
<section><h3>Comece por aqui</h3><h2>O que pediram pelo seu bairro?</h2><p class="peq">Digite o bairro ou a rua. Sem nada digitado, você vê a cidade inteira.</p>
<form class="busca" id="fb"><input type="search" id="bq" list="lb" placeholder="Ex.: Jardim Satélite, Rua Tal, poda" autocomplete="off"><datalist id="lb">${bairros.slice(0,400).map(b=>`<option value="${esc(b[0])}">`).join('')}</datalist><button class="btn">Ver pedidos</button></form>
<div class="chips">${bairros.slice(0,10).map(b=>`<a class="chip" href="#/busca/${encodeURIComponent(b[0])}">${esc(b[0])}</a>`).join('')}</div></section>
<section class="rank"><div><h3>Quem mais propôs</h3><ol>${top.map(v=>`<li><a href="#/v/${v.id}/propostas">${esc(v.nome)} <span class="peq">${esc(v.partido)}</span></a><b>${nf(v.n_props)}</b></li>`).join('')}</ol><p class="peq">Todas as propostas, inclusive homenagens. Os outros ${R.vereadores.length-5} estão nos cartões, mais abaixo.</p></div>
<div><h3>O que mais pedem</h3><ol>${temas.map(([k,n])=>`<li><a href="#/tema/${encodeURIComponent(k)}">${esc(k)}</a><b>${nf(n)}</b></li>`).join('')}</ol></div>
<div><h3>Bairros mais citados</h3><ol>${A.bairros_top.map(([k,n])=>`<li><a href="#/busca/${encodeURIComponent(k)}">${esc(k)}</a><b>${nf(n)}</b></li>`).join('')}</ol></div></section>
<section><h3>Pedidos repetidos</h3><h2>O problema que não some?</h2><p>Quando vários pedidos do mesmo tipo citam a mesma rua, isso aparece aqui. O site da Câmara não mostra esse cruzamento: nós juntamos os pedidos um por um.</p>
<div class="aviso"><b>Leia com cuidado:</b> muitos pedidos na mesma rua mostram que o assunto foi levado à Câmara várias vezes. Isso <b>não prova</b> que a Prefeitura ignorou: o pedido pode ter sido atendido e voltar depois, ou ser outro caso na mesma rua.</div>
<div class="rec" id="rec"></div><p><button class="btn cl" id="mais">Mostrar mais ruas (${nf(Math.max(0,A.recorrentes.length-8))})</button></p></section>
<section><h3>Homenagem ou trabalho?</h3><h2>Cada proposta tem um tipo</h2><p>São ${nf(A.n_propostas)} propostas. Toque em um grupo para ler uma por uma.</p>
<div class="tiles" style="grid-template-columns:1fr">${['melhoria','cobranca','homenagem','lei','posicionamento'].map(g=>`<a class="tile ${GCOR[g]||''}" href="#/grupo/${g}"><b>${nf(T[g])}</b><span><b style="font-size:1rem;color:var(--tx);display:inline">${esc(G[g])}</b> · ${esc(DESC[g])} Ver todas →</span></a>`).join('')}</div>
<p class="peq">Mais ${nf(T.saude_individual)} pedidos de casos individuais (consulta, exame ou vaga escolar de uma pessoa) ficam fora das listas, por privacidade.</p></section>
<section><h3>Os cartões</h3><h2>Os ${R.vereadores.length} vereadores</h2><div class="grade">${R.vereadores.map(cartao).join('')}</div></section>
<section><h3>Transparência</h3><h2>De onde vêm os números</h2><p>Tudo sai do sistema da própria Câmara. Nada é digitado à mão. <a href="#/sobre">Veja como cada número é contado.</a></p></section>`;
 const draw=n=>{$('#rec').innerHTML=A.recorrentes.slice(0,n).map(r=>`<a class="recc" href="#/busca/${encodeURIComponent(r.rua)}/${encodeURIComponent(r.tema)}"><div class="n">${r.vezes}<small>VEZES</small></div><div><b>${esc(r.rua)}</b><span>${esc(r.bairro)}${r.bairro?' · ':''}${esc(r.tema)}</span><span>${r.vereadores} vereador${r.vereadores>1?'es':''} · de ${fm(r.de)} a ${fm(r.ate)}</span><span style="color:var(--az)">Ver pedidos →</span></div></a>`).join('')};draw(8);
 $('#mais').onclick=e=>{draw(A.recorrentes.length);e.target.remove()};
 $('#fb').onsubmit=e=>{e.preventDefault();location.hash='#/busca/'+encodeURIComponent($('#bq').value.trim())};}
const DESC={melhoria:'Tapar buraco, podar árvore, trocar lâmpada. É um pedido: a Prefeitura decide se faz.',cobranca:'Pedidos de explicação à Prefeitura e apelos a outros órgãos.',homenagem:'Parabéns, votos de pesar, título de cidadão, nome de rua e datas comemorativas.',lei:'Projetos que criam regra, programa ou obrigação na cidade.',posicionamento:'Notas de apoio ou repúdio e matérias registradas.'};
function cartao(v){const p=pres(v),G=R.grupos,g=v.grupos,sim=v.votos['Favorável']||0,nao=v.votos['Contrário']||0;
 return `<article class="cr"><div class="cab"><img src="${esc(v.foto)}" alt="" loading="lazy"><div><h3><a href="#/v/${v.id}" style="color:inherit;text-decoration:none">${esc(v.nome)}</a></h3><div class="part">${esc(v.partido)}${v.situacao!=='Ativo'?' · '+esc(v.situacao):''}</div></div></div>
<div><div class="pres">${p.pct}%</div><div class="barra"><i style="width:${p.pct}%"></i></div><div class="peq">${nf(p.pr)} de ${nf(p.tot)} sessões com lista<br>${nf(p.fj)} ausências justificadas · ${nf(p.f)} faltas</div></div>
<div><h4>O que propôs até agora</h4>${['melhoria','cobranca','homenagem','lei','posicionamento'].filter(k=>g[k]).map(k=>`<a class="gl" href="#/v/${v.id}/propostas/${k}"><span>${esc(G[k].replace(/ \(.*/,''))}</span><b>${nf(g[k])} ›</b></a>`).join('')}</div>
<div><h4>Como votou até agora</h4><div class="vt"><div><b>${nf(sim)}</b><span class="peq">vezes sim</span></div><div><b>${nf(nao)}</b><span class="peq">vezes não</span></div></div><a class="link" href="#/v/${v.id}/votos/nao-sim">Ver quando não votou sim →</a></div></article>`}
/* ---------- VEREADOR ---------- */
function vereador(id,aba,sub){const v=R.vereadores.find(x=>x.id===id);if(!v)return home();const p=pres(v);
 const ab=[['presenca','Presença'],['propostas','Propostas'],['votos','Votos']];
 app.innerHTML=`<p><a href="#/">← Todos os vereadores</a></p><div style="display:flex;gap:14px;align-items:center"><img class="foto" src="${esc(v.foto)}" alt=""><div><h1 style="margin:0">${esc(v.nome)}</h1>${esc(v.partido)}${v.mesa&&v.mesa!=='não participa'?' · Mesa Diretora: '+esc(v.mesa):''}<div class="peq">${esc(v.email)} ${esc(v.telefone)}</div></div></div>
<div class="tiles" style="margin-top:14px"><div class="tile"><b>${p.pct}%</b><span>presença (${nf(p.pr)} de ${nf(p.tot)} sessões)</span></div><div class="tile"><b>${nf(v.n_props)}</b><span>propostas</span></div><div class="tile"><b>${nf(v.votos['Favorável'])}</b><span>votos sim</span></div><div class="tile"><b>${nf(v.votos['Contrário'])}</b><span>votos não</span></div></div>
<p style="margin:10px 0 0">${share(v.nome)}</p>
<div class="abas">${ab.map(([k,t])=>`<a class="${k===aba?'on':''}" href="#/v/${id}/${k}">${t}</a>`).join('')}</div><div id="aba">Carregando…</div>`;
 get('data/v/'+id+'.json').then(d=>({presenca:pPres,propostas:pProp,votos:pVot})[aba](v,d,sub));}
function pPres(v,d){const anos=Object.keys(v.presenca_ano).sort().reverse();
 $('#aba').innerHTML=`<p>Presença em cada sessão da Câmara. Só contam sessões com lista de presença registrada. Em ${nf(R.sessoes_sem_lista)} das ${nf(R.sessoes_total)} sessões (quase todas solenes) a Câmara não registrou lista, e elas ficam de fora: <b>"sem lista" não é falta</b>.</p>
${anos.map(a=>{const c=v.presenca_ano[a],t=(c['Presente']||0)+(c['Falta']||0)+(c['Falta Justificada']||0),pc=t?Math.round((c['Presente']||0)*100/t):0;return `<h2>${a}</h2><div class="anol"><b>${pc}%</b><div class="barra"><i style="width:${pc}%"></i></div><span class="peq">${nf(c['Presente'])} de ${nf(t)}</span></div><div class="nums"><div class="num"><b>${nf(c['Presente'])}</b>presente</div><div class="num"><b>${nf(c['Falta Justificada'])}</b>falta justificada</div><div class="num"><b>${nf(c['Falta'])}</b>falta</div><div class="num"><b>${nf(c['Licenciado'])}</b>licenciado</div></div>`}).join('')}
<details><summary><b>Ver sessão por sessão (${nf(d.presenca.length)})</b></summary><table><tr><th>Data</th><th>Tipo</th><th>Situação</th><th>Fonte</th></tr>${d.presenca.map(r=>`<tr><td>${fd(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td><a href="${CAM}/spl/sessao-parlamentares.aspx?id=${r[0]}" target="_blank" rel="noopener">lista oficial</a></td></tr>`).join('')}</table></details>
<p class="peq">Fonte: Câmara Sem Papel, lista de presença de cada sessão. Os totais conferem com a frequência em plenário informada pela API oficial.</p>`;}
function pProp(v,d,sub){const G=R.grupos,g=v.grupos;
 $('#aba').innerHTML=`<p>${nf(v.n_props)} propostas (sem atas e trâmites internos), separadas por uma regra única, igual para todos (<a href="#/sobre">veja a regra</a>). Toque em um grupo para ler uma por uma.</p>
<div class="tiles">${Object.keys(G).filter(k=>g[k]).map(k=>`<a class="tile ${GCOR[k]||''} ${k===sub?'':''}" href="#/v/${v.id}/propostas/${k}" style="${k===sub?'outline:3px solid var(--tx)':''}"><b>${nf(g[k])}</b><span>${esc(G[k])}</span></a>`).join('')}</div><div id="lista"></div>`;
 if(sub&&g[sub])lista(v,d,sub);}
function lista(v,d,g,pg=0,q='',ano=''){const all=d.proposicoes.filter(r=>r[5]===g&&(!ano||r[3]===ano)&&(!q||norm(r[6]).includes(norm(q))));
 const anos=[...new Set(d.proposicoes.filter(r=>r[5]===g).map(r=>r[3]))].sort().reverse(),L=$('#lista'),ind=g==='saude_individual';
 L.innerHTML=`<h2 style="margin-top:22px">${esc(R.grupos[g])}</h2>${ind?'<div class="aviso">Por privacidade (LGPD), o texto desses pedidos não é mostrado, pois citam pessoas. Aparece só a contagem e o link oficial.</div>':''}
<div class="busca"><input type="search" id="q" placeholder="Buscar no texto (rua, bairro, assunto)" value="${esc(q)}" ${ind?'disabled':''}><select id="ano"><option value="">Todos os anos</option>${anos.map(a=>`<option ${a===ano?'selected':''}>${a}</option>`).join('')}</select></div>
<p class="peq">${nf(all.length)} resultados</p>${all.slice(pg*PAGE,pg*PAGE+PAGE).map(itemProp).join('')}${pager(pg,all.length)}`;
 const re=(p,qq,aa)=>lista(v,d,g,p,qq,aa);
 $('#q').onchange=e=>re(0,e.target.value,$('#ano').value);$('#ano').onchange=e=>re(0,$('#q').value,e.target.value);
 pagerBind(pg,all.length,p=>re(p,q,ano));}
const pager=(pg,n)=>`<p>${pg>0?'<button class="btn cl" data-pg="-1">← Anteriores</button> ':''}${(pg+1)*PAGE<n?'<button class="btn cl" data-pg="1">Próximos →</button>':''}</p>`;
function pagerBind(pg,n,fn){document.querySelectorAll('[data-pg]').forEach(b=>b.onclick=()=>{fn(pg+ +b.dataset.pg);window.scrollTo(0,0)})}
const itemProp=r=>`<div class="item"><span class="tag">${esc(r[1])} ${esc(r[2])}/${esc(r[3])}</span>${esc(r[6]||'(texto não exibido)')}<small>${fd(r[4])} · ${esc(r[7])} · <a href="${esc(r[8])}" target="_blank" rel="noopener">documento oficial</a></small></div>`;
function pVot(v,d,sub){const t=v.votos;
 $('#aba').innerHTML=`<p>Votações em que a Câmara registra o voto de cada vereador. Votações secretas (${nf(R.votacoes_secretas)}) não têm voto individual. ${nf(R.votacoes_em_verificacao)} votações ficam de fora porque o documento oficial se contradiz, e estão em verificação. O presidente da sessão não vota, salvo empate, e por isso aparece como "Presidente".</p>
<div class="nums">${['Favorável','Contrário','Abstenção','Presidente'].map(k=>`<div class="num"><b>${nf(t[k])}</b>${k}</div>`).join('')}</div>
<div class="busca" style="margin-top:12px"><select id="st"><option value="">Todos os votos</option><option value="nao-sim" ${sub==='nao-sim'?'selected':''}>Só quando não votou sim</option><option>Favorável</option><option>Contrário</option><option>Abstenção</option></select><input type="search" id="vq" placeholder="Buscar no assunto"></div><div id="vl"></div>`;
 const draw=(pg=0)=>{const st=$('#st').value,q=$('#vq').value;const a=d.votos.filter(r=>(!st||(st==='nao-sim'?(r[3]==='Contrário'||r[3]==='Abstenção'):r[3]===st))&&(!q||norm(r[2]).includes(norm(q))));
  $('#vl').innerHTML=`<p class="peq">${nf(a.length)} votos</p>`+a.slice(pg*PAGE,pg*PAGE+PAGE).map(r=>`<div class="item"><span class="tag ${r[3]==='Favorável'?'':'t2'}">${esc(r[3])}</span>${esc(r[2])}<small>Sessão de ${fd(r[1])} · resultado: ${esc(r[4])} · <a href="${esc(r[5])}" target="_blank" rel="noopener">extrato oficial</a></small></div>`).join('')+pager(pg,a.length);
  pagerBind(pg,a.length,draw);};
 $('#st').onchange=()=>draw();$('#vq').onchange=()=>draw();draw();}
/* ---------- BUSCA / TEMA / GRUPO ---------- */
async function busca(q,tema,grupo,ver){
 const titulo=q?'Pedidos sobre "'+q+'"':grupo?R.grupos[grupo]:tema?tema:'O que pediram pelo seu bairro?';
 app.innerHTML=`<h1>${esc(titulo)}</h1><p class="peq">Procura nas propostas dos vereadores (pedidos, cobranças, projetos, moções). Casos individuais ficam de fora, por privacidade.</p>
<form class="busca" id="fb"><input type="search" id="bq" placeholder="Rua, bairro ou assunto" value="${esc(q)}"><button class="btn">Buscar</button></form><div id="res">Carregando…</div>`;
 const go=(o={})=>{const s={q:$('#bq').value.trim(),tema,grupo,ver,...o};location.hash='#/busca/'+[s.q,s.tema,s.grupo,s.ver].map(encodeURIComponent).join('/')};
 $('#fb').onsubmit=e=>{e.preventDefault();go()};
 const B=await get('data/busca.json'),ts=norm(q).split(/\s+/).filter(Boolean);
 const a=B.filter(r=>(!grupo||r[3]===grupo)&&(!tema||r[7]===tema)&&(!ver||r[6].includes(+ver))&&(!ts.length||ts.every(x=>norm(r[4]).includes(x)))).sort((x,y)=>y[2].localeCompare(x[2]));
 if(!a.length){$('#res').innerHTML='<p>Nada encontrado. Tente menos palavras ou outra grafia.</p>';return}
 const por={},ano={},tm={},gr={};a.forEach(r=>{r[6].forEach(i=>por[i]=(por[i]||0)+1);ano[r[2].slice(0,4)]=(ano[r[2].slice(0,4)]||0)+1;if(r[7])tm[r[7]]=(tm[r[7]]||0)+1;gr[r[3]]=(gr[r[3]]||0)+1});
 const opt=(o,sel)=>o.map(([v,t])=>`<option value="${esc(v)}" ${v===sel?'selected':''}>${esc(t)}</option>`).join('');
 let pg=0;
 const draw=()=>{$('#lst').innerHTML=a.slice(pg*PAGE,pg*PAGE+PAGE).map(r=>`<div class="item"><span class="tag">${esc(r[1])}</span>${esc(r[4])}<small>${fd(r[2])} · ${esc(R.grupos[r[3]])}${r[7]?' · '+esc(r[7]):''} · ${r[6].map(i=>`<a href="#/v/${i}/propostas">${esc(NOME[i])}</a>`).join(', ')} · <a href="${esc(r[5])}" target="_blank" rel="noopener">documento oficial</a></small></div>`).join('')+pager(pg,a.length);pagerBind(pg,a.length,p=>{pg=p;draw()})};
 $('#res').innerHTML=`<p><b>${nf(a.length)}</b> propostas encontradas, de ${fd(a[a.length-1][2])} até ${fd(a[0][2])}.</p>
${ts.length?'<div class="aviso">Vários pedidos sobre o mesmo lugar mostram que o assunto foi levado à Câmara mais de uma vez. <b>Isso não prova que a Prefeitura ignorou</b> o problema: o pedido pode ter sido atendido e voltar depois, ou ser outro caso na mesma rua. Leia cada proposta e o andamento oficial.</div>':''}
<div class="busca"><select id="fg"><option value="">Todos os tipos</option>${opt(Object.keys(gr).map(k=>[k,R.grupos[k]]),grupo)}</select><select id="ft"><option value="">Todos os temas</option>${opt(Object.keys(R.agreg.temas).map(k=>[k,k]),tema)}</select><select id="fv"><option value="">Todos os vereadores</option>${opt(R.vereadores.map(v=>[String(v.id),v.nome]),String(ver))}</select></div>
<p class="peq">Por ano: ${Object.keys(ano).sort().map(k=>k+': '+nf(ano[k])).join(' · ')}<br>Mais pedidos por: ${Object.entries(por).sort((x,y)=>y[1]-x[1]).slice(0,6).map(([i,n])=>esc(NOME[i])+' ('+n+')').join(' · ')}</p><div id="lst"></div>`;
 $('#fg').onchange=e=>go({grupo:e.target.value});$('#ft').onchange=e=>go({tema:e.target.value});$('#fv').onchange=e=>go({ver:e.target.value});draw();}
/* ---------- COMO FUNCIONA ---------- */
function sobre(){const G=R.grupos;app.innerHTML=`<div class="sobre"><h1>Como funciona</h1>
<h2>De onde vêm os dados</h2><p>Só do sistema oficial da Câmara, o <a href="${CAM}/" target="_blank" rel="noopener">Câmara Sem Papel</a>: lista de vereadores, listas de presença de cada sessão, propostas apresentadas e extratos da votação eletrônica. Cada número tem um link para o documento oficial.</p>
<h2>O que contamos</h2><ul><li><b>Presença:</b> lista oficial de cada sessão. Sessões sem lista registrada não entram (não é falta). Conferimos nossa contagem com o total que a própria Câmara informa.</li>
<li><b>Votos:</b> lidos dos extratos em PDF e conferidos com os totais de cada votação. Se não bate, a votação fica fora e marcada "em verificação". Votos secretos não têm registro individual.</li>
<li><b>Propostas:</b> tudo o que o vereador apresentou, inclusive com outros autores.</li></ul>
<h2>A regra dos grupos (igual para todos)</h2><p>Usamos só o tipo do documento e as primeiras palavras do assunto, sem julgar o mérito:</p><ul>
<li><b>${esc(G.melhoria)}:</b> indicações e requerimentos que pedem algo à Prefeitura ou a empresas (poda, reparo, serviço).</li>
<li><b>${esc(G.cobranca)}:</b> quando o texto pede informações ou esclarecimentos.</li>
<li><b>${esc(G.homenagem)}:</b> parabéns, agradecimentos, pesar, títulos, medalhas, nome de rua e datas comemorativas.</li>
<li><b>${esc(G.lei)}:</b> projetos de lei, de decreto, de resolução e emendas à Lei Orgânica.</li>
<li><b>${esc(G.saude_individual)}:</b> pedidos que citam uma pessoa. O texto não é exibido (privacidade).</li>
<li><b>${esc(G.posicionamento)}:</b> apoio, repúdio e matérias registradas.</li></ul>
<p>Atas, emendas, substitutivos e licenças não são propostas do vereador e ficam de fora das contagens. Como a regra lê o texto, um caso isolado pode cair no grupo errado: use o link do documento oficial.</p>
<h2>Temas, ruas e bairros</h2><p>O tema (trânsito, poda, buraco...), a rua e o bairro de cada pedido são lidos do texto oficial por palavras-chave, com a mesma regra para todos. Se o texto não cita o local, o pedido fica sem rua ou bairro. Pode haver erros de leitura, por isso cada item tem o link do documento original.</p>
<h2>Limites</h2><ul><li>Quantidade de propostas não mede qualidade nem resultado.</li><li>Um pedido é só um pedido: o sistema da Câmara não informa se a Prefeitura atendeu.</li><li>Vários pedidos sobre o mesmo local não provam omissão da Prefeitura.</li><li>Dados coletados periodicamente; o dia da última atualização aparece no rodapé.</li></ul>
<h2>Erro ou correção</h2><p>Se achar algum dado errado, abra o documento oficial pelo link do item e compare. Para avisar, escreva pela página de problemas do projeto: <a href="https://github.com/megaclic/radar-sjc/issues" target="_blank" rel="noopener">github.com/megaclic/radar-sjc/issues</a>.</p></div>`;}
init();
