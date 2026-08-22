/* ===================== 메인 루프 / 진행 ===================== */
let last=0;
function frame(ts){
  requestAnimationFrame(frame);
  const dtRaw=Math.min(.05,(ts-last)/1000||0); last=ts;
  if(running){
    if(hitstop>0) hitstop-=dtRaw;                          // 히트스톱 — 세상이 잠깐 멎는다 (7.5)
    else step(dtRaw*speed*(slowT>0?.3:1));                 // 대장 처치 슬로모
    if(slowT>0) slowT-=dtRaw;
  }
  draw(dtRaw);
}

function showEnd(win){
  phase='end';
  const surv=liveAllies().length;
  /* 남은 골드 + 도달 보너스가 대장간 금고로 — 골드가 유일한 영구 화폐 (DESIGN 4.5, 6.3)
     win=귀환(정비 화면에서 자발 종료) — 정산은 전멸과 같은 공식 (DESIGN 3.7) */
  const cleared=win?waveIdx+1:waveIdx;
  const bonus=cleared*15;                        // 도달 보너스 — 깊이 = 수입
  const banked=G.gold+bonus;
  const rec=cleared>(META.best||0);
  if(rec)META.best=cleared;
  META.gold+=banked; saveMeta();
  const ov=document.createElement('div'); ov.className='overlay'; ov.id='ov';
  ov.innerHTML=`<div class="big ${win?'win':'lose'}">${win?'귀환':'전멸'}</div>
    <div class="ov-sub">${win?`웨이브 ${fmtWave(cleared)}까지 밀어내고 ${G.kills}마리를 정리했다. 용병 ${surv}명이 돌아왔다.`
      :`웨이브 ${fmtWave(waveIdx+1)}, ${G.kills}마리째에서 무너졌다. 장비는 회수했다.`}</div>
    <div class="loot">골드 +${G.gold} · 도달 보너스 +${bonus} → 금고 ${META.gold}
      · 최고 웨이브 ${fmtWave(META.best)}${rec?' — <b style="color:var(--heat)">신기록</b>':''}</div>
    <div class="ov-sub" style="color:#5C636D">금고의 골드로 대장간에서 무기를 두드린다 (강화).<br>
      카드와 보석은 이 런과 함께 사라진다.</div>
    <div class="ov-row">
      <button id="metaOpenBtn">대장간</button>
      <button class="primary" id="againBtn">다시 출정</button>
    </div>`;
  document.getElementById('arena').appendChild(ov);
  document.getElementById('againBtn').onclick=startRun;
  document.getElementById('metaOpenBtn').onclick=openMeta;
  statusTxt.textContent=win?'귀환':'전멸';
  sfx('end');
}

function reset(){
  running=false; phase='idle';
  const o=document.getElementById('ov'); if(o)o.remove();
  waveIdx=0; waveT=0; waveSpawned=0; waveKills=0; curWave=null; mobs=[]; fxs=[]; nums=[];
  projs=[]; hitstop=0; slowT=0;
  lv=1; xp=0; pendingLv=0; hasteT=0;
  G.gold=0; G.kills=0; G.goldMul=1; G._boss=0; G.gems={};
  G.rerolls=metaRank('_global','nreroll');   // 시작 리롤은 노드만큼. 무기 카드 획득마다 +1 (DESIGN 4.1)
  G.rareDry=0;                               // 희귀 드로우트 천장 (DESIGN 4.1)
  mercLetter=0;
  allies=loadout.map((k,i)=>mkAlly(k,i,i===0)); layoutAllies();
  allies.forEach(a=>a.name=nextMercName());
  recalcAuras();
  goldTxt.textContent='0'; killTxt.textContent='0'; aliveTxt.textContent='0';
  lvTxt.textContent='1'; gemTxt.textContent='0';
  waveNum.textContent='0'; waveNum.classList.remove('live');
  document.getElementById('waveMeta').textContent=META.best>0?'웨이브 · 최고 '+fmtWave(META.best):'웨이브';
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

/* 효과음 토글 — 합성 사운드, 저장됨 (DESIGN 7.4) */
const sndBtn=document.getElementById('sndBtn');
function syncSnd(){ sndBtn.classList.toggle('on',!!META.sound); sndBtn.textContent=META.sound?'소리 켬':'소리 끔'; }
sndBtn.onclick=()=>{ META.sound=!META.sound; saveMeta(); syncSnd(); sfx('pick'); };
syncSnd();

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
