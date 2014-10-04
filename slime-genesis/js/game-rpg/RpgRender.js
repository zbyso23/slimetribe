(function(){
	RpgRender = function( world, data, ambient, maps )
	{
		var that = this;
		var scene;
		var camera;
		var light;
		var stats;
		var ambient3D   = [];
		var character3D = { model: {}, object: {}, gyro: {} };

		var htmlRender = new HtmlRender( this, data, ambient, maps );

	    var gridToCoords = function( params ) 
	    {
			var map = maps.getCurrent();
			var stepX = Math.round( map.ground.width / map.config.gridX );
			var stepY = Math.round( map.ground.height / map.config.gridY );
			var coordsX = ( map.ground.width / 2 ) - ( params.x * stepX );
			var coordsY = ( map.ground.height / 2 ) - ( params.y * stepY );
			if( params.center === true ) 
			{
				//var ground = data.getWorldGroundObject();
			    //coordsX = ( ( ground.width / 2 ) > params.x ) ? coordsX + ( stepX / 2 ) : coordsX - ( stepX / 2 );
			    //coordsY = ( ( ground.height / 2 ) > params.x ) ? coordsY + ( stepY / 2 ) : coordsY - ( stepY / 2 );
			}
			return { x: coordsX, y: coordsY, center: params.center };
	    };

	    var reverseGrid = function( params ) 
	    {
			var map = maps.getCurrent();
			return { x: ( map.config.gridX ) - params.x, y: ( map.config.gridY ) - params.y };
	    };

	    var gridToStream = function( params ) 
	    {
			var map = maps.getCurrent();
			return ( parseInt( params.x ) + ( parseInt( params.y ) * ( map.config.gridX + 1 ) ) );
	    };

	    var setFog = function(params) 
	    {
			scene.fog = new THREE.Fog( params.color, params.near, params.far );
	    };

	    var addScene = function() 
	    {
			// SCENE
			scene = new THREE.Scene();
			utils.log(scene);
			//setFog({color: 0xdddddd, near: 1, far: 1250});
	    };

	    var addCamera = function() 
	    {
			camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000000/*70000*/ );
			camera.position.set( 0, 150, 1300 );
			camera.rotation = { x: -2.9588307803635418, y: 0.01722953216940547, z: 3.110304810024675 };
			//camera.position = { x: 12.46344931843459, y: 70.8783865930267, z: -110.536506409053 }
			camera.position = { x: 12.46344931843459, y: 45.8783865930267, z: -70.536506409053 }
			scene.add( camera );
	    };

	    var addLight = function() 
	    {
			// LIGHTS
			scene.add( new THREE.AmbientLight( 0xFFFF11 ) );
			light = new THREE.DirectionalLight( 0xffff00, 1.05 );
			//No ANDROID 
			light.castShadow = true;
			light.position.set( 500, 300, 1500 );
			scene.add( light );
			//REFACTOR FUNCTION ADD addTorch & remove link to character:
			// gameRpgData.character.torch = new THREE.PointLight( 0xffffff, 1, 50 );
			// scene.add( gameRpgData.character.torch );
	    };

	    var addStats = function() 
	    {
			stats = new Stats();
			container.appendChild( stats.domElement );
	    };

	    var removeScene = function() 
	    {
			delete scene;
	    };

	    var removeCamera = function() 
	    {
			scene.remove( camera );
	    };

	    var removeLight = function() 
	    {
			scene.remove( camera );
	    };

	    var addAmbientObject = function( params ) 
	    {
	    	var map     = maps.getCurrent();
			var found = ambient.getAmbient(params.id);
			if( !found ) return false;
			var ambientParams = 
			{ 
				x         : params.x + found.params.x, 
				y         : params.z, 
				z         : params.y + found.params.y, 
				gridX     : params.gridX, 
				gridY     : params.gridY, 
				rot       : found.params.rot, 
				height    : found.params.z, 
				opacity   : found.params.opacity, 
				attributes: found.attributes 
			};
			var ambientObject = addAmbient( found.config, found.params.scale, ambientParams );
			if( false === utils.isArray( map.world.ambientObjects[params.gridY] ) ) map.world.ambientObjects[params.gridY] = [];
			map.world.ambientObjects[params.gridY][params.gridX] = ambientObject;
	    };

	    var addAmbient = function( config, scale, params ) 
	    {
			var ambientObject = new THREE.MD2Simple();
			var map     = maps.getCurrent();
			ambientObject.controls = utils.cloneObj( controls );
			ambientObject.scale = 1;
			ambientObject.scale = scale;
			ambientObject.loadParts( config );
			world.addAmbientLoaderItem();
			ambientObject.onLoadComplete = function ()
			{
			    ambientObject.setSkin( 0 );
			    ambientObject.root.position.x = params.x;
			    ambientObject.root.position.y = params.y;
			    ambientObject.root.position.z = params.z;
			    ambientObject.bodyOrientation = params.rot;
			    ambientObject.params = { height: params.height };
			    ambientObject.attributes = utils.cloneObj( params.attributes );
			    ambientObject.meshBody.material.transparent = true;
			    ambientObject.meshBody.material.opacity = params.opacity;
			    that.addToScene( ambientObject.root );
			    map.world.ambientObjects[params.gridX][params.gridY] = ambientObject;
			    world.removeAmbientLoaderItem();
			    if( world.getAmbientLoaderItems() === 0 ) world.setAmbientItemsLoaded(true);
			}
			return ambientObject;
	    };


	    var addSkybox = function( map ) 
	    {
	    	if( true === data.getSkyboxLoaded() ) return;
	        var directions  = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"];
	        var imageSuffix = ".jpg";
	        //var skyGeometry = new THREE.SphereGeometry( map.skybox.size, 32, 16 );
	        var skyGeometry = new THREE.CubeGeometry( map.skybox.size, map.skybox.size, map.skybox.size, 32, 32, 32 );
	        var materialArray = [];
	        for (var i = 0; i < 6; i++)
	        {
	        	var imageFilename = map.config.skyboxPath + directions[i] + imageSuffix;
	        	//side: THREE.BackSide
	        	var material = 
	        	{
	                    map: THREE.ImageUtils.loadTexture( imageFilename ),
	                    side: THREE.DoubleSide
	            };
				material.map.anisotropy = that.getMaxAnisotropy();
	            materialArray.push( new THREE.MeshBasicMaterial( material ) );
	        }

	        var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
	        skyboxObject    = new THREE.Mesh( skyGeometry, skyMaterial );
	        skyboxObject.scale = { x: 1, y: 1, z: 1 };
	        skyboxObject.position = { x: 0, y: 87, z: 0 };
	        that.addToScene( skyboxObject );
	        map.skybox.object = skyboxObject;
	        data.setSkyboxLoaded( true );
	    };

	    var removeSkybox = function( map ) 
	    {
	    	if( false === data.getSkyboxLoaded() ) return;
	    	that.removeFromScene( map.skybox.object );
	    	map.skybox.object = {};
	    	data.setSkyboxLoaded( false );
	    };

		this.imagesLoader = function()
		{
			htmlRender.imagesLoader( this.callbackImagesLoaderError );
		};

		this.refreshGuiContent = function( stats, items )
		{
			htmlRender.refreshGuiContent( stats, items );
		}

		this.callbackImagesLoaderError = function()
		{
			utils.log('pause');
			world.pause();
		};

	    this.callbackScreenResize = function( event ) 
	    {
			var SCREEN_WIDTH = window.innerWidth;
			var SCREEN_HEIGHT = window.innerHeight;
			camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
			camera.updateProjectionMatrix();
	    };

	    this.addToScene = function( object )
	    {
	    	if( false === utils.isObject( object ) ) return;
	    	scene.add( object );
	    };

	    this.removeFromScene = function( object )
	    {
	    	if( false === utils.isObject( object ) ) return;
	    	scene.remove( object );
	    };

	    this.initializeCharacter = function( character ) 
	    {
			character3D.model          = new THREE.MD2CharacterComplex();
			character3D.model.scale    = gameRpgData.player.params.scale;
			character3D.model.controls = controls;
			character3D.model.loadParts( gameRpgData.player.config );
			character3D.model.onLoadComplete = function () 
			{
			    //NO ANDROID 
			    character3D.model.enableShadows( true );
			    //character3D.model.setWeapon( 0 );
			    character3D.model.setSkin( 0 );
			    character3D.model.root.position = character.getPosition();
			    character3D.model.params = { height: 2.5 };
			    that.addToScene( character3D.model.root );
			    character3D.object = character3D.model.root;
			    character3D.gyro = new THREE.Gyroscope();
			    character3D.gyro.add( camera );
			    character3D.model.root.add( character3D.gyro );
			    world.setCharacterLoaded( true );
			}
	    };

	    this.uninitializeCharacter = function() 
	    {
			character3D.model.root.remove( character3D.gyro );
			character3D.gyro.remove( camera );
			this.removeFromScene( model.root );
			world.setCharacterLoaded = false;
	    };

	    this.initializeMap = function()
	    {
	    	var map = maps.getCurrent();
	    	world.setAmbientItemsLoaded( false );
			//  GROUND
			var gt = THREE.ImageUtils.loadTexture( map.config.groundTexture );
			var quality = 16, step = 1024 / quality;
			var ggGridX = map.config.gridX;
			var ggGridY = map.config.gridY;
			var gg = new THREE.PlaneGeometry( map.ground.width, map.ground.height, ggGridX, ggGridY );
			var shininess = 50; //ANDROID
			var gm = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: false, map: gt, gtside: THREE.DoubleSide } ); //Faster ANDROID
			//var gm = new THREE.MeshLambertMaterial( { color: 0xff0000, wireframe: false, map: gt, gtside: THREE.DoubleSide } ); //No ANDROID 
			//var gm = new THREE.MeshPhongMaterial( { color: 0xff0000, map: gt, bumpMap: gt, bumpScale: 2 } )
			var ground = new THREE.Mesh( gg, gm );
			ground.rotation.x = -1.57; //No ANDROID 
			var anisotropyMax = this.getMaxAnisotropy(); 
			ground.material.map.anisotropy = this.getMaxAnisotropy();
			ground.material.map.repeat.set( 16, 16 );
			ground.material.map.wrapS = ground.material.map.wrapT = THREE.RepeatWrapping;
			ground.receiveShadow = true; //No ANDROID
			this.addToScene( ground );
			map.ground.object = ground;
			for( var y in map.world.ambientMap ) for( var x in map.world.ambientMap[y] ) 
			{
			    gg.vertices[ gridToStream( { x: x, y: y } ) ].z = ( map.world.heightMap[x][y] * 1.3 ) - 3;
			    var coords = gridToCoords( { x: x, y: y, center: false } );
			    var reversedGrid = reverseGrid( { x: x, y: y } );
			    if( map.world.ambientMap[x][y] !== 255 ) 
			    {
			    	var ambientObject = { 
			    							id   : map.world.ambientMap[x][y], 
		    								x    : coords.x, 
		    								y    : coords.y, 
		    								z    : map.world.heightMap[reversedGrid.x][reversedGrid.y], 
		    								gridX: x, 
		    								gridY: y 
			    	};
					addAmbientObject( ambientObject )
			    }
			}
			addSkybox( map );
	    };

	    this.uninitializeMap = function( map ) 
	    {
			for( var y = 0; y < map.world.ambientObjects.length; y++ ) for( var x = 0; x < map.world.ambientObjects[y].length; x++ ) 
			{
			    if( map.world.ambientObjects[y][x] !== 0 ) this.removeFromScene( map.world.ambientObjects[y][x].root );
			}
			this.removeFromScene( map.ground.object );
			removeSkybox( map );
	    };

	    this.initialize = function()
	    {
	    	htmlRender.initialize();
	    	htmlRender.add( this.callbackScreenResize );
			addScene();
			addCamera();
			addLight();
			addStats();
	    };

	    this.refresh = function( delta, character ) 
	    {
			if ( t > 1 ) t = 0;
			//cameraControls.update( delta );
			//refactor; if( true === characterLoaded ) 
			//REFACTOR remove link to character: 
			// gameRpgData.character.torch.position.x = gameRpgData.character.object.position.x;
			// gameRpgData.character.torch.position.y = gameRpgData.character.object.position.y + 10;
			// gameRpgData.character.torch.position.z = gameRpgData.character.object.position.z;
			character3D.model.update( delta, true );
			var map     = maps.getCurrent();
			//for( var y = 0; y < map.world.ambientObjects.length; y++ ) for( var x = 0; x < map.world.ambientObjects[y].length; x++ ) if( map.world.ambientObjects[y][x] !== 0 ) map.world.ambientObjects[y][x].update( delta, false );
			htmlRender.render( scene, camera );
			if( stats ) stats.update();
	    };

	    this.getMaxAnisotropy = function()
	    {
			return htmlRender.getMaxAnisotropy();
	    };
	};
})();