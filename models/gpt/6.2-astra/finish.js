'use strict';
// A striped fabric noren over the hot-food counter.
const noren=art(512,256,(g,w,h)=>{rect(g,0,0,w,h,'#ad583b');for(let x=0;x<w;x+=3){rect(g,x,0,1,h,'#b962471f')}rect(g,0,18,w,3,'#e5c39a');rect(g,0,227,w,3,'#e4c6a3');txt(g,'お で ん',256,125,94,'#fff0bf',800,'center');txt(g,'HOSHI   KITCHEN',256,198,18,'#efd3ac',700,'center',latin);});
rod([-3.19,2.47,.99],[-1.76,2.47,.99],.024,'#957e61');
panel(-2.48,2.226,.997,1.31,.434,noren);
for(let i=0;i<2;i++)box(-2.71+i*.45,2.10,1.003,.016,.16,.008,'#5e4d39');
// Folding menu board on the forecourt.
const boardX=1.49,boardZ=2.25;
const menu=art(384,512,(g,w,h)=>{rect(g,0,0,w,h,'#304e4a');g.strokeStyle='#dbc7a1';g.lineWidth=2;g.strokeRect(13,13,358,486);
txt(g,'ほしの キッチン',192,58,31,'#efe4bb',800,'center');txt(g,'本日の弁当',192,137,55,'#ffdd9c',800,'center');
g.save();g.translate(192,274);g.rotate(-.09);rect(g,-122,-62,244,126,'#cca685');rect(g,-111,-53,222,106,'#694b3d');rect(g,-102,-46,97,93,'#ede2ba');circle(g,-56,1,12,'#be634e');for(let i=0;i<6;i++)circle(g,16+(i%3)*31,-22+Math.floor(i/3)*42,17,['#ce9754','#87986d','#a96e4a'][i%3]);g.restore();txt(g,'手づくり   ¥ 480',192,407,42,'#f2e5c0',800,'center');txt(g,'—  HOSHI MART  —',192,468,19,'#c4d2b6',700,'center',latin)},true);
for(let dx of [-.274,.274]){rod([boardX+dx,.19,boardZ+.16],[boardX+dx,1.07,boardZ-.017],.027,'#a5815c');rod([boardX+dx,.19,boardZ-.33],[boardX+dx,1.07,boardZ-.017],.026,'#9a7d5c')}
box(boardX,.699,boardZ+.056,.571,.704,.042,'#b99b70',true,[-.16,0,0]);instance(plane,boardX,.700,boardZ+.082,.517,.65,1,'#fff',[-.16,0,0],menu);
// Smaller foliage, delivery crates, and a lit back door furnish the service lane.
for(let i=0;i<3;i++){
 let x=.01+(i===2?.65:0),z=-4.84,y=.194+(i===1?.282:0);
 box(x,y+.14,z,.58,.28,.43,i===2?'#829387':'#b8986c',true);
 for(let s=0;s<3;s++)box(x,y+.064+s*.073,z-.219,.485,.026,.016,'#6c786a');
 for(let dx of [-.25,.25])box(x+dx,y+.14,z-.229,.045,.26,.018,'#9e9878')
}
box(1.28,1.29,-4.343,.91,2.11,.04,'#788780',true);box(1.28,1.77,-4.377,.46,.55,.02,'!#f7d79f',true);
for(let k=0;k<4;k++)box(1.10+k*.116,1.77,-4.39,.013,.54,.01,'#74867e');
box(.94,1.23,-4.393,.089,.037,.03,'#bdc6ac');
box(1.28,2.57,-4.38,.43,.181,.17,'#536b69',true);box(1.28,2.56,-4.477,.33,.103,.025,'!#ffe4aa');halo(1.28,2.54,-4.55,1.2,.71,'#ffbf78',.23);
for(const z of [-2.35,-3.0])plant(-6.54,z,.66,'#9f836c');
// Water darkens sections of the roof between raised standing seams.
const tin=art(1024,768,(g,w,h)=>{rect(g,0,0,w,h,'#5c7b87');
 for(let x=0;x<w;x+=43){rect(g,x,0,41,h,pick(['#5d7c87','#607f8a','#5b7a85','#597984']));for(let j=0;j<19;j++){const xx=x+random()*41,yy=random()*h;rect(g,xx,yy,between(1,3),between(3,83),pick(['#d2e3dc0e','#223f510c']))}}
 for(let i=0;i<6500;i++){rect(g,random()*w,random()*h,between(1,2),1,'#c0d9da13')}},true);
groundPrint(midX,3.507,midZ,8.082,5.89,tin);
