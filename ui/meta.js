/* ===================== 대장간 — 골드 강화 (DESIGN 4.5) =====================
   런 밖(대기/종료 화면)에서만 연다. 화폐는 금고의 골드 하나.
   스탯 4종 = 강화(+1강~+10강, 6강부터 확률) / 기능 3종 = 정액 구매. */
function openMeta(){
  if(running)return;
  const old=document.getElementById('metaOv');
  if(old){ old.remove(); return; }
  const ov=document.createElement('div'); ov.className='overlay'; ov.id='metaOv';
  ov.innerHTML=`
    <div class="ov-eyebrow">영구 성장</div>
    <div class="ov-title">대장간</div>
    <div class="purse"><span class="g">금고 <b id="metaGold">${META.gold}</b>골드</span></div>
    <div class="ov-sub">스탯은 강화(+강) — 1~5강 확정, 6강부터 실패할 수 있다. 실패해도 하락은 없고,
      실패할 때마다 다음 시도 +3%p. 초기화는 강화·구매 비용만 환급 (녹은 골드는 제외).</div>
    <div class="forge-hint" id="metaMsg"></div>
    <div class="meta-wrap" id="metaWrap"></div>
    <div class="ov-row"><button class="primary" id="metaClose">닫고 편성으로</button></div>`;
  document.getElementById('arena').appendChild(ov);
  renderMeta();
  document.getElementById('metaClose').onclick=()=>{
    ov.remove();
    renderLoadout(); reset();   // 노드가 바뀌었을 수 있으니 다음 출정 상태로 재계산
  };
}
function nodeRowHtml(k,n){
  const r=metaRank(k,n.id), maxed=r>=n.max, cost=maxed?0:nodeCost(n,r);
  const pips=Array.from({length:n.max},(_,i)=>`<i class="pip${i<r?' on':''}"></i>`).join('');
  const rate=maxed||n.fixed?1:enhRateOf(k,n.id,r);
  const label=maxed?'완성'
    :n.fixed?`구매 · ${cost}골드`
    :`강화 · ${cost}골드${rate<1?` (${Math.round(rate*100)}%)`:''}`;
  return `<div class="node-row">
    <span class="nn">${n.n}${!n.fixed&&r?` <b style="color:var(--gold)">+${r}강</b>`:''}</span>
    <span class="pips">${pips}</span>
    <span class="ne">${n.eff(r)}</span>
    <button data-k="${k}" data-id="${n.id}" ${maxed||META.gold<cost?'disabled':''}>${label}</button></div>`;
}
function metaHead(k,title){
  const spent=Object.keys(META.nodes[k]||{}).length;
  return `<h3>${title}${spent?`<button class="meta-reset" data-reset="${k}">초기화 (비용 환급)</button>`:''}</h3>`;
}
function renderMeta(){
  const wrap=document.getElementById('metaWrap'); if(!wrap)return;
  wrap.innerHTML=
    `<div class="meta-weap">${metaHead('_global','대장장이 공용')}
      ${GLOBAL_NODES.map(n=>nodeRowHtml('_global',n)).join('')}</div>`
    +Object.entries(EQUIP).map(([k,e])=>`<div class="meta-weap">${metaHead(k,e.name)}
      ${NODES.map(n=>nodeRowHtml(k,n)).join('')}</div>`).join('');
  const gold=()=>{const g=document.getElementById('metaGold'); if(g)g.textContent=META.gold;};
  const say=t=>{const m=document.getElementById('metaMsg'); if(m)m.textContent=t;};
  wrap.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    if(b.dataset.reset){                       // 무기별 초기화 — 강화·구매 비용 환급
      const refund=metaReset(b.dataset.reset);
      if(refund>0){ gold(); say(`초기화 — ${refund}골드 환급`); renderMeta(); }
      return;
    }
    const k=b.dataset.k, id=b.dataset.id;
    const res=metaBuy(k,id);
    if(!res)return;
    gold();
    if(res==='fail'){
      const rate=Math.round(enhRateOf(k,id,metaRank(k,id))*100);
      say(`강화 실패 — 골드만 녹았다. 쇠는 더 단단해졌다: 다음 시도 ${rate}%`);
    }else say('');
    renderMeta();
  });
}
