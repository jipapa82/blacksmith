/* ===================== 영구 성장 저장/적용 =====================
   런이 끝나면 스탯 포인트를 받고, 무기별 노드에 영구히 찍는다. (DESIGN 4.5)
   localStorage에 저장. 막히면(사생활 모드 등) 그 세션 동안만 유지된다. */
const META_KEY='blacksmith-meta-v1';
const META=(()=>{ try{
    const j=JSON.parse(localStorage.getItem(META_KEY));
    if(j&&typeof j.pts==='number'&&j.nodes){
      if(j.autoUlt===undefined)j.autoUlt=true;   // 필살기 발동 방식 (4.1.2) — 기본 자동
      if(j.gold===undefined)j.gold=0;            // 대장간 금고 (6.3) — 런의 남은 골드가 누적
      if(j.best===undefined)j.best=0;            // 최고 웨이브 기록 (3.7)
      if(j.sound===undefined)j.sound=true;       // 효과음 (7.4) — 기본 켬
      if(j.pity===undefined)j.pity={};           // 강화 천장 — 무기별 실패 누적 (4.5)
      if(j.pts>0){ j.gold+=j.pts*200; j.pts=0; } // 스탯 포인트 폐지 — 1pt = 200골드 일괄 환전 (4.5)
      /* 구 노드 저장 마이그레이션 — 스탯 4종·홈·연마를 무기 레벨 하나로 (4.5).
         레벨은 스탯 4종 중 최고 강을 승계, 홈·연마 구매액은 골드로 환급 (해금이 자동이 됐으므로) */
      for(const k of Object.keys(j.nodes||{})){
        const o=j.nodes[k];
        if(!o||(o.natk===undefined&&o.naspd===undefined&&o.nhp===undefined
          &&o.ndef===undefined&&o.nslot===undefined&&o.nult===undefined))continue;
        const lvl=Math.max(o.lvl||0,o.natk||0,o.naspd||0,o.nhp||0,o.ndef||0);
        const slotCost=[2000,8000], ultCost=[500,1500,4000];
        for(let i=0;i<(o.nslot||0);i++)j.gold+=slotCost[i]||0;
        for(let i=0;i<(o.nult||0);i++)j.gold+=ultCost[i]||0;
        const keep={};
        if(lvl)keep.lvl=lvl;
        if(o.nreroll)keep.nreroll=o.nreroll;
        if(Object.keys(keep).length)j.nodes[k]=keep; else delete j.nodes[k];
      }
      return j;
    }
  }catch(e){}
  return {pts:0, gold:0, best:0, nodes:{}, pity:{}, autoUlt:true, sound:true}; })();
function saveMeta(){ try{localStorage.setItem(META_KEY,JSON.stringify(META));}catch(e){} }

function metaRank(k,id){ return (META.nodes[k]||{})[id]||0; }
/* 현재 강화 성공률 — 기본 사다리 + 천장(실패 누적 ×3%p) */
function enhRateOf(k){
  return Math.min(1,WLEVEL.rate[metaRank(k,'lvl')]+WLEVEL.pity*(META.pity[k]||0));
}
/* 강화/구매 시도 — 골드 소모. 반환: 'ok' | 'fail'(강화 실패, 하락 없음) | false(불가)
   id 'lvl' = 무기 강화(확률), 그 외 = GLOBAL_NODES 정액 구매 */
function metaBuy(k,id){
  if(id==='lvl'){
    const r=metaRank(k,'lvl');
    if(r>=WLEVEL.max) return false;
    const c=WLEVEL.cost(r); if(META.gold<c) return false;
    META.gold-=c;
    if(Math.random()>=enhRateOf(k)){
      META.pity[k]=(META.pity[k]||0)+1;          // 실패 — 골드만 녹고 천장이 쌓인다
      saveMeta(); sfx('fail');
      return 'fail';
    }
    delete META.pity[k];
    (META.nodes[k]=META.nodes[k]||{}).lvl=r+1; saveMeta();
    sfx('hammer');                               // 무기를 두드리는 망치질 (7.4)
    return 'ok';
  }
  const n=GLOBAL_NODES.find(x=>x.id===id), r=metaRank(k,id);
  if(!n||r>=n.max) return false;
  const c=n.costs[r]; if(META.gold<c) return false;
  META.gold-=c; (META.nodes[k]=META.nodes[k]||{})[id]=r+1; saveMeta();
  sfx('hammer');
  return 'ok';
}
/* 무기(또는 '_global') 초기화 — 강화·구매 비용 전액 환급.
   실패로 녹은 골드는 돌아오지 않는다 (DESIGN 4.5) */
function metaReset(k){
  const spent=META.nodes[k]; if(!spent)return 0;
  let refund=0;
  if(spent.lvl) for(let i=0;i<spent.lvl;i++) refund+=WLEVEL.cost(i);
  for(const n of GLOBAL_NODES){ const r=spent[n.id]||0; for(let i=0;i<r;i++) refund+=n.costs[i]; }
  delete META.nodes[k]; delete META.pity[k];
  META.gold+=refund; saveMeta();
  return refund;
}

/* mkAlly가 읽는 무기별 영구 보정 — 강당 상승은 무기 성격(equipment.js의 enh)을 따른다.
   마일스톤: 2·5·10강 연마 Ⅰ·Ⅱ·Ⅲ, 3·7강 홈 확장 — 마지막 해금이 10강의 메리트. (DESIGN 4.5) */
function metaMods(k){
  const L=metaRank(k,'lvl'), g=EQUIP[k]&&EQUIP[k].enh||{};
  const ultRank=L>=10?3:L>=5?2:L>=2?1:0;
  return { atkAdd:(g.atk||0)*L, aspdAdd:(g.aspd||0)*L, hpAdd:(g.hp||0)*L, defAdd:(g.def||0)*L,
    critAdd:(g.crit||0)*L, critDmgAdd:(g.critD||0)*L,
    slots:2+(L>=3?1:0)+(L>=7?1:0),               // 3·7강에 홈 확장
    ultPow:.5+.25*ultRank,                       // 필살기는 기본 제공(50%), 강으로 연마
    ultRank };                                   // 활은 연마 축이 연사 수 (5+2×랭크)
}
/* 강당 상승 설명 — 대장간 표시용. "어떤 스탯이 얼마나"는 equipment.js의 enh 한 줄이 원본 */
function enhDesc(k){
  const g=EQUIP[k].enh||{}, p=[];
  if(g.atk)p.push('공격력 +'+g.atk);
  if(g.aspd)p.push('공속 +'+g.aspd);
  if(g.hp)p.push('체력 +'+g.hp);
  if(g.def)p.push('방어 +'+g.def);
  if(g.crit)p.push('치명 +'+Math.round(g.crit*1000)/10+'%p');
  if(g.critD)p.push('치명 피해 +'+Math.round(g.critD*100)+'%p');
  return p.join(' · ');
}
