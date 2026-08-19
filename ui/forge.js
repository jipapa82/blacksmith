/* ===================== 대장간 (웨이브 사이 오버레이) =====================
   웨이브가 끝나면 전원 완전 회복, 죽은 용병은 새 용병으로 교체. (DESIGN 3.5) */
let mercLetter=0;
function nextMercName(){ return '용병 '+String.fromCharCode(65+(mercLetter++%26)); }

function restoreCrew(){
  const fallen=[];
  allies.forEach(a=>{
    if(a.hp<=0){ fallen.push({eq:a.eq, old:a.name}); a.name=nextMercName(); }
    a.hp=a.maxhp; a.charge=0; a.hit=0; a.lung=0;
  });
  layoutAllies();
  return fallen;
}

function lvOf(a,id){ return a.lv[id]||0; }
function pickCards(){
  const out=[], used=new Set();
  const live=liveAllies();
  for(let i=0;i<3;i++){
    let tries=0, c=null, tgt=null;
    while(tries++<120){
      const r=Math.random(); const rar=r<.58?0:r<.88?1:2;
      const cands=UP.filter(u=>u.r===rar&&!used.has(u.id));
      if(!cands.length)continue;
      const u=cands[Math.floor(Math.random()*cands.length)];
      const valid=live.filter(a=>u.ok(a)&&lvOf(a,u.id)<u.max);
      if(!valid.length)continue;
      c=u; tgt=valid[Math.floor(Math.random()*valid.length)]; break;
    }
    if(c){used.add(c.id); out.push({u:c,a:tgt});}
  }
  return out;
}
function openForge(){
  phase='forge';
  const fallen=restoreCrew();
  renderCrew();
  const cards=pickCards();
  const ov=document.createElement('div'); ov.className='overlay'; ov.id='ov';
  const fallenTxt = fallen.length
    ? fallen.map(f=>`${f.old}는 돌아오지 못했다. ${f.eq}는 새 손에 넘어간다.`).join('<br>')
    : '용병들은 상처를 씻고 다시 선다.';
  ov.innerHTML=`
    <div class="ov-eyebrow">웨이브 ${waveIdx+1} 방어 성공</div>
    <div class="ov-title">대장간</div>
    <div class="ov-sub">${fallenTxt}</div>
    <div class="purse"><span class="g">골드 <b id="ovGold">${G.gold}</b></span>
      <span class="m">재료 <b>${G.mats}</b></span>
      <span style="color:var(--dim)">용병 <b>${allies.length}</b> / ${Object.keys(EQUIP).length}</span></div>
    <div class="cards" id="cards"></div>
    <div class="ov-row">
      <button id="rerollBtn">다시 뽑기 · ${G.reroll}골드</button>
      <button id="hireBtn">용병 고용 · ${G.hireCost}골드</button>
      <button class="primary" id="nextBtn">다음 웨이브</button>
    </div>`;
  document.getElementById('arena').appendChild(ov);
  drawCards(cards);
  bindForgeButtons();
  syncForgeBtns();
}
function bindForgeButtons(){
  const rb=document.getElementById('rerollBtn');
  if(rb) rb.onclick=()=>{
    if(G.gold<G.reroll)return;
    G.gold-=G.reroll; G.reroll+=5;
    goldTxt.textContent=G.gold;
    document.getElementById('ovGold').textContent=G.gold;
    rb.textContent=`다시 뽑기 · ${G.reroll}골드`;
    drawCards(pickCards()); syncForgeBtns();
  };
  const hb=document.getElementById('hireBtn');
  if(hb) hb.onclick=()=>{
    if(G.gold<G.hireCost||allies.length>=Object.keys(EQUIP).length)return;
    openHirePicker(k=>{
      G.gold-=G.hireCost;
      G.hireCost = allies.length>=3 ? 6000 : 2000;
      goldTxt.textContent=G.gold;
      hireMerc(k); renderCrew();
      document.getElementById('ov').remove(); advance();
    });
  };
  const nb=document.getElementById('nextBtn');
  if(nb) nb.onclick=()=>{ document.getElementById('ov').remove(); advance(); };
}
function syncForgeBtns(){
  const r=document.getElementById('rerollBtn'), h=document.getElementById('hireBtn');
  if(r)r.disabled=G.gold<G.reroll;
  if(h)h.disabled=G.gold<G.hireCost||allies.length>=Object.keys(EQUIP).length;
}
function drawCards(cards){
  const box=document.getElementById('cards'); if(!box)return;
  box.innerHTML='';
  if(!cards.length){
    box.innerHTML='<div class="ov-sub">더 새길 곳이 없다. 모든 강화가 끝까지 올라갔다.</div>';
    return;
  }
  cards.forEach(c=>{
    const cls=['','rare','epic'][c.u.r];
    const cur=lvOf(c.a,c.u.id), next=cur+1, max=c.u.max;
    const pips=Array.from({length:max},(_,i)=>
      `<i class="pip${i<cur?' on':''}${i===cur?' next':''}"></i>`).join('');
    const el=document.createElement('div');
    el.className='card '+cls;
    el.innerHTML=`<div class="target">${c.a.eq}</div>
      <div class="cname">${c.u.n} <span class="lvtag">${next}단계</span></div>
      <div class="pips">${pips}</div>
      <div class="cdesc">${c.u.d(c.a,cur)}</div>
      <div class="crar">${RAR[c.u.r]} · 최대 ${max}단계</div>`;
    el.onclick=()=>{
      c.u.f(c.a);
      c.a.lv[c.u.id]=next;
      renderCrew(); renderLoadout();
      document.getElementById('ov').remove(); advance();
    };
    box.appendChild(el);
  });
}

/* ===== 용병 선택 ===== */
function openHirePicker(onDone){
  const box=document.getElementById('cards'); if(!box)return;
  const row=document.querySelector('.ov-row');
  const sub=document.querySelector('.ov-sub');
  const keep=box.innerHTML, keepRow=row.innerHTML, keepSub=sub.innerHTML;
  const taken=new Set(allies.map(a=>a.key));
  const avail=Object.entries(EQUIP).filter(([k])=>!taken.has(k));
  sub.innerHTML='아직 주인이 없는 장비다. 하나를 골라 들려 보낸다.';
  box.innerHTML='';
  avail.forEach(([k,v])=>{
    const el=document.createElement('div');
    el.className='card';
    el.innerHTML=`<div class="target">새 용병</div>
      <div class="cname">${v.name}</div>
      <div class="cdesc">${v.desc}</div>
      <div class="cdesc" style="color:var(--heat)">필살 · ${v.ultName}</div>
      <div class="crar">공 ${v.atk} · 방 ${v.def} · 체 ${v.hp} · 속 ${v.spd.toFixed(2)}</div>`;
    el.onclick=()=>onDone(k);
    box.appendChild(el);
  });
  row.innerHTML='<button id="cancelHire">그만두기</button>';
  document.getElementById('cancelHire').onclick=()=>{
    box.innerHTML=keep; row.innerHTML=keepRow; sub.innerHTML=keepSub;
    bindForgeButtons();
  };
}
