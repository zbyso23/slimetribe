var Game = {};
Game = {
    refresh: function() {
	requestAnimationFrame( Game.refresh );
	Game.refreshGraphics();
	Game.refreshLogic();
	tick++;
    },
    refreshGraphics: function() {
	Game.Scene.Render.refresh( gameData.loader.jsonLoaded );
	if( gameData.loader.jsonLoaded ) {
	    Game.Scene.Animate.refresh();
	    Game.Stats.refresh();
	}
    },
    
    refreshLogic: function() {
	if( gameData.run ) {
	    if( !gameData.battle.world.ready ) {
		Game.Battle.Grid.reset( gameData.battle.world.first );
		Game.Html.showBattleLoadingScreen();
		Game.Battle.generateWorld();
		Game.Battle.Events.initialize();
	    } else {
		if( gameData.loader.jsonLoaded === true && animSpeedCalibrated === true ) {
		    if( heroes[ gameData.battle.selection.player ].ai === true ) {
			if( gameData.animation.run === false && gameData.battle.selection.endTurnAnimation === false ) Game.Battle.Ai.turnStep();
		    }
		    if( gameData.battle.selection.endTurn === true ) {
			Game.Battle.changeTurn();
			gameData.battle.selection.endTurn = false;
			gameData.battle.gui.cords = [];
			Game.Html.showChangeTurn();
			Game.Battle.Grid.clearGrid( BATTLE_GRID[ gameData.battle.selection.player ] );
		    }
		    if( gameData.battle.selection.endTurnAnimation === true ) Game.Html.animateChangeTurn();
		} else if( gameData.loader.jsonLoaded === true ) {
		    if( animSpeedCalibrationCycles < 10 ) {
			if( tick % 10 === 0 ) Game.calibrateAnimationSpeed();
		    } else {
			animSpeedCalibrated = true;
			Game.Html.hideBattleLoadingScreen();
		    }
		}
	    }
	} else {
	    //Blank - space for Menu etc.
	    if( gameData.gameOver === false ) {
		gameData.run = true;
		Game.Html.showChangeTurn();
		Game.Battle.Grid.clearGrid( BATTLE_GRID[ gameData.battle.selection.player ] );
	    } else {
		console.log('Run Again?');
		if( gameData.battle.world.reset === true ) {
		    Game.Html.showGameOver( true );
		    gameData.gameOver = false;
		    gameData.battle.world.ready = false;
		    gameData.run = true;
		    gameData.battle.world.reset = false;
		}
	    }
	}
    },
    initialize: function() {
	console.log('initializing game....');
	Game.Scene.add();
	Game.Scene.setFog();
	Game.Scene.Camera.add();
	Game.Scene.Lights.initializeAll();
	Game.Init.plane();
	Game.Init.projector();
	Game.Init.controls();
	Game.Init.dom();
	Game.Loader.resourceLoader();
	Game.Scene.Render.add();
	Game.Stats.add();
	Game.Events.initialize();
	Game.Html.initialize();
	console.log('initializing game.... OK');
	Game.refresh();
    },
    calibrateAnimationSpeed: function() {
	var match = stats.domElement.innerHTML.match( /(\d+) FPS/);
	if( match != null ) {
	    fps = parseInt( match[1] );
	    if( fps > 0 ) animSpeed = animSpeedFpsStep * fps;
	    animSpeedCalibrationCycles++;
	}
    }
};
