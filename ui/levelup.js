/* ===================== 전투 중 레벨업 (DESIGN 4.1) =====================
   레벨업 순간 잠깐 멈추고 강화 카드 3택. 고르면 바로 이어서. */
function lvOf(a,id){ return a.lv[id]||0; }
function pickCards(){
  const out=[], used=new Set();
  const live=liveAllies();
  const n=allies.length+1;   // 용병 2명=3택, 한 명 늘 때마다 +1 (최대 5명=6택)
  for(let i=0;i<n;i++){
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
function drawCards(cards,onPick){
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
      onPick();
    };
    box.appendChild(el);
  });
}

function openLevelUp(){
  const cards=pickCards();
  if(!cards.length){ pendingLv--; running=true; return; }  // 새길 곳이 없으면 그냥 지나간다
  phase='levelup';
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
