/* ===================== 적 데이터 =====================
   행동 3가지: wall(앞줄에 막힘) / leak(뒤로 파고듦) / range(멀리서 뒷줄을 쏨)
   행동이 다르므로 "탱커만 단단하면 끝"이 되지 않는다. (DESIGN 3.4) */
const FOE={
  rush:   {name:'돌격병',hp:26, atk:8, def:1,mv:34,aspd:1.0, r:9, color:'#C4574F',behav:'wall', gold:2},
  breaker:{name:'돌파병',hp:20, atk:11,def:0,mv:62,aspd:1.1, r:8, color:'#E8963C',behav:'leak', gold:3},
  archer: {name:'궁수',  hp:18, atk:9, def:0,mv:30,aspd:0.7, r:8, color:'#9B8ACB',behav:'range',gold:3},
  boss:   {name:'대장',  hp:230,atk:24,def:5,mv:20,aspd:0.55,r:17,color:'#8B4A44',behav:'wall', gold:40},
};
