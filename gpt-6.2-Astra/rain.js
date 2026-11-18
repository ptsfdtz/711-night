'use strict';
finishModel();
const rainCount=490, rainData=[], rainPositions=new Float32Array(rainCount*6);
const rainGeometry=new T.BufferGeometry();rainGeometry.setAttribute('position',new T.BufferAttribute(rainPositions,3).setUsage(T.DynamicDrawUsage));
const rainLines=new T.LineSegments(rainGeometry,new T.LineBasicMaterial({color:0xc9e3e9,transparent:true,opacity:.265,depthWrite:false}));rainLines.frustumCulled=false;scene.add(rainLines);
for(let i=0;i<rainCount;i++){
 const x=between(-6.91,6.91),z=between(-6.90,6.91);
 const stop=(x>-5.72&&x<2.71&&z>-4.5&&z<2.32)?3.6:(x<4&&z<3.18?.20:.04);
 rainData.push({x,z,stop,start:between(6.0,8.04),speed:between(4.95,7.67),phase:random()*9,len:between(.083,.195)})
}
const ringCount=68, ringSteps=22, rings=[], ringPos=new Float32Array(ringCount*ringSteps*6),ringCol=new Float32Array(ringPos.length);
const rippleGeo=new T.BufferGeometry();
rippleGeo.setAttribute('position',new T.BufferAttribute(ringPos,3).setUsage(T.DynamicDrawUsage));rippleGeo.setAttribute('color',new T.BufferAttribute(ringCol,3).setUsage(T.DynamicDrawUsage));
const ripples=new T.LineSegments(rippleGeo,new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.46,blending:T.AdditiveBlending,depthWrite:false}));ripples.frustumCulled=false;scene.add(ripples);
for(let i=0;i<ringCount;i++){
 const frontRoad=i<41,sidewalk=i>=59;
 const x=frontRoad?between(-6.72,6.72):sidewalk?between(-5.86,3.36):between(4.35,6.73);
 const z=frontRoad?between(3.48,6.72):sidewalk?between(2.31,3.02):between(-6.67,3.46);
 rings.push({x,z,y:sidewalk?.204:.017,period:between(1.67,4.57),phase:random()*5,r:between(.080,.194),a:between(0,TAU)})
}
const drops=[],dropGeo=new T.SphereGeometry(1,6,5),dropMat=new T.MeshBasicMaterial({color:0xcbe2dd,transparent:true,opacity:.52,depthWrite:false});
for(let i=0;i<17;i++){const m=direct(dropGeo,dropMat,between(-5.59,2.51),2.8,2.30);drops.push({m,delay:random()*3,period:between(1.01,2.69)})}
const streakMat=new T.MeshBasicMaterial({color:0xffe6b4,transparent:true,opacity:.28,depthWrite:false});
const streaks=[];
for(let i=0;i<60;i++){const side=i>=35;let x=between(left+.07,right-.07);if(x>doorX-.82&&x<doorX+.82)x=left+.48+random()*2.7;
 const m=direct(plane,streakMat,side?right+.083:x,1.5,side?between(back+.1,front-.10):front+.087);m.rotation.y=side?half:0;
 streaks.push({m,phase:random()*4,period:between(1.63,5.57),len:between(.025,.118),start:between(1.55,2.74)})}
