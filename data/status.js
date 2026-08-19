/* ===================== 상태이상 수치 =====================
   원소 4종 튜닝 값. 로직은 combat/status.js. (DESIGN 4.1.1)
   dpsPct: 부여 단계당, 건 무기의 공격력 대비 초당 비율. */
const STATUS={
  burn:  {dur:4,  dpsPct:.20},                                 // 화상: 굵은 단일 DoT
  pois:  {dur:6,  dpsPct:.08, maxStacks:5},                    // 중독: 쌓는 DoT
  chill: {dur:3,  slow:.35, hitsToFreeze:4, freezeBase:.8, freezePerLv:.4},
  shock: {dur:3,  ampPerLv:.08},                               // 공명: 받는 피해 증폭
  tick:  .5,                                                   // DoT 판정 주기(초)
  syn:{                                                        // 시너지 카드 수치 (단계당)
    shatterPct:.15,     // 서리 파쇄: 최대 체력 비례 추가 피해
    coldcut:.20,        // 한파의 날: 한기·빙결 적에게 피해 증가
    dotAmp:.35,         // 스며드는 고통: 내 화상·중독 강화
    mixer:.15,          // 원소 공진: 상태 2종 이상 적에게 피해 증가
    spreadBase:40, spreadPerLv:20,   // 불길 전파 반경
    resoPct:.60, resoR:70,           // 공명 파열: 폭발 피해·반경
  },
};
