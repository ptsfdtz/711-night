'use strict';
// Build the square base as a stack of painted and chamfered casting layers.
function slab(w,d,y,h,color,bevel){
 const s=new T.Shape();s.moveTo(-w/2,-d/2);s.lineTo(w/2,-d/2);s.lineTo(w/2,d/2);s.lineTo(-w/2,d/2);s.closePath();
 const geo=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,curveSegments:2});geo.rotateX(-half);
 const m=direct(geo,new T.MeshLambertMaterial({color}),0,y,0);m.receiveShadow=true;m.castShadow=true
}
slab(13.78,13.78,-.734,.095,'#172831',.062);
slab(13.92,13.92,-.611,.514,'#354854',.034);
slab(13.97,13.97,-.094,.053,'#677880',.018);
for(let i=0;i<16;i++){const x=-6.53+i*.866;box(x,-.391,6.997,.011,.43,.006,'#30414d');box(6.997,-.391,x,.006,.43,.011,'#30414d')}
const wetShader={
 uniforms:{...T.UniformsUtils.clone(T.Reflector.ReflectorShader.uniforms),time:{value:0}},
 vertexShader:`uniform mat4 textureMatrix;varying vec4 proj;varying vec2 p;
 void main(){p=position.xy;proj=textureMatrix*vec4(position,1.);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform sampler2D tDiffuse;uniform float time;varying vec4 proj;varying vec2 p;
 float hash(vec2 a){return fract(sin(dot(a,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 a){vec2 id=floor(a),f=fract(a);f=f*f*(3.-2.*f);return mix(mix(hash(id),hash(id+vec2(1,0)),f.x),mix(hash(id+vec2(0,1)),hash(id+1.),f.x),f.y);}
 void main(){
 vec2 uv=proj.xy/proj.w; float pools=noise(p*vec2(.64,1.38))*.69+noise(p*2.8)*.31;
 float water=smoothstep(.33,.70,pools);float grit=noise(p*210.);
 float d=noise(p*vec2(4.,72.)+vec2(time*.12,time*.40));
 vec2 offset=vec2((d-.5)*.006,(noise(p*vec2(8.,27.)+time*.18)-.5)*.003);
 vec3 reflection=texture2D(tDiffuse,uv+offset).rgb*.48+texture2D(tDiffuse,uv-offset*.58).rgb*.31+texture2D(tDiffuse,uv+offset*.29).rgb*.21;
 vec3 asphalt=vec3(.048,.069,.094)*(.63+.44*pools+.17*grit);
 gl_FragColor=vec4(asphalt+reflection*(.068+.37*water),1.);
 #include <colorspace_fragment>
 }`
};
const road=new T.Reflector(new T.PlaneGeometry(14,14),{textureWidth:1024,textureHeight:1024,multisample:0,shader:wetShader,clipBias:.001});
road.rotation.x=-half;road.position.y=.001;scene.add(road);
// Pavement has a rounded corner built from individual kerbstones.
const walkway=new T.Shape();walkway.moveTo(-6.99,6.99);walkway.lineTo(4.03,6.99);walkway.lineTo(4.03,-2.375);walkway.quadraticCurveTo(4.03,-3.185,3.22,-3.185);walkway.lineTo(-6.99,-3.185);walkway.closePath();
const pavementGeo=new T.ExtrudeGeometry(walkway,{depth:.18,bevelEnabled:false,curveSegments:12});pavementGeo.rotateX(-half);
const pavement=direct(pavementGeo,new T.MeshLambertMaterial({color:0x879495}),0,.005,0);pavement.receiveShadow=true;
const pavingGeo=new T.ShapeGeometry(walkway,12);const pavingPos=pavingGeo.attributes.position;
for(let i=0;i<pavingPos.count;i++)pavingGeo.attributes.uv.setXY(i,pavingPos.getX(i)/6,pavingPos.getY(i)/3);
G.platform.map.wrapS=G.platform.map.wrapT=T.RepeatWrapping;pavingGeo.rotateX(-half);
const paving=direct(pavingGeo,G.platform,0,.189,0);paving.receiveShadow=true;
for(let i=0;i<16;i++)box(-6.68+i*.636,.115,3.176,.625,.212,.125,'#abb1aa',true);
for(let i=0;i<15;i++)box(4.021,.114,-6.68+i*.642,.125,.21,.632,'#abb1aa',true);
for(let i=0;i<5;i++){const a=(i+.5)*Math.PI/10;box(3.22+.81*Math.cos(a),.112,2.375+.81*Math.sin(a),.25,.205,.123,'#abb1aa',true,[0,half-a,0])}
// Road paint is slightly mottled to leave wet asphalt visible between the pigment.
const paint=art(512,128,(g,w,h)=>{rect(g,0,0,w,h,'#c5c8bd');for(let i=0;i<4300;i++){g.fillStyle=pick(['#a6b0ac','#78888a','#c1c2b6','#b3b8ae']);g.fillRect(random()*w,random()*h,between(1,4),between(1,2))}},true);
for(let i=0;i<6;i++)groundPrint(-4.38,.009,3.65+i*.583,2.74,.316,paint);
groundPrint(-2.57,.011,4.43,.134,2.09,paint);
for(let x=-1.37;x<6.5;x+=2.26)groundPrint(x,.010,5.27,1.04,.082,paint);
for(let z=-6.17;z<2;z+=2.1)groundPrint(5.58,.010,z,.074,.98,paint);
groundPrint(.14,.011,3.58,5.14,.064,paint);groundPrint(4.33,.011,-1.72,.057,8.42,paint);
for(let i=0;i<3;i++)groundPrint(5.90,.01,-4.55+i*.49,1.85,.23,paint);
groundPrint(5.63,.011,-2.84,2.53,.1,paint);
function grate(x,z,angle=0){box(x,.018,z,.76,.028,.249,'#354853',true,[0,angle,0]);for(let i=-4;i<=4;i++){let dx=i*.074;box(x+dx*Math.cos(angle),.039,z-dx*Math.sin(angle),.028,.012,.194,'#809197',false,[0,angle,0])}}
for(let x of [-5.82,-2.38,.94])grate(x,3.32);
for(let z of [-5.88,-2.39,1.41])grate(4.157,z,half);
function manhole(x,z,r){cyl(x,.016,z,r,r,.026,'#233c48',40);cyl(x,.036,z,r*.93,r*.93,.02,'#677c81',40);for(let k of [.80,.55,.27])ellipseTube(x,.051,z,r*k,r*k,.009,'#415965','y');for(let i=0;i<24;i++){let a=i*TAU/24;box(x+r*.68*Math.sin(a),.051,z+r*.68*Math.cos(a),.02,.012,r*.15,'#394e5b',false,[0,a+.37,0])}}
manhole(1.71,5.99,.39);manhole(5.08,-.01,.27);
// Back alley parking stalls, wheel stops, service boxes and outdoor compressors.
for(let i=0;i<3;i++)groundPrint(-5.89+i*2.54,.196,-5.68,.043,2.17,paint);
groundPrint(-3.35,.196,-6.76,5.11,.045,paint);
for(let i=0;i<2;i++){box(-4.59+i*2.52,.255,-4.81,1.15,.13,.19,'#939a94',true);groundPrint(-4.6+i*2.52,.198,-6.22,.63,.40,plaque('P  '+(i+1),'#7e878c','#d1cbb6'))}
for(let i=0;i<2;i++){
 const x=-4.8+1.19*i;box(x,.66,-4.62,1.02,.83,.58,'#afb9af',true);box(x,.27,-4.62,.82,.1,.70,'#7c8e8d');
 cyl(x-.13,.67,-4.922,.30,.30,.03,'#425961',24,[half,0,0]);
 for(let j=1;j<=5;j++)ellipseTube(x-.13,.67,-4.949,.055*j,.055*j,.009,'#9aaca6');
 for(let j=0;j<6;j++)box(x+.31,.44+j*.078,-4.927,.20,.029,.014,'#708482');
}
box(-1.7,1.26,-4.36,.63,.92,.12,'#798b89',true);path([[-1.91,1.70,-4.42],[-1.91,2.34,-4.42],[.42,2.34,-4.42],[.42,2.79,-4.42]],.035,'#8a9a96');
panel(.74,2.25,-4.333,1.23,.26,G.alley,Math.PI);
for(let i=0;i<4;i++)box(-6.72,.50,-6.16+i*1.19,.17,.61,1.17,'#9caaa3',true);
// Drinks vending machine.
const vx=-5.78,vz=1.18;
box(vx,.251,vz,.99,.12,.71,'#425259',true);box(vx,1.315,vz,1.12,2.03,.76,'#c75f4d',true);
box(vx,1.316,vz+.389,1.085,1.984,.04,'#e38a6d',true);
panel(vx,1.316,vz+.412,1.054,1.947,G.vend);
panel(vx+.565,1.307,vz,.709,1.924,G.vendSide,half);
box(vx,2.347,vz,1.14,.048,.79,'#e1a48b',true);
for(let i=0;i<7;i++)box(vx+.568,.46+i*.036,vz,.014,.015,.52,'#874d42');
halo(vx,1.77,vz+.418,1.55,1.28,'#ffce92',.105);
pool(vx,.195,1.89,1.89,2.2,'#ff986d',.23);
// Small bins with distinct openings for recycling.
for(let i=0;i<2;i++){const x=-4.94+i*.41,z=1.80;box(x,.56,z,.37,.715,.384,i?'#91aaa0':'#9ea99d',true);box(x,.918,z,.398,.127,.414,'#748e89',true);cyl(x,.99,z,.098,.098,.010,'#374f53');panel(x,.661,z+.198,.27,.123,plaque(i?'びん・缶':'もえるごみ','#e5dec1','#4c726a',50))}
function plant(x,z,size,pot='#a9896b'){
 box(x,.19+.145*size,z,size*.72,.29*size,size*.62,pot,true);box(x,.19+.295*size,z,.77*size,.065*size,.66*size,pot,true);box(x,.19+.333*size,z,.68*size,.017*size,.56*size,'#504a3c');
 for(let i=0;i<28;i++){let a=random()*TAU,r=between(.02,.28)*size,h=between(.18,.53)*size;const dx=Math.cos(a)*r,dz=Math.sin(a)*r;
 const col=pick(['#62896c','#7e9b74','#416f61','#99aa78','#548575']);const y=.19+.33*size;
 rod([x+dx*.2,y,z+dz*.2],[x+dx,y+h*.65,z+dz],.009*size,'#587865',5);
 const q=new T.Quaternion().setFromUnitVectors(vec(0,1,0),vec(dx*.85,h*.44,dz*.85).normalize());instance(ball,x+dx,y+h*.74,z+dz,.068*size,h*.39,.049*size,col,q)
 }}
