/* Página Materiais: tabela editável; linha destacada = material ativo da calculadora. */
(function(){
  const P=window.P3D; const $=P.$, $$=P.$$;
  const {nf,MATERIALS,model,S}=P;

  /* ---- tabela: construída 1x, foco preservado, edits persistidos ---- */
  const tbody=$('#matTable tbody'); const matRows=new Map();
  MATERIALS.forEach(m=>{
    const tr=document.createElement('tr');tr.tabIndex=0;
    const t1=document.createElement('td');const b=document.createElement('b');b.textContent=m.n;t1.append(b);
    const t2=document.createElement('td');t2.className='m';t2.textContent=m.bico?m.bico+'° / '+m.mesa+'°':'—';
    const t3=document.createElement('td');
    const inp=document.createElement('input');inp.type='number';inp.step='0.1';inp.min='1';
    inp.value=String(m.kg);inp.setAttribute('aria-label','Preço do kg de '+m.n);
    inp.oninput=()=>{const v=parseFloat(inp.value);if(!isFinite(v)||v<=0)return;
      m.kg=v;if(m.n===S.mat){S.precoKg=v;P.sync('precoKg');P.saveSettings();P.drawChip();}P.store();};
    inp.onblur=()=>{inp.value=String(m.kg);};
    inp.onclick=e=>e.stopPropagation();
    t3.append(inp);
    const t4=document.createElement('td');t4.style.color='var(--dim)';t4.textContent=m.u;
    tr.append(t1,t2,t3,t4);
    const act=()=>P.setMat(m.n);
    tr.onclick=e=>{if(e.target.tagName==='INPUT')return;act();};
    tr.onkeydown=e=>{if(e.target.tagName==='INPUT')return;if(e.key==='Enter'||e.key===' '){e.preventDefault();act();}};
    matRows.set(m.n,{tr,inp});tbody.append(tr);
  });
  function markMatRow(){matRows.forEach((r,n)=>r.tr.classList.toggle('on',n===S.mat));}
  document.addEventListener('p3d:mat',()=>{
    markMatRow();
    const m=MATERIALS.find(x=>x.n===S.mat);const r=m&&matRows.get(m.n);
    if(r&&document.activeElement!==r.inp)r.inp.value=String(m.kg);
  });
  markMatRow();

  /* ---- rolo gira no ritmo do tempo de impressão da peça atual ---- */
  function drawSpool(){const el=$('#spool');if(el)el.style.animationDuration=Math.max(1.2,Math.min(30,24/Math.max(0.25,model(1).h)))+'s';}
  drawSpool();
})();
