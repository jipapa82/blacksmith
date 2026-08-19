/* ===================== 부대 현황 (캔버스 아래 카드) ===================== */
function renderCrew(){
  const c=document.getElementById('crew');
  if(c.children.length!==allies.length){
    c.innerHTML=allies.map((a,i)=>`<div class="cw">
      <div class="cw-top"><span class="cw-tag ${a.front?'front':'back'}">${a.front?'앞줄':'뒷줄'}</span>
        <span>${a.name}</span><span class="cw-eq">${a.eq}</span></div>
      <div class="cw-hp"><i></i></div>
      <div class="cw-num"><span class="hpn"></span><span class="atkn"></span></div>
      <div class="cw-mods"></div>
      <button class="ultbtn" data-i="${i}">필살 · ${EQUIP[a.key].ultName} [${i+1}]</button></div>`).join('');
    c.querySelectorAll('.ultbtn').forEach(b=>b.onclick=()=>fireUlt(+b.dataset.i));
  }
  allies.forEach((a,i)=>{
    const el=c.children[i]; if(!el)return;
    const mx=maxHpOf(a), p=Math.max(0,a.hp/mx);
    const bar=el.querySelector('.cw-hp i');
    bar.style.width=p*100+'%'; bar.classList.toggle('hot',p<=.3);
    el.querySelector('.hpn').textContent=Math.max(0,Math.ceil(a.hp))+' / '+mx;
    el.querySelector('.atkn').textContent='공 '+atkOf(a)+' · 치명 '+Math.round(critOf(a)*100)+'%';
    const m=el.querySelector('.cw-mods');
    const list=Object.entries(a.lv).map(([id,cl])=>{
      const u=UP.find(x=>x.id===id); return u?`${u.n} ${cl}`:null;
    }).filter(Boolean);
    a.sock.forEach(s=>{ if(s) list.unshift(`${GEMS[s.type].name} ${GRADE_TXT[s.grade-1]}`); });
    if(critOf(a)>.05) list.unshift('치명 '+Math.round(critOf(a)*100)+'%');
    const key=list.join('|');
    if(m.dataset.key!==key){ m.dataset.key=key;
      m.innerHTML=list.map(x=>`<span class="mod">${x}</span>`).join(''); }
    const ub=el.querySelector('.ultbtn');
    if(ub){
      ub.style.display=a.ultOn?'':'none';
      ub.disabled=!(running&&a.hp>0&&a.ultT>=a.ultCd);
      ub.classList.toggle('ready',running&&a.hp>0&&a.ultT>=a.ultCd);
    }
  });
}
