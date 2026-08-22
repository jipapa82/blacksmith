/* 브라우저 없이 게임 로직 전체를 돌려보는 스모크 테스트 — node tools/smoke.js
   DOM/캔버스/localStorage는 스텁으로 대체하고 3런을 시뮬레이션한다:
   출정 → 레벨업 카드 → 정비(보석 장착·합성) → 런 종료 → 노드 구매 →
   2회차(방패+활, 수동 필살기) → 3회차(방패+단검, 자동 필살기).
   로직을 바꾸면 돌려보고, 검증 항목이 늘면 드라이버에 추가한다. (DESIGN 8.3) */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const FILES = [
  'data/equipment.js', 'data/foes.js', 'data/upgrades.js', 'data/waves.js',
  'data/gems.js', 'data/nodes.js', 'data/status.js',
  'state.js', 'meta.js',
  'combat/units.js', 'combat/loot.js', 'combat/status.js', 'combat/damage.js',
  'combat/actions.js', 'combat/wave.js',
  'render/fx.js', 'render/sound.js', 'render/draw.js',
  'ui/loadout.js', 'ui/balance.js', 'ui/crew.js', 'ui/forge.js', 'ui/levelup.js', 'ui/meta.js',
  'main.js',
];

/* ---- DOM 스텁 ---- */
function stubEl() {
  const el = {
    style: {}, dataset: {}, children: [],
    classList: { add(){}, remove(){}, toggle(){} },
    textContent: '', disabled: false, onclick: null, oninput: null, onchange: null,
    width: 880, height: 400,
    appendChild(c) { this.children.push(c); return c; },
    remove() {}, insertAdjacentHTML() {}, addEventListener() {},
    querySelector() { return stubEl(); },
    querySelectorAll() { return []; },
    getContext() { return ctxStub; },
  };
  let html = '';
  Object.defineProperty(el, 'innerHTML', {
    get() { return html; },
    set(v) { html = v; el.children.length = 0; },
  });
  return el;
}
const ctxStub = new Proxy({}, {
  get(t, p) { return p in t ? t[p] : () => {}; },
  set(t, p, v) { t[p] = v; return true; },
});
const els = {};
const documentStub = {
  getElementById(id) { return els[id] || (els[id] = stubEl()); },
  createElement() { return stubEl(); },
  querySelector() { return stubEl(); },
  querySelectorAll() { return []; },
  addEventListener() {},
};
const storage = {};
/* 구 저장 마이그레이션 검증용 — 10pt→2,000골드 환전 + 구 노드(natk4·nhp2·nult1)가
   무기 레벨 4강 + 연마 구매액 500골드 환급으로 승계되어야 한다 (DESIGN 4.5) */
storage['blacksmith-meta-v1']=JSON.stringify({pts:10,gold:0,nodes:{wand:{natk:4,nhp:2,nult:1}},autoUlt:true});
const localStorageStub = {
  getItem(k) { return k in storage ? storage[k] : null; },
  setItem(k, v) { storage[k] = String(v); },
  removeItem(k) { delete storage[k]; },
};

const sandbox = {
  document: documentStub,
  localStorage: localStorageStub,
  window: { addEventListener() {} },   // v2 조작 리스너용
  console,
  requestAnimationFrame() {},
  setTimeout(fn) { fn(); },   // 연출 지연은 즉시 실행으로 대체
};
vm.createContext(sandbox);

const src = FILES.map(f =>
  `/* ==== ${f} ==== */\n` + fs.readFileSync(path.join(ROOT, f), 'utf8')
).join('\n');

