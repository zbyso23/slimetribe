/* Frame the battle inside the space left by the compact mobile HUD.
   Transform the camera matrix itself so drawing, world labels and picking agree. */
(function(P){
P.mobileBattleArea=function(w,h){return{left:8,top:44,width:Math.max(1,w-16),height:Math.max(80,h-190)}};
const camera=Game.Scene.Camera.getView;
Game.Scene.Camera.getView=function(w,h){const c=camera(w,h);if(!P.player||gameData.mode!=='battle'||Game.Cutscene.active()||useCanvas2D||w>720)return c;const a=P.mobileBattleArea(w,h),m=c.matrix,points=[];for(const x of [-6,6])for(const y of [0,2.5])for(const z of [-5,5]){const v=[0,1,2,3].map(r=>m[r]*x+m[r+4]*y+m[r+8]*z+m[r+12]);if(v[3]>.01)points.push([(v[0]/v[3]*.5+.5)*w,(.5-v[1]/v[3]*.5)*h])}if(points.length!==8)return c;const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),scale=Math.min(a.width/(maxX-minX),a.height/(maxY-minY)),cx=(minX+maxX)/2,cy=(minY+maxY)/2,dx=(a.left+a.width/2-w/2)*2/w-scale*(cx-w/2)*2/w,dy=(h/2-a.top-a.height/2)*2/h-scale*(h/2-cy)*2/h,out=Array.from(m);for(let col=0;col<4;col++){out[col*4]=m[col*4]*scale+m[col*4+3]*dx;out[col*4+1]=m[col*4+1]*scale+m[col*4+3]*dy}return{...c,matrix:out,mobileArea:a}};
SlimeTribe.version='0.12';
})(Game.Player);
