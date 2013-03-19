Game.Battle = {};
Game.Battle = {
    generateWorld: function() {
	if( gameDataImages.loadedRemain == 0 ) {
	    if( gameData.battle.world.first === true ) {
		//Game.Scene.Graphics.addBattleGround();
		Game.Scene.Graphics.addBattleAmbient();
		Game.Battle.Sounds.preloader();
	    }
	    Game.Grid.generateCharacters( heroes.left, true, 3.14 );
	    Game.Grid.generateCharacters( heroes.right, false, 0, gameData.battle.plane.gridWidth - 1 );
	    if( gameData.battle.world.first === true ) Game.Grid.generateMap();
	    gameData.battle.world.first = false;
	    gameData.battle.world.ready = true;
	}
    },
    healing: function( attacker, defender ) {
	var healing = Game.Battle.calcHealing( gameData.battle.selection.hero.monsters[attacker.x][attacker.y], gameData.battle.selection.hero.monsters[defender.x][defender.y] );
	gameData.battle.selection.hero.monsters[defender.x][defender.y].healthRemain += healing.health;
	gameData.battle.selection.hero.monsters[attacker.x][attacker.y].manaRemain -= healing.health;
	gameData.battle.selection.hero.monsters[attacker.x][attacker.y].speedRemain = 0;
	var settings = { x: attacker.x, y: attacker.y, xT: parseInt( defender.x ), yT: parseInt( defender.y ), grid: gameData.battle.selection.hero.grid, enemyGrid: gameData.battle.selection.enemyHero.grid, withAttack: false, withHealing: true, withDeath: false, damage: 0, heal: healing.health, nearAttack: false, withSpell: false };
	Game.Battle.Animation.animate( settings );
    },
    spell: function( attacker, defender ) {
	var spell = Game.Battle.calcSpell( gameData.battle.selection.hero.monsters[attacker.x][attacker.y], gameData.battle.selection.enemyHero.monsters[defender.x][defender.y] );
	var settings = { x: attacker.x, y: attacker.y, xT: parseInt( defender.x ), yT: parseInt( defender.y ), grid: gameData.battle.selection.hero.grid, enemyGrid: gameData.battle.selection.enemyHero.grid, withAttack: false,  withSpell: true, withHealing: false, withDeath: spell.death, damage: spell.damage, spell: spellsList[ gameData.battle.selection.hero.monsters[attacker.x][attacker.y].stats.activeSpell ], nearAttack: true, withSpell: true };
	gameData.battle.selection.enemyHero.monsters[defender.x][defender.y].healthRemain -= spell.damage;
	gameData.battle.selection.enemyHero.monsters[defender.x][defender.y].healthRemain = ( gameData.battle.selection.enemyHero.monsters[defender.x][defender.y].healthRemain < 0 ) ? 0 : gameData.battle.selection.enemyHero.monsters[defender.x][defender.y].healthRemain;
	gameData.battle.selection.hero.monsters[attacker.x][attacker.y].manaRemain -= spellsList[ gameData.battle.selection.hero.monsters[attacker.x][attacker.y].stats.activeSpell ].manaCost;
	gameData.battle.selection.hero.monsters[attacker.x][attacker.y].manaRemain = ( gameData.battle.selection.hero.monsters[attacker.x][attacker.y].manaRemain < 0 ) ? 0 : gameData.battle.selection.hero.monsters[attacker.x][attacker.y].manaRemain;
	gameData.battle.selection.hero.monsters[attacker.x][attacker.y].speedRemain = 0;
	Game.Battle.Animation.animate( settings );
    },
    calcAttack: function( attacker, defender ) {
	var calc;
	try {
	    if( typeof attacker === "undefined" || typeof defender === "undefined" ) return false;
	    var attackerStats = attacker.stats;
	    var defenderStats = defender.stats;
	    var a = Math.round( ( attackerStats.attack + Math.random() * 0.5 ) * 5 );
	    var d = Math.round( ( defenderStats.defense + Math.random() * 0.5 ) * 3 );
	    if( a > d ) {
		var damage = Math.round( ( a - d ) * 1.5 );
	    } else {
		var damage = 0;
	    }
	    if( ( defender.healthRemain - damage ) <= 0 ) {
		var death = true;
		defender.healthRemain = 0;
	    } else {
		var death = false;
	    }
	    calc = { 'damage': damage, 'death': death };
	    return calc;
	} catch( e ) {
	    
	}
	return false;
    },
    calcSpell: function( attacker, defender ) {
	var calc;
	try {
	    if( typeof attacker === "undefined" || typeof defender === "undefined" ) return false;
	    var attackerStats = attacker.stats;
	    var defenderStats = defender.stats;
	    var a = Math.round( ( ( spellsList[ attacker.stats.activeSpell ].damage * ( ( Math.log( attacker.stats.magic ) ) + Math.random() * 0.5 ) ) ) );
	    var d = Math.round( ( ( ( defenderStats.defense / 2 ) * defenderStats.magicDefense ) + ( Math.random() * 0.5 ) ) );
	    if( a > d ) {
		var damage = Math.round( ( a - d ) * 1.25 );
	    } else {
		var damage = 0;
	    }
	    var manaCost = spellsList[ attacker.stats.activeSpell ].manaCost;
	    if( ( defender.healthRemain - damage ) <= 0 ) {
		var death = true;
		defender.healthRemain = 0;
	    } else {
		var death = false;
	    }
	    calc = { 'damage': damage, 'manaCost': manaCost, 'death': death };
	    return calc;
	} catch( e ) {
	}
	return false;
    },
    calcHealing: function( healer, defender ) {
	var calc;
	try {
	    var healerStats = healer.stats;
	    var defenderStats = defender.stats;
	    var a = Math.round( ( ( defenderStats.defense / 2 ) * healerStats.magic + Math.random() * 0.5 ) * 3 );
	    if( ( defender.healthRemain + a ) > defenderStats.health ) {
		var health = defenderStats.health - defender.healthRemain;
	    } else {
		var health = a;
	    }
	    calc = { 'health': health };
	    return calc;
	} catch( e ) {
	}
	return false;
    },
    calcGameover: function( hero ) {
	var calc = { 'gameOver': true };
	try {
	    console.log('Look for gameover');
	    for( x in hero.grid ) {
		for( y in hero.grid[x] ) {
		    if( hero.grid[x][y] != 0 ) {
			calc.gameOver = false;
			break;
		    }
		}
	    }
	} catch( e ) {
	}
	return calc;
    },
    changeTurn: function() {
	try {
	    if( gameData.battle.selection.selected === true ) Game.Grid.unselect( { x: gameData.battle.selection.x, y: gameData.battle.selection.y } );
	    if( gameData.battle.selection.player == "right" ) gameData.battle.selection.turn++; 
	    gameData.battle.selection.player = ( gameData.battle.selection.player == "left" ) ? "right" : "left";
	    gameData.battle.selection.hero = ( gameData.battle.selection.player == "left" ) ? heroes.left : heroes.right;
	    gameData.battle.selection.enemyHero = ( gameData.battle.selection.player == "left" ) ? heroes.right : heroes.left;
	    for( x in heroes.left.monsters ) {
		for( y in heroes.left.monsters[x] ) {
		    if( typeof heroes.left.monsters[x][y] === "object" ) {
			heroes.left.monsters[x][y].speedRemain = heroes.left.monsters[x][y].stats.speed;
		    }
		    if( typeof heroes.right.monsters[x][y] === "object" ) {
			heroes.right.monsters[x][y].speedRemain = heroes.right.monsters[x][y].stats.speed;
		    }
		}
	    }
	    Game.Html.activePlayerGUI();
	} catch( e ) {
	    
	}
    },
    findNearAttackPath: function( from, cords ) {
	try {
	    from[0] = parseInt( from[0] );
	    from[1] = parseInt( from[1] );
	    cords[0] = parseInt( cords[0] );
	    cords[1] = parseInt( cords[1] );
	    if( Game.Battle._findInGrid( { x: cords[0], y: cords[1], x2: from[0], y2: from[1] } ) === false ) throw "is so far";
	} catch( e ) {
	    return false;
	}
	return true;
    },
    _findInGrid: function( params ) {
	try {
	    if( params.y < 0 || params.x < 0 || params.x >= gameData.battle.plane.gridWidth || params.y >= gameData.battle.plane.gridHeight || params.y2 < 0 || params.x2 < 0 || params.x2 >= gameData.battle.plane.gridWidth || params.y2 >= gameData.battle.plane.gridHeight ) throw "out of grid";
	    var diffX = ( params.x > params.x2 ) ? Math.abs( params.x - params.x2 ) : Math.abs( params.x2 - params.x );
	    var diffY = ( params.y > params.y2 ) ? Math.abs( params.y - params.y2 ) : Math.abs( params.y2 - params.y );
	    if( diffY > 1 || diffX > 1 ) throw "is so far";
	} catch( e ) {
	    return false;
	}
	return true;
    },
    
    findNearAttackPathOld: function( from, cords ) {
	
	
	
	
	from[0] = parseInt( from[0] );
	from[1] = parseInt( from[1] );
	cords[0] = parseInt( cords[0] );
	cords[1] = parseInt( cords[1] );
	var paths = [];
	var nearAttack = false;
	for( var x = cords[0] - 1; ( x <= cords[0] + 1  && paths.length === 0 ); x++ ) {
	    for( var y = cords[0] - 1; ( y <= cords[0] + 1 && paths.length === 0 ); y++ ) {
		if( from[0] === x && from[1] === y ) {
		    nearAttack = true;
		    break;break;
		}
		if( y < 0 || x < 0 || x >= gameData.battle.plane.gridWidth || y >= gameData.battle.plane.gridHeight ) continue;
		var to = [x,y];
		var path = aStar(from, to, gameData.battle.plane.grid, gameData.battle.plane.gridWidth, gameData.battle.plane.gridHeight, true );
		if( path.length > 0 && gameData.battle.selection.hero.monsters[from[0]][from[1]].speedRemain >= ( path.length - 1 ) ) {
		    paths.push( path );
		}
	    }
	}
	if( ( Math.abs( from[0] - cords[0] ) < 2  && Math.abs( from[1] - cords[1] ) === 0 ) || ( Math.abs( from[1] - cords[1] ) < 2 && Math.abs( from[0] - cords[0] ) === 0 ) ) {
	    nearAttack = true;
	}
	if( paths.length > 0 || nearAttack ) {
	    gameData.battle.selection.attackCords = cords;
	    gameData.battle.selection.attack = true;
	} else {
	    gameData.battle.selection.attackCords = [];
	    gameData.battle.selection.attack = false;
	}
	return paths;
    }
};
