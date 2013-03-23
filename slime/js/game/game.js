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
	    if( gameData.state === "battle" ) {
		Game.Battle.refreshLogic();
	    } else if( gameData.state === "adventure" ) {
		Game.Adventure.refreshLogic();
	    }
	} else {
	    //Blank - space for Menu etc.
	    if( gameData.gameOver === false ) {
		gameData.run = true;
		
		if( gameData.state === "battle" ) {
		    //Turn on default battle
		    Game.Html.showChangeTurn();
		    Game.Battle.Grid.clearGrid( BATTLE_GRID[ gameData.battle.selection.player ] );
		} else if( gameData.state === "adventure" ) {
		    Game.Adventure.Grid.clearGrid( ADVENTURE_GRID[ gameData.adventure.selection.player ] );
		}
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
	Game.Events.initialize();
	Game.Stats.add();
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
