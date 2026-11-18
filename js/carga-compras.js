/* Carga única: compras do Mercado Livre + AliExpress (nov/2026) no Investimento.
   Idempotente — imprimir de novo não duplica (dedupe por nome de impressora e descrição). */
(function(){
  const P=window.P3D; const $=P.$; const {brl,nf,INV}=P;
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);

  const PRINTERS=[
    {key:'k',nome:'Anycubic Kobra S1 V2 Combo',marca:'Anycubic',tech:'FDM (filamento)',preco:5722.03,forn:'Mercado Livre',vida:4000,pot:350,gar:12,obs:'Combo Ace 2 Pro'},
    {key:'c1',nome:'Flashforge Creator 5 (un. 1)',marca:'Flashforge',tech:'FDM (filamento)',preco:7992,forn:'Mercado Livre',vida:4000,pot:400,gar:12,obs:'Bivolt 127/220V — cinza-escuro'},
    {key:'c2',nome:'Flashforge Creator 5 (un. 2)',marca:'Flashforge',tech:'FDM (filamento)',preco:7200,forn:'Mercado Livre',vida:4000,pot:400,gar:12,obs:'Segundo anúncio — cinza-escuro bivolt'}
  ];
  const T={f:'filamento',p:'peca',a:'apetrecho',o:'outros'};
  const LBL={f:'Filamento',p:'Peça de reposição',a:'Apetrecho',o:'Outros'};
  /* desc, tipo, fornecedor, impressora (key), qtd, valor unitário, obs */
  const BUYS=[
    ['Kit Alicate de Precisão 4.5 e 6 Pinças ESD Antiestáticas',T.a,'Mercado Livre','',1,36,''],
    ['Adesivo para Impressão 3D — Spray 150ml / 105g',T.o,'Mercado Livre','',1,41,''],
    ['Maçarico Profissional Culinário Portátil (gás, branco)',T.a,'Mercado Livre','',1,27.99,''],
    ['Kit 3 Cola Instantânea Almasuper Precisão 100g Incolor',T.o,'Mercado Livre','',1,53.61,''],
    ['Escareador / Rebarbador Tipo Caneta c/ 10 Lâminas',T.a,'Mercado Livre','',1,28.14,''],
    ['Kit Manutenção Impressora 3D — Spray Adesivo + Óleo + Graxa (3D Fix)',T.p,'Mercado Livre','',1,68,'manutenção geral da frota'],
    ['Estilete Bisturi de Precisão Aço c/ 5 Lâminas (Dor Block)',T.a,'Mercado Livre','',1,19,''],
    ['Sílica Gel Azul Anti Umidade / Mofo — Premium',T.o,'Mercado Livre','',1,55.99,'controle de umidade do filamento'],
    ['Impressora Térmica Bluetooth p/ Etiquetas Adesivas (preta)',T.o,'Mercado Livre','',1,679.80,'embalagem / envio'],
    ['Etiquetas Térmicas sem Rolo 10x15 — resma c/ 1.000 un.',T.o,'Mercado Livre','',1,68.90,'insumo de embalagem'],
    ['Pincel de Pintura Profissional',T.a,'Mercado Livre','',1,26.66,''],
    ['Pacote c/ 5 Marcadores Recarregáveis Graffiti',T.o,'Mercado Livre','',1,129.03,''],
    ['Spray Verniz Incolor Tekbond 350ml (brilhante / fosco)',T.o,'Mercado Livre','',1,28.25,'acabamento'],
    ['Kit Fechamento Acrílico p/ Flashforge Creator 5',T.p,'Mercado Livre','c1',1,267.05,'enclausuramento da Creator 5'],
    ['Bocal Soquete Branco Base E14 Fixo de Teto MT2023',T.o,'Mercado Livre','',1,11.87,'iluminação do espaço'],
    ['Antimofo Elétrico Byemofo (branco, 127V)',T.o,'Mercado Livre','',1,54.90,''],
    ['Kit 2 Lâmpadas E14 p/ Geladeira / Forno / Micro-ondas 15W 127V',T.o,'Mercado Livre','',1,19.90,''],
    ['Fonte Carregador p/ Avell Titanium G1555 MX7',T.o,'Mercado Livre','',1,259.90,'notebook'],
    ['Placa de Construção (Plate) Kobra S1 Combo',T.p,'Mercado Livre','k',1,86.40,'mesa de impressão reserva'],
    ['Kit Hotend Anycubic Kobra S1 / S1 Combo — Bico 0.4mm 24V',T.p,'Mercado Livre','k',1,108.15,''],
    ['Micro Retífica Profissional Jeroclean PRO-RP2076 sem Fio',T.a,'Mercado Livre','',1,81.39,'pós-processamento'],
    ['Kit 50 Etiquetas Tag NFC 13,56MHz Regravável',T.o,'Mercado Livre','',1,39.90,'rastreio / produtos'],
    ['Hotend Anycubic Kobra S1 / S1 Combo 0.4mm — Aço Endurecido 24V',T.p,'Mercado Livre','k',1,78.97,''],
    ['Adesivo Spray Fixador 3D Nano + Refil 200ml (+ brinde)',T.o,'Mercado Livre','',1,116,'adesivo de fixação reserva'],
    ['Caixa Secadora Dupla p/ Filamento c/ Controle de Umidade 127V',T.a,'Mercado Livre','',1,699,'secagem/armazenamento de filamento'],
    ['Kit 20 Sacos Herméticos + Bomba Manual de Vedação a Vácuo',T.o,'Mercado Livre','',1,185,'conservação do filamento'],
    ['Kit Parafusos e Porcas Allen Sextavados 1.260 pçs',T.o,'Mercado Livre','',1,52.68,'hardware geral / manutenção'],
    ['Silver Metal Blank Keyring / Keychain Split (50 pçs)',T.o,'AliExpress','',2,16.06,'2x 50 peças — insumo chaveiro'],
    ['Nozzle Washer Tool — Stainless Steel',T.a,'AliExpress','',1,6.87,'limpeza de bico'],
    ['Cleaning Brush Set — Multifunctional Detail Nylon Brushes',T.a,'AliExpress','',1,15.90,'limpeza de mesa / peça'],
    ['Escova de Aço Branca',T.a,'AliExpress','',1,12.99,''],
    ['Kit 50 Chaveiros p/ Keychain Clip',T.o,'AliExpress','',2,30.39,'x2 kits — insumo chaveiro'],
    ['LED Candle Battery',T.o,'AliExpress','',1,21.23,''],
    ['Thermometer & Hygrometer -50°C a +70°C',T.a,'AliExpress','',1,10.90,'umidade do filamento'],
    ['4x Hotend Flashforge Creator 5 Pro — 0.4mm',T.p,'AliExpress','c1',1,189.05,'pacote c/ 4 hotends'],
    ['Hotend Ceramic Nozzle Anycubic Kobra S1 Combo',T.p,'AliExpress','k',1,147.59,''],
    ['Thermometer °F / °C Digital LCD Monitor',T.a,'AliExpress','',1,20.47,''],
    ['Filamento PETG — 20kg (rolos de 1kg)',T.f,'','',20,65.90,'20 rolos de 1kg','PETG'],
    ['Filamento PLA — 6kg (rolos de 1kg)',T.f,'','',6,89.90,'6 rolos de 1kg','PLA']
  ];

  /* ---- KPIs + tabela de prévia ---- */
  const sumP=PRINTERS.reduce((a,p)=>a+p.preco,0);
  const sumB=BUYS.reduce((a,b)=>a+b[4]*b[5],0);
  $('#cTotal').textContent=brl(sumP+sumB);
  $('#cPeca').textContent=brl(BUYS.filter(b=>b[1]===T.p).reduce((a,b)=>a+b[4]*b[5],0));
  $('#cApe').textContent=brl(BUYS.filter(b=>b[1]===T.a).reduce((a,b)=>a+b[4]*b[5],0));
  const tb=$('#cTable');
  PRINTERS.forEach(p=>{
    const tr=document.createElement('tr');
    const t1=document.createElement('td');const b1=document.createElement('b');b1.textContent='🖨 '+p.nome;t1.append(b1);
    const t2=document.createElement('td');t2.className='m';t2.textContent='Impressora';
    const t3=document.createElement('td');t3.className='m';t3.textContent=p.forn;
    const t4=document.createElement('td');t4.className='m';t4.textContent='—';
    const t5=document.createElement('td');t5.className='m';t5.textContent='1';
    const t6=document.createElement('td');const b6=document.createElement('b');b6.textContent=brl(p.preco);t6.append(b6);
    tr.append(t1,t2,t3,t4,t5,t6);tb.append(tr);
  });
  BUYS.forEach(b=>{
    const tr=document.createElement('tr');
    const t1=document.createElement('td');t1.textContent=b[0];
    const t2=document.createElement('td');t2.className='m';t2.textContent=LBL[b[1]];
    const t3=document.createElement('td');t3.className='m';t3.textContent=b[2];
    const t4=document.createElement('td');t4.className='m';t4.textContent=b[3]?PRINTERS.find(p=>p.key===b[3]).nome:'—';
    const t5=document.createElement('td');t5.className='m';t5.textContent=nf(b[4]);
    const t6=document.createElement('td');const b6=document.createElement('b');b6.textContent=brl(b[4]*b[5]);t6.append(b6);
    tr.append(t1,t2,t3,t4,t5,t6);tb.append(tr);
  });

  /* ---- carregar no estado do navegador (idempotente) ---- */
  $('#loadBtn').onclick=e=>{
    const byName=n=>INV.printers.find(p=>p.nome.toLowerCase()===n.toLowerCase());
    const pids={};let nP=0,nB=0;
    PRINTERS.forEach(pr=>{
      let ex=byName(pr.nome);
      if(!ex){ex=Object.assign({id:uid()},pr,{});delete ex.key;INV.printers.push(ex);nP++;}
      pids[pr.key]=ex.id;
    });
    BUYS.forEach(b=>{
      const dup=INV.buys.some(x=>(x.desc||'').toLowerCase()===b[0].toLowerCase());if(dup)return;
      INV.buys.push({id:uid(),tipo:b[1],desc:b[0],material:b[7]||'',grams:b[1]===T.f?1000:0,qtd:b[4],precoUnit:b[5],
        total:b[4]*b[5],data:'',forn:b[2],printerId:b[3]?pids[b[3]]:'',obs:b[6]});nB++;
    });
    P.invStore();
    e.target.textContent='Carregado ✓';
    $('#loadMsg').hidden=false;
    $('#loadMsg').textContent=nP||nB
      ?('Adicionado: '+nP+' impressora'+(nP===1?'':'s')+' e '+nB+' lançamento'+(nB===1?'':'s')+'. Total da carga: '+brl(sumP+sumB)+'.')
      :('Já estava tudo carregado — nada duplicado. Total da carga: '+brl(sumP+sumB)+'.');
    $('#loadMsg').style.color='var(--teal)';
    $('#goBtn').hidden=false;
  };
})();
