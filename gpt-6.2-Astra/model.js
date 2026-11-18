'use strict';
const T=THREE, TAU=Math.PI*2, half=Math.PI/2;
const canvas=document.getElementById('world');
const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setClearColor(0x182336,0);
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene(), camera=new T.PerspectiveCamera(30,1,.08,180);
const hemi=new T.HemisphereLight(0xcad7ff,0x666075,.90);
scene.add(hemi);
const moon=new T.DirectionalLight(0xb9d4ff,1.63);
moon.position.set(-9,19,9); moon.castShadow=true; moon.shadow.mapSize.set(2048,2048);
Object.assign(moon.shadow.camera,{left:-12,right:12,top:12,bottom:-12,far:52});
moon.shadow.bias=-.00035;moon.shadow.normalBias=.018;scene.add(moon);
const rimLight=new T.DirectionalLight(0xabc8ff,.90);rimLight.position.set(8,6,-9);scene.add(rimLight);
let seed=711;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
const between=(a,b)=>a+(b-a)*random();
const pick=a=>a[Math.floor(random()*a.length)];
const vec=(x,y,z)=>new T.Vector3(x,y,z);
const cube=new T.BoxGeometry(1,1,1), ball=new T.SphereGeometry(1,12,9), plane=new T.PlaneGeometry(1,1);
const cylinders=new Map(), batches=new Map(), mats=new Map(), outlines=[], anim=[];
const toonRamp=new T.DataTexture(new Uint8Array([32,78,147,222]),4,1,T.RedFormat);toonRamp.minFilter=toonRamp.magFilter=T.NearestFilter;toonRamp.needsUpdate=true;
function pigment(color){
  const lit=color[0]!=='!';const key=lit?'lit':'ink';
  if(!mats.has(key))mats.set(key,lit?new T.MeshToonMaterial({color:0xffffff,gradientMap:toonRamp}):new T.MeshBasicMaterial({color:0xffffff}));
  return [mats.get(key),lit?color:color.slice(1)];
}
const tmp=new T.Object3D();
function instance(geometry,x,y,z,sx,sy,sz,color,rotation,material){
  let tint;
  if(material)tint='#ffffff';else [material,tint]=pigment(color);
  const key=geometry.uuid+material.uuid;
  if(!batches.has(key))batches.set(key,{geometry,material,matrices:[],colors:[]});
  const batch=batches.get(key);
  tmp.position.set(x,y,z);tmp.scale.set(sx,sy,sz);
  if(rotation instanceof T.Quaternion)tmp.quaternion.copy(rotation);else tmp.rotation.set(...(rotation||[0,0,0]));
  tmp.updateMatrix();batch.matrices.push(tmp.matrix.clone()); batch.colors.push(new T.Color(tint));
}
function line(a,b){outlines.push(...a,...b)}
const cubeEdges=new T.EdgesGeometry(cube).getAttribute('position');
function box(x,y,z,w,h,d,col,edge=false,r){
  instance(cube,x,y,z,w,h,d,col,r);
  if(edge){const v=new T.Vector3();for(let i=0;i<cubeEdges.count;i++){v.fromBufferAttribute(cubeEdges,i).applyMatrix4(tmp.matrix);outlines.push(v.x,v.y,v.z)}}
}
function cyl(x,y,z,rt,rb,h,col,n=16,r){
  const ratio=rb?rt/rb:1, id=n+'_'+ratio.toFixed(3);
  if(!cylinders.has(id))cylinders.set(id,new T.CylinderGeometry(ratio,1,1,n));
  instance(cylinders.get(id),x,y,z,rb,h,rb,col,r);
}
function rod(a,b,r,c,n=8){const p=vec(...a),q=vec(...b),delta=q.sub(p),h=delta.length();if(h<.0001)return;const rot=new T.Quaternion().setFromUnitVectors(vec(0,1,0),delta.normalize());cyl((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,r,h,c,n,rot)}
function bead(x,y,z,rx,ry,rz,col){instance(ball,x,y,z,rx,ry,rz,col)}
function path(points,r,c,n=8){for(let i=1;i<points.length;i++)rod(points[i-1],points[i],r,c,n)}
function ellipseTube(x,y,z,rx,ry,thick,col,axis='z',count=36){let coords=[];for(let i=0;i<=count;i++){const a=i/count*TAU;coords.push(axis==='z'?[x+rx*Math.cos(a),y+ry*Math.sin(a),z]:axis==='x'?[x,y+ry*Math.sin(a),z+rx*Math.cos(a)]:[x+rx*Math.cos(a),y,z+ry*Math.sin(a)])}path(coords,thick,col)}
function texture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');draw(ctx,w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t}
function printed(tex,lit=false){return lit?new T.MeshLambertMaterial({map:tex}):new T.MeshBasicMaterial({map:tex})}
function panel(x,y,z,w,h,mat,angle=0){instance(plane,x,y,z,w,h,1,'#ffffff',[0,angle,0],mat)}
function groundPrint(x,y,z,w,d,mat,angle=0){instance(plane,x,y,z,w,d,1,'#ffffff',[-half,0,angle],mat)}
function direct(geo,mat,x,y,z,parent=scene){let m=new T.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m}
function finishModel(){
 for(const b of batches.values()){const m=new T.InstancedMesh(b.geometry,b.material,b.matrices.length);b.matrices.forEach((v,i)=>{m.setMatrixAt(i,v);m.setColorAt(i,b.colors[i])});m.castShadow=!!(b.material.isMeshLambertMaterial||b.material.isMeshToonMaterial);m.receiveShadow=m.castShadow;scene.add(m)}
 if(outlines.length){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(outlines,3));scene.add(new T.LineSegments(g,new T.LineBasicMaterial({color:0x1a2333,transparent:true,opacity:.52})))}
}
const glowTex=texture(128,128,(g,w,h)=>{const a=g.createRadialGradient(64,64,0,64,64,64);a.addColorStop(0,'rgba(255,255,255,.8)');a.addColorStop(.16,'rgba(255,255,255,.42)');a.addColorStop(.5,'rgba(255,255,255,.09)');a.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=a;g.fillRect(0,0,w,h)});
function halo(x,y,z,w,h,color,opacity){const m=new T.Sprite(new T.SpriteMaterial({map:glowTex,color,opacity,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));m.position.set(x,y,z);m.scale.set(w,h,1);scene.add(m);return m}
function pool(x,y,z,w,d,color,opacity){const m=direct(plane,new T.MeshBasicMaterial({map:glowTex,color,opacity,transparent:true,depthWrite:false,blending:T.AdditiveBlending}),x,y,z);m.rotation.x=-half;m.scale.set(w,d,1);return m}
function localLight(x,y,z,color,power,distance){const l=new T.PointLight(color,power,distance,1.7);l.position.set(x,y,z);scene.add(l);return l}
const shadowMap=texture(256,256,(g,w,h)=>{const a=g.createRadialGradient(128,128,0,128,128,128);a.addColorStop(0,'rgba(1,6,14,.92)');a.addColorStop(.6,'rgba(1,6,14,.68)');a.addColorStop(1,'rgba(1,6,14,0)');g.fillStyle=a;g.fillRect(0,0,w,h)});
const under=direct(plane,new T.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false}),0,-.94,0);under.rotation.x=-half;under.scale.set(25,24,1);
