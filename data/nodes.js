/* ===================== 영구 노드 데이터 =====================
   노드 틀은 모든 무기가 공유한다. (DESIGN 4.5, 3.3의 틀 원칙)
   costs[r] = 현재 r랭크에서 다음 랭크로 가는 비용(스탯 포인트).
   eff(r) = r랭크일 때의 효과 설명. 수치 적용은 meta.js의 metaMods(). */
const NODES=[
  {id:'natk',  n:'벼린 날',   max:5, costs:[1,1,2,2,3], eff:r=>`공격력 +${5*r}%`},
  {id:'naspd', n:'익숙한 손', max:5, costs:[1,1,2,2,3], eff:r=>`공격 속도 +${4*r}%`},
  {id:'nhp',   n:'단단한 심', max:5, costs:[1,1,2,2,3], eff:r=>`체력 +${6*r}%`},
  {id:'ndef',  n:'두꺼운 판', max:3, costs:[1,2,3],     eff:r=>`방어 +${r}`},
  {id:'nslot', n:'보석 홈',   max:2, costs:[4,8],       eff:r=>`홈 ${2+r}개`},
  {id:'nult',  n:'오의 각성', max:1, costs:[3],         eff:r=>r?'필살기 해금됨':'필살기 해금'},
];

/* 무기와 무관한 공용 노드 — 대장장이 자신의 성장. META.nodes['_global']에 저장 */
const GLOBAL_NODES=[
  {id:'nreroll', n:'다시 뽑기', max:2, costs:[2,4], eff:r=>`레벨업 리롤 런당 ${2+r}회`},
];
