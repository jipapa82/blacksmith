/* ===================== 행동: 필살기 / 기본 공격 / 적 이동 =====================
   규칙: 이펙트가 그려지는 그 좌표, 그 시점에만 판정한다. (DESIGN 7.2)
   setTimeout으로 연출을 나눴다면 피해 계산도 그 안에 넣는다. */
function ultimate(a){
  const live=mobs.filter(m=>m.hp>0);
  if(!live.length)return false;
  const P=a.ultPow;
  shake=6;

  if(a.trait==='melee'){                       // 회전 베기 — 자기 주위
    ring(a.x,a.y,120,'#E8963C',2);
    live.filter(m=>Math.hypot(m.x-a.x,m.y-a.y)<120).forEach(m=>hurtMob(m,atkOf(a)*2.2*P,a));
  }
  else if(a.trait==='cleave'){                 // 내려찍기 — 앞으로 3연타
    for(let i=0;i<3;i++){
      const cx=a.x+90+i*70;
      setTimeout(()=>{
        if(!running)return;
        ring(cx,a.y,90,'#E8963C',2);
        mobs.filter(m=>m.hp>0&&Math.hypot(m.x-cx,m.y-a.y)<90)
            .forEach(m=>hurtMob(m,atkOf(a)*0.9*P,a));
      },i*90);
    }
  }
  else if(a.trait==='wall'){                   // 방패 밀치기 — 근처만
    ring(a.x,a.y,135,'#8FBF6A',2.5);
    live.filter(m=>Math.hypot(m.x-a.x,m.y-a.y)<135).forEach(m=>{
      hurtMob(m,atkOf(a)*2.0*P,a);
      m.x+=80; m.stun=1.3;
    });
  }
  else if(a.trait==='shoot'){                  // 화살비 — 떨어지는 순간에 맞는다
    const x0=a.x+130, x1=W-20;
    for(let i=0;i<14;i++){
      const px=x0+Math.random()*(x1-x0), py=30+Math.random()*(H-60);
      setTimeout(()=>{
        if(!running)return;
        beam(px,-10,px,py,'#6FC9CE',4);
        ring(px,py,34,'#6FC9CE',1.6);
        mobs.filter(m=>m.hp>0&&Math.hypot(m.x-px,m.y-py)<34)
            .forEach(m=>hurtMob(m,atkOf(a)*1.5*P,a));
      },i*55);
    }
  }
  else if(a.trait==='blast'){                  // 불바다 — 앞쪽 절반, 순차 폭발
    const x0=a.x+120;
    for(let i=0;i<4;i++){
      const cx=x0+i*135;
      setTimeout(()=>{
        if(!running)return;
        ring(cx,MID_Y,115,'#9B8ACB',2.2);
        mobs.filter(m=>m.hp>0&&Math.hypot(m.x-cx,m.y-MID_Y)<115)
            .forEach(m=>hurtMob(m,atkOf(a)*0.85*P,a));
      },i*100);
    }
  }
  return true;
}
function allyAct(a){
  const live=mobs.filter(m=>m.hp>0);
  if(!live.length)return;
  const near=r=>live.filter(m=>Math.hypot(m.x-a.x,m.y-a.y)<r)
                    .sort((p,q)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(q.x-a.x,q.y-a.y));
  if(a.trait==='wall'||a.trait==='melee'){
    const t=near(a.range)[0]; if(!t)return;
    a.lung=.14; slashFx(t.x,t.y,'#E8963C'); hurtMob(t,atkOf(a),a);
  }else if(a.trait==='cleave'){
    const t=near(a.range+22); if(!t.length)return;
    a.lung=.18; ring(a.x+32,a.y,a.cleaveR,'#E8963C',.55);
    live.filter(m=>Math.hypot(m.x-(a.x+30),m.y-a.y)<a.cleaveR).forEach(m=>hurtMob(m,atkOf(a),a));
  }else if(a.trait==='shoot'){
    const rows=[];
    for(let i=0;i<a.arrows;i++){
      let best=null,bn=-1;
      live.forEach(m=>{ if(m.x<=a.x)return;
        if(rows.some(y=>Math.abs(y-m.y)<a.pierceW))return;
        const n=live.filter(o=>Math.abs(o.y-m.y)<a.pierceW&&o.x>a.x).length;
        if(n>bn){bn=n;best=m;} });
      if(!best)break;
      rows.push(best.y);
    }
    if(!rows.length)return;
    a.lung=.1;
    // 줄이 늘면 줄당 피해를 나눈다(총합 +20%씩), 관통은 한 명 뚫을 때마다 62%로 (DESIGN 7.1)
    const rowMul = a.arrows>1 ? (1+.2*(a.arrows-1))/a.arrows : 1;
    rows.forEach(y=>{
      // 가까운 순으로 정렬해 관통 수만큼만 맞춘다
      const line=live.filter(m=>Math.abs(m.y-y)<a.pierceW&&m.x>a.x)
                     .sort((p,q)=>p.x-q.x);
      const hits=line.slice(0, 1+a.pierce);
      const endX = hits.length ? hits[hits.length-1].x+14 : W;
      beam(a.x+12,a.y,endX,y,'#6FC9CE',2.5);
      hits.forEach((m,i)=>hurtMob(m,atkOf(a)*rowMul*Math.pow(.62,i),a));
    });
  }else if(a.trait==='blast'){
    let bx=0,by=0,bn=0;
    live.forEach(m=>{const n=live.filter(o=>Math.hypot(o.x-m.x,o.y-m.y)<a.blastR).length;
      if(n>bn){bn=n;bx=m.x;by=m.y;}});
    if(!bn)return;
    a.lung=.16; shake=Math.min(7,2+bn*.45);
    let cx=bx, cy=by, mult=.72;
    for(let c=0;c<=a.chain;c++){
      ring(cx,cy,a.blastR,'#9B8ACB',1);
      const hit=mobs.filter(m=>m.hp>0&&Math.hypot(m.x-cx,m.y-cy)<a.blastR);
      hit.forEach(m=>hurtMob(m,atkOf(a)*mult,a));
      if(c<a.chain){
        const rest=mobs.filter(m=>m.hp>0&&Math.hypot(m.x-cx,m.y-cy)>=a.blastR);
        if(!rest.length)break;
        rest.sort((p,q)=>Math.hypot(p.x-cx,p.y-cy)-Math.hypot(q.x-cx,q.y-cy));
        const nx=rest[0];
        beam(cx,cy,nx.x,nx.y,'#9B8ACB',2);
        cx=nx.x; cy=nx.y; mult*=.55;
      }
    }
  }
}
function mobStep(m,dt){
  const F=frontAlly(), B=anyBack();
  let tgt=null, stopD=0;
  if(m.behav==='wall'){ tgt=F||B; stopD=(tgt?tgt.r*(tgt.blockR||1):16)+m.r+3; }
  else if(m.behav==='leak'){ tgt=B||F; stopD=(tgt?tgt.r:16)+m.r+3; }
  else{ tgt=B||F; stopD=185; }
  if(!tgt)return;
  if(m.freezeT>0) return;                                  // 빙결: 행동 불가
  if(m.stun>0){ m.stun-=dt; m.x=Math.min(W+20,m.x); return; }
  const dx=tgt.x-m.x, dy=tgt.y-m.y, dist=Math.hypot(dx,dy);
  if(dist>stopD){
    const slow=m.chillT>0?(1-STATUS.chill.slow):1;         // 한기: 감속
    const s=m.mv*slow*dt/dist; m.x+=dx*s; m.y+=dy*s;
    if(m.behav==='wall'&&F&&m.x<F.x+8) m.x=F.x+8;
  }else{
    m.charge+=dt*m.aspd;
    if(m.charge>=1){ m.charge=0; m.lung=.12;
      if(m.behav==='range') beam(m.x,m.y,tgt.x,tgt.y,'#9B8ACB',2);
      else slashFx(tgt.x,tgt.y,'#C4574F');
      hurtAlly(tgt,m.atk,m); }
  }
  for(const o of mobs){
    if(o===m||o.hp<=0)continue;
    const ddx=o.x-m.x,ddy=o.y-m.y,dd=Math.hypot(ddx,ddy),mn=m.r+o.r;
    if(dd>0&&dd<mn){const p=(mn-dd)/dd*.5;m.x-=ddx*p;m.y-=ddy*p;}
  }
  m.y=Math.max(22,Math.min(H-22,m.y));
}
