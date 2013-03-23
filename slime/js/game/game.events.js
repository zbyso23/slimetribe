//TODO! Refactor
Game.Events = {};
Game.Events = {
    windowResize: false,
    keyUp: false,
    keyDown: false,
    mouseDown: false,
    mouseMove: false,
    
    onWindowResize: function( event ) {
	if( Game.Events.windowResize === true ) return;
	Game.Events.windowResize = true;
	SCREEN_WIDTH = window.innerWidth;
	SCREEN_HEIGHT = window.innerHeight;
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
	camera.aspect = SCREEN_WIDTH/ SCREEN_HEIGHT;
	camera.updateProjectionMatrix();
	Game.Events.windowResize = false;
    },


    onKeyDown: function( event ) {
	if( Game.Events.keyDown === true ) return;
	Game.Events.keyDown = true;
	var kc = event.keyCode;
	console.log( 'key', kc );
	switch( kc ) {
		case playerKeys.UP: controls.moveForward = true; break;
		case playerKeys.DOWN: controls.moveBackward = true; break;
		case playerKeys.LEFT: controls.moveLeft = true; break;
		case playerKeys.RIGHT: controls.moveRight = true; break;
		case playerKeys.HOME: Game.calibrateAnimationSpeed(); break;
		case playerKeys.NUM0: animSpeed = animSpeed - 5; break;
		case playerKeys.NUM1: animSpeed = animSpeed + 5; break;
		case playerKeys.ALT: controls.crouch = true; break;
		case playerKeys.SPACE: controls.jump = true; break;
		case playerKeys.CTRL: controls.attack = true; break;
	}
	if( kc > KEYS.F4 || kc <= KEYS.F12 ) {
	} else {
	    event.preventDefault();
	}
	Game.Events.keyDown = false;
    },

    onKeyUp: function( event ) {
	event.preventDefault();
	if( Game.Events.keyUp === true ) return;
	Game.Events.keyUp = true;
	var kc = event.keyCode;
	var spellChange = false;
	var spellAttack = false;

	switch( kc ) {
		case playerKeys.UP: controls.moveForward = false; break;
		case playerKeys.DOWN: controls.moveBackward = false; break;
		case playerKeys.LEFT: controls.moveLeft = false; break;
		case playerKeys.RIGHT: controls.moveRight = false; break;

		case playerKeys.ALT: controls.crouch = false; break;
		case playerKeys.SPACE: controls.jump = false; break;
		case playerKeys.CTRL: controls.attack = false; break;
		case playerKeys.F2: gameData.battle.selection.endTurn = ( heroes[ gameData.battle.selection.player ].ai === false ) ? true : false; break;
		case playerKeys.F4: gameData.battle.world.reset = ( gameData.gameOver === true ) ? true : false; break;
		case playerKeys.SHIFT: spellChange = ( gameData.battle.selection.selected === true ) ? true : false; break;
		case playerKeys.ENTER: spellAttack = ( gameData.battle.selection.selected === true ) ? true : false; break;
	}
	if( kc > KEYS.F4 || kc <= KEYS.F12 ) {
	} else {

	}

	if( spellChange === true || spellAttack === true ) {
	    var xFrom = parseInt( gameData.battle.selection.x );
	    var yFrom = parseInt( gameData.battle.selection.y );
	    var stats = gameData.battle.selection.hero.monsters[xFrom][yFrom].stats;
	    if( stats.spell === true ) {
		if( spellAttack === true ) {
		    stats.magicAttack = ( stats.magicAttack === true ) ? false : true;
		} else {
		    var next = false;
		    if( stats.spellsList.length > 1 ) {
			for( var i in stats.spellsList ) {
			    if( stats.activeSpell === stats.spellsList[i] ) {
				var next = true;
				continue;
			    }
			    if( next === true ) {
				stats.activeSpell = stats.spellsList[i];
				next = false;
			    }
			}
			if( next === true ) stats.activeSpell = stats.spellsList[0];
		    }
		}
		gameData.battle.gui.cords = [ xFrom, yFrom ];
	    }
	}
	Game.Events.keyUp = false;
    },
    

    onDocumentMouseMove: function( event ) {
	if( heroes[ gameData.battle.selection.player ].ai === true ) return false;
	if( Game.Events.mouseMove === true ) {
	    Game.Events.mouseMove = ( Game.Events.mouseDown === true ) ? false : true;
	    return;
	}
	Game.Events.mouseMove = true;
        Game.Events.onMouseMoveEvent( event );
	Game.Events.mouseMove = false;
    },
    onMouseMoveEvent: function( event ) {
	try {
	    mouse2D.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	    mouse2D.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	    
	    //console.log( 'mouse', mouse2D );
	    
	    var cords = Game.Grid.casting();
	    if( !cords ) throw "nogrid";
	    gameData.battle.gui.cords = cords;
	    if( gameData.animation.run === true ) throw "animation";
	    Game.Grid.clearGrid( BATTLE_GRID.none );
	    //Is selected friendly
	    showPath = false;
	    if( gameData.battle.selection.selected === false ) {
		//Is nothing on this place?
		if( gameData.battle.selection.enemyHero.monsters[cords[0]][cords[1]] === 0 && gameData.battle.selection.hero.monsters[cords[0]][cords[1]] === 0 ) {
		    Game.Grid.showGrid( BATTLE_GRID.neutral, { x: cords[0], y: cords[1] } );
		    throw "noselected";
		}
		Game.Grid.showPlayer( { x: cords[0], y: cords[1] } );
		throw "selected";
	    }
	    
	    if( gameData.battle.selection.selected === true ) {
		var params = ( gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].speedRemain === 0 ) ? BATTLE_GRID.noMove : BATTLE_GRID.free;
		Game.Grid.showGrid( params, { x: gameData.battle.selection.x, y: gameData.battle.selection.y } );
		if( gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].speedRemain === 0 ) throw "nospeed";

		var from = [ gameData.battle.selection.x, gameData.battle.selection.y ];
		var to = [ cords[0], cords[1] ];
		
		//Neutral - move over map
		if( gameData.battle.selection.enemyHero.monsters[cords[0]][cords[1]] === 0 && gameData.battle.selection.hero.monsters[cords[0]][cords[1]] === 0 ) {
		    gameData.battle.selection.path = [];
		    gameData.battle.selection.path = aStar( from, to, gameData.battle.plane.grid, gameData.battle.plane.gridWidth, gameData.battle.plane.gridHeight, true );
		    gameData.battle.selection.movePath = [];
		    if( gameData.battle.selection.path.length <= ( gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].speedRemain + 1 ) ) {
			Game.Grid.showGridPath( BATTLE_GRID.free, gameData.battle.selection.path );
			gameData.battle.selection.movePath = Game.Battle.Animation.monsterCordsPath();
		    }
		//Friendly Action
		} else if( gameData.battle.selection.hero.grid[cords[0]][cords[1]] !== 0 ) {
		    if( gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].stats.healing === true && gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].manaRemain > 0 && gameData.battle.selection.hero.monsters[cords[0]][cords[1]].healthRemain < gameData.battle.selection.hero.monsters[cords[0]][cords[1]].stats.health ) {
			Game.Grid.showGrid( BATTLE_GRID.healer, { x: gameData.battle.selection.x, y: gameData.battle.selection.y } );
			Game.Grid.showGrid( BATTLE_GRID.healing, { x: cords[0], y: cords[1] } );
		    }
		    throw "show";
		//Enemy Action
		} else if( gameData.battle.selection.enemyHero.grid[cords[0]][cords[1]] !== 0 ) {
		    //Spell
		    if( gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].stats.magicAttack === true ) {
			if( gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].manaRemain <= spellsList[ gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].stats.activeSpell ].manaCost ) throw "nomana";
			Game.Scene.Graphics.setGridCube( gridModels[gridModelsCords[cords[0]][cords[1]]].object, BATTLE_GRID.magic );
			Game.Scene.Graphics.setGridCube( gridModels[gridModelsCords[gameData.battle.selection.x][gameData.battle.selection.y]].object, BATTLE_GRID.magican );
		    }
		    //Attack
		    if( gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].stats.magicAttack === false ) {
			var from = [ parseInt( gameData.battle.selection.x ), parseInt( gameData.battle.selection.y ) ];
			var params = BATTLE_GRID.neutral;
			
			var nearAttack = ( Game.Battle.findNearAttackPath( from, cords ) === true ) ? true : false;
			var path = gameData.battle.selection.path;
			
			var isPathAttack = Game.Battle.findNearAttackPath( cords, [ path[path.length - 1].x, path[path.length - 1].y ] );
			var pathAttack = ( nearAttack === false && path.length > 1 && isPathAttack === true ) ? true : false;

			if( pathAttack || nearAttack ) {
			    gameData.battle.selection.attackCords = cords;
			    gameData.battle.selection.attack = true;
			} else {
			    gameData.battle.selection.attackCords = [];
			    gameData.battle.selection.attack = false;
			}

			
			//if( paths.length > 0 && gameData.battle.selection.attack === true ) gameData.battle.selection.path = paths[0];
			if( pathAttack && gameData.battle.selection.path.length < ( gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].speedRemain + 1 ) ) {
			    
			    //params = ( gameData.battle.selection.attack === false ) ? BATTLE_GRID.enemyFar : BATTLE_GRID.enemy;
			    //params = BATTLE_GRID.enemy;
			    Game.Grid.showGrid( params, { x: cords[0], y: cords[1] } );
			    //if( gameData.battle.selection.attack === false ) throw "enemyfar";
			    params = BATTLE_GRID.enemy;
			    Game.Grid.showGridPath( params, gameData.battle.selection.path );
			} else if( nearAttack ) {
			    gameData.battle.selection.path = [];
			    params = BATTLE_GRID.enemy;
			} else {
			    gameData.battle.selection.path = [];
			    var params = BATTLE_GRID.enemyFar;
			}
		    }
		    throw "show enemy";
		}
	    }
	    gameData.battle.gui.cords = cords;
	} catch ( e ) {
	    if( e !== "nogrid" && e !== "enemyfar" && e !== "animation" ) {
		Game.Grid.showPlayer( { x: cords[0], y: cords[1] } );
	    }
	}
    },
    onDocumentMouseDown: function( event ) {
	//event.preventDefault();
	if( Game.Events.mouseDown === true ) {
	    Game.Events.mouseDown = ( gameData.animation.run === true ) ? false : true;
	    return;
	}
	Game.Events.mouseDown = true;
	if( event.type == "mousedown" && event.button === 0 ) Game.Events.onDocumentMouseLeftEvent( event );
	if( event.type == "mousedown" && event.button === 2 ) Game.Events.onDocumentMouseRightEvent( event );
	Game.Events.mouseDown = false;
    },
    onDocumentMouseRightEvent: function( event ) {
	try {
	    if( gameData.battle.selection.selected === false ) throw "nobody to unselect";
	    Game.Grid.unselect( { x: gameData.battle.selection.x, y: gameData.battle.selection.y } );
	} catch( e ) {

	}
    },
    onDocumentMouseLeftEvent: function( event ) {
	try {
	    if( gameData.battle.world.ready === false ) return;
	    var cords = Game.Grid.casting();
	    if( !cords ) throw "nocasting";
	    //Check try to select
	    if( gameData.battle.selection.selected === false ) {
		if( gameData.battle.selection.hero.grid[cords[0]][cords[1]] === 0 ) throw "noselect";
		if( gameData.battle.selection.hero.monsters[cords[0]][cords[1]].speedRemain === 0 ) throw "nospeed";
		Game.Grid.select( { x: cords[0], y: cords[1] } );
		throw "action";
	    }

	    var xFrom = parseInt( gameData.battle.selection.x );
	    var yFrom = parseInt( gameData.battle.selection.y );
	    var from = [ xFrom, yFrom ];
	    var to = cords;
	    
	    //Click on empty - move / unselect
	    if( gameData.battle.selection.hero.grid[cords[0]][cords[1]] === 0 && gameData.battle.selection.enemyHero.grid[cords[0]][cords[1]] === 0 ) {
		if( gameData.battle.selection.path.length !== 0 && gameData.battle.selection.path.length <= ( gameData.battle.selection.hero.monsters[xFrom][yFrom].speedRemain + 1 ) ) {
		    gameData.battle.selection.hero.monsters[xFrom][yFrom].speedRemain = 0;
		    var settings = { x: xFrom, y: yFrom, xT: parseInt( cords[0] ), yT: parseInt( cords[1] ), move: true, moveX: parseInt( gameData.battle.selection.path[ gameData.battle.selection.path.length - 1 ].x ), moveY: parseInt( gameData.battle.selection.path[ gameData.battle.selection.path.length - 1 ].y ), grid: gameData.battle.selection.hero.grid, enemyGrid: gameData.battle.selection.enemyHero.grid, withAttack: false, nearAttack: false, withDeath: false, withHealing: false, damage: 0, withSpell: false };
		    Game.Battle.Animation.animate( settings );
		    throw "action";
		}
		throw "click on empty area with selected";
	    }

	    
	    if( gameData.battle.selection.hero.monsters[cords[0]][cords[1]] !== 0 && gameData.battle.selection.hero.monsters[cords[0]][cords[1]].stats.speedRemain === 0 ) throw "nospeed";
	    //Is no monster, unselect
	    if( gameData.battle.selection.hero.grid[cords[0]][cords[1]] === 0 && gameData.battle.selection.enemyHero.grid[cords[0]][cords[1]] === 0 ) throw "unselect";
	    //Unselect - try to select myself again
	    if( gameData.battle.selection.hero.grid[cords[0]][cords[1]] !== 0 && gameData.battle.selection.hero.monsters[cords[0]][cords[1]] === gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y] ) throw "unselect own";
	    //Healing
	    if( gameData.battle.selection.hero.grid[cords[0]][cords[1]] !== 0 && gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].stats.healing === true && gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].manaRemain > 0 && gameData.battle.selection.hero.monsters[cords[0]][cords[1]].healthRemain < gameData.battle.selection.hero.monsters[cords[0]][cords[1]].stats.health ) {
		Game.Battle.healing( { x: gameData.battle.selection.x, y: gameData.battle.selection.y }, { x: cords[0], y: cords[1] } );
		throw "action";
	    }
	    //Unselect - select other
	    if( gameData.battle.selection.hero.grid[cords[0]][cords[1]] !== 0 && gameData.battle.selection.hero.monsters[cords[0]][cords[1]] !== gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y] ) {
		Game.Grid.unselect( { x: gameData.battle.selection.x, y: gameData.battle.selection.y } );
		Game.Grid.select( { x: cords[0], y: cords[1] } );		
		throw "action";
	    }
	    //No speed selected - exit
	    if( gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].speedRemain === 0 ) throw "no way to attack";
	    //Enemy attack
	    if( gameData.battle.selection.enemyHero.grid[cords[0]][cords[1]] !== 0 ) {
		//Spell
		if( gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].stats.magicAttack === true ) {
		    if( gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].manaRemain < 1 || gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].manaRemain < spellsList[ gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].stats.activeSpell ].manaCost ) throw "no mana";
		    Game.Battle.spell( { x: gameData.battle.selection.x, y: gameData.battle.selection.y }, { x: cords[0], y: cords[1] } );
		    throw "action";
		}
		if( gameData.battle.selection.attack === false ) throw "unselectfarattack";
		//Attack
		var monsterTarget = gameData.battle.selection.path[ gameData.battle.selection.path.length - 1 ];
		var xFrom = parseInt( gameData.battle.selection.x );
		var yFrom = parseInt( gameData.battle.selection.y );
		var attack = Game.Battle.calcAttack( gameData.battle.selection.hero.monsters[xFrom][yFrom], gameData.battle.selection.enemyHero.monsters[cords[0]][cords[1]] );
		
		if( typeof monsterTarget !== "undefined" && gameData.battle.selection.path.length !== 0 && gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].speedRemain > ( gameData.battle.selection.path.length - 1 ) ) {
		    var settings = { x: gameData.battle.selection.x, y: gameData.battle.selection.y, xT: parseInt( cords[0] ), yT: parseInt( cords[1] ), move: true, moveX: parseInt( gameData.battle.selection.path[ gameData.battle.selection.path.length - 1 ].x ), moveY: parseInt( gameData.battle.selection.path[ gameData.battle.selection.path.length - 1 ].y ),  grid: gameData.battle.selection.hero.grid, enemyGrid: gameData.battle.selection.enemyHero.grid, withAttack: true, withHealing: false, withDeath: attack.death, damage: attack.damage, nearAttack: false, withSpell: false };
		} else {
		    if( Game.Battle.findInGrid( { x: cords[0], y: cords[1], x2: gameData.battle.selection.x, y2: gameData.battle.selection.y } ) === false ) throw "is so far";
		    var settings = { x: gameData.battle.selection.x, y: gameData.battle.selection.y, xT: parseInt( cords[0] ), yT: parseInt( cords[1] ), grid: gameData.battle.selection.hero.grid, enemyGrid: gameData.battle.selection.enemyHero.grid, withAttack: true, withHealing: false, withDeath: attack.death, damage: attack.damage, nearAttack: true, withSpell: false };
		}
		Game.Battle.Animation.animate( settings );
		//throw "action";
		//Game.Grid.select( { x: cords[0], y: cords[1] } );
		throw "action";
	    }
	} catch ( e ) {
	    if( e !== "action" && e !== "nocasting" && e !== "noselect" ) Game.Grid.unselect( { x: gameData.battle.selection.x, y: gameData.battle.selection.y } );
	}
	return;
    },
    
    initialize: function() {
	    window.addEventListener( 'resize', Game.Events.onWindowResize, false );
	    document.addEventListener( 'keydown', Game.Events.onKeyDown, false );
	    document.addEventListener( 'keyup', Game.Events.onKeyUp, false );
	    document.addEventListener( 'mousedown', Game.Events.onDocumentMouseDown, false );
	    document.addEventListener( 'contextmenu', Game.Events.onDocumentMouseDown, false );
	    document.addEventListener( 'mousemove', Game.Events.onDocumentMouseMove, false );
    }
};
