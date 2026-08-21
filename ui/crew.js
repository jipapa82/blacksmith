/* ===================== 부대 현황 (캔버스 아래 카드) =====================
   위에서부터 스탯(정확한 수치) / 원소 / 보석 / 카드 — 구분선으로 나눈다. (DESIGN 7.3, 2026-08-21)
   스탯은 매 프레임 갱신, 원소·보석·카드는 바뀔 때만 다시 그린다. */
function secHtml(el,cls,label,items){
  const n=el.querySelector(cls); if(!n)return;
  const key=items.join('|');
  if(n.dataset.key===key)return;
  n.dataset.key=key;
  n.innerHTML=`<span class="sec-lb">${label}</span>`
    +(items.length?items.join(''):'<span class="mod" style="opacity:.4">—</span>');
}

function renderCrew(){
  const c=document.getElementById('crew');
  if(c.children.length!==allies.length){
    c.innerHTML=allies.map((a,i)=>`<div class="cw">
      <div class="cw-top"><span class="cw-tag ${a.front?'front':'back'}">${a.front?'앞줄':'뒷줄'}</span>
        <span>${a.name}</span><span class="cw-eq">${weaponIcon(a.key)}${a.eq}</span></div>
      <div class="cw-hp"><i></i></div>
      <div class="cw-stats">
        <span>체력 <b class="s-hp"></b></span><span>공격 <b class="s-atk"></b></span>
        <span>공속 <b class="s-as"></b></span><span>방어 <b class="s-df"></b></span>
        <span>치명 <b class="s-cr"></b></span><span>치명 피해 <b class="s-cd"></b></span>
        <span>회피 <b class="s-dg"></b></span><span>흡혈 <b class="s-lc"></b></span>
      </div>
      <div class="cw-sec s-elem"></div>
      <div class="cw-sec s-gems"></div>
      <div class="cw-sec s-cards"></div>
      <button class="ultbtn" data-i="${i}">필살 · ${EQUIP[a.key].ultName} [${i+1}]</button></div>`).join('');
    c.querySelectorAll('.ultbtn').forEach(b=>b.onclick=()=>fireUlt(+b.dataset.i));
  }
  allies.forEach((a,i)=>{
    const el=c.children[i]; if(!el)return;
    const mx=maxHpOf(a), p=Math.max(0,a.hp/mx);
    const bar=el.querySelector('.cw-hp i');
    bar.style.width=p*100+'%'; bar.classList.toggle('hot',p<=.3);
    const T=(cls,v)=>{const n=el.querySelector(cls);
      if(n&&n.textContent!==String(v))n.textContent=v;};
    T('.s-hp',Math.max(0,Math.ceil(a.hp))+'/'+mx);
    T('.s-atk',atkOf(a));
    T('.s-as',aspdOf(a).toFixed(2));
    T('.s-df',defOf(a));
    T('.s-cr',Math.round(critOf(a)*100)+'%');
    T('.s-cd',Math.round((a.critD+(a.gm?a.gm.critDmgAdd:0))*100)+'%');
    T('.s-dg',Math.round(dodgeOf(a)*100)+'%');
    T('.s-lc',a.leech+(a.gm?a.gm.leechAdd:0));
    const e=elemOf(a), eLv=a.elFire||a.elPois||a.elCold||a.elShock||0;
    secHtml(el,'.s-elem','원소',
      e?[`<span class="mod" style="color:${ELEM_INFO[e][1]}">● ${ELEM_INFO[e][0]} ${eLv}단계</span>`]:[]);
    secHtml(el,'.s-gems','보석',
      a.sock.map(s=>s?`<span class="mod" style="color:${GEMS[s.type].color}">${GEMS[s.type].name} ${GRADE_TXT[s.grade-1]}</span>`
                     :`<span class="mod" style="opacity:.4">빈 홈</span>`));
    secHtml(el,'.s-cards','카드',
      Object.entries(a.lv).map(([id,cl])=>{
        const u=UP.find(x=>x.id===id); return u?`<span class="mod">${u.n} ${cl}</span>`:'';
      }).filter(Boolean));
    const ub=el.querySelector('.ultbtn');
    if(ub){
      ub.style.display=META.autoUlt?'none':'';               // 수동 모드에만
      ub.disabled=!(running&&a.hp>0&&a.ultT>=a.ultCd);
      ub.classList.toggle('ready',running&&a.hp>0&&a.ultT>=a.ultCd);
    }
  });
}
