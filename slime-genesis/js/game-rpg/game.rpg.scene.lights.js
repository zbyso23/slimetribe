Game.Rpg.Scene.Lights = {
    simplyAdd: function() {
	// LIGHTS
	scene.add( new THREE.AmbientLight( 0xFFFF11 ) );
	var light = new THREE.DirectionalLight( 0xffff00, 1.05 );
	//No ANDROID light.castShadow = true;
	light.position.set( 500, 300, 1500 );
	scene.add( light );
	gameRpgData.character.torch = new THREE.PointLight( 0xffffff, 1, 50 );
	scene.add( gameRpgData.character.torch );

    }
};