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
  'render/fx.js', 'render/draw.js',
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
    remove() {}, insertAdjacentHTML() {},
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
const localStorageStub = {
  getItem(k) { return k in storage ? storage[k] : null; },
  setItem(k, v) { storage[k] = String(v); },
  removeItem(k) { delete storage[k]; },
};

const sandbox = {
  document: documentStub,
  localStorage: localStorageStub,
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

  let ultFired = 0;
  function playRun(tag){
    startRun();
    let rounds = 0;
    while (rounds++ < 400) {
      let guard = 0;
      while (running && guard++ < 400000) {
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
          + ' kills=' + G.kills + ' pts=' + META.pts;
      } else return 'UNEXPECTED phase=' + phase;
    }
    return 'incomplete';
  }

  out.push('--- 1회차 (노드 없음, 필살기 위력 50%) ---');
  out.push('RUN1: ' + playRun('r1'));
  out.push('금고 누적: ' + META.gold + '골드' + (META.gold>0?' OK':' NONE_BANKED'));

  // 테스트용 포인트 지급 후 노드 구매 (연마·리롤·수동 발동 경로 검증)
  META.pts += 12;
  const bought = [];
  if (metaBuy('shield','nult')) bought.push('shield.nult');
  if (metaBuy('wand','nult')) bought.push('wand.nult');
  if (metaBuy('sword','nult')) bought.push('sword.nult');
  if (metaBuy('bow','nult')) bought.push('bow.nult');
  if (metaBuy('_global','nreroll')) bought.push('_global.nreroll');
  while (metaBuy('wand','natk')) bought.push('wand.natk');
  out.push('노드 구매(+12pt 테스트 지급): ' + (bought.join(', ')||'포인트 부족') + ' | 남은 pts=' + META.pts);
  out.push('저장 확인: ' + (localStorage.getItem('blacksmith-meta-v1') ? 'localStorage OK' : 'MISSING'));

  out.push('--- 2회차 (수동 모드, 방패+활 편성 — 질풍 연사 검증) ---');
  META.autoUlt = false;
  loadout = ['shield','bow'];
  startRun();
  const bowAlly = allies.find(a=>a.key==='bow');
  out.push('활 연사 수(연마 1랭크 → 7발): ' + (5+2*bowAlly.ultRank) + ((5+2*bowAlly.ultRank)===7?' OK':' WRONG'));
  out.push('리롤 횟수(기본0 + 노드1랭크 → 1이어야 함): ' + G.rerolls + (G.rerolls===1?' OK':' WRONG'));
  out.push('RUN2: ' + playRun('r2'));
  out.push('필살기 수동 발동 횟수: ' + ultFired + (ultFired>0?' OK':' NONE_FIRED'));

  out.push('--- 3회차 (자동 모드, 방패+단검 편성 — 암살 검증) ---');
  META.autoUlt = true;
  loadout = ['shield','sword'];
  const before = ultFired;
  out.push('RUN3: ' + playRun('r3'));
  out.push('자동 모드 중 수동 개입(갈무리 리필 틈으로 소수는 정상): ' + (ultFired - before));
  out.push('검증: 방패 ultPow=' + allies.filter(a=>a.key==='shield').map(a=>a.ultPow)
    + ' (노드 1랭크=0.75), 홈=' + allies[0].sock.length);
  const multi=allies.filter(a=>[a.elFire,a.elPois,a.elCold,a.elShock].filter(v=>v>0).length>1);
  out.push('원소 잠금: ' + (multi.length ? 'VIOLATION — 한 무기에 2원소 이상' : 'OK (무기당 최대 1원소)'));
  const badEl=allies.filter(a=>{const e=elemOf(a);return e&&!EQUIP[a.key].elems.includes(e);});
  out.push('무기별 원소 제한: ' + (badEl.length ? 'VIOLATION — 허용 밖 원소' : 'OK (허용 목록 준수)'));
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
