/* Página Guia: anatomia do preço (cartões empilhados) + acordeão de FAQ. */
(function(){
  const P=window.P3D; const $=P.$, $$=P.$$; const {brl,nf,esc}=P;

  function drawAnat(){
    const last=P.model(1);
    const items=[
      ['Filamento',last.material,'peso × (1 + desperdício) × preço do kg ÷ 1000'],
      ['Energia',last.energia,'potência média × horas × tarifa'],
      ['Depreciação + manutenção',last.maq,'valor da máquina ÷ vida útil × horas, mais manutenção por hora'],
      ['Sua mão de obra',last.mo,'minutos de preparo e acabamento × valor/hora'],
      ['Rateio de fixos',last.fixoSolo,'contas do mês ÷ peças do mês (ou do lote, se maior)'],
      ['Risco de falha',last.risco,'custos variáveis divididos por (1 − taxa de falha)'],
      ['Imposto + plataforma',last.impV+last.taxV,'porcentagem sobre o preço de venda, não sobre o lucro']
    ];
    const el=$('#anat');if(!el)return;
    el.innerHTML=items.map((it,i)=>'<div class="scard" style="top:'+(86+i*10)+'px"><div class="idx">CAMADA '+nf(i+1)+'</div><h4>'+esc(it[0])+'</h4><p>'+esc(it[2])+'</p><div class="fig">'+brl(it[1])+'</div></div>').join('');
  }
  drawAnat();

  $$('.fq button').forEach(b=>b.onclick=()=>{const open=b.parentElement.classList.toggle('open');b.setAttribute('aria-expanded',String(open));});
})();
