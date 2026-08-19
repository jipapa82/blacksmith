/* ===================== 상태이상 로직 =====================
   원소는 카드로 무기에 부여되고(a.el*), 적중 시 여기서 적에게 상태가 걸린다.
   수치는 data/status.js의 STATUS. (DESIGN 4.1.1) */

/* 아군 적중 시 원소 적용 — hurtMob 끝에서 호출 */
function applyOnHit(src,m){
  if(m.hp<=0)return;
  const dotAmp=1+STATUS.syn.dotAmp*src.syDotamp;
  if(src.elFire){
    m.burn={t:STATUS.burn.dur, dps:atkOf(src)*STATUS.burn.dpsPct*src.elFire*dotAmp,
      pt:m.burn?m.burn.pt:0, src};
  }
  if(src.elPois){
    const n=Math.min(STATUS.pois.maxStacks,(m.pois?m.pois.n:0)+1);
    m.pois={n, t:STATUS.pois.dur, dps:atkOf(src)*STATUS.pois.dpsPct*src.elPois*dotAmp,
      pt:m.pois?m.pois.pt:0, src};
  }
  if(src.elCold){
    m.chillT=STATUS.chill.dur; m.chillHits++;
    if(m.chillHits>=STATUS.chill.hitsToFreeze&&m.freezeT<=0){
      m.chillHits=0;
      m.freezeT=STATUS.chill.freezeBase+STATUS.chill.freezePerLv*src.elCold;
      ring(m.x,m.y,m.r+10,'#9AD9E8',1.2);
    }
  }
  if(src.elShock){
    m.shockT=STATUS.shock.dur; m.shockLv=Math.max(m.shockLv,src.elShock);
  }
}

/* 이 적에게 걸린 상태이상 종류 수 (원소 공진 판정용) */
function statusCount(m){
  return (m.burn?1:0)+(m.pois?1:0)+((m.chillT>0||m.freezeT>0)?1:0)+(m.shockT>0?1:0);
}

/* 지속 피해 — 방어 무시, 치명타·원소 적용 없음 */
function dotDamage(m,d,c,src){
  if(m.hp<=0)return;
  d=Math.max(1,Math.round(d));
  m.hp-=d; num(m.x,m.y-m.r-4,d,c);
  if(m.hp<=0) killMob(m,src);
}

/* 매 프레임 상태 갱신 — combat/wave.js의 mobs 루프에서 호출 */
function statusTick(m,dt){
  if(m.freezeT>0) m.freezeT-=dt;
  if(m.chillT>0){ m.chillT-=dt; if(m.chillT<=0)m.chillHits=0; }
  if(m.shockT>0){ m.shockT-=dt; if(m.shockT<=0)m.shockLv=0; }
  if(m.burn){
    m.burn.t-=dt; m.burn.pt+=dt;
    while(m.burn&&m.burn.pt>=STATUS.tick&&m.hp>0){
      m.burn.pt-=STATUS.tick;
      dotDamage(m,m.burn.dps*STATUS.tick,'#E8963C',m.burn.src);
    }
    if(m.hp<=0)return;
    if(m.burn&&m.burn.t<=0)m.burn=null;
  }
  if(m.pois){
    m.pois.t-=dt; m.pois.pt+=dt;
    while(m.pois&&m.pois.pt>=STATUS.tick&&m.hp>0){
      m.pois.pt-=STATUS.tick;
      dotDamage(m,m.pois.dps*m.pois.n*STATUS.tick,'#8FBF6A',m.pois.src);
    }
    if(m.hp<=0)return;
    if(m.pois&&m.pois.t<=0)m.pois=null;
  }
}
