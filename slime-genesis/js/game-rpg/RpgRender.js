(function(){

	var renderer;
	//var scene;
	var camera;
	var light;
	var stats;

	RpgRender = function(game)
	{
	    var setFog = function(params) 
	    {
			scene.fog = new THREE.Fog( params.color, params.near, params.far );
	    };

	    this.add = function() 
	    {
			renderer = new THREE.WebGLRenderer( { antialias: gameRpgData.settings.antialiasing } );
			renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
			renderer.setClearColor( 0x000000, 1 );
			container.appendChild( renderer.domElement );
			renderer.gammaInput = true;
			renderer.gammaOutput = true;
			//NO ANDROID renderer.shadowMapEnabled = true;
	    };

	    this.addScene = function() 
	    {
			// SCENE
			scene = new THREE.Scene();
			utils.log(scene);
			//setFog({color: 0xdddddd, near: 1, far: 1250});
	    };

	    this.addCamera = function() 
	    {
			camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 70000 );
			camera.position.set( 0, 150, 1300 );
			camera.rotation = { x: -2.6588307803635418, y: 0.01722953216940547, z: 3.110304810024675 };
			camera.position = { x: 12.46344931843459, y: 70.8783865930267, z: -110.536506409053 }
			scene.add( camera );
	    };

	    this.addLight = function() 
	    {
			// LIGHTS
			scene.add( new THREE.AmbientLight( 0xFFFF11 ) );
			light = new THREE.DirectionalLight( 0xffff00, 1.05 );
			//No ANDROID light.castShadow = true;
			light.position.set( 500, 300, 1500 );
			scene.add( light );
			gameRpgData.character.torch = new THREE.PointLight( 0xffffff, 1, 50 );
			scene.add( gameRpgData.character.torch );
	    };

	    this.addStats = function() 
	    {
			stats = new Stats();
			container.appendChild( stats.domElement );
	    };

	    this.removeScene = function() 
	    {
			// SCENE
			delete scene;
	    };

	    this.removeCamera = function() 
	    {
			scene.remove( camera );
	    };

	    this.removeLight = function() 
	    {
			scene.remove( camera );
	    };

	    this.refresh = function(delta) 
	    {
			if ( t > 1 ) t = 0;
			//cameraControls.update( delta );
			if( gameRpgData.character.loaded ) gameRpgData.character.md2.update( delta, true );
			//for( var y = 0; y < gameRpgData.world.ambientObjects.length; y++ ) for( var x = 0; x < gameRpgData.world.ambientObjects[y].length; x++ ) if( gameRpgData.world.ambientObjects[y][x] !== 0 ) gameRpgData.world.ambientObjects[y][x].update( delta, false );
			renderer.render( scene, camera );
	    };

	    this.getMaxAnisotropy = function()
	    {
			return renderer.getMaxAnisotropy();
	    };
	};
})();