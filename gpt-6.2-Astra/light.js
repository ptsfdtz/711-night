'use strict';
// A broad strip of light spills through the glazing onto the tiled pavement.
G.platform.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec3 pavementPoint;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n pavementPoint=(modelMatrix*vec4(transformed,1.)).xyz;');
 shader.fragmentShader='varying vec3 pavementPoint;\n'+shader.fragmentShader.replace('#include <opaque_fragment>',`
 vec2 p=pavementPoint.xz;
 float frontage=exp(-2.1*max(0.,abs(p.x+1.55)-3.6))*exp(-.84*pow(abs(p.y-1.40),1.7));
 float sideWindow=exp(-1.6*pow(abs(p.x-2.38),1.6))*exp(-2.1*max(0.,abs(p.y+1.48)-2.34));
 float lamp=exp(-1.18*dot(p-vec2(4.06,2.25),p-vec2(4.06,2.25)));
 outgoingLight+=diffuseColor.rgb*(vec3(1.8,.81,.22)*frontage+vec3(1.47,.67,.22)*sideWindow+vec3(1.0,.64,.27)*lamp);
 #include <opaque_fragment>`);
};
// Linear-light bloom with a low-resolution separable blur keeps crisp ink edges.
const useBloom=renderer.capabilities.isWebGL2&&renderer.extensions.has('EXT_color_buffer_float');
const filmTarget=new T.WebGLRenderTarget(1,1,{samples:useBloom?Math.min(4,renderer.capabilities.maxSamples):0,type:useBloom?T.HalfFloatType:T.UnsignedByteType});
const blurA=new T.WebGLRenderTarget(1,1,{depthBuffer:false,type:useBloom?T.HalfFloatType:T.UnsignedByteType});
const blurB=blurA.clone(),postScene=new T.Scene(),postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
const vertexPost='varying vec2 coord;void main(){coord=uv;gl_Position=vec4(position.xy,0.,1.);}';
function postPass(fragment,uniforms){return new T.ShaderMaterial({vertexShader:vertexPost,fragmentShader:fragment,uniforms,depthTest:false,depthWrite:false})}
const blur=postPass(`varying vec2 coord;uniform sampler2D source;uniform vec2 stepUV;uniform float first;
 vec3 readColor(vec2 p){vec3 c=texture2D(source,p).rgb;return mix(c,c*smoothstep(.44,1.35,dot(c,vec3(.35,.55,.10))),first);}
 void main(){vec3 c=readColor(coord)*.227027;c+=(readColor(coord+stepUV*1.385)+readColor(coord-stepUV*1.385))*.316216;c+=(readColor(coord+stepUV*3.231)+readColor(coord-stepUV*3.231))*.07027;gl_FragColor=vec4(c,1.);}
`,{source:{value:null},stepUV:{value:new T.Vector2()},first:{value:1}});
const finalFilm=postPass(`varying vec2 coord;uniform sampler2D image;uniform sampler2D glow;
 void main(){vec4 object=texture2D(image,coord);vec2 p=(coord-.5)*vec2(1.03,.96);float radial=exp(-5.0*dot(p,p));
 vec3 bg=mix(vec3(.007,.011,.023),vec3(.046,.063,.092),radial);
 vec3 c=object.rgb+bg*(1.-object.a);
 c+=texture2D(glow,coord).rgb*.40;
 gl_FragColor=vec4(c,1.);
 #include <colorspace_fragment>
 }`,{image:{value:filmTarget.texture},glow:{value:blurB.texture}});
const screenQuad=new T.Mesh(new T.PlaneGeometry(2,2),blur);screenQuad.frustumCulled=false;postScene.add(screenQuad);
function resizeFilm(w,h){
 if(!useBloom)return;
 filmTarget.setSize(w,h);blurA.setSize(Math.max(1,Math.floor(w/4)),Math.max(1,Math.floor(h/4)));blurB.setSize(blurA.width,blurA.height)
}
function renderFilm(){
 if(!useBloom){renderer.render(scene,camera);return}
 renderer.setRenderTarget(filmTarget);renderer.render(scene,camera);
 screenQuad.material=blur;blur.uniforms.first.value=1;blur.uniforms.source.value=filmTarget.texture;blur.uniforms.stepUV.value.set(2.9/blurA.width,0);renderer.setRenderTarget(blurA);renderer.render(postScene,postCamera);
 blur.uniforms.first.value=0;blur.uniforms.source.value=blurA.texture;blur.uniforms.stepUV.value.set(0,2.9/blurA.height);renderer.setRenderTarget(blurB);renderer.render(postScene,postCamera);
 screenQuad.material=finalFilm;renderer.setRenderTarget(null);renderer.render(postScene,postCamera)
}