Game.Scene.Render = {};
Game.Scene.Render = {
    add: function() {
	//renderer = new THREE.WebGLRenderer( { antialias: gameData.settings.antialiasing } );
	renderer = new THREE.WebGLRenderer3( { antialias: gameData.settings.antialiasing } );
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
	renderer.setClearColor( 0xffeeff, 1 );
	if( gameData.settings.graphics.mobile === "off" ) Game.Scene.Render.shadows();
	canvas = renderer.domElement;
	container.appendChild( renderer.domElement );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
    },
    refresh: function( modelsLoaded ) {
	if( modelsLoaded === true ) {
	    delta = clock.getDelta();
	    for ( x in monstersModels ) for ( y in monstersModels[x] ) {
		if( typeof monstersModels[ x ][ y ] === "object" ) {
		    monstersModels[ x ][ y ].update( delta );
		}
	    }
	    Game.Battle.Animation.animate( false, delta );
	}
	renderer.render( scene, camera );
    },
    shadows: function() {
	if( gameData.settings.graphics.shadows === "none" ) {
	    renderer.shadowMapEnabled = false;
	    renderer.shadowMapCascade = false;
	    return;
	    
	}
	renderer.shadowMapEnabled = true;
	if( gameData.settings.graphics.shadows !== "low" ) {
	    renderer.shadowMapCascade = true;
	    if( gameData.settings.graphics.shadows !== "medium" ) {
		renderer.shadowMapType = THREE.PCFSoftShadowMap;
	    }
	}
	
    }
};