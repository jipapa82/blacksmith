/* ===================== 대장간 — 무기 강화 (DESIGN 4.5) =====================
   런 밖(대기/종료 화면)에서만 연다. 화폐는 금고의 골드 하나.
   무기당 축도 하나 — "+N강": 강마다 전 스탯 상승, 홈·연마는 마일스톤 자동 해금. */
function openMeta(){
  if(running)return;
  const old=document.getElementById('metaOv');
  if(old){ old.remove(); return; }
  const ov=document.createElement('div'); ov.className='overlay'; ov.id='metaOv';
  ov.innerHTML=`
    <div class="ov-eyebrow">영구 성장</div>
    <div class="ov-title">대장간</div>
    <div class="purse"><span class="g">금고 <b id="metaGold">${META.gold}</b>골드</span></div>
    <div class="ov-sub">무기를 두드려 +강을 올린다 — 강마다 모든 스탯이 오르고, 홈과 오의는 강에 따라 저절로 열린다.<br>
      1~5강 확정, 6강부터 실패할 수 있다. 실패해도 하락은 없고, 실패마다 다음 시도 +3%p.</div>
    <div class="forge-hint" id="metaMsg"></div>
    <div class="meta-wrap" id="metaWrap"></div>
    <div class="ov-row"><button class="primary" id="metaClose">닫고 편성으로</button></div>`;
  document.getElementById('arena').appendChild(ov);
  renderMeta();
  document.getElementById('metaClose').onclick=()=>{
    ov.remove();
    renderLoadout(); reset();   // 강화가 바뀌었을 수 있으니 다음 출정 상태로 재계산
  };
}
function weaponRowHtml(k,e){
  const L=metaRank(k,'lvl'), maxed=L>=WLEVEL.max, cost=maxed?0:WLEVEL.cost(L);
  const rate=maxed?1:enhRateOf(k);
  const pips=Array.from({length:WLEVEL.max},(_,i)=>`<i class="pip${i<L?' on':''}"></i>`).join('');
  const ms=Object.entries(WLEVEL.milestones).map(([lv,t])=>
    `<span class="mod"${L>=+lv?' style="color:var(--gold)"':''}>${lv}강 ${t}</span>`).join('');
  return `<div class="meta-weap"><h3>${weaponIcon(k)}${e.name}${L?` <b style="color:var(--gold)">+${L}강</b>`:''}
      ${L?`<button class="meta-reset" data-reset="${k}">초기화 (비용 환급)</button>`:''}</h3>
    <div class="node-row">
      <span class="pips">${pips}</span>
      <span class="ne">강마다 ${enhDesc(k)}</span>
      <button data-k="${k}" data-id="lvl" ${maxed||META.gold<cost?'disabled':''}>
        ${maxed?'완성':`강화 · ${cost}골드${rate<1?` (${Math.round(rate*100)}%)`:''}`}</button></div>
    <div class="cw-sec" style="border:0;padding-top:0;margin-top:3px">${ms}</div>
  </div>`;
}
function renderMeta(){
  const wrap=document.getElementById('metaWrap'); if(!wrap)return;
  wrap.innerHTML=
    `<div class="meta-weap">${(Object.keys(META.nodes._global||{}).length
        ?`<h3>대장장이 공용 <button class="meta-reset" data-reset="_global">초기화 (비용 환급)</button></h3>`
        :'<h3>대장장이 공용</h3>')}
      ${GLOBAL_NODES.map(n=>{
        const r=metaRank('_global',n.id), maxed=r>=n.max, cost=maxed?0:n.costs[r];
        const pips=Array.from({length:n.max},(_,i)=>`<i class="pip${i<r?' on':''}"></i>`).join('');
        return `<div class="node-row"><span class="nn">${n.n}</span>
          <span class="pips">${pips}</span><span class="ne">${n.eff(r)}</span>
          <button data-k="_global" data-id="${n.id}" ${maxed||META.gold<cost?'disabled':''}>
            ${maxed?'완성':`구매 · ${cost}골드`}</button></div>`;
      }).join('')}</div>`
    +Object.entries(EQUIP).map(([k,e])=>weaponRowHtml(k,e)).join('');
  const gold=()=>{const g=document.getElementById('metaGold'); if(g)g.textContent=META.gold;};
  const say=t=>{const m=document.getElementById('metaMsg'); if(m)m.textContent=t;};
  wrap.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    if(b.dataset.reset){                       // 초기화 — 강화·구매 비용 환급
      const refund=metaReset(b.dataset.reset);
      if(refund>0){ gold(); say(`초기화 — ${refund}골드 환급`); renderMeta(); }
      return;
    }
    const k=b.dataset.k;
    const res=metaBuy(k,b.dataset.id);
    if(!res)return;
    gold();
    if(res==='fail')
      say(`강화 실패 — 골드만 녹았다. 쇠는 더 단단해졌다: 다음 시도 ${Math.round(enhRateOf(k)*100)}%`);
    else say('');
    renderMeta();
  });
}
