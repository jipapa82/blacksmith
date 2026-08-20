/* ===================== 행동: 필살기 / 기본 공격 / 적 이동 =====================
   규칙: 이펙트가 그려지는 그 좌표, 그 시점에만 판정한다. (DESIGN 7.2)
   setTimeout으로 연출을 나눴다면 피해 계산도 그 안에 넣는다. */

/* 대검의 타격 앵커 — 뒷줄이면 전선 기준. 공격·필살기·범위 표시가 모두 이걸 쓴다 (7.2: 표시=판정) */
function cleaveAnchor(a){
  const F=frontAlly(), anchored=!a.front&&F&&F!==a;
  return {x:anchored?F.x+45:a.x+30, y:anchored?F.y:a.y,        // 기본 공격 중심
          ux:anchored?F.x+60:a.x+90, uy:anchored?F.y:a.y};     // 내려찍기 시작점
}

/* 침투자 — 전선(앞줄)을 넘어 들어온 적. 단검(암살)의 사냥감 (DESIGN 3.3) */
function behindLine(m){
  const F=frontAlly();
  return m.x < (F?F.x+30:FRONT_X+30);
}

/* 필살기 수동 발동 — 키 1~5와 부대 카드 버튼이 부른다 (DESIGN 4.1.2) */
function fireUlt(i){
  if(!running)return false;
  const a=allies[i];
  if(!a||a.hp<=0||a.ultT<a.ultCd)return false;
  if(ultimate(a)){ a.ultT=0; return true; }
  return false;
}

/* 자동 발동 가치 판정 — 적이 뭉쳤을 때만 쏜다. 잡졸 1, 대장 4로 세어 4 이상 (DESIGN 4.1.2) */
function ultWorth(a){
  const w=m=>m.type==='boss'?4:1;
  let s=0;
  for(const m of mobs){
    if(m.hp<=0)continue;
    if(a.trait==='shoot'){ if(m.x>a.x)s+=w(m); }
    else if(a.trait==='blast'){ if(m.x>a.x)s+=w(m); }
    else if(a.trait==='cleave'){ if(m.x>a.x&&m.x<a.x+320*a.ultR&&Math.abs(m.y-a.y)<90*a.ultR)s+=w(m); }
    else if(a.trait==='assassin'){ if(behindLine(m)||m.type==='boss')s+=4; }  // 침투자나 대장이 있으면 즉시
    else{ const R=135*a.ultR; if(Math.hypot(m.x-a.x,m.y-a.y)<R)s+=w(m); }
    if(s>=4)return true;
  }
  return false;
}

function ultimate(a){
  const live=mobs.filter(m=>m.hp>0);
  if(!live.length)return false;
  const P=a.ultPow;
  shake=6;
  if(a.gm.auraHaste)hasteT=AURA.emerald.hasteDur;   // 질풍의 오라 (최종 에메랄드)

  if(a.trait==='assassin'){                    // 급소 찌르기 — 침투자 중 최대 체력 대상 일격
    const infil=live.filter(behindLine);
    const pool=infil.length?infil:live;        // 침투자가 없으면 전장 최대 체력(대장 사냥)
    const t=pool.reduce((p,q)=>q.hp>p.hp?q:p);
    const C=elemColor(a)||'#E8963C';
    beam(a.x,a.y,t.x,t.y,C,3); slashFx(t.x,t.y,C); ring(t.x,t.y,26,C,1.5);
    hurtMob(t,atkOf(a)*6.0*P,a,true);
  }
  else if(a.trait==='cleave'){                 // 내려찍기 — 전선에서 앞으로 3연타
    const R=90*a.ultR;
    const an=cleaveAnchor(a), ax=an.ux, ay=an.uy;
    for(let i=0;i<3;i++){
      const cx=ax+i*70;
      setTimeout(()=>{
        if(!running)return;
        ring(cx,ay,R,elemColor(a)||'#E8963C',2);
        mobs.filter(m=>m.hp>0&&Math.hypot(m.x-cx,m.y-ay)<R)
            .forEach(m=>hurtMob(m,atkOf(a)*0.9*P,a,true));
      },i*90);
    }
  }
  else if(a.trait==='wall'){                   // 방패 밀치기 — 근처만
    const R=135*a.ultR;
    ring(a.x,a.y,R,elemColor(a)||'#8FBF6A',2.5);
    live.filter(m=>Math.hypot(m.x-a.x,m.y-a.y)<R).forEach(m=>{
      hurtMob(m,atkOf(a)*2.0*P,a,true);
      m.x+=80; m.stun=1.3;
    });
  }
  else if(a.trait==='shoot'){                  // 질풍 연사 — 순간적으로 공속을 몰아쓴다
    const n=5+2*a.ultRank;                     // 연마 랭크당 +2발: 5/7/9/11 (DESIGN 4.5)
    for(let i=0;i<n;i++)
      setTimeout(()=>{ if(running) bowShot(a,true); }, i*110);
  }
  else if(a.trait==='blast'){                  // 불바다 — 앞쪽 절반, 순차 폭발
    const x0=a.x+120, R=115*a.ultR;
    for(let i=0;i<4;i++){
      const cx=x0+i*135;
      setTimeout(()=>{
        if(!running)return;
        ring(cx,MID_Y,R,elemColor(a)||'#9B8ACB',2.2);
        mobs.filter(m=>m.hp>0&&Math.hypot(m.x-cx,m.y-MID_Y)<R)
            .forEach(m=>hurtMob(m,atkOf(a)*0.85*P,a,true));
      },i*100);
    }
  }
  return true;
}
/* 활 사격 한 발 — 기본 공격과 필살기 '질풍 연사'가 공유한다.
   isUlt=true면 발마다 필살기 판정(기폭·추수 적용). */
