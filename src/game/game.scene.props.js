/* Compound props: immutable recipes baked into triangle data, one shared material. */
Game.Scene.Props={};
(function(P){
const stone=[.35,.42,.39],dark=[.16,.23,.22],metal=[.36,.4,.28],toxin=[.58,.72,.15];
const box=(x,y,z,w,h,d,color=stone)=>({shape:'box',x,y,z,w,h,d,color});
const cylinder=(x,y,z,w,h,d,color=stone,n=12)=>({shape:'cylinder',x,y,z,w,h,d,color,n});
P.recipes={
 cistern:[box(0,0,0,1,.12,1),...Array.from({length:12},(_,i)=>{const a=i/12*Math.PI*2;return cylinder(Math.cos(a)*.39,.12,Math.sin(a)*.39,.2,.52,.2)}),cylinder(0,.14,0,.65,.04,.65,toxin),box(.36,.38,0,.17,.12,.2,dark)],
 apparatus:[box(0,0,0,.94,.13,.8,dark),...[-.34,.34].flatMap(x=>[-.26,.26].map(z=>box(x,.13,z,.1,.55,.1,metal))),box(0,.68,0,.9,.1,.7,metal),cylinder(-.2,.78,0,.3,.5,.3,dark),cylinder(-.2,1.28,0,.19,.1,.19,toxin),cylinder(.23,.78,0,.22,.32,.22,toxin),box(0,1.08,0,.43,.06,.07,metal)],
 marker:[box(0,0,0,.85,.13,.65),box(0,.13,0,.65,.12,.5),box(0,.25,0,.4,.9,.28,dark),box(0,1.15,0,.56,.13,.4),...[-.12,0,.12].map((x,i)=>box(x,.6+i*.08,-.153,.045,.3,.03,toxin))]
};
P.validate=function(props,plane){if(props===undefined)return;if(!Array.isArray(props)||props.length>64)throw Error('Neplatné složené rekvizity');const cells=new Set();for(const p of props){if(!p||!Object.hasOwn(P.recipes,p.kind)||Object.keys(p).some(k=>!['kind','x','z','w','h','d'].includes(k))||!Number.isInteger(p.x)||!Number.isInteger(p.z)||p.x<0||p.x>11||p.z<0||p.z>9||![p.w,p.h,p.d].every(v=>Number.isFinite(v)&&v>0&&v<=1)||cells.has(p.z*12+p.x)||!plane.blocked.includes(p.z*12+p.x))throw Error('Rekvizita musí mít platný tvar, rozměr a vlastní blokované pole');cells.add(p.z*12+p.x)}};
P.mesh=function(p){const out=[],add=(a,b,c,color)=>{const A=b.map((v,i)=>v-a[i]),B=c.map((v,i)=>v-a[i]),n=[A[1]*B[2]-A[2]*B[1],A[2]*B[0]-A[0]*B[2],A[0]*B[1]-A[1]*B[0]],l=Math.hypot(...n)||1;out.push({p:[a,b,c].map(v=>[p.x-5.5+v[0]*p.w,v[1]*p.h,p.z-4.5+v[2]*p.d]),n:(()=>{const N=n.map((v,i)=>v/[p.w,p.h,p.d][i]),L=Math.hypot(...N)||1;return N.map(v=>v/L)})(),color})};
for(const s of P.recipes[p.kind]||[]){const {x,y,z,w,h,d,color}=s;if(s.shape==='cylinder'){for(let i=0;i<s.n;i++){const a=i/s.n*Math.PI*2,b=(i+1)/s.n*Math.PI*2,A=[x+Math.cos(a)*w/2,y,z+Math.sin(a)*d/2],B=[x+Math.cos(b)*w/2,y,z+Math.sin(b)*d/2],C=[B[0],y+h,B[2]],D=[A[0],y+h,A[2]];add(A,C,B,color);add(A,D,C,color);add([x,y+h,z],C,D,color);add([x,y,z],A,B,color)}}else{const c=[[-1,0,-1],[1,0,-1],[1,1,-1],[-1,1,-1],[-1,0,1],[1,0,1],[1,1,1],[-1,1,1]].map(([a,b,c])=>[x+a*w/2,y+b*h,z+c*d/2]);for(const [a,b,c1,d1]of[[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]){add(c[a],c[b],c[c1],color);add(c[a],c[c1],c[d1],color)}}}return out};
})(Game.Scene.Props);
