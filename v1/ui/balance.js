/* ===================== 밸런스 조정 UI =====================
   프로토타입 전용 도구. 장비 수치 직접 편집 + 난이도 슬라이더.
   조정값은 localStorage에 저장된다 (2026-08-21) — 새로고침해도 유지.
   주의: 저장된 오버라이드는 이후 패치의 기본값을 가린다 — "기본값 복원"이 패치 수치로 되돌린다. */
const BAL_KEY='blacksmith-balance-v1';
const BAL_DEF=(()=>{ const eq={};                 // 코드 기본값 스냅샷 — 복원용
  for(const k in EQUIP){const e=EQUIP[k]; eq[k]={atk:e.atk,def:e.def,hp:e.hp,spd:e.spd};}
  return eq; })();
try{                                              // 저장된 조정값 적용 (로드 시)
  const j=JSON.parse(localStorage.getItem(BAL_KEY));
  if(j){
    for(const k in (j.eq||{})) if(EQUIP[k]) Object.assign(EQUIP[k],j.eq[k]);
    if(j.foeMul)foeMul=j.foeMul; if(j.rateMul)rateMul=j.rateMul; if(j.waveSize)waveSize=j.waveSize;
  }
}catch(e){}
function saveBal(){ try{
  const eq={};
  for(const k in EQUIP){const e=EQUIP[k]; eq[k]={atk:e.atk,def:e.def,hp:e.hp,spd:e.spd};}
  localStorage.setItem(BAL_KEY,JSON.stringify({eq,foeMul,rateMul,waveSize}));
}catch(e){} }

const balGrid=document.getElementById('balGrid');
function renderBal(){
  balGrid.innerHTML=`<div></div><div class="hd">공</div><div class="hd">방</div><div class="hd">체</div><div class="hd">속</div>`;
  Object.entries(EQUIP).forEach(([k,v])=>balGrid.insertAdjacentHTML('beforeend',
    `<div class="nm">${v.name}</div>
     <div><input data-k="${k}" data-f="atk" value="${v.atk}"></div>
     <div><input data-k="${k}" data-f="def" value="${v.def}"></div>
     <div><input data-k="${k}" data-f="hp"  value="${v.hp}"></div>
     <div><input data-k="${k}" data-f="spd" value="${v.spd}"></div>`));
  balGrid.querySelectorAll('input').forEach(i=>i.onchange=e=>{
    const n=parseFloat(e.target.value);
    if(isNaN(n)||n<0){e.target.value=EQUIP[e.target.dataset.k][e.target.dataset.f];return;}
    EQUIP[e.target.dataset.k][e.target.dataset.f]=n; saveBal(); renderLoadout(); reset();
  });
}
const foeMulLbl=document.getElementById('foeMulLbl'),
      rateLbl=document.getElementById('rateLbl'),
      sizeLbl=document.getElementById('sizeLbl');
/* 슬라이더·라벨을 현재 값으로 동기화 (저장값 로드·복원 후) */
function syncBalUI(){
  const f=document.getElementById('foeMul'), r=document.getElementById('rate'), w=document.getElementById('wsize');
  f.value=foeMul; r.value=rateMul; w.value=waveSize;
  foeMulLbl.textContent=(+foeMul).toFixed(2);
  rateLbl.textContent=(+rateMul).toFixed(2);
  sizeLbl.textContent='×'+(+waveSize).toFixed(2);
}
document.getElementById('foeMul').oninput=e=>{foeMul=+e.target.value;foeMulLbl.textContent=foeMul.toFixed(2);saveBal();};
document.getElementById('rate').oninput=e=>{rateMul=+e.target.value;rateLbl.textContent=rateMul.toFixed(2);saveBal();};
document.getElementById('wsize').oninput=e=>{waveSize=+e.target.value;sizeLbl.textContent='×'+waveSize.toFixed(2);saveBal();};
syncBalUI();
/* 기본값 복원 — 저장 삭제, 코드 기본값(=최신 패치 수치)으로 */
const balResetBtn=document.getElementById('balReset');
if(balResetBtn)balResetBtn.onclick=()=>{
  for(const k in BAL_DEF) Object.assign(EQUIP[k],BAL_DEF[k]);
  foeMul=1; rateMul=1; waveSize=1;
  try{localStorage.removeItem(BAL_KEY);}catch(e){}
  syncBalUI(); renderBal(); renderLoadout(); reset();
};
