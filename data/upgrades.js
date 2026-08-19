/* ===================== 강화 카드 =====================
   배수형 효과는 반드시 값을 나눈다 — 모든 강화는 비슷한 크기여야 한다. (DESIGN 7.1)
   ok: 이 장비가 받을 수 있는 카드인지 / d: 설명 / f: 적용 */
const UP=[
  /* ===== 공용 (모든 장비) ===== */
  {id:'edge',  n:'날 세우기',   max:5, r:0, ok:()=>1,
   d:a=>`공격력 +${Math.round(a.base.atk*.14)}`, f:a=>a.atk+=Math.round(a.base.atk*.14)},
  {id:'grip',  n:'손잡이 감기', max:5, r:0, ok:()=>1,
   d:()=>'공격 속도 +12%', f:a=>a.aspd*=1.12},
  {id:'plate', n:'덧판 대기',   max:5, r:0, ok:()=>1,
   d:a=>`최대 체력 +${Math.round(a.base.hp*.20)}`,
   f:a=>{const v=Math.round(a.base.hp*.20);a.maxhp+=v;a.hp+=v;}},
  {id:'temper',n:'담금질',      max:4, r:0, ok:()=>1, d:()=>'방어 +2', f:a=>a.def+=2},
  {id:'crit',  n:'날끝 벼리기', max:5, r:0, ok:()=>1,
   d:a=>`치명타 확률 +7% (현재 ${Math.round(a.crit*100)}%)`, f:a=>a.crit+=.07},
  {id:'greed', n:'값나가는 세공',max:3, r:0, ok:()=>1,
   d:()=>'골드 획득 +20%', f:()=>G.goldMul+=.2},
  {id:'ultcd', n:'가쁜 호흡',   max:4, r:0, ok:()=>1,
   d:a=>`필살기 대기 -12% (현재 ${a.ultCd.toFixed(1)}초)`, f:a=>a.ultCd*=.88},

  /* ===== 장비 전용 ===== */
  {id:'wide',  n:'폭발 확대',   max:5, r:1, ok:a=>a.trait==='blast',
   d:()=>'폭발 반경 +12%', f:a=>a.blastR*=1.12},
  {id:'chain', n:'불티 번짐',   max:3, r:1, ok:a=>a.trait==='blast',
   d:a=>`폭발이 ${a.chain+1}번 옮겨붙는다 (옮길수록 약해짐)`, f:a=>a.chain++},
  {id:'pierce',n:'꿰뚫는 촉',   max:4, r:1, ok:a=>a.trait==='shoot',
   d:a=>`화살이 ${a.pierce+2}명을 뚫는다 (뒤로 갈수록 약해짐)`, f:a=>a.pierce++},
  {id:'twin',  n:'쌍촉 화살',   max:3, r:1, ok:a=>a.trait==='shoot',
   d:a=>`화살 ${a.arrows+1}줄 (한 줄당 피해는 나뉜다)`, f:a=>a.arrows++},
  {id:'broad', n:'넓은 화살촉', max:4, r:1, ok:a=>a.trait==='shoot',
   d:()=>'화살 폭 +25%', f:a=>a.pierceW*=1.25},
  {id:'sweep', n:'긴 휘두름',   max:5, r:1, ok:a=>a.trait==='cleave',
   d:()=>'베는 범위 +14%', f:a=>a.cleaveR*=1.14},
  {id:'thorn', n:'가시 박기',   max:5, r:1, ok:a=>a.trait==='wall',
   d:a=>`맞을 때 반격 +6 (현재 ${a.thorns})`, f:a=>a.thorns+=6},
  {id:'bulk',  n:'거대한 방패', max:4, r:1, ok:a=>a.trait==='wall',
   d:()=>'적을 막는 범위 +15%', f:a=>a.blockR*=1.15},
  {id:'reach', n:'긴 자루',     max:4, r:1, ok:a=>a.trait==='melee'||a.trait==='wall',
   d:()=>'사거리 +15%', f:a=>a.range*=1.15},
  {id:'leech', n:'피 먹는 홈',  max:4, r:1, ok:()=>1,
   d:a=>`처치할 때마다 체력 +2 (현재 ${a.leech})`, f:a=>a.leech+=2},

  /* ===== 상위 ===== */
  {id:'cdmg',  n:'쪼개는 각인', max:4, r:2, ok:()=>1,
   d:a=>`치명타 피해 +30% (현재 ${Math.round(a.critD*100)}%)`, f:a=>a.critD+=.30},
  {id:'ultpow',n:'필살의 각인', max:3, r:2, ok:()=>1,
   d:a=>`필살기 피해 +25% (현재 ${Math.round(a.ultPow*100)}%)`, f:a=>a.ultPow+=.25},
  {id:'rune',  n:'파열의 룬',   max:3, r:2, ok:()=>1,
   d:()=>'적을 죽이면 작게 터진다', f:a=>a.deathBlast++},
  {id:'quick', n:'섬광 각인',   max:3, r:2, ok:()=>1,
   d:()=>'공격 속도 +18%', f:a=>a.aspd*=1.18},
  {id:'heavy', n:'무게추',      max:3, r:2, ok:()=>1,
   d:a=>`공격력 +${Math.round(a.base.atk*.30)}, 속도 -10%`,
   f:a=>{a.atk+=Math.round(a.base.atk*.30);a.aspd*=.90;}},
];
const RAR=['일반','희귀','전설'];
