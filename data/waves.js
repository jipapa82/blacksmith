/* ===================== 웨이브 데이터 ===================== */
const WAVE_TITLES=['척후','몰려드는 무리','옆을 파고든다','첫 번째 대장',
  '멀리서 쏜다','끊이지 않는다','좁혀오는 포위','두 번째 대장',
  '밀물','그림자가 길다','틈을 노린다','세 번째 대장',
  '쏟아진다','앞이 보이지 않는다','마지막 숨','대장들의 밤'];

/* 웨이브가 오를수록 적 체력이 세지는 배수 — 복리/웨이브. 무한 웨이브의 난이도 다이얼 (DESIGN 3.7).
   플레이어 성장(원소·보석·노드)은 유한하므로 복리 체력이 반드시 벽을 만든다 — 기록은 "어디까지".
   +12%→+15%→+18% (2026-08-21): 슬라이더를 올려도 스탯 없이 16웨이브가 뚫렸다.
   ×1.18은 측정값 — 풀노드 봇의 벽이 w20~21에 일관되게 서고, 교착 없이 전멸로 끝난다.
   공격력은 최소 성장 유지(units.js) — 압박은 체력과 물량이 담당한다. */
function waveScale(i){ return Math.pow(1.18,i); }

/* 섬멸 목표 마릿수 (DESIGN 3.6) — 시간제 시절의 실측 곡선을 잇는다.
   기준 22→28(레벨업이 전투 중으로)→36(웨이브가 짧아 재미없다는 체감, 2026-08-20).
   마릿수·스폰 페이스는 16웨이브 수준에서 캡 (DESIGN 3.7) — 그 뒤 난이도는 물량이 아니라
   체력 복리가 끈다 (물량을 더 키우면 성능과 가독성이 무너진다).
   waveSize 슬라이더(웨이브 규모)가 전체를 늘리고 줄인다. */
function waveCount(i){
  const j=Math.min(i,15);
  return Math.round(36*waveSize*(1+j*0.045)/(0.95*Math.pow(0.917,j))*(1+Math.floor(j/4)*0.7));
}

function waveSpec(i){
  const j=Math.min(i,15), t=j/15;
  const mix=[['rush',Math.max(.35,1-t*.55)]];
  if(i>=2)mix.push(['breaker',.1+t*.2]);
  if(i>=4)mix.push(['archer',.08+t*.22]);
  const s=mix.reduce((a,b)=>a+b[1],0); mix.forEach(m=>m[1]/=s);
  return{title:WAVE_TITLES[i]||('끝없는 물결 '+(i-15)), mix,
    every:0.95*Math.pow(0.917,j),
    burst:1+Math.floor(j/4),
    count:waveCount(i),
    boss:i%4===3};
}
