/* Página Pedidos: fluxo orçamento → aguardando pagamento → pago → entregue.
   Persistido em P3D.orders (p3d_orders). DOM API — sem innerHTML com texto do usuário. */
(function(){
  const P=window.P3D; const $=P.$, $$=P.$$; const {brl,nf,INV}=P;
  const orders=P.orders;
  const ST={
    aguarda:{lbl:'Aguardando',c:'var(--amber)'},
    pago:{lbl:'Pago',c:'var(--teal)'},
    entregue:{lbl:'Entregue',c:'#5FD89F'},
    cancelado:{lbl:'Cancelado',c:'var(--rust)'}
  };
  const OKST=['pago','entregue'];
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const today=()=>new Date().toISOString().slice(0,10);
  const fmtD=d=>{if(!d)return '';const x=new Date(d+'T00:00:00');return isNaN(x)?'':x.toLocaleDateString('pt-BR');};
  const printName=id=>{const p=INV.printers.find(x=>x.id===id);return p?p.nome:'';};

  let filter='todos', editO=null, qIdx=-1, curCusto=0;

  function say(sel,txt,ok){const el=$(sel);el.hidden=false;el.textContent=txt;el.style.color=ok?'var(--teal)':'var(--hot)';
    clearTimeout(say._t[sel]);say._t[sel]=setTimeout(()=>{el.hidden=true;},4000);}
  say._t={};

  /* ---------- formulário ---------- */
  const f={cliente:$('#f-o-cliente'),quote:$('#f-o-quote'),desc:$('#f-o-desc'),qtd:$('#f-o-qtd'),
    unit:$('#f-o-unit'),forma:$('#f-o-forma'),printer:$('#f-o-printer'),data:$('#f-o-data'),obs:$('#f-o-obs')};

  function fillQuotesSel(){
    const cur=f.quote.value;
    f.quote.innerHTML='';
    const o0=document.createElement('option');o0.value='';o0.textContent='— item livre (sem orçamento) —';f.quote.append(o0);
    P.quotes.forEach((q,i)=>{
      const o=document.createElement('option');o.value=String(i);
      o.textContent=q.nome+' · '+(q.lote>1?'lote '+nf(q.lote)+' un. · ':'')+brl(q.preco);
      f.quote.append(o);});
    f.quote.value=[...f.quote.options].some(o=>o.value===cur)?cur:'';
  }
  function fillPrinterSel(){
    f.printer.innerHTML='';
    const o0=document.createElement('option');o0.value='o';o0.textContent='— não vincular —';f.printer.append(o0);
    INV.printers.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.nome;f.printer.append(o);});
  }
  function pickQuote(){
    const v=f.quote.value;
    if(v===''){qIdx=-1;preview();return;}
    qIdx=+v;const q=P.quotes[qIdx];if(!q){qIdx=-1;preview();return;}
    f.desc.value=q.nome;f.qtd.value=q.lote||1;f.unit.value=q.preco;
    preview();
  }
  f.quote.onchange=pickQuote;

  function preview(){
    const q=Math.max(1,parseFloat(f.qtd.value)||1), u=parseFloat(f.unit.value);
    if(!isFinite(u)){$('#oPreview').textContent='Total do pedido: —';return;}
    let txt='Total do pedido: '+brl(u*q);
    const cu=qIdx>=0&&P.quotes[qIdx]?P.quotes[qIdx].custo:curCusto;
    if(cu>0){txt+=' · custo do orçamento: '+brl(cu*q)+' · lucro previsto: '+brl(u*q-cu);}
    $('#oPreview').textContent=txt;
  }
  [f.qtd,f.unit].forEach(i=>i.addEventListener('input',preview));

  function formMode(){
    $('#oFormTitle').textContent=editO?'Editando pedido':'Novo pedido';
    $('#oAdd').textContent=editO?'✓ Salvar alterações':'＋ Criar pedido (aguardando pagamento)';
    $('#oCancel').hidden=!editO;
  }
  function fill(o){
    if(o){f.cliente.value=o.cliente||'';f.desc.value=o.desc||'';f.qtd.value=o.qtd||1;f.unit.value=o.unit;
      f.forma.value=[...f.forma.options].some(x=>x.value===o.forma)?o.forma:'A combinar';
      f.data.value=o.data||today();f.obs.value=o.obs||'';}
    else{f.cliente.value='';f.desc.value='';f.qtd.value=1;f.unit.value='';f.obs.value='';f.data.value=today();}
    fillQuotesSel();fillPrinterSel();
    if(o){qIdx=-1;f.quote.value='';f.printer.value=(o.printerId&&printName(o.printerId))?o.printerId:'o';curCusto=o.custoUnit||0;}
    else{qIdx=-1;curCusto=0;f.quote.value='';f.printer.value='o';}
    preview();formMode();
  }
  $('#oCancel').onclick=()=>{editO=null;fill(null);};

  $('#oAdd').onclick=()=>{
    const cliente=f.cliente.value.trim(), desc=f.desc.value.trim();
    const u=parseFloat(f.unit.value);
    if(!cliente){say('#oMsg','Informe o cliente do pedido.',false);f.cliente.focus();return;}
    if(!desc){say('#oMsg','Informe o item do pedido (ou escolha um orçamento salvo).',false);f.desc.focus();return;}
    if(!isFinite(u)||u<=0){say('#oMsg','Informe o valor unitário combinado — maior que zero.',false);f.unit.focus();return;}
    const qtd=Math.max(1,Math.round(parseFloat(f.qtd.value)||1));
    const custoUnit=qIdx>=0&&P.quotes[qIdx]?P.quotes[qIdx].custo:curCusto;
    const rec={cliente,desc,qtd,unit:u,total:u*qtd,custoUnit,
      forma:f.forma.value,printerId:f.printer.value==='o'?'':f.printer.value,
      data:f.data.value||today(),obs:f.obs.value.trim()};
    if(editO){const old=orders.find(x=>x.id===editO);if(old)Object.assign(old,rec);}
    else{Object.assign(rec,{id:uid(),status:'aguarda',dataPag:'',dataEnt:''});orders.push(rec);}
    const wasEdit=!!editO;
    editO=null;fill(null);P.ordersStore();renderAll();
    say('#oMsg',wasEdit?'Alterações do pedido salvas ✓':'Pedido criado na etapa "Aguardando pagamento" ✓',true);
  };

  /* ---------- pipeline ---------- */
  function advance(o){
    if(o.status==='aguarda'){o.status='pago';o.dataPag=today();}
    else if(o.status==='pago'){o.status='entregue';o.dataEnt=today();}
    P.ordersStore();renderAll();
  }
  function undo(o){
    if(o.status==='pago'){o.status='aguarda';o.dataPag='';}
    else if(o.status==='entregue'){o.status='pago';o.dataEnt='';}
    else if(o.status==='cancelado'){o.status='aguarda';}
    P.ordersStore();renderAll();
  }

  function renderChips(){
    const wrap=$('#oChips');wrap.innerHTML='';
    const mk=(key,lbl)=>{
      const n=key==='todos'?orders.length:orders.filter(o=>o.status===key).length;
      const c=document.createElement('button');c.type='button';c.className='chip';
      c.textContent=lbl+(n?' ('+n+')':'');c.setAttribute('aria-pressed',String(filter===key));
      c.onclick=()=>{filter=key;renderAll();};wrap.append(c);};
    mk('todos','Todos');
    Object.keys(ST).forEach(k=>mk(k,ST[k].lbl));
  }

  function renderTable(){
    const tb=$('#oTable');tb.innerHTML='';
    const list=orders.slice().filter(o=>filter==='todos'||o.status===filter)
      .sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
    if(!list.length){const tr=document.createElement('tr');const td=document.createElement('td');
      td.colSpan=7;td.style.color='var(--dim)';
      td.textContent=orders.length?'Nenhum pedido nesta etapa.':'Nenhum pedido ainda — crie acima ou use "→ pedido" na aba Orçamentos.';
      tr.append(td);tb.append(tr);}
    list.forEach(o=>{
      const tr=document.createElement('tr');
      const t1=document.createElement('td');const d1=document.createElement('span');d1.className='m';
      d1.textContent=fmtD(o.data)||'—';t1.append(d1);
      const linhas=[];
      if(o.dataPag)linhas.push('pgto '+fmtD(o.dataPag));
      if(o.dataEnt)linhas.push('entrega '+fmtD(o.dataEnt));
      if(linhas.length){const sp=document.createElement('div');sp.className='m';sp.style.color='var(--dim)';sp.textContent=linhas.join(' · ');t1.append(sp);}
      const t2=document.createElement('td');const b2=document.createElement('b');b2.textContent=o.cliente;t2.append(b2);
      const t3=document.createElement('td');const b3=document.createElement('b');b3.textContent=o.desc;t3.append(b3);
      const ex=[nf(o.qtd)+' × '+brl(o.unit),o.forma];
      if(o.obs)ex.push(o.obs);
      const sp3=document.createElement('div');sp3.className='m';sp3.style.color='var(--dim)';sp3.textContent=ex.join(' · ');t3.append(sp3);
      const t4=document.createElement('td');t4.className='m';t4.textContent=printName(o.printerId)||'—';
      const t5=document.createElement('td');const st=ST[o.status]||ST.aguarda;
      const pill=document.createElement('span');pill.className='pill';pill.style.setProperty('--pc',st.c);pill.textContent=st.lbl;t5.append(pill);
      const t6=document.createElement('td');const b6=document.createElement('b');b6.textContent=brl(o.total);t6.append(b6);
      if(OKST.includes(o.status)&&o.custoUnit>0){const sp=document.createElement('div');sp.className='m';
        sp.style.color=o.total-o.custoUnit*o.qtd>=0?'var(--dim)':'var(--hot)';
        sp.textContent='lucro '+brl(o.total-o.custoUnit*o.qtd);t6.append(sp);}
      const t7=document.createElement('td');const act=document.createElement('div');act.className='rowacts';
      if(o.status==='aguarda'||o.status==='pago'){
        const adv=document.createElement('button');adv.type='button';adv.className='lotbtn';
        adv.textContent=o.status==='aguarda'?'✓ Pago':'✓ Entregue';
        adv.onclick=e=>{e.stopPropagation();advance(o);};act.append(adv);}
      if(o.status!=='aguarda'){
        const un=document.createElement('button');un.type='button';un.className='lotbtn';
        un.textContent=o.status==='cancelado'?'↺ reativar':'↺';
        un.title='Voltar uma etapa';
        un.onclick=e=>{e.stopPropagation();undo(o);};act.append(un);}
      if(o.status!=='cancelado'){
        const cc=document.createElement('button');cc.type='button';cc.className='lotbtn';cc.textContent='cancelar';
        cc.onclick=e=>{e.stopPropagation();
          if(!confirm('Cancelar o pedido de "'+o.cliente+'" ('+o.desc+')? Ele sai dos totais mas fica no histórico.'))return;
          o.status='cancelado';P.ordersStore();renderAll();};
        act.append(cc);}
      const ed=document.createElement('button');ed.type='button';ed.className='lotbtn';ed.textContent='editar';
      ed.onclick=e=>{e.stopPropagation();editO=o.id;fill(o);location.hash='novo';f.cliente.focus();};
      const del=document.createElement('button');del.type='button';del.className='x';del.textContent='×';
      del.setAttribute('aria-label','Excluir pedido de '+o.cliente);
      del.onclick=e=>{e.stopPropagation();
        if(!confirm('Excluir o pedido de "'+o.cliente+'" ('+o.desc+', '+brl(o.total)+')?'))return;
        orders.splice(orders.indexOf(o),1);if(editO===o.id)fill(null);P.ordersStore();renderAll();};
      act.append(ed,del);t7.append(act);
      tr.append(t1,t2,t3,t4,t5,t6,t7);tb.append(tr);
    });
    const show=list.filter(o=>o.status!=='cancelado');
    $('#oTotal').textContent=brl(show.reduce((a,o)=>a+(o.total||0),0));
    $('#oCount').textContent=list.length?'('+list.length+' pedido'+(list.length>1?'s':'')+')':'';
  }

  /* ---------- KPIs + receita mensal ---------- */
  function renderKpis(){
    const arec=orders.filter(o=>o.status==='aguarda').reduce((a,o)=>a+o.total,0);
    const fat=orders.filter(o=>OKST.includes(o.status)).reduce((a,o)=>a+o.total,0);
    const m=today().slice(0,7);
    const mes=orders.filter(o=>OKST.includes(o.status)&&String(o.dataPag||'').slice(0,7)===m).reduce((a,o)=>a+o.total,0);
    const lucro=orders.filter(o=>OKST.includes(o.status)&&o.custoUnit>0).reduce((a,o)=>a+(o.unit-o.custoUnit)*o.qtd,0);
    $('#kpiAreceber').textContent=brl(arec);
    $('#kpiFat').textContent=brl(fat);
    $('#kpiMes').textContent=brl(mes);
    $('#kpiLucro').textContent=brl(lucro);
  }

  function renderBars(){
    const el=$('#oBars');el.innerHTML='';
    const now=new Date(),keys=[],labs=[];
    for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);
      keys.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));
      labs.push(d.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''));}
    const tot=Object.fromEntries(keys.map(k=>[k,0]));
    orders.filter(o=>OKST.includes(o.status)).forEach(o=>{
      const k=String(o.dataPag||o.data||'').slice(0,7);if(tot[k]!==undefined)tot[k]+=o.total||0;});
    const max=Math.max(...keys.map(k=>tot[k]),1);
    keys.forEach((k,i)=>{
      const c=document.createElement('div');c.className='bcol';
      const bar=document.createElement('div');bar.className='bar';
      bar.style.background='linear-gradient(180deg,var(--teal),rgba(23,163,152,.35))';
      bar.style.height=Math.round(tot[k]/max*100)+'%';
      if(!tot[k])bar.style.opacity='.25';
      bar.title=labs[i]+' · '+brl(tot[k]);
      const lab=document.createElement('span');lab.textContent=labs[i];
      c.append(bar,lab);el.append(c);});
    const sum=keys.reduce((a,k)=>a+tot[k],0);
    $('#oNote').textContent='Média de '+brl(sum/12)+' recebidos por mês nos últimos 12 meses · este mês: '+brl(tot[keys[11]])+
      '. Vincule a impressora no pedido para ver o payback na aba Investimento.';
  }

  function renderAll(){renderChips();renderTable();renderKpis();renderBars();}
  fill(null);renderAll();
})();
