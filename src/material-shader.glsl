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
