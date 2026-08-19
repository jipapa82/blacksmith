/* ===================== 밸런스 조정 UI =====================
   프로토타입 전용 도구. 장비 수치 직접 편집 + 난이도 슬라이더. */
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
    EQUIP[e.target.dataset.k][e.target.dataset.f]=n; renderLoadout(); reset();
  });
}
const foeMulLbl=document.getElementById('foeMulLbl'),
      rateLbl=document.getElementById('rateLbl'),
      sizeLbl=document.getElementById('sizeLbl');
document.getElementById('foeMul').oninput=e=>{foeMul=+e.target.value;foeMulLbl.textContent=foeMul.toFixed(2)};
document.getElementById('rate').oninput=e=>{rateMul=+e.target.value;rateLbl.textContent=rateMul.toFixed(2)};
document.getElementById('wsize').oninput=e=>{waveSize=+e.target.value;sizeLbl.textContent='×'+waveSize.toFixed(2)};
