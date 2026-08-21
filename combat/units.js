/* ===================== 유닛 생성/배치 ===================== */
function mkAlly(k,i,front){
  const e=EQUIP[k], mm=metaMods(k);   // 영구 강화 보정 (DESIGN 4.5)
  const a={key:k, name:'용병 '+String.fromCharCode(65+i), eq:e.name, trait:e.trait, shape:e.shape, color:e.color,
    base:{atk:e.atk,hp:e.hp},
    atk:e.atk+mm.atkAdd, def:e.def+mm.defAdd,
    maxhp:e.hp+mm.hpAdd, hp:0, aspd:e.spd+mm.aspdAdd, charge:0,
    front, x:front?FRONT_X:BACK_X, y:MID_Y, r:front?18:15, hit:0, lung:0,
    blastR:60, pierceW:14, arrows:1, pierce:0, chain:0, cleaveR:56, thorns:0, blockR:1, range:72,
    ambush:1.8, dashN:3, clones:0,                                 // 암살: 일격 배수 / 질주 대상 수 / 그림자 분신 수
    leech:0, deathBlast:0, repel:0,
    crit:.05+mm.critAdd, critD:1.5+mm.critDmgAdd,                  // 강화로 오르는 치명(무기 성격, 4.5)
    elFire:0, elPois:0, elCold:0, elShock:0,                       // 원소 부여 단계
    syShatter:0, syColdcut:0, syFirespread:0, syDotamp:0, syReso:0, syMixer:0,   // 시너지 단계
    syDeton:0, syHarvest:0, syReap:0,                                            // 회수 시너지 (필살기)
    ultCd:e.ultCd, ultT:e.ultCd*.5, ultPow:mm.ultPow, ultRank:mm.ultRank, ultR:1, ultWait:0, dblUlt:0,
    dblHit:0, finisher:0, heavyHand:0, momentum:0, _cmT:null, _cmN:0,   // 평타 강화 (4.1.1)
    ultHaste:0, echo:0,                                                 // 필살 강화 (4.1.2)
    breather:0, guard:0, lastStand:0, lastStandUsed:false, noHitT:0,    // 생존 행동 (4.1.1)
    sock:Array(mm.slots).fill(null), gm:null,
    reviveUsed:false, reviveT:0,                                   // 되살리는 맥박 (최종 토파즈)
    lv:{}, mods:[]};
  recalcGems(a); a.hp=maxHpOf(a);
  return a;
}
function layoutAllies(){
  const backs=allies.filter(a=>!a.front);
  const gap=Math.min(64, (H-90)/Math.max(1,backs.length));
  backs.forEach((a,i)=>{ a.x=BACK_X; a.y=MID_Y+(i-(backs.length-1)/2)*gap; });
  const f=allies.find(a=>a.front); if(f){f.x=FRONT_X;f.y=MID_Y;}
}
function hireMerc(k){
  const a=mkAlly(k,allies.length,false);
  a.name=nextMercName(); a.mods.push('고용');
  allies.push(a); layoutAllies();
}
function mkMob(type){
  const f=FOE[type], m=foeMul*waveScale(waveIdx);
  /* 경험치는 웨이브마다 +6% — 후반 웨이브가 길어져도 레벨업(판단) 밀도를 유지한다 (DESIGN 8.2) */
  return{type,name:f.name,behav:f.behav,color:f.color,r:f.r,gold:f.gold,xp:Math.round(f.xp*(1+waveIdx*.06)),
    /* 공격력 성장은 최소한(+6%/웨이브, 기본치 -40%와 세트) — 압박은 물량·체력이 담당한다 (DESIGN 8.2) */
    hp:Math.round(f.hp*m),maxhp:Math.round(f.hp*m),atk:Math.round(f.atk*(1+waveIdx*.06)*foeMul),
    def:Math.round(f.def*(1+waveIdx*.07)*foeMul),
    mv:f.mv*(1+waveIdx*.015),aspd:f.aspd,charge:Math.random()*.5,
    x:W-6+Math.random()*44,y:34+Math.random()*(H-68),hit:0,lung:0,stun:0,
    burn:null,pois:null,chillT:0,chillHits:0,chillLv:0,freezeT:0,freezeCd:0,shockT:0,shockLv:0,shockAmp:0};
}

/* ===== 보석 스탯 반영 (DESIGN 4.2) =====
   장착된 보석의 합을 a.gm에 캐시해두고, 전투 계산은 아래 *Of() 접근자만 쓴다. */
