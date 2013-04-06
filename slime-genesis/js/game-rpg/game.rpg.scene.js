Game.Rpg.Scene = {
    add: function() {
	// SCENE
	scene = new THREE.Scene();
	
    },
    _setFog: function() {
	//scene.fog = new THREE.Fog( 0xffffff, 1, 4000 );
    },
    remove: function() {
	// SCENE
	delete scene;
    }
};