Game.Battle.Ai = {};
Game.Battle.Ai = {
    turnStep: function() {
	Game.Grid.clearGrid( BATTLE_GRID[ gameData.battle.selection.player ] );
	gameData.battle.gui.cords = [];
	var monsters = Game.Battle.Ai.anybodyHere();
	var success = false;
	success = Game.Battle.Ai.healers( monsters );
	success = ( success !== true ) ? Game.Battle.Ai.spells( monsters ) : success;
	success = ( success !== true ) ? Game.Battle.Ai.attack( monsters ) : success;
	success = ( success !== true ) ? Game.Battle.Ai.move( monsters ) : success;
	if( gameData.animation.run === false && ( success !== true || monsters.attack.length < 1 ) ) {
	    console.log( 'seru ti na to :)' );
	    torch.position.x -= 10000;
	    gameData.battle.selection.endTurn = true;
	    return;
	}

    },
    anybodyHere: function() {
	var spellName;
	var lowCostSpell = 0;
	var currentCost = 0;
	var character;
	var monsters = { 'healers': [], 'spells': [], 'attack': [], 'healing': [], 'enemy-spells': [], 'enemy-healers': [], 'enemy-attack': [], 'enemy-intruders': [] };
	var limit = [];
	if( gameData.battle.selection.player === "left" ) {
	    limit = [ 0, Math.round( gameData.battle.plane.gridWidth / 3 ) ];
	} else {
	    limit = [ Math.round( gameData.battle.plane.gridWidth - ( gameData.battle.plane.gridWidth / 3 ) ), gameData.battle.plane.gridWidth ];
	}
	//Trace battle grid
	for( x in gameData.battle.selection.hero.monsters ) {
	    for( y in gameData.battle.selection.hero.monsters[x] ) {
		//Enemy monsters
		if( gameData.battle.selection.enemyHero.monsters[x][y] !== 0 ) {
		    character = gameData.battle.selection.enemyHero.monsters[x][y];
		    character['cords'] = [ x, y ];
		    monsters['enemy-attack'].push( character );
		    //Enemy Intruders
		    if( x >= limit[0] && x <= limit[1] ) monsters['enemy-intruders'].push( character );
		    //Enemy Healer
		    if( gameData.battle.selection.enemyHero.monsters[x][y].stats.healing === true && gameData.battle.selection.enemyHero.monsters[x][y].manaRemain >= gameData.battle.selection.enemyHero.monsters[x][y].stats.magic ) monsters['enemy-healers'].push( character );
		    for( spell in gameData.battle.selection.enemyHero.monsters[x][y].stats.spellsList ) {
			spellName = gameData.battle.selection.enemyHero.monsters[x][y].stats.spellsList[ spell ];
			currentCost = spellsList[spellName].manaCost * gameData.battle.selection.enemyHero.monsters[x][y].stats.magic;
			lowCostSpell = ( currentCost < lowCostSpell ) ? currentCost : lowCostSpell;
		    }
		    //Enemy Magican
		    if( gameData.battle.selection.enemyHero.monsters[x][y].stats.spell === true && gameData.battle.selection.enemyHero.monsters[x][y].manaRemain >= lowCostSpell ) monsters['enemy-spells'].push( character );
		}

		//Nothing or friendly have no speed
		if( gameData.battle.selection.hero.monsters[x][y] === 0 || gameData.battle.selection.hero.monsters[x][y].speedRemain < 1 ) continue;
		//Friendly monsters
		character = gameData.battle.selection.hero.monsters[x][y];
		character['cords'] = [ x, y ];

		if( gameData.battle.selection.hero.monsters[x][y].stats.healing === true && gameData.battle.selection.hero.monsters[x][y].manaRemain >= gameData.battle.selection.hero.monsters[x][y].stats.magic ) monsters.healers.push( character );
		lowCostSpell = 0;
		currentCost = 0;
		for( spell in gameData.battle.selection.hero.monsters[x][y].stats.spellsList ) {
		    spellName = gameData.battle.selection.hero.monsters[x][y].stats.spellsList[ spell ];
		    currentCost = spellsList[spellName].manaCost * gameData.battle.selection.hero.monsters[x][y].stats.magic;
		    lowCostSpell = ( currentCost < lowCostSpell ) ? currentCost : lowCostSpell;
		}
		//Friendly magican with mana
		if( gameData.battle.selection.hero.monsters[x][y].stats.spell === true && gameData.battle.selection.hero.monsters[x][y].manaRemain >= lowCostSpell ) monsters.spells.push( character )
		//Friendly healer with mana
		if( gameData.battle.selection.hero.monsters[x][y].stats.healing === true ) monsters.healing.push( character );
		if( gameData.battle.selection.hero.monsters[x][y].stats.healing === false || gameData.battle.selection.turn > 1 ) monsters.attack.push( character );
	    }
	}
	return monsters;
    },
    
    healers: function( monsters ) {
	try {
	    //No healers or nobody to heal
	    if( monsters['healing'].length < 1 || monsters['healers'].length < 1 ) throw "nobody to heal";
	    //Find healer
	    monsters['healers'].sort( function( a, b ){ return a['manaRemain'] - b['manaRemain'] } );
	    //Find best friend for him:)
	    monsters['healing'].sort( function( a, b ){ return a['healthRemain'] - b['healthRemain'] } );
	    var healing = Game.Battle.calcHealing( monsters['healers'][0], monsters['healing'][0] );
console.log( 'healing', healing );
console.log( 'monsters', monsters );
	    var cords1 = monsters['healers'][0]['cords'];
	    var cords2 = monsters['healing'][0]['cords'];
	    var settings = { 'x': cords1[0], 'y': cords1[1], 'xT': cords2[0], 'yT': cords2[1], 'grid': gameData.battle.selection.hero.grid, 'enemyGrid': gameData.battle.selection.hero.grid, 'withAttack': false, 'withHealing': true, 'withDeath': false, 'damage': 0, 'heal': healing.health, 'nearAttack': false, 'withSpell': false };
	    gameData.battle.selection.path = [];
	    gameData.battle.selection.selected = true;
	    gameData.battle.selection.x = cords1[0];
	    gameData.battle.selection.y = cords1[1];
	    gameData.battle.gui.cords = cords2;
	    torch.position.x = monstersModels[gameData.battle.selection.x][gameData.battle.selection.y].root.position.x;
	    torch.position.z = monstersModels[gameData.battle.selection.x][gameData.battle.selection.y].root.position.z;
	    //monsters['healing'][0].healthRemain += healing.health;
	    //monsters['healers'][0].manaRemain = ( monsters['healers'][0].manaRemain <= healing.health ) ? monsters['healers'][0].manaRemain - healing.health : 0;
	    monsters['healers'][0].speedRemain = 0;
	    Game.Battle.Animation.animate( settings );
	console.log( 'settings', settings );
	} catch ( e ) {
	    //Noheal action?
            return false;
	}
	return true;
    },
    
    spells: function( monsters ) {
        try {
            var enemy = false;
            //If no magican:( go away
            if( monsters['spells'].length < 1 ) throw "no more magican";
            //Find magican with many mana!
            var attacker = Game.Battle.Ai.findBest( monsters['spells'], BATTLE_AI[ gameData.battle.selection.hero.level ].findBestManaFormula );

            var lowCostSpell = 0;
            var lowCostSpellName = '';
            var highCostSpell = 0;
            var highCostSpellName = '';
            var currentCost = 0;
            var spellName;
            var init = true;
            for( spell in attacker.stats.spellsList ) {
                spellName = attacker.stats.spellsList[ spell ];
                currentCost = spellsList[spellName].manaCost;
                if( attacker.manaRemain < currentCost ) continue;
                if( init ) {
                    init = false;
                    lowCostSpell = highCostSpell = currentCost;
                    lowCostSpellName = highCostSpellName = spellName;
                    continue;
                }
                if( currentCost < lowCostSpell ) {
                    lowCostSpell = currentCost;
                    lowCostSpellName = spellName;
                } else if( currentCost > highCostSpell ) {
                    highCostSpell = currentCost;
                    highCostSpellName = spellName;
                }
            }

            if( lowCostSpell === 0 ) throw "no spell";
            var isCaster = ( attacker.stats.attack < attacker.stats.magic ) ? true : false;
            var homelandDefend = ( isCaster === false && monsters['enemy-intruders'].length > 0 ) ? true : false;
            if( monsters['enemy-intruders'].length > 0 && isCaster === true ) {
                enemy = Game.Battle.Ai.findBest( monsters['enemy-intruders'], BATTLE_AI[ gameData.battle.selection.hero.level ].findBestEnemyIntruder );
            }
            if( enemy === false && monsters['enemy-spells'].length > 0 && homelandDefend === false ) {
                enemy = Game.Battle.Ai.findBest( monsters['enemy-spells'], BATTLE_AI[ gameData.battle.selection.hero.level ].findBestEnemyMagican );
            }
            if( enemy === false && monsters['enemy-attack'].length > 0 && homelandDefend === false ) {
                enemy = Game.Battle.Ai.findBest( monsters['enemy-attack'], BATTLE_AI[ gameData.battle.selection.hero.level ].findBestEnemyAttack );
            }
            if( enemy === false && monsters['enemy-healers'].length > 0 && homelandDefend === false ) {
                enemy = Game.Battle.Ai.findBest( monsters['enemy-healers'], BATTLE_AI[ gameData.battle.selection.hero.level ].findBestEnemyHealer );
            }
            if( enemy === false ) throw "no enemy for magican";
            if( enemy.healthRemain <= lowCostSpell ) {
                attacker.stats.activeSpell = lowCostSpellName;
            } else if( highCostSpell > 0 ) {
                attacker.stats.activeSpell = highCostSpellName;
            }
            var spell = Game.Battle.calcSpell( attacker, enemy );
            var cords1 = attacker['cords'];
            var cords2 = enemy['cords'];
            var settings = { 'x': cords1[0], 'y': cords1[1], 'xT': cords2[0], 'yT': cords2[1], 'grid': gameData.battle.selection.hero.grid, 'enemyGrid': gameData.battle.selection.enemyHero.grid, 'withAttack': false,  'withSpell': true, 'withHealing': false, 'withDeath': spell.death, 'damage': spell.damage, 'spell': spellsList[ monsters['spells'][0].stats.activeSpell ], 'nearAttack': true };
            Game.Grid.select( { x: cords1[0], y: cords1[1] } );
	    gameData.battle.selection.selected = true;
	    gameData.battle.selection.x = cords1[0];
	    gameData.battle.selection.y = cords1[1];
	    gameData.battle.gui.cords = cords2;
            enemy.healthRemain = ( enemy.healthRemain >= spell.damage ) ? enemy.healthRemain - spell.damage : 0;
            attacker.manaRemain = ( spellsList[ gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].stats.activeSpell ].manaCost <= attacker.manaRemain ) ? attacker.manaRemain - spellsList[ gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].stats.activeSpell ].manaCost : 0;
            attacker.speedRemain = 0;
            Game.Battle.Animation.animate( settings );
        } catch ( e ) {
            //Mo magic action?
            return false;
        }
        return true;
    },
    
    attack: function( monsters ) {
	try {
	    if( monsters['attack'].length < 1 ) throw "no attacker here";
	    var paths;
	    var enemy = false;
	    var move = [];
	    var attacker = Game.Battle.Ai.findBest( monsters['attack'], BATTLE_AI[ gameData.battle.selection.hero.level ].findBestAttack );
	    enemy = false;
    	    if( monsters['enemy-intruders'].length > 0 && ( attacker.stats.healing === false || ( attacker.stats.healing === true && attacker.manaRemain < 5 ) ) ) {
		enemy = Game.Battle.Ai.findBest( monsters['enemy-intruders'], BATTLE_AI[ gameData.battle.selection.hero.level ].findBestEnemyIntruder, attacker );
	    }
	    if( enemy === false && monsters['enemy-spells'].length > 0 ) {
		enemy = Game.Battle.Ai.findBest( monsters['enemy-spells'], BATTLE_AI[ gameData.battle.selection.hero.level ].findBestEnemyMagican, attacker );
	    }
	    if( enemy === false && monsters['enemy-healers'].length > 0 ) {
		enemy = Game.Battle.Ai.findBest( monsters['enemy-healers'], BATTLE_AI[ gameData.battle.selection.hero.level ].findBestEnemyHealer, attacker );
	    }
	    if( enemy === false && monsters['enemy-attack'].length > 0 ) {
		enemy = Game.Battle.Ai.findBest( monsters['enemy-attack'], BATTLE_AI[ gameData.battle.selection.hero.level ].findBestEnemyAttack, attacker );
	    }
	    if( enemy === false ) throw "nobody to attack";
	    var cords1 = attacker['cords'];
	    var cords2 = enemy.monster['cords'];
            Game.Grid.select( { x: cords1[0], y: cords1[1] } );
	    Game.Grid.showGrid( BATTLE_GRID.enemy, { x: cords2[0], y: cords2[1] } );
	    gameData.battle.selection.path = ( enemy.path === true ) ? [] : enemy.path;
	    Game.Grid.showGridPath( BATTLE_GRID.enemy, gameData.battle.selection.path );
	    var xFrom = parseInt( gameData.battle.selection.x );
	    var yFrom = parseInt( gameData.battle.selection.y );
	    var monsterTarget = ( gameData.battle.selection.path.length > 0 ) ? gameData.battle.selection.path[ gameData.battle.selection.path.length - 1 ] : monsterTarget;
	    var attack = Game.Battle.calcAttack( attacker, enemy.monster );
	    var nearAttack = false;
	    if( enemy.path !== true && typeof monsterTarget !== "undefined" ) {
		//Nothing
	    } else {
		if( enemy.path === true ) nearAttack = true;
	    }
	    if( enemy.path === true || enemy.path.length > 0 ) {
		var settings = { 'x': cords1[0], 'y': cords1[1], 'xT': cords2[0], 'yT': cords2[1], 'move': true, 'moveX': monsterTarget.x, 'moveY': monsterTarget.y, 'grid': gameData.battle.selection.hero.grid, 'enemyGrid': gameData.battle.selection.enemyHero.grid, 'withAttack': true, 'withHealing': false, 'withDeath': attack.death, 'damage': attack.damage, 'nearAttack': nearAttack, 'withSpell': false };
		gameData.battle.gui.cords = cords2;
		attacker.speedRemain = 0;
		gameData.battle.selection.movePath = Game.Battle.Animation.monsterCordsPath();
		Game.Battle.Animation.animate( settings );
		return true;
	    }
	} catch ( e ) {
	    //No attack action?
	}
	return false;
    },
    move: function( monsters ) {
	try {
	    if( monsters['attack'].length < 1 ) throw "no attack";
	    var enemy = false;
	    var attacker;
	    var attacker = monsters['attack'][0];
	    if( monsters['enemy-healers'].length > 0 ) {
		enemy = Game.Battle.Ai.findBest( monsters['enemy-healers'], BATTLE_AI[ gameData.battle.selection.hero.level ].findBestEnemyHealer, attacker, true );
	    }
	    if( enemy === false && monsters['enemy-spells'].length > 0 ) {
		enemy = Game.Battle.Ai.findBest( monsters['enemy-spells'], BATTLE_AI[ gameData.battle.selection.hero.level ].findBestEnemyMagican, attacker, true );
	    }
	    if( enemy === false && monsters['enemy-attack'].length > 0 ) {
		enemy = Game.Battle.Ai.findBest( monsters['enemy-attack'], BATTLE_AI[ gameData.battle.selection.hero.level ].findBestEnemyAttack, attacker, true );
	    }

	    if( enemy === false ) throw "nobody to attack";
	    var cords1 = attacker['cords'];
	    var whereMove = enemy.path[ enemy.path.length - 1 ];
	    gameData.battle.selection.selected = true;
	    gameData.battle.selection.x = cords1[0];
	    gameData.battle.selection.y = cords1[1];
	    gameData.battle.selection.path = enemy.path;
	    Game.Grid.showGrid( BATTLE_GRID.free, { x: cords1[0], y: cords1[1] } );
	    Game.Grid.showGridPath( BATTLE_GRID.free, gameData.battle.selection.path );
	    torch.position.x = monstersModels[gameData.battle.selection.x][gameData.battle.selection.y].root.position.x;
	    torch.position.z = monstersModels[gameData.battle.selection.x][gameData.battle.selection.y].root.position.z;
	    var settings = { 'x': cords1[0], 'y': cords1[1], 'xT': whereMove.x, 'yT': whereMove.y, 'move': true, 'moveX': whereMove.x, 'moveY': whereMove.y, 'grid': gameData.battle.selection.hero.grid, 'enemyGrid': gameData.battle.selection.enemyHero.grid, 'withAttack': false, 'withHealing': false, 'withDeath': false, 'damage': 0, 'nearAttack': false, 'withSpell': false };
	    attacker.speedRemain = 0;
	    gameData.battle.selection.movePath = Game.Battle.Animation.monsterCordsPath();
	    Game.Battle.Animation.animate( settings );
	    return true;
	} catch ( e ) {

	}
	return false;
    },
    findBest: function( monsters, formula, attacker, divided ) {
	monsters.sort( formula );
	return ( typeof attacker === "undefined" ) ? monsters[0] : Game.Battle.Ai.findBestAttackPath( monsters, attacker, divided );
    },
    findBestAttackPath: function( monsters, attacker, divided ) {
	var enemy = false;
	for( j in monsters ) {
	    var path = Game.Battle.Ai.findNearEmpty( attacker['cords'], monsters[j]['cords'], divided );
	    if( path.length > 0 && path.length < ( attacker.speedRemain + 1 ) ) {
		enemy = monsters[j];
		break;
	    }
	}
	return ( enemy === false ) ? false : { monster: enemy, path: path };
    },
    findNearEmpty: function( from, to, divided ) {
	divided = ( typeof divided === "undefined" ) ? false : true;
	from[0] = parseInt( from[0] );
	from[1] = parseInt( from[1] );
	to[0] = parseInt( to[0] );
	to[1] = parseInt( to[1] );

	var x, y;
	var tempTo;
	var paths = [];
	var x1 = ( ( to[0] - 1 ) >= 0 ) ? to[0] - 1 : 0;
	var x2 = ( ( to[0] + 1 ) < ( gameData.battle.plane.gridWidth - 1 ) ) ? ( to[0] + 1 ) : ( gameData.battle.plane.gridWidth - 1 );
	var y1 = ( ( to[1] - 1 ) >= 0 ) ? to[1] - 1 : 0;
	var y2 = ( ( to[1] + 1 ) < ( gameData.battle.plane.gridHeight - 1 ) ) ? ( to[1] + 1 ) : ( gameData.battle.plane.gridHeight - 1 );
	for( x = x1; x <= x2; x++ ) {
	    for( y = y1; y <= y2; y++ ) {
		if( gameData.battle.plane.grid[x][y] !== 0 ) continue;
		if( x == from[0] && y == from[1] ) return true;
		tempTo = [ x, y ];
		var path = aStar( from, tempTo, gameData.battle.plane.grid, gameData.battle.plane.gridWidth, gameData.battle.plane.gridHeight, true );
		if( path.length > 0 && ( gameData.battle.selection.hero.monsters[from[0]][from[1]].speedRemain >= path.length || divided === true ) ) {
		    if( divided === true && gameData.battle.selection.hero.monsters[from[0]][from[1]].speedRemain < path.length ) {
			var dividedCount = gameData.battle.selection.hero.monsters[from[0]][from[1]].speedRemain;
			var newPath = [];
			for( i in path ) {
			    newPath.push( path[i] );
			    --dividedCount;
			    if( dividedCount === 0 ) {
				break;
			    }
			}
			paths.push( newPath );
		    } else {
			paths.push( path );
		    }
		}
	    }
	}
	if( paths.length > 0 ) {
	    paths.sort( function( a, b ){ return ( a.length ) - ( b.length ) } );
	    return paths[0];
	}
	return [];
    }
};