function recalcGems(a){
  const gm={atkMul:1,aspdMul:1,hpMul:1,defAdd:0,critAdd:0,dodgeAdd:0,
    leechAdd:0,critDmgAdd:0,                     // 무색 보석의 2번째 스탯 (4.2)
    synFire:0,synPois:0,synCold:0,synShock:0,    // 보석×원소 시너지 합 (DESIGN 4.2)
    auraFreeze:0,auraRevive:false,auraDotCrit:false,auraHaste:false};  // 최종 보석 오라 (4.4)
  a.sock.forEach(s=>{ if(!s)return;
    const g=GEMS[s.type], gi=Math.min(s.grade,GEM_MAX_GRADE)-1, v=g.v[gi];
    if(g.stat==='atk')gm.atkMul+=v; else if(g.stat==='aspd')gm.aspdMul+=v;
    else if(g.stat==='hp')gm.hpMul+=v; else if(g.stat==='crit')gm.critAdd+=v;
    else if(g.stat==='def')gm.defAdd+=v; else gm.dodgeAdd+=v;
    if(g.stat2){ const v2=g.v2[gi];
      if(g.stat2==='leech')gm.leechAdd+=v2; else if(g.stat2==='critD')gm.critDmgAdd+=v2; }
    if(g.elem){ const sv=g.syn[gi];
      if(g.elem==='fire')gm.synFire+=sv; else if(g.elem==='pois')gm.synPois+=sv;
      else if(g.elem==='cold')gm.synCold+=sv; else gm.synShock+=sv; }
    if(s.grade>=FINAL_GRADE){                    // 자기 무기에 붙는 오라 (파티 오라는 recalcAuras)
      if(s.type==='sapphire')gm.auraFreeze=AURA.sapphire.freezeDur;
      else if(s.type==='topaz')gm.auraRevive=true;
      else if(s.type==='diamond')gm.auraDotCrit=true;
      else if(s.type==='emerald')gm.auraHaste=true;
    } });
  a.gm=gm;
  /* 원소는 보석에서 온다 (DESIGN 4.2) — 1번 홈이 "원소 홈":
     거기 끼운 유색 보석이(허용 원소일 때만) 원소를 부여하고, 그 등급이 단계를 정한다:
     Ⅰ~Ⅱ=1, Ⅲ~Ⅳ=2, Ⅴ+=3 (합성이 곧 심화). 다른 홈의 원소 보석은 스탯·시너지만.
     허용 밖·무색이면 원소 없음 — 스탯은 그대로 (꽝 없음) */
  a.elFire=a.elPois=a.elCold=a.elShock=0;
  const s0=a.sock[0];
  if(s0){
    const ge=GEMS[s0.type].elem;
    if(ge&&EQUIP[a.key].elems.indexOf(ge)>=0){
      const gr=Math.min(s0.grade,GEM_MAX_GRADE);
      const lv=gr>=5?3:gr>=3?2:1;
      if(ge==='fire')a.elFire=lv; else if(ge==='pois')a.elPois=lv;
      else if(ge==='cold')a.elCold=lv; else a.elShock=lv;
    }
  }
}
/* 파티 오라 (최종 루비·자수정) — 살아 있는 착용자 기준, 매 스텝 갱신 */
let AURA_ATK=1, AURA_DEF=0;
function recalcAuras(){
  AURA_ATK=1; AURA_DEF=0;
  allies.forEach(a=>{ if(a.hp<=0)return;
    a.sock.forEach(s=>{ if(!s||s.grade<FINAL_GRADE)return;
      if(s.type==='ruby')AURA_ATK+=AURA.ruby.atkMul;
      else if(s.type==='amethyst')AURA_DEF+=AURA.amethyst.defAdd; }); });
}

/* 최종 스탯 = (기본+강화 정수) × (1+보석 합) × 오라 — 카드는 수치를 팔지 않는다 (DESIGN 4.1.1) */
function atkOf(a){ return Math.round(a.atk*a.gm.atkMul*AURA_ATK); }
function aspdOf(a){ return a.aspd*a.gm.aspdMul*(hasteT>0?1+AURA.emerald.haste:1); }
function defOf(a){ return a.def+a.gm.defAdd+AURA_DEF; }
function critOf(a){ return a.crit+a.gm.critAdd; }
function dodgeOf(a){ return Math.min(.6,a.gm.dodgeAdd); }
function maxHpOf(a){ return Math.round(a.maxhp*a.gm.hpMul); }

/* 자주 쓰는 선택자 */
const liveAllies=()=>allies.filter(a=>a.hp>0);
const frontAlly=()=>allies.find(a=>a.front&&a.hp>0);
const backAllies=()=>allies.filter(a=>!a.front&&a.hp>0);
const anyBack=()=>{const b=backAllies();return b.length?b[Math.floor(Math.random()*b.length)]:null;};
