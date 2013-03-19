Game.Battle.Animation = {};
Game.Battle.Animation = {
    animate: function( settings, delta ) {
	try {
	    if( typeof delta !== "undefined" && gameData.animation.run === true ) throw "action";
	    if( typeof settings !== "object" ) throw "settings not object";
	    var xFrom = parseInt( settings.x );
	    var yFrom = parseInt( settings.y );
	    var from = [ xFrom, yFrom ];
	    var to = [ settings.xT, settings.yT ];

	    if( gameData.battle.selection.path.length > 0 || settings.withAttack === true || settings.withHealing === true || settings.withSpell === true ) {
		gameData.animation.currX = monstersModels[ xFrom ][ yFrom ].root.position.z;
		gameData.animation.currY = gameData.animation.nextY = monstersModels[ xFrom ][ yFrom ].root.position.x;
		gameData.animation.baseX = xFrom;
		gameData.animation.baseY = yFrom;
		gameData.animation.targetX = settings.xT;
		gameData.animation.targetY = settings.yT;
		gameData.animation.path = gameData.battle.selection.path;
		gameData.animation.length = gameData.battle.selection.path.length;
		gameData.animation.withAttack = settings.withAttack;
		gameData.animation.nearAttack = settings.nearAttack;
		gameData.animation.withDeath = settings.withDeath;
		gameData.animation.withHealing = settings.withHealing;
		gameData.animation.withSpell = ( typeof settings.withSpell !== "undefined" ) ? settings.withSpell : false;
		gameData.animation.activeSpell = ( typeof settings.spell !== "undefined" ) ? settings.spell : '';
		gameData.animation.spell = false;
		gameData.animation.death = false;
		gameData.animation.healing = false;
		gameData.animation.attack = false;
		gameData.animation.damage = settings.damage;
		gameData.animation.heal = ( typeof settings.heal !== "undefined" ) ? settings.heal : 0;
		gameData.animation.step = 0;
		if( typeof settings.move !== "undefined" && settings.move === true ) {
		    gameData.animation.move = true;
		    gameData.animation.moveX = settings.moveX;
		    gameData.animation.moveY = settings.moveY;
		} else {
		    gameData.animation.move = false;
		}
		if( gameData.animation.withSpell === true ) {
		    Game.Battle.Sounds.prepare( { sounds: gameData.battle.selection.hero.monsters[ xFrom ][ yFrom ].sounds, active: 'spell' } );
		    Game.Battle.Sounds.play();
		} else if( gameData.animation.withHealing === true ) {
		    Game.Battle.Sounds.prepare( { sounds: gameData.battle.selection.hero.monsters[ xFrom ][ yFrom ].sounds, active: 'healing' } );
		    Game.Battle.Sounds.play();
		} else if( gameData.animation.nearAttack === true ) {
		    Game.Battle.Sounds.prepare( { sounds: gameData.battle.selection.hero.monsters[ xFrom ][ yFrom ].sounds, active: 'attack' } );
		    Game.Battle.Sounds.play();
		} else {
		    Game.Battle.Sounds.prepare( { sounds: gameData.battle.selection.hero.monsters[ xFrom ][ yFrom ].sounds, active: 'move' } );
		    Game.Battle.Sounds.play();
		}
		gameData.animation.run = true;
		gameData.animation.object = monstersModels[ xFrom ][ yFrom ];
		gameData.animation.targetObject = monstersModels[ settings.xT ][ settings.yT ];
	    }
	} catch( e ) {
	    if( e === "action" ) Game.Battle.Animation.monster( delta );
	}
    },
    monster: function( delta ) {
	try {
	    if( gameData.animation.run === false ) throw "noanimation"
	    if( gameData.animation.progress === false ) Game.Battle.Animation.monsterStepPrepare();
	    if( gameData.animation.progress === true ) Game.Battle.Animation.monsterProgress( delta );
	} catch ( e ) {
	    
	}
    },
    monsterStepPrepare: function() {
	try {
	    if( ( gameData.animation.path.length )  < ( gameData.animation.step + 2 ) || gameData.animation.withSpell === true || gameData.animation.withHealing === true ) {
		Game.Battle.Animation.monsterLastStep();
		gameData.animation.object.controls.move = false;
		throw "lastStepOver";
	    }
	    Game.Battle.Animation.monsterNextStep();
	    ++gameData.animation.step;
	} catch( e ) {
	    
	}
    },
    monsterProgress: function( delta ) {
	try {
	    if( gameData.animation.attack === false && gameData.animation.death === false && gameData.animation.healing === false && gameData.animation.spell === false ) {
		var monster = gameData.animation.object;
		var moveStep = gameData.battle.selection.movePath[gameData.animation.step];
		var moving = false;
		if( gameData.animation.dirs.x !== -1 || gameData.animation.dirs.y === 0 ) {
		    monster.speed = THREE.Math.clamp( monster.speed + delta * monster.frontAcceleration, ( monster.maxSpeed * -1 ), monster.maxSpeed );
		} else {
		    monster.speed = THREE.Math.clamp( monster.speed + Math.abs( moveStep[2] ) * ( delta ) * monster.frontAcceleration, ( monster.maxSpeed * -1 ), monster.maxSpeed );
		}
		var forwardSpeed = ( monster.speed <= monster.maxSpeed ) ? monster.speed * delta : monster.maxSpeed * delta;
		if( gameData.animation.dirs.x === 0 || gameData.animation.dirs.y === 0 ) {
		    forwardSpeed = ( gameData.animation.dirs.x === -1 || gameData.animation.dirs.y === 1 ) ? ( monster.speed * 10 ) * ( delta * 2 ) : monster.speed * 20;
		} else {
		    forwardSpeed = monster.speed * delta;
		}
		forwardSpeed *= ( animSpeed / 4 );
		if( ( gameData.animation.dirs.x === 1 && gameData.animation.nextCX < monster.root.position.z ) ||
		    ( gameData.animation.dirs.x === -1 && gameData.animation.nextCX > monster.root.position.z ) ) {
		    if( ( gameData.animation.dirs.x === 1 && gameData.animation.dirs.y === 1 ) ||
			( gameData.animation.dirs.x === -1 && gameData.animation.dirs.y === -1 ) ) {
			monster.root.position.z += ( Math.sin( monster.bodyOrientation ) * ( forwardSpeed ) );
		    } else {
			monster.root.position.z -= ( Math.sin( monster.bodyOrientation ) * ( forwardSpeed ) );
		    }
		    monster.controls.move = true;
		    moving = true;
		}

		if( ( gameData.animation.dirs.y === -1 && gameData.animation.nextCY > monster.root.position.x ) ||
		    ( gameData.animation.dirs.y === 1 && gameData.animation.nextCY < monster.root.position.x ) ) {
		    if( ( gameData.animation.dirs.x === 1 && gameData.animation.dirs.y === 1 ) ||
			( gameData.animation.dirs.x === -1 && gameData.animation.dirs.y === -1 ) ||
			( gameData.animation.dirs.y === -1 && gameData.animation.dirs.x === 0 ) ) {
    			monster.root.position.x += Math.cos( monster.bodyOrientation ) * ( forwardSpeed );
		    } else {
			monster.root.position.x -= Math.cos( monster.bodyOrientation ) * ( forwardSpeed );
		    }
		    monster.controls.move = true;
		    moving = true;
		}
		if( moving === false ) {
		    if( monster.root.position.z !== gameData.animation.nextCX ) monster.root.position.z = gameData.animation.nextCX;
		    if( monster.root.position.x !== gameData.animation.nextCY ) monster.root.position.x = gameData.animation.nextCY;
		    gameData.animation.progress = false;
		    if( gameData.animation.step === ( gameData.animation.path.length - 1 ) ) {
			monster.controls.move = false;
			Game.Battle.Sounds.stop();
			if( gameData.animation.withAttack === true ) {
			    Game.Battle.Sounds.prepare( { sounds: gameData.battle.selection.hero.monsters[ gameData.battle.selection.x ][ gameData.battle.selection.y ].sounds, active: 'attack' } );
			    Game.Battle.Sounds.play();
			}
		    }
		}
	    } else if( gameData.animation.attack === true && gameData.animation.death === false ) {
		if( tick > animSpeed * 7 ) gameData.animation.object.speed = 0;
		if( tick > animSpeed * 7 ) {
		    gameData.animation.progress = false;
		    Game.Battle.Sounds.stop();
		    if( gameData.animation.withDeath === false ) {
			gameData.animation.attack = false;
			gameData.animation.withAttack = false;
		    } else {
			if( gameData.animation.withDeath === true ) {
			    Game.Battle.Sounds.prepare( { sounds: gameData.battle.selection.hero.monsters[ gameData.battle.selection.x ][ gameData.battle.selection.y ].sounds, active: 'death' } );
			    Game.Battle.Sounds.play();
			}
		    }
		    //gameData.battle.selection.enemyHero.monsters[gameData.animation.targetX][gameData.animation.targetY].healthRemain -= gameData.animation.damage;
		    gameData.battle.selection.enemyHero.monsters[gameData.animation.targetX][gameData.animation.targetY].healthRemain = ( gameData.battle.selection.enemyHero.monsters[gameData.animation.targetX][gameData.animation.targetY].healthRemain >= gameData.animation.damage ) ? gameData.battle.selection.enemyHero.monsters[gameData.animation.targetX][gameData.animation.targetY].healthRemain - gameData.animation.damage : 0;
		    if( gameData.rotation[gameData.battle.selection.player] === DIR.RIGHT ) {
			gameData.animation.object.bodyOrientation = gameData.animation.object.orientations.r;
			gameData.animation.targetObject.bodyOrientation = gameData.animation.object.orientations.l;
		    } else {
			gameData.animation.object.bodyOrientation = gameData.animation.object.orientations.l;
			gameData.animation.targetObject.bodyOrientation = gameData.animation.object.orientations.r;
		    }
		    gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y].speedRemain = 0;
		    gameData.animation.object.controls.attack = false;
		    gameData.animation.object.controls.move = false;
		    gameData.animation.targetObject.controls.defense = false;
		} else if( tick > animSpeed * 5.5 ) {
		    gameData.animation.object.controls.move = false;
		} else {
		    gameData.animation.object.controls.move = ( gameData.animation.nearAttack === false ) ? true : false;
		    gameData.animation.object.controls.attack = true;
		    gameData.animation.targetObject.controls.defense = true;
		    Game.Html.showPoints( true, gameData.animation.damage );
		}
	    } else if( gameData.animation.healing === true ) {
		Game.Html.showPoints( true, gameData.animation.heal );
		if( tick > ( animSpeed * 3.5 )&& tick < ( animSpeed * 7 ) ) {
		    Game.Battle.Animation.lights( healer, healing, false );
		} else if( tick > ( animSpeed * 7 ) ) {
		    gameData.animation.progress = false;
		    gameData.animation.object.controls.healing = false;
		    gameData.animation.targetObject.controls.defense = false;
		    Game.Battle.Animation.lights( healer, healing, false );
		    Game.Battle.Sounds.stop();
		} else {
		    Game.Battle.Animation.lights( healer, healing, true );
		    gameData.animation.object.controls.healing = true;
		    gameData.animation.targetObject.controls.defense = true;
		}
	    } else if( gameData.animation.spell === true ) {
		Game.Html.showPoints( true, gameData.animation.damage );
		if( tick > ( animSpeed * 3.5 )&& tick < ( animSpeed * 7 ) ) {
		    Game.Battle.Animation.lights( magic, magican, false );
		} else if( tick > ( animSpeed * 7 ) ) {
		    gameData.animation.progress = false;
		    gameData.animation.object.controls.attack = false;
		    gameData.animation.targetObject.controls.defense = false;
		    gameData.animation.object.speed = 0;
		    Game.Battle.Animation.lights( magic, magican, false );
		    Game.Battle.Sounds.stop();
		} else {
		    Game.Battle.Animation.lights( magic, magican, true );
		    gameData.animation.object.controls.attack = true;
		    gameData.animation.targetObject.controls.defense = true;
		}
	    }
	} catch( e ) {
	    
	}
    },
    monsterLastStep: function() {
	try {
	    var rot = gameData.rotation[gameData.battle.selection.player];
	    if( gameData.animation.withAttack === false && gameData.animation.withHealing === false && gameData.animation.withSpell === false ) {
		gameData.animation.run = false;
		if( gameData.rotation[gameData.battle.selection.player] === DIR.RIGHT ) {
		    gameData.animation.object.bodyOrientation = gameData.animation.object.orientations.r;
		} else {
		    gameData.animation.object.bodyOrientation = gameData.animation.object.orientations.l;
		}
	    } else if( ( gameData.animation.withAttack === true && gameData.animation.attack === false ) || ( gameData.animation.withSpell === true && gameData.animation.spell === false ) ) {
		gameData.animation.attack = ( gameData.animation.withAttack === true ) ? true : false;
		gameData.animation.spell = ( gameData.animation.withSpell === true ) ? true : false;
		gameData.animation.progress = true;
		tick = 0;
		if( gameData.animation.withAttack === true ) {
		    Game.Html.showPoints( false, gameData.animation.damage, 'damage' );
		} else if( gameData.animation.withSpell === true ) {
		    Game.Html.showPoints( false, gameData.animation.damage, 'spell' );
		    magican.position = { x: gameData.animation.object.root.position.x, y: gameData.animation.object.root.position.y + 170, z: gameData.animation.object.root.position.z };
		    magic.position = { x: gameData.animation.targetObject.root.position.x, y: gameData.animation.targetObject.root.position.y + 170, z: gameData.animation.targetObject.root.position.z };
		}
		if( gameData.animation.nearAttack === false ) {
		    var monsterBase = { 'x': gameData.battle.selection.x, 'y': gameData.battle.selection.y };
		    var monsterBaseRot = gameData.battle.selection.path[ gameData.battle.selection.path.length - 1 ]
		    var monsterTarget = gameData.battle.selection.path[ gameData.battle.selection.path.length - 2 ];

		    var rotAttacker = Game.Battle.Animation.getRotation( monsterBaseRot.x, monsterBaseRot.y, gameData.animation.targetX, gameData.animation.targetY, gameData.animation.object.orientations );
		    var rotDefender = Game.Battle.Animation.getRotation( gameData.animation.targetX, gameData.animation.targetY, monsterBaseRot.x, monsterBaseRot.y, gameData.animation.targetObject.orientations );
		    gameData.animation.object.bodyOrientation = rotAttacker;
		    gameData.animation.targetObject.bodyOrientation = rotDefender;
		}
	    } else if( gameData.animation.withDeath === true && gameData.animation.death === false ) {
		gameData.animation.death = true;
		gameData.animation.targetObject.controls.death = true;
		tick = 0;
	    } else if( gameData.animation.withDeath === true && gameData.animation.death === true ) {
		if( tick > animSpeed * 6 ) {

		    gameData.animation.run = false;
		    deathGridModels[gameData.animation.targetX][gameData.animation.targetY] = 1;
		    if( gameData.battle.selection.player == "left" ) {
			var hero = heroes.left;
			var enemyHero = heroes.right;
		    } else {
			var hero = heroes.right;
			var enemyHero = heroes.left;
		    }
		    enemyHero.monsters[gameData.animation.targetX][gameData.animation.targetY] = 0;
		    gameData.battle.plane.grid[gameData.animation.targetX][gameData.animation.targetY] = 0;
		    enemyHero.grid[gameData.animation.targetX][gameData.animation.targetY] = 0;
		    gameData.animation.progress = false;
		    scene.remove( monstersModels[gameData.animation.targetX][gameData.animation.targetY].root );
		    var game = Game.Battle.calcGameover( enemyHero );
		    Game.Battle.Sounds.stop();
		    if( game.gameOver === true ) {
			Game.Html.showGameOver();
			console.log( 'Game OVER' );
			gameData.gameOver = true;
			gameData.run = false;
		    }
		    monstersModels[gameData.animation.targetX][gameData.animation.targetY] = 0;
		}
	    } else if( gameData.animation.withHealing === true && gameData.animation.healing === false ) {
		Game.Html.showPoints( false, gameData.animation.heal, 'heal' );
		gameData.animation.healing = true;
		gameData.animation.progress = true;
		tick = 0;
		if( gameData.battle.selection.player === "left" ) {
		    var zOffset = -50;
		} else {
		    var zOffset = 50;
		}
		healing.position = { x: gameData.animation.object.root.position.x, y: gameData.animation.object.root.position.y + 170, z: gameData.animation.object.root.position.z };
		healing.position = { x: gameData.animation.targetObject.root.position.x, y: gameData.animation.targetObject.root.position.y + 170, z: gameData.animation.targetObject.root.position.z };
	    } else if( ( gameData.animation.withHealing === true && gameData.animation.healing === true ) || ( gameData.animation.withSpell === true && gameData.animation.spell === true ) ) {
		gameData.animation.run = false;
	    }

	    if( gameData.animation.run === false && gameData.animation.nearAttack === false ) {
		if( gameData.animation.move === true ) {
		    gameData.animation.object.controls.move = false;
		    Game.Controls.resetMove( gameData.animation.object );
		    Game.Grid.switchCube( {x: gameData.battle.selection.x, y: gameData.battle.selection.y, x2: gameData.animation.moveX, y2: gameData.animation.moveY } );
		    //Game.Grid.unselect( {x: gameData.battle.selection.x, y: gameData.battle.selection.y } );
		    Game.Grid.clearGrid( BATTLE_GRID.none );
		}
	    }
	    Game.Grid.unselect( { x: gameData.battle.selection.x, y: gameData.battle.selection.y } );
	} catch( e ) {
	    
	}
    },
    monsterNextStep: function() {
	try {
	    var nextStep = gameData.animation.path[gameData.animation.step + 1];
	    var nextStep2 = gameData.battle.selection.movePath[gameData.animation.step + 1];
	    
	    if( gameData.animation.step === 0 ) {
		gameData.animation.currX = gameData.battle.selection.x;
		gameData.animation.currY = gameData.battle.selection.y;
	    } else {
		gameData.animation.currX = gameData.animation.nextX;
		gameData.animation.currY = gameData.animation.nextY;
	    }
	    gameData.animation.nextX = nextStep.x;
	    gameData.animation.nextY = nextStep.y;
	    gameData.animation.dirs = nextStep2[4];
	    
	    var nextCords = Game.Grid.gridToCords( nextStep.x, nextStep.y );
	    gameData.animation.nextCX = nextCords[0];
	    gameData.animation.nextCY = nextCords[1];
	    gameData.animation.progress = true;
	    var rot = Game.Battle.Animation.getRotation( gameData.animation.currX, gameData.animation.currY, gameData.animation.nextX, gameData.animation.nextY, gameData.animation.object.orientations );
	    gameData.animation.object.bodyOrientation = rot;
	} catch( e ) {
	    
	}
    },
    monsterCordsPath: function() {
	try {
	    var lastX, lastY, cords, path, cordsPath, rot;
	    lastX = lastY = -1;
	    cordsPath = [];
	    var first = true;
	    var last = false;
	    var node = false;
	    if( monstersModels[gameData.battle.selection.x][gameData.battle.selection.y] === 0 ) throw "no selected";
	    //rot = monstersModels[gameData.battle.selection.x][gameData.battle.selection.y].bodyOrientation;
	    path = gameData.battle.selection.path;
	    var orient = monstersModels[gameData.battle.selection.x][gameData.battle.selection.y].orientations
	    if( path.length < 2 ) throw "no path";
	    cords = Game.Grid.gridToCords( gameData.battle.selection.x, gameData.battle.selection.y );
	    lastX = -1;
	    lastY = -1;
	    rot = Game.Battle.Animation.getRotation( lastX, lastY, path[0].x, path[0].y, monstersModels[gameData.battle.selection.x][gameData.battle.selection.y].orientations );
	    var dirs = Game.Battle.Animation.getDirs( rot, orient );
	    cords.push( rot );
	    cords.push( false );
	    cords.push( dirs );
	    for( i = 0; i < path.length; i++ ) {
		last = ( i === ( path.length - 1 ) ) ? true : false;
		node = ( lastX != path[i].x && lastY != path[i].y ) ? true : false;
		    
		    rot = Game.Battle.Animation.getRotation( lastX, lastY, path[i].x, path[i].y, orient );
		    var dirs = Game.Battle.Animation.getDirs( rot, orient );
		    cords = Game.Grid.gridToCords( path[i].x, path[i].y );
		    cords.push( rot );
		    cords.push( last );
		    cords.push( dirs );
		    cordsPath.push( cords );
		//}
		lastX = path[i].x;
		lastY = path[i].y;
	    }
	    return cordsPath;
	} catch( e ) {
	    return [];
	}
    },
    lights: function( light, secondLight, up ) {
	try {
	    up = ( typeof up === "undefined" ) ? true : up;
	    if( up === false ) {
		light.intensity -= ( (1 / animSpeed ) * 10 );
		light.position.y += ( (1 / animSpeed ) * 10 );
	    } else {
		light.intensity += ( (1 / animSpeed ) * 10 );
		light.position.y -= ( (1 / animSpeed ) * 10 );
	    }
	    secondLight.intensity = light.intensity;
	    secondLight.position.y = light.position.y;
	} catch( e ) {

	}
    },
    lightsHide: function( light, secondLight ) {
	try {
	    light.position.x = secondLight.position.x = -10000;
	} catch( e ) {

	}
    },
    getDirs: function( rot, orient ) {
	
	var dirs = { x: 0, y: 0 };
	if( rot === orient.fr || rot === orient.r || rot === orient.br ) {
	    dirs.x = 1;
	} else if( rot === orient.fl || rot === orient.l || rot === orient.bl ) {
	    dirs.x = -1;
	} else {
	    dirs.x = 0;
	}
	if( rot === orient.fl || rot === orient.f || rot === orient.fr ) {
	    dirs.y = 1;
	} else if( rot === orient.bl || rot === orient.b || rot === orient.br ) {
	    dirs.y = -1;
	} else {
	    dirs.y = 0;
	}
	return dirs;
    },
    getRotation: function( x, y, x2, y2, orientations ) {
	x = parseInt( x );
	x2 = parseInt( x2 );
	y = parseInt( y );
	y2 = parseInt( y2 );
	if( x2 > x ) {
	    if( y2 < y ) {
		return orientations.fr;//right top
	    } else if( y2 > y ) {
		return orientations.br;//right bottom
	    } else if( y2 == y ) {
		return orientations.r;//right
	    }
	} else if( x2 < x ) {
	    if( y2 < y ) {
		return orientations.fl;//left top
	    } else if( y2 > y ) {
		return orientations.bl;//left  bottom
	    } else {
		return orientations.l;//left
	    }
	} else {
	    if( y2 < y ) {
		return orientations.f;//top
	    } else if( y2 > y ) {
		return orientations.b;//top
	    }
	}

    }
}
