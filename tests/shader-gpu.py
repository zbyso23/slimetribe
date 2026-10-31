"""Actual headless GLSL compilation/raster gates using Mesa EGL, not a browser test."""
from pathlib import Path
import ctypes as C,os,re,json,math,subprocess,sys
os.environ['LIBGL_ALWAYS_SOFTWARE']='1';os.environ['EGL_PLATFORM']='surfaceless'
root=Path(__file__).resolve().parent.parent
E=C.CDLL('libEGL.so.1')
def egl(name,result,args):
 f=getattr(E,name);f.restype=result;f.argtypes=args;return f
ptr=C.c_void_p;I=C.c_int;U=C.c_uint;F=C.c_float
get=egl('eglGetDisplay',ptr,[ptr]);initialize=egl('eglInitialize',U,[ptr,C.POINTER(I),C.POINTER(I)]);choose=egl('eglChooseConfig',U,[ptr,C.POINTER(I),C.POINTER(ptr),I,C.POINTER(I)]);bind=egl('eglBindAPI',U,[U]);context=egl('eglCreateContext',ptr,[ptr,ptr,ptr,C.POINTER(I)]);surface=egl('eglCreatePbufferSurface',ptr,[ptr,ptr,C.POINTER(I)]);current=egl('eglMakeCurrent',U,[ptr,ptr,ptr,ptr]);address=egl('eglGetProcAddress',ptr,[C.c_char_p])
d=get(None);major=I();minor=I();assert initialize(d,C.byref(major),C.byref(minor)),'EGL initialize';assert bind(0x30A0)
attrs=(I*17)(0x3033,1,0x3040,0x40|4,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3025,24,0x3038,0,0);config=ptr();n=I();assert choose(d,attrs,C.byref(config),1,C.byref(n)) and n.value
W=320;H=280;s=surface(d,config,(I*5)(0x3057,W,0x3056,H,0x3038));assert s;ctx=context(d,config,None,(I*3)(0x3098,3,0x3038));assert ctx and current(d,s,s,ctx)
def gl(name,result,args):
 p=address(name.encode());assert p,name;return C.CFUNCTYPE(result,*args)(p)
string=gl('glGetString',C.c_char_p,[U]);print('GL renderer:',string(0x1F01).decode());print('GL version:',string(0x1F02).decode())
shader=gl('glCreateShader',U,[U]);source=gl('glShaderSource',None,[U,I,C.POINTER(C.c_char_p),C.POINTER(I)]);compile_=gl('glCompileShader',None,[U]);shaderiv=gl('glGetShaderiv',None,[U,U,C.POINTER(I)]);shaderlog=gl('glGetShaderInfoLog',None,[U,I,C.POINTER(I),C.c_char_p]);program=gl('glCreateProgram',U,[]);attach=gl('glAttachShader',None,[U,U]);link=gl('glLinkProgram',None,[U]);programiv=gl('glGetProgramiv',None,[U,U,C.POINTER(I)]);programlog=gl('glGetProgramInfoLog',None,[U,I,C.POINTER(I),C.c_char_p]);attrib=gl('glBindAttribLocation',None,[U,U,C.c_char_p]);use=gl('glUseProgram',None,[U]);loc=gl('glGetUniformLocation',I,[U,C.c_char_p]);u1i=gl('glUniform1i',None,[I,I]);u1f=gl('glUniform1f',None,[I,F]);u3=gl('glUniform3fv',None,[I,I,C.POINTER(F)]);u4=gl('glUniform4fv',None,[I,I,C.POINTER(F)]);um=gl('glUniformMatrix4fv',None,[I,I,C.c_ubyte,C.POINTER(F)])
code=(root/'src/eldor-render.js').read_text();vs=re.search(r'sh\(35633,`(.*?)`',code,re.S)[1];fs=re.search(r'sh\(35632,`(.*?)`',code,re.S)[1]
def old(text,fragment=False):
 text=text.replace('#version 300 es','');text=re.sub(r'layout\(location=\d+\)in','attribute',text);text=re.sub(r'\bout vec3\b','varying vec3',text);text=re.sub(r'\bout vec2\b','varying vec2',text)
 if fragment:
  text=re.sub(r'\bin vec3\b','varying vec3',text);text=re.sub(r'\bin vec2\b','varying vec2',text);text=text.replace('out vec4 o;','').replace('o=vec4(','gl_FragColor=vec4(').replace('dFdx(b)','0.0').replace('dFdy(b)','0.0')
 return re.sub(r'\btexture\(', 'texture2D(',text)
