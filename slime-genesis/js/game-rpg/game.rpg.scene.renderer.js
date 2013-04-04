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
	if( gameRpgData.character.loaded ) gameRpgData.character.md2.update( delta, true );
	for( var y = 0; y < gameRpgData.world.ambientObjects.length; y++ ) for( var x = 0; x < gameRpgData.world.ambientObjects[y].length; x++ ) if( gameRpgData.world.ambientObjects[y][x] !== 0 ) gameRpgData.world.ambientObjects[y][x].update( delta, false );
	
	renderer.render( scene, camera );
    }
};