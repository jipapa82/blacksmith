/* ===================== 효과음 — 파일 없이 합성 =====================
   Web Audio로 실시간 합성한다. 에셋 0개 — file:// 원칙 유지 (DESIGN 7.4).
   소리는 판정의 확인이다: "일어난 일"에만 붙이고, 매 타격 같은 고빈도 이벤트에는 안 붙인다.
   쓰는 쪽은 sfx('이름') 하나 — 꺼져 있거나(META.sound) 오디오가 없으면 조용히 무시된다.
   브라우저 정책상 첫 클릭(출정 등) 이후부터 소리가 난다. */
let _actx=null,_master=null;
const _sfxLast={};

function _audio(){
  const AC=typeof AudioContext!=='undefined'?AudioContext
        :typeof webkitAudioContext!=='undefined'?webkitAudioContext:null;
  if(!AC)return null;
  if(!_actx){
    _actx=new AC();
    _master=_actx.createGain(); _master.gain.value=.35; _master.connect(_actx.destination);
  }
  if(_actx.state==='suspended')_actx.resume();
  return _actx;
}
/* 주파수 f0→f1로 미끄러지는 단음 */
function _tone(f0,f1,dur,type,vol,delay){
  const c=_actx,t=c.currentTime+(delay||0);
  const o=c.createOscillator(),g=c.createGain();
  o.type=type; o.frequency.setValueAtTime(f0,t);
  if(f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g); g.connect(_master); o.start(t); o.stop(t+dur+.02);
}
/* 잡음 한 줌 — 타격·폭발·망치질의 몸통 */
function _noise(dur,vol,freq,delay){
  const c=_actx,t=c.currentTime+(delay||0);
  const n=Math.floor(c.sampleRate*dur), buf=c.createBuffer(1,n,c.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=c.createBufferSource(); s.buffer=buf;
  const f=c.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq; f.Q.value=.8;
  const g=c.createGain(); g.gain.value=vol;
  s.connect(f); f.connect(g); g.connect(_master); s.start(t);
}

/* 이름: [최소 간격(초, 연타 방지), 소리] */
const SFX_DEF={
  kill:   [.12,()=>{_tone(300,110,.07,'square',.10);}],                          // 처치 — 짧은 틱
  gem:    [.15,()=>{_tone(880,1470,.09,'sine',.18);_tone(1174,1760,.12,'sine',.12,.06);}],  // 보석 — 반짝
  levelup:[.3, ()=>{[523,659,784].forEach((f,i)=>_tone(f,f,.14,'triangle',.16,i*.08));}],   // 레벨업 — 상행 3음
  pick:   [.1, ()=>{_tone(659,880,.07,'triangle',.15);}],                        // 선택/토글 확인음
  ult:    [.25,()=>{_noise(.28,.22,700);_tone(150,55,.32,'sawtooth',.20);}],     // 필살기 — 낮은 굉음
  boss:   [.5, ()=>{_tone(98,72,.5,'sawtooth',.22);_tone(147,98,.5,'sawtooth',.13,.18);}],  // 대장 등장 경고
  wave:   [.4, ()=>{_tone(392,523,.13,'triangle',.13);}],                        // 웨이브 시작
  clear:  [.4, ()=>{_tone(523,784,.18,'triangle',.16);_tone(784,1046,.2,'triangle',.10,.12);}], // 섬멸 → 정비
  die:    [.3, ()=>{_tone(220,55,.45,'sawtooth',.22);_noise(.3,.16,250);}],      // 용병 사망
  hammer: [.08,()=>{_noise(.05,.25,2800);_tone(1150,620,.07,'square',.10);}],    // 망치질 — 합성·강화 성공
  fail:   [.15,()=>{_tone(160,70,.28,'square',.16);_noise(.12,.14,420);}],       // 강화 실패 — 둔탁한 쇳소리
  hire:   [.3, ()=>{_tone(330,440,.12,'triangle',.16);_tone(440,587,.14,'triangle',.12,.09);}], // 고용
  end:    [.5, ()=>{[392,311,262].forEach((f,i)=>_tone(f,f*.98,.22,'triangle',.16,i*.13));}],   // 런 종료
};

function sfx(name){
  try{
    if(typeof META!=='undefined'&&!META.sound)return;
    const def=SFX_DEF[name]; if(!def)return;
    if(!_audio())return;
    const t=_actx.currentTime;
    if(_sfxLast[name]!==undefined&&t-_sfxLast[name]<def[0])return;
    _sfxLast[name]=t;
    def[1]();
  }catch(e){}
}
