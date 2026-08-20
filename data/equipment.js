/* ===================== 장비 데이터 =====================
   용병 능력치는 0. 모든 수치는 여기서 온다. (DESIGN 2.1)
   필살기는 장비에 귀속된다. (DESIGN 3.3) */
/* elems: 이 무기에 부여할 수 있는 원소 — 설정이 어색한 조합은 아예 못 붙는다 (DESIGN 4.1.1) */
const EQUIP={
  sword: {name:'낡은 단검',  atk:15,def:1,hp:46, spd:1.25,trait:'assassin', desc:'무리를 질주하며 독을 바르고, 침투자와 대장은 일격에 벤다',
          shape:'tri',color:'#6FC9CE', elems:['pois'],
          ultName:'급소 찌르기', ultDesc:'가장 단단한 침투자의 약점을 노린다', ultCd:8},
  great: {name:'무딘 대검',  atk:30,def:3,hp:64, spd:0.50,trait:'cleave',desc:'뒷줄에서는 전선 너머로 내려쳐 무리를 부순다',
          shape:'tri',color:'#6FC9CE', elems:['shock'],
          ultName:'내려찍기', ultDesc:'땅을 갈라 앞을 쓸어버린다', ultCd:9},
  shield:{name:'참나무 방패',atk:6, def:10,hp:120,spd:0.85,trait:'wall',  desc:'적을 몸으로 막아 세운다',
          shape:'sq', color:'#8FBF6A', elems:['cold','shock'],
          ultName:'방패 밀치기', ultDesc:'적을 뒤로 밀어내고 잠시 굳힌다', ultCd:8},
  bow:   {name:'사냥 활',    atk:13,def:1,hp:40, spd:1.30,trait:'shoot', desc:'가장 붐비는 줄로 화살을 쏜다',
          shape:'dia',color:'#6FC9CE', elems:['fire','pois'],
          ultName:'질풍 연사', ultDesc:'숨을 몰아쉬며 시위를 폭풍처럼 당긴다', ultCd:8},
  wand:  {name:'불티 지팡이',atk:17,def:1,hp:36, spd:0.55,trait:'blast', desc:'가장 빽빽한 곳을 터뜨린다',
          shape:'hex',color:'#9B8ACB', elems:['fire','cold'],
          ultName:'불바다', ultDesc:'전장 절반을 불태운다', ultCd:11},
};
