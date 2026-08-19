/* ===================== 피해 처리 ===================== */
function killMob(m,src){
  burst(m.x,m.y,m.color);
  G.kills++; waveKills++; killTxt.textContent=G.kills;
  const g=Math.round(m.gold*G.goldMul);
  G.gold+=g; goldTxt.textContent=G.gold; num(m.x,m.y-4,'+'+g,'#D9B45C');
  if(Math.random()<.16||m.type==='boss'){G.mats+=m.type==='boss'?3:1;matTxt.textContent=G.mats;}
  gainXp(m.xp);
  dropLoot(m);
  if(src){
    if(src.leech){src.hp=Math.min(maxHpOf(src),src.hp+src.leech);}
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
        if(o.hp>0){o.shockT=STATUS.shock.dur;o.shockLv=Math.max(o.shockLv,1);} } });
    }
  }
}
function hurtMob(m,dmg,src){
  if(m.hp<=0)return;
  let crit=false;
  if(src && Math.random()<critOf(src)){ dmg*=src.critD; crit=true; }
  if(m.shockT>0) dmg*=1+STATUS.shock.ampPerLv*m.shockLv;              // 공명: 받는 피해 증폭
  if(src){
    if(src.syColdcut&&(m.chillT>0||m.freezeT>0))
      dmg*=1+STATUS.syn.coldcut*src.syColdcut;                        // 한파의 날
    if(src.syMixer&&statusCount(m)>=2)
      dmg*=1+STATUS.syn.mixer*src.syMixer;                            // 원소 공진
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
  if(src&&src.gm) applyOnHit(src,m);                                  // 아군 적중 시 원소 부여
}
function hurtAlly(a,dmg,from){
  if(Math.random()<dodgeOf(a)){ num(a.x,a.y-a.r-6,'회피','#D8E4EA'); return; }
  const d=Math.max(1,Math.round(dmg-defOf(a)));
  a.hp-=d; a.hit=.14; num(a.x,a.y-a.r-6,d,'#C4574F');
  if(a.thorns&&from) hurtMob(from,a.thorns,a);
  if(a.hp<=0){burst(a.x,a.y,'#C4574F');shake=8;layoutAllies();}
}
