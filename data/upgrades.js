/* ===================== 강화 카드 =====================
   원칙: 카드는 행동만 판다 — 수치는 보석·대장간, 원소 부여도 보석의 일 (DESIGN 4.1.1, 2026-08-21).
   일반 = 평타·필살·생존 행동, 희귀 = 무기 행동, 전설 = 시너지, 황금 = 빌드 정의.
   설명 문법: when(시점 태그) + 대상 명시("이 무기/누가 걸었든") + 정확한 수치.
   ok: 이 카드가 뜰 조건 / when: 발동 시점 / d: 설명 / f: 적용 */
const UP=[
  /* ===== 일반 — 생존 행동 ===== */
  {id:'leech', n:'피 먹는 홈',  max:4, r:0, when:'처치 시', ok:()=>1,
   d:a=>`이 무기가 적을 잡을 때마다 체력 +1 (현재 +${a.leech}, 토파즈 흡혈과 합산)`, f:a=>a.leech+=1},
  {id:'repel', n:'밀치는 반격', max:3, r:0, when:'피격 시', ok:()=>1,
   d:a=>`이 무기가 맞으면 때린 적이 ${60*(a.repel+1)}만큼 튕겨나고 공격 충전도 처음부터 — 파고드는 적을 떼어낸다`, f:a=>a.repel++},
  {id:'breath', n:'숨 고르기', max:3, r:0, when:'상시', ok:()=>1,
   d:a=>`4초간 맞지 않으면 초당 최대 체력의 ${(1.5*(a.breather+1)).toFixed(1)}%씩 회복한다`, f:a=>a.breather++},

  /* ===== 일반 — 평타·필살 강화 (카드 = 행동 변주. DESIGN 4.1.1) ===== */
  {id:'dbl',   n:'이중 타격',   max:3, r:0, when:'기본 공격', ok:()=>1,
   d:a=>`기본 공격이 ${12*(a.dblHit+1)}% 확률로 즉시 한 번 더 나간다`, f:a=>a.dblHit++},
  {id:'finish',n:'마무리 일격', max:3, r:0, when:'적중 시', ok:()=>1,
   d:a=>`체력 30% 이하의 적에게 이 무기 피해 +${25*(a.finisher+1)}%`, f:a=>a.finisher++},
  {id:'heavy', n:'묵직한 손',   max:3, r:0, when:'적중 시', ok:()=>1,
   d:a=>`기본 공격이 적을 ${10*(a.heavyHand+1)}만큼 밀어낸다 (대장 제외)`, f:a=>a.heavyHand++},
  {id:'uhaste',n:'빠른 오의',   max:3, r:0, when:'필살기', ok:()=>1,
   d:a=>`이 무기 필살기 게이지 충전 속도 +${15*(a.ultHaste+1)}%`, f:a=>a.ultHaste++},

  /* ===== 희귀 — 무기 행동 ===== */
  {id:'dash',  n:'이어지는 질주', max:3, r:1, when:'기본 공격', ok:a=>a.trait==='assassin',
   d:a=>`침투자(전선을 넘어온 적)·대장이 없을 때의 질주가 ${a.dashN+2}명을 벤다 (현재 ${a.dashN}명) — 벤 수만큼 독이 발린다`, f:a=>a.dashN+=2},
  {id:'clone', n:'그림자 분신', max:3, r:1, when:'기본 공격', ok:a=>a.trait==='assassin',
   d:a=>`기본 공격 뒤에 분신 ${a.clones+1}기가 따라 공격한다 — 피해는 30%, 독은 온전히 바른다`, f:a=>a.clones++},
  {id:'wide',  n:'폭발 확대',   max:5, r:1, when:'상시', ok:a=>a.trait==='blast',
   d:a=>`이 무기 폭발 반경 +12% (현재 ${Math.round(a.blastR)})`, f:a=>a.blastR*=1.12},
  {id:'chain', n:'불티 번짐',   max:3, r:1, when:'기본 공격', ok:a=>a.trait==='blast',
   d:a=>`폭발이 가장 가까운 적에게 ${a.chain+1}번 옮겨붙는다 — 옮길 때마다 피해가 55%로 준다`, f:a=>a.chain++},
  {id:'pierce',n:'꿰뚫는 촉',   max:4, r:1, when:'기본 공격', ok:a=>a.trait==='shoot',
   d:a=>`화살 한 발이 ${a.pierce+2}명을 꿰뚫는다 — 한 명 뚫을 때마다 피해가 62%로 준다`, f:a=>a.pierce++},
  {id:'twin',  n:'쌍촉 화살',   max:3, r:1, when:'기본 공격', ok:a=>a.trait==='shoot',
   d:a=>`화살을 ${a.arrows+1}줄로 쏜다 — 줄당 피해는 나뉘고 총합은 +20%씩 는다`, f:a=>a.arrows++},
  {id:'broad', n:'넓은 화살촉', max:4, r:1, when:'상시', ok:a=>a.trait==='shoot',
   d:a=>`화살 판정 폭 +25% (현재 ${Math.round(a.pierceW)})`, f:a=>a.pierceW*=1.25},
  {id:'sweep', n:'긴 휘두름',   max:5, r:1, when:'상시', ok:a=>a.trait==='cleave',
   d:a=>`이 무기가 베는 범위 +14% (현재 ${Math.round(a.cleaveR)})`, f:a=>a.cleaveR*=1.14},
  {id:'thorn', n:'가시 박기',   max:5, r:1, when:'피격 시', ok:a=>a.trait==='wall',
   d:a=>`이 무기가 맞으면 때린 적에게 ${a.thorns+6} 반격 피해 (현재 ${a.thorns})`, f:a=>a.thorns+=6},
  {id:'bulk',  n:'거대한 방패', max:4, r:1, when:'상시', ok:a=>a.trait==='wall',
   d:()=>'이 무기가 적을 막아 세우는 범위 +15%', f:a=>a.blockR*=1.15},
  {id:'reach', n:'긴 자루',     max:4, r:1, when:'상시', ok:a=>a.trait==='wall',
   d:a=>`이 무기 기본 공격 사거리 +15% (현재 ${Math.round(a.range)})`, f:a=>a.range*=1.15},
  {id:'guard', n:'전선 사수',   max:2, r:1, when:'피격 시', ok:a=>a.trait==='wall',
   d:a=>`뒷줄이 받는 피해의 ${25*(a.guard+1)}%를 이 무기가 대신 받는다`, f:a=>a.guard++},
  {id:'ambush', n:'기습',       max:4, r:1, when:'기본 공격', ok:a=>a.trait==='assassin',
   d:a=>`침투자(전선을 넘어온 적)·대장 일격 피해 ×${(a.ambush+.25).toFixed(2)} (현재 ×${a.ambush.toFixed(2)})`, f:a=>a.ambush+=.25},
  {id:'ultwide', n:'퍼지는 오의', max:3, r:1, when:'필살기', ok:a=>a.trait!=='shoot',
   d:a=>`이 무기 필살기 범위 +15% (현재 +${Math.round((a.ultR-1)*100)}%)`, f:a=>a.ultR*=1.15},
  {id:'momentum', n:'몰아치기', max:3, r:1, when:'적중 시', ok:()=>1,
   d:a=>`같은 적을 연속으로 때릴 때마다 피해 +${6*(a.momentum+1)}%씩 누적 (최대 5회) — 대상을 바꾸면 초기화`,
   f:a=>a.momentum++},
  {id:'echo', n:'메아리', max:2, r:1, when:'필살기', ok:()=>1,
   d:a=>`필살기 발동 후 게이지가 ${12*(a.echo+1)}% 찬 채로 시작한다`, f:a=>a.echo++},

  /* ===== 전설 — 시너지: "A 상태의 적에게 B" (상태는 누가 걸었든 판정) ===== */
  {id:'rune',  n:'파열의 룬',   max:3, r:2, when:'처치 시', ok:()=>1,
   d:a=>`이 무기로 처치한 적이 터진다 — 주위 34 안에 이 무기 공격력의 40% 피해 (${a.deathBlast+1}중첩)`, f:a=>a.deathBlast++},
  {id:'shatter', n:'서리 파쇄', max:2, r:2, when:'적중 시', ok:()=>allies.some(x=>x.elCold),
   d:a=>`이 무기가 빙결된 적을 때리면 얼음이 깨진다 — 대상 최대 체력의 ${Math.round(STATUS.syn.shatterPct*100*(a.syShatter+1))}% 추가 피해 (누가 얼렸든)`,
   f:a=>a.syShatter++},
  {id:'coldcut', n:'한파의 날', max:2, r:2, when:'상시', ok:()=>allies.some(x=>x.elCold),
   d:a=>`이 무기의 피해가 한기·빙결 상태의 적에게 +${Math.round(STATUS.syn.coldcut*100*(a.syColdcut+1))}% (누가 걸었든)`,
   f:a=>a.syColdcut++},
  {id:'firespread', n:'불길 전파', max:2, r:2, when:'처치 시', ok:a=>a.elFire>0,
   d:a=>`이 무기로 처치한 화상 중인 적이 주위 ${STATUS.syn.spreadBase+STATUS.syn.spreadPerLv*(a.syFirespread+1)} 안의 적들에게 화상을 옮긴다`,
   f:a=>a.syFirespread++},
  {id:'dotamp', n:'스며드는 고통', max:2, r:2, when:'상시', ok:a=>a.elFire>0||a.elPois>0,
   d:a=>`이 무기가 새로 거는 화상·중독의 초당 피해 +${Math.round(STATUS.syn.dotAmp*100*(a.syDotamp+1))}%`,
   f:a=>a.syDotamp++},
  {id:'reso', n:'공명 파열', max:2, r:2, when:'처치 시', ok:()=>allies.some(x=>x.elShock),
   d:a=>`이 무기로 공명 중인 적을 처치하면 폭발 — 주위 70 안에 이 무기 공격력의 ${Math.round(STATUS.syn.resoPct*100*(a.syReso+1))}% 피해 + 공명 전파 (누가 걸었든)`,
   f:a=>a.syReso++},
  {id:'mixer', n:'원소 공진', max:2, r:2, when:'상시',
   ok:()=>{const s=new Set();
     allies.forEach(x=>{if(x.elFire)s.add('f');if(x.elPois)s.add('p');if(x.elCold)s.add('c');if(x.elShock)s.add('s');});
     return s.size>=2;},
   d:a=>`이 무기의 피해가 상태이상 2종 이상 걸린 적에게 +${Math.round(STATUS.syn.mixer*100*(a.syMixer+1))}% (파티가 건 것 전부 셈)`,
   f:a=>a.syMixer++},

  {id:'laststand', n:'마지막 숨', max:2, r:2, when:'피격 시', ok:()=>1,
   d:a=>`이 무기가 죽을 피해를 받으면 체력 ${30+20*a.lastStand}%로 버틴다 — 웨이브당 1회`, f:a=>a.lastStand++},
  {id:'dblult', n:'이중 오의', max:5, r:2, when:'필살기', ok:()=>1,
   d:a=>`필살기가 잇달아 두 번 터진다 — 대신 쿨타임 +${80-20*a.dblUlt}% (단계마다 -20%p, 5단계에 0%)`,
   f:a=>{a.dblUlt++; a.ultCd=EQUIP[a.key].ultCd*(1.8-.2*(a.dblUlt-1));}},

  /* ===== 회수: 농사 짓고 필살기로 거둔다 (원소 보유 시에만) — 기폭은 황금 희귀도 ===== */
  {id:'detona', n:'기폭', max:2, r:3, when:'필살기', ok:()=>allies.some(x=>x.elFire||x.elPois),
   d:a=>`이 무기의 필살기에 맞은 적의 화상·중독을 소모해 터뜨린다 — 남은 지속 피해 × ${Math.round((STATUS.syn.detBase+STATUS.syn.detPerLv*(a.syDeton+1))*100)}% × 걸린 상태이상 종류 수(최대 4)를 즉시 피해로`,
   f:a=>a.syDeton++},
  {id:'harvest', n:'추수', max:2, r:2, when:'필살기',
   ok:()=>allies.some(x=>x.elFire||x.elPois||x.elCold||x.elShock),
   d:a=>`이 무기의 필살기 피해가 대상의 상태이상 1종당 +${Math.round(STATUS.syn.harvestPct*100*(a.syHarvest+1))}% (누가 걸었든)`,
   f:a=>a.syHarvest++},
  {id:'reap', n:'갈무리', max:2, r:2, when:'처치 시',
   ok:()=>allies.some(x=>x.elFire||x.elPois||x.elCold||x.elShock),
   d:a=>`이 무기가 상태이상 걸린 적을 처치하면 이 무기 필살기 게이지 +${Math.round(STATUS.syn.reapPct*100*(a.syReap+1))}%`,
   f:a=>a.syReap++},
];
const RAR=['일반','희귀','전설','황금'];   // 황금 = 빌드를 정의하는 카드 (웨이브 램프, 최대 3%)
