/* Página Lotes & Meta: tabelas derivadas da peça salva na calculadora. */
(function(){
  const P=window.P3D; const $=P.$, $$=P.$$; const {brl,nf,hhmm,LOTES,S}=P;

  /* ---- inputs da página (slider da meta) ---- */
  P.bindFields(()=>{drawGoal();});
  P.syncAll(); // valor persistido da meta manda sobre o valor inicial do HTML

  /* ---- lotes: preço por peça CAI com o volume (preparo/embalagem rateados) ---- */
  function drawLots(){
    const af=document.activeElement;const afq=af&&af.dataset?af.dataset.lotq:null;
    $('#lotTable').innerHTML=LOTES.map(q=>{
      const r=P.model(q);const on=q===P.getLot();
      return '<tr data-q="'+q+'" class="'+(on?'on':'')+'">'+
        '<td class="m"><button class="lotbtn" type="button" data-lotq="'+q+'" aria-pressed="'+on+'">'+q+' un.</button></td>'+
        '<td class="m">'+brl(r.custo)+'</td><td class="m"><b>'+brl(r.preco)+'</b></td><td class="m">'+brl(r.lucro)+'</td>'+
        '<td class="m">'+brl(r.preco*q)+'</td><td class="m" style="color:'+(r.lucro>0?'#5FD89F':'var(--hot)')+'">'+brl(r.lucro*q)+'</td></tr>';}).join('');
    $('#lotHint').textContent=P.getLot()?('Lote de '+P.getLot()+' travado como base do orçamento — “Salvar orçamento” e “Copiar resumo” usam o preço deste lote.'):'Nenhum lote travado — o orçamento usa a peça unitária. Clique em “N un.” ou em uma linha para travar um lote.';
    const pick=q=>{P.setLot(P.getLot()===q?0:q);drawLots();};
    $$('#lotTable .lotbtn').forEach(b=>{b.onclick=e=>{e.stopPropagation();pick(+b.dataset.lotq);};});
    $$('#lotTable tr').forEach(tr=>{tr.onclick=()=>pick(+tr.dataset.q);});
    if(afq){const nb=$('#lotTable .lotbtn[data-lotq="'+afq+'"]');if(nb)nb.focus({preventScroll:true});}
  }

  /* ---- peça atual em uma linha, para dar contexto à tabela ---- */
  function drawPiece(){const m=P.model(1);const el=$('#lotPiece');
    if(el)el.textContent=(S.nome||'sem nome')+' · '+S.mat+' · '+nf(S.peso)+'g · '+hhmm(m.h)+' · unitário '+brl(m.preco);}

  /* ---- meta ---- */
  function drawGoal(){
    const last=P.model(1);const per=last.lucro;
    $('#metaVal').textContent=brl(S.meta);
    const need=per>0?Math.ceil(S.meta/per):0;
    $('#mPecas').textContent=nf(need)+' un.';
    $('#mDias').textContent=need?nf(Math.ceil(need/22)):'—';
    const hrs=need*last.h;
    $('#mHoras').textContent=nf(hrs)+'h';
    $('#mKg').textContent=need?nf(need*last.pesoBruto/1000,2)+' kg':'—';
    $('#mFat').textContent=brl(need*last.preco);
    const cap=22*8;
    $('#mMaq').textContent=hrs?nf(Math.max(1,Math.ceil(hrs/cap))):'—';
  }

  drawLots();drawPiece();drawGoal();
})();