def make(v,f):
 p=program()
 for ty,txt in [(0x8B31,v),(0x8B30,f)]:
  sh=shader(ty);b=txt.encode();source(sh,1,C.byref(C.c_char_p(b)),None);compile_(sh);ok=I();shaderiv(sh,0x8B81,C.byref(ok));log=C.create_string_buffer(8192);shaderlog(sh,8192,None,log);assert ok.value,log.value.decode();attach(p,sh)
 for i,name in enumerate([b'p',b'n',b'c',b'u']):attrib(p,i,name)
 link(p);ok=I();programiv(p,0x8B82,C.byref(ok));log=C.create_string_buffer(8192);programlog(p,8192,None,log);assert ok.value,log.value.decode();return p
p3=make(vs,fs);p1=make(old(vs),old(fs,True));print('PASS actual GLSL ES 3.00 and translated ES 1.00 compile/link')
buffer=gl('glGenBuffers',None,[I,C.POINTER(U)]);bindbuffer=gl('glBindBuffer',None,[U,U]);data=gl('glBufferData',None,[U,C.c_size_t,ptr,U]);enableattr=gl('glEnableVertexAttribArray',None,[U]);attrptr=gl('glVertexAttribPointer',None,[U,I,U,C.c_ubyte,I,ptr]);texture=gl('glGenTextures',None,[I,C.POINTER(U)]);activetex=gl('glActiveTexture',None,[U]);bindtex=gl('glBindTexture',None,[U,U]);teximage=gl('glTexImage2D',None,[U,I,I,I,I,I,U,U,ptr]);texparam=gl('glTexParameteri',None,[U,U,I]);viewport=gl('glViewport',None,[I,I,I,I]);clearcolor=gl('glClearColor',None,[F,F,F,F]);clear=gl('glClear',None,[U]);enable=gl('glEnable',None,[U]);draw=gl('glDrawArrays',None,[U,I,I]);read=gl('glReadPixels',None,[I,I,I,I,U,U,ptr]);error=gl('glGetError',U,[])
node=os.environ.get('CODEX_PRIMARY_RUNTIME_NODE','node');script="const fs=require('fs'),M=require('./src/model-core.js'),m=M.parse(JSON.parse(fs.readFileSync('./vendor/models/slizak.json')),'slizak');process.stdout.write(JSON.stringify(Array.from(M.sample(m,'stand',0))));";vertices=json.loads(subprocess.check_output([node,'-e',script],cwd=root,text=True));arr=(F*len(vertices))(*vertices);buf=U();buffer(1,C.byref(buf));bindbuffer(0x8892,buf);data(0x8892,C.sizeof(arr),arr,0x88E4)
for i,(size,offset) in enumerate([(3,0),(3,3),(3,6),(2,9)]):enableattr(i);attrptr(i,size,0x1406,0,44,ptr(offset*4))
pixels=(C.c_ubyte*(64*64*4))(*[v for y in range(64) for x in range(64) for v in [int(105+65*math.sin(x*.17)*math.cos(y*.21)),int(95+40*math.sin(x*.11+y*.13)),90,255]])
for slot in [0,1]:
 tex=U();texture(1,C.byref(tex));activetex(0x84C0+slot);bindtex(0x0DE1,tex);teximage(0x0DE1,0,0x1908,64,64,0,0x1908,0x1401,pixels);texparam(0x0DE1,0x2801,0x2601);texparam(0x0DE1,0x2800,0x2601);texparam(0x0DE1,0x2802,0x2901);texparam(0x0DE1,0x2803,0x2901)
