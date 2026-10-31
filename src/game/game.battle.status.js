/* Round-based status rules. RNG is saved, rendering never rolls combat dice. */
Game.Battle.Status={};
(function(S){
S.validate=function(u){const p=u.poison;if(p===undefined)return;if(!p||Object.keys(p).sort().join(',')!=='damage,turns'||!Number.isInteger(p.turns)||p.turns<1||p.turns>3||p.damage!==5)throw Error('Neplatná otrava');};
S.label=u=>u?.poison?'Jed · '+u.poison.turns+'×'+u.poison.damage+' HP':'';
S.cure=function(u){const poisoned=!!u.poison;delete u.poison;if(poisoned)Game.log(u.id+': jed odstraněn.');return poisoned};
S.tryPoison=function(u){const b=gameData.battle;if(!b||!Game.Utils.alive(u))return false;let x=(b.poisonRng??((b.seed^0x9e3779b9)>>>0))||1;x^=x<<13;x^=x>>>17;x^=x<<5;b.poisonRng=x>>>0;if(b.poisonRng/4294967296>=.4)return false;u.poison={turns:3,damage:5};Game.log(u.id+': otrava — 5 HP na začátku příštích 3 vlastních tahů. Léčení odstraní jed.');return true};
S.tick=function(team){const b=gameData.battle;for(const u of b.units){if(u.team!==team||!u.poison)continue;if(!Game.Utils.alive(u)){delete u.poison;continue}u.healthRemain=Math.max(0,u.healthRemain-u.poison.damage);u.poison.turns--;Game.log(u.id+': jed −5 HP'+(u.poison.turns?' · zbývá '+u.poison.turns:' · odezněl'));if(!u.poison.turns||!u.healthRemain)delete u.poison;}};
})(Game.Battle.Status);
