/* ===================== 행동: 필살기 / 기본 공격 / 적 이동 =====================
   규칙: 이펙트가 그려지는 그 좌표, 그 시점에만 판정한다. (DESIGN 7.2)
   연출 지연은 실제 시간이 아니라 게임 시간으로 — 레벨업 일시정지 중엔 멈췄다가 이어진다. */
let delayed=[];                                  // 게임 시간 지연 실행 큐 — wave.js의 step이 돌린다
function after(ms,fn){ delayed.push({t:ms/1000,fn}); }

/* ===== 투사체 (DESIGN 7.5) — 화살이 실제로 날아가고, 닿는 순간 판정한다 (7.2의 완성) ===== */
function fireArrow(a,th,dmg,isUlt){
  projs.push({x:a.x+12*Math.cos(th), y:a.y+12*Math.sin(th),
    vx:Math.cos(th)*520, vy:Math.sin(th)*520,
    dmg, dec:.62, left:1+a.pierce, w:a.pierceW, src:a, isUlt, foe:false,
    c:elemColor(a)||'#6FC9CE', hit:new Set()});
}
function stepProjs(dt){
  for(const p of projs){
    p.x+=p.vx*dt; p.y+=p.vy*dt;
    if(p.foe){                                   // 적 화살 → 아군 명중
      for(const al of allies){
        if(al.hp<=0)continue;
        if(Math.hypot(al.x-p.x,al.y-p.y)<al.r+4){ hurtAlly(al,p.dmg,p.srcM); p.left=0; break; }
      }
    }else{                                       // 아군 화살 → 경로의 적, 관통마다 62%로
      for(const m of mobs){
        if(m.hp<=0||p.hit.has(m))continue;
        if(Math.hypot(m.x-p.x,m.y-p.y)<m.r+3+(p.w-14)/2){
          p.hit.add(m);
          hurtMob(m,p.dmg,p.src,p.isUlt);
          p.dmg*=p.dec; p.left--;
          if(p.left<=0)break;
        }
      }
    }
  }
  projs=projs.filter(p=>p.left>0&&p.x>-30&&p.x<W+30&&p.y>-30&&p.y<H+30);
}

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
  if(ultimate(a)){ a.ultT=a.ultCd*.12*a.echo; return true; }   // 메아리 — 게이지 일부 보존
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

function ultimate(a,isEcho){
  const live=mobs.filter(m=>m.hp>0);
  if(!live.length)return false;
  const P=a.ultPow;
  shake=6; sfx('ult');
  flash(elemColor(a)||'#D8E4EA',.10,.18);        // 발동 순간 화면이 원소 색으로 물든다 (7.5)
  hitstop=Math.max(hitstop,.05);
  /* 이중 오의 — 첫 발동의 연출이 끝난 뒤에 한 번 더 (활 연사는 볼리 종료 후 0.25초).
     겹쳐 쏘면 "두 번"이 아니라 "길어진 한 번"으로 읽힌다 (DESIGN 4.1.2, 7.2) */
  if(a.dblUlt&&!isEcho){
    const gap=a.trait==='shoot'?(5+2*a.ultRank)*110+250
             :a.trait==='blast'?550:450;
    after(gap,()=>{ if(a.hp>0) ultimate(a,true); });
  }
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
      after(i*90,()=>{
        ring(cx,ay,R,elemColor(a)||'#E8963C',2);
        mobs.filter(m=>m.hp>0&&Math.hypot(m.x-cx,m.y-ay)<R)
            .forEach(m=>hurtMob(m,atkOf(a)*0.9*P,a,true));
      });
    }
  }
  else if(a.trait==='wall'){                   // 방패 밀치기 — 근처만
    const R=135*a.ultR;
    ring(a.x,a.y,R,elemColor(a)||'#8FBF6A',2.5);
    live.filter(m=>Math.hypot(m.x-a.x,m.y-a.y)<R).forEach(m=>{
      hurtMob(m,atkOf(a)*2.0*P,a,true);
      m.x+=50; m.stun=1.3;             // 밀치기 80→50 (2026-08-21) — 광역 밀침+경직이라 과했다
    });
  }
  else if(a.trait==='shoot'){                  // 질풍 연사 — 순간적으로 공속을 몰아쓴다
    const n=5+2*a.ultRank;                     // 연마 랭크당 +2발: 5/7/9/11 (DESIGN 4.5)
    for(let i=0;i<n;i++)
      after(i*110,()=>bowShot(a,true));
  }
  else if(a.trait==='blast'){                  // 불바다 — 앞쪽 절반, 순차 폭발
    const x0=a.x+120, R=115*a.ultR;
    for(let i=0;i<4;i++){
      const cx=x0+i*135;
      after(i*100,()=>{
        ring(cx,MID_Y,R,elemColor(a)||'#9B8ACB',2.2);
        mobs.filter(m=>m.hp>0&&Math.hypot(m.x-cx,m.y-MID_Y)<R)
            .forEach(m=>hurtMob(m,atkOf(a)*0.85*P,a,true));
      });
    }
  }
  return true;
}
/* 활 사격 한 발 — 논타겟 부채꼴 (2026-08-21): 가장 붐비는 쪽을 조준해 쏘고,
   각 화살의 경로에 있는 놈이 맞는다. 조준은 하되 유도는 없다 (유도 화살은 후일 카드 후보).
   기본 공격과 필살기 '질풍 연사'가 공유 — isUlt=true면 발마다 필살기 판정(기폭·추수 적용). */
