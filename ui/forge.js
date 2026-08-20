/* ===================== 웨이브 사이 정비 =====================
   여기서는 보석만 만진다 — 장착과 합성. 카드는 전투 중 레벨업으로 갔다. (DESIGN 4장, 5.2)
   웨이브가 끝나면 전원 완전 회복, 죽은 용병은 새 용병으로 교체. (DESIGN 3.5) */
let mercLetter=0;
function nextMercName(){ return '용병 '+String.fromCharCode(65+(mercLetter++%26)); }

function restoreCrew(){
  const fallen=[];
  allies.forEach(a=>{
    if(a.hp<=0){ fallen.push({eq:a.eq, old:a.name}); a.name=nextMercName(); }
    a.hp=maxHpOf(a); a.charge=0; a.hit=0; a.lung=0; a.ultWait=0; a.reviveT=0;
  });
  layoutAllies();
  return fallen;
}

let selGem=null;            // 인벤토리에서 고른 보석 키 ("종류:단계")
let altar=[], finalMsg='';  // 최종 합성대에 올린 5단계 키 2개 (DESIGN 4.4)

/* 보석 스탯 표기 — 무색 2종은 이중 스탯, 최종 보석은 오라까지 (DESIGN 4.2, 4.4) */
function gemStatText(g,gr,type){
  const pct=s=>s==='leech'||s==='def'?false:true;   // 흡혈·방어만 정수, 나머지는 %
  const f=(s,v)=>pct(s)?Math.round(v*100)+'%':v;
  const gi=Math.min(gr,GEM_MAX_GRADE)-1;
  let t=`${g.desc} +${f(g.stat,g.v[gi])}`;
  if(g.stat2) t+=` · ${g.desc2} +${f(g.stat2,g.v2[gi])}`;
  if(gr>=FINAL_GRADE&&type) t+=` · ${AURA[type].n}: ${AURA[type].d}`;
  return t;
}

function openForge(){
  phase='forge'; selGem=null; altar=[]; finalMsg='';
  const fallen=restoreCrew();
  renderCrew();
  const ov=document.createElement('div'); ov.className='overlay'; ov.id='ov';
  const fallenTxt = fallen.length
    ? fallen.map(f=>`${f.old}는 돌아오지 못했다. ${f.eq}는 새 손에 넘어간다.`).join('<br>')
    : '용병들은 상처를 씻고 다시 선다.';
  ov.innerHTML=`
    <div class="ov-eyebrow">웨이브 ${waveIdx+1} 섬멸 · ${waveT.toFixed(1)}초</div>
    <div class="ov-title">정비</div>
    <div class="ov-sub">${fallenTxt}</div>
    <div class="purse"><span class="g">골드 <b id="ovGold">${G.gold}</b></span>
      <span style="color:var(--dim)">용병 <b>${allies.length}</b> / ${Object.keys(EQUIP).length}</span></div>
    <div class="forge-body" id="forgeBody"></div>
    <div class="ov-row" id="forgeRow"></div>`;
  document.getElementById('arena').appendChild(ov);
  renderForgeBody(); renderForgeRow();
}

function renderForgeRow(){
  const row=document.getElementById('forgeRow'); if(!row)return;
  row.innerHTML=`<button id="hireBtn">용병 고용 · ${G.hireCost}골드</button>
    <button class="primary" id="nextBtn">다음 웨이브</button>`;
  const hb=document.getElementById('hireBtn');
  hb.disabled=G.gold<G.hireCost||allies.length>=Object.keys(EQUIP).length;
  hb.onclick=()=>renderHirePicker();
  document.getElementById('nextBtn').onclick=()=>{
    document.getElementById('ov').remove(); advance();
  };
}

