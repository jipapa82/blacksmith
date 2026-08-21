/* ===================== 전역 상태 =====================
   전역 공유 상태는 이 파일 한 곳에만 둔다. 런 단위 초기화는 main.js의 reset(). */
let loadout=['shield','bow'];   // 기본 편성: 용병 A 참나무 방패(앞줄) + 용병 B 사냥 활(뒷줄)
let speed=1, running=false, phase='idle';
let allies=[], mobs=[], fxs=[], nums=[];
let waveIdx=0, waveT=0, spawnT=0, shake=0;
let waveSpawned=0, waveKills=0, curWave=null;   // 섬멸형: 이번 웨이브의 스폰/처치 집계
let lv=1, xp=0, pendingLv=0;                    // 전투 중 레벨업 (DESIGN 4.1)
let hasteT=0;                                   // 질풍의 오라(최종 에메랄드) 남은 시간
let foeMul=1, rateMul=1, waveSize=1;
/* 재료(mats)는 6.4 장비 해금 층을 설계할 때 드랍부터 다시 넣는다 (2026-08-20 제거) */
const G={gold:0, kills:0, goldMul:1, rerolls:0, hireCost:200, gems:{}};

/* 캔버스와 전장 좌표 */
const cv=document.getElementById('cv'), ctx=cv.getContext('2d');
const W=cv.width, H=cv.height;
const BACK_X=112, FRONT_X=228, MID_Y=H/2;

/* HUD DOM 참조 */
const goldTxt=document.getElementById('goldTxt'),
      aliveTxt=document.getElementById('aliveTxt'),
      killTxt=document.getElementById('killTxt'),
      statusTxt=document.getElementById('statusTxt'),
      waveNum=document.getElementById('waveNum'),
      waveTitle=document.getElementById('waveTitle'),
      timeFill=document.getElementById('timeFill'),
      lvTxt=document.getElementById('lvTxt'),
      gemTxt=document.getElementById('gemTxt'),
      xpFill=document.getElementById('xpFill');
