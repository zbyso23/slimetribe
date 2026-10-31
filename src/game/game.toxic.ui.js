(function(T,P){
T.playTest=function(){Game.Adventure.Editor.start(T.map());P.clear();P.player=true;P.menu=false;P.help=false;P.panel=null;G.paused=false;pauseSound(false);tab='Hra';syncGameView(true);syncSavedGame();show();P.refresh(true);return true};
T.edit=function(){editorReset(T.map());tab='Adventure';show()};
const goal=P.goal;P.goal=function(){if(gameData.adventure.world.mapId!=='unknown_cistern')return goal();return{title:'Neznámí u cisterny',text:gameData.campaign.scenario.objective,target:gameData.adventure.encounters[0].resolved?'sediment':'unknown_collectors'}};
const name=P.objectName;P.objectName=function(o){if(gameData.adventure.world.mapId==='unknown_cistern')return({unknown_collectors:'Oslovit neznámé',sediment:'Prohlédnout usazeniny',camp:'Čistý pramen'})[o?.id]||name(o);return name(o)};
const panel=editorPanel;editorPanel=function(){panel();if(tab!=='Adventure')return;const prop=adventureDraft.props?.find(p=>p.x===advSelected.x&&p.z===advSelected.y);if(prop)pn.innerHTML+='<div class="studio-card"><b>Složený objekt · '+xml(prop.kind)+'</b><p>'+Game.Scene.Props.recipes[prop.kind].length+' primitiv → jedna geometrie · '+Game.Scene.Props.mesh(prop).length+' trojúhelníků. Celé kamenné rekvizity se kreslí společně. Odstranění: nástroj Smazat objekt.</p></div>'};
const before=show;show=function(){before();if(!P.player&&tab==='Adventure')pn.innerHTML='<div class="studio-card"><b>Neznámí u cisterny · test</b><p>Adventure průzkum → rozhovor přes E → otrava → neznámé znamení. Tři složené rekvizity v jednom materiálovém batchi.</p><button data-toxic="play">Hrát setkání</button> <button data-toxic="edit">Načíst mapu do editoru</button></div>'+pn.innerHTML};
pn.addEventListener('click',e=>{if(e.target.dataset.toxic==='play')T.playTest();if(e.target.dataset.toxic==='edit')T.edit()});
SlimeTribe.toxic=T;SlimeTribe.version='0.12.2';
})(Game.Toxic,Game.Player);