/* 보석 장착/합성 화면 */
function renderForgeBody(){
  const box=document.getElementById('forgeBody'); if(!box)return;
  let html=allies.map((a,ai)=>`<div class="sock-row">
      <span class="sock-name">${weaponIcon(a.key)}${a.name} · ${a.eq}</span>
      ${a.sock.map((s,si)=>{
        if(s){const g=GEMS[s.type];
          return `<button class="slotbtn filled" data-ai="${ai}" data-si="${si}"
            title="${g.name} ${GRADE_TXT[s.grade-1]} — ${gemStatText(g,s.grade,s.type)}"
            style="border-color:${g.color};color:${g.color}${s.grade>=FINAL_GRADE?`;box-shadow:0 0 7px ${g.color}`:''}">${GRADE_TXT[s.grade-1]}</button>`;}
        return `<button class="slotbtn" data-ai="${ai}" data-si="${si}">+</button>`;
      }).join('')}
    </div>`).join('');
  const inv=invEntries();
  const canMergeAll=inv.some(e=>e.count>=2&&e.grade<GEM_MAX_GRADE);
  html+=`<div class="gem-inv">`+(inv.length?inv.map(e=>{
      const g=GEMS[e.type];
      return `<span class="gemchip ${e.grade>=FINAL_GRADE?'final':''} ${selGem===e.key?'sel':''}" data-key="${e.key}">
        <i class="dot2" style="background:${g.color}"></i>${g.name} ${GRADE_TXT[e.grade-1]}
        <span class="cnt">${gemStatText(g,e.grade,e.type)}</span>
        ${g.elem?`<span class="cnt" style="color:${ELEM_INFO[g.elem][1]}">↔${ELEM_INFO[g.elem][0]}</span>`:''}
        <span class="cnt">×${e.count}</span>
        ${e.count>=2&&e.grade<GEM_MAX_GRADE?`<button data-merge="${e.key}">합성</button>`:''}
      </span>`;
    }).join(''):'<span class="forge-hint">보석이 없다. 적을 잡다 보면 가끔 떨어진다.</span>')
    +(canMergeAll?`<button id="mergeAllBtn">일괄 합성</button>`:'')+`</div>`;
  /* 최종 합성대 — Ⅴ 둘을 올려 최종 보석을 만든다 (DESIGN 4.4) */
  const fives=inv.filter(e=>e.grade===GEM_MAX_GRADE);
  if(fives.length||altar.length){
    html+=`<div class="final-forge">
      <div class="forge-hint">최종 합성대 — Ⅴ 둘: 같은 종류=확정, 다른 종류=50/50. 스탯은 Ⅴ와 같고 <b style="color:var(--gold)">오라</b>가 붙는다.</div>
      <div class="gem-inv">
        ${fives.map(e=>{const g=GEMS[e.type];
          return `<span class="gemchip" data-alt="${e.key}"><i class="dot2" style="background:${g.color}"></i>${g.name} Ⅴ <span class="cnt">×${e.count}</span></span>`;}).join('')}
        <span class="cnt">→</span>
        ${[0,1].map(i=>{
          if(!altar[i])return `<span class="gemchip" style="opacity:.45">빈 자리</span>`;
          const t=altar[i].split(':')[0], g=GEMS[t];
          return `<span class="gemchip sel" data-unalt="${i}"><i class="dot2" style="background:${g.color}"></i>${g.name} Ⅴ</span>`;}).join('')}
        <button id="finalMergeBtn" ${altar.length===2?'':'disabled'}>최종 합성</button>
      </div>
      ${finalMsg?`<div class="forge-hint" style="color:var(--gold)">${finalMsg}</div>`:''}
    </div>`;
  }
  html+=`<div class="forge-hint">보석을 고르고 홈(+)을 누르면 끼운다. 보석을 안 고른 채 찬 홈을 누르면 뺀다.<br>
    합성: 같은 보석 2개 → 한 단계 위 1개. 일괄 합성은 합칠 수 있는 걸 전부 (연쇄까지) 밀어 올린다.<br>
    ↔ 표시 보석은 같은 원소의 무기에 끼우면 시너지가 발현된다.</div>`;
  box.innerHTML=html;

  const mab=document.getElementById('mergeAllBtn');
  if(mab) mab.onclick=()=>{
    mergeAllGems();
    if(selGem&&!invCount(selGem)) selGem=null;
    renderForgeBody();
  };

  box.querySelectorAll('.gemchip').forEach(el=>el.onclick=ev=>{
    const mk=ev.target.dataset&&ev.target.dataset.merge;
    if(mk){ mergeGems(mk); if(!invCount(selGem)) selGem=null; renderForgeBody(); return; }
    selGem = selGem===el.dataset.key ? null : el.dataset.key;
    renderForgeBody();
  });
  box.querySelectorAll('[data-alt]').forEach(el=>el.onclick=()=>{
    const k=el.dataset.alt;
    if(altar.length>=2)return;
    if(altar.filter(x=>x===k).length+1>invCount(k))return;   // 같은 스택 2개는 개수 확인
    altar.push(k); finalMsg=''; renderForgeBody();
  });
  box.querySelectorAll('[data-unalt]').forEach(el=>el.onclick=()=>{
    altar.splice(+el.dataset.unalt,1); renderForgeBody();
  });
  const fmb=document.getElementById('finalMergeBtn');
  if(fmb)fmb.onclick=()=>{
    if(altar.length<2)return;
    const t=mergeFinal(altar[0],altar[1]);
    altar=[];
    finalMsg=t?`${GEMS[t].name} 최종 보석 완성 — ${AURA[t].n}!`:'합성 실패 — 재료가 부족하다';
    if(selGem&&!invCount(selGem))selGem=null;
    renderForgeBody();
  };
  box.querySelectorAll('.slotbtn').forEach(el=>el.onclick=()=>{
    const a=allies[+el.dataset.ai], si=+el.dataset.si;
    if(selGem){
      if(takeGem(selGem)){
        if(a.sock[si]) gainGem(a.sock[si].type,a.sock[si].grade);   // 기존 보석은 인벤토리로
        const [t,gr]=selGem.split(':');
        a.sock[si]={type:t,grade:+gr};
        recalcGems(a); a.hp=maxHpOf(a);
        if(!invCount(selGem)) selGem=null;
      }
    }else if(a.sock[si]){
      gainGem(a.sock[si].type,a.sock[si].grade);
      a.sock[si]=null; recalcGems(a); a.hp=Math.min(a.hp,maxHpOf(a));
    }
    renderForgeBody(); renderCrew();
  });
}

