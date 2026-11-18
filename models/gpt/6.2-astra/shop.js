'use strict';
const steel='#3b5056', dark='#283a40', cream='#d8c9a8', coral='#d67150', mint='#498a79';
const floorY=.255, left=-5.47,right=2.36,back=-4.24,front=1.35,midX=(left+right)/2,midZ=(front+back)/2;
// Tiled plinth and timber-lined sales floor.
box(midX,.184,midZ,7.91,.14,5.67,'#a1a198',true);
groundPrint(midX,floorY+.001,midZ,7.82,5.58,G.tile);
box(midX,1.62,back,7.85,2.74,.16,'#c7b490',true);
box(left,1.62,midZ,.16,2.74,5.6,'#9a9b8b',true);
box(midX,1.58,back+.095,7.59,2.51,.025,'!#ffe4ac');
box(left+.095,1.6,midZ,.025,2.54,5.42,'#edc998');
for(let i=0;i<25;i++){box(left+.12+i*.313,1.53,back-.095,.018,2.53,.026,'#849087')}
for(let i=0;i<19;i++){box(left-.095,1.53,back+.15+i*.294,.025,2.53,.022,'#838d87')}
for(const [a,b] of [[left,-1.375],[.175,right]])box((a+b)/2,.51,front,b-a,.52,.12,'#7e9b8c',true);
box(right,.51,midZ,.12,.52,5.59,'#77998c',true);
for(let i=0;i<45;i++)if(left+.1+i*.173 < -1.375 || left+.1+i*.173 > .175)box(left+.1+i*.173,.49,front+.066,.012,.423,.009,'#526f67');
for(let i=0;i<32;i++)box(right+.066,.49,back+.1+i*.172,.008,.423,.012,'#58796e');
// Recess the doorway through the kick panel.
const doorX=-.6, doorW=1.55;

