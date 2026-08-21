/* ===================== 피해 처리 ===================== */
function killMob(m,src){
  burst(m.x,m.y,m.color); sfx('kill');
  G.kills++; waveKills++; killTxt.textContent=G.kills;
  const g=Math.round(m.gold*G.goldMul);
  G.gold+=g; goldTxt.textContent=G.gold; num(m.x,m.y-4,'+'+g,'#D9B45C');
  gainXp(m.xp);
  dropLoot(m);
  if(src){
    const lch=src.leech+(src.gm?src.gm.leechAdd:0);          // 피 먹는 홈 + 토파즈 흡혈
    if(lch&&src.hp<maxHpOf(src)){                            // 실제로 회복될 때만 초록 숫자 (7.3 가독성)
      src.hp=Math.min(maxHpOf(src),src.hp+lch);
      num(src.x,src.y-src.r-10,'+'+lch,'#8FBF6A');
    }
    if(src.syReap&&statusCount(m)>0)                     // 갈무리: 상태이상 적 처치 → 게이지 회복
      src.ultT=Math.min(src.ultCd,src.ultT+src.ultCd*STATUS.syn.reapPct*src.syReap);
    if(src.deathBlast){ ring(m.x,m.y,34,'#E8963C',.6);
      mobs.forEach(o=>{if(o.hp>0&&o!==m&&Math.hypot(o.x-m.x,o.y-m.y)<34)hurtMob(o,atkOf(src)*.4,src);}); }
    if(src.syFirespread&&m.burn){                    // 불길 전파: 화상 중 사망 → 옮겨붙는다
      const R=STATUS.syn.spreadBase+STATUS.syn.spreadPerLv*src.syFirespread;
      ring(m.x,m.y,R,'#E8963C',1);
      mobs.forEach(o=>{ if(o.hp>0&&o!==m&&Math.hypot(o.x-m.x,o.y-m.y)<R)
        o.burn={t:STATUS.burn.dur, dps:m.burn.dps, pt:o.burn?o.burn.pt:0, src}; });
    }
    if(src.syReso&&m.shockT>0){                      // 공명 파열: 공명 중 처치 → 폭발·전파
      ring(m.x,m.y,STATUS.syn.resoR,'#9B8ACB',1.6);
      mobs.forEach(o=>{ if(o.hp>0&&o!==m&&Math.hypot(o.x-m.x,o.y-m.y)<STATUS.syn.resoR){
        hurtMob(o,atkOf(src)*STATUS.syn.resoPct*src.syReso,src);
        if(o.hp>0){o.shockT=STATUS.shock.dur[0];o.shockLv=Math.max(o.shockLv,1);
          o.shockAmp=Math.max(o.shockAmp,STATUS.shock.amp[0]);} } });
    }
  }
}
function hurtMob(m,dmg,src,isUlt){
  if(m.hp<=0)return;
  let crit=false;
  if(src && Math.random()<critOf(src)){ dmg*=src.critD+(src.gm?src.gm.critDmgAdd:0); crit=true; }  // 다이아: 치명 피해 +
  if(m.shockT>0&&m.shockAmp) dmg*=1+m.shockAmp;                       // 공명: 받는 피해 증폭 (자수정 포함)
  if(src){
    if(src.finisher&&m.hp<=m.maxhp*.3) dmg*=1+.25*src.finisher;       // 마무리 일격 — 처형
    if(src.momentum){                                                 // 몰아치기 — 같은 대상 연속 타격 누적
      if(src._cmT===m) src._cmN=Math.min(5,src._cmN+1); else {src._cmT=m; src._cmN=0;}
      dmg*=1+.06*src.momentum*src._cmN;
    }
    if(src.syColdcut&&(m.chillT>0||m.freezeT>0))
      dmg*=1+STATUS.syn.coldcut*src.syColdcut;                        // 한파의 날
    if(src.syMixer&&statusCount(m)>=2)
      dmg*=1+STATUS.syn.mixer*src.syMixer;                            // 원소 공진
    if(isUlt&&src.syHarvest)                                          // 추수: 상태이상 1종당 증가
      dmg*=1+STATUS.syn.harvestPct*src.syHarvest*statusCount(m);
    if(isUlt&&src.syDeton){                                           // 기폭: 남은 DoT를 즉시 회수
      const sc=statusCount(m);                                        // 소모 전에 센다
      let rem=0;
      if(m.burn){rem+=m.burn.dps*Math.max(0,m.burn.t); m.burn=null;}
      if(m.pois){rem+=m.pois.dps*m.pois.n*Math.max(0,m.pois.t); m.pois=null;}
      if(rem>0){
        dmg+=rem*(STATUS.syn.detBase+STATUS.syn.detPerLv*src.syDeton)*sc;  // × 상태이상 종류 수 (최대 4)
        ring(m.x,m.y,m.r+14,'#E8963C',1.6);
      }
    }
    if(src.syShatter&&m.freezeT>0){                                   // 서리 파쇄: 얼음을 깬다
      dmg+=m.maxhp*STATUS.syn.shatterPct*src.syShatter;
      m.freezeT=0; m.chillHits=0;
      ring(m.x,m.y,m.r+16,'#9AD9E8',2); shake=Math.max(shake,4);
    }
  }
  const d=Math.max(1,Math.round(dmg-m.def));
  m.hp-=d; m.hit=crit?.22:.14;
  num(m.x,m.y-m.r-4, crit?d+'!':d, crit?'#FFD86B':'#E8963C', crit);
  if(m.hp<=0){ killMob(m,src); return; }
  if(src&&src.heavyHand&&!isUlt&&m.type!=='boss')                     // 묵직한 손 — 평타가 밀어낸다
    m.x=Math.min(W+20,m.x+10*src.heavyHand);
  if(src&&m.shockT>0&&m.shockLv&&Math.random()<STATUS.shock.stagger[m.shockLv-1]){
    m.stun=Math.max(m.stun,STATUS.shock.staggerDur*(m.type==='boss'?STATUS.shock.bossStaggerMul:1));
    ring(m.x,m.y,m.r+6,'#9B8ACB',.7);                                 // 공명: 울려서 휘청인다
  }
  if(src&&src.gm) applyOnHit(src,m);                                  // 아군 적중 시 원소 부여
}
/* 사망 처리 — '마지막 숨'(웨이브당 1회)이 먼저 막는다 (DESIGN 4.1.1) */
function allyDown(a){
  if(a.lastStand&&!a.lastStandUsed){
    a.lastStandUsed=true;
    a.hp=Math.round(maxHpOf(a)*(.3+.2*(a.lastStand-1)));
    ring(a.x,a.y,a.r+14,'#D8E4EA',2); num(a.x,a.y-a.r-14,'마지막 숨','#D8E4EA',1);
    return;
  }
  burst(a.x,a.y,'#C4574F');shake=8; sfx('die');
  if(a.gm.auraRevive&&!a.reviveUsed){a.reviveUsed=true;a.reviveT=AURA.topaz.reviveT;}  // 되살리는 맥박
  layoutAllies();
}
function hurtAlly(a,dmg,from){
  if(Math.random()<dodgeOf(a)){ num(a.x,a.y-a.r-6,'회피','#D8E4EA'); return; }
  let d=Math.max(1,Math.round(dmg-defOf(a)));
  if(!a.front){                                                           // 전선 사수 — 방패가 뒷줄 피해를 나눠 받는다
    const g=allies.find(x=>x.front&&x.hp>0&&x.guard&&x!==a);
    if(g){ const t=Math.min(d-1,Math.round(d*.25*g.guard));
      if(t>0){ d-=t; g.hp-=t; g.hit=.14; g.noHitT=0;
        num(g.x,g.y-g.r-6,t,'#C4574F');
        if(g.hp<=0)allyDown(g); } }
  }
  a.hp-=d; a.hit=.14; a.noHitT=0; num(a.x,a.y-a.r-6,d,'#C4574F');
  if(a.thorns&&from) hurtMob(from,a.thorns,a);
  if(a.repel&&from&&from.hp>0){                                           // 밀치는 반격 (DESIGN 4.1.1)
    from.x=Math.min(W+20,from.x+60*a.repel); from.charge=0;               // 밀려나면 재충전도 처음부터
    ring(from.x,from.y,from.r+5,'#D8E4EA',.9);                            // 튕겨나는 게 보여야 한다 (7.3)
  }
  if(a.gm.auraFreeze&&from&&from.hp>0&&from.freezeCd<=0){                 // 서리 갑옷 (최종 사파이어)
    from.freezeT=a.gm.auraFreeze*(from.type==='boss'?STATUS.chill.bossFreezeMul:1);
    from.freezeCd=from.freezeT+STATUS.chill.immune;
    ring(from.x,from.y,from.r+10,'#9AD9E8',1.2);
  }
  if(a.hp<=0)allyDown(a);
}
