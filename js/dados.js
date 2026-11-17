/* Página Dados: resumo do que está salvo no navegador + backup .json (export/import) + reset. */
(function(){
  const P=window.P3D; const $=P.$; const {nf}=P;

  /* ---- resumo do estado persistido ---- */
  function drawSum(){
    const edited=P.MATERIALS.filter((m,i)=>m.kg!==P.MAT_DEF[i].kg).length;
    $('#sumMats').textContent=nf(edited)+' de '+nf(P.MATERIALS.length);
    $('#sumQuotes').textContent=nf(P.quotes.length)+(P.quotes.length===1?' item':' itens');
    $('#sumLot').textContent=P.getLot()?nf(P.getLot())+' un.':'nenhum';
    $('#sumInv').textContent=nf(P.INV.printers.length)+' · '+nf(P.INV.buys.length);
    $('#sumPedidos').textContent=nf(P.orders.length)+(P.orders.length===1?' pedido':' pedidos');
    let at='—';
    try{const t=localStorage.getItem('p3d_savedAt');
      if(t)at=new Date(t).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});}catch(e){}
    $('#sumAt').textContent=at;
  }
  drawSum();

  function feedback(btn,txt){const old=btn.textContent;btn.textContent=txt;setTimeout(()=>{btn.textContent=old;},1600);}

  /* ---- exportar: arquivo .json + cópia no clipboard ---- */
  $('#expBtn').onclick=()=>{
    const d=P.exportData();
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));
    a.download='precifica3d-backup-'+d.exportedAt.slice(0,10)+'.json';
    document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    feedback($('#expBtn'),'Backup baixado ✓');
  };
  const cb=$('#copyBtn');
  cb.onclick=async()=>{
    try{await navigator.clipboard.writeText(JSON.stringify(P.exportData(),null,2));feedback(cb,'Copiado ✓');}
    catch(_){window.prompt('Copie o texto abaixo:',JSON.stringify(P.exportData()));}
  };

  /* ---- importar: substitui tudo (core guarda o estado anterior em p3d_prev antes) ---- */
  const msg=$('#impMsg');
  function say(txt,ok){msg.hidden=false;msg.textContent=txt;msg.style.color=ok?'var(--teal)':'var(--hot)';}
  $('#impFile').onchange=()=>{
    const f=$('#impFile').files[0];if(!f)return;
    const r=new FileReader();
    r.onload=()=>{
      try{
        const res=P.importData(JSON.parse(String(r.result)));
        say('Backup restaurado: '+nf(res.mats)+' materiais, '+nf(res.quotes)+' orçamentos, '+nf(res.printers)+' impressoras, '+nf(res.buys)+' lançamentos, '+nf(res.orders)+' pedidos'+
          (res.lote?', lote travado de '+nf(res.lote)+' un.':'')+'. Recarregando…',true);
        setTimeout(()=>location.reload(),900);
      }catch(err){say('Não deu: '+(err&&err.message?err.message:'arquivo inválido')+'. Nada foi alterado.',false);}
      $('#impFile').value='';
    };
    r.onerror=()=>{say('Não consegui ler o arquivo.',false);$('#impFile').value='';};
    r.readAsText(f);
  };

  /* ---- reset: apaga tudo, com confirmação por segundo clique ---- */
  const rb=$('#resetBtn');let armed=false,tid=null;
  rb.onclick=()=>{
    if(!armed){armed=true;rb.textContent='Clique de novo para apagar tudo';
      tid=setTimeout(()=>{armed=false;rb.textContent='Restaurar valores de fábrica';},4000);return;}
    clearTimeout(tid);P.clearAll();location.reload();
  };
})();
