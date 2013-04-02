Game.Rpg.Scene.Renderer = {
    add: function() {
	var aa = gameRpgData.settings.antialiasing;
	renderer = new THREE.WebGLRenderer( { antialias: aa } );
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
	renderer.setClearColor( 0x000000, 1 );
	container.appendChild( renderer.domElement );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	//NO ANDROID
	//renderer.shadowMapEnabled = true;
    },
    refresh: function() {
	var delta = clock.getDelta();
	if ( t > 1 ) t = 0;

	//cameraControls.update( delta );
	if( gameRpgData.character.loaded ) {
	    gameRpgData.character.md2.update( delta, true );
	}
	for( i in gameRpgData.world.ambientObjects ) gameRpgData.world.ambientObjects[ i ].update( delta, false );
	    
	
	
	renderer.render( scene, camera );
    }
};