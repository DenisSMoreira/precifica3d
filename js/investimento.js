/* Página Investimento: cadastro de impressoras + lançamentos de compra (filamento,
   apetrechos, peças). Tudo em P3D.INV, persistido em p3d_inv (DOM API — sem innerHTML com texto do usuário). */
(function(){
  const P=window.P3D; const $=P.$, $$=P.$$; const {brl,nf,S,INV,MATERIALS}=P;
  const TIPOS={
    filamento:{lbl:'Filamento',short:'Filamentos',color:'var(--amber)'},
    apetrecho:{lbl:'Ferramenta / apetrecho',short:'Apetrechos',color:'var(--slate)'},
    peca:{lbl:'Peça de reposição',short:'Peças',color:'var(--rust)'},
    outros:{lbl:'Outro',short:'Outros',color:'var(--olive)'}
  };
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const today=()=>new Date().toISOString().slice(0,10);
  const fmtD=d=>{if(!d)return '—';const x=new Date(d+'T00:00:00');return isNaN(x)?'—':x.toLocaleDateString('pt-BR');};
  const num=id=>INV.printers.find(p=>p.id===id);

  let curTipo='filamento', filter='todas', editP=null, editB=null;

  /* ---------- helpers de UI ---------- */
  function say(sel,txt,ok){const el=$(sel);el.hidden=false;el.textContent=txt;el.style.color=ok?'var(--teal)':'var(--hot)';
    clearTimeout(say._t[sel]);say._t[sel]=setTimeout(()=>{el.hidden=true;},4000);}
  say._t={};
  function btnFlash(btn,txt){const old=btn.textContent;btn.textContent=txt;setTimeout(()=>{btn.textContent=old;},1600);}

  /* ============================================================
     IMPRESSORAS
     ============================================================ */
  const pFields={nome:$('#f-p-nome'),marca:$('#f-p-marca'),tech:$('#f-p-tech'),preco:$('#f-p-preco'),
    data:$('#f-p-data'),forn:$('#f-p-forn'),vida:$('#f-p-vida'),pot:$('#f-p-pot'),gar:$('#f-p-gar'),obs:$('#f-p-obs')};

  function pFormFill(p){
    pFields.nome.value=p?p.nome:'';pFields.marca.value=p&&p.marca?p.marca:'';
    if(p&&[...pFields.tech.options].some(o=>o.value===p.tech))pFields.tech.value=p.tech;
    pFields.preco.value=p?p.preco:'';pFields.data.value=(p&&p.data)||'';
    pFields.forn.value=p&&p.forn?p.forn:'';pFields.vida.value=p&&p.vida?p.vida:4000;
    pFields.pot.value=p&&p.pot?p.pot:145;pFields.gar.value=p&&isFinite(p.gar)?p.gar:12;
    pFields.obs.value=p&&p.obs?p.obs:'';
  }
  function pFormMode(){
    $('#pFormTitle').textContent=editP?'Editando impressora':'Nova impressora';
    $('#pAdd').textContent=editP?'✓ Salvar alterações':'＋ Cadastrar impressora';
    $('#pCancel').hidden=!editP;
  }
  function pCancel(){editP=null;pFormFill(null);pFormMode();}
  $('#pCancel').onclick=pCancel;

  $('#pAdd').onclick=()=>{
    const nome=pFields.nome.value.trim();
    const preco=parseFloat(pFields.preco.value);
    if(!nome){say('#pMsg','Dê um nome à impressora (ex.: Ender 3 V3 SE).',false);pFields.nome.focus();return;}
    if(!isFinite(preco)||preco<=0){say('#pMsg','Informe o valor pago — maior que zero.',false);pFields.preco.focus();return;}
    const rec={
      nome,marca:pFields.marca.value.trim(),tech:pFields.tech.value,preco,
      data:pFields.data.value||'',forn:pFields.forn.value.trim(),
      vida:Math.max(100,parseFloat(pFields.vida.value)||4000),
      pot:Math.max(10,parseFloat(pFields.pot.value)||145),
      gar:Math.max(0,parseFloat(pFields.gar.value)||0),
      obs:pFields.obs.value.trim()
    };
    if(editP){const old=num(editP);if(old)Object.assign(old,rec);}
    else{rec.id=uid();INV.printers.push(rec);}
    editP=null;pFormFill(null);pFormMode();P.invStore();renderAll();
    say('#pMsg','Impressora salva ✓',true);
  };

  function renderPrinters(){
    const tb=$('#prTable');tb.innerHTML='';
    if(!INV.printers.length){const tr=document.createElement('tr');const td=document.createElement('td');
      td.colSpan=9;td.style.color='var(--dim)';td.textContent='Nenhuma impressora cadastrada ainda — use o formulário acima.';
      tr.append(td);tb.append(tr);}
    INV.printers.forEach(p=>{
      const linked=INV.buys.filter(b=>b.printerId===p.id);
      const lSum=linked.reduce((a,b)=>a+(b.total||0),0);
      const sold=P.orders.filter(o=>o.printerId===p.id&&(o.status==='pago'||o.status==='entregue'));
      const soldSum=sold.reduce((a,o)=>a+(o.total||0),0);
      const tr=document.createElement('tr');
      const t1=document.createElement('td');const b1=document.createElement('b');b1.textContent=p.nome;t1.append(b1);
      if(p.marca){const sp=document.createElement('div');sp.className='m';sp.style.color='var(--dim)';sp.textContent=p.marca;t1.append(sp);}
      const t2=document.createElement('td');t2.className='m';t2.textContent=p.tech||'—';
      const t3=document.createElement('td');t3.className='m';t3.textContent=fmtD(p.data);
      const t4=document.createElement('td');t4.className='m';t4.textContent=brl(p.preco);
      const t5=document.createElement('td');t5.className='m';t5.textContent=brl(p.vida>0?p.preco/p.vida:0)+'/h';
      const t6=document.createElement('td');t6.className='m';t6.textContent=linked.length?linked.length+' · '+brl(lSum):'—';
      const t7=document.createElement('td');const b7=document.createElement('b');b7.textContent=brl(p.preco+lSum);t7.append(b7);
      const t8=document.createElement('td');const b8=document.createElement('b');b8.textContent=soldSum?brl(soldSum):'—';t8.append(b8);
      if(soldSum){const sp8=document.createElement('div');sp8.className='m';
        sp8.style.color=soldSum>=p.preco?'#5FD89F':'var(--dim)';
        sp8.textContent=sold.length+' vend.'+(soldSum>=p.preco?' · payback ✓':' · '+nf(soldSum/p.preco*100)+'% da máquina');t8.append(sp8);}
      const t9=document.createElement('td');const act=document.createElement('div');act.className='rowacts';
      const calc=document.createElement('button');calc.type='button';calc.className='lotbtn';calc.textContent='→ calculadora';
      calc.title='Levar valor, vida útil e consumo para a calculadora';
      calc.onclick=e=>{e.stopPropagation();S.maquina=p.preco;S.vida=p.vida;S.potencia=p.pot;P.saveSettings();
        $('#prHint').textContent='Usando "'+p.nome+'" na calculadora: máquina '+brl(p.preco)+', vida útil '+nf(p.vida)+'h, consumo '+nf(p.pot)+'W — veja em Calculadora › bloco 03.';};
      const ed=document.createElement('button');ed.type='button';ed.className='lotbtn';ed.textContent='editar';
      ed.onclick=e=>{e.stopPropagation();editP=p.id;pFormFill(p);pFormMode();location.hash='frota';pFields.nome.focus();};
      const del=document.createElement('button');del.type='button';del.className='x';del.textContent='×';
      del.setAttribute('aria-label','Excluir '+p.nome);
      del.onclick=e=>{e.stopPropagation();
        if(!confirm('Excluir a impressora "'+p.nome+'"? Lançamentos ligados a ela continuam no histórico, sem impressora.'))return;
        INV.buys.forEach(b=>{if(b.printerId===p.id)b.printerId='';});
        INV.printers.splice(INV.printers.indexOf(p),1);
        if(editP===p.id)pCancel();P.invStore();renderAll();};
      act.append(calc,ed,del);t9.append(act);
      tr.append(t1,t2,t3,t4,t5,t6,t7,t8,t9);tb.append(tr);
    });
    const fSum=INV.printers.reduce((a,p)=>a+(p.preco||0),0);
    const soldTot=P.orders.filter(o=>o.status==='pago'||o.status==='entregue').reduce((a,o)=>a+(o.total||0),0);
    if($('#prHint').textContent.indexOf('calculadora')<0)
      $('#prHint').textContent=INV.printers.length
        ?('Frota: '+INV.printers.length+' máquina'+(INV.printers.length>1?'s':'')+' · '+brl(fSum)+' investidos em equipamentos'+(soldTot?' · faturamento pago/entregue: '+brl(soldTot)+' — o payback aparece por linha.':'.'))
        :'';
  }

  /* ============================================================
     LANÇAMENTOS
     ============================================================ */
  const bF={desc:$('#f-b-desc'),material:$('#f-b-material'),grams:$('#f-b-grams'),qtd:$('#f-b-qtd'),
    preco:$('#f-b-preco'),data:$('#f-b-data'),forn:$('#f-b-forn'),printer:$('#f-b-printer'),obs:$('#f-b-obs')};
  MATERIALS.forEach(m=>{const o=document.createElement('option');o.value=m.n;o.textContent=m.n;bF.material.append(o);});
  const oOut=document.createElement('option');oOut.value='Outro';oOut.textContent='Outro / específico';bF.material.append(oOut);
  bF.data.value=today();

  function tipoUI(){
    $$('#tipoChips .chip').forEach(c=>c.setAttribute('aria-pressed',String(c.dataset.t===curTipo)));
    const fil=curTipo==='filamento';
    $('#filMatWrap').hidden=!fil;$('#filGrWrap').hidden=!fil;
    preview();
  }
  $$('#tipoChips .chip').forEach(c=>{c.onclick=()=>{curTipo=c.dataset.t;tipoUI();};});

  function preview(){
    const q=Math.max(1,parseFloat(bF.qtd.value)||1), u=parseFloat(bF.preco.value);
    if(!isFinite(u)){ $('#bPreview').textContent='Total do lançamento: —'; return; }
    let txt='Total do lançamento: '+brl(u*q);
    if(curTipo==='filamento'){const g=parseFloat(bF.grams.value)||1000;txt+=' · R$ '+nf(u/(g/1000),2)+' por kg';}
    $('#bPreview').textContent=txt;
  }
  [bF.qtd,bF.preco,bF.grams].forEach(i=>i.addEventListener('input',preview));

  function bFormMode(){
    $('#bFormTitle').textContent=editB?'Editando lançamento':'Novo lançamento';
    $('#bAdd').textContent=editB?'✓ Salvar alterações':'＋ Lançar compra';
    $('#bCancel').hidden=!editB;
  }
  function bFill(b){
    if(b){curTipo=TIPOS[b.tipo]?b.tipo:'outros';
      bF.desc.value=b.desc||'';bF.material.value=[...bF.material.options].some(o=>o.value===b.material)?b.material:'Outro';
      bF.grams.value=b.grams||1000;bF.qtd.value=b.qtd||1;bF.preco.value=b.precoUnit;
      bF.data.value=b.data||today();bF.forn.value=b.forn||'';bF.obs.value=b.obs||'';}
    else{bF.desc.value='';bF.grams.value=1000;bF.qtd.value=1;bF.preco.value='';
      bF.data.value=today();bF.forn.value='';bF.obs.value='';}
    tipoUI();fillPrinterSel();
    bF.printer.value=(b&&b.printerId&&num(b.printerId))?b.printerId:'';
    preview();bFormMode();
  }
  function fillPrinterSel(){
    bF.printer.innerHTML='';
    const o0=document.createElement('option');o0.value='o';o0.textContent='— nenhuma / geral —';bF.printer.append(o0);
    INV.printers.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.nome;bF.printer.append(o);});
  }
  $('#bCancel').onclick=()=>{editB=null;bFill(null);};

  $('#bAdd').onclick=()=>{
    const desc=bF.desc.value.trim();
    const u=parseFloat(bF.preco.value);
    if(!desc){say('#bMsg','Escreva o que você comprou (ex.: PLA Silk dourado 1kg).',false);bF.desc.focus();return;}
    if(!isFinite(u)||u<=0){say('#bMsg','Informe o valor unitário — maior que zero.',false);bF.preco.focus();return;}
    const qtd=Math.max(1,Math.round(parseFloat(bF.qtd.value)||1));
    const fil=curTipo==='filamento';
    const rec={tipo:curTipo,desc,material:fil?bF.material.value:'',grams:fil?Math.max(1,parseFloat(bF.grams.value)||1000):0,
      qtd,precoUnit:u,total:u*qtd,data:bF.data.value||today(),forn:bF.forn.value.trim(),
      printerId:bF.printer.value==='o'?'':bF.printer.value,obs:bF.obs.value.trim()};
    if(editB){const old=INV.buys.find(x=>x.id===editB);if(old)Object.assign(old,rec);}
    else{rec.id=uid();INV.buys.push(rec);}
    editB=null;bFill(null);P.invStore();renderAll();
    say('#bMsg','Lançamento salvo ✓ — estoque e totais atualizados.',true);
  };

  function renderBuyChips(){
    const wrap=$('#buyChips');wrap.innerHTML='';
    const mk=(key,lbl)=>{
      const n=key==='todas'?INV.buys.length:INV.buys.filter(b=>b.tipo===key).length;
      const c=document.createElement('button');c.type='button';c.className='chip';
      c.textContent=lbl+(n?' ('+n+')':'');c.setAttribute('aria-pressed',String(filter===key));
      c.onclick=()=>{filter=key;renderAll();};wrap.append(c);};
    mk('todas','Todos');
    Object.keys(TIPOS).forEach(k=>mk(k,TIPOS[k].short));
  }

  function renderBuys(){
    const tb=$('#buyTable');tb.innerHTML='';
    const list=INV.buys.slice().filter(b=>filter==='todas'||b.tipo===filter)
      .sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
    if(!list.length){const tr=document.createElement('tr');const td=document.createElement('td');
      td.colSpan=9;td.style.color='var(--dim)';td.textContent='Nenhum lançamento aqui ainda — lance a primeira compra acima.';
      tr.append(td);tb.append(tr);}
    list.forEach(b=>{
      const i=INV.buys.indexOf(b);
      const tr=document.createElement('tr');
      const t0=document.createElement('td');t0.className='m';t0.textContent=fmtD(b.data);
      const t1=document.createElement('td');const b1=document.createElement('b');b1.textContent=b.desc;t1.append(b1);
      const extra=[];
      if(b.tipo==='filamento'&&b.material)extra.push(b.material+' · '+nf(b.grams)+'g');
      if(b.obs)extra.push(b.obs);
      if(extra.length){const sp=document.createElement('div');sp.className='m';sp.style.color='var(--dim)';sp.textContent=extra.join(' · ');t1.append(sp);}
      const t2=document.createElement('td');const pill=document.createElement('span');
      pill.className='pill';pill.style.setProperty('--pc',(TIPOS[b.tipo]||TIPOS.outros).color);
      pill.textContent=(TIPOS[b.tipo]||TIPOS.outros).short;t2.append(pill);
      const pr=b.printerId&&num(b.printerId);
      const t3=document.createElement('td');t3.className='m';t3.textContent=pr?pr.nome:'—';
      const t4=document.createElement('td');t4.className='m';t4.textContent=b.forn||'—';
      const t5=document.createElement('td');t5.className='m';t5.textContent=nf(b.qtd)+(b.tipo==='filamento'?' × '+nf(b.grams)+'g':'');
      const t6=document.createElement('td');t6.className='m';t6.textContent=brl(b.precoUnit);
      const t7=document.createElement('td');const b7=document.createElement('b');b7.textContent=brl(b.total);t7.append(b7);
      const t8=document.createElement('td');const act=document.createElement('div');act.className='rowacts';
      const ed=document.createElement('button');ed.type='button';ed.className='lotbtn';ed.textContent='editar';
      ed.onclick=e=>{e.stopPropagation();editB=b.id;bFill(b);location.hash='lancamentos';bF.desc.focus();};
      const del=document.createElement('button');del.type='button';del.className='x';del.textContent='×';
      del.setAttribute('aria-label','Excluir '+b.desc);
      del.onclick=e=>{e.stopPropagation();
        if(!confirm('Excluir o lançamento "'+b.desc+'" ('+brl(b.total)+')?'))return;
        INV.buys.splice(i,1);if(editB===b.id)bFill(null);P.invStore();renderAll();};
      act.append(ed,del);t8.append(act);
      tr.append(t0,t1,t2,t3,t4,t5,t6,t7,t8);tb.append(tr);
    });
    $('#bTotal').textContent=brl(list.reduce((a,b)=>a+(b.total||0),0));
    $('#bCount').textContent=list.length?'('+list.length+' lançamento'+(list.length>1?'s':'')+')':'';
  }

  /* ============================================================
     KPIs, GASTO MENSAL, CATEGORIAS, ESTOQUE
     ============================================================ */
  function renderKpis(){
    const pSum=INV.printers.reduce((a,p)=>a+(p.preco||0),0);
    const bSum=INV.buys.reduce((a,b)=>a+(b.total||0),0);
    $('#kpiTotal').textContent=brl(pSum+bSum);
    $('#kpiPrint').textContent=INV.printers.length?INV.printers.length+' · '+brl(pSum):'nenhuma';
    const fil=INV.buys.filter(b=>b.tipo==='filamento');
    const kg=fil.reduce((a,b)=>a+(b.qtd||0)*(b.grams||0)/1000,0);
    const fSum=fil.reduce((a,b)=>a+(b.total||0),0);
    $('#kpiFil').textContent=kg>0?nf(kg,1)+'kg · '+brl(fSum/kg)+'/kg':'—';
    $('#kpiManut').textContent=brl(INV.buys.filter(b=>b.tipo==='peca'||b.tipo==='apetrecho').reduce((a,b)=>a+(b.total||0),0));
  }

  function renderMonths(){
    const el=$('#mBars');el.innerHTML='';
    const now=new Date(),keys=[],labs=[];
    for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);
      keys.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));
      labs.push(d.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''));}
    const tot=Object.fromEntries(keys.map(k=>[k,0]));
    INV.printers.forEach(p=>{if(p.data&&tot[p.data.slice(0,7)]!==undefined)tot[p.data.slice(0,7)]+=p.preco||0;});
    INV.buys.forEach(b=>{const k=String(b.data||'').slice(0,7);if(tot[k]!==undefined)tot[k]+=b.total||0;});
    const max=Math.max(...keys.map(k=>tot[k]),1);
    keys.forEach((k,i)=>{
      const c=document.createElement('div');c.className='bcol';
      const bar=document.createElement('div');bar.className='bar';
      bar.style.height=Math.round(tot[k]/max*100)+'%';
      if(!tot[k])bar.style.opacity='.25';
      bar.title=labs[i]+' · '+brl(tot[k]);
      const lab=document.createElement('span');lab.textContent=labs[i];
      c.append(bar,lab);el.append(c);
    });
    const sum=keys.reduce((a,k)=>a+tot[k],0);
    const cur=tot[keys[11]];
    $('#mNote').textContent='Média de '+brl(sum/12)+' por mês nos últimos 12 meses · este mês: '+brl(cur)+'.';
  }

  function renderCats(){
    const bar=$('#catBar'),lg=$('#catLegend');bar.innerHTML='';lg.innerHTML='';
    const sums=Object.fromEntries(Object.keys(TIPOS).map(k=>[k,INV.buys.filter(b=>b.tipo===k).reduce((a,b)=>a+(b.total||0),0)]));
    const tot=Object.values(sums).reduce((a,x)=>a+x,0);
    if(!tot){const p=document.createElement('p');p.className='note';p.style.gridColumn='1/-1';
      p.textContent='Nenhum lançamento ainda — o gráfico aparece quando você registra a primeira compra.';lg.append(p);return;}
    Object.keys(TIPOS).forEach(k=>{if(!sums[k])return;
      const i=document.createElement('i');i.style.width=(sums[k]/tot*100)+'%';i.style.background=TIPOS[k].color;bar.append(i);});
    Object.keys(TIPOS).forEach(k=>{
      const d=document.createElement('div');
      d.innerHTML='<i style="background:'+TIPOS[k].color+'"></i>'+TIPOS[k].short+' <b>'+brl(sums[k])+'</b>';
      lg.append(d);});
  }

  function renderStock(){
    const tb=$('#stTable');tb.innerHTML='';
    const map=new Map();
    INV.buys.filter(b=>b.tipo==='filamento').forEach(b=>{
      const k=b.material||'Outro';
      const s=map.get(k)||{rolls:0,kg:0,gasto:0};
      s.rolls+=b.qtd||0;s.kg+=(b.qtd||0)*(b.grams||0)/1000;s.gasto+=b.total||0;map.set(k,s);});
    if(!map.size){const tr=document.createElement('tr');const td=document.createElement('td');
      td.colSpan=5;td.style.color='var(--dim)';td.textContent='Sem filamento lançado — registre compras com o tipo “Filamento” para montar o estoque.';
      tr.append(td);tb.append(tr);return;}
    [...map.entries()].sort((a,b)=>b[1].gasto-a[1].gasto).forEach(([mat,s])=>{
      const tr=document.createElement('tr');
      const t1=document.createElement('td');const b1=document.createElement('b');b1.textContent=mat;t1.append(b1);
      const t2=document.createElement('td');t2.className='m';t2.textContent=nf(s.rolls);
      const t3=document.createElement('td');t3.className='m';t3.textContent=nf(s.kg,2)+' kg';
      const t4=document.createElement('td');t4.className='m';t4.textContent=brl(s.gasto);
      const t5=document.createElement('td');const b5=document.createElement('b');b5.textContent=brl(s.kg>0?s.gasto/s.kg:0);t5.append(b5);
      tr.append(t1,t2,t3,t4,t5);
      if(MATERIALS.some(m=>m.n===mat)){
        tr.title='Levar a média R$/kg para a calculadora';
        tr.onclick=()=>{P.setMat(mat);};
      }else tr.style.cursor='default';
      tb.append(tr);
    });
  }

  /* ---------- tudo que depende do estado ---------- */
  function renderAll(){renderPrinters();renderBuyChips();renderBuys();renderKpis();renderMonths();renderCats();renderStock();}
  pFormFill(null);pFormMode();bFill(null);renderAll();
})();
