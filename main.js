/* ===================== 메인 루프 / 진행 ===================== */
let last=0;
function frame(ts){
  requestAnimationFrame(frame);
  const dtRaw=Math.min(.05,(ts-last)/1000||0); last=ts;
  if(running) step(dtRaw*speed);
  draw(dtRaw);
}

function showEnd(win){
  phase='end';
  const surv=liveAllies().length;
  /* 진행한 만큼 스탯 포인트 — 영구 성장 재원 (DESIGN 4.5) */
  const cleared=win?16:waveIdx;
  const pts=cleared+Math.floor(G.kills/60);
  if(pts>0){ META.pts+=pts; saveMeta(); }
  const ov=document.createElement('div'); ov.className='overlay'; ov.id='ov';
  ov.innerHTML=`<div class="big ${win?'win':'lose'}">${win?'귀환':'전멸'}</div>
    <div class="ov-sub">${win?`${G.kills}마리를 정리하고 용병 ${surv}명이 돌아왔다.`
      :`웨이브 ${waveIdx+1}, ${G.kills}마리째에서 무너졌다. 장비는 회수했다.`}</div>
    <div class="loot">스탯 포인트 +${pts} (보유 ${META.pts}) · 재료 ${G.mats} · 골드 ${G.gold}</div>
    <div class="ov-sub" style="color:#5C636D">포인트는 대장간에서 무기 노드에 영구히 새긴다.<br>
      카드·보석·골드는 이 런과 함께 사라진다.</div>
    <div class="ov-row">
      <button id="metaOpenBtn">대장간</button>
      <button class="primary" id="againBtn">다시 출정</button>
    </div>`;
  document.getElementById('arena').appendChild(ov);
  document.getElementById('againBtn').onclick=startRun;
  document.getElementById('metaOpenBtn').onclick=openMeta;
  statusTxt.textContent=win?'귀환':'전멸';
}

function reset(){
  running=false; phase='idle';
  const o=document.getElementById('ov'); if(o)o.remove();
  waveIdx=0; waveT=0; waveSpawned=0; waveKills=0; curWave=null; mobs=[]; fxs=[]; nums=[];
  lv=1; xp=0; pendingLv=0;
  G.gold=0; G.mats=0; G.kills=0; G.goldMul=1; G.reroll=10; G.hireCost=200; G._boss=0; G.gems={};
  mercLetter=0;
  allies=loadout.map((k,i)=>mkAlly(k,i,i===0)); layoutAllies();
  allies.forEach(a=>a.name=nextMercName());
  goldTxt.textContent='0'; matTxt.textContent='0'; killTxt.textContent='0'; aliveTxt.textContent='0';
  lvTxt.textContent='1'; gemTxt.textContent='0';
  waveNum.textContent='0'; waveNum.classList.remove('live');
  waveTitle.textContent='출정 대기'; statusTxt.textContent='준비';
  timeFill.style.width='0%'; xpFill.style.width='0%';
  document.getElementById('crew').innerHTML=''; renderCrew();
}
function startRun(){ reset(); beginWave(); }

/* ===== 헤더 조작 ===== */
document.getElementById('startBtn').onclick=startRun;
document.getElementById('metaBtn').onclick=openMeta;
document.getElementById('speedSeg').onclick=e=>{
  if(e.target.tagName!=='BUTTON')return; speed=+e.target.dataset.sp;
  [...e.currentTarget.children].forEach(x=>x.classList.toggle('on',x===e.target));
};

/* ===== 초기화 ===== */
renderLoadout(); renderBal(); reset(); requestAnimationFrame(frame);
