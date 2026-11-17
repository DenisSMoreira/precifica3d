/* Página Calculadora (index): blocos de entrada + display ao vivo. */
(function(){
  const P=window.P3D; const {$,$$,brl,nf,esc,hhmm,MATERIALS,PRESETS,DEF,S,model}=P;

  /* ---- chips de material ---- */
  const chips=$('#chips');
  MATERIALS.forEach(m=>{const b=document.createElement('button');b.className='chip';b.type='button';b.textContent=m.n;chips.append(b);});
  function paintChips(){$$('.chip',chips).forEach(c=>c.setAttribute('aria-pressed',String(c.textContent===S.mat)));}
  chips.onclick=e=>{if(e.target.classList.contains('chip'))P.setMat(e.target.textContent);};
  document.addEventListener('p3d:mat',()=>{paintChips();calc();});
  paintChips();

  /* ---- inputs (binding compartilhado do núcleo) ---- */
  P.bindFields(k=>{
    if(k==='precoKg'){const m=MATERIALS.find(x=>x.n===S.mat);if(m){m.kg=S.precoKg;P.store();drawMarq();}}
    if((k==='taxa'||k==='taxaFixa')&&S.canal!=='direto'){S.canal='direto';P.sync('canal');P.saveSettings();} // mexeu à mão → sai do preset do canal
    calc();
  });
  P.syncAll(); // valores persistidos mandam nos campos, não o valor inicial do HTML

  /* ---- combo "Como vai vender?" — preenche taxa % e taxa fixa com os valores do canal.
     Na Shopee a faixa depende do preço, então recalcula até estabilizar. ---- */
  $('#i-canal').addEventListener('change',()=>{S.canal=$('#i-canal').value;
    if(S.canal==='direto'){S.taxa=0;S.taxaFixa=0;P.sync('taxa');P.sync('taxaFixa');} // venda direta: zero intermediação
    P.saveSettings();calc();});
  function applyCanal(){
    if(S.canal==='direto')return;
    for(let i=0;i<3;i++){
      const f=P.canalFees(S.canal,model(1).preco);if(!f)return;
      if(S.taxa===f.pct&&S.taxaFixa===f.fix)return;
      S.taxa=f.pct;S.taxaFixa=f.fix;P.sync('taxa');P.sync('taxaFixa');P.saveSettings();
    }
  }

  /* ---- combo "Como medir o lucro?" — ao trocar o modo o valor se converte sozinho
     (markup 140% sobre o custo ≡ margem 58% sobre o preço; margem 40% ≡ markup 67%) ---- */
  $('#i-margemModo').addEventListener('change',()=>{
    const novo=$('#i-margemModo').value;
    if(novo!==S.margemModo){
      const m=+S.margem||0;
      S.margem=novo==='margem'?Math.round(m/(1+m/100)):Math.round(100*Math.min(m,90)/(100-Math.min(m,90)));
      S.margemModo=novo;P.saveSettings();P.sync('margem');
    }
    calc();
  });

  /* ---- ticker de materiais ---- */
  function drawMarq(){
    const segs=MATERIALS.map(m=>'<span><em>'+esc(m.n)+'</em> '+m.bico+'° · R$ '+nf(m.kg,2)+'/kg · '+esc(m.u)+'</span>');
    const el=$('#marq');if(el)el.innerHTML=segs.join('').repeat(2);
  }
  drawMarq();

  /* ---- display ---- */
  let last=null,srT;
  function calc(){
    applyCanal();
    const m=model(1);last=m;
    const {preco,custo,lucro}=m;
    const mliq=preco>0?lucro/preco*100:0;
    const payback=lucro>0?S.maquina/lucro:Infinity;

    const p=$('#price');p.classList.add('bump');clearTimeout(p._t);p._t=setTimeout(()=>p.classList.remove('bump'),180);
    $('#priceVal').textContent=preco.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
    $('#chipPrice').textContent=brl(preco);
    $('#pMin').textContent=brl(m.min);$('#pMax').textContent=brl(m.max);
    $('#lucro').textContent=brl(lucro);$('#mliq').textContent=nf(mliq,1)+'%';
    $('#custo').textContent=brl(custo);
    $('#perGram').textContent=brl(S.peso?preco/S.peso:0);
    $('#perHora').textContent=brl(m.h?lucro/m.h:0);
    $('#payback').textContent=isFinite(payback)?nf(payback,0)+' un.':'—';
    const ring=$('#ring'),C=2*Math.PI*40;
    ring.style.strokeDashoffset=C*(1-Math.min(1,Math.max(0,mliq/80)));
    ring.style.stroke=mliq<20?'#C1481F':mliq<35?'#F0A93B':'#17A398';
    $('#lucro').parentElement.parentElement.style.color=mliq<0?'var(--hot)':'';
    $('#tickerTime').textContent=hhmm(m.h);
    const mat=MATERIALS.find(x=>x.n===S.mat)||{bico:0,mesa:0};
    $('#tickerTxt').innerHTML='MATERIAL <b>'+esc(S.mat)+'</b><span class="sep"> | </span>BICO <b>'+(mat.bico||'—')+'°</b><span class="sep"> | </span>MESA <b>'+(mat.mesa||'—')+'°</b><span class="sep"> | </span>FILAMENTO <b>1.75mm</b><span class="sep"> | </span>CAMADA <b>0.20mm</b>';
    $('#matNote').textContent='Custo de material: '+brl(m.material)+' · '+nf(m.pesoBruto,1)+'g usados (inclui desperdício) · rendimento ≈ '+nf(S.rolo/(m.pesoBruto||1),1)+' peças por rolo.';
    $('#machineNote').textContent='Custo de máquina: '+brl(m.maq/(m.h||1))+'/h ('+brl(m.maq)+' nesta peça de '+hhmm(m.h)+').';

    const parts=[['Filamento',m.material,'var(--amber)'],['Energia',m.energia,'var(--hot)'],['Máquina',m.maq,'var(--rust)'],
      ['Mão de obra',m.mo,'var(--teal)'],['Embalagem/extras',m.extras,'var(--olive)'],['Custos fixos',m.fixoSolo,'var(--slate)'],
      ['Risco/falha',m.risco,'var(--plum)'],['Imposto',m.impV,'#5d4a3a'],['Taxa plataforma',m.taxV,'#3f5f6e'],['Taxa fixa do item',m.fx,'#46586a']];
    const tot=parts.reduce((a,pt)=>a+pt[1],0)||1;
    $('#stack').innerHTML=parts.map(pt=>'<i style="width:'+(pt[1]/tot*100)+'%;background:'+pt[2]+'" title="'+pt[0]+'"></i>').join('');
    $('#legend').innerHTML=parts.filter(pt=>pt[1]>0.0001).map(pt=>'<span><i style="background:'+pt[2]+'"></i>'+pt[0]+' <b>'+brl(pt[1])+'</b></span>').join('');

    const w=$('#warner');
    if(S.mostrarMin&&preco<m.min*1.0001){w.hidden=false;w.style.borderColor='#FF5C1A';w.innerHTML='<b>Atenção:</b> o preço está no limite do custo. Margem líquida de '+nf(mliq,1)+'% não sustenta máquina parada nem erro de impressão.';}
    else if(S.falha>30){w.hidden=false;w.innerHTML='<b>Taxa de falha alta ('+nf(S.falha,0)+'%):</b> reduzir insucesso costuma render mais do que subir preço.';}
    else if(m.h>0&&(lucro/m.h)<5){w.hidden=false;w.innerHTML='<b>Rendimento baixo:</b> '+brl(lucro/m.h)+' por hora de máquina. Considere fatiar em múltiplas peças por mesa ou aumentar a margem.';}
    else w.hidden=true;

    const mn=$('#margemNote');
    $$('[data-k="margem"]').forEach(i=>{if(i.type==='range'){const mx=S.margemModo==='margem'?90:400;if(+i.max!==mx){i.max=mx;P.paintRanges();}}});
    if(S.margemModo==='margem'){const mg=Math.min(Math.max(0,S.margem),90);
      mn.textContent='Margem de '+nf(mg)+'% SOBRE O PREÇO: preço = (custo + taxas fixas) ÷ (1 − taxas − margem) — sobram R$ '+nf(mg)+' a cada R$ 100 vendidos, o jeito das calculadoras simples (Negócio Impresso e afins). Em markup sobre o custo isso equivale a '+nf(Math.round(100*mg/(100-mg)))+'%.';}
    else {const mk=Math.max(0,S.margem);
      mn.textContent='Markup de '+nf(mk)+'% SOBRE O CUSTO: preço = custo × '+nf(1+mk/100,2)+' antes de imposto e taxas de plataforma. Isso equivale a '+nf(mk/(1+mk/100),1)+'% de margem sobre o preço de venda.';}

    const cn=$('#canalNote');
    if(S.canal==='shopee'){const f=P.canalFees('shopee',preco);
      cn.textContent='Shopee — faixa deste preço ('+brl(preco)+'): comissão '+nf(f.pct)+'% + R$ '+nf(f.fix,2)+' por item. A tabela muda a cada faixa de preço (20%+R$4,50 até R$79,99 · 14%+R$16/20/26 acima) e a taxa fixa devora item barato. Valores públicos de out/2026 — se seu anúncio é diferente, ajuste os campos.';}
    else if(S.canal==='ml'){
      cn.textContent='Mercado Livre Clássico: ~12% de comissão (a faixa oficial é 10–14% por categoria; artes/papelaria ≈ 11,5%). O Premium soma uns 5 pontos (paga o 12x sem juros) e o custo dos Envios corre à parte — ajuste se necessário.';}
    else cn.textContent='Venda direta no Pix: nenhuma comissão — só o seu imposto. Vendendo por marketplace, escolha o canal acima para puxar as taxas reais de intermediação.';

    clearTimeout(srT);srT=setTimeout(()=>{$('#srOut').textContent='Preço sugerido '+brl(preco)+', custo '+brl(custo)+', lucro '+brl(lucro)+'.';},500);
  }
  function flashPanel(){const p=$('#calcPanel');p.classList.remove('flash');void p.offsetWidth;p.classList.add('flash');}

  /* ---- salvar / copiar ---- */
  const aq=$('#addQuote');
  aq.onclick=()=>{P.addQuote();aq.textContent='Salvo ✓ — veja em Orçamentos';setTimeout(()=>{aq.textContent='+ Salvar orçamento';},1800);};
  $('#copyQuote').onclick=async e=>{if(!last)return;const r=model(P.getLot()||1);
    const t=S.nome+' ('+S.mat+', '+nf(S.peso)+'g, '+hhmm(r.h)+(P.getLot()>1?' · lote de '+nf(P.getLot())+' un.':'')+') — custo '+brl(r.custo)+' · venda '+brl(r.preco)+' · lucro '+brl(r.lucro);
    try{await navigator.clipboard.writeText(t);e.target.textContent='Copiado ✓';setTimeout(()=>e.target.textContent='Copiar resumo',1600);}catch(_){alert(t);}};

  /* ---- presets: reset total antes de aplicar, sem vazar estado ---- */
  $$('#presets .pre').forEach(b=>b.onclick=()=>{
    const p=PRESETS[b.dataset.p];
    Object.assign(S,DEF);P.setLot(0);
    Object.keys(p).forEach(k=>{S[k]=p[k];});
    P.saveSettings();
    P.syncAll();
    $$('[data-ka]').forEach(i=>{i.checked=S[i.dataset.ka];});
    if(p.mat)P.setMat(p.mat); // dispara p3d:mat → paintChips + calc
    P.paintRanges();calc();flashPanel();
    $('#calculadora').scrollIntoView({behavior:'smooth',block:'start'});
  });

  calc();
})();
