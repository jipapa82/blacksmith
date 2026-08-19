/* ===================== 부대 현황 (캔버스 아래 카드) ===================== */
function renderCrew(){
  const c=document.getElementById('crew');
  if(c.children.length!==allies.length){
    c.innerHTML=allies.map(a=>`<div class="cw">
      <div class="cw-top"><span class="cw-tag ${a.front?'front':'back'}">${a.front?'앞줄':'뒷줄'}</span>
        <span>${a.name}</span><span class="cw-eq">${a.eq}</span></div>
      <div class="cw-hp"><i></i></div>
      <div class="cw-num"><span class="hpn"></span><span class="atkn"></span></div>
      <div class="cw-mods"></div></div>`).join('');
  }
  allies.forEach((a,i)=>{
    const el=c.children[i]; if(!el)return;
    const p=Math.max(0,a.hp/a.maxhp);
    const bar=el.querySelector('.cw-hp i');
    bar.style.width=p*100+'%'; bar.classList.toggle('hot',p<=.3);
    el.querySelector('.hpn').textContent=Math.max(0,Math.ceil(a.hp))+' / '+a.maxhp;
    el.querySelector('.atkn').textContent='공 '+a.atk+' · 치명 '+Math.round(a.crit*100)+'%';
    const m=el.querySelector('.cw-mods');
    const list=Object.entries(a.lv).map(([id,lv])=>{
      const u=UP.find(x=>x.id===id); return u?`${u.n} ${lv}`:null;
    }).filter(Boolean);
    if(a.crit>.05) list.unshift('치명 '+Math.round(a.crit*100)+'%');
    const key=list.join('|');
    if(m.dataset.key!==key){ m.dataset.key=key;
      m.innerHTML=list.map(x=>`<span class="mod">${x}</span>`).join(''); }
  });
}
