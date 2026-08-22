/* ===================== 편성 UI ===================== */

/* 무기 문양 아이콘 (SVG) — 캔버스의 도형 언어(DESIGN 7.3)와 같은 모양.
   카드·정비·부대 어디서든 이걸로 무기를 한눈에 알아본다. */
function weaponIcon(key){
  const e=EQUIP[key]; if(!e)return '';
  const shapes={
    sword:'<polygon points="9,1 12.5,17 5.5,17"/>',                  // 좁은 삼각 — 단검
    great:'<polygon points="9,2 17,17 1,17"/>',                      // 넓은 삼각 — 대검
    shield:'<rect x="2.5" y="2.5" width="13" height="13"/>',         // 사각 — 방패
    bow:'<polygon points="9,1 17,9 9,17 1,9"/>',                     // 마름모 — 원거리
    wand:'<polygon points="17,9 13,15.9 5,15.9 1,9 5,2.1 13,2.1"/>', // 육각 — 마법
  };
  return `<span class="wicon"><svg viewBox="0 0 18 18" fill="${e.color}" stroke="rgba(255,255,255,.35)" stroke-width="1">${shapes[key]||''}</svg></span>`;
}

/* 무기가 고를 수 있는 원소 표시 (DESIGN 4.1.1 무기별 원소 제한) */
/* 원소 정식 명칭 — 화염·독·냉기·진동. 상태이상은 화상·중독·한기·빙결·공명·휘청 (DESIGN 4.1.1 용어 사전) */
const ELEM_INFO={fire:['화염','#E8963C'],pois:['독','#8FBF6A'],cold:['냉기','#9AD9E8'],shock:['진동','#9B8ACB']};
function elemChoices(key){
  return EQUIP[key].elems.map(e=>
    `<span style="color:${ELEM_INFO[e][1]}">● ${ELEM_INFO[e][0]}</span>`).join(' ');
}

/* 필살기 정확 설명 — 수치는 combat/actions.js ultimate()와 동기 (바꾸면 여기도, 7.2 표시=판정) */
function ultHead(k){
  const mm=metaMods(k);
  return EQUIP[k].trait==='shoot'
    ? `연사 ${5+2*mm.ultRank}발 · 쿨 ${EQUIP[k].ultCd}초`
    : `위력 ${Math.round(mm.ultPow*100)}% · 쿨 ${EQUIP[k].ultCd}초`;
}
function ultDescOf(k){
  const mm=metaMods(k), p=x=>Math.round(x*mm.ultPow*100);
  switch(EQUIP[k].trait){
    case 'assassin': return `침투자 중 최대 체력의 적을 일격 — 공격력의 ${p(6)}%. 침투자가 없으면 전장 최대 체력을 노린다`;
    case 'cleave':   return `전선 앞으로 3연타 — 타당 공격력의 ${p(.9)}%, 반경 90`;
    case 'wall':     return `주위 135 안의 적에게 공격력의 ${p(2)}% 피해 + 50 밀치기 + 1.3초 경직`;
    case 'shoot':    return `기본 사격(부채꼴·카드 반영)을 연달아 — 발마다 필살 판정(기폭·추수 적용)`;
    case 'blast':    return `앞쪽으로 4연폭 — 폭당 공격력의 ${p(.85)}%, 반경 115`;
  }
  return '';
}

const mercList=document.getElementById('mercList');
function renderLoadout(){
  mercList.innerHTML='';
  loadout.forEach((k,i)=>{
    const e=EQUIP[k], front=i===0;
    const bad=front&&(e.trait==='shoot'||e.trait==='blast'||e.trait==='assassin');
    const bad2=!front&&e.trait==='wall';
    const d=document.createElement('div'); d.className='merc-row';
    d.innerHTML=`<div class="merc-top">
        <span class="rowtag ${front?'front':'back'}">${front?'앞줄':'뒷줄'}</span>
        <span>용병 ${String.fromCharCode(65+i)}</span></div>
      <select data-slot="${i}">${Object.entries(EQUIP).map(([kk,v])=>
        `<option value="${kk}" ${kk===k?'selected':''}>${v.name}</option>`).join('')}</select>
      <div class="derived"><span>공 <b>${e.atk}</b></span><span>방 <b>${e.def}</b></span>
        <span>체 <b>${e.hp}</b></span><span>속 <b>${e.spd.toFixed(2)}</b></span></div>
      <div class="trait-note">${e.desc}</div>
      <div class="trait-note" style="color:var(--heat)">필살 · ${e.ultName} — ${ultHead(k)}</div>
      <div class="trait-note">${ultDescOf(k)}</div>
      <div class="derived">원소 ${elemChoices(k)}</div>
      ${bad?`<div class="warn-note">${e.trait==='assassin'?'앞줄에 서면 지킬 후미가 없다':'앞줄에 세우면 둘러싸인다'}</div>`:''}
      ${bad2?'<div class="warn-note">뒷줄에서는 막을 것이 없다</div>':''}`;
    mercList.appendChild(d);
  });
  /* 드래프트 등장 무기 (DESIGN 4.1) — 체크한 무기만 전투 중 무기 카드로 나온다.
     강화 안 된 무기를 빼두는 용도. 시작 편성 2종은 이미 데리고 나가므로 목록에서 제외 */
  const rest=Object.keys(EQUIP).filter(k=>!loadout.includes(k));
  if(rest.length){
    const d2=document.createElement('div'); d2.className='merc-row';
    d2.innerHTML=`<div class="merc-top"><span>드래프트 등장 무기</span></div>`
      +rest.map(k=>{const L=metaRank(k,'lvl');
        return `<label class="pool-row"><input type="checkbox" data-pool="${k}"${META.draftPool[k]!==false?' checked':''}>`
          +`${weaponIcon(k)}${EQUIP[k].name}${L?` <b>+${L}강</b>`:' <span style="opacity:.5">무강화</span>'}</label>`;}).join('')
      +`<div class="trait-note">체크한 무기만 전투 중 드래프트에 무기 카드로 나온다. 고르면 그 무기를 든 용병이 합류한다</div>`;
    mercList.appendChild(d2);
    d2.querySelectorAll('input[data-pool]').forEach(cb=>cb.onchange=()=>{
      META.draftPool[cb.dataset.pool]=cb.checked; saveMeta();
    });
  }
  mercList.querySelectorAll('select').forEach(s=>s.onchange=ev=>{
    const slot=+ev.target.dataset.slot,pick=ev.target.value,o=1-slot;
    if(loadout[o]===pick) loadout[o]=loadout[slot];
    loadout[slot]=pick; renderLoadout(); reset();
  });
}
document.getElementById('swapBtn').onclick=()=>{loadout.reverse();renderLoadout();reset();};
