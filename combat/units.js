/* ===================== 유닛 생성/배치 ===================== */
function mkAlly(k,i,front){
  const e=EQUIP[k];
  return{key:k, name:'용병 '+String.fromCharCode(65+i), eq:e.name, trait:e.trait, shape:e.shape, color:e.color,
    base:{atk:e.atk,hp:e.hp}, atk:e.atk, def:e.def, maxhp:e.hp, hp:e.hp, aspd:e.spd, charge:0,
    front, x:front?FRONT_X:BACK_X, y:MID_Y, r:front?18:15, hit:0, lung:0,
    blastR:60, pierceW:14, arrows:1, pierce:0, chain:0, cleaveR:56, thorns:0, blockR:1, range:72,
    leech:0, deathBlast:0, crit:.05, critD:1.5,
    ultCd:e.ultCd, ultT:e.ultCd*.5, ultPow:1, lv:{}, mods:[]};
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
  return{type,name:f.name,behav:f.behav,color:f.color,r:f.r,gold:f.gold,
    hp:Math.round(f.hp*m),maxhp:Math.round(f.hp*m),atk:Math.round(f.atk*(1+waveIdx*.08)*foeMul),
    def:Math.round(f.def*(1+waveIdx*.07)*foeMul),
    mv:f.mv*(1+waveIdx*.015),aspd:f.aspd,charge:Math.random()*.5,
    x:W-6+Math.random()*44,y:34+Math.random()*(H-68),hit:0,lung:0,stun:0};
}

/* 자주 쓰는 선택자 */
const liveAllies=()=>allies.filter(a=>a.hp>0);
const frontAlly=()=>allies.find(a=>a.front&&a.hp>0);
const backAllies=()=>allies.filter(a=>!a.front&&a.hp>0);
const anyBack=()=>{const b=backAllies();return b.length?b[Math.floor(Math.random()*b.length)]:null;};
