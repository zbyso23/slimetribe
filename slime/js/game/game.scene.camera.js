Game.Scene.Camera = {}
Game.Scene.Camera = {
    add: function() {
	camera = new THREE.PerspectiveCamera( CAMERA.fov, CAMERA.ratio, CAMERA.near, CAMERA.far );
	Game.Scene.Camera.position( CAMERA );
	Game.Scene.Camera.rotation( CAMERA );
	scene.add( camera );
    },
    position: function( params ) {
	camera.position.set( params.x, params.y, params.z );
    },
    rotation: function( params ) {
	camera.rotation.set( params.rotX, params.rotY, params.rotZ );
    },
    remove: function() {
	scene.remove( camera );
    }
}