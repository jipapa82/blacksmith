/* ===================== 보석 데이터 =====================
   6종 × 5단계, 순수 스탯. (DESIGN 4.2)
   kind: mul = 배율(%), add = 가산. v[단계-1] = 효과량.
   단계당 가치는 합성 비용(2개→1개, 지수)을 따라 오른다. */
const GEMS={
  ruby:    {name:'루비',      color:'#E05252', stat:'atk',   kind:'mul', desc:'공격력',
            v:[.06,.10,.16,.26,.42]},
  emerald: {name:'에메랄드',  color:'#5FBF6A', stat:'aspd',  kind:'mul', desc:'공격 속도',
            v:[.05,.08,.13,.21,.34]},
  sapphire:{name:'사파이어',  color:'#5A8FD9', stat:'hp',    kind:'mul', desc:'최대 체력',
            v:[.07,.12,.19,.30,.48]},
  topaz:   {name:'토파즈',    color:'#E0C050', stat:'crit',  kind:'add', desc:'치명타 확률',
            v:[.04,.07,.11,.17,.26]},
  amethyst:{name:'자수정',    color:'#9B6FD0', stat:'def',   kind:'add', desc:'방어',
            v:[1,2,4,6,10]},
  diamond: {name:'다이아몬드',color:'#D8E4EA', stat:'dodge', kind:'add', desc:'회피',
            v:[.03,.05,.08,.13,.20]},
};
const GEM_MAX_GRADE=5;
const GRADE_TXT=['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ'];

/* 드랍 튜닝 — 홈은 시작 2칸뿐이다. 초반엔 귀하게, 후반엔 합성 재료로 쌓이게.
   rate: 잡졸 드랍 확률 / gradeUpPerWave: 웨이브당 +1단계 드랍 확률 증가 / bossGems: 대장 확정 개수 */
const GEM_DROP={rate:.04, gradeUpPerWave:.02, bossGems:2};