const flickerHalo=halo(3.11,5.58,-3.76,1.98,2.04,'#ffd48d',.11);
function weather(t){
 rainData.forEach((d,i)=>{const span=d.start-d.stop,fall=(t*d.speed+d.phase)%span,y=d.start-fall,x=d.x+fall*.024,z=d.z+fall*.013;const k=i*6;rainPositions.set([x,y,z,x-.024*d.len,y+d.len,z-.013*d.len],k)});
 rainGeometry.attributes.position.needsUpdate=true;
 rings.forEach((r,i)=>{let p=((t+r.phase)%r.period)/.85,active=p<1;let radius=active?r.r*Math.sqrt(p):0;
 const l=active?.31*(1-p):0;for(let j=0;j<ringSteps;j++){
 const a=r.a+j/ringSteps*TAU*.92,b=a+TAU*.92/ringSteps,k=(i*ringSteps+j)*6;
 ringPos.set([r.x+Math.cos(a)*radius,r.y,r.z+Math.sin(a)*radius,r.x+Math.cos(b)*radius,r.y,r.z+Math.sin(b)*radius],k);
 const f=l*(.6+.4*Math.cos(a));ringCol.set([f*.69,f*.84,f,f*.69,f*.84,f],k)
 }});rippleGeo.attributes.position.needsUpdate=true;rippleGeo.attributes.color.needsUpdate=true;
 drops.forEach(d=>{const p=(t+d.delay)%d.period,q=p/.66;d.m.visible=q<=1;if(q<=1){d.m.position.y=2.85-2.65*q*q;d.m.scale.set(.009,.016+.052*q,.009)}});
 streaks.forEach(d=>{const p=((t+d.phase)%d.period)/d.period;d.m.position.y=d.start-(d.start-.88)*p*p;d.m.scale.set(.006,d.len*(.3+p),1);d.m.visible=p>.05&&p<.98});
 let cycle=t%24,open=cycle>7&&cycle<13?Math.min(1,(cycle-7)/1.2,(13-cycle)/1.45):0;open=open*open*(3-2*open);
 doorLeaves.forEach(d=>d.leaf.position.x=d.start+d.side*.689*open);
 const f=(t%13.13);const power=f>8.12&&f<8.34?.80+.2*Math.cos(f*98):.992+.008*Math.sin(t*2.5);
 G.tower.color.setRGB(power,power,power);flickerHalo.material.opacity=.105*power;
 const phase=t%21,lit=phase<10?0:phase<12?1:2;
 signals.forEach((s,i)=>s.material.color.set(i===lit?['#8cf2bd','#ffce76','#ff8064'][i]:['#53756f','#726d59','#765859'][i]));
 road.material.uniforms.time.value=t
}
const center=vec(0,1.55,0), look=center.clone();
let azimuth=.52,elevation=.398,zoom=1,baseRadius=30,azTarget=azimuth,elTarget=elevation,zoomTarget=1;
const touches=new Map();let oldSpan=0,lastMid=null,dragMode=0;
function reset(){azTarget=.52;elTarget=.398;zoomTarget=1;look.copy(center)}
function placeCamera(){
 const d=baseRadius*zoom;camera.position.set(look.x+d*Math.sin(azimuth)*Math.cos(elevation),look.y+d*Math.sin(elevation),look.z+d*Math.cos(azimuth)*Math.cos(elevation));camera.lookAt(look);camera.updateMatrixWorld()
}
function resize(){
 const w=innerWidth,h=innerHeight;renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(w,h,false);resizeFilm(canvas.width,canvas.height);camera.aspect=w/h;camera.updateProjectionMatrix();
 const ca=new T.PerspectiveCamera(30,w/h,.08,180);const samples=[];
 for(let x of [-7.04,7.04])for(let z of [-7.04,7.04])for(let y of [-.83,.13])samples.push(vec(x,y,z));
 poles.forEach(([x,z,h])=>{samples.push(vec(x-.72,h+.25,z),vec(x+.72,h+.25,z))});samples.push(vec(3.82,6.34,-3.83),vec(-5.77,3.64,2.31),vec(2.72,3.64,2.31));
 const dir=vec(Math.sin(.52)*Math.cos(.398),Math.sin(.398),Math.cos(.52)*Math.cos(.398));
 let low=16,high=85;for(let i=0;i<24;i++){let d=(low+high)/2;ca.position.copy(center).addScaledVector(dir,d);ca.lookAt(center);ca.updateMatrixWorld();const fits=samples.every(p=>{let v=p.clone().project(ca);return Math.abs(v.x)<.91&&Math.abs(v.y)<.87});if(fits)high=d;else low=d}baseRadius=high;
 placeCamera()
}
function pan(dx,dy){
 const scale=baseRadius*zoom*Math.tan(camera.fov*Math.PI/360)*2/innerHeight;
 const side=vec(1,0,0).applyQuaternion(camera.quaternion),up=vec(0,1,0).applyQuaternion(camera.quaternion);
 look.addScaledVector(side,-dx*scale).addScaledVector(up,dy*scale);
 look.x=T.MathUtils.clamp(look.x,-6,6);look.z=T.MathUtils.clamp(look.z,-6,6);look.y=T.MathUtils.clamp(look.y,.30,4.70)
}
canvas.addEventListener('contextmenu',e=>e.preventDefault());
function pair(){const [a,b]=Array.from(touches.values());return {span:Math.hypot(a.x-b.x,a.y-b.y),x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);touches.set(e.pointerId,{x:e.clientX,y:e.clientY});dragMode=(e.button===2||e.button===1||e.shiftKey)?1:0;if(touches.size===2){lastMid=pair();oldSpan=lastMid.span}});
canvas.addEventListener('pointermove',e=>{const prev=touches.get(e.pointerId);if(!prev)return;const dx=e.clientX-prev.x,dy=e.clientY-prev.y;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(touches.size===2){const p=pair();if(p.span>3&&oldSpan>3)zoomTarget=T.MathUtils.clamp(zoomTarget*oldSpan/p.span,.33,2.12);pan(p.x-lastMid.x,p.y-lastMid.y);oldSpan=p.span;lastMid=p}
 else if(touches.size===1){if(dragMode)pan(dx,dy);else{azTarget-=dx*.006;elTarget=T.MathUtils.clamp(elTarget+dy*.005,.105,1.43)}}});
function lift(e){touches.delete(e.pointerId);lastMid=null;if(touches.size===2){lastMid=pair();oldSpan=lastMid.span}}
for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,lift);
canvas.addEventListener('wheel',e=>{e.preventDefault();const value=e.deltaY*(e.deltaMode===1?15:e.deltaMode===2?innerHeight:1);zoomTarget=T.MathUtils.clamp(zoomTarget*Math.exp(value*.0011),.33,2.12)},{passive:false});
canvas.addEventListener('dblclick',reset);
canvas.addEventListener('keydown',e=>{if(e.key==='Home')reset();else if(e.key==='ArrowLeft')azTarget+=.1;else if(e.key==='ArrowRight')azTarget-=.1;else if(e.key==='ArrowUp')elTarget=Math.min(1.43,elTarget+.08);else if(e.key==='ArrowDown')elTarget=Math.max(.105,elTarget-.08);else if(e.key==='+')zoomTarget=Math.max(.33,zoomTarget*.9);else if(e.key==='-')zoomTarget=Math.min(2.12,zoomTarget*1.1);else return;e.preventDefault()});
window.addEventListener('resize',resize);resize();
let previous=performance.now(),elapsed=0;
function draw(now){requestAnimationFrame(draw);if(document.hidden){previous=now;return}const dt=Math.max(0,Math.min(.08,(now-previous)/1000));previous=now;elapsed+=dt;
 const damp=1-Math.exp(-17*dt);azimuth+=(azTarget-azimuth)*damp;elevation+=(elTarget-elevation)*damp;zoom+=(zoomTarget-zoom)*damp;
 placeCamera();weather(elapsed);renderFilm();renderer.shadowMap.autoUpdate=false
}
requestAnimationFrame(draw);
