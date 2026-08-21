/* ===================== 보석 데이터 =====================
   6종 × 5단계, 순수 스탯. (DESIGN 4.2)
   kind: mul = 배율(%), add = 가산. v[단계-1] = 효과량.
   단계당 가치는 합성 비용(2개→1개, 지수)을 따라 오른다. */
/* elem: 매칭 원소, syn[등급-1]: 시너지 크기 (DESIGN 4.2)
   시너지는 그 원소가 확정된 무기의 홈에서만 발현된다 — 효과 자체가 원소 전용이라 저절로.
   기본 스탯(v)은 어느 무기에서든 그대로 — 꽝 없음 원칙 유지. */
const GEMS={
  ruby:    {name:'루비',      color:'#E05252', stat:'atk',   kind:'mul', desc:'공격력',
            v:[.06,.10,.16,.26,.42], elem:'fire',  syn:[.10,.20,.30,.40,.50]},  // 화상 피해 +
  emerald: {name:'에메랄드',  color:'#5FBF6A', stat:'aspd',  kind:'mul', desc:'공격 속도',
            v:[.05,.08,.13,.21,.34], elem:'pois',  syn:[1,2,3,4,5]},            // 중독 중첩 상한 +
  sapphire:{name:'사파이어',  color:'#5A8FD9', stat:'hp',    kind:'mul', desc:'최대 체력',
            v:[.07,.12,.19,.30,.48], elem:'cold',  syn:[.10,.20,.30,.40,.50]},  // 빙결 지속 +
  /* 무색 2종은 원소 시너지 대신 이중 스탯 (2026-08-21) — 토파즈+다이아 = 치명 빌드 */
  topaz:   {name:'토파즈',    color:'#E0C050', stat:'crit',  kind:'add', desc:'치명타 확률',
            v:[.04,.07,.11,.17,.26], elem:null,                                 // 번개 추가 시 승격 후보
            stat2:'leech', desc2:'처치 시 회복', v2:[1,1,2,3,4]},
  amethyst:{name:'자수정',    color:'#9B6FD0', stat:'def',   kind:'add', desc:'방어',
            v:[1,2,4,6,10],          elem:'shock', syn:[.02,.04,.06,.08,.10]},  // 공명 증폭 +
  diamond: {name:'다이아몬드',color:'#D8E4EA', stat:'dodge', kind:'add', desc:'회피',
            v:[.03,.05,.08,.13,.20], elem:null,                                 // 치명 피해의 유일한 공급처
            stat2:'critD', desc2:'치명타 피해', v2:[.10,.18,.28,.42,.60]},
};
const GEM_MAX_GRADE=5;
const FINAL_GRADE=6;                       // 최종 보석 — 5단계 둘을 전용 합성대에서 (DESIGN 4.4)
const GRADE_TXT=['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','최종'];

/* 최종 보석의 오라 — 스탯은 5단계와 같고 이것이 실질 가치다 */
const AURA={
  ruby:    {n:'타오르는 오라', d:'파티 전체 공격력 +12%', atkMul:.12},
  emerald: {n:'질풍의 오라',   d:'이 무기가 필살기를 쓰면 3초간 파티 공속 +30%', haste:.30, hasteDur:3},
  sapphire:{n:'서리 갑옷',     d:'이 무기를 때린 적은 1초 빙결', freezeDur:1},
  topaz:   {n:'되살리는 맥박', d:'착용 용병 사망 시 2초 후 체력 50%로 부활 (런당 1회)', reviveT:2, reviveHp:.5},
  amethyst:{n:'견고한 오라',   d:'파티 전체 방어 +3', defAdd:3},
  diamond: {n:'꿰뚫는 빛',     d:'이 무기의 도트에도 치명타가 적용된다'},
};

/* 드랍 튜닝 — 홈은 시작 2칸뿐이다. 초반엔 귀하게, 후반엔 합성 재료로 쌓이게.
   웨이브가 길어진 만큼(마릿수 28→36) 확률을 4%→3%로 내려 웨이브당 개수는 유지 (2026-08-20).
   rate: 잡졸 드랍 확률 / gradeUpPerWave: 웨이브당 +1단계 드랍 확률 증가 / bossGems: 대장 확정 개수 */
const GEM_DROP={rate:.03, gradeUpPerWave:.02, bossGems:2};