def norm(a):
 l=math.sqrt(sum(v*v for v in a));return [v/l for v in a]
def cross(a,b):return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
eye=[2.8,2.5,4];target=[0,1,0];z=norm([a-b for a,b in zip(eye,target)]);x=norm(cross([0,1,0],z));y=cross(z,x);view=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];t=1/math.tan(.85/2);near=.05;far=80;proj=[t/(W/H),0,0,0,0,t,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];vp=[sum(proj[k*4+j]*view[i*4+k] for k in range(4)) for i in range(4) for j in range(4)];rot=-math.pi/2;model=[math.cos(rot),0,-math.sin(rot),0,0,1,0,0,math.sin(rot),0,math.cos(rot),0,0,0,0,1]
viewport(0,0,W,H);enable(0x0B71);bg=(10,20,30)
def render(kind,time=0,params=(.2,.85,.6,1),p=p3,mist=0):
 use(p)
 def L(n):return loc(p,n.encode())
 for name,v in [('t0',0),('t1',1),('mode',2),('fx',0),('matKind',kind)]:u1i(L(name),v)
 u1f(L('ft'),time);u1f(L('fi'),0);u1f(L('localMist'),mist)
 for name,v in [('cam',eye),('fl',[0,0,0]),('fcol',[.3,.8,1]),('fogc',[.04,.08,.12])]:u3(L(name),1,(F*3)(*v))
 u4(L('matParams'),1,(F*4)(*params));um(L('vp'),1,0,(F*16)(*vp));um(L('m'),1,0,(F*16)(*model));clearcolor(*(c/255 for c in bg),1);clear(0x4000|0x0100);draw(4,0,len(vertices)//11);out=(C.c_ubyte*(W*H*4))();read(0,0,W,H,0x1908,0x1401,out);assert error()==0;return bytes(out)
def changed(a,b):return sum(a[i:i+3]!=b[i:i+3] for i in range(0,len(a),4))
def coverage(a):return sum(any(abs(a[i+j]-bg[j])>1 for j in range(3)) for i in range(0,len(a),4))
base=render(0);assert coverage(base)>2000;assert changed(base,render(0,mist=1))>100;print('PASS actual low world-space mist changes the raster independently of surface material')
for kind in [1,2,3,4,5,6,8]:assert changed(base,render(kind))>100,kind
assert changed(render(1,params=(.1,.9,.5,1)),render(1,params=(.9,.9,.5,1)))>25
print('PASS original MD2 mesh raster: slime/water/swamp/rune/hit/heal/aura change pixels; roughness changes highlight')
for kind in [2,3,4,6]:assert changed(render(kind,0),render(kind,1))>50,kind
assert render(2,.7)==render(2,.7)
print('PASS animated water/swamp/runes/healing and exact paused-time repeat')
assert changed(render(3,params=(.85,.08,.3,.6)),render(3,params=(.85,.8,.3,.6)))>100
print('PASS Toxic matte vein shader changes actual MD2 raster in GLES')
a=render(7,params=(.2,.5,0,1));b=render(7,params=(.2,.5,.5,1));c=render(7,params=(.2,.5,1,1));assert coverage(a)>coverage(b)>500;assert coverage(c)==0
print('PASS dissolve coverage decreases and final progress discards the entire mesh')
render(1);assert render(0)==base;assert changed(render(0,p=p1),render(1,p=p1))>100
print('PASS explicit uniform reset restores baseline; translated WebGL1 material path actually rasterizes')
from PIL import Image
for name,raw in [('before',base),('after',render(1,.4)),('water',render(2,.4)),('rune',render(4,.4)),('dissolve',b)]:Image.frombytes('RGBA',(W,H),raw).transpose(Image.Transpose.FLIP_TOP_BOTTOM).save(root/'tests'/('shader-'+name+'.png'))
(root/'tests/shader-gpu-results.json').write_text(json.dumps({'renderer':string(0x1F01).decode(),'version':string(0x1F02).decode(),'gles300_compiled':True,'gles100_compiled':True,'browser_verified':False,'all_passed':True},indent=2))
