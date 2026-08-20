/* ===================== 전리품: 경험치 / 보석 드랍 =====================
   보석 인벤토리는 G.gems — "종류:단계" → 개수. 런 한정, reset()이 비운다. */
function xpNeed(l){ return Math.round(30*Math.pow(1.28,l-1)); }
function gainXp(v){
  xp+=v;
  while(xp>=xpNeed(lv)){ xp-=xpNeed(lv); lv++; pendingLv++; }
}

function gemKey(t,g){ return t+':'+g; }
function rollGemType(){ const ks=Object.keys(GEMS); return ks[Math.floor(Math.random()*ks.length)]; }
function gemTotal(){ return Object.values(G.gems).reduce((a,b)=>a+b,0); }
function invCount(k){ return G.gems[k]||0; }
function gainGem(type,grade){
  grade=Math.min(GEM_MAX_GRADE,Math.max(1,grade));
  const k=gemKey(type,grade); G.gems[k]=(G.gems[k]||0)+1;
  gemTxt.textContent=gemTotal();
}
function takeGem(k){
  if(!G.gems[k])return false;
  if(--G.gems[k]<=0) delete G.gems[k];
  gemTxt.textContent=gemTotal(); return true;
}
/* 같은 종류·단계 2개 → 한 단계 위 1개. 실패 없음. (DESIGN 4.4) */
function mergeGems(k){
  const [t,g]=k.split(':'), gr=+g;
  if(gr>=GEM_MAX_GRADE||invCount(k)<2)return false;
  takeGem(k); takeGem(k); gainGem(t,gr+1); return true;
}
/* 일괄 합성 — 종류마다 낮은 단계부터 쌍을 전부 밀어 올린다. 오름차순이라 연쇄가 저절로 된다. */
function mergeAllGems(){
  let n=0;
  for(const t of Object.keys(GEMS)){
    for(let gr=1; gr<GEM_MAX_GRADE; gr++){
      const k=gemKey(t,gr), pairs=Math.floor(invCount(k)/2);
      if(!pairs) continue;
      G.gems[k]-=pairs*2; if(G.gems[k]<=0) delete G.gems[k];
      const up=gemKey(t,gr+1); G.gems[up]=(G.gems[up]||0)+pairs;
      n+=pairs;
    }
  }
  if(n) gemTxt.textContent=gemTotal();
  return n;
}
function invEntries(){
  return Object.entries(G.gems).map(([k,c])=>{
    const [t,g]=k.split(':'); return {key:k,type:t,grade:+g,count:c};
  }).sort((a,b)=>a.type===b.type?a.grade-b.grade:(a.type<b.type?-1:1));
}

/* 처치 시 드랍. 대장은 확정(단계 보정), 잡졸은 확률. 수치는 data/gems.js의 GEM_DROP. */
function dropLoot(m){
  if(m.type==='boss'){
    gainGem(rollGemType(), 1+Math.ceil(waveIdx/5));
    for(let i=1;i<GEM_DROP.bossGems;i++) gainGem(rollGemType(), 1+Math.floor(waveIdx/8));
    num(m.x,m.y-18,'보석!','#6FC9CE',1);
  }else if(Math.random()<GEM_DROP.rate){
    gainGem(rollGemType(), 1+(Math.random()<waveIdx*GEM_DROP.gradeUpPerWave?1:0));
    num(m.x,m.y-18,'보석','#6FC9CE');
  }
}
