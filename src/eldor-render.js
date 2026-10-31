const M={persp(f,a,n,r){const t=1/Math.tan(f/2);return[t/a,0,0,0,0,t,0,0,0,0,(r+n)/(n-r),-1,0,0,2*r*n/(n-r),0]},
look(e,c){const s=(a,b)=>a.map((v,i)=>v-b[i]),cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l)},d=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const z=nm(s(e,c)),x=nm(cr([0,1,0],z)),y=cr(z,x);return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-d(x,e),-d(y,e),-d(z,e),1]},
mul(a,b){const o=[];for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s}return o},
trs(p,r,s){const c=Math.cos(r),n=Math.sin(r);return[c*s,0,-n*s,0,0,s,0,0,n*s,0,c*s,0,p[0],p[1],p[2],1]}};
const cv=$('#cv'),cw=$('#cw'),pn=$('#pn');
const e12Force2D=new URLSearchParams(location.search).get('force2d')==='1'||document.documentElement.getAttribute?.('data-force2d')==='1';
let gl=e12Force2D?null:(cv.getContext('webgl2')||cv.getContext('webgl')||cv.getContext('experimental-webgl'));
const isCanvas2D=!gl;
const ctx2=isCanvas2D?cv.getContext('2d'):null;
const gpu=isCanvas2D?new Proxy({}, {get:(o,k)=>{if(k==='createBuffer'||k==='createTexture'||k==='createShader'||k==='createProgram'||k==='getUniformLocation')return ()=>({});if(k==='getShaderParameter'||k==='getProgramParameter')return ()=>true;if(k==='getShaderInfoLog'||k==='getProgramInfoLog')return ()=>'';return ()=>undefined}}):gl;

if(isCanvas2D)gl=gpu;
const isGL2=typeof WebGL2RenderingContext!=='undefined'&&gl instanceof WebGL2RenderingContext;
window.EldorGLBackend=isCanvas2D?'Canvas 2D':isGL2?'WebGL2':'WebGL1';

