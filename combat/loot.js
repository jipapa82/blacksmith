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
function invEntries(){
  return Object.entries(G.gems).map(([k,c])=>{
    const [t,g]=k.split(':'); return {key:k,type:t,grade:+g,count:c};
  }).sort((a,b)=>a.type===b.type?a.grade-b.grade:(a.type<b.type?-1:1));
}

/* 처치 시 드랍. 대장은 확정 2개(단계 보정), 잡졸은 확률. */
function dropLoot(m){
  if(m.type==='boss'){
    gainGem(rollGemType(), 1+Math.ceil(waveIdx/5));
    gainGem(rollGemType(), 1+Math.floor(waveIdx/8));
    num(m.x,m.y-18,'보석!','#6FC9CE',1);
  }else if(Math.random()<.10){
    gainGem(rollGemType(), 1+(Math.random()<waveIdx*.02?1:0));
    num(m.x,m.y-18,'보석','#6FC9CE');
  }
}
