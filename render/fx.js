/* ===================== 이펙트 생성 =====================
   fxs / nums 배열에 밀어 넣기만 한다. 그리는 것은 draw.js. */
function num(x,y,t,c,big){nums.push({x,y,t,c,big:!!big,life:0});}
function ring(x,y,r,c,g=1){fxs.push({k:'ring',x,y,r0:r*.3,r,c,life:0,dur:.34,g});}
function beam(x1,y1,x2,y2,c,w){fxs.push({k:'beam',x1,y1,x2,y2,c,w:w||3,life:0,dur:.22});}
function slashFx(x,y,c){fxs.push({k:'slash',x,y,c,life:0,dur:.18});}
function burst(x,y,c){for(let i=0;i<7;i++){const a=Math.random()*6.28,s=40+Math.random()*70;
  fxs.push({k:'p',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,c,life:0,dur:.4});}}
