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
    a.lastStandUsed=false; a.noHitT=0;           // 마지막 숨은 웨이브당 1회 (4.1.1)
  });
  layoutAllies();
  return fallen;
}

let selGem=null;            // 인벤토리에서 고른 보석 키 ("종류:단계")
let altar=[], finalMsg='';  // 최종 합성대에 올린 Ⅴ등급 키 2개 (DESIGN 4.4)

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
/* 등급 줄에 넣는 짧은 값 — "+16%" / "+11% +2" (이름은 컬럼 머리가 담당) */
function gemValText(g,gr){
  const pct=s=>s==='leech'||s==='def'?false:true;
  const f=(s,v)=>pct(s)?Math.round(v*100)+'%':v;
  const gi=Math.min(gr,GEM_MAX_GRADE)-1;
  let t='+'+f(g.stat,g.v[gi]);
  if(g.stat2)t+=' +'+f(g.stat2,g.v2[gi]);
  return t;
}

function openForge(){
  phase='forge'; selGem=null; altar=[]; finalMsg=''; sfx('clear');
  const fallen=restoreCrew();
  renderCrew();
  const ov=document.createElement('div'); ov.className='overlay'; ov.id='ov';
  const fallenTxt = fallen.length
    ? fallen.map(f=>`${f.old}는 돌아오지 못했다. ${f.eq}는 새 손에 넘어간다.`).join('<br>')
    : '용병들은 상처를 씻고 다시 선다.';
  ov.innerHTML=`
    <div class="ov-eyebrow">웨이브 ${fmtWave(waveIdx+1)} 섬멸 · ${waveT.toFixed(1)}초</div>
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
  /* 고용 폐지 (2026-08-22) — 무기는 드래프트의 무기 카드로 만난다 (DESIGN 4.1) */
  row.innerHTML=`<button id="retreatBtn" title="런을 여기서 끝낸다. 정산은 전멸과 같다 — 아끼는 건 시간이다">귀환</button>
    <button class="primary" id="nextBtn">다음 웨이브</button>`;
  document.getElementById('retreatBtn').onclick=()=>{
    document.getElementById('ov').remove(); showEnd(true);   // 자발적 귀환 (DESIGN 3.7)
  };
  document.getElementById('nextBtn').onclick=()=>{
    document.getElementById('ov').remove(); advance();
  };
}

/* ===== 스탯 비교 — 보석을 어떻게 끼우느냐에 따라 뭐가 달라지는지 한눈에 (DESIGN 7.3) ===== */
function statSnap(a){
  return {hp:maxHpOf(a),atk:atkOf(a),aspd:aspdOf(a),def:defOf(a),
    crit:critOf(a),critD:a.critD+a.gm.critDmgAdd,dodge:dodgeOf(a),leech:a.leech+a.gm.leechAdd,
    el:elemOf(a),elLv:a.elFire||a.elPois||a.elCold||a.elShock||0};
}
/* 무기의 현재 원소 효과 설명 — 수치는 실제 판정 그대로 (STATUS + 보석 시너지·카드 합산, 7.2 표시=판정) */
function elemDesc(a){
  const dot=1+STATUS.syn.dotAmp*a.syDotamp;
  if(a.elFire){const l=a.elFire-1;
    return `적중 시 ${STATUS.burn.dur[l]}초 화상 — 초당 공격력의 ${Math.round(STATUS.burn.dpsPct[l]*(1+a.gm.synFire)*dot*100)}% 피해, 재적중 시 갱신`;}
  if(a.elPois){const l=a.elPois-1;
    return `적중 시 중독 +1중첩 (최대 ${STATUS.pois.maxStacks[l]+a.gm.synPois}중첩, ${STATUS.pois.dur}초) — 중첩당 초당 공격력의 ${Math.round(STATUS.pois.dpsPct[l]*dot*100)}% 피해`;}
  if(a.elCold){const l=a.elCold-1;
    return `적중 시 ${STATUS.chill.dur}초 한기 (이동 -${Math.round(STATUS.chill.slow[l]*100)}%), 한기 중 ${STATUS.chill.hitsToFreeze}회 적중 시 ${(STATUS.chill.freezeDur[l]*(1+a.gm.synCold)).toFixed(1)}초 빙결`;}
  if(a.elShock){const l=a.elShock-1;
    return `적중 시 ${STATUS.shock.dur[l]}초 공명 — 받는 모든 피해 +${Math.round((STATUS.shock.amp[l]+a.gm.synShock)*100)}%, 맞을 때 ${Math.round(STATUS.shock.stagger[l]*100)}% 확률 휘청`;}
  return '';
}
function elemLine(a){
  const d=elemDesc(a);
  return d?`<div class="sock-elem" style="color:${elemColor(a)}">↳ ${d}</div>`:'';
}
/* 홈 si에 gem을 끼웠다 치고 스탯을 재보고 원상 복구 */
function previewWith(a,si,gem){
  const old=a.sock[si];
  a.sock[si]=gem; recalcGems(a);
  const snap=statSnap(a); snap.elDesc=elemDesc(a);
  a.sock[si]=old; recalcGems(a);
  return snap;
}
function statLine(a){
  const s=statSnap(a);
  return `<div class="sock-stats">체 ${Math.max(0,Math.ceil(a.hp))}/${s.hp} · 공 ${s.atk} · 공속 ${s.aspd.toFixed(2)} · 방 ${s.def}`
    +` · 치명 ${Math.round(s.crit*100)}% · 치피 ${Math.round(s.critD*100)}% · 회피 ${Math.round(s.dodge*100)}% · 흡혈 ${s.leech}`
    +(s.el?` · <b style="color:${ELEM_INFO[s.el][1]}">${ELEM_INFO[s.el][0]} ${s.elLv}단계</b>`:' · <span style="opacity:.5">원소 없음</span>')
    +`</div>`;
}
/* 고른 보석을 첫 빈 홈에 끼웠을 때의 변화 미리보기 */
function gemPreview(a){
  if(!selGem)return '';
  const si=a.sock.findIndex(s=>!s);
  if(si<0)return `<div class="sock-prev" style="opacity:.5">빈 홈 없음 — 찬 홈을 누르면 교체</div>`;
  const [t,gr]=selGem.split(':');
  const cur=statSnap(a), nx=previewWith(a,si,{type:t,grade:+gr});
  const d=[];
  if(nx.atk!==cur.atk)d.push('공 +'+(nx.atk-cur.atk));
  if(nx.hp!==cur.hp)d.push('체 +'+(nx.hp-cur.hp));
  if(Math.abs(nx.aspd-cur.aspd)>1e-9)d.push('공속 +'+(nx.aspd-cur.aspd).toFixed(2));
  if(nx.def!==cur.def)d.push('방 +'+(nx.def-cur.def));
  if(Math.abs(nx.crit-cur.crit)>1e-9)d.push('치명 +'+Math.round((nx.crit-cur.crit)*100)+'%p');
  if(Math.abs(nx.critD-cur.critD)>1e-9)d.push('치피 +'+Math.round((nx.critD-cur.critD)*100)+'%p');
  if(Math.abs(nx.dodge-cur.dodge)>1e-9)d.push('회피 +'+Math.round((nx.dodge-cur.dodge)*100)+'%p');
  if(nx.leech!==cur.leech)d.push('흡혈 +'+(nx.leech-cur.leech));
  let el='', elDetail='';
  if(nx.el!==cur.el||nx.elLv!==cur.elLv){
    el=(d.length?' · ':'')+(nx.el?`<b style="color:${ELEM_INFO[nx.el][1]}">원소 ${ELEM_INFO[nx.el][0]} ${nx.elLv}단계</b>`:'원소 없음');
    if(nx.el&&nx.elDesc)
      elDetail=`<div class="sock-elem" style="color:${ELEM_INFO[nx.el][1]};opacity:.85">↳ ${nx.elDesc}</div>`;
  }
  return `<div class="sock-prev">${si===0?'◆ 원소 홈':'홈 '+(si+1)}에 끼우면: ${d.join(' · ')||(el?'':'변화 없음')}${el}</div>${elDetail}`;
}

/* 보석 장착/합성 화면 */
function renderForgeBody(){
  const box=document.getElementById('forgeBody'); if(!box)return;
  let html=allies.map((a,ai)=>`<div class="sock-row">
      <div class="sock-top"><span class="sock-name">${weaponIcon(a.key)}${a.name} · ${a.eq}</span>
      ${a.sock.map((s,si)=>{
        const elHome=si===0;   // 1번 홈 = 원소 홈 (DESIGN 4.2)
        const elTitle=elHome?`[원소 홈 — 허용: ${EQUIP[a.key].elems.map(e=>ELEM_INFO[e][0]).join('·')}] `:'';
        if(s){const g=GEMS[s.type];
          return `<button class="slotbtn filled${elHome?' elem':''}" data-ai="${ai}" data-si="${si}"
            title="${elTitle}${g.name} ${GRADE_TXT[s.grade-1]} — ${gemStatText(g,s.grade,s.type)}"
            style="border-color:${g.color};color:${g.color}${s.grade>=FINAL_GRADE?`;box-shadow:0 0 7px ${g.color}`:''}">${GRADE_TXT[s.grade-1]}</button>`;}
        return `<button class="slotbtn${elHome?' elem':''}" data-ai="${ai}" data-si="${si}" title="${elTitle}빈 홈">${elHome?'◆':'+'}</button>`;
      }).join('')}</div>
      ${statLine(a)}${elemLine(a)}${gemPreview(a)}
    </div>`).join('');
  const inv=invEntries();
  const canMergeAll=inv.some(e=>e.count>=2&&e.grade<GEM_MAX_GRADE);
  /* 종류별 세로 컬럼 — 보석마다 등급별 보유량이 한눈에 (2026-08-21) */
  const byType={};
  inv.forEach(e=>{(byType[e.type]=byType[e.type]||[]).push(e);});
  html+=`<div class="gem-cols">`+(inv.length?Object.keys(GEMS).filter(t=>byType[t]).map(t=>{
      const g=GEMS[t];
      return `<div class="gem-col">
        <div class="gc-hd" style="color:${g.color}"><i class="dot2" style="background:${g.color}"></i>${g.name}
          <span class="cnt">${g.desc}${g.stat2?' · '+g.desc2:''}</span>
          ${g.elem?`<span class="cnt" style="color:${ELEM_INFO[g.elem][1]}">↔${ELEM_INFO[g.elem][0]}</span>`:''}</div>
        ${byType[t].map(e=>`<div class="gc-row ${e.grade>=FINAL_GRADE?'final':''} ${selGem===e.key?'sel':''}"
            data-key="${e.key}" title="${gemStatText(g,e.grade,t)}">
          <b style="color:${g.color}">${GRADE_TXT[e.grade-1]}</b><span class="cnt">${gemValText(g,e.grade)}</span>
          <span class="cnt">×${e.count}</span>
          ${e.count>=2&&e.grade<GEM_MAX_GRADE?`<button data-merge="${e.key}">합성</button>`:''}
        </div>`).join('')}
      </div>`;
    }).join(''):'<span class="forge-hint">보석이 없다. 적을 잡다 보면 가끔 떨어진다.</span>')+`</div>`;
  /* 고른 보석의 전체 효과 (시너지·오라 포함) — 줄에는 요약 값만 있으니 여기서 자세히 */
  if(selGem){
    const [st,sg]=selGem.split(':');
    html+=`<div class="forge-hint" style="margin-top:4px"><b style="color:${GEMS[st].color}">${GEMS[st].name} ${GRADE_TXT[+sg-1]}</b> — ${gemStatText(GEMS[st],+sg,st)}</div>`;
  }
  html+=canMergeAll?`<div class="gem-inv"><button id="mergeAllBtn">일괄 합성</button></div>`:'';
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
    합성: 같은 보석 2개 → 한 등급 위 1개. 일괄 합성은 합칠 수 있는 걸 전부 (연쇄까지) 밀어 올린다.<br>
    <b>◆ 1번 홈은 원소 홈</b> — 거기 끼운 유색 보석이 원소와 단계를 정한다
    (허용 원소만, 등급 Ⅰ~Ⅱ=1 · Ⅲ~Ⅳ=2 · Ⅴ=3단계). 다른 홈의 원소 보석은 스탯·시너지만.</div>`;
  box.innerHTML=html;

  const mab=document.getElementById('mergeAllBtn');
  if(mab) mab.onclick=()=>{
    mergeAllGems(); sfx('hammer');
    if(selGem&&!invCount(selGem)) selGem=null;
    renderForgeBody();
  };

  box.querySelectorAll('.gc-row').forEach(el=>el.onclick=ev=>{
    const mk=ev.target.dataset&&ev.target.dataset.merge;
    if(mk){ mergeGems(mk); sfx('hammer'); if(!invCount(selGem)) selGem=null; renderForgeBody(); return; }
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
    if(t)sfx('gem'); else sfx('hammer');
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

