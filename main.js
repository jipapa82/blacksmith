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
  /* 진행한 만큼 스탯 포인트 — 영구 성장 재원 (DESIGN 4.5)
     남은 골드는 대장간 금고로 회수·누적 — 장비처럼 골드도 회수한다 (DESIGN 6.3) */
  const cleared=win?16:waveIdx;
  const pts=cleared+Math.floor(G.kills/60);
  const banked=G.gold;
  META.pts+=pts; META.gold+=banked; saveMeta();
  const ov=document.createElement('div'); ov.className='overlay'; ov.id='ov';
  ov.innerHTML=`<div class="big ${win?'win':'lose'}">${win?'귀환':'전멸'}</div>
    <div class="ov-sub">${win?`${G.kills}마리를 정리하고 용병 ${surv}명이 돌아왔다.`
      :`웨이브 ${waveIdx+1}, ${G.kills}마리째에서 무너졌다. 장비는 회수했다.`}</div>
    <div class="loot">스탯 포인트 +${pts} (보유 ${META.pts}) · 골드 +${banked} → 금고 ${META.gold}</div>
    <div class="ov-sub" style="color:#5C636D">포인트는 대장간에서 무기 노드에 영구히 새긴다. 남은 골드는 금고로 회수된다.<br>
      카드와 보석은 이 런과 함께 사라진다.</div>
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
  G.gold=0; G.kills=0; G.goldMul=1; G.hireCost=200; G._boss=0; G.gems={};
  G.rerolls=metaRank('_global','nreroll');   // 시작 리롤은 노드만큼. 고용마다 +1 (DESIGN 4.1)
  mercLetter=0;
  allies=loadout.map((k,i)=>mkAlly(k,i,i===0)); layoutAllies();
  allies.forEach(a=>a.name=nextMercName());
  goldTxt.textContent='0'; killTxt.textContent='0'; aliveTxt.textContent='0';
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

/* 필살기 발동 방식 토글 — 기본 자동, 저장됨 (DESIGN 4.1.2) */
const ultSeg=document.getElementById('ultSeg');
function syncUltSeg(){
  [...ultSeg.children].forEach(b=>b.classList.toggle('on',(b.dataset.um==='auto')===META.autoUlt));
}
ultSeg.onclick=e=>{
  if(e.target.tagName!=='BUTTON')return;
  META.autoUlt=e.target.dataset.um==='auto'; saveMeta(); syncUltSeg();
};
syncUltSeg();

/* 수동 모드: 키 1~5로 발동 */
document.addEventListener('keydown',e=>{
  const n=+e.key;
  if(n>=1&&n<=allies.length) fireUlt(n-1);
});
document.getElementById('speedSeg').onclick=e=>{
  if(e.target.tagName!=='BUTTON')return; speed=+e.target.dataset.sp;
  [...e.currentTarget.children].forEach(x=>x.classList.toggle('on',x===e.target));
};

/* ===== 초기화 ===== */
renderLoadout(); renderBal(); reset(); requestAnimationFrame(frame);
