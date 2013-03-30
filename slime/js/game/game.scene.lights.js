Game.Scene.Lights = {};
Game.Scene.Lights = {
    addAmbientLight: function() {
	ambientLight = new THREE.AmbientLight( LIGHTS.ambient.color );
	scene.add( ambientLight );
    },
    removeAmbientLight: function() {
	scene.remove( ambientLight );
    },
    addLight: function() {
	light = new THREE.DirectionalLight( LIGHTS.light.color, LIGHTS.light.intensity );
	light.position.set( LIGHTS.light.x, LIGHTS.light.y, LIGHTS.light.z );
	if( gameData.settings.graphics.mobile === "off" ) Game.Scene.Lights.shadowLight( light );
	scene.add( light );
    },
    removeLight: function() {
	scene.remove( light );
    },
    addHealerLight: function() {
	healer = Game.Scene.Lights.addPointLight( LIGHTS.healerLight );
    },
    removeHealerLight: function() {
	scene.remove( healer );
    },
    addHealingLight: function() {
	healing = Game.Scene.Lights.addPointLight( LIGHTS.healingLight );
    },
    removeHealingLight: function() {
	scene.remove( healing );
    },
    addMagicLight: function() {
	magic = Game.Scene.Lights.addPointLight( LIGHTS.magicLight );
    },
    removeMagicLight: function() {
	scene.remove( magic );
    },
    addMagicanLight: function() {
	magican = Game.Scene.Lights.addPointLight( LIGHTS.magicanLight );
    },
    removeMagicanLight: function() {
	scene.remove( magican );
    },
    addTorchLight: function() {
	torch = Game.Scene.Lights.addPointLight( LIGHTS.torchLight );
    },
    setPosition: function( light, params ) {
        light.position.x = params.x;
        light.position.z = params.y;
    },
    
    
    initializeAll: function() {
	Game.Scene.Lights.addAmbientLight();
	Game.Scene.Lights.addLight();
	Game.Scene.Lights.addHealerLight();
	Game.Scene.Lights.addHealingLight();
	Game.Scene.Lights.addMagicLight();
	Game.Scene.Lights.addMagicanLight();
	Game.Scene.Lights.addTorchLight();
    },
    addPointLight: function( params ) {
	var light = new THREE.PointLight( params.color, params.intensity, params.distance );
	if( params.x && params.y && params.z ) light.position.set( params.x, params.y, params.z );
	if( gameData.settings.graphics.mobile === "off" ) Game.Scene.Lights.shadowPointLight( light );
	scene.add( light );
	return light;
    },
    shadowPointLight: function( light ) {
	light.shadowCascade = true;
	light.shadowCascadeCount = 3;
	light.shadowCascadeNearZ = [ -1.000, 0.995, 0.998 ];
	light.shadowCascadeFarZ  = [  0.995, 0.998, 1.000 ];
	light.shadowCascadeWidth = [ 128, 128, 128];
	light.shadowCascadeHeight = [ 128, 128, 128];
    },
    
    shadowLight: function( light ) {
	if( gameData.settings.graphics.shadows === "none" ) return;
	light.castShadow = true;
	if( gameData.settings.graphics.shadows === "low" ) {
	    light.shadowMapWidth = 256;
	    light.shadowMapHeight = 256;
	} else if( gameData.settings.graphics.shadows === "medium" ) {
	    light.shadowMapWidth = 256;
	    light.shadowMapHeight = 256;
	} else {
	    light.shadowMapWidth = 4096;
	    light.shadowMapHeight = 4096;
	}
	light.shadowMapDarkness = .75;

	light.shadowCascade = true;
	if( gameData.settings.graphics.shadows === "low" ) {
	    light.shadowCascadeCount = 2;
	    light.shadowCascadeWidth = [ 256, 256, 256 ];
	    light.shadowCascadeHeight = [ 256, 256, 256 ];
	} else if( gameData.settings.graphics.shadows === "medium" ) {
	    light.shadowCascadeCount = 3;
	    light.shadowCascadeWidth = [ 512, 512, 512 ];
	    light.shadowCascadeHeight = [ 512, 512, 512 ];
	} else {
	    light.shadowCascadeCount = 3;
	    light.shadowCascadeWidth = [ 2048, 2048, 2048 ];
	    light.shadowCascadeHeight = [ 2048, 2048, 2048 ];
	}
	light.shadowCascadeNearZ = [ -1.000, 0.995, 0.998 ];
	light.shadowCascadeFarZ  = [  0.995, 0.998, 1.000 ];
    }
}