/* Read-only contextual battle intent. The existing rules execute and validate every action. */
Game.Battle.intent=function(x,y,ability=null){
 const b=gameData.battle,blocked=hint=>({kind:'blocked',hint});if(gameData.mode!=='battle'||!b)return blocked('Neprobíhá souboj.');
 const target=b.units.find(u=>u.x===x&&u.y===y&&Game.Utils.alive(u));
 if(target?.team==='allies'&&ability!=='healing')return{kind:'select',target:target.id,hint:'Vybrat: '+target.id};
 if(b.result)return blocked('Souboj je dokončen.');if(b.turn!=='allies')return blocked('Hraje protivník.');
 const u=Game.Utils.unit(b.selection.selected);if(!u||!Game.Battle.canAct(u.id))return blocked('Tato postava už jednala. Vyber jinou nebo ukonči tah.');
 if(!target){if(ability)return blocked('Vyber cíl schopnosti. Esc ji zruší.');const path=Game.Battle.Grid.findPath(u.id,x,y);if(!path?.length)return blocked('Tudy cesta nevede.');if(path.length>u.speedRemain)return blocked('Sem v tomto tahu nedojdeš.');return{kind:'move',actor:u.id,x,y,path,hint:'Přejít · '+path.length+' kroků'}}
 let kind,range;
 if(ability==='healing'){if(!u.stats.healing)return blocked('Tato postava neléčí.');if(target.team!=='allies'||target.healthRemain>=target.stats.health&&!target.poison)return blocked('Vyber zraněného nebo otráveného spojence.');if(u.manaRemain<u.stats.magic)return blocked('Na léčení chybí mana.');kind='healing';range=3}
 else{if(target.team==='allies')return{kind:'select',target:target.id,hint:'Vybrat: '+target.id};const spell=spellsList[u.stats.activeSpell];if(u.stats.spell&&spell&&u.manaRemain>=spell.manaCost){kind='spell';range=4}else if(u.model!=='magican'&&ability!=='spell'){kind='attack';range=1}else return blocked('Na kouzlo chybí mana.');if(ability==='spell'&&kind!=='spell')return blocked('Tato postava nemůže seslat kouzlo.')}
 const amount=kind==='attack'?Game.Battle.calcAttack(u,target).damage:kind==='spell'?Game.Battle.calcSpell(u,target).damage:Game.Battle.calcHealing(u,target).health,label=kind==='healing'?'Vyléčit':kind==='spell'?'Seslat kouzlo':'Zaútočit';
 if(Game.Utils.distance(u,target)<=range)return{kind,actor:u.id,target:target.id,amount,hint:label+' · '+amount+(kind==='healing'?' HP'+(target.poison?' · odstranit jed':''):' zranění'+(u.faction==='toxic'?' · 40 % otrava':''))};
 const paths=[];for(let yy=Math.max(0,target.y-range);yy<=Math.min(9,target.y+range);yy++)for(let xx=Math.max(0,target.x-range);xx<=Math.min(11,target.x+range);xx++){if(Math.abs(xx-target.x)+Math.abs(yy-target.y)>range)continue;const path=Game.Battle.Grid.findPath(u.id,xx,yy);if(path?.length)paths.push(path)}paths.sort((a,b)=>a.length-b.length||a.at(-1).y-b.at(-1).y||a.at(-1).x-b.at(-1).x);
 if(!paths.length)return blocked('K cíli nevede volná cesta.');if(u.speedRemain<=0)return blocked('Cíl je mimo dosah a nezbývá pohyb.');const path=paths[0],full=path.length<=u.speedRemain,step=path[Math.min(path.length,u.speedRemain)-1];return{kind:'approach',actor:u.id,target:target.id,x:step.x,y:step.y,path:path.slice(0,u.speedRemain),action:full?kind:null,amount,hint:full?'Dojít a '+label.toLowerCase()+' · '+amount:'Přiblížit se · útok až v dalším tahu'};
};