/* 용병 고용 — 새 장비를 골라 들려 보낸다 */
function renderHirePicker(){
  const box=document.getElementById('forgeBody'), row=document.getElementById('forgeRow');
  if(!box||!row)return;
  const taken=new Set(allies.map(a=>a.key));
  const avail=Object.entries(EQUIP).filter(([k])=>!taken.has(k));
  box.innerHTML=`<div class="forge-hint">아직 주인이 없는 장비다. 하나를 골라 들려 보낸다.</div>
    <div class="cards">`+avail.map(([k,v])=>`<div class="card" data-k="${k}">
      <div class="target">새 용병</div>
      <div class="cname">${weaponIcon(k)}${v.name}</div>
      <div class="cdesc">${v.desc}</div>
      <div class="cdesc" style="color:var(--heat)">필살 · ${v.ultName} (위력 ${50+25*metaRank(k,'nult')}%)</div>
      <div class="cdesc">원소 ${elemChoices(k)}</div>
      <div class="crar">공 ${v.atk} · 방 ${v.def} · 체 ${v.hp} · 속 ${v.spd.toFixed(2)}</div>
    </div>`).join('')+`</div>`;
  box.querySelectorAll('.card').forEach(el=>el.onclick=()=>{
    G.gold-=G.hireCost;
    G.hireCost = allies.length>=3 ? 6000 : 2000;
    goldTxt.textContent=G.gold;
    hireMerc(el.dataset.k); renderCrew();
    G.rerolls++;                       // 일손이 늘면 다시 두드릴 여유가 생긴다 (DESIGN 4.1)
    document.getElementById('ov').remove(); advance();
  });
  row.innerHTML='<button id="cancelHire">그만두기</button>';
  document.getElementById('cancelHire').onclick=()=>{ renderForgeBody(); renderForgeRow(); };
}
