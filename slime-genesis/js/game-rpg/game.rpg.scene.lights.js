Game.Rpg.Scene.Lights = {
    simplyAdd: function() {
	// LIGHTS
	scene.add( new THREE.AmbientLight( 0x111111 ) );
	//No ANDROID 
	//light.castShadow = true;
	var light = new THREE.DirectionalLight( 0xffffff, 1.05 );
	light.position.set( 500, 300, 1500 );
	scene.add( light );
	gameRpgData.character.torch = new THREE.PointLight( 0xffffff, 1, 50 );

	scene.add( gameRpgData.character.torch );

    }
};