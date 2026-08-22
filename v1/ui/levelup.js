/* ===================== 전투 중 레벨업 (DESIGN 4.1) =====================
   레벨업 순간 잠깐 멈추고 강화 카드 3택. 고르면 바로 이어서. */
function lvOf(a,id){ return a.lv[id]||0; }
function pickCards(){
  const out=[], used=new Set();
  const live=liveAllies();
  for(let i=0;i<4;i++){      // 4택 고정 (DESIGN 4.1) — N+1 규칙은 비교 피로로 폐기
    let tries=0, c=null, tgt=null;
    while(tries++<120){
      /* 황금은 5웨이브부터 웨이브당 +0.3%p, 최대 3% — 빌드 정의 카드는 벌어서 만난다 (DESIGN 4.1.1) */
      const goldP=Math.min(.03,Math.max(0,waveIdx-3)*.003);
      /* 희귀 드로우트 천장 — 희귀 없는 드래프트마다 다음 희귀 확률 +15%p, 등장하면 초기화 (DESIGN 4.1) */
      const rareP=Math.min(.75,.30+.15*(G.rareDry||0));
      const r=Math.random();
      const rar=r<goldP?3:r<goldP+.09?2:r<goldP+.09+rareP?1:0;   // 황금 / 전설 9% / 희귀(천장) / 나머지 일반
      const cands=UP.filter(u=>u.r===rar&&!used.has(u.id));
      if(!cands.length)continue;
      /* 볼거리 가중치 (DESIGN 4.1) — 같은 희귀도 안에서 vis 카드는 3배로 자주 뽑힌다 */
      const pool=[];
      cands.forEach(u=>{for(let k=0,w=u.vis?3:1;k<w;k++)pool.push(u);});
      const u=pool[Math.floor(Math.random()*pool.length)];
      const valid=live.filter(a=>u.ok(a)&&lvOf(a,u.id)<u.max);
      if(!valid.length)continue;
      c=u; tgt=valid[Math.floor(Math.random()*valid.length)]; break;
    }
    if(c){used.add(c.id); out.push({u:c,a:tgt});}
  }
  if(out.length){                                  // 드로우트 천장 갱신
    if(out.some(c=>c.u&&c.u.r>=1)) G.rareDry=0;
    else G.rareDry=(G.rareDry||0)+1;
  }
  /* 무기 카드 (DESIGN 4.1, 2026-08-22) — 고용 폐지: 무기는 드래프트에서 만난다.
     파티에 없는 무기가 출정 풀(META.draftPool)에 있으면 드래프트당 최대 1장, 25% 확률.
     보유가 늘수록 후보가 줄어 자연히 덜 나오고, 다 모으면 안 나온다 */
  if(out.length&&Math.random()<.25){
    const taken=new Set(allies.map(x=>x.key));
    const wc=Object.keys(EQUIP).filter(k=>!taken.has(k)&&META.draftPool[k]!==false);
    if(wc.length) out[out.length-1]={weapon:wc[Math.floor(Math.random()*wc.length)]};
  }
  return out;
}
function drawCards(cards,onPick){
  const box=document.getElementById('cards'); if(!box)return;
  box.innerHTML='';
  if(!cards.length){
    box.innerHTML='<div class="ov-sub">더 새길 곳이 없다. 모든 강화가 끝까지 올라갔다.</div>';
    return;
  }
  cards.forEach(c=>{
    if(c.weapon){                                  // 무기 카드 — 고르면 새 용병이 들고 합류 (4.1)
      const k=c.weapon, v=EQUIP[k], L=metaRank(k,'lvl');
      const el=document.createElement('div');
      el.className='card wpn';
      el.innerHTML=`<div class="target">새 무기 — 용병이 합류한다</div>
        <div class="cname">${weaponIcon(k)}${v.name}${L?` <span class="lvtag">+${L}강</span>`:''}</div>
        <div class="cdesc">${v.desc}</div>
        <div class="cdesc" style="color:var(--heat)">필살 · ${v.ultName} — ${ultHead(k)}</div>
        <div class="cdesc">원소 ${elemChoices(k)}</div>
        <div class="crar">무기 · 획득 시 리롤 +1</div>`;
      el.onclick=()=>{
        sfx('hire'); hireMerc(k); G.rerolls++;
        renderCrew(); renderLoadout(); onPick();
      };
      box.appendChild(el); return;
    }
    const cls=['','rare','epic','gold'][c.u.r];
    const cur=lvOf(c.a,c.u.id), next=cur+1, max=c.u.max;
    const pips=Array.from({length:max},(_,i)=>
      `<i class="pip${i<cur?' on':''}${i===cur?' next':''}"></i>`).join('');
    const el=document.createElement('div');
    el.className='card '+cls;
    el.innerHTML=`<div class="target">${weaponIcon(c.a.key)}${c.a.eq}</div>
      <div class="cname">${c.u.n} <span class="lvtag">${next}단계</span>${c.u.when?`<span class="when-tag">${c.u.when}</span>`:''}</div>
      <div class="pips">${pips}</div>
      <div class="cdesc">${c.u.d(c.a,cur)}</div>
      <div class="crar">${RAR[c.u.r]} · 최대 ${max}단계</div>`;
    el.onclick=()=>{
      sfx('pick');
      c.u.f(c.a);
      c.a.lv[c.u.id]=next;
      renderCrew(); renderLoadout();
      onPick();
    };
    box.appendChild(el);
  });
}

function openLevelUp(){
  const cards=pickCards();
  if(!cards.length){ pendingLv--; running=true; return; }  // 새길 곳이 없으면 그냥 지나간다
  phase='levelup'; sfx('levelup');
  const ov=document.createElement('div'); ov.className='overlay'; ov.id='ov';
  ov.innerHTML=`
    <div class="ov-eyebrow">레벨 ${lv}</div>
    <div class="ov-title">벼려낼 곳</div>
    <div class="ov-sub">싸움이 잠깐 숨을 고른다. 하나를 골라 새기면 바로 이어진다.</div>
    <div class="cards" id="cards"></div>
    <div class="ov-row"><button id="rerollBtn">다시 뽑기 · ${G.rerolls}회 남음</button></div>`;
  document.getElementById('arena').appendChild(ov);
  const done=()=>{ document.getElementById('ov').remove(); pendingLv--; phase='fight'; running=true; };
  drawCards(cards,done);
  const rb=document.getElementById('rerollBtn');
  rb.disabled=G.rerolls<=0;
  rb.onclick=()=>{
    if(G.rerolls<=0)return;
    G.rerolls--;
    rb.textContent=`다시 뽑기 · ${G.rerolls}회 남음`; rb.disabled=G.rerolls<=0;
    drawCards(pickCards(),done);
  };
}
