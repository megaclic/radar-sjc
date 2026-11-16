const $=s=>document.querySelector(s),app=$('#app'),CAM='https://camarasempapel.camarasjc.sp.gov.br';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fd=d=>d?d.split('-').reverse().join('/'):'';const nf=n=>(n||0).toLocaleString('pt-BR');
const MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];const fm=d=>d?MES[+d.slice(5,7)-1]+' '+d.slice(0,4):'';
const norm=s=>(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const cache={};const get=async u=>cache[u]??(cache[u]=await (await fetch(u+'?v='+(window.V||'dev'))).json());
const PAGE=40;let R,NOME={};
const dec=s=>{try{return decodeURIComponent(s||'')}catch(e){return s||''}};
const GCOR={melhoria:'az',cobranca:'am',homenagem:'rs',lei:'vd'};
async function init(){try{R=await get('data/resumo.json');}catch(e){app.innerHTML='<h1>Não foi possível carregar os dados</h1><p>Se você abriu o arquivo direto da pasta (endereço começando com file://), o navegador bloqueia a leitura dos dados. Abra pelo servidor local: dê dois cliques em <b>servir.bat</b> (na pasta do projeto) e acesse <b>http://localhost:8000</b>. Online, no GitHub Pages, isso não acontece.</p>';return;}
 R.vereadores.forEach(v=>NOME[v.id]=v.nome);
 $('#hl').innerHTML=R.vereadores.map(v=>`<option value="${esc(v.nome)}">`).join('');
 $('#hs').addEventListener('submit',e=>{e.preventDefault();const q=norm($('#hq').value),v=R.vereadores.find(x=>norm(x.nome)===q)||R.vereadores.find(x=>norm(x.nome).includes(q));if(v&&q){location.hash='#/v/'+v.id+'/presenca';$('#hq').value='';$('#hq').blur()}});
 $('#hq').addEventListener('change',()=>{const q=norm($('#hq').value),v=R.vereadores.find(x=>norm(x.nome)===q);if(v){location.hash='#/v/'+v.id+'/presenca';$('#hq').value=''}});
 $('#atualizado').textContent='Dados atualizados até '+R.estado.camara_ultima_atualizacao+' (coletados em '+fd(R.estado.atualizado_em.slice(0,10))+'). Legislatura atual, desde 01/01/2025.';
 window.addEventListener('hashchange',rota);
 document.addEventListener('click',e=>{const c=e.target.closest('[data-go]');if(c&&!e.target.closest('a,button,input,select')){location.hash=c.dataset.go}
  const g=e.target.closest('[data-scroll]');if(g){const el=document.getElementById(g.dataset.scroll);if(el)window.scrollTo({top:el.getBoundingClientRect().top+scrollY-70,behavior:'smooth'})}
  if(e.target.closest('#topo-btn'))window.scrollTo({top:0,behavior:'smooth'})});
 const tb=document.createElement('button');tb.id='topo-btn';tb.setAttribute('aria-label','Voltar ao topo');tb.textContent='↑';document.body.appendChild(tb);
 addEventListener('scroll',()=>tb.classList.toggle('on',scrollY>900),{passive:true});
 rota();(window.requestIdleCallback||setTimeout)(()=>get('data/busca.json').catch(()=>{}));}
const SALARIO=18991.68,RES5='https://diario.camarasjc.sp.gov.br/uploads/dio/86/2022/resolucao-n-5-1671468877.pdf';
function gasto(n,agora=new Date()){let t=0,d=new Date(2025,0,1);while(d<agora){const p=new Date(d.getFullYear(),d.getMonth()+1,1),f=Math.min(1,(agora-d)/(p-d));t+=f;d=p}return t*SALARIO*n}
const brl=x=>x.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
let TICK=null;
let ULT='';
function rota(){const h=location.hash.replace(/^#\/?/,'').split('/');const TT={gastos:'Gastos da Câmara',comparar:'Comparar vereadores',sobre:'Como funciona',busca:'Pedidos por bairro e rua',tema:'Pedidos por tema',grupo:'Propostas por grupo'};document.title=(h[0]==='v'&&NOME[+h[1]]?NOME[+h[1]]:TT[h[0]]||'O que cada vereador fez')+' | Radar Político SJC';const chave=h[0]+'/'+(h[0]==='v'?h[1]:'');if(chave!==ULT){window.scrollTo(0,0);}ULT=chave;
 switch(h[0]){case 'v':return vereador(+h[1],h[2]||'presenca',h[3]||'');
  case 'busca':return busca(dec(h[1]),dec(h[2]),dec(h[3]),dec(h[4]));
  case 'tema':return busca('',dec(h[1]),'','');case 'grupo':return busca('','',dec(h[1]),'');
  case 'gastos':return gastosGeral();case 'comparar':return comparar(+h[1]||0,+h[2]||0);case 'sobre':return sobre();default:return home();}}
const pres=v=>{const p=v.presenca,pr=p['Presente']||0,fj=p['Falta Justificada']||0,f=p['Falta']||0,tot=pr+fj+f;return {pr,fj,f,tot,pct:tot?Math.round(pr*100/tot):0}};
function share(t,u){return `<button class="btn cl share" onclick="(navigator.share?navigator.share({title:'${esc(t)}',url:location.href}):navigator.clipboard.writeText(location.href).then(()=>this.textContent='Link copiado'))">Compartilhar</button>`}
/* ---------- INÍCIO ---------- */
async function home(){const A=R.agreg,G=R.grupos,T=A.grupos_total;
 const bairros=await get('data/bairros.json');
 const top=[...R.vereadores].sort((a,b)=>b.n_props-a.n_props).slice(0,5);
 const temas=Object.entries(A.temas).filter(([k])=>k!=='Outros pedidos').slice(0,5);
 app.innerHTML=`<span class="selo"><i></i>Dados conferidos até ${esc(R.estado.camara_ultima_atualizacao)}</span>
<h1>Raio-X de São José dos Campos</h1><p class="lead">O que cada vereador fez desde a posse, contado dia a dia com os registros oficiais da Câmara.</p>
<div class="hero"><small>SALÁRIO PAGO AOS ${R.vereadores.length} VEREADORES DESDE A POSSE</small><div class="g" id="salario">R$ ${brl(gasto(R.vereadores.length))}</div><small>e subindo agora · estimativa: ${R.vereadores.length} salários de R$ ${brl(SALARIO)} por mês desde 1º de janeiro de 2025 · <a href="${RES5}" target="_blank" rel="noopener" style="color:#93c5fd">fonte: Resolução nº 5/2022</a></small></div>
<div class="atalhos"><button class="chip" data-scroll="s-bairro">Seu bairro</button><button class="chip" data-scroll="s-ruas">Ruas com pedido repetido</button><button class="chip" data-scroll="s-tipos">Tipos de proposta</button><button class="chip" data-scroll="s-vers">Vereadores</button></div>
<div class="tiles"><div class="tile"><b>${nf(A.n_propostas)}</b><span>propostas até agora</span></div>${['melhoria','homenagem','lei'].map(g=>`<a class="tile ${GCOR[g]}" href="#/grupo/${g}"><b>${nf(T[g])}</b><span>${esc(G[g])}</span></a>`).join('')}</div>
<p class="peq" style="margin-top:10px">Última conferência na Câmara: ${esc(R.estado.camara_ultima_atualizacao)}. Os números sobem a cada atualização.</p>
<section id="s-bairro"><h3>Comece por aqui</h3><h2>O que pediram pelo seu bairro?</h2><p class="peq">Digite o bairro ou a rua. Sem nada digitado, você vê a cidade inteira.</p>
<form class="busca" id="fb"><input type="search" id="bq" list="lb" placeholder="Ex.: Jardim Satélite, Rua Tal, poda" autocomplete="off"><datalist id="lb">${bairros.slice(0,400).map(b=>`<option value="${esc(b[0])}">`).join('')}</datalist><button class="btn">Ver pedidos</button></form>
<div class="chips">${bairros.slice(0,10).map(b=>`<a class="chip" href="#/busca/${encodeURIComponent(b[0])}">${esc(b[0])}</a>`).join('')}</div></section>
<section class="tres">${(()=>{const bar=(n,mx)=>`<span class="bar"><i style="width:${Math.round(n*100/mx)}%"></i></span>`,mxP=Math.max(...top.map(v=>v.n_props)),mxT=Math.max(...temas.map(t=>t[1])),mxB=Math.max(...A.bairros_top.map(b=>b[1]));
 const row=(h,img,t,sub,n,b)=>`<li class="${img?'f':''}"><a href="${h}">${img}<span class="mid"><span class="nm2"><b>${t}</b>${sub}</span>${b}</span><span class="vl">${nf(n)}<i aria-hidden="true">›</i></span></a></li>`;
 return `<div class="grp"><h3>Quem mais propôs</h3><ol class="lst">${top.map(v=>row('#/v/'+v.id+'/propostas',`<img src="${esc(v.foto)}" alt="Foto de ${esc(v.nome)}" loading="lazy">`,esc(v.nome),`<span class="pill">${esc(v.partido)}</span>`,v.n_props,bar(v.n_props,mxP))).join('')}</ol><p class="peq">Todas as propostas, inclusive homenagens. Os outros ${R.vereadores.length-5} estão nos cartões, mais abaixo.</p></div>
<div class="grp"><h3>O que mais pedem</h3><ol class="lst">${temas.map(([k,n])=>row('#/tema/'+encodeURIComponent(k),'',esc(k),'',n,bar(n,mxT))).join('')}</ol></div>
<div class="grp"><h3>Bairros mais citados</h3><ol class="lst">${A.bairros_top.map(([k,n])=>row('#/busca/'+encodeURIComponent(k),'',esc(k),'',n,bar(n,mxB))).join('')}</ol></div>`})()}</section>
<section id="s-ruas"><h3>Pedidos repetidos</h3><h2>O problema que não some?</h2><p>Quando vários pedidos do mesmo tipo citam a mesma rua, isso aparece aqui. O site da Câmara não mostra esse cruzamento: nós juntamos os pedidos um por um.</p>
<div class="aviso"><b>Leia com cuidado:</b> muitos pedidos na mesma rua mostram que o assunto foi levado à Câmara várias vezes. Isso <b>não prova</b> que a Prefeitura ignorou: o pedido pode ter sido atendido e voltar depois, ou ser outro caso na mesma rua.</div>
<div class="rec" id="rec"></div><p><button class="btn cl" id="mais">Mostrar mais ruas (${nf(Math.max(0,A.recorrentes.length-8))})</button></p></section>
<section id="s-tipos"><h3>Homenagem ou trabalho?</h3><h2>Cada proposta tem um tipo</h2><p>São ${nf(A.n_propostas)} propostas. Toque em um grupo para ler uma por uma.</p>
<div class="tiles" style="grid-template-columns:1fr">${['melhoria','cobranca','homenagem','lei','posicionamento'].map(g=>`<a class="tile ${GCOR[g]||''}" href="#/grupo/${g}"><b>${nf(T[g])}</b><span><b style="font-size:1rem;color:var(--tx);display:inline">${esc(G[g])}</b> · ${esc(DESC[g])} Ver todas →</span></a>`).join('')}</div>
<p class="peq">Mais ${nf(T.saude_individual)} pedidos de casos individuais (consulta, exame ou vaga escolar de uma pessoa) ficam fora das listas, por privacidade.</p></section>
<section id="s-vers"><h3>Os cartões</h3><h2>Os ${R.vereadores.length} vereadores</h2><p class="peq">Toque no crachá para ver presença, propostas e votos.</p><div class="filtros"><label>Buscar por nome<input type="search" id="fnome" placeholder="Ex.: Amélia, Marcão"></label><label>Partido<select id="fpart"><option value="">Todos</option>${[...new Set(R.vereadores.map(v=>v.partido))].sort().map(p=>`<option>${esc(p)}</option>`).join('')}</select></label><label>Ordenar por<select id="ford"><option value="nome">Nome (A-Z)</option><option value="pres">Presença (maior)</option><option value="props">Propostas (mais)</option><option value="gmais">Gastos do gabinete (maior)</option><option value="gmenos">Gastos do gabinete (menor)</option></select></label></div><p class="peq" id="fcont"></p><div class="grade" id="gr"></div></section>
<section><h3>Transparência</h3><h2>De onde vêm os números</h2><p>Tudo sai do sistema da própria Câmara. Nada é digitado à mão. <a href="#/sobre">Veja como cada número é contado.</a></p></section>`;
 const draw=n=>{$('#rec').innerHTML=A.recorrentes.slice(0,n).map(r=>`<a class="recc" href="#/busca/${encodeURIComponent(r.rua)}/${encodeURIComponent(r.tema)}"><div class="n">${r.vezes}<small>VEZES</small></div><div><b>${esc(r.rua)}</b><span>${esc(r.bairro)}${r.bairro?' · ':''}${esc(r.tema)}</span><span>${r.vereadores} vereador${r.vereadores>1?'es':''} · de ${fm(r.de)} a ${fm(r.ate)}</span><span style="color:var(--az)">Ver pedidos →</span></div></a>`).join('')};draw(8);
 $('#mais').onclick=e=>{draw(A.recorrentes.length);e.target.remove()};
 clearInterval(TICK);TICK=setInterval(()=>{const e=$('#salario');if(!e){clearInterval(TICK);return}e.textContent='R$ '+brl(gasto(R.vereadores.length))},1000);
 const grade=()=>{const n=norm($('#fnome').value),pt=$('#fpart').value,o=$('#ford').value;let L=R.vereadores.filter(v=>(!n||norm(v.nome).includes(n))&&(!pt||v.partido===pt));if(o==='pres')L.sort((a,b)=>pres(b).pct-pres(a).pct);else if(o==='props')L.sort((a,b)=>b.n_props-a.n_props);else if(o==='gmais')L.sort((a,b)=>(GT[b.id]||0)-(GT[a.id]||0));else if(o==='gmenos')L.sort((a,b)=>(GT[a.id]||0)-(GT[b.id]||0));$('#fcont').textContent='Mostrando '+L.length+' de '+R.vereadores.length+' vereadores.';$('#gr').innerHTML=L.map(cartao).join('')||'<p>Nenhum vereador encontrado.</p>'};
 ['#fnome','#fpart','#ford'].forEach(x=>$(x).oninput=grade);grade();get('data/gastos.json').then(G=>{G.vereadores.forEach(g=>GT[g.id]=somaFolha(g.folha,()=>true)+Object.values(catTot(g)).reduce((t,x)=>t+x[0],0));grade()}).catch(()=>{});
 $('#fb').onsubmit=e=>{e.preventDefault();location.hash='#/busca/'+encodeURIComponent($('#bq').value.trim())};}
const DESC={melhoria:'Tapar buraco, podar árvore, trocar lâmpada. É um pedido: a Prefeitura decide se faz.',cobranca:'Pedidos de explicação à Prefeitura e apelos a outros órgãos.',homenagem:'Parabéns, votos de pesar, título de cidadão, nome de rua e datas comemorativas.',lei:'Projetos que criam regra, programa ou obrigação na cidade.',posicionamento:'Notas de apoio ou repúdio e matérias registradas.'};
const PAST=['#fde4df','#fcf6cc','#e2f5de','#dfe8fb','#eee1fa','#dcf3f0'];
const GC={melhoria:'#1d4ed8',cobranca:'#d9580d',homenagem:'#c2185b',lei:'#0a8f5b',posicionamento:'#64748b'};
const GN={melhoria:'Pedidos de melhoria e serviços',cobranca:'Perguntas e cobranças',homenagem:'Homenagens',lei:'Propostas de lei',posicionamento:'Outros'};
function donut(p){const a=p.tot?p.pr*100/p.tot:0,b=p.tot?p.fj*100/p.tot:0;return `<div class="donut" style="background:conic-gradient(#14171a 0 ${a}%,#f59e0b ${a}% ${a+b}%,#dc2626 ${a+b}% 100%)"><span>${p.pct}%</span></div>`}
const GT={};
function cartao(v,i,full){const p=pres(v),g=v.grupos,sim=v.votos['Favorável']||0,nao=v.votos['Contrário']||0,ks=['melhoria','cobranca','homenagem','lei','posicionamento'],tot=ks.reduce((a,k)=>a+(g[k]||0),0)||1;
 return `<article class="cr" data-go="#/v/${v.id}" style="--pc:${PAST[v.id%PAST.length]}"><div class="cabc"><span class="slot"></span><img src="${esc(v.foto)}" alt="Foto de ${esc(v.nome)}" loading="lazy"><div class="nm"><h3><a href="#/v/${v.id}">${esc(v.nome)}</a></h3><div class="pills"><span class="pill">${esc(v.partido)}</span>${v.mesa&&v.mesa!=='não participa'?`<span class="pill cl">${esc(v.mesa)}</span>`:''}${v.situacao!=='Ativo'?`<span class="pill cl">${esc(v.situacao)}</span>`:''}</div></div></div>
<div class="corpo"><div class="prow">${donut(p)}<div><b>${nf(p.pr)} de ${nf(p.tot)}</b> sessões até agora<div class="peq">${nf(p.fj)} ausência${p.fj===1?'':'s'} justificada${p.fj===1?'':'s'} · <span style="${p.f?'color:#dc2626;font-weight:700':''}">${nf(p.f)} falta${p.f===1?'':'s'}</span></div></div></div>
<div class="duo"><div><b>R$ ${brl(SALARIO)}</b>salário por mês</div><div><b>${nf(sim+nao+(v.votos['Abstenção']||0))}</b>votos registrados</div></div>
${GT[v.id]?`<a class="gabl" href="#/v/${v.id}/gastos"><span>Gasto do gabinete (equipe + outros)</span><b>${mi(GT[v.id])}</b></a>`:''}<h4>O que propôs até agora</h4><div class="sb">${ks.filter(k=>g[k]).map(k=>`<i style="flex:${g[k]};background:${GC[k]}"></i>`).join('')}</div>
${ks.filter(k=>g[k]).map(k=>`<a class="gl" href="#/v/${v.id}/propostas/${k}"><span><i class="dot" style="background:${GC[k]}"></i>${GN[k]}</span><b>${nf(g[k])} ›</b></a>`).join('')}
<h4>Como votou até agora</h4><div class="vb"><div class="sim"><b>${nf(sim)}</b>vezes sim</div><div class="nao"><b>${nf(nao)}</b>vezes não</div></div>
<a class="link" href="#/v/${v.id}/votos/nao-sim">Ver quando não votou sim →</a></div></article>`}
/* ---------- VEREADOR ---------- */
let CV=0;
function vereador(id,aba,sub){const v=R.vereadores.find(x=>x.id===id);if(!v)return home();const p=pres(v);
 const ab=[['presenca','Presença'],['propostas','Propostas'],['votos','Votos'],['gastos','Gastos']];if(!ab.some(x=>x[0]===aba))aba='presenca';
 if(CV!==id||!$('#aba')){CV=id;
 app.innerHTML=`<p><a href="#/">← Todos os vereadores</a></p><div class="vcab" style="--pc:${PAST[v.id%PAST.length]}"><img class="fotog" src="${esc(v.foto)}" alt="Foto de ${esc(v.nome)}"><div><h1 style="margin:0">${esc(v.nome)}</h1><div class="part2">${esc(v.partido)}${v.mesa&&v.mesa!=='não participa'?' · Mesa Diretora: '+esc(v.mesa):''}</div><div class="peq">${esc(v.email)} ${esc(v.telefone)}</div><p style="margin:8px 0 0">${share(v.nome)}</p></div></div>
<div class="tiles" style="margin-top:14px"><div class="tile"><b>${p.pct}%</b><span>presença (${nf(p.pr)} de ${nf(p.tot)} sessões)</span></div><div class="tile"><b>${nf(v.n_props)}</b><span>propostas</span></div><div class="tile"><b>${nf(v.votos['Favorável'])}</b><span>votos sim</span></div><div class="tile"><b>${nf(v.votos['Contrário'])}</b><span>votos não</span></div></div>
<p style="margin:10px 0 0"><a class="link" href="#/comparar/${v.id}">Comparar com outro vereador →</a></p><div class="abas" id="abas"></div><div id="aba">Carregando…</div>`;}
 $('#abas').innerHTML=ab.map(([k,t])=>`<a class="${k===aba?'on':''}" href="#/v/${id}/${k}">${t}</a>`).join('');
 const mudouAba=$('#aba').dataset.k!==aba+id;$('#aba').dataset.k=aba+id;
 get('data/v/'+id+'.json').then(d=>{if(CV!==id)return;({presenca:pPres,propostas:pProp,votos:pVot,gastos:pGas})[aba](v,d,sub);
  if(mudouAba&&(aba!=='propostas'||!sub)||(sub&&aba==='propostas'))setTimeout(()=>{const t=sub&&aba==='propostas'&&$('#lista')?$('#lista'):$('#abas');if(t)window.scrollTo({top:t.getBoundingClientRect().top+scrollY-62,behavior:'smooth'})},30)});}
function pPres(v,d){const anos=Object.keys(v.presenca_ano).sort().reverse();
 $('#aba').innerHTML=`<p>Presença em cada sessão da Câmara. Só contam sessões com lista de presença registrada. Em ${nf(R.sessoes_sem_lista)} das ${nf(R.sessoes_total)} sessões (quase todas solenes) a Câmara não registrou lista, e elas ficam de fora: <b>"sem lista" não é falta</b>.</p>
${anos.map(a=>{const c=v.presenca_ano[a],t=(c['Presente']||0)+(c['Falta']||0)+(c['Falta Justificada']||0),pc=t?Math.round((c['Presente']||0)*100/t):0;return `<h2>${a}</h2><div class="anol"><b>${pc}%</b><div class="barra"><i style="width:${pc}%"></i></div><span class="peq">${nf(c['Presente'])} de ${nf(t)}</span></div><div class="nums"><div class="num"><b>${nf(c['Presente'])}</b>presente</div><div class="num"><b>${nf(c['Falta Justificada'])}</b>falta justificada</div><div class="num"><b>${nf(c['Falta'])}</b>falta</div><div class="num"><b>${nf(c['Licenciado'])}</b>licenciado</div></div>`}).join('')}
<details><summary><b>Ver sessão por sessão (${nf(d.presenca.length)})</b></summary><table><tr><th>Data</th><th>Tipo</th><th>Situação</th><th>Fonte</th></tr>${d.presenca.map(r=>`<tr><td>${fd(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td><a href="${CAM}/spl/sessao-parlamentares.aspx?id=${r[0]}" target="_blank" rel="noopener">lista oficial</a></td></tr>`).join('')}</table></details>
<p class="peq">Fonte: Câmara Sem Papel, lista de presença de cada sessão. Os totais conferem com a frequência em plenário informada pela API oficial.</p>`;}
function pProp(v,d,sub){const G=R.grupos,g=v.grupos;
 $('#aba').innerHTML=`<p>${nf(v.n_props)} propostas (sem atas e trâmites internos), separadas por uma regra única, igual para todos (<a href="#/sobre">veja a regra</a>). Toque em um grupo para ler uma por uma.</p>
<div class="tiles">${Object.keys(G).filter(k=>g[k]).map(k=>`<a class="tile ${GCOR[k]||''} ${k===sub?'':''}" href="#/v/${v.id}/propostas/${k}" style="${k===sub?'outline:3px solid var(--tx)':''}"><b>${nf(g[k])}</b><span>${esc(G[k])}</span></a>`).join('')}</div><div id="lista"></div>`;
 if(sub&&g[sub])lista(v,d,sub);}
function mais(n,shown,fn){return n>shown?`<p><button class="btn" data-mais>Mostrar mais ${Math.min(PAGE,n-shown)} (faltam ${nf(n-shown)})</button></p>`:''}
function lista(v,d,g,q='',ano='',qtd=PAGE){const all=d.proposicoes.filter(r=>r[5]===g&&(!ano||r[3]===ano)&&(!q||norm(r[6]).includes(norm(q))));
 const anos=[...new Set(d.proposicoes.filter(r=>r[5]===g).map(r=>r[3]))].sort().reverse(),L=$('#lista'),ind=g==='saude_individual';
 L.innerHTML=`<h2 style="margin-top:22px">${esc(R.grupos[g])}</h2>${ind?'<div class="aviso">Por privacidade (LGPD), o texto desses pedidos não é mostrado, pois citam pessoas. Aparece só a contagem e o link oficial.</div>':''}
<div class="busca"><input type="search" id="q" placeholder="Buscar no texto (rua, bairro, assunto)" value="${esc(q)}" ${ind?'disabled':''}><select id="ano"><option value="">Todos os anos</option>${anos.map(a=>`<option ${a===ano?'selected':''}>${a}</option>`).join('')}</select></div>
<p class="peq">${nf(all.length)} resultados</p>${all.slice(0,qtd).map(itemProp).join('')}${mais(all.length,qtd)}`;
 let t;const re=(qq,aa,n)=>lista(v,d,g,qq,aa,n);
 $('#q').oninput=e=>{clearTimeout(t);const val=e.target.value;t=setTimeout(()=>{re(val,$('#ano').value);const i=$('#q');i.focus();i.setSelectionRange(val.length,val.length)},250)};$('#ano').onchange=e=>re($('#q').value,e.target.value);
 const b=document.querySelector('#lista [data-mais]');if(b)b.onclick=()=>re(q,ano,qtd+PAGE);}
const itemProp=r=>`<div class="item"><span class="tag">${esc(r[1])} ${esc(r[2])}/${esc(r[3])}</span>${esc(r[6]||'(texto não exibido)')}<small>${fd(r[4])} · ${esc(r[7])} · <a href="${esc(r[8])}" target="_blank" rel="noopener">documento oficial</a></small></div>`;
function pVot(v,d,sub){const t=v.votos;
 $('#aba').innerHTML=`<p>Votações em que a Câmara registra o voto de cada vereador. Votações secretas (${nf(R.votacoes_secretas)}) não têm voto individual. ${nf(R.votacoes_em_verificacao)} votações ficam de fora porque o documento oficial se contradiz, e estão em verificação. O presidente da sessão não vota, salvo empate, e por isso aparece como "Presidente".</p>
<div class="nums">${['Favorável','Contrário','Abstenção','Presidente'].map(k=>`<div class="num"><b>${nf(t[k])}</b>${k}</div>`).join('')}</div>
<div class="busca" style="margin-top:12px"><select id="st"><option value="">Todos os votos</option><option value="nao-sim" ${sub==='nao-sim'?'selected':''}>Só quando não votou sim</option><option>Favorável</option><option>Contrário</option><option>Abstenção</option></select><input type="search" id="vq" placeholder="Buscar no assunto"></div><div id="vl"></div>`;
 let qtd=PAGE;const draw=()=>{const st=$('#st').value,q=$('#vq').value;const a=d.votos.filter(r=>(!st||(st==='nao-sim'?(r[3]==='Contrário'||r[3]==='Abstenção'):r[3]===st))&&(!q||norm(r[2]).includes(norm(q))));
  $('#vl').innerHTML=`<p class="peq">${nf(a.length)} votos</p>`+a.slice(0,qtd).map(r=>`<div class="item"><span class="tag ${r[3]==='Favorável'?'':'t2'}">${esc(r[3])}</span>${esc(r[2])}<small>Sessão de ${fd(r[1])} · resultado: ${esc(r[4])} · <a href="${esc(r[5])}" target="_blank" rel="noopener">extrato oficial</a></small></div>`).join('')+mais(a.length,qtd);
  const b=document.querySelector('#vl [data-mais]');if(b)b.onclick=()=>{qtd+=PAGE;draw()};};
 let tt;$('#st').onchange=()=>{qtd=PAGE;draw()};$('#vq').oninput=()=>{clearTimeout(tt);tt=setTimeout(()=>{qtd=PAGE;draw()},250)};draw();}
/* ---------- BUSCA / TEMA / GRUPO ---------- */
let BS=null;
async function busca(q,tema,grupo,ver){
 const titulo=()=>BS.q?'Pedidos sobre "'+BS.q+'"':BS.grupo?R.grupos[BS.grupo]:BS.tema?BS.tema:'O que pediram pelo seu bairro?';
 BS={q,tema,grupo,ver,qtd:PAGE};
 app.innerHTML=`<h1 id="bt"></h1><p class="peq">Procura nas propostas dos vereadores (pedidos, cobranças, projetos, moções). Casos individuais ficam de fora, por privacidade.</p>
<form class="busca" id="fb"><input type="search" id="bq" placeholder="Rua, bairro ou assunto" value="${esc(q)}" autocomplete="off"><button class="btn">Buscar</button></form>
<div class="busca"><select id="fg"><option value="">Todos os tipos</option>${Object.keys(R.grupos).filter(k=>k!=='saude_individual'&&k!=='tramite').map(k=>`<option value="${k}" ${k===grupo?'selected':''}>${esc(R.grupos[k])}</option>`).join('')}</select><select id="ft"><option value="">Todos os temas</option>${Object.keys(R.agreg.temas).map(k=>`<option ${k===tema?'selected':''}>${esc(k)}</option>`).join('')}</select><select id="fv"><option value="">Todos os vereadores</option>${R.vereadores.map(v=>`<option value="${v.id}" ${String(v.id)===String(ver)?'selected':''}>${esc(v.nome)}</option>`).join('')}</select></div>
<div id="res"><p>Carregando as propostas…</p></div>`;
 const B=await get('data/busca.json');
 const url=()=>history.replaceState(null,'','#/busca/'+[BS.q,BS.tema,BS.grupo,BS.ver].map(encodeURIComponent).join('/'));
 const ler=()=>{BS.q=$('#bq').value.trim();BS.grupo=$('#fg').value;BS.tema=$('#ft').value;BS.ver=$('#fv').value;BS.qtd=PAGE;url();ULT='busca/';desenha()};
 let t;$('#bq').oninput=()=>{clearTimeout(t);t=setTimeout(ler,300)};$('#fb').onsubmit=e=>{e.preventDefault();ler()};$('#fg').onchange=ler;$('#ft').onchange=ler;$('#fv').onchange=ler;
 function desenha(){const {q,tema,grupo,ver}=BS;$('#bt').textContent=titulo();const ts=norm(q).split(/\s+/).filter(Boolean);
  const a=B.filter(r=>(!grupo||r[3]===grupo)&&(!tema||r[7]===tema)&&(!ver||r[6].includes(+ver))&&(!ts.length||ts.every(x=>norm(r[4]).includes(x)))).sort((x,y)=>y[2].localeCompare(x[2]));
  if(!a.length){$('#res').innerHTML='<p>Nada encontrado. Tente menos palavras ou outra grafia.</p>';return}
  const por={},ano={};a.forEach(r=>{r[6].forEach(i=>por[i]=(por[i]||0)+1);ano[r[2].slice(0,4)]=(ano[r[2].slice(0,4)]||0)+1});
  $('#res').innerHTML=`<p><b>${nf(a.length)}</b> propostas encontradas, de ${fd(a[a.length-1][2])} até ${fd(a[0][2])}.</p>
${ts.length?'<div class="aviso">Vários pedidos sobre o mesmo lugar mostram que o assunto foi levado à Câmara mais de uma vez. <b>Isso não prova que a Prefeitura ignorou</b> o problema: o pedido pode ter sido atendido e voltar depois, ou ser outro caso na mesma rua. Leia cada proposta e o andamento oficial.</div>':''}
<p class="peq">Por ano: ${Object.keys(ano).sort().map(k=>k+': '+nf(ano[k])).join(' · ')}<br>Mais pedidos por: ${Object.entries(por).sort((x,y)=>y[1]-x[1]).slice(0,6).map(([i,n])=>`<a href="#/v/${i}/propostas">${esc(NOME[i])}</a> (${n})`).join(' · ')}</p>
${a.slice(0,BS.qtd).map(r=>`<div class="item"><span class="tag">${esc(r[1])}</span>${esc(r[4])}<small>${fd(r[2])} · ${esc(R.grupos[r[3]])}${r[7]?' · '+esc(r[7]):''} · ${r[6].map(i=>`<a href="#/v/${i}/propostas">${esc(NOME[i])}</a>`).join(', ')} · <a href="${esc(r[5])}" target="_blank" rel="noopener">documento oficial</a></small></div>`).join('')}${mais(a.length,BS.qtd)}`;
  const b=document.querySelector('#res [data-mais]');if(b)b.onclick=()=>{BS.qtd+=PAGE;desenha()};}
 desenha();}
/* ---------- COMO FUNCIONA ---------- */
function sobre(){const G=R.grupos;app.innerHTML=`<div class="sobre"><h1>Como funciona</h1>
<h2>De onde vêm os dados</h2><p>Só de sistemas oficiais da Câmara. Do <a href="${CAM}/" target="_blank" rel="noopener">Câmara Sem Papel</a>: lista de vereadores, listas de presença de cada sessão, propostas apresentadas e extratos da votação eletrônica. Do <a href="https://portal.camarasjc.sp.gov.br/portal-transparencia/home" target="_blank" rel="noopener">Portal da Transparência da Câmara</a>: gastos, folha dos gabinetes, contratos e publicidade. Cada número tem um link para o documento ou para o portal.</p>
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
<h2>Gastos</h2><ul><li><b>Equipe do gabinete:</b> soma do salário bruto de quem está lotado no gabinete de cada vereador (Portal da Transparência, página de remuneração). Estagiários não aparecem com lotação e ficam de fora.</li><li><b>Outros gastos:</b> despesas que o portal liga ao centro de custo do vereador, como passagens, hospedagem, diárias e cursos. O valor é o empenhado, isto é, reservado para pagar; o valor pago aparece ao lado.</li><li><b>Nota fiscal:</b> mostramos número, emissão e valor informados no portal. O portal não traz o arquivo da nota nem a lista de itens comprados.</li><li><b>Gastos para olhar com atenção:</b> classificações oficiais de despesa (alimentação, copa e cozinha, eventos). Estar na lista não significa irregularidade: leia o motivo de cada compra.</li><li><b>Ranking:</b> mede valor gasto, não a qualidade do mandato. Gabinete com mais gente custa mais.</li></ul><h2>Salário</h2><p>O subsídio mensal de cada vereador, R$ ${brl(SALARIO)} (valor bruto, sem descontos), foi fixado pela <a href="${RES5}" target="_blank" rel="noopener">Resolução nº 5/2022 da Câmara</a> para a legislatura que começou em 1º de janeiro de 2025. O contador do topo é uma estimativa: ${R.vereadores.length} salários por mês, proporcional ao tempo desde a posse, sem 13º nem outros pagamentos, e sem descontar licenças ou faltas. A tabela de verbas remuneratórias do Diário Oficial Legislativo da Câmara traz os valores pagos, inclusive o do presidente.</p>
<h2>Temas, ruas e bairros</h2><p>O tema (trânsito, poda, buraco...), a rua e o bairro de cada pedido são lidos do texto oficial por palavras-chave, com a mesma regra para todos. Se o texto não cita o local, o pedido fica sem rua ou bairro. Pode haver erros de leitura, por isso cada item tem o link do documento original.</p>
<h2>Limites</h2><ul><li>Quantidade de propostas não mede qualidade nem resultado.</li><li>Um pedido é só um pedido: o sistema da Câmara não informa se a Prefeitura atendeu.</li><li>Vários pedidos sobre o mesmo local não provam omissão da Prefeitura.</li><li>Dados coletados periodicamente; o dia da última atualização aparece no rodapé.</li></ul>
<h2>Erro ou correção</h2><p>Se achar algum dado errado, abra o documento oficial pelo link do item e compare. Para avisar, escreva pela página de problemas do projeto: <a href="https://github.com/megaclic/radar-sjc/issues" target="_blank" rel="noopener">github.com/megaclic/radar-sjc/issues</a>.</p></div>`;}
init();
// Links externos abrem em nova aba (documentos oficiais): avisa quem usa leitor de tela.
// O ícone visual vem do CSS (a[target=_blank]::after).
function avisoNovaAba(raiz){(raiz||document).querySelectorAll('a[target=_blank]:not([data-na])').forEach(a=>{a.setAttribute('data-na','1');a.setAttribute('rel','noopener');const s=document.createElement('span');s.className='sr';s.textContent=' (abre em nova aba)';a.appendChild(s);});}
new MutationObserver(()=>avisoNovaAba()).observe(document.body,{childList:true,subtree:true});avisoNovaAba();

/* ---------- GASTOS ---------- */
const PORTAL='https://portal.camarasjc.sp.gov.br/portal-transparencia/execucao/despesas-detalhadas';
const rs=x=>'R$ '+brl(x||0);
const mi=x=>x>=1e6?'R$ '+(x/1e6).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+' mi':'R$ '+Math.round(x||0).toLocaleString('pt-BR');
const somaFolha=(f,fn)=>Object.entries(f||{}).filter(([c])=>fn(c)).reduce((t,[,x])=>t+x[0],0);
const catTot=(v)=>{const o={};Object.values(v.cats||{}).forEach(a=>Object.entries(a).forEach(([c,x])=>{o[c]=o[c]||[0,0];o[c][0]+=x[0];o[c][1]+=x[1]}));return o};
const lk=t=>`<a href="${PORTAL}" target="_blank" rel="noopener">${t}</a>`;
const kpi=(x,t)=>`<div class="tile"><b>${mi(x)}</b><span>${t}<br>${rs(x)}</span></div>`;
const barras=(pares,rot)=>{const mx=Math.max(...pares.map(p=>p[1]),1),W=320,H=130,bw=W/pares.length;
 return `<svg class="graf" viewBox="0 0 ${W} ${H+20}" role="img" aria-label="${esc(rot)}">`+pares.map((p,i)=>{const h=Math.round(p[1]/mx*H);return `<g><title>${esc(p[0])}: ${rs(p[1])}</title><rect x="${(i*bw+2).toFixed(1)}" y="${H-h}" width="${(bw-4).toFixed(1)}" height="${h}" rx="3" fill="var(--btn)"/><text x="${(i*bw+bw/2).toFixed(1)}" y="${H+14}" text-anchor="middle" font-size="9" fill="currentColor">${p[0].slice(0,2)}</text></g>`}).join('')+'</svg>'};
const est=i=>{const m=i.mov||[],est=i.emp===0&&m.some(x=>x.t==='Estorno');const nfs=(i.nf||[]).filter(n=>n.nf);
 if(est)return `<p class="aviso"><b>Empenho estornado (cancelado).</b> Valor inicial ${esc(m[0].v)}, devolvido integralmente. Nenhum valor foi gasto nesta compra.</p><dl><dt>Empenhado (valor final)</dt><dd>${rs(0)}</dd><dt>Pago</dt><dd>${rs(0)}</dd></dl>`;
 return `<dl><dt>Empenhado</dt><dd>${rs(i.emp)}</dd><dt>Pago</dt><dd>${rs(i.pago)}</dd></dl><p class="nf"><b>Nota fiscal:</b> ${nfs.length?nfs.map(n=>esc(n.nf)).join('<br>'):'não informada no portal'}</p>`};
function pGas(v){get('data/gastos.json').then(G=>{if(CV!==v.id)return;const g=G.vereadores.find(x=>x.id===v.id);
 if(!g){$('#aba').innerHTML='<p>Sem dados de gastos para este vereador.</p>';return}
 const cs=G.competencias,n25=cs.filter(c=>c.endsWith('2025')).length,n26=cs.filter(c=>c.endsWith('2026')).length,ult=cs[cs.length-1],pes=(g.folha[ult]||[0,0])[1];
 const f25=somaFolha(g.folha,c=>c.endsWith('2025')),f26=somaFolha(g.folha,c=>c.endsWith('2026')),ct=catTot(g),cats=Object.entries(ct).sort((a,b)=>b[1][0]-a[1][0]),emp=cats.reduce((t,[,x])=>t+x[0],0);
 const sub=SALARIO*cs.length,tot=sub+f25+f26+emp,u12=cs.slice(-12).map(c=>[c,(g.folha[c]||[0])[0]]),mn=u12.slice().sort((a,b)=>a[1]-b[1])[0],mxx=u12.slice().sort((a,b)=>b[1]-a[1])[0];
 $('#aba').innerHTML=`<p>Gastos ligados a este vereador no Portal da Transparência da Câmara, em ${G.anos.join(' e ')}.</p>
<h2>Custo do mandato</h2><div class="kpis">${kpi(tot,'subsídio + equipe + outros gastos')}</div>
<div class="cd"><dl><dt>Subsídio (${cs.length} meses × R$ ${brl(SALARIO)}, estimativa)</dt><dd>${rs(sub)}</dd><dt>Equipe do gabinete</dt><dd>${rs(f25+f26)}</dd><dt>Outros gastos (empenhado)</dt><dd>${rs(emp)}</dd></dl></div>
<h2>Equipe do gabinete</h2><div class="kpis">${kpi(f25,'equipe em 2025 ('+n25+' meses)')}${kpi(f26,'equipe em 2026 ('+n26+' meses, até '+ult+')')}</div>
<p>${nf(pes)} pessoas lotadas no gabinete em ${ult}. Soma do salário bruto de quem está lotado ali. Estagiários não aparecem com lotação no portal e ficam de fora. ${lk('Fonte: Remuneração, no portal')}.</p>
<h3 class="gt">Folha mensal do gabinete, últimos ${u12.length} meses</h3>${barras(u12,'Folha mensal do gabinete nos últimos '+u12.length+' meses')}
<p class="peq">Barras partem do zero. Menor mês: ${esc(mn[0])}, ${rs(mn[1])}. Maior mês: ${esc(mxx[0])}, ${rs(mxx[1])}.</p>
<h2>Outros gastos do gabinete</h2>${cats.length?`<div class="kpis">${kpi(emp,'empenhado em '+G.anos.join(' e '))}</div><p class="peq">Empenhado é o valor reservado para pagar. O valor pago aparece ao lado de cada tipo.</p>
<div class="cd"><dl>${cats.map(([c,x])=>`<dt>${esc(c)}<br><small>pago ${rs(x[1])}</small></dt><dd>${rs(x[0])}</dd>`).join('')}</dl></div>
<details><summary><b>Ver um por um (${nf(g.itens.length)})</b></summary><ul class="cards">${g.itens.map(i=>`<li class="cd"><h3>${esc(i.cat)}</h3><p class="sub">${fd(i.d)} · ${esc(i.doc)} · ${esc(i.cred)}</p><p class="hist">${esc(i.h)}</p>${est(i)}</li>`).join('')}</ul><p class="peq">O portal informa o número, a emissão e o valor da nota. Não mostra o arquivo da nota nem a lista de itens comprados.</p></details>`:'<p>O portal não mostra nenhum gasto ligado ao centro de custo deste vereador nesse período.</p>'}
<p class="peq">Só aparece o que o portal liga ao centro de custo do vereador. O subsídio é estimado pela Resolução nº 5/2022. ${lk('Fonte: Despesas Detalhadas, no portal')} (procure pelo número do empenho). Atualizado em ${fd(G.gerado_em.slice(0,10))}.</p>`})}
let CMPOPEN=0;
const vfoto=v=>`<img src="${esc(v.foto)}" alt="Foto de ${esc(v.nome)}" loading="lazy">`;
function comparar(a,b){app.innerHTML='<h1>Comparar vereadores</h1><p>Carregando…</p>';get('data/gastos.json').then(G=>{
 const V=id=>R.vereadores.find(x=>x.id===id);
 const info=id=>{const v=V(id);if(!v)return null;const g=G.vereadores.find(x=>x.id===id),p=pres(v),eq=somaFolha(g.folha,()=>true),ou=Object.values(catTot(g)).reduce((t,x)=>t+x[0],0);return {v,p,eq,ou,tot:SALARIO*G.competencias.length+eq+ou}};
 const A=info(a),B=info(b);
 const lin=[['Presença nas sessões',x=>x.p.pct+'% ('+nf(x.p.pr)+' de '+nf(x.p.tot)+')'],['Faltas sem justificativa',x=>nf(x.p.f)],['Propostas apresentadas',x=>nf(x.v.n_props)],['Votos sim',x=>nf(x.v.votos['Favorável'])],['Votos não',x=>nf(x.v.votos['Contrário'])],['Equipe do gabinete (2025 e 2026)',x=>rs(x.eq)],['Outros gastos (empenhado)',x=>rs(x.ou)],['Custo do mandato estimado',x=>rs(x.tot)]];
 const slot=(n,x)=>`<button type="button" class="slot2${x?' cheio':''}${CMPOPEN===n?' on':''}" data-slot="${n}" aria-expanded="${CMPOPEN===n}">${x?`${vfoto(x.v)}<b>${esc(x.v.nome)}</b><span class="pill">${esc(x.v.partido)}</span><small>Trocar</small>`:`<span class="vazio" aria-hidden="true">+</span><b>Vereador ${n}</b><small>Toque para escolher</small>`}</button>`;
 const outro=CMPOPEN===1?b:a;
 const lista=q=>R.vereadores.filter(v=>v.id!==outro&&(!q||norm(v.nome).includes(norm(q))||norm(v.partido).includes(norm(q)))).map(v=>`<li><button type="button" data-pick="${v.id}">${vfoto(v)}<span class="mid"><b>${esc(v.nome)}</b><small>${esc(v.partido)}</small></span></button></li>`).join('')||'<li class="peq" style="padding:12px 14px">Nenhum vereador encontrado.</li>';
 app.innerHTML=`<h1>Comparar vereadores</h1><p>Escolha dois vereadores. Os números vêm dos registros oficiais da Câmara. Não há nota: cada número mostra uma coisa diferente e nenhum deles mede sozinho a qualidade de um mandato.</p>
<div class="slots">${slot(1,A)}${slot(2,B)}</div>
${CMPOPEN?`<div class="sheet2" role="dialog" aria-label="Escolher vereador ${CMPOPEN}"><input type="search" id="pq" placeholder="Buscar por nome ou partido" aria-label="Buscar vereador" autocomplete="off"><ul class="pick" id="pl">${lista('')}</ul></div>`:''}
${A&&B?`<div class="cmp"><div class="cmph"></div><div class="cmph"><a href="#/v/${A.v.id}/presenca">${vfoto(A.v)}${esc(A.v.nome)}<small>${esc(A.v.partido)}</small></a></div><div class="cmph"><a href="#/v/${B.v.id}/presenca">${vfoto(B.v)}${esc(B.v.nome)}<small>${esc(B.v.partido)}</small></a></div>${lin.map(([t,f])=>`<div class="cmpl">${t}</div><div>${f(A)}</div><div>${f(B)}</div>`).join('')}</div><p class="peq">Gabinete maior custa mais. Equipe: soma do salário bruto de jan/2025 a ${G.competencias[G.competencias.length-1]}. Subsídio estimado em ${rs(SALARIO)} por mês. Fonte dos gastos: ${lk('Portal da Transparência da Câmara')}.</p>`:'<p class="peq">Escolha os dois vereadores para ver lado a lado.</p>'}`;
 const go=(x,y)=>{CMPOPEN=0;location.hash='#/comparar/'+(x||0)+'/'+(y||0)};
 app.querySelectorAll('[data-slot]').forEach(bt=>bt.onclick=()=>{const n=+bt.dataset.slot;CMPOPEN=CMPOPEN===n?0:n;comparar(a,b)});
 const pq=$('#pq');if(pq){pq.focus({preventScroll:false});pq.oninput=()=>{$('#pl').innerHTML=lista(pq.value)};
  $('#pl').onclick=e=>{const bt=e.target.closest('[data-pick]');if(!bt)return;const id=+bt.dataset.pick;CMPOPEN===1?go(id,b):go(a,id)};
  pq.onkeydown=e=>{if(e.key==='Escape'){CMPOPEN=0;comparar(a,b)}}}})}
function gastosGeral(){app.innerHTML='<h1>Gastos da Câmara</h1><p>Carregando…</p>';get('data/gastos.json').then(G=>{
 const cs=G.competencias,ult=cs[cs.length-1],an=Object.entries(G.geral.anos);
 const TIPOS=[...new Set(G.vereadores.flatMap(g=>Object.values(g.cats).flatMap(a=>Object.keys(a))))];
 TIPOS.sort((a,b)=>(a==='Outros')-(b==='Outros')||a.localeCompare(b,'pt'));
 const ST={tipo:'total',ano:'all',dir:'desc'};
 const anos=()=>ST.ano==='all'?G.anos.map(String):[ST.ano];
 const val=(g,t)=>{const ys=anos(),eq=somaFolha(g.folha,c=>ys.includes(c.slice(3))),ou=ys.reduce((s,y)=>s+Object.values(g.cats[y]||{}).reduce((q,x)=>q+x[0],0),0);
  return t==='total'?eq+ou:t==='equipe'?eq:ys.reduce((s,y)=>s+((g.cats[y]||{})[t]||[0,0])[0],0)};
 const NOMET=t=>t==='total'?'gasto total do gabinete (equipe + outros gastos)':t==='equipe'?'equipe (salário bruto)':t;
 const grp={};G.publicidade.forEach(p=>{const k=p.credor+'|'+p.contrato+'|'+p.subelemento;(grp[k]=grp[k]||{p,anos:[]}).anos.push(p)});
 const pubs=Object.values(grp).sort((a,b)=>b.anos.reduce((t,x)=>t+x.empenhado,0)-a.anos.reduce((t,x)=>t+x.empenhado,0));
 const chip=(g,k,v,t)=>`<button type="button" class="chip${ST[g]===v?' on':''}" data-g="${g}" data-v="${v}" aria-pressed="${ST[g]===v}">${t}</button>`;
 const rank=()=>{const L=G.vereadores.map(g=>({g,v:val(g,ST.tipo),eq:val(g,'equipe'),ou:val(g,'total')-val(g,'equipe'),pes:(g.folha[ult]||[0,0])[1]}));
  L.sort((a,b)=>ST.dir==='desc'?b.v-a.v:a.v-b.v);const mx=Math.max(...L.map(r=>r.v))||1,tot=L.reduce((t,r)=>t+r.v,0),
  maior=L.slice().sort((a,b)=>b.v-a.v)[0],menor=L.slice().sort((a,b)=>a.v-b.v)[0];
  const fo=id=>{const x=R.vereadores.find(y=>y.id===id);return x?esc(x.foto):''},pt=id=>{const x=R.vereadores.find(y=>y.id===id);return x?esc(x.partido):''};
  const crach=(r,cl,tit)=>`<a class="cracha ${cl}" href="#/v/${r.g.id}/gastos"><span class="selo2">${tit}</span><img src="${fo(r.g.id)}" alt="Foto de ${esc(r.g.nome)}" loading="lazy"><h3>${esc(r.g.nome)}</h3><small>${pt(r.g.id)} · ${nf(r.pes)} pessoas na equipe</small><b>${rs(r.v)}</b></a>`;
  const dif=maior.v&&menor.v?` O maior gasto é ${(maior.v/menor.v).toFixed(2).replace('.',',')} vez${maior.v/menor.v<2?'':'es'} o menor.`:'';
  return `<div class="kpis">${kpi(tot,'soma dos 21 gabinetes')}</div>
  <div class="podio">${crach(maior,'mais','Quem mais gastou')}${menor.v?crach(menor,'menos','Quem menos gastou'):`<div class="cracha menos"><span class="selo2">Sem nenhum gasto</span><h3>${L.filter(r=>!r.v).length} vereadores</h3><small>nada ligado a este tipo de gasto</small></div>`}</div><p class="peq">Diferença entre o maior e o menor valor.${dif}</p>
  <ol class="lista">${L.map((r,i)=>`<li><a href="#/v/${r.g.id}/gastos"><span class="pos">${i+1}º</span><img src="${fo(r.g.id)}" alt="" loading="lazy"><span class="mid"><span class="nm2"><b>${esc(r.g.nome)}</b><span class="pill">${pt(r.g.id)}</span></span><span class="bar"><i style="width:${Math.round(r.v*100/mx)}%"></i></span>${ST.tipo==='total'?`<small>Equipe ${rs(r.eq)} · Outros ${rs(r.ou)}</small>`:''}</span><span class="vl">${r.v?rs(r.v):'sem gasto'}</span></a></li>`).join('')}</ol>`};
 const draw=()=>{$('#ctl').innerHTML=`<p class="peq" style="margin:10px 0 4px">Período</p><div class="sortb">${chip('ano','ano','all','2025 e 2026')}${G.anos.map(y=>chip('ano','ano',String(y),y+(y==2026?' (até out)':''))).join('')}</div>
  <p class="peq" style="margin:10px 0 4px">O que foi gasto</p><div class="sortb">${chip('tipo','tipo','total','Tudo')}${chip('tipo','tipo','equipe','Equipe')}${TIPOS.map(t=>chip('tipo','tipo',t,esc(t))).join('')}</div>
  <p class="peq" style="margin:10px 0 4px">Ordem</p><div class="sortb">${chip('dir','dir','desc','Quem mais gasta')}${chip('dir','dir','asc','Quem menos gasta')}</div>`;
  $('#rk').innerHTML=`<h3 style="margin:14px 0 4px;text-transform:none;letter-spacing:0;color:var(--tx)">Ranking: ${esc(NOMET(ST.tipo))}</h3>`+rank()};
 app.innerHTML=`<h1>Gastos da Câmara</h1><p>Tudo vem do Portal da Transparência da própria Câmara. ${lk('Abrir o portal')}. Atualizado em ${fd(G.gerado_em.slice(0,10))}.</p>
<div class="kpis">${an.map(([a,x])=>kpi(x.pago,'pago pela Câmara em '+a+(a==='2026'?' (até agora)':''))).join('')}</div>
<h2>Ranking dos gabinetes</h2><p>Cada gasto está ligado ao vereador pelo centro de custo do portal. Escolha o período e o tipo de gasto. Toque no nome para ver cada compra.</p>
<div id="ctl"></div><div id="rk"></div>
<p class="peq">Equipe: salário bruto de quem está lotado no gabinete (2026: até ${ult}). Os outros tipos são valores empenhados, isto é, reservados para pagar. Estagiários não aparecem com lotação no portal e ficam fora. <b>Gabinete com mais gente custa mais: o ranking mede valor, não qualidade do mandato.</b></p>
<h2>Gastos para olhar com atenção</h2><p>Classificações oficiais que costumam gerar dúvida, como alimentação, copa e cozinha, eventos e homenagens. <b>Estar aqui não significa irregularidade</b>: leia o motivo de cada compra. Valem para toda a Câmara, não só para os gabinetes.</p>
<ul class="cards">${(G.atencao||[]).map(a=>`<li class="cd"><h3>${esc(a.sub.replace(/^[\d.]+ - /,''))}</h3><p class="sub">${nf(a.n)} empenhos em ${G.anos.join(' e ')}</p><dl><dt>Empenhado</dt><dd>${rs(a.empenhado)}</dd><dt>Pago</dt><dd>${rs(a.pago)}</dd></dl><details><summary><b>Maiores compras (${a.itens.length})</b></summary>${a.itens.map(i=>`<p class="hist"><b>${rs(i.emp)}</b> · ${fd(i.d)} · ${esc(i.doc)}<br>${esc(i.cred)} · ${esc(i.cc)}<br>${esc(i.h)}</p>`).join('')}</details></li>`).join('')}</ul>
<h2>Publicidade e comunicação da Câmara</h2><p>Despesas que o portal classifica como "Serviços de Propaganda", "Serviços de Publicidade" ou "Serviços de Comunicação em Geral". Não são de um vereador, são da Câmara.</p>
<ul class="cards">${pubs.map(({p,anos})=>`<li class="cd"><h3>${esc(p.credor)}</h3><p class="sub">${esc(p.subelemento.replace(/^[\d.]+ - /,''))} · ${p.contrato?'contrato '+esc(p.contrato):'sem contrato informado'}</p><dl>${anos.sort((a,b)=>a.ano-b.ano).map(x=>`<dt>${x.ano} empenhado</dt><dd>${rs(x.empenhado)}</dd><dt>${x.ano} pago</dt><dd>${rs(x.pago)}</dd>`).join('')}</dl></li>`).join('')}</ul>
<p class="peq">Pago é o valor acumulado nos empenhos listados. Pode diferir do total pago no ano em "Despesas pagas por período", outra tela do mesmo portal. ${lk('Fonte: Despesas Detalhadas')}.</p>`;
 draw();app.addEventListener('click',e=>{const b=e.target.closest('[data-g]');if(!b||!$('#ctl'))return;ST[b.dataset.g]=b.dataset.v;draw()})})}
