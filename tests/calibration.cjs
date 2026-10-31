const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/model-stage.js'),'utf8'),start=source.indexOf('const ModelCalibration='),end=source.indexOf('const factionRecipes=');let commits=0;const ctx={PRJ:{},SlimeModels:require(path.join(root,'src/model-core.js')),commit:()=>commits++,Math,Error};vm.createContext(ctx);vm.runInContext(source.slice(start,end)+';this.C=ModelCalibration;',ctx);const C=ctx.C;
const approx=(a,b)=>{assert.equal(a.length,b.length);a.forEach((x,i)=>assert(Math.abs(x-b[i])<1e-9,`${a} != ${b}`))};
for(const id of ctx.SlimeModels.families){approx(C.point(id,[1,2,3]),[1,2,3]);for(const yaw of [0,.5,Math.PI]){const p=[4,5,6],scale=.65,c=Math.cos(yaw),s=Math.sin(yaw);approx(C.matrix(id,p,yaw,scale),[c*scale,0,-s*scale,0,0,scale,0,0,s*scale,0,c*scale,0,...p,1])}}
console.log('PASS zero calibration preserves the exact legacy matrix for every family and heading');
for(const [value,input,want] of [[{x:90,y:0,z:0},[0,1,0],[0,0,1]],[{x:0,y:90,z:0},[1,0,0],[0,0,-1]],[{x:0,y:0,z:90},[1,0,0],[0,1,0]],[{x:90,y:90,z:90},[0,1,0],[0,1,0]]]){C.set('slizak',value);approx(C.point('slizak',input),want)}
console.log('PASS local X/Y/Z axes and combined XYZ order match independent geometric expectations');
C.set('slizak',{x:17,y:-81,z:43});const m=C.matrix('slizak',[3,2,1],.7,2);for(let i=0;i<3;i++){const a=m.slice(i*4,i*4+3);approx([Math.hypot(...a)],[2]);for(let j=0;j<i;j++){const b=m.slice(j*4,j*4+3);approx([a.reduce((s,x,k)=>s+x*b[k],0)],[0])}}approx(m.slice(12),[3,2,1,1]);
console.log('PASS calibrated basis remains orthogonal with preserved scale and translation');
const before=JSON.stringify(ctx.PRJ),n=commits;for(const v of [{x:Infinity,y:0,z:0},{x:0,y:NaN,z:0},{x:181,y:0,z:0},{x:0,y:0,z:-181},{x:0,y:0},{x:0,y:0,z:0,w:0}]){assert.throws(()=>C.set('slizak',v));assert.equal(JSON.stringify(ctx.PRJ),before);assert.equal(commits,n)}assert.throws(()=>C.set('human',{x:0,y:0,z:0}));C.validate(undefined);assert.throws(()=>C.validate([]));
console.log('PASS invalid calibration rejects atomically without history changes; old projects remain valid');
