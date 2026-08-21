/* ===================== 영구 노드 데이터 =====================
   대장간의 화폐는 골드 하나 — 스탯 포인트 폐지 (2026-08-21, DESIGN 4.5).
   스탯 4종은 "강화"(+1강~+10강): 비용 enhCost(현재 강), 성공률 ENH_RATE[현재 강].
   1~5강 확정, 6강부터 실패 가능 — 실패해도 하락 없음, 골드만 녹는다.
   실패마다 다음 시도 +3%p 천장(성공 시 초기화) — 쇠는 두드릴수록 단단해진다.
   기능 3종(fixed)은 도박 없는 정액 구매. eff(r) = r일 때의 효과. 적용은 meta.js의 metaMods(). */
const NODES=[
  {id:'natk',  n:'벼린 날',   max:10, eff:r=>`공격력 +${r}`},
  {id:'naspd', n:'익숙한 손', max:10, eff:r=>`공격 속도 +${(.03*r).toFixed(2)}`},
  {id:'nhp',   n:'단단한 심', max:10, eff:r=>`체력 +${5*r}`},
  {id:'ndef',  n:'두꺼운 판', max:10, eff:r=>`방어 +${r}`},
  {id:'nslot', n:'보석 홈',   max:2, fixed:true, costs:[2000,8000],     eff:r=>`홈 ${2+r}개`},
  {id:'nult',  n:'오의 연마', max:3, fixed:true, costs:[500,1500,4000], eff:r=>`필살기 위력 ${50+25*r}%`},
];

/* 무기와 무관한 공용 노드 — 대장장이 자신의 성장. META.nodes['_global']에 저장 */
const GLOBAL_NODES=[
  {id:'nreroll', n:'다시 뽑기', max:2, fixed:true, costs:[800,2400], eff:r=>`시작 리롤 +${r} (고용마다 +1과 별개)`},
];

function enhCost(r){ return Math.round(50*Math.pow(1.6,r)); }   // 1강 50골드 … 10강 3,436골드
const ENH_RATE=[1,1,1,1,1,.85,.70,.50,.30,.15];                 // [현재 강] = 다음 강 성공률
const ENH_PITY=.03;                                             // 실패 1회당 다음 시도 +3%p