function bowShot(a,isUlt){
  const live=mobs.filter(m=>m.hp>0);
  if(!live.length)return;
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
    beam(a.x+12,a.y,endX,y,elemColor(a)||'#6FC9CE',isUlt?3.5:2.5);
    hits.forEach((m,i)=>hurtMob(m,atkOf(a)*rowMul*Math.pow(.62,i),a,isUlt));
  });
}

function allyAct(a){
  const live=mobs.filter(m=>m.hp>0);
  if(!live.length)return;
  const near=r=>live.filter(m=>Math.hypot(m.x-a.x,m.y-a.y)<r)
                    .sort((p,q)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(q.x-a.x,q.y-a.y));
  if(a.trait==='wall'){
    const t=near(a.range)[0]; if(!t)return;
    a.lung=.14; slashFx(t.x,t.y,elemColor(a)||'#E8963C'); hurtMob(t,atkOf(a),a);
  }else if(a.trait==='assassin'){
    // 침투자·대장에겐 암살 일격, 아니면 무리를 질주하며 독을 바르고 온다 (DESIGN 3.3)
    const C=elemColor(a)||'#E8963C';
    const infil=live.filter(behindLine).sort((p,q)=>p.x-q.x);
    const mark=infil[0]||live.find(m=>m.type==='boss');
    if(mark){
      a.lung=.14; beam(a.x,a.y,mark.x,mark.y,C,1.5); slashFx(mark.x,mark.y,C);
      hurtMob(mark,atkOf(a)*a.ambush,a);       // 암살 일격 ('기습' 카드로 강화)
    }else{
      const path=live.slice().sort((p,q)=>p.x-q.x).slice(0,4);   // 가까운 쪽부터 최대 4명 질주
      a.lung=.14;
      let px=a.x, py=a.y;
      path.forEach(m=>{ beam(px,py,m.x,m.y,C,1.2); slashFx(m.x,m.y,C);
        hurtMob(m,atkOf(a)*.5,a); px=m.x; py=m.y; });             // 얕게 베어 독만 바른다
    }
  }else if(a.trait==='cleave'){
    // 뒷줄이면 전선 너머로 내려친다 — 방패가 세우고 대검이 부순다 (DESIGN 3.3)
    const an=cleaveAnchor(a);
    const targets=live.filter(m=>Math.hypot(m.x-an.x,m.y-an.y)<a.cleaveR);
    if(!targets.length)return;
    a.lung=.18; ring(an.x+2,an.y,a.cleaveR,elemColor(a)||'#E8963C',.55);
    targets.forEach(m=>hurtMob(m,atkOf(a),a));
  }else if(a.trait==='shoot'){
    bowShot(a,false);
  }else if(a.trait==='blast'){
    let bx=0,by=0,bn=0;
    live.forEach(m=>{const n=live.filter(o=>Math.hypot(o.x-m.x,o.y-m.y)<a.blastR).length;
      if(n>bn){bn=n;bx=m.x;by=m.y;}});
    if(!bn)return;
    a.lung=.16; shake=Math.min(7,2+bn*.45);
    let cx=bx, cy=by, mult=.72;
    for(let c=0;c<=a.chain;c++){
      ring(cx,cy,a.blastR,elemColor(a)||'#9B8ACB',1);
      const hit=mobs.filter(m=>m.hp>0&&Math.hypot(m.x-cx,m.y-cy)<a.blastR);
      hit.forEach(m=>hurtMob(m,atkOf(a)*mult,a));
      if(c<a.chain){
        const rest=mobs.filter(m=>m.hp>0&&Math.hypot(m.x-cx,m.y-cy)>=a.blastR);
        if(!rest.length)break;
        rest.sort((p,q)=>Math.hypot(p.x-cx,p.y-cy)-Math.hypot(q.x-cx,q.y-cy));
        const nx=rest[0];
        beam(cx,cy,nx.x,nx.y,elemColor(a)||'#9B8ACB',2);
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
    const slow=(m.chillT>0&&m.chillLv)?(1-STATUS.chill.slow[m.chillLv-1]):1;   // 한기: 단계별 감속
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
