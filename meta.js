/* ===================== 영구 성장 저장/적용 =====================
   런이 끝나면 스탯 포인트를 받고, 무기별 노드에 영구히 찍는다. (DESIGN 4.5)
   localStorage에 저장. 막히면(사생활 모드 등) 그 세션 동안만 유지된다. */
const META_KEY='blacksmith-meta-v1';
const META=(()=>{ try{
    const j=JSON.parse(localStorage.getItem(META_KEY));
    if(j&&typeof j.pts==='number'&&j.nodes) return j;
  }catch(e){}
  return {pts:0, nodes:{}}; })();
function saveMeta(){ try{localStorage.setItem(META_KEY,JSON.stringify(META));}catch(e){} }

function metaRank(k,id){ return (META.nodes[k]||{})[id]||0; }
function metaBuy(k,id){
  const n=NODES.find(x=>x.id===id), r=metaRank(k,id);
  if(!n||r>=n.max) return false;
  const c=n.costs[r]; if(META.pts<c) return false;
  META.pts-=c; (META.nodes[k]=META.nodes[k]||{})[id]=r+1; saveMeta();
  return true;
}
/* mkAlly가 읽는 무기별 영구 보정 */
function metaMods(k){
  const r=id=>metaRank(k,id);
  return { atkMul:1+.05*r('natk'), aspdMul:1+.04*r('naspd'), hpMul:1+.06*r('nhp'),
    defAdd:r('ndef'), slots:2+r('nslot'), ultOn:r('nult')>0 };
}
