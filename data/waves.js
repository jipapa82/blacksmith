/* ===================== 웨이브 데이터 ===================== */
const WAVE_TITLES=['척후','몰려드는 무리','옆을 파고든다','첫 번째 대장',
  '멀리서 쏜다','끊이지 않는다','좁혀오는 포위','두 번째 대장',
  '밀물','그림자가 길다','틈을 노린다','세 번째 대장',
  '쏟아진다','앞이 보이지 않는다','마지막 숨','대장들의 밤'];

/* 웨이브가 오를수록 적 체력이 세지는 배수 — 복리(+12%/웨이브, 2026-08-21).
   플레이어 성장(원소·보석·노드)이 복리라서 체력도 복리로 따라간다.
   공격력은 선형 유지(units.js) — 한 방이 복리로 아파지면 즉사 게임이 된다. */
function waveScale(i){ return Math.pow(1.12,i); }

/* 섬멸 목표 마릿수 (DESIGN 3.6) — 시간제 시절의 실측 곡선을 잇는다.
   기준 22→28(레벨업이 전투 중으로)→36(웨이브가 짧아 재미없다는 체감, 2026-08-20).
   waveSize 슬라이더(웨이브 규모)가 전체를 늘리고 줄인다. */
function waveCount(i){
  return Math.round(36*waveSize*(1+i*0.045)/(0.95*Math.pow(0.917,i))*(1+Math.floor(i/4)*0.7));
}

function waveSpec(i){
  const t=i/15;
  const mix=[['rush',Math.max(.35,1-t*.55)]];
  if(i>=2)mix.push(['breaker',.1+t*.2]);
  if(i>=4)mix.push(['archer',.08+t*.22]);
  const s=mix.reduce((a,b)=>a+b[1],0); mix.forEach(m=>m[1]/=s);
  return{title:WAVE_TITLES[i]||'끝없는 물결', mix,
    every:0.95*Math.pow(0.917,i),
    burst:1+Math.floor(i/4),
    count:waveCount(i),
    boss:(i===3||i===7||i===11||i===15)};
}
