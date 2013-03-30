Game.Scene = {
    add: function() {
	scene = new THREE.Scene();
    },
    setFog: function() {
//ANDROID 	scene.fog = ( FOG.enabled ) ? new THREE.Fog( FOG.color, FOG.near, FOG.far ) : false;
scene.fog = false;
    }
}