const driver = `
;(function(){
  const out = [];
  out.push('waveCount 1/4/8/12/16: ' + [0,3,7,11,15].map(waveCount).join('/'));
  out.push('저장 마이그레이션: ' + (META.pts===0&&META.gold===2500
    &&metaRank('wand','lvl')===4&&(META.nodes.wand||{}).natk===undefined
    ? 'OK (10pt→2000골드, 구 노드→지팡이 +4강, 연마 환급 500골드)'
    : 'WRONG pts='+META.pts+' gold='+META.gold+' lvl='+metaRank('wand','lvl')));
  out.push('무한 스테이지: ' + (waveCount(16)===waveCount(0) && waveCount(31)===waveCount(15)
    && waveSpec(16).title===WAVE_TITLES[0] && waveSpec(19).boss && !waveSpec(16).boss
    && waveSpec(17).mix.length===1 && waveSpec(20).mix.length===3
    && fmtWave(16)==='16' && fmtWave(17)==='2-1' && fmtWave(32)==='2-16'
    ? 'OK (패턴 반복·구성 리셋·표기·대장 주기)' : 'WRONG'));

  let ultFired = 0;
  function playRun(tag){
    startRun();
    let rounds = 0;
    while (rounds++ < 400) {
      let guard = 0;
      while (running && guard++ < 400000) {
        if (guard % 30 === 0) {                    // v2: 전사 조작 흉내 — 가장 가까운 적을 쫓는다
          const T = allies[0];
          if (T && T.hp > 0) {
            let best = null, bd = 1e9;
            for (const m of mobs) { if (m.hp <= 0) continue;
              const d = Math.hypot(m.x - T.x, m.y - T.y); if (d < bd) { bd = d; best = m; } }
            moveTarget = best ? { x: best.x, y: best.y } : null;
          }
        }
        step(1/60);
        if (guard % 120 === 0) draw(1/60);
        if (guard % 180 === 0)                     // 키 1~5 입력 흉내
          for (let k = 0; k < allies.length; k++) if (fireUlt(k)) ultFired++;
      }
      if (guard >= 400000) return 'STUCK at wave ' + (waveIdx+1);
      if (phase === 'levelup') {
        const cards = document.getElementById('cards').children;
        if (cards.length && cards[0].onclick) cards[0].onclick();
        else return 'LEVELUP with no cards';
      } else if (phase === 'forge') {
        // 보석이 있으면 합성/장착을 한 번씩 흉내 낸다
        let inv = invEntries();
        const m = inv.find(e => e.count >= 2 && e.grade < GEM_MAX_GRADE);
        if (m) mergeGems(m.key);
        inv = invEntries();
        if (inv.length) {
          const k = inv[0].key;
          const a = allies[0], si = a.sock.findIndex(s => !s);
          if (si >= 0 && takeGem(k)) {
            const [t, g] = k.split(':');
            a.sock[si] = { type: t, grade: +g };
            recalcGems(a); a.hp = maxHpOf(a);
          }
        }
        out.push(tag + ' wave ' + (waveIdx+1) + ' clear (' + waveT.toFixed(1) + 's) | Lv' + lv
          + ' kills=' + G.kills + ' gems=' + gemTotal()
          + ' el=[' + allies.map(a => '불'+a.elFire+'독'+a.elPois+'냉'+a.elCold+'진'+a.elShock).join(' ') + ']'
          + ' cards=[' + allies.map(a => Object.keys(a.lv).join('+')||'-').join(' ') + ']');
        document.getElementById('nextBtn').onclick();
      } else if (phase === 'end') {
        return statusTxt.textContent + ' | wave=' + (waveIdx+1) + ' Lv' + lv
          + ' kills=' + G.kills + ' 금고=' + META.gold;
      } else return 'UNEXPECTED phase=' + phase;
    }
    return 'incomplete';
  }

  out.push('--- 1회차 (노드 없음, 대검 전사 — 광역·기폭 흐름 검증) ---');
  loadout = ['great','bow','wand'];
  out.push('RUN1: ' + playRun('r1'));
  out.push('금고 누적: ' + META.gold + '골드' + (META.gold>0?' OK':' NONE_BANKED'));

  // 테스트용 골드 지급 — 공용 구매 + 무기 강화 + 마일스톤 검증
  META.gold += 20000;
  const bought = [];
  if (metaBuy('_global','nreroll')==='ok') bought.push('_global.nreroll');
  metaBuy('shield','lvl'); metaBuy('shield','lvl');           // 방패 2강 — 연마 Ⅰ
  metaBuy('bow','lvl'); metaBuy('bow','lvl');                 // 활 2강 — 연사 7발
  let enhOk=0, enhFail=0;
  for (let t=0;t<80&&metaRank('wand','lvl')<10;t++){
    const res=metaBuy('wand','lvl');
    if(res==='ok')enhOk++; else if(res==='fail')enhFail++; else break;
  }
  const mmW=metaMods('wand');
  out.push('구매·강화(+20000골드): ' + bought.join(', ')
    + ' | 지팡이 +' + metaRank('wand','lvl') + '강 (성공 ' + enhOk + '/실패 ' + enhFail + ') | 금고 ' + META.gold);
  out.push('마일스톤: ' + (mmW.slots>=3&&(metaRank('wand','lvl')<5||mmW.ultPow>=1)
    ? 'OK (3강 홈 3' + (metaRank('wand','lvl')>=5?' · 5강 연마 Ⅱ':'') + ')'
    : 'WRONG lvl='+metaRank('wand','lvl')+' slots='+mmW.slots+' ultPow='+mmW.ultPow));
  /* 강화 실패·천장 — 난수를 고정해 결정적으로 검증 */
  const mr=Math.random;
  (META.nodes.great=META.nodes.great||{}).lvl=9;
  META.gold+=WLEVEL.cost(9)*2;
  Math.random=()=>0.99;                      // 10강 15%면 무조건 실패
  const f1=metaBuy('great','lvl');
  const rateAfterFail=enhRateOf('great');
  Math.random=()=>0;                         // 무조건 성공
  const s1=metaBuy('great','lvl');
  Math.random=mr;
  out.push('강화 실패·천장: ' + (f1==='fail'&&Math.abs(rateAfterFail-.18)<1e-9
    &&s1==='ok'&&metaRank('great','lvl')===10&&META.pity.great===undefined
    ? 'OK (실패 유지 → 15%+3%p → 성공 시 천장 초기화)' : 'WRONG '+f1+'/'+rateAfterFail+'/'+s1));
  out.push('저장 확인: ' + (localStorage.getItem('blacksmith-meta-v1') ? 'localStorage OK' : 'MISSING'));

  out.push('--- 2회차 (수동 모드, 방패 전사 — 질풍 연사 검증) ---');
  META.autoUlt = false;
  loadout = ['shield','bow','wand'];
  startRun();
  const bowAlly = allies.find(a=>a.key==='bow');
  out.push('활 연사 수(2강 연마 Ⅰ → 7발): ' + (5+2*bowAlly.ultRank) + ((5+2*bowAlly.ultRank)===7?' OK':' WRONG'));
  out.push('리롤 횟수(기본0 + 노드1랭크 → 1이어야 함): ' + G.rerolls + (G.rerolls===1?' OK':' WRONG'));
  out.push('RUN2: ' + playRun('r2'));
  out.push('필살기 수동 발동 횟수: ' + ultFired + (ultFired>0?' OK':' NONE_FIRED'));

  out.push('--- 3회차 (자동 모드, 단검 전사 — 암살·질주 검증) ---');
  META.autoUlt = true;
  loadout = ['sword','bow','wand'];
  const before = ultFired;
  out.push('RUN3: ' + playRun('r3'));
  out.push('자동 모드 중 수동 개입(갈무리 리필 틈으로 소수는 정상): ' + (ultFired - before));
  out.push('검증: 활 ultPow=' + allies.filter(a=>a.key==='bow').map(a=>a.ultPow)
    + ' (2강=0.75), 전사 홈=' + allies[0].sock.length + ' isTank=' + allies[0].isTank);
  gainGem('ruby',5); gainGem('ruby',5);
  const ft=mergeFinal('ruby:5','ruby:5');
  const a0=allies[0]; a0.hp=1; a0.sock[0]={type:'ruby',grade:FINAL_GRADE}; recalcGems(a0); recalcAuras();
  out.push('최종 합성+오라: ' + (ft==='ruby'&&invCount('ruby:6')===1&&AURA_ATK>1.11?'OK':'FAIL'));
  gainGem('ruby',5); gainGem('emerald',5);
  const ft2=mergeFinal('ruby:5','emerald:5');
  out.push('50/50 합성: ' + ((ft2==='ruby'||ft2==='emerald')&&invCount(ft2+':6')>=1?'OK':'FAIL'));
  const beforeReset=META.gold, refund=metaReset('wand');
  out.push('무기 초기화 환급: +' + refund + '골드'
    + (refund>0&&META.gold===beforeReset+refund&&!META.nodes.wand?' OK':' WRONG'));
  const multi=allies.filter(a=>[a.elFire,a.elPois,a.elCold,a.elShock].filter(v=>v>0).length>1);
  out.push('원소 잠금: ' + (multi.length ? 'VIOLATION — 한 무기에 2원소 이상' : 'OK (무기당 최대 1원소)'));
  const badEl=allies.filter(a=>{const e=elemOf(a);return e&&!EQUIP[a.key].elems.includes(e);});
  out.push('무기별 원소 제한: ' + (badEl.length ? 'VIOLATION — 허용 밖 원소' : 'OK (허용 목록 준수)'));

  out.push('--- v2 검증: 전사·망루·기폭·대장간 (DESIGN 0장) ---');
  loadout=['shield','bow','wand']; startRun();
  out.push('전사 지정: ' + (allies[0].isTank&&allies[0].hp>0
    ? 'OK (allies[0]='+allies[0].eq+')' : 'WRONG'));
  out.push('망루 배치: ' + (allies[1].x===TOWERS[0].x&&allies[1].y===TOWERS[0].y
    &&allies[2].x===TOWERS[1].x&&allies[2].y===TOWERS[1].y
    ? 'OK (딜러 2명 망루 위)' : 'WRONG'));
  out.push('카드 2+2: ' + (function(){
    const pc=pickCards();
    const tk=pc.filter(c=>c.a.isTank).length, tw=pc.length-tk;
    return pc.length===4&&tk===2&&tw===2 ? 'OK (전사 2 + 망루 2)' : 'WRONG '+tk+'+'+tw+'/'+pc.length;
  })());
  /* 기폭 — 난수 고정(치명 없음): 화상 걸린 적을 전사가 치면 상태를 소모하고 터진다 */
  { const mrD=Math.random; Math.random=()=>0.99;
    const T2=allies[0];
    const md=mkMob('rush'); md.hp=md.maxhp=800; md.def=0; md.x=T2.x+20; md.y=T2.y;
    mobs=[md]; md.burn={t:2,dps:10,pt:0,src:null};
    const hp0=md.hp, atk=atkOf(T2);
    hurtMob(md,atk,T2,false);
    const expDet=Math.max(1,Math.round(20*1.2+atk*.5*1));
    const expected=hp0-Math.max(1,Math.round(atk))-expDet;
    out.push('기폭: ' + (md.burn===null&&md.hp===expected
      ? 'OK (화상 소모 → 폭발 +'+expDet+', '+hp0+'→'+md.hp+')'
      : 'WRONG hp='+md.hp+' 기대='+expected+' burn='+JSON.stringify(md.burn)));
    Math.random=mrD; mobs=[]; }
  FORGE.hp=0; step(1/60);
  out.push('대장간 파괴 종료: ' + (phase==='end'&&statusTxt.textContent==='파괴'
    ? 'OK (내구 0 → 런 종료)' : 'WRONG phase='+phase+' status='+statusTxt.textContent));

  out.push('--- 4회차 (귀환 검증 — 첫 정비에서 런을 끝낸다) ---');
  loadout=['shield','bow','wand'];
  const bestBefore=META.best;
  startRun();
  let r4='';
  for(let i4=0;i4<200&&!r4;i4++){
    let g4=0;
    while(running&&g4++<400000) step(1/60);
    if(phase==='levelup'){ const c=document.getElementById('cards').children;
      if(c.length&&c[0].onclick)c[0].onclick(); else r4='NOCARDS'; }
    else if(phase==='forge'){ document.getElementById('retreatBtn').onclick(); r4='retreat'; }
    else if(phase==='end') r4='died';
  }
  out.push('귀환: ' + (r4==='retreat'&&phase==='end'
    ? 'OK (웨이브 '+(waveIdx+1)+' 정비에서 종료, 최고 기록 '+META.best+(META.best>bestBefore?' 갱신':'')+')'
    : r4==='died' ? '귀환 전 전멸 (허용)' : 'WRONG '+r4));
  return out.join('\\n');
})()
`;

try {
  const output = vm.runInContext(src + driver, sandbox, { filename: 'game-concat.js' });
  console.log(output);
  if (/STUCK|UNEXPECTED|incomplete|MISSING/.test(output)) process.exitCode = 1;
} catch (e) {
  console.error('SMOKE FAIL:', e.stack);
  process.exitCode = 1;
}
