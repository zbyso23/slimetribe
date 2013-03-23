Game.Adventure = {
    generateWorld: function() {
	try {
	    if( gameDataImages.loadedRemain > 0 ) throw "images loading";
	    if( gameData.adventure.world.first === true ) {
		//Game.Scene.Graphics.addBattleGround();
		//Game.Scene.Graphics.addBattleAmbient();
		//Game.Adventure.Sounds.preloader();
	    }
	    Game.Adventure.Grid.generateCharacters( gameData.adventure.world.map, true, 3.14 );
	    if( gameData.adventure.world.first === true ) Game.Adventure.Grid.generateMap();
	    gameData.adventure.world.first = false;
	    gameData.adventure.world.ready = true;
	} catch( e ) {

	}
    },

    refreshLogic: function( ) {
	try {
	    if( !gameData.battle.world.ready ) throw "generate";
	    /*
	    if( gameData.loader.jsonLoaded === true && animSpeedCalibrated === true ) {
		Game.Html.hideBattleLoadingScreen();
		if( heroes[ gameData.battle.selection.player ].ai === true && gameData.animation.run === false && gameData.battle.selection.endTurnAnimation === false ) {
		    Game.Battle.Ai.turnStep();
		}
		if( gameData.battle.selection.endTurn === true ) {
		    Game.Battle.changeTurn();
		    gameData.battle.selection.endTurn = false;
		    gameData.battle.gui.cords = [];
		    Game.Html.showChangeTurn();
		    Game.Battle.Grid.clearGrid( BATTLE_GRID[ gameData.battle.selection.player ] );
		}
		if( gameData.battle.selection.endTurnAnimation === true ) {
		    Game.Html.animateChangeTurn();
		}
	    } else if( gameData.loader.jsonLoaded === true ) {
		if( animSpeedCalibrationCycles < 10 ) {
		    if( tick % 9 === 0 ) Game.calibrateAnimationSpeed();
		} else {
		    animSpeedCalibrated = true;
		}
	    }
	    */
	} catch( e ) {
	    if( e === "generate" ) {
		Game.Adventure.Grid.reset( gameData.adventure.world.first );
		Game.Html.showAdventureLoadingScreen();
		Game.Adventure.generateWorld();
	    }
	}
    }
};

