/* ===================== 웨이브 데이터 ===================== */
const WAVE_TITLES=['척후','몰려드는 무리','옆을 파고든다','첫 번째 대장',
  '멀리서 쏜다','끊이지 않는다','좁혀오는 포위','두 번째 대장',
  '밀물','그림자가 길다','틈을 노린다','세 번째 대장',
  '쏟아진다','앞이 보이지 않는다','마지막 숨','대장들의 밤'];

/* 무한 스테이지 (DESIGN 3.7) — 1~16웨이브의 패턴(마릿수·페이스·구성·대장·이름)이
   스테이지 단위로 반복되고, 체력 복리만 전역으로 계속 오른다.
   스테이지가 바뀌는 순간 "같은 패턴, 약 ×14 체력" — 초입은 적게 나오는 굵은 적. */
const STAGE_LEN=16;
function stageOf(i){ return Math.floor(i/STAGE_LEN)+1; }
/* 웨이브 번호 표기 — 1스테이지는 "7", 2스테이지부터 "2-7" (n은 1부터 세는 전역 번호) */
function fmtWave(n){ return n<=STAGE_LEN?String(n):(Math.floor((n-1)/STAGE_LEN)+1)+'-'+((n-1)%STAGE_LEN+1); }

/* 웨이브가 오를수록 적 체력이 세지는 배수 — 복리/웨이브. 무한 스테이지의 난이도 다이얼 (DESIGN 3.7).
   전역 지수라 스테이지를 넘어도 이어진다 — 1.20^16 ≈ ×18.5가 곧 스테이지 점프 폭.
   플레이어 성장(원소·보석·노드)은 유한하므로 복리 체력이 반드시 벽을 만든다 — 기록은 "어디까지".
   +12%→+15%→+18%→+20% (2026-08-21): 공격력 -40% 이후에도 스탯 0 계정이 1스테이지를 무난히 깼다.
   공격력은 최소 성장 유지(units.js) — 압박은 체력과 물량이 담당한다. */
function waveScale(i){ return Math.pow(1.20,i); }

/* 섬멸 목표 마릿수 (DESIGN 3.6) — 시간제 시절의 실측 곡선을 잇는다.
   기준 22→28(레벨업이 전투 중으로)→36(웨이브가 짧아 재미없다는 체감, 2026-08-20).
   스테이지 안 위치(j)만 본다 — 패턴은 스테이지마다 똑같이 반복 (DESIGN 3.7).
   waveSize 슬라이더(웨이브 규모)가 전체를 늘리고 줄인다. */
function waveCount(i){
  const j=i%STAGE_LEN;
  return Math.round(36*waveSize*(1+j*0.045)/(0.95*Math.pow(0.917,j))*(1+Math.floor(j/4)*0.7));
}

function waveSpec(i){
  const j=i%STAGE_LEN, t=j/15;
  const mix=[['rush',Math.max(.35,1-t*.55)]];
  if(j>=2)mix.push(['breaker',.1+t*.2]);
  if(j>=4)mix.push(['archer',.08+t*.22]);
  const s=mix.reduce((a,b)=>a+b[1],0); mix.forEach(m=>m[1]/=s);
  return{title:WAVE_TITLES[j], mix,
    every:0.95*Math.pow(0.917,j),
    burst:1+Math.floor(j/4),
    count:waveCount(i),
    boss:j%4===3};
}