function bowShot(a,isUlt){
  const live=mobs.filter(m=>m.hp>0&&m.x>a.x);
  if(!live.length)return;
  let aim=null,bn=-1;                          // 조준점 — 가장 붐비는 곳
  live.forEach(m=>{const n=live.filter(o=>Math.hypot(o.x-m.x,o.y-m.y)<70).length;
    if(n>bn){bn=n;aim=m;}});
  const base=Math.atan2(aim.y-a.y,aim.x-a.x);
  // 발이 늘면 발당 피해를 나눈다(총합 +20%씩), 관통은 한 명 뚫을 때마다 62%로 (DESIGN 7.1)
  const rowMul = a.arrows>1 ? (1+.2*(a.arrows-1))/a.arrows : 1;
  const SPREAD=.13;                            // 부채꼴 발 간격 (라디안, 약 7.5°)
  a.lung=.1;
  for(let i=0;i<a.arrows;i++)                    // 실제 투사체 — 날아가 닿는 순간 판정 (7.5)
    fireArrow(a,base+(i-(a.arrows-1)/2)*SPREAD,atkOf(a)*rowMul,isUlt);
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
    // shadow=true면 그림자 분신 — 피해만 줄고(30%) 독은 온전히, 그리고 서로 다른 길로 간다
    const strike=(mult,C,shadow)=>{
      const live2=mobs.filter(m=>m.hp>0);
      if(!live2.length)return;
      const infil=live2.filter(behindLine).sort((p,q)=>p.x-q.x);
      const mark=infil[0]||live2.find(m=>m.type==='boss');
      const sx=a.x+(shadow?(Math.random()*2-1)*26:0),             // 분신은 다른 자리에서 튀어나온다
            sy=a.y+(shadow?(Math.random()*2-1)*30:0);
      if(mark){
        beam(sx,sy,mark.x,mark.y,C,1.5); slashFx(mark.x,mark.y,C);
        hurtMob(mark,atkOf(a)*a.ambush*mult,a);   // 암살 일격 ('기습' 카드로 강화) — 표적은 같다
      }else{
        let path=live2.slice();
        if(shadow) path.sort(()=>Math.random()-.5);               // 분신은 서로 다른 길로 질주 — 도포가 넓어진다
        else path.sort((p,q)=>p.x-q.x);                           // 본체는 가까운 쪽부터
        path=path.slice(0,a.dashN);
        let px=sx, py=sy;
        path.forEach(m=>{ beam(px,py,m.x,m.y,C,1.2); slashFx(m.x,m.y,C);
          hurtMob(m,atkOf(a)*.5*mult,a); px=m.x; py=m.y; });      // 얕게 베어 독만 바른다
      }
    };
    a.lung=.14;
    strike(1,elemColor(a)||'#E8963C');
    for(let c=1;c<=a.clones;c++)                                  // 그림자 분신 — 시차를 두고 따라 친다 (7.2)
      after(c*120,()=>{ if(a.hp>0) strike(.3,'#77808C',true); });
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
      if(m.behav==='range'){                     // 궁수도 실제 화살을 쏜다 (7.5)
        const th=Math.atan2(tgt.y-m.y,tgt.x-m.x);
        projs.push({x:m.x,y:m.y,vx:Math.cos(th)*330,vy:Math.sin(th)*330,
          dmg:m.atk,left:1,w:14,foe:true,srcM:m,c:'#9B8ACB'});
      }else{ slashFx(tgt.x,tgt.y,'#C4574F'); hurtAlly(tgt,m.atk,m); } }
  }
  for(const o of mobs){
    if(o===m||o.hp<=0)continue;
    const ddx=o.x-m.x,ddy=o.y-m.y,dd=Math.hypot(ddx,ddy),mn=m.r+o.r;
    if(dd>0&&dd<mn){const p=(mn-dd)/dd*.5;m.x-=ddx*p;m.y-=ddy*p;}
  }
  m.y=Math.max(22,Math.min(H-22,m.y));
}
