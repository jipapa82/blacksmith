/* ===================== 상태이상 수치 =====================
   원소 4종 튜닝 값. 로직은 combat/status.js. (DESIGN 4.1.1)
   dpsPct: 부여 단계당, 건 무기의 공격력 대비 초당 비율. */
const STATUS={
  /* 단계별 배열 [1단계, 2단계, 3단계] — 단계가 오르면 여러 축이 같이 자란다 (4.1.1) */
  burn:  {dur:[4,5,6],  dpsPct:[.20,.40,.60]},                 // 화상: 굵은 단일 DoT
  pois:  {dur:6,  dpsPct:[.08,.16,.24], maxStacks:[5,6,8]},    // 중독: 쌓는 DoT
  chill: {dur:3,  slow:[.20,.35,.50], hitsToFreeze:5, freezeDur:[1.2,1.6,2.0],   // 필요 적중은 고정 — 단계로 줄이면 너무 빨리 언다
          immune:4, bossFreezeMul:.5},   // 재빙결 유예(초) — 무한 빙결 방지 / 대장은 절반만 언다
  shock: {dur:[3,4,5],  amp:[.08,.16,.24],                     // 공명: 받는 피해 증폭
          stagger:[.10,.15,.20], staggerDur:.3, bossStaggerMul:.5},  // + 맞으면 확률로 휘청(경직)
  tick:  .5,                                                   // DoT 판정 주기(초)
  syn:{                                                        // 시너지 카드 수치 (단계당)
    shatterPct:.15,     // 서리 파쇄: 최대 체력 비례 추가 피해
    coldcut:.20,        // 한파의 날: 한기·빙결 적에게 피해 증가
    dotAmp:.35,         // 스며드는 고통: 내 화상·중독 강화
    mixer:.15,          // 원소 공진: 상태 2종 이상 적에게 피해 증가
    spreadBase:40, spreadPerLv:20,   // 불길 전파 반경
    resoPct:.60, resoR:70,           // 공명 파열: 폭발 피해·반경
    harvestPct:.20,     // 추수: 필살기 피해, 상태이상 1종당
    detBase:.5, detPerLv:.5,         // 기폭: 남은 지속 피해 회수 배율 (1단계 100%, 2단계 150%)
    reapPct:.03,        // 갈무리: 상태이상 적 처치 시 필살기 게이지 회복
  },
};
