Game.Rpg.Scene.Camera = {
    camera: {},
    add: function() {
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 700 );
	camera.position.set( 0, 150, 1300 );
	scene.add( camera );
	Game.Rpg.Scene.Camera.factoryDefault( camera );
	Game.Rpg.Scene.Camera.camera = camera;
    },
    factoryDefault: function( camera ) {
	camera.rotation.x = -2.6588307803635418
	camera.rotation.y = 0.01722953216940547
	camera.rotation.z = 3.110304810024675
	camera.position = { x: 12.46344931843459, y: 70.8783865930267, z: -110.536506409053 }
    },
    remove: function() {
	scene.remove( Game.Rpg.Scene.Camera.camera );
    }
};