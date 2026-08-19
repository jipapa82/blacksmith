/* ===================== 캔버스 그리기 =====================
   도형으로 역할 구분: 사각형=방패, 삼각형=근접, 마름모=원거리, 육각형=마법 (DESIGN 7.3) */
function shapePath(x,y,r,shape){
  ctx.beginPath();
  if(shape==='sq')ctx.rect(x-r,y-r,r*2,r*2);
  else if(shape==='tri'){ctx.moveTo(x,y-r);ctx.lineTo(x+r,y+r);ctx.lineTo(x-r,y+r);ctx.closePath();}
  else if(shape==='dia'){ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();}
  else if(shape==='hex'){for(let i=0;i<6;i++){const a=Math.PI/3*i;
    i?ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.closePath();}
  else ctx.arc(x,y,r,0,6.283);
}
function draw(dt){
  ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,W,H);
  if(shake>0){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake=Math.max(0,shake-dt*40);}
  ctx.fillStyle='#0E0F13'; ctx.fillRect(-20,-20,W+40,H+40);
  ctx.strokeStyle='rgba(255,255,255,.028)';ctx.lineWidth=1;
  for(let y=40;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y+.5);ctx.lineTo(W,y+.5);ctx.stroke();}
  const F=frontAlly();
  if(F){ctx.strokeStyle='rgba(232,150,60,.15)';ctx.setLineDash([5,7]);
    ctx.beginPath();ctx.moveTo(F.x+26,0);ctx.lineTo(F.x+26,H);ctx.stroke();ctx.setLineDash([]);}

  fxs.forEach(f=>{
    f.life+=dt*speed; const t=Math.min(1,f.life/f.dur), a=1-t;
    ctx.globalAlpha=a;
    if(f.k==='ring'){ctx.strokeStyle=f.c;ctx.lineWidth=3*f.g;
      ctx.beginPath();ctx.arc(f.x,f.y,f.r0+(f.r-f.r0)*t,0,6.283);ctx.stroke();}
    else if(f.k==='beam'){ctx.strokeStyle=f.c;ctx.lineWidth=f.w-(f.w-1)*t;
      ctx.beginPath();ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);ctx.stroke();}
    else if(f.k==='slash'){ctx.strokeStyle=f.c;ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(f.x-13,f.y-13);ctx.lineTo(f.x+13,f.y+13);ctx.stroke();}
    else if(f.k==='p'){ctx.fillStyle=f.c;
      ctx.beginPath();ctx.arc(f.x+f.vx*f.life,f.y+f.vy*f.life,2.4*a,0,6.283);ctx.fill();}
    ctx.globalAlpha=1;
  });
  fxs=fxs.filter(f=>f.life<f.dur);

  mobs.forEach(m=>{
    shapePath(m.x+(m.lung>0?-5:0),m.y,m.r,m.type==='boss'?'sq':'circle');
    ctx.fillStyle=m.hit>0?'#FFF':m.color; ctx.fill();
    if(m.hp<m.maxhp){const w=m.r*2.2;
      ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(m.x-w/2,m.y-m.r-7,w,3);
      ctx.fillStyle=m.color;ctx.fillRect(m.x-w/2,m.y-m.r-7,w*(m.hp/m.maxhp),3);}
  });
  allies.forEach(a=>{
    if(a.hp<=0)ctx.globalAlpha=.18;
    const ox=a.lung>0?7:0;
    shapePath(a.x+ox,a.y,a.r+2,a.shape);
    ctx.fillStyle=a.hit>0?'#FFF':a.color; ctx.fill();
    ctx.globalAlpha=1;
    if(a.hp>0){
      ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(a.x+ox,a.y,a.r+9,-1.57,-1.57+6.283*Math.min(1,a.charge));ctx.stroke();
      if(a.ultOn){                        // 필살기 링은 해금된 무기에만 (DESIGN 4.5)
        const up=Math.min(1,a.ultT/a.ultCd);
        ctx.strokeStyle=up>=1?'#E8963C':'rgba(232,150,60,.45)';ctx.lineWidth=3;
        ctx.beginPath();ctx.arc(a.x+ox,a.y,a.r+15,-1.57,-1.57+6.283*up);ctx.stroke();
      }
      ctx.fillStyle='#7E858F';ctx.font='11px "IBM Plex Sans KR"';ctx.textAlign='center';
      ctx.fillText(a.eq,a.x,a.y+a.r+26);
    }
  });
  nums.forEach(n=>{n.life+=dt*speed;const a=1-n.life/.75;
    ctx.globalAlpha=Math.max(0,a);ctx.fillStyle=n.c;
    ctx.font=(n.big?'600 20px':'600 14px')+' "IBM Plex Mono"';ctx.textAlign='center';
    ctx.fillText(n.t,n.x,n.y-n.life*26);ctx.globalAlpha=1;});
  nums=nums.filter(n=>n.life<.75);
}