plant(-5.18,2.38,.76);plant(2.08,1.71,.88);plant(2.93,-3.43,1.28,'#7f8982');plant(-6.08,-4.04,1.10);
// Umbrella stand with folded umbrellas and curved handles.
box(.58,.27,1.76,.59,.095,.34,'#4a6269',true);
for(let x of [.30,.86])for(let z of [1.605,1.92])rod([x,.29,z],[x,.78,z],.018,'#8e9f9b');
for(let y of [.50,.78]){path([[.30,y,1.605],[.86,y,1.605],[.86,y,1.92],[.30,y,1.92],[.30,y,1.605]],.018,'#9aa9a1')}
for(let i=0;i<3;i++){let x=.39+i*.169,z=1.75+(i%2)*.05;
 cyl(x,.66,z,.069,.011,.66,['#9c6b69','#819da1','#657c8b'][i],8,[0,0,.065-i*.05]);path([[x,.94,z],[x,1.11,z],[x+.02,1.15,z],[x+.055,1.15,z],[x+.07,1.11,z]],.015,'#5d5751')}
// Blue steel mamachari bicycle with wire basket, mudguards and kickstand.
function bicycle(x,z){
 const yc=.55,r=.35;const rear=z-.57,fore=z+.58,cc='#598486';
 for(let hub of [rear,fore]){ellipseTube(x,yc,hub,r,r,.037,'#304047','x',36);ellipseTube(x+.004,yc,hub,r-.045,r-.045,.014,'#a5aba3','x');for(let j=0;j<18;j++){let a=j*TAU/18;rod([x+(j%2?.026:-.026),yc,hub],[x,yc+(r-.053)*Math.sin(a),hub+(r-.053)*Math.cos(a)],.005,'#a2aeaa',5)}}
 const crank=[x,.52,z-.078],seat=[x,1.02,z-.247],head=[x,.97,z+.39];
 for(let xx of [-.055,.055]){
 path([[x+xx,yc,rear],[x+xx,seat[1],seat[2]],crank,[x+xx,yc,rear]],.024,cc);
 path([[x+xx,yc,fore],[x+xx,.87,z+.43],head],.024,cc);
 }
 path([crank,[x,.59,z+.14],head],.039,cc);
 path([[x,.81,z-.19],[x,.69,z+.095],[x,.73,z+.2],[x,.99,z+.41]],.027,cc);
 path([seat,[x,1.12,z-.28]],.029,'#a6aaa2');bead(x,1.146,z-.30,.119,.045,.153,'#624e41');
 path([head,[x,1.19,z+.354],[x,1.23,z+.321]],.026,'#a6b1ad');
 path([[x-.213,1.21,z+.255],[x-.16,1.25,z+.39],[x+.16,1.25,z+.39],[x+.213,1.21,z+.255]],.02,'#a1b3b0');
 ellipseTube(x+.067,.52,z-.074,.091,.091,.017,'#889a95','x',20);
 rod([x+.082,.51,z-.074],[x+.106,.416,z-.019],.018,'#9a9e95');box(x+.135,.415,z-.015,.11,.024,.065,'#4b5453');
 for(const hub of [rear,fore]){let pts=[];for(let j=0;j<20;j++){let a=.18+j*.149;pts.push([x,yc+(r+.046)*Math.sin(a),hub+(r+.046)*Math.cos(a)])}path(pts,.018,'#9eaaa6')}
 for(const xx of [-.095,.095]){path([[x+xx,yc,rear],[x+xx,.958,rear-.17],[x+xx,.958,rear+.23]],.014,'#728887')}
 const basket=z+.56;
 for(let j=0;j<4;j++){let y=1.014+j*.073,w=.155+j*.014,d=.141+j*.013;path([[x-w,y,basket-d],[x+w,y,basket-d],[x+w,y,basket+d],[x-w,y,basket+d],[x-w,y,basket-d]],.009,'#657e80')}
 for(let side of [-1,1])for(let j=-2;j<=2;j++){rod([x+side*.155,1.014,basket+j*.069],[x+side*.197,1.233,basket+j*.088],.007,'#7e9090');rod([x+j*.073,1.014,basket+side*.141],[x+j*.094,1.233,basket+side*.18],.007,'#7e9090')}
 rod([x,.52,z-.2],[x+.15,.194,z-.36],.016,'#5d7073')
}
bicycle(2.92,-.30);
// Enamel street sign and the gently scuffed white corner guardrail.
for(const [a,b] of [[-2.95,-1.55],[1.24,2.77]]){
 for(const x of [a,b]){cyl(x,.535,2.944,.044,.049,.69,'#d0cec0');cyl(x,.226,2.944,.08,.088,.072,'#83918c');bead(x,.89,2.944,.049,.041,.049,'#bdc4b7')}
 for(const y of [.47,.75])rod([a,y,2.944],[b,y,2.944],.038,'#c6c9b8');
 for(const x of [a+.20,b-.20])cyl(x,.75,2.944,.041,.041,.115,'#ce945e',10,[0,0,half]);
}
function commercialSign(x,z){
 box(x,.28,z,.64,.18,.61,'#9ca79e',true);box(x,2.86,z,.184,5.22,.188,'#8eaaa6',true);
 box(x,5.59,z,1.36,1.48,.305,'#657f81',true);box(x,5.59,z+.164,1.29,1.42,.035,'#dfd1ad',true);panel(x,5.59,z+.185,1.235,1.36,G.tower);panel(x,5.59,z-.158,1.26,1.39,G.tower,Math.PI);
 box(x,4.59,z,1.32,.315,.24,'#8b8273',true);panel(x,4.59,z+.128,1.28,.278,G.open);
 halo(x,5.67,z,2.23,2.49,'#ffdc9a',.085)
}
commercialSign(3.11,-3.98);
function lantern(x,z){
 cyl(x,.294,z,.112,.16,.2,'#415b62');cyl(x,1.95,z,.054,.095,3.31,'#46616a',12);
 path([[x,3.54,z],[x+.03,3.76,z],[x+.10,3.89,z],[x+.24,3.97,z],[x+.61,3.97,z],[x+.75,3.89,z],[x+.78,3.77,z]],.044,'#536e78');
 cyl(x+.78,3.69,z,.084,.311,.16,'#647e83',24);cyl(x+.78,3.595,z,.313,.313,.041,'#38535d',24);bead(x+.78,3.55,z,.214,.085,.212,'!#fff1c4');
 halo(x+.78,3.55,z,1.65,1.55,'#ffc68a',.37);localLight(x+.78,3.46,z,'#ffce94',9,6.2);
 pool(x+.61,.018,z+.45,3.39,3.12,'#e9b271',.10)
}
lantern(3.56,2.26);
// Utility poles and bundles. All cables sag between attachment points.
function pole(x,z,h,transformer){
 cyl(x,.34,z,.212,.23,.31,'#83918c');cyl(x,(h+.19)/2,z,.093,.15,h-.19,'#7d8e90',12);
 for(let y of [1.68,2.82,h-.72,h-.23])cyl(x,y,z,.135,.135,.052,'#455b63',12);
 for(let i=0;i<12;i++)box(x+.137,2.06+i*.303,z,.12,.027,.042,'#576970');
 cyl(x,.93,z,.154,.157,1.08,'#424d4e',16);for(let j=0;j<4;j++)cyl(x,.51+j*.254,z,.16,.161,.131,'#d5af69',16);
 for(let j=0;j<2;j++){box(x,h-j*.53,z,1.42,.094,.129,'#50636b',true);for(const dx of [-.57,.57]){rod([x,h-.46-j*.53,z],[x+dx*.77,h-j*.53,z],.029,'#53676d');cyl(x+dx,h+.12-j*.53,z,.045,.047,.22,'#bec7b9',10);for(let k=0;k<3;k++)cyl(x+dx,h+.07+k*.056-j*.53,z,.079,.068,.024,'#adbbb6',12)}}
 if(transformer){for(const dx of [-.269,.265]){const y=h-1.23;cyl(x+dx,y,z-.04,.21,.195,.69,'#799397',16);for(const k of [-.31,.14,.31])cyl(x+dx,y+k,z-.04,.224,.224,.036,'#506c73');cyl(x+dx,y+.41,z-.04,.069,.082,.19,'#94a6a1');path([[x+dx,y+.49,z-.04],[x+dx+.10,y+.74,z-.04],[x+dx+.15,h+.17,z]],.018,'#384853')}}
}
const poles=[[-6.38,2.48,6.20],[-6.15,-6.40,5.94],[3.46,-6.45,5.61]];
poles.forEach(([x,z,h],i)=>pole(x,z,h,i===0));
function wire(a,b,sag,r,c){let pts=[];for(let j=0;j<=30;j++){let t=j/30;pts.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-4*sag*t*(1-t),a[2]+(b[2]-a[2])*t])}path(pts,r,c,6)}
for(let k=0;k<2;k++){let a=poles[k],b=poles[k+1];for(let j=0;j<4;j++){let dx=j%2===0?-.57:.57,dy=j<2?.24:-.29;wire([a[0]+dx,a[2]+dy,a[1]],[b[0]+dx,b[2]+dy,b[1]],.46+j*.068,.014,'#2c3c48')}}
wire([-6.38,4.80,2.49],[-5.45,3.69,-2.75],.52,.022,'#354553');
panel(-6.38,2.03,2.636,.223,.40,art(128,256,(g,w,h)=>{rect(g,0,0,w,h,'#457166');txt(g,'駒',64,64,68,'#f1e3c3',800,'center');txt(g,'込',64,147,68,'#f1e3c3',800,'center');txt(g,'2-17',64,218,32,'#f1e3c3',800,'center')}));
cyl(3.75,1.14,1.38,.033,.038,1.90,'#a0afac');box(3.75,2.11,1.38,.89,.273,.071,'#6a807b',true);panel(3.75,2.11,1.42,.846,.233,G.alley);
// Community bulletin board, neighbourhood notices under a narrow pitched cap.
box(-6.12,1.14,-2.17,.116,1.9,.13,'#738679');box(-6.12,1.14,-.90,.116,1.9,.13,'#738679');box(-6.12,1.58,-1.53,.13,.98,1.65,'#7c8877',true);
box(-6.05,1.58,-1.53,.027,.854,1.51,'#ae9e7e');for(let j=0;j<3;j++)panel(-6.031,1.57,-2.03+j*.494,.398,.57,G.posters[j===2?3:j],half);
box(-6.12,2.12,-1.53,.41,.073,1.84,'#4b6b6a',true);
// Small three-aspect signal above the side street.
const sx=3.75,sz=-5.43;
cyl(sx,2.0,sz,.052,.084,3.61,'#71858c');path([[sx,3.74,sz],[sx+.10,3.94,sz],[5.54,3.94,sz]],.044,'#71848b');box(5.20,3.82,sz,1.02,.35,.205,'#586e76',true);
const signals=[];
for(let i=0;i<3;i++){let x=4.89+i*.31;cyl(x,3.82,sz+.116,.119,.119,.042,'#344951',20,[half,0,0]);const mat=new T.MeshBasicMaterial({color:0x568785});const m=direct(new T.CircleGeometry(.089,20),mat,x,3.82,sz+.143);box(x,3.939,sz+.147,.23,.019,.138,'#465d66');signals.push(m)}