const sh=(ty,s)=>{if(!isGL2){s=s.replace('#version 300 es','').replace(/layout\(location=\d+\)in/g,'attribute').replace(/\bout vec3\b/g,'varying vec3').replace(/\bout vec2\b/g,'varying vec2');if(ty===gl.FRAGMENT_SHADER){s=s.replace(/\bin vec3\b/g,'varying vec3').replace(/\bin vec2\b/g,'varying vec2').replace(/out vec4 o;/,'').replace(/\bo=vec4\(/g,'gl_FragColor=vec4(').replace(/dFdx\(b\)/g,'0.0').replace(/dFdy\(b\)/g,'0.0')}s=s.replace(/\btexture\(/g,'texture2D(')}const o=gl.createShader(ty);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))console.error('Shader compile:',gl.getShaderInfoLog(o));return o},pg=gl.createProgram();
gl.attachShader(pg,sh(35633,`#version 300 es
layout(location=0)in vec3 p;layout(location=1)in vec3 n;layout(location=2)in vec3 c;layout(location=3)in vec2 u;uniform mat4 vp,m;out vec3 vc,vn,wp;out vec2 vu;
void main(){vec4 w=m*vec4(p,1);wp=w.xyz;vn=mat3(m)*n;vc=c;vu=u;gl_Position=vp*w;}`));
gl.attachShader(pg,sh(35632,`#version 300 es
precision mediump float;in vec3 vc,vn,wp;in vec2 vu;uniform sampler2D t0,t1;uniform int mode;uniform vec3 cam,fl;uniform int fx;uniform float ft,fi;uniform vec3 fcol;uniform vec3 fogc;uniform int matKind;uniform vec4 matParams;uniform float localMist;out vec4 o;
void main(){vec3 N=normalize(vn);if(mode!=0){float b=texture(t1,vu).g;N=normalize(N+vec3(dFdx(b),0.,dFdy(b))*.75);}float d=max(dot(N,normalize(vec3(.5,1.,.3))),0.);vec3 a=mode==0?texture(t0,vu).rgb:mode==2?texture(t1,vu).rgb:vc*(.55+.9*texture(t1,vu).g);
vec3 col=a*(.4+.75*d)+fl;if(fx==1)col=a+fl;if(fx==2)col=a*1.9+fl;if(fx==4)col*=.75+.25*sin(ft*5.)*fi+fi*.5;if(fx==5)col+=vec3(.03,.12,.25)*sin(wp.x*3.+ft*2.)*fi;if(fx==6&&fract(sin(dot(floor(wp*15.),vec3(12.9898,78.233,32.17)))*43758.5453)<fi*.7)discard;if(fx==2)col=mix(col,fcol,fi*.55);if(fx==4)col+=fcol*(.2+.18*sin(ft*5.))*fi;
 if(fx==7){col=mix(col,fcol,.72)+vec3(.2)*sin(wp.y*28.-ft*9.);}
 if(fx==9)col=mix(col,fcol,.8);
 if(fx==10){float q=floor(d*3.+.5)/3.;col=a*(.22+q*.9)+fl;if(dot(normalize(vn),normalize(cam-wp))<.28)col*=.3;}
 if(fx==11){float rim=pow(1.-abs(dot(normalize(vn),normalize(cam-wp))),3.);col=mix(a*.25,fcol,.5)+fcol*rim*1.6*(.7+.3*sin(ft*4.));}
 if(fx==12){float wave=sin(wp.x*2.3+ft*1.4)*sin(wp.z*2.-ft)+sin(wp.y*4.+ft*2.);col=mix(a*.5,vec3(1.,.38,.06),.52+.21*wave)+vec3(.24,.06,.01)*fi;}
 if(fx==13){col=mix(a,vec3(.6,.85,1.),.5)+vec3(.15,.32,.45)*pow(1.-abs(dot(normalize(vn),normalize(cam-wp))),2.);}
 if(fx==14){float rim=pow(1.-abs(dot(normalize(vn),normalize(cam-wp))),2.);col=mix(col,vec3(1.,.76,.24),.72)+vec3(1.,.73,.25)*rim;}
 if(fx==15){col+=vec3(.12*sin(wp.y*30.+ft*18.),-.03,.15)*fi;if(fract(sin(dot(floor(wp*13.+ft*2.),vec3(2.9,47.3,31.7)))*3674.54)>.94)col=col.bgr;}
 if(fx==16){col+=vec3(1.,.24,.03)*(.28+.23*sin(ft*6.))*fi;}
 // SlimeTribe procedural surface materials. Params: roughness, wetness, glow/progress, motion.
if(matKind>0){
 vec3 V=normalize(cam-wp),L=normalize(vec3(.5,1.,.3));
 float rough=clamp(matParams.x,.04,1.),wet=clamp(matParams.y,0.,1.);
 float glow=clamp(matParams.z,0.,2.),speed=matParams.w;
 vec3 H=normalize(L+V);float rim=pow(1.-clamp(dot(N,V),0.,1.),3.);
 float shine=pow(max(dot(N,H),0.),mix(110.,6.,rough));
 if(matKind==1){col+=vec3(.78,.9,1.)*shine*(.2+wet*1.5)+fcol*rim*(.13+wet*.32+glow*.35)*(.94+.06*sin(ft*speed*2.+wp.y*3.));}
 if(matKind==2||matKind==3){
  float wave=sin(wp.x*4.+ft*speed*1.3)+cos(wp.z*5.-ft*speed);
  vec3 W=normalize(N+vec3(cos(wp.x*4.+ft*speed*1.3),0.,-sin(wp.z*5.-ft*speed))*.19);
  float reflection=pow(max(dot(W,H),0.),mix(100.,8.,rough));
  if(matKind==2)col=mix(col,vec3(.035,.31,.39)+wave*.025,.48)+vec3(.65,.86,1.)*reflection*(.3+wet*1.4)+vec3(.05,.19,.22)*rim;
  else col=col*(.88+wave*.025)+vec3(.42,.63,.45)*reflection*wet*.85;
 }
 if(matKind==4){float pulse=.6+.4*sin(ft*speed*2.4+wp.y*3.);float rune=.4+.6*pow(abs(sin(wp.y*12.+sin(wp.x*7.))),8.);col+=fcol*glow*pulse*rune+fcol*rim*.25+vec3(.8,.9,1.)*shine*wet*.35;}
 if(matKind==5)col=mix(col,vec3(1.,.12,.055),clamp(glow,0.,1.)*.8);
 if(matKind==6)col+=vec3(.08,.85,.33)*glow*(.6+.4*sin(ft*speed*8.+wp.y*5.));
 if(matKind==7){float noise=fract(sin(dot(floor(wp*19.),vec3(.73,1.17,2.31)))*17.13);if(noise<clamp(glow,0.,1.))discard;col+=fcol*(1.-smoothstep(0.,.09,noise-clamp(glow,0.,1.)))*1.6;}
 if(matKind==8){float arim=pow(1.-clamp(dot(N,V),0.,1.),mix(2.,5.,rough));col=mix(col,col*.4+fcol*arim*(.8+glow)*(.9+.1*sin(ft*speed*2.)),.8)+fcol*.08+vec3(.7,.8,1.)*shine*wet*.3;}
}
// Low, gently moving world-space mist; disabled for tactical battles and previews.
if(localMist>0.){float low=1.-smoothstep(.12,1.45,wp.y);float drift=.82+.18*sin(wp.x*.8+wp.z*.6+ft*.23);float depth=1.-exp(-max(0.,length(wp-cam)-1.2)*.22);col=mix(col,fogc,clamp(localMist*low*drift*depth,0.,.65));}

 float alpha=fx==8?.37+.22*sin(ft*3.):fx==7?.72:1.;float f=clamp((length(wp-cam)-25.)/45.,0.,1.);o=vec4(mix(col,fogc,f*(fx==3?1.:65e-2)),alpha); }`));
if(!isGL2){['p','n','c','u'].forEach((n,i)=>gl.bindAttribLocation(pg,i,n))}
gl.linkProgram(pg);if(!gl.getProgramParameter(pg,gl.LINK_STATUS))console.error('Shader link:',gl.getProgramInfoLog(pg));gl.useProgram(pg);gl.enable(2929);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
const U={};['vp','m','t0','t1','mode','cam','fl','fx','ft','fi','fcol','fogc','matKind','matParams','localMist'].forEach(n=>U[n]=gl.getUniformLocation(pg,n));gl.uniform1i(U.t0,0);gl.uniform1i(U.t1,1);gl.uniform3fv(U.fogc,[.56,.77,.91]);
function meshLayout(){[[3,0],[3,3],[3,6],[2,9]].forEach(([sz,o],i)=>{gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,sz,gl.FLOAT,false,44,o*4)})}
function mk(V){const buffer=gl.createBuffer(),vao=isGL2?gl.createVertexArray():null;if(vao)gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(V),gl.STATIC_DRAW);if(vao)meshLayout();return{v:vao,buffer,n:V.length/11}}
function bindMesh(mesh){if(isGL2)gl.bindVertexArray(mesh.v);else{gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);meshLayout()}}
