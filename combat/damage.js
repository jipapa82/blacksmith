/* ===================== 피해 처리 ===================== */
function killMob(m,src){
  burst(m.x,m.y,m.color);
  G.kills++; killTxt.textContent=G.kills;
  const g=Math.round(m.gold*G.goldMul);
  G.gold+=g; goldTxt.textContent=G.gold; num(m.x,m.y-4,'+'+g,'#D9B45C');
  if(Math.random()<.16||m.type==='boss'){G.mats+=m.type==='boss'?3:1;matTxt.textContent=G.mats;}
  if(src){
    if(src.leech){src.hp=Math.min(src.maxhp,src.hp+src.leech);}
    if(src.deathBlast){ ring(m.x,m.y,34,'#E8963C',.6);
      mobs.forEach(o=>{if(o.hp>0&&o!==m&&Math.hypot(o.x-m.x,o.y-m.y)<34)hurtMob(o,src.atk*.4,src);}); }
  }
}
function hurtMob(m,dmg,src){
  if(m.hp<=0)return;
  let crit=false;
  if(src && Math.random()<src.crit){ dmg*=src.critD; crit=true; }
  const d=Math.max(1,Math.round(dmg-m.def));
  m.hp-=d; m.hit=crit?.22:.14;
  num(m.x,m.y-m.r-4, crit?d+'!':d, crit?'#FFD86B':'#E8963C', crit);
  if(m.hp<=0) killMob(m,src);
}
function hurtAlly(a,dmg,from){
  const d=Math.max(1,Math.round(dmg-a.def));
  a.hp-=d; a.hit=.14; num(a.x,a.y-a.r-6,d,'#C4574F');
  if(a.thorns&&from) hurtMob(from,a.thorns,a);
  if(a.hp<=0){burst(a.x,a.y,'#C4574F');shake=8;layoutAllies();}
}
