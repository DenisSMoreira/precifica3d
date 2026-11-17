/* ============================================================
   Precifica3D — núcleo compartilhado por todas as páginas.
   Estado (configurações, lote travado, materiais, orçamentos)
   é persistido no localStorage e lido por cada página.
   ============================================================ */
(function(){
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const brl=n=>(isFinite(n)?n:0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const nf=(n,d=0)=>(isFinite(n)?n:0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hhmm=h=>{if(!(h>0))return '0h00';const H=Math.floor(h+1e-9);let M=Math.round((h-H)*60);if(M===60){return (H+1)+'h';}return H+'h'+(M?' '+nf(M)+'min':'');};
  const round90=p=>p<1.9?p:Math.round(p-0.9)+0.9;

  const MATERIALS=[
    {n:'PLA',kg:59.9,bico:210,mesa:60,u:'Chaveiros, maquetes, brindes'},
    {n:'PLA Seda',kg:74.9,bico:215,mesa:60,u:'Vasos e decoração'},
    {n:'PLA Fosco',kg:72,bico:205,mesa:60,u:'Protótipos, letras'},
    {n:'PETG',kg:64.9,bico:235,mesa:80,u:'Peças externas, potes'},
    {n:'PETG Fibra',kg:149,bico:255,mesa:85,u:'Peças estruturais'},
    {n:'ABS',kg:69.9,bico:245,mesa:100,u:'Engrenagens, calor'},
    {n:'ASA',kg:89.9,bico:255,mesa:100,u:'Área externa, UV'},
    {n:'TPU 95A',kg:119,bico:225,mesa:40,u:'Capas, amortecedores'},
    {n:'Nylon',kg:139,bico:260,mesa:80,u:'Desgaste, buchas'},
    {n:'Resina 405nm',kg:129,bico:0,mesa:0,u:'Miniaturas, joias'}
  ];
  const MAT_DEF=MATERIALS.map(m=>({...m})); // defaults p/ reset e contagem de edições
  const PRESETS={
    chaveiro:{nome:'Chaveiro personalizado',peso:12,horas:0.5,mins:10,mat:'PLA',prepMin:8,posMin:5,emb:2,falha:10,margem:260,potencia:130},
    vaso:{nome:'Vaso espiral 15cm',peso:128,horas:7,mins:20,mat:'PLA Seda',prepMin:15,posMin:12,emb:4,falha:14,margem:140},
    engren:{nome:'Engrenagem PETG M2',peso:46,horas:1,mins:45,mat:'PETG',prepMin:25,posMin:10,emb:3,falha:18,margem:200,potencia:170},
    drone:{nome:'Frame de drone 5"',peso:88,horas:5,mins:10,mat:'PETG Fibra',prepMin:40,posMin:20,emb:6,falha:20,margem:180,potencia:180,maquina:4200},
    placa:{nome:'Placa de nome',peso:34,horas:1,mins:25,mat:'PLA Fosco',prepMin:18,posMin:8,emb:3.5,falha:12,margem:220},
    mini:{nome:'Miniatura resina 32mm',peso:26,horas:2,mins:40,mat:'Resina 405nm',prepMin:30,posMin:35,emb:5,falha:22,margem:240,maquina:2900,manut:2.5,potencia:90}
  };
  const DEF={nome:'Vaso espiral 15cm',peso:128,horas:7,mins:20,mat:'PLA Seda',precoKg:74.9,rolo:1000,desperdicio:12,falha:12,
    maquina:2400,vida:4000,potencia:145,tarifa:0.98,manut:1.2,prepMin:15,posMin:12,horaTrab:40,emb:3.5,extra:0,fixos:480,pecasMes:90,
    margem:140,imposto:6,taxa:14,meta:4000,ratear:true,arredonda:true,mostrarMin:false};
  const LOTES=[1,5,20,100];

  /* ---- estado persistido entre páginas ---- */
  const S=Object.assign({},DEF);
  try{const st=JSON.parse(localStorage.getItem('p3d_settings')||'{}');
    if(st&&typeof st==='object'&&!Array.isArray(st))Object.keys(DEF).forEach(k=>{const v=st[k];
      if(typeof DEF[k]==='boolean'&&typeof v==='boolean')S[k]=v;
      else if(typeof DEF[k]==='number'&&typeof v==='number'&&isFinite(v))S[k]=v;
      else if(typeof DEF[k]==='string'&&typeof v==='string')S[k]=v;});
  }catch(e){}
  let lotSel=0; // 0 = nenhum lote travado; 1/5/20/100 = lote travado
  try{const l=parseInt(localStorage.getItem('p3d_lote'),10);if(LOTES.includes(l))lotSel=l;}catch(e){}
  try{const saved=JSON.parse(localStorage.getItem('p3d_mats')||'[]');if(Array.isArray(saved))saved.forEach(s=>{const m=MATERIALS.find(x=>x.n===s.n);if(m&&isFinite(s.kg)&&s.kg>0)m.kg=s.kg;});}catch(e){}
  let quotes=[];try{const q=JSON.parse(localStorage.getItem('p3d_quotes')||'[]');if(Array.isArray(q))quotes=q;}catch(e){}

  /* ---- investimentos: impressoras cadastradas + lançamentos de compra ---- */
  const INV={printers:[],buys:[]}; // buys: {tipo:'filamento'|'apetrecho'|'peca'|'outros'}
  try{const iv=JSON.parse(localStorage.getItem('p3d_inv')||'{}');
    if(iv&&typeof iv==='object'){
      if(Array.isArray(iv.printers))iv.printers.forEach(p=>{if(p&&typeof p.nome==='string')INV.printers.push(p);});
      if(Array.isArray(iv.buys))iv.buys.forEach(b=>{if(b&&typeof b.desc==='string')INV.buys.push(b);});
    }}catch(e){}

  /* ---- pedidos: fluxo orçamento → pagamento → entrega ---- */
  const orders=[]; // {status:'aguarda'|'pago'|'entregue'|'cancelado'}
  try{const o=JSON.parse(localStorage.getItem('p3d_orders')||'[]');
    if(Array.isArray(o))o.forEach(x=>{if(x&&typeof x.id==='string'&&typeof x.cliente==='string')orders.push(x);});}catch(e){}

  const savedAt=()=>{try{localStorage.setItem('p3d_savedAt',new Date().toISOString());}catch(e){}};
  const saveSettings=()=>{try{localStorage.setItem('p3d_settings',JSON.stringify(S));localStorage.setItem('p3d_lote',String(lotSel));savedAt();}catch(e){}};
  const store=()=>{try{localStorage.setItem('p3d_mats',JSON.stringify(MATERIALS.map(m=>({n:m.n,kg:m.kg}))));localStorage.setItem('p3d_quotes',JSON.stringify(quotes));savedAt();}catch(e){}};
  const invStore=()=>{try{localStorage.setItem('p3d_inv',JSON.stringify(INV));savedAt();}catch(e){}};
  const ordersStore=()=>{try{localStorage.setItem('p3d_orders',JSON.stringify(orders));savedAt();}catch(e){}};

  /* ---- modelo de custo/preço (fonte única: peça unitária e lotes) ---- */
  function model(lot){
    const h=S.horas+S.mins/60;
    const pesoBruto=S.peso*(1+S.desperdicio/100);
    const material=pesoBruto/S.rolo*S.precoKg;
    const energia=S.potencia/1000*h*S.tarifa;
    const depHora=S.vida>0?S.maquina/S.vida:0;
    const dep=depHora*h,man=S.manut*h;
    const maq=dep+man;
    const mo=(S.prepMin/lot+S.posMin)/60*S.horaTrab;
    const extras=S.emb/lot+S.extra;
    const fixoSolo=S.ratear?S.fixos/Math.max(1,Math.max(lot,S.pecasMes)):0;
    const varr=material+energia+maq+mo+extras;
    const risco=S.falha<95?varr/(1-S.falha/100)-varr:varr*9;
    const custo=varr+risco+fixoSolo;
    const den=Math.max(0.02,1-(S.imposto+S.taxa)/100);
    const min=custo/den,max=custo*3.2/den;
    const bruto=custo*(1+S.margem/100)/den;
    const preco=S.arredonda?Math.max(round90(bruto),min):bruto;
    const impV=preco*S.imposto/100,taxV=preco*S.taxa/100;
    const lucro=preco-custo-impV-taxV;
    return{lot,h,pesoBruto,material,energia,maq,mo,extras,fixoSolo,varr,risco,custo,preco,impV,taxV,lucro,min,max};
  }

  /* ---- bindings de inputs presentes na página atual ---- */
  function sync(k){const v=S[k];$$('[data-k="'+k+'"]').forEach(i=>{if(i.type==='range'){i.value=v;i.style.setProperty('--p',((v-parseFloat(i.min))/(parseFloat(i.max)-parseFloat(i.min))*100)+'%');}
    else if(document.activeElement!==i)i.value=typeof v==='number'?+v.toFixed(4):v;});}
  function syncAll(){Object.keys(DEF).forEach(sync);}
  function paintRanges(){$$('input[type=range][data-k]').forEach(i=>i.style.setProperty('--p',((parseFloat(i.value)-parseFloat(i.min))/(parseFloat(i.max)-parseFloat(i.min))*100)+'%'));}
  function bindFields(onInput){
    $$('[data-k]').forEach(i=>{
      i.addEventListener('input',()=>{
        const k=i.dataset.k;
        if(i.type==='text')S[k]=i.value;
        else{const v=parseFloat(i.value);if(!isFinite(v))return;S[k]=Math.max(parseFloat(i.min??-1e9),Math.min(parseFloat(i.max??1e9),v));}
        sync(k);saveSettings();if(onInput)onInput(k);
      });
    });
    paintRanges();
    $$('[data-ka]').forEach(i=>{i.checked=S[i.dataset.ka];i.onchange=()=>{S[i.dataset.ka]=i.checked;saveSettings();if(onInput)onInput(i.dataset.ka);};});
  }

  /* ---- material ativo (compartilhado: chips na calculadora, linhas na tabela) ---- */
  function setMat(n){const m=MATERIALS.find(x=>x.n===n);if(!m)return;S.mat=n;S.precoKg=m.kg;sync('precoKg');saveSettings();
    document.dispatchEvent(new CustomEvent('p3d:mat',{detail:n}));}

  /* ---- lote travado como base do orçamento ---- */
  function setLot(q){lotSel=LOTES.includes(q)?q:0;saveSettings();return lotSel;}

  /* ---- salvar peça atual na lista de orçamentos ---- */
  function addQuote(){const r=model(lotSel||1);
    quotes.push({nome:S.nome||'Peça sem nome',mat:S.mat,peso:S.peso,tempo:hhmm(r.h),custo:r.custo,preco:r.preco,lucro:r.lucro,lote:lotSel||1});
    store();return r;}

  /* ---- preço da peça no chip do topo (todas as páginas) ---- */
  function drawChip(){const el=$('#chipPrice');if(el)el.textContent=brl(model(1).preco);}

  /* ---- animações de entrada ---- */
  function reveals(){
    if('IntersectionObserver' in window){
      const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12});
      $$('section').forEach(sec=>{$$('.rv',sec).forEach((r,j)=>r.style.setProperty('--dl',(j*90)+'ms'));io.observe(sec);});
    }else $$('section').forEach(s=>s.classList.add('in'));
  }

  /* ---- backup exportável: um JSON versionado com tudo + restauração + reset ---- */
  function exportData(){ // snapshot profundo: o backup nunca referencia o estado vivo
    return {app:'precifica3d',version:3,exportedAt:new Date().toISOString(),
      settings:JSON.parse(JSON.stringify(S)),lote:lotSel,
      materials:MATERIALS.map(m=>({...m})),
      quotes:quotes.map(q=>({...q})),
      inv:{printers:INV.printers.map(p=>({...p})),buys:INV.buys.map(b=>({...b}))},
      orders:orders.map(o=>({...o}))};
  }
  function importData(obj){
    if(!obj||typeof obj!=='object'||Array.isArray(obj)||obj.app!=='precifica3d')throw new Error('O arquivo não é um backup do Precifica3D.');
    const ver=+obj.version;
    if(ver!==3&&ver!==2&&ver!==1)throw new Error('Versão de backup não suportada ('+esc(obj.version)+').'); // v1 pré-Investimento · v2 pré-Pedidos
    try{localStorage.setItem('p3d_prev',JSON.stringify(exportData()));}catch(e){} // segurança: estado atual nunca é perdido
    const st=obj.settings; // sanitização igual à da carga inicial
    if(st&&typeof st==='object'&&!Array.isArray(st))Object.keys(DEF).forEach(k=>{const v=st[k];
      if(typeof DEF[k]==='boolean'&&typeof v==='boolean')S[k]=v;
      else if(typeof DEF[k]==='number'&&typeof v==='number'&&isFinite(v))S[k]=v;
      else if(typeof DEF[k]==='string'&&typeof v==='string')S[k]=v;});
    const l=parseInt(obj.lote,10);lotSel=LOTES.includes(l)?l:0;
    let nMats=0;
    if(Array.isArray(obj.materials))obj.materials.forEach(s=>{if(!s||typeof s.n!=='string')return;const m=MATERIALS.find(x=>x.n===s.n);
      if(m){if(isFinite(s.kg)&&s.kg>0)m.kg=s.kg;if(isFinite(s.bico))m.bico=s.bico;if(isFinite(s.mesa))m.mesa=s.mesa;if(typeof s.u==='string')m.u=s.u;nMats++;}});
    let nQ=0;quotes.length=0; // substitui tudo: a lista nova vem do arquivo
    if(Array.isArray(obj.quotes))obj.quotes.forEach(q=>{if(q&&typeof q.nome==='string'&&isFinite(q.preco)&&isFinite(q.custo)){quotes.push(q);nQ++;}}); // mutado in-place: referências vivas
    let nP=0,nB=0;INV.printers.length=0;INV.buys.length=0;
    const iv=obj.inv&&typeof obj.inv==='object'?obj.inv:{};
    if(Array.isArray(iv.printers))iv.printers.forEach(p=>{if(p&&typeof p.nome==='string'&&isFinite(p.preco)&&p.preco>=0){INV.printers.push(p);nP++;}});
    if(Array.isArray(iv.buys))iv.buys.forEach(b=>{if(b&&typeof b.desc==='string'&&isFinite(b.total)&&isFinite(b.qtd)){INV.buys.push(b);nB++;}});
    let nO=0;orders.length=0;
    if(Array.isArray(obj.orders))obj.orders.forEach(o=>{if(o&&typeof o.id==='string'&&typeof o.cliente==='string'&&isFinite(o.total)){orders.push(o);nO++;}});
    const m=MATERIALS.find(x=>x.n===S.mat);if(m)S.precoKg=m.kg;
    saveSettings();store();invStore();ordersStore();
    return {mats:nMats,quotes:nQ,printers:nP,buys:nB,orders:nO,lote:lotSel};
  }
  function clearAll(){quotes.length=0;Object.keys(DEF).forEach(k=>{S[k]=DEF[k];});MATERIALS.forEach((m,i)=>Object.assign(m,MAT_DEF[i]));lotSel=0;INV.printers.length=0;INV.buys.length=0;orders.length=0;
    try{['p3d_settings','p3d_lote','p3d_mats','p3d_quotes','p3d_inv','p3d_orders','p3d_prev','p3d_savedAt'].forEach(k=>localStorage.removeItem(k));}catch(e){}}

  window.P3D={$,$$,brl,nf,esc,hhmm,round90,MATERIALS,MAT_DEF,PRESETS,DEF,LOTES,S,quotes,INV,orders,
    store,invStore,ordersStore,saveSettings,model,sync,syncAll,paintRanges,bindFields,setMat,getLot:()=>lotSel,setLot,addQuote,drawChip,reveals,
    exportData,importData,clearAll};

  drawChip();
  reveals();
})();