box(doorX,.268,front+.10,doorW,.035,.42,'#8b9793');
const glass=new T.MeshBasicMaterial({color:0x97d8d3,transparent:true,opacity:.055,side:T.DoubleSide,depthWrite:false});
const glints=new T.MeshBasicMaterial({color:0xffebc5,transparent:true,opacity:.17,side:T.DoubleSide,depthWrite:false});
function glazing(x,y,z,w,h,angle=0){const m=direct(plane,glass,x,y,z);m.rotation.y=angle;m.scale.set(w,h,1);m.renderOrder=1}
function frameFront(x){box(x,1.79,front,.076,2.18,.13,dark,true);box(x+.013,1.79,front+.074,.018,2.15,.014,'#9ba99b')}
[-5.44,-3.49,doorX-doorW/2,doorX+doorW/2,1.22,2.33].forEach(frameFront);
for(const [a,b] of [[left,doorX-doorW/2],[doorX+doorW/2,right]]){
 const x=(a+b)/2,w=b-a;glazing(x,1.77,front+.027,w,2.02);
 for(const y of [.779,2.52,2.804])box(x,y,front,w,.049,.11,steel);
 box(x,.752,front+.045,w,.062,.18,'#c7c6a6',true);
 box(x,1.1,front+.075,w,.035,.012,'!#ecb977');
}
storeSide();
function storeSide(){
 for(const z of [back,-3.01,-1.57,-.1,front]){box(right,1.78,z,.135,2.16,.077,dark,true);box(right+.071,1.78,z+.014,.01,2.12,.02,'#b0b5a1')}
 glazing(right+.024,1.79,midZ,5.55,2.04,half);
 for(const y of [.77,1.1,2.52,2.79])box(right,y,midZ,.13,y===1.1?.025:.05,5.61,y===1.1?'!#e8b772':steel);
}
const doorLeaves=[];
const doorMetal=new T.MeshLambertMaterial({color:0x3f5858});
for(const side of [-1,1]){
 const leaf=new T.Group();scene.add(leaf);leaf.position.set(doorX+side*doorW/4,0,front+.122);
 const w=doorW/2;
 function add(x,y,z,sx,sy,sz,mat){const m=direct(cube,mat,x,y,z,leaf);m.scale.set(sx,sy,sz)}
 for(const x of [-w/2+.018,w/2-.018])add(x,1.53,0,.037,2.54,.045,doorMetal);
 for(const y of [.31,1.01,2.55,2.76])add(0,y,0,w,.05,.045,doorMetal);
 const m=direct(plane,glass,0,1.52,.006,leaf);m.scale.set(w-.05,2.43,1);
 const decal=direct(plane,G.door,0,1.2,.028,leaf);decal.scale.set(w*.76,.116,1);
 doorLeaves.push({leaf,side,start:leaf.position.x});
}
box(doorX,2.795,front+.13,doorW+.14,.123,.19,'#526059',true);
box(doorX,2.837,front+.236,.19,.06,.023,'#232e32');
groundPrint(doorX,.202,1.95,1.76,.76,G.mat);
for(const y of [.30,.35,.4])box(doorX,y,front-.047,doorW,.014,.02,'#aaad93');
function packageAt(x,y,z,w,h,d,k){box(x,y+h/2,z,w,h,d,packs[k%8]);panel(x,y+h/2,z+d/2+.002,w*.98,h*.98,G.packets[k%24])}
const bottles=['#b8b878','#ab7840','#77a69e','#db9e5f','#b56b4b','#8fbaad','#d5c49b'];
function drink(x,y,z,k,h=.23){const r=h*.19;const c=bottles[k%7];cyl(x,y+h*.41,z,r,r,h*.77,c,10);cyl(x,y+h*.82,z,r*.48,r,h*.12,c,10);cyl(x,y+h*.93,z,r*.52,r*.52,h*.1,'#e5dbbc',10);cyl(x,y+h*.44,z,r*1.012,r*1.012,h*.27,['#eadba4','#ddd6b8','#b8c5ab'][k%3],10)}
function shelf(x,z,w,h,rows,style){
 box(x,floorY+.07,z,w+.06,.14,.56,'#867e68',true);
 box(x,floorY+h*.5,z-.225,w,h,.045,'#e7d3a8');
 for(const dx of [-w/2,w/2])box(x+dx,floorY+h/2,z-.15,.047,h,.2,'#a7a087');
 for(let j=0;j<rows;j++){
 const y=floorY+.14+j*(h-.2)/rows;
 box(x,y,z,w+.055,.048,.56,'#c5ad85',true);box(x,y-.014,z+.286,w+.05,.061,.018,'!#f3ddad');
 const count=Math.floor(w/.205);
 for(let i=0;i<count;i++){const px=x-w/2+(i+.5)*w/count,k=(j*5+Math.floor(i/2)*3+style)%24;
 if(style===2)drink(px,y+.026,z+.102,k,.21+(i%3)*.018);
 else if(style===0 && j<2){box(px,y+.065,z+.068,.174,.07,.278,'#553f39');box(px,y+.110,z+.06,.165,.027,.26,'#e3bd83');bead(px-.035,y+.133,z+.10,.04,.023,.055,'#b57245');bead(px+.035,y+.133,z+.028,.042,.025,.048,'#7b9564')}
 else packageAt(px,y+.026,z+.11,w/count*.86,between(.18,.265),.135,k);
 if(i%2===0)box(px,y-.01,z+.3,.078,.03,.01,j%2?'!#e9a16c':'!#faf0cb');
 }}
 box(x,floorY+h+.01,z-.13,w,.10,.17,'#c59c72',true);
}
shelf(.65,-.30,2.38,1.38,4,0);
shelf(-2.55,-1.83,2.48,1.54,4,1);
shelf(-4.71,-.82,1.1,1.55,4,1);
panel(.65,1.77,-.415,1.68,.25,G.rackSign[0]);
panel(-2.55,1.93,-1.94,1.62,.25,G.rackSign[1]);
// Refrigerated back wall, glass doors, strips of light and stacked bottles.
for(let k=0;k<4;k++){const x=-4.74+k*1.18,z=-3.78;
 box(x,1.46,z,1.17,2.38,.62,'#9a9d89',true);box(x,1.52,z+.319,1.05,1.85,.012,'!#ecdbab');
 for(let j=0;j<5;j++){const y=.64+j*.327;box(x,y,z+.42,1.09,.036,.30,'#dbc7a0');
 for(let i=0;i<8;i++)drink(x-.475+i*.135,y+.018,z+.439,k*4+Math.floor(i/2)+j,.239)}
 for(let s of [-1,1]){box(x+s*.553,1.48,z+.56,.035,1.92,.04,'#6e786e');box(x+s*.524,1.48,z+.55,.018,1.85,.01,'!#fff5c9')}
 glazing(x,1.48,z+.57,1.07,1.89);
 box(x+.438,1.47,z+.60,.027,.44,.042,'#6a776d');
 panel(x,2.49,z+.325,1.12,.212,G.rackSign[2]);
 for(let i=0;i<13;i++)box(x-.48+i*.08,.408,z+.323,.035,.101,.014,'#737c70');
}
box(.86,1.29,-4.125,1.12,2.06,.042,'#9a9b85',true);box(.86,1.83,-4.091,.49,.35,.012,'#485a54');
panel(.86,1.47,-4.087,.53,.12,plaque('STAFF   ONLY','#d1c8a6','#53635c',40));
box(1.27,1.27,-4.071,.09,.038,.046,'#dbd4b2');
panel(1.86,1.77,-4.135,.60,.81,G.posters[2]);
// Checkout counter, two point-of-sale displays, steaming oden case and coffee equipment.
box(-3.40,.80,.52,2.52,1.08,.72,'#b38e67',true);
for(let i=0;i<24;i++)box(-4.58+i*.103,.78,.891,.018,.91,.013,'#9d795a');
box(-3.4,1.362,.52,2.68,.082,.83,'#ebe0c0',true);
box(-3.76,1.45,.52,.35,.105,.25,'#4f5c55');box(-3.76,1.64,.50,.48,.33,.06,'#374951',true,[-.12,0,0]);panel(-3.76,1.64,.54,.39,.235,plaque('¥  680','#668b88','#d7edc0',56));
box(-3.43,1.42,.70,.18,.054,.19,'#546762');
box(-2.56,1.46,.49,.71,.13,.47,'#9c9982',true);for(let i=0;i<6;i++)bead(-2.78+(i%3)*.21,1.55,.42+Math.floor(i/3)*.16,.09,.06,.066,i%2?'#d2a771':'#be8958');
for(let a of [-.34,.34])for(let b of [-.22,.22])box(-2.56+a,1.68,.49+b,.019,.38,.019,steel);
box(-2.56,1.88,.49,.74,.055,.5,'#c4b399',true);glazing(-2.56,1.7,.73,.70,.32);
box(-4.39,1.70,.43,.37,.61,.4,'#3d4844',true);box(-4.39,1.78,.638,.28,.15,.015,'#8d9f91');
cyl(-4.39,1.493,.665,.065,.05,.144,'#e4cda3');panel(-4.39,2.14,.37,.64,.25,G.rackSign[3]);
// Magazine tiers and a chest freezer beside the side windows.
for(let j=0;j<3;j++){const y=.45+j*.187,z=.805-j*.09;box(1.76,y,z,.84,.087,.17,'#8b8067');for(let i=0;i<3;i++){box(1.47+i*.28,y+.15,z,.245,.30,.036,'#ccaa87');panel(1.47+i*.28,y+.15,z+.02,.239,.29,G.posters[(j+i)%4])}}
box(1.64,.69,-2.73,1.05,.84,1.29,'#d5cbb3',true);box(1.64,1.125,-2.73,1.1,.055,1.34,'#708c86',true);
for(let j=0;j<2;j++)box(1.64,1.16,-3.05+j*.65,.97,.018,.6,'#b4cdbf',true);
for(let i=0;i<3;i++){panel(-5.363,1.94,-2.49+i*.86,.53,.76,G.posters[i],half)}
for(const x of [-3.9,-1.5,1.02]){box(x,2.879,-.87,.16,.045,3.81,'!#fff2c8');box(x,2.887,-.87,.22,.04,3.86,'#e1ceb0')}
localLight(-2.82,2.36,-.30,'#ffcd8b',13,6.7);localLight(1.23,2.35,-1.62,'#ffe8b6',11,6.5);
// Roof, eaves and the continuous shopfront light box.
box(midX,2.963,midZ,8.10,.17,5.9,'#6e776d',true);
box(midX,3.174,midZ,8.20,.38,6.0,'#667980',true);
box(midX,3.399,midZ,8.22,.12,6.01,'#3b5864',true);
box(midX,3.473,midZ,8.09,.065,5.90,'#567783');
for(let i=0;i<24;i++){const x=left-.10+i*.346;box(x,3.524,midZ,.030,.047,5.84,'#6b8c94',true)}
for(const s of [-1,1]){box(midX+s*4.13,3.53,midZ,.14,.17,6.15,'#78929a',true);box(midX,3.53,midZ+s*3.015,8.36,.17,.14,'#76919a',true)}
for(let i=0;i<12;i++)for(const z of [midZ-3.02,midZ+3.02])box(midX-3.83+i*.69,3.624,z,.035,.011,.14,'#455f6a');
box(midX,2.916,1.79,8.36,.16,.91,'#d0bfa3',true);
for(const x of [-5.10,-3.61,-1.23,.64,2.06]){box(x,2.822,1.91,.48,.022,.15,'!#fff0bb');rod([x,2.78,1.41],[x,2.86,2.16],.033,'#8e927d')}
box(midX,3.235,2.18,8.41,.67,.20,'#e6d8b6',true);
panel(midX,3.235,2.284,8.33,.617,G.fascia);
box(midX,3.588,2.18,8.48,.07,.27,'#768886',true);
box(midX,2.892,2.18,8.47,.052,.24,'#737d72',true);
box(right+.228,3.215,-.98,.20,.63,6.58,'#d4c6a7',true);panel(right+.333,3.215,-.98,6.53,.60,G.sideFascia,half);
box(right+.228,3.55,-.98,.249,.067,6.63,'#788c8b',true);
box(left-.224,3.215,-.98,.20,.62,6.58,'#cbbb9e',true);panel(left-.326,3.215,-.98,6.5,.59,G.sideFascia,-half);
for(const x of [left+.15,right-.12]){box(x,2.39,2.02,.044,.78,.045,'#53675e');}
panel(-4.80,1.72,front+.08,.51,.70,G.posters[0]);panel(1.76,2.04,front+.084,.44,.62,G.posters[1]);
panel(right+.077,1.82,-2.61,.52,.71,G.posters[2],half);
panel(right+.077,1.80,-3.30,.51,.69,G.posters[3],half);
pool(-1.49,.203,2.04,8.3,2.4,'#ffba68',.24);
// Paired rooftop fan housings, protective grille bars, service conduits.
function fanUnit(x,z,w,d,h){
 for(let k of [-1,1])box(x+k*w*.34,3.573,z,.14,.107,d+.13,'#384e57');
 box(x,3.62+h/2,z,w,h,d,'#b2c1bb',true);
 const top=3.628+h,rad=Math.min(w,d)*.345;
 cyl(x,top,z,rad*1.12,rad*1.12,.025,'#708786',32);
 cyl(x,top+.02,z,rad,rad,.015,'#354e59',32);
 for(let j=0;j<5;j++){let a=j*TAU/5;const blade=vec(Math.sin(a)*rad*.47,0,Math.cos(a)*rad*.47);box(x+blade.x,top+.035,z+blade.z,rad*.47,.014,rad*.74,'#80918c',false,[0,a+.3,0])}
 for(let j=1;j<=5;j++)ellipseTube(x,top+.052,z,rad*j/5,rad*j/5,.009,'#879c99','y',32);
 for(let j=0;j<4;j++){let a=j*Math.PI/4;rod([x-rad*Math.cos(a),top+.06,z-rad*Math.sin(a)],[x+rad*Math.cos(a),top+.06,z+rad*Math.sin(a)],.009,'#b3c0b2')}
 cyl(x,top+.063,z,rad*.18,rad*.18,.026,'#899c99');
 for(let j=0;j<6;j++)box(x,3.70+j*h*.11,z+d/2+.008,w*.73,.025,.018,'#5a7377');
 panel(x+w*.27,3.62+h*.8,z+d/2+.021,w*.31,.063,G.unitTag)
}
fanUnit(-3.83,-2.98,1.12,1.24,.51);fanUnit(-2.50,-2.98,1.12,1.24,.51);
for(let j=0;j<2;j++){path([[-3.84+j*1.32,3.81,-3.62],[-3.84+j*1.32,3.65,-3.97],[-.47+j*.13,3.65,-3.97],[-.47+j*.13,3.65,-4.37]],.042,'#9baaa0')}
box(.93,3.553,-3.29,1.12,.077,.96,'#425f6c',true);box(.93,3.602,-3.29,1.04,.038,.89,'#809397',true);
for(const z of [-3.64,-2.94])box(.55,3.63,z,.115,.039,.05,'#98a7a4');
cyl(-4.70,3.80,-1.82,.13,.14,.56,'#a3b1aa');cyl(-4.70,4.11,-1.82,.11,.233,.11,'#6e8487');
for(const x of [-5.52,2.45])path([[x,3.38,-4.36],[x,3.15,-4.438],[x,.28,-4.438],[x,.23,-4.74]],.065,'#718783');
