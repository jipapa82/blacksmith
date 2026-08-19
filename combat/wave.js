/* ===================== 웨이브 진행 =====================
   종료 조건은 섬멸형 — 정해진 마릿수를 전부 잡아야 끝난다. (DESIGN 3.6)
   상단 바는 시간이 아니라 처치 진행도. 화력이 오르면 웨이브가 눈에 띄게 빨리 끝난다. */
function step(dt){
  const w=curWave;
  waveT+=dt;
  const total=w.count+(w.boss?1:0);
  timeFill.style.width=Math.min(100,waveKills/total*100)+'%';
  if(waveSpawned<w.count){
    spawnT-=dt;
    if(spawnT<=0){
      spawnT=Math.max(.10,w.every)/rateMul*(.6+Math.random()*.8);
      const r=Math.random(); let acc=0,pick=w.mix[0][0];
      for(const [t,p] of w.mix){acc+=p;if(r<=acc){pick=t;break;}}
      mobs.push(mkMob(pick)); waveSpawned++;
      for(let k=1;k<w.burst;k++)
        if(Math.random()<.7&&waveSpawned<w.count){mobs.push(mkMob(pick));waveSpawned++;}
    }
  }
  if(w.boss&&!G._boss&&waveSpawned>=w.count*.4){G._boss=1;mobs.push(mkMob('boss'));}
  allies.forEach(a=>{ if(a.hp<=0)return;
    a.charge+=dt*aspdOf(a); if(a.charge>=1){a.charge=0;allyAct(a);}
    if(a.ultOn) a.ultT=Math.min(a.ultCd,a.ultT+dt);   // 수동 발동: 게이지는 차서 기다린다 (4.1.2)
    a.hit=Math.max(0,a.hit-dt); a.lung=Math.max(0,a.lung-dt); });
  mobs.forEach(m=>{ if(m.hp<=0)return;
    statusTick(m,dt);                        // 화상·중독 틱, 한기·빙결·공명 시간 경과
    if(m.hp>0){mobStep(m,dt);m.hit=Math.max(0,m.hit-dt);m.lung=Math.max(0,m.lung-dt);} });
  mobs=mobs.filter(m=>m.hp>0);
  aliveTxt.textContent=total-waveKills;          // 아직 등장하지 않은 적까지 센다
  lvTxt.textContent=lv; xpFill.style.width=Math.min(100,xp/xpNeed(lv)*100)+'%';
  renderCrew();
  if(waveSpawned>=w.count&&mobs.length) statusTxt.textContent='잔당 정리';
  if(!liveAllies().length){running=false;showEnd(false);return;}
  if(pendingLv>0){running=false;openLevelUp();return;}   // 레벨업: 잠깐 멈추고 3택 (DESIGN 4.1)
  if(waveSpawned>=w.count&&!mobs.length){running=false;openForge();}
}

function beginWave(){
  curWave=waveSpec(waveIdx);
  waveT=0; spawnT=0; waveSpawned=0; waveKills=0; mobs=[]; G._boss=0;
  aliveTxt.textContent=curWave.count+(curWave.boss?1:0);
  waveNum.textContent=waveIdx+1; waveNum.classList.add('live');
  waveTitle.textContent=curWave.title; statusTxt.textContent='교전 중';
  phase='fight'; running=true;
}
function advance(){
  waveIdx++;
  if(waveIdx>=16){ showEnd(true); return; }
  beginWave();
}
