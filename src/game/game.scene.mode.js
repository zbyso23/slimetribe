/* One document, live renderer selection. WebGL context stays on the original canvas. */
const diagnosticCanvas=isCanvas2D?cv:document.createElement('canvas');
if(!isCanvas2D){diagnosticCanvas.id='diagnostic-canvas';diagnosticCanvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:none';cw.append(diagnosticCanvas)}
const diagnosticCtx=isCanvas2D?ctx2:diagnosticCanvas.getContext('2d');
Game.Scene.Mode={get:()=>useCanvas2D?'2d':'3d',available3D:()=>!isCanvas2D,set(mode){if(!['2d','3d'].includes(mode))return false;if(mode==='3d'&&isCanvas2D)return false;useCanvas2D=mode==='2d';if(!isCanvas2D)diagnosticCanvas.style.display=useCanvas2D?'block':'none';document.documentElement.setAttribute('data-view',mode);const status=$('#status');if(status)status.style.display=useCanvas2D?'none':'';stageVP=null;Game.Scene.Fallback.drawIfNeeded();show();return true}};
Game.Scene.Fallback.drawIfNeeded=function(){if(useCanvas2D){diagnosticCanvas.width=cv.width;diagnosticCanvas.height=cv.height;Game.Scene.Fallback.draw(cv.width,cv.height)}};
const modeBeforeShow=show;show=function(){modeBeforeShow();const btn=document.createElement('button');btn.id='render-mode';btn.textContent=useCanvas2D?'2D · přepnout na 3D':'3D · přepnout na 2D';btn.disabled=isCanvas2D;btn.title=isCanvas2D?'WebGL není dostupné; aktivní automatický 2D fallback.':'Přepne pouze vykreslení, rozehraná hra i editor zůstanou zachované.';btn.addEventListener('click',()=>Game.Scene.Mode.set(useCanvas2D?'3d':'2d'));$('#nv').append(btn)};
SlimeTribe.renderMode=Game.Scene.Mode;
if(document.documentElement.getAttribute?.('data-view')==='2d')useCanvas2D=true;
if(!isCanvas2D)diagnosticCanvas.style.display=useCanvas2D?'block':'none';show();
