/* Página Orçamentos: lista salva + item atual da calculadora (DOM API — sem innerHTML com texto do usuário). */
(function(){
  const P=window.P3D; const $=P.$, $$=P.$$; const {brl,nf,hhmm,S}=P;
  const quotes=P.quotes;

  function renderQuotes(){
    const l=$('#quoteList');l.innerHTML='';
    if(!quotes.length){const e=document.createElement('div');e.className='empty';
      e.textContent='Nenhum orçamento salvo ainda. Use “+ Salvar peça atual” aqui ou salve direto na calculadora.';l.append(e);}
    quotes.forEach((q,i)=>{
      const lote=q.lote||1;
      const row=document.createElement('div');row.className='quote';
      const info=document.createElement('div');
      const b=document.createElement('b');b.textContent=q.nome;
      const sp=document.createElement('span');sp.className='m';
      sp.textContent=q.mat+' · '+nf(q.peso)+'g · '+q.tempo+(lote>1?' · lote de '+nf(lote)+' un.':'')+' · '+brl(q.custo)+' de custo · '+brl(q.lucro)+' de lucro';
      info.append(b,' · ',sp);
      const right=document.createElement('div');right.style.cssText='display:flex;gap:12px;align-items:center';
      const mon=document.createElement('span');mon.className='mono';mon.textContent=brl(q.preco*lote);
      const link=document.createElement('a');link.className='lotbtn';link.href='pedidos.html';link.textContent='→ pedido';
      link.title='Transformar este orçamento em pedido (pagamento e entrega)';
      const x=document.createElement('button');x.className='x';x.type='button';x.textContent='×';x.setAttribute('aria-label','Remover '+q.nome+' do orçamento');
      x.onclick=()=>{quotes.splice(i,1);P.store();renderQuotes();};
      right.append(mon,link,x);row.append(info,right);l.append(row);
    });
    const t=quotes.reduce((a,q)=>a+q.preco*(q.lote||1),0);
    $('#qTotal').textContent=brl(t);
    $('#qCount').textContent=quotes.length?'('+quotes.length+' itens)':'';
  }

  /* ---- o que o botão vai salvar agora (peça + lote travado, ambos persistidos) ---- */
  function drawCtx(){
    const el=$('#ctx');if(!el)return;const l=P.getLot();const r=P.model(l||1);
    el.textContent='Salvando agora: '+(S.nome||'peça sem nome')+' ('+S.mat+', '+nf(S.peso)+'g, '+hhmm(r.h)+
      (l>1?' · lote travado de '+nf(l)+' un.':' · peça unitária')+') por '+brl(r.preco)+(l>1?' cada, '+brl(r.preco*l)+' o lote.':' · custo '+brl(r.custo)+', lucro '+brl(r.lucro)+'.')+
      ' Trave outro lote em Lotes & Meta.';
  }

  const saveBtn=$('#saveCur');
  saveBtn.onclick=()=>{P.addQuote();renderQuotes();saveBtn.textContent='Salvo ✓';setTimeout(()=>{saveBtn.textContent='+ Salvar peça atual';},1600);};

  function quoteText(){return quotes.length?'ORÇAMENTOS — Precifica3D\n'+quotes.map((q,i)=>(i+1)+'. '+q.nome+' ('+q.mat+', '+nf(q.peso)+'g, '+q.tempo+((q.lote||1)>1?', lote '+nf(q.lote)+' un.':'')+') — '+brl(q.preco*(q.lote||1))).join('\n')+'\nTOTAL: '+brl(quotes.reduce((a,q)=>a+q.preco*(q.lote||1),0)):'Lista vazia';}
  $('#copyList').onclick=async e=>{try{await navigator.clipboard.writeText(quoteText());e.target.textContent='Copiado ✓';setTimeout(()=>e.target.textContent='Copiar lista',1600);}catch(_){alert(quoteText());}};
  $('#printList').onclick=()=>window.print();
  $('#clearList').onclick=()=>{quotes.length=0;P.store();renderQuotes();};

  renderQuotes();drawCtx();
})();
