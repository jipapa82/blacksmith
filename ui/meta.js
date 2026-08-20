/* ===================== 대장간 — 영구 노드 트리 (DESIGN 4.5) =====================
   런 밖(대기/종료 화면)에서만 연다. 찍으면 즉시 저장, 다음 편성부터 적용. */
function openMeta(){
  if(running)return;
  const old=document.getElementById('metaOv');
  if(old){ old.remove(); return; }
  const ov=document.createElement('div'); ov.className='overlay'; ov.id='metaOv';
  ov.innerHTML=`
    <div class="ov-eyebrow">영구 성장</div>
    <div class="ov-title">대장간</div>
    <div class="purse"><span class="m">스탯 포인트 <b id="metaPts">${META.pts}</b></span>
      <span class="g">금고 <b>${META.gold}</b>골드</span></div>
    <div class="ov-sub">금고의 쓸 곳(제작·환전)은 다음 층에서 열린다. 지금은 쌓인다.</div>
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
  const r=metaRank(k,n.id), maxed=r>=n.max, cost=maxed?0:n.costs[r];
  const pips=Array.from({length:n.max},(_,i)=>`<i class="pip${i<r?' on':''}"></i>`).join('');
  return `<div class="node-row">
    <span class="nn">${n.n}</span>
    <span class="pips">${pips}</span>
    <span class="ne">${n.eff(r)}</span>
    <button data-k="${k}" data-id="${n.id}" ${maxed||META.pts<cost?'disabled':''}>
      ${maxed?'완성':cost+'pt'}</button></div>`;
}
function metaHead(k,title){
  const spent=Object.keys(META.nodes[k]||{}).length;
  return `<h3>${title}${spent?`<button class="meta-reset" data-reset="${k}">초기화 (전액 환급)</button>`:''}</h3>`;
}
function renderMeta(){
  const wrap=document.getElementById('metaWrap'); if(!wrap)return;
  wrap.innerHTML=
    `<div class="meta-weap">${metaHead('_global','대장장이 공용')}
      ${GLOBAL_NODES.map(n=>nodeRowHtml('_global',n)).join('')}</div>`
    +Object.entries(EQUIP).map(([k,e])=>`<div class="meta-weap">${metaHead(k,e.name)}
      ${NODES.map(n=>nodeRowHtml(k,n)).join('')}</div>`).join('');
  wrap.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    if(b.dataset.reset){                       // 무기별 초기화 — 쓴 포인트 전액 환급
      if(metaReset(b.dataset.reset)>0){
        const p=document.getElementById('metaPts'); if(p)p.textContent=META.pts;
        renderMeta();
      }
      return;
    }
    if(metaBuy(b.dataset.k,b.dataset.id)){
      const p=document.getElementById('metaPts'); if(p)p.textContent=META.pts;
      renderMeta();
    }
  });
}
