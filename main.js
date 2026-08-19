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
  const ov=document.createElement('div'); ov.className='overlay'; ov.id='ov';
  ov.innerHTML=`<div class="big ${win?'win':'lose'}">${win?'귀환':'전멸'}</div>
    <div class="ov-sub">${win?`${G.kills}마리를 정리하고 용병 ${surv}명이 돌아왔다.`
      :`웨이브 ${waveIdx+1}, ${G.kills}마리째에서 무너졌다. 장비는 회수했다.`}</div>
    <div class="loot">가져온 재료 ${G.mats} · 남은 골드 ${G.gold}</div>
    <div class="ov-sub" style="color:#5C636D">이 재료로 대장간에서 새 장비를 해금하는 층이 다음 단계다.</div>
    <button class="primary" id="againBtn">다시 출정</button>`;
  document.getElementById('arena').appendChild(ov);
  document.getElementById('againBtn').onclick=startRun;
  statusTxt.textContent=win?'귀환':'전멸';
}

function reset(){
  running=false; phase='idle';
  const o=document.getElementById('ov'); if(o)o.remove();
  waveIdx=0; waveT=0; waveSpawned=0; waveKills=0; curWave=null; mobs=[]; fxs=[]; nums=[];
  G.gold=0; G.mats=0; G.kills=0; G.goldMul=1; G.reroll=10; G.hireCost=200; G._boss=0;
  mercLetter=0;
  allies=loadout.map((k,i)=>mkAlly(k,i,i===0)); layoutAllies();
  allies.forEach(a=>a.name=nextMercName());
  goldTxt.textContent='0'; matTxt.textContent='0'; killTxt.textContent='0'; aliveTxt.textContent='0';
  waveNum.textContent='0'; waveNum.classList.remove('live');
  waveTitle.textContent='출정 대기'; statusTxt.textContent='준비';
  timeFill.style.width='0%';
  document.getElementById('crew').innerHTML=''; renderCrew();
}
function startRun(){ reset(); beginWave(); }

/* ===== 헤더 조작 ===== */
document.getElementById('startBtn').onclick=startRun;
document.getElementById('speedSeg').onclick=e=>{
  if(e.target.tagName!=='BUTTON')return; speed=+e.target.dataset.sp;
  [...e.currentTarget.children].forEach(x=>x.classList.toggle('on',x===e.target));
};

/* ===== 초기화 ===== */
renderLoadout(); renderBal(); reset(); requestAnimationFrame(frame);
