/* ===================== 영구 성장 저장/적용 =====================
   런이 끝나면 스탯 포인트를 받고, 무기별 노드에 영구히 찍는다. (DESIGN 4.5)
   localStorage에 저장. 막히면(사생활 모드 등) 그 세션 동안만 유지된다. */
const META_KEY='blacksmith-meta-v1';
const META=(()=>{ try{
    const j=JSON.parse(localStorage.getItem(META_KEY));
    if(j&&typeof j.pts==='number'&&j.nodes){
      if(j.autoUlt===undefined)j.autoUlt=true;   // 필살기 발동 방식 (4.1.2) — 기본 자동
      if(j.gold===undefined)j.gold=0;            // 대장간 금고 (6.3) — 런의 남은 골드가 누적
      if(j.best===undefined)j.best=0;            // 최고 웨이브 기록 (3.7)
      if(j.sound===undefined)j.sound=true;       // 효과음 (7.4) — 기본 켬
      if(j.pity===undefined)j.pity={};           // 강화 천장 — 노드별 실패 누적 (4.5)
      if(j.pts>0){ j.gold+=j.pts*200; j.pts=0; } // 스탯 포인트 폐지 — 1pt = 200골드 일괄 환전 (4.5)
      return j;
    }
  }catch(e){}
  return {pts:0, gold:0, best:0, nodes:{}, pity:{}, autoUlt:true, sound:true}; })();
function saveMeta(){ try{localStorage.setItem(META_KEY,JSON.stringify(META));}catch(e){} }

function metaRank(k,id){ return (META.nodes[k]||{})[id]||0; }
function nodeCost(n,r){ return n.fixed?n.costs[r]:enhCost(r); }
/* 현재 성공률 — 기본 사다리 + 천장(실패 누적 ×3%p) */
function enhRateOf(k,id,r){
  return Math.min(1,ENH_RATE[r]+ENH_PITY*(META.pity[k+'.'+id]||0));
}
/* 강화/구매 시도 — 골드 소모. 반환: 'ok' | 'fail'(강화 실패, 하락 없음) | false(불가) */
function metaBuy(k,id){
  const n=NODES.find(x=>x.id===id)||GLOBAL_NODES.find(x=>x.id===id), r=metaRank(k,id);
  if(!n||r>=n.max) return false;
  const c=nodeCost(n,r); if(META.gold<c) return false;
  META.gold-=c;
  if(!n.fixed&&Math.random()>=enhRateOf(k,id,r)){
    META.pity[k+'.'+id]=(META.pity[k+'.'+id]||0)+1;   // 실패 — 골드만 녹고 천장이 쌓인다
    saveMeta(); sfx('fail');
    return 'fail';
  }
  delete META.pity[k+'.'+id];
  (META.nodes[k]=META.nodes[k]||{})[id]=r+1; saveMeta();
  sfx('hammer');                                 // 무기를 두드리는 망치질 (7.4)
  return 'ok';
}
/* 무기(또는 '_global') 노드 전체 초기화 — 강화·구매 비용 전액 환급.
   실패로 녹은 골드는 돌아오지 않는다 (DESIGN 4.5) */
function metaReset(k){
  const spent=META.nodes[k]; if(!spent)return 0;
  let refund=0;
  for(const [id,r] of Object.entries(spent)){
    const n=NODES.find(x=>x.id===id)||GLOBAL_NODES.find(x=>x.id===id);
    if(n) for(let i=0;i<r&&i<n.max;i++) refund+=nodeCost(n,i);
  }
  delete META.nodes[k];
  for(const key of Object.keys(META.pity)) if(key.indexOf(k+'.')===0) delete META.pity[key];
  META.gold+=refund; saveMeta();
  return refund;
}

/* mkAlly가 읽는 무기별 영구 보정 — 스탯은 정수 가산 (DESIGN 4.5) */
function metaMods(k){
  const r=id=>metaRank(k,id);
  return { atkAdd:r('natk'), aspdAdd:.03*r('naspd'), hpAdd:5*r('nhp'),
    defAdd:r('ndef'), slots:2+r('nslot'),
    ultPow:.5+.25*r('nult'),     // 필살기는 기본 제공(50%), 노드로 연마 (DESIGN 4.5)
    ultRank:r('nult') };         // 활은 연마 축이 연사 수 (5+2×랭크)
}
