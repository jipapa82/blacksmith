/* ===================== 상태이상 로직 =====================
   원소는 카드로 무기에 부여되고(a.el*), 적중 시 여기서 적에게 상태가 걸린다.
   수치는 data/status.js의 STATUS. (DESIGN 4.1.1) */

/* 이 무기의 원소 — 1무기 1원소, 처음 고른 부여가 정한다 (DESIGN 4.1.1) */
function elemOf(a){
  return a.elFire?'fire':a.elPois?'pois':a.elCold?'cold':a.elShock?'shock':null;
}
function elemColor(a){
  const e=elemOf(a);
  return e==='fire'?'#E8963C':e==='pois'?'#8FBF6A':e==='cold'?'#9AD9E8':e==='shock'?'#9B8ACB':null;
}
/* 이 무기가 원소 e를 (더) 부여받을 수 있는가 — 무기별 허용 목록 + 1무기 1원소 */
function elemOk(a,e){
  return EQUIP[a.key].elems.includes(e)&&(!elemOf(a)||elemOf(a)===e);
}

/* 아군 적중 시 원소 적용 — hurtMob 끝에서 호출 */
function applyOnHit(src,m){
  if(m.hp<=0)return;
  const dotAmp=1+STATUS.syn.dotAmp*src.syDotamp;
  if(src.elFire){
    m.burn={t:STATUS.burn.dur[src.elFire-1],
      dps:atkOf(src)*STATUS.burn.dpsPct[src.elFire-1]*dotAmp*(1+src.gm.synFire),  // 루비 시너지
      pt:m.burn?m.burn.pt:0, src};
  }
  if(src.elPois){
    const cap=STATUS.pois.maxStacks[src.elPois-1]+src.gm.synPois;                 // 에메랄드: 중첩 상한 +
    const n=Math.min(cap,(m.pois?m.pois.n:0)+1);
    m.pois={n, t:STATUS.pois.dur, dps:atkOf(src)*STATUS.pois.dpsPct[src.elPois-1]*dotAmp,
      pt:m.pois?m.pois.pt:0, src};
  }
  if(src.elCold){
    m.chillT=STATUS.chill.dur;
    m.chillLv=Math.max(m.chillLv,src.elCold);              // 감속 세기는 건 무기의 단계
    if(m.freezeCd<=0){                                     // 재빙결 유예 중엔 카운트도 안 쌓인다
      m.chillHits++;
      if(m.chillHits>=STATUS.chill.hitsToFreeze){
        m.chillHits=0;
        m.freezeT=STATUS.chill.freezeDur[src.elCold-1]*(1+src.gm.synCold)          // 사파이어: 빙결 지속 +
                  *(m.type==='boss'?STATUS.chill.bossFreezeMul:1);
        m.freezeCd=m.freezeT+STATUS.chill.immune;
        ring(m.x,m.y,m.r+10,'#9AD9E8',1.2);
      }
    }
  }
  if(src.elShock){
    m.shockT=STATUS.shock.dur[src.elShock-1];
    m.shockLv=Math.max(m.shockLv,src.elShock);
    m.shockAmp=Math.max(m.shockAmp,STATUS.shock.amp[src.elShock-1]+src.gm.synShock);  // 자수정: 증폭 +
  }
}

/* 이 적에게 걸린 상태이상 종류 수 (원소 공진 판정용) */
function statusCount(m){
  return (m.burn?1:0)+(m.pois?1:0)+((m.chillT>0||m.freezeT>0)?1:0)+(m.shockT>0?1:0);
}

/* 지속 피해 — 방어 무시, 원소 재적용 없음.
   치명타도 없음 — 단, 최종 다이아(꿰뚫는 빛) 착용 무기의 도트는 치명타가 터진다 */
function dotDamage(m,d,c,src){
  if(m.hp<=0)return;
  let crit=false;
  if(src&&src.gm&&src.gm.auraDotCrit&&Math.random()<critOf(src)){
    d*=src.critD+src.gm.critDmgAdd; crit=true;
  }
  d=Math.max(1,Math.round(d));
  m.hp-=d; num(m.x,m.y-m.r-4,crit?d+'!':d,crit?'#FFD86B':c,crit);
  if(m.hp<=0) killMob(m,src);
}

/* 매 프레임 상태 갱신 — combat/wave.js의 mobs 루프에서 호출 */
function statusTick(m,dt){
  if(m.freezeT>0) m.freezeT-=dt;
  if(m.freezeCd>0) m.freezeCd-=dt;
  if(m.chillT>0){ m.chillT-=dt; if(m.chillT<=0){m.chillHits=0;m.chillLv=0;} }
  if(m.shockT>0){ m.shockT-=dt; if(m.shockT<=0){m.shockLv=0;m.shockAmp=0;} }
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
