'use strict';
const G={};
const jp='"Yu Gothic","Meiryo","Microsoft YaHei",sans-serif', latin='"Arial",sans-serif';
function rect(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h)}
function circle(g,x,y,r,c){g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,TAU);g.fill()}
function poly(g,pts,c){g.fillStyle=c;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill()}
function txt(g,s,x,y,size,c,weight=700,align='left',font=jp){g.fillStyle=c;g.font=weight+' '+size+'px '+font;g.textAlign=align;g.textBaseline='middle';g.fillText(s,x,y)}
function art(w,h,fn,lit=false){return printed(texture(w,h,fn),lit)}
function star(g,x,y,r,col){poly(g,[[x,y-r],[x+r*.24,y-r*.26],[x+r,y],[x+r*.25,y+r*.24],[x,y+r],[x-r*.25,y+r*.25],[x-r,y],[x-r*.24,y-r*.23]],col)}
function emblem(g,x,y,r){circle(g,x,y,r,'#087a70');star(g,x,y,r*.93,'#fff3cc');star(g,x+r*.67,y-r*.63,r*.38,'#f4764b')}
G.fascia=art(2048,184,(g,w,h)=>{rect(g,0,0,w,h,'#fff2d5');rect(g,0,0,w,15,'#ec7551');rect(g,0,h-19,w,19,'#148375');rect(g,0,h-30,w,8,'#eda156');emblem(g,248,81,52);txt(g,'星乃マート',336,78,124,'#15544c',900);txt(g,'HOSHI MART',1120,63,62,'#285b50',900,'left',latin);txt(g,'K O M A G O M E   •   T O K Y O',1124,112,21,'#8b8270',700,'left',latin);rect(g,1744,39,197,83,'#e26b4b');txt(g,'24 OPEN',1843,83,36,'#fff4d9',800,'center',latin)});
G.sideFascia=art(1024,150,(g,w,h)=>{rect(g,0,0,w,h,'#fff0ce');rect(g,0,0,w,10,'#e77351');rect(g,0,124,w,7,'#e6a050');rect(g,0,136,w,14,'#118077');emblem(g,244,64,40);txt(g,'星乃マート',330,64,70,'#245a50',900);txt(g,'24h',795,73,40,'#dc684c',800)});
G.tower=art(512,512,(g,w,h)=>{rect(g,0,0,w,h,'#ffedc9');rect(g,0,0,w,19,'#e67853');emblem(g,256,161,94);txt(g,'HOSHI',256,310,85,'#145651',900,'center',latin);txt(g,'M A R T',256,372,47,'#155751',800,'center',latin);rect(g,0,410,w,102,'#147e70');txt(g,'星 乃 マ ー ト',256,463,42,'#fff2c8',800,'center')});
G.open=art(512,142,(g,w,h)=>{rect(g,0,0,w,h,'#ef8459');txt(g,'24h  OPEN',w/2,h/2,78,'#fff3cb',900,'center',latin)});
G.door=art(512,96,(g,w,h)=>{rect(g,0,0,w,h,'#e7d9b8');rect(g,0,0,16,h,'#e87955');txt(g,'自 動 ド ア   ◂ ▸',w/2,h/2,42,'#2e6761',800,'center')});
G.mat=art(512,256,(g,w,h)=>{rect(g,0,0,w,h,'#284346');for(let i=0;i<w;i+=5)rect(g,i,0,2,h,'#354e50');rect(g,26,24,460,3,'#9b9b80');rect(g,26,228,460,3,'#9b9b80');txt(g,'HOSHI MART',256,119,50,'#d2cfb2',800,'center',latin);txt(g,'いらっしゃいませ',256,174,24,'#b5b7a4',700,'center')},true);
function poster(kind){
 return art(384,512,(g,w,h)=>{
 const bg=['#f4d8a4','#215e76','#ec785b','#729c86'][kind], dark=['#883e32','#ffedc2','#fff0c6','#e9ebcd'][kind];
 rect(g,0,0,w,h,bg);rect(g,20,20,w-40,2,dark);
 txt(g,['HOSHI  KITCHEN','SEASONAL  DRINK','HOSHI  BAKERY','LOCAL   NEWS'][kind],28,47,19,dark,800,'left',latin);
 txt(g,['おにぎり','夜のラムネ','焼きたて','夏まつり'][kind],24,113,68,dark,900);
 if(kind===0){for(let j=0;j<2;j++){g.save();g.translate(132+j*111,278+j*44);g.rotate(j?.16:-.14);g.fillStyle='#fff9dc';g.beginPath();g.moveTo(-82,49);g.quadraticCurveTo(-90,57,-70,16);g.lineTo(-18,-69);g.quadraticCurveTo(0,-95,20,-65);g.lineTo(79,27);g.quadraticCurveTo(96,60,60,62);g.lineTo(-69,62);g.fill();rect(g,-25,9,50,55,'#294941');for(let k=0;k<28;k++)rect(g,between(-36,38),between(-24,9),4,2,'#cfbb95');g.restore()}}
 if(kind===1){circle(g,260,267,107,'#76c4b6');g.save();g.translate(176,288);g.rotate(.18);rect(g,-38,-60,76,159,'#9bded0');rect(g,-25,-110,50,62,'#c5e8d8');rect(g,-32,-119,64,19,'#faf3c1');rect(g,-38,-19,76,70,'#f4e9b8');star(g,0,17,28,'#2a8a8b');g.restore();for(let i=0;i<18;i++)circle(g,between(23,w-23),between(180,380),between(2,5),'#e3f2d1')}
 if(kind===2){g.save();g.translate(189,288);g.rotate(-.26);g.fillStyle='#e7ae61';g.beginPath();g.ellipse(0,0,132,72,0,0,TAU);g.fill();for(let j=-1;j<=1;j++){g.fillStyle='#fbe0a0';g.beginPath();g.ellipse(j*60,-14,9,40,.3,0,TAU);g.fill()}g.restore()}
 if(kind===3){for(let i=0;i<5;i++){const x=65+i*61,y=159+(i%2)*34;rect(g,x-2,140,4,50,'#394f51');circle(g,x,y+42,26,'#f4bd80');rect(g,x-11,y+63,22,6,'#54726c')}txt(g,'八月 十七日',192,333,44,'#faf1cd',800,'center')}
 rect(g,28,407,328,2,dark);txt(g,['手づくりの味','すっきり、爽やか。','毎朝 お店で','駒込商店街'][kind],28,440,29,dark);txt(g,'星乃マート    •    HOSHI MART',29,481,15,dark)
 })
}
G.posters=[0,1,2,3].map(poster);
function plaque(s,bg,fg,size=46){return art(512,96,(g,w,h)=>{rect(g,0,0,w,h,bg);txt(g,s,w/2,h/2,size,fg,800,'center')})}
G.rackSign=[plaque('お弁当   ·   DELI','#cc7047','#fff1c3'),plaque('お菓子   ·   SNACKS','#a66350','#fff0ce'),plaque('冷たい飲みもの','#42796b','#fff4c7'),plaque('HOT   COFFEE','#674638','#ffdda6')];
G.unitTag=plaque('H I B I K I    •    AC-08','#a6bab4','#42585e',25);
G.alley=plaque('駒込二丁目   2–17','#306359','#f4e9c5');
G.stop=art(256,256,(g,w,h)=>{rect(g,0,0,w,h,'#ad473d');txt(g,'止まれ',128,128,60,'#fff2d2',800,'center')});
G.vend=art(384,768,(g,w,h)=>{
 rect(g,0,0,w,h,'#cf513e');rect(g,12,12,w-24,86,'#e98060');txt(g,'Hoshi Soda',192,54,54,'#fff1ca',800,'center','Georgia,serif');
 rect(g,20,110,344,365,'#514f50');rect(g,30,119,324,347,'#e6ece0');
 const colors=['#d66b46','#e2ac51','#51867d','#5386a3','#d7cba8','#bb655f'];
 for(let j=0;j<3;j++){const y=151+j*111;for(let i=0;i<8;i++){let x=43+i*39;rect(g,x+6,y+3,17,9,'#f6efe0');rect(g,x+3,y+12,24,53,colors[(i+j*3)%6]);rect(g,x+4,y+30,22,16,'#f7f0cb');txt(g,['茶','S','水','珈'][i%4],x+15,y+39,12,'#345854',800,'center');rect(g,x+5,y+14,3,43,'#f7edc888')}rect(g,30,y+67,324,9,'#a2af9d');rect(g,30,y+76,324,11,'#d9e6d9');for(let i=0;i<8;i++)circle(g,55+i*39,y+81,4,'#77b3c7')}
 txt(g,'つめた〜い',35,504,24,'#ffdfbd',800);rect(g,260,492,88,120,'#643e37');rect(g,275,506,55,22,'#9acaad');rect(g,278,544,54,6,'#272f30');circle(g,307,581,11,'#b5b4a6');
 g.fillStyle='#e8795a';g.beginPath();g.arc(40,752,156,Math.PI,TAU);g.fill();star(g,74,626,47,'#f9c992');rect(g,41,652,257,68,'#743f36');rect(g,50,662,238,49,'#293838');rect(g,54,663,232,8,'#58615b');txt(g,'HOSHI  BEVERAGE  CO.',195,746,12,'#ffdeba',700,'center',latin)
});
G.vendSide=art(256,512,(g,w,h)=>{rect(g,0,0,w,h,'#d2654b');star(g,130,180,63,'#f5c78f');txt(g,'Soda',128,278,77,'#ffe3b2',800,'center','Georgia,serif');txt(g,'星 乃 飲 料',128,344,29,'#ffe9bb',800,'center')},true);
G.platform=art(1024,512,(g,w,h)=>{rect(g,0,0,w,h,'#79858b');for(let i=0;i<18000;i++){g.fillStyle=random()>.5?'rgba(217,225,216,.12)':'rgba(30,51,61,.11)';g.fillRect(random()*w,random()*h,1.5,1)}for(let y=0;y<h;y+=64){rect(g,0,y,w,2,'#56646e');for(let x=(y%128?64:0);x<w;x+=128)rect(g,x,y,2,64,'#586771')}},true);
G.tile=art(512,512,(g,w,h)=>{rect(g,0,0,w,h,'#eed6a9');for(let i=0;i<8;i++){rect(g,i*64,0,2,h,'#c9ac85');rect(g,0,i*64,w,2,'#c9ac85')}},true);
G.packets=[];const packs=['#d9794f','#cbab55','#639888','#ae6362','#849eae','#ad8f70','#ede1af','#67786d'];
for(let k=0;k<24;k++){G.packets.push(art(96,128,(g,w,h)=>{const base=packs[k%8];rect(g,0,0,w,h,base);rect(g,0,3,w,4,'#f3ddbc');rect(g,0,119,w,4,'#e7c6a1');txt(g,['星乃','しお','抹茶','いちご','珈琲','カレー','ミルク','のり'][k%8],48,33,21,'#fff6d8',800,'center');circle(g,48,75,25,'#f1d5a2');if(k%3===0)star(g,48,75,18,base);else{circle(g,48,75,14,base);circle(g,54,68,4,'#f5e2bb')}rect(g,15,105,66,3,'#fff0d0')},true))}
