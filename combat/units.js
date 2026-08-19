/* ===================== 유닛 생성/배치 ===================== */
function mkAlly(k,i,front){
  const e=EQUIP[k], mm=metaMods(k);   // 영구 노드 보정 (DESIGN 4.5)
  const a={key:k, name:'용병 '+String.fromCharCode(65+i), eq:e.name, trait:e.trait, shape:e.shape, color:e.color,
    base:{atk:e.atk,hp:e.hp},
    atk:Math.round(e.atk*mm.atkMul), def:e.def+mm.defAdd,
    maxhp:Math.round(e.hp*mm.hpMul), hp:0, aspd:e.spd*mm.aspdMul, charge:0,
    front, x:front?FRONT_X:BACK_X, y:MID_Y, r:front?18:15, hit:0, lung:0,
    blastR:60, pierceW:14, arrows:1, pierce:0, chain:0, cleaveR:56, thorns:0, blockR:1, range:72,
    leech:0, deathBlast:0, crit:.05, critD:1.5,
    elFire:0, elPois:0, elCold:0, elShock:0,                       // 원소 부여 단계
    syShatter:0, syColdcut:0, syFirespread:0, syDotamp:0, syReso:0, syMixer:0,   // 시너지 단계
    syDeton:0, syHarvest:0, syReap:0,                                            // 회수 시너지 (필살기)
    ultOn:mm.ultOn, ultCd:e.ultCd, ultT:e.ultCd*.5, ultPow:1,
    sock:Array(mm.slots).fill(null), gm:null,
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
  return{type,name:f.name,behav:f.behav,color:f.color,r:f.r,gold:f.gold,xp:f.xp,
    hp:Math.round(f.hp*m),maxhp:Math.round(f.hp*m),atk:Math.round(f.atk*(1+waveIdx*.08)*foeMul),
    def:Math.round(f.def*(1+waveIdx*.07)*foeMul),
    mv:f.mv*(1+waveIdx*.015),aspd:f.aspd,charge:Math.random()*.5,
    x:W-6+Math.random()*44,y:34+Math.random()*(H-68),hit:0,lung:0,stun:0,
    burn:null,pois:null,chillT:0,chillHits:0,chillLv:0,freezeT:0,shockT:0,shockLv:0};
}

/* ===== 보석 스탯 반영 (DESIGN 4.2) =====
   장착된 보석의 합을 a.gm에 캐시해두고, 전투 계산은 아래 *Of() 접근자만 쓴다. */
function recalcGems(a){
  const gm={atkMul:1,aspdMul:1,hpMul:1,defAdd:0,critAdd:0,dodgeAdd:0};
  a.sock.forEach(s=>{ if(!s)return;
    const g=GEMS[s.type], v=g.v[s.grade-1];
    if(g.stat==='atk')gm.atkMul+=v; else if(g.stat==='aspd')gm.aspdMul+=v;
    else if(g.stat==='hp')gm.hpMul+=v; else if(g.stat==='crit')gm.critAdd+=v;
    else if(g.stat==='def')gm.defAdd+=v; else gm.dodgeAdd+=v; });
  a.gm=gm;
}
function atkOf(a){ return Math.round(a.atk*a.gm.atkMul); }
function aspdOf(a){ return a.aspd*a.gm.aspdMul; }
function defOf(a){ return a.def+a.gm.defAdd; }
function critOf(a){ return a.crit+a.gm.critAdd; }
function dodgeOf(a){ return Math.min(.6,a.gm.dodgeAdd); }
function maxHpOf(a){ return Math.round(a.maxhp*a.gm.hpMul); }

/* 자주 쓰는 선택자 */
const liveAllies=()=>allies.filter(a=>a.hp>0);
const frontAlly=()=>allies.find(a=>a.front&&a.hp>0);
const backAllies=()=>allies.filter(a=>!a.front&&a.hp>0);
const anyBack=()=>{const b=backAllies();return b.length?b[Math.floor(Math.random()*b.length)]:null;};
