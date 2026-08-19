/* ===================== 웨이브 진행 ===================== */
function step(dt){
  const w=waveSpec(waveIdx);
  waveT+=dt;
  timeFill.style.width=Math.min(100,waveT/w.dur*100)+'%';
  if(waveT<w.dur){
    spawnT-=dt;
    if(spawnT<=0){
      spawnT=Math.max(.10,w.every)/rateMul*(.6+Math.random()*.8);
      const r=Math.random(); let acc=0,pick=w.mix[0][0];
      for(const [t,p] of w.mix){acc+=p;if(r<=acc){pick=t;break;}}
      mobs.push(mkMob(pick));
      for(let k=1;k<w.burst;k++) if(Math.random()<.7) mobs.push(mkMob(pick));
    }
    if(w.boss&&waveT>w.dur*.4&&!G._boss){G._boss=1;mobs.push(mkMob('boss'));}
  }
  allies.forEach(a=>{ if(a.hp<=0)return;
    a.charge+=dt*a.aspd; if(a.charge>=1){a.charge=0;allyAct(a);}
    a.ultT+=dt;
    if(a.ultT>=a.ultCd){ if(ultimate(a)) a.ultT=0; }
    a.hit=Math.max(0,a.hit-dt); a.lung=Math.max(0,a.lung-dt); });
  mobs.forEach(m=>{ if(m.hp>0){mobStep(m,dt);m.hit=Math.max(0,m.hit-dt);m.lung=Math.max(0,m.lung-dt);} });
  mobs=mobs.filter(m=>m.hp>0);
  aliveTxt.textContent=mobs.length;
  renderCrew();
  if(waveT>=w.dur&&mobs.length) statusTxt.textContent='잔당 정리';
  if(!liveAllies().length){running=false;showEnd(false);return;}
  if(waveT>=w.dur&&!mobs.length){running=false;openForge();}
}

function beginWave(){
  const w=waveSpec(waveIdx);
  waveT=0; spawnT=0; mobs=[]; G._boss=0; aliveTxt.textContent='0';
  waveNum.textContent=waveIdx+1; waveNum.classList.add('live');
  waveTitle.textContent=w.title; statusTxt.textContent='교전 중';
  phase='fight'; running=true;
}
function advance(){
  waveIdx++;
  if(waveIdx>=16){ showEnd(true); return; }
  beginWave();
}
