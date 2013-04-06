Game.Rpg.Scene = {
    add: function() {
	// SCENE
	scene = new THREE.Scene();
	//Game.Rpg.Scene._setFog();
    },
    _setFog: function() {
	scene.fog = new THREE.Fog( 0xdddddd, 1, 1250 );
    },
    remove: function() {
	// SCENE
	delete scene;
    }
};