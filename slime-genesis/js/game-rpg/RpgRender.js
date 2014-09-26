(function(){
	RpgRender = function( world, data, ambient, maps )
	{
		var that = this;
		var scene;
		var camera;
		var light;
		var stats;
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
			    //coordsX = ( ( gameRpgData.world.ground.width / 2 ) > params.x ) ? coordsX + ( stepX / 2 ) : coordsX - ( stepX / 2 );
			    //coordsY = ( ( gameRpgData.world.ground.height / 2 ) > params.x ) ? coordsY + ( stepY / 2 ) : coordsY - ( stepY / 2 );
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
			camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 70000 );
			camera.position.set( 0, 150, 1300 );
			camera.rotation = { x: -2.6588307803635418, y: 0.01722953216940547, z: 3.110304810024675 };
			camera.position = { x: 12.46344931843459, y: 70.8783865930267, z: -110.536506409053 }
			scene.add( camera );
	    };

	    var addLight = function() 
	    {
			// LIGHTS
			scene.add( new THREE.AmbientLight( 0xFFFF11 ) );
			light = new THREE.DirectionalLight( 0xffff00, 1.05 );
			//No ANDROID light.castShadow = true;
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
			// SCENE
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
	    	//REFACTOR TO: dataAmbient.getAmbient(params.id)
			var found = false;
			for( a in GameRpgAmbientList ) 
			{
			    if( GameRpgAmbientList[ a ].id == params.id ) 
			    {
					found = GameRpgAmbientList[ a ].object;
					break;
			    }
			}
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
			if( typeof gameRpgData.world.ambientObjects[params.gridY] === "undefined" ) gameRpgData.world.ambientObjects[params.gridY] = [];
			gameRpgData.world.ambientObjects[params.gridY][params.gridX] = ambientObject;
	    };

	    var addAmbient = function( config, scale, params ) 
	    {
			var ambient = new THREE.MD2CharacterComplex();
			var map     = maps.getCurrent();
			ambient.controls = utils.cloneObj( controls );
			ambient.scale = 1;
			ambient.scale = scale;
			ambient.loadParts( config );
			world.addAmbientItem();
			ambient.onLoadComplete = function ()
			{
			    ambient.setSkin( 0 );
			    ambient.root.position.x = params.x;
			    ambient.root.position.y = params.y;
			    ambient.root.position.z = params.z;
			    ambient.bodyOrientation = params.rot;
			    ambient.params = { height: params.height };
			    ambient.attributes = utils.cloneObj( params.attributes );
			    ambient.meshBody.material.transparent = true;
			    ambient.meshBody.material.opacity = params.opacity;
			    that.addToScene( ambient.root );
			    map.world.ambientObjects[params.gridX][params.gridY] = ambient;
			    world.removeAmbientItem();
			    if( world.getAmbientItems() === 0 ) world.setAmbientItemsLoaded(true);
			}
			return ambient;
	    };


	    var addSkybox = function() 
	    {
	    	if(gameRpgData.world.skybox.loaded === true) return;
	    	var skybox = gameRpgData.world.skybox;
	        var directions  = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"];
	        var imageSuffix = ".jpg";
	        var skyGeometry = new THREE.CubeGeometry( skybox.size );      
	        var materialArray = [];
	        for (var i = 0; i < 6; i++)
	        {
	        	var material = {
	                    map: THREE.ImageUtils.loadTexture( skybox.imagesPath + directions[i] + imageSuffix ),
	                    side: THREE.BackSide
	            };
	            materialArray.push( new THREE.MeshBasicMaterial( material ) );
	        }
	        var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
	        skybox.object   = new THREE.Mesh( skyGeometry, skyMaterial );
	        that.addToScene( skybox.object );
	        skybox.loaded = true;
	    };

	    var removeSkybox = function() 
	    {
	    	if(gameRpgData.world.skybox.loaded === false) return;
	    	this.removeFromScene( gameRpgData.world.skybox.object );
	    	gameRpgData.world.skybox.object = {};
	    	skybox.loaded = false;
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
	    	var model      = character.getModel();
	    	var gyro       = character.getGyro();
	    	var object     = character.getObject();
			model          = new THREE.MD2CharacterComplex();
			model.scale    = gameRpgData.player.params.scale;
			model.controls = controls;
			model.loadParts( gameRpgData.player.config );
			model.onLoadComplete = function () 
			{
			    //NO ANDROID 
			    //model.enableShadows( true );
			    //model.setWeapon( 0 );
			    model.setSkin( 0 );
			    model.root.position = character.getPosition();
			    model.params = { height: 2.5 };
			    that.addToScene( model.root );
			    object = model.root;
			    gyro = new THREE.Gyroscope();
			    gyro.add( camera );
			    model.root.add( gyro );
			    world.setCharacterLoaded( true );
			}
	    };

	    this.uninitializeCharacter = function() 
	    {
	    	var model      = character.getModel();
	    	var gyro       = character.getGyro();
			//model.root.remove( gyro );
			//gyro.remove( camera );
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
			var gm = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: false, map: gt, gtside: THREE.DoubleSide } ); //Faster ANDROID
			var gm = new THREE.MeshLambertMaterial( { color: 0xff0000, wireframe: false, map: gt, gtside: THREE.DoubleSide } ); //No ANDROID 
			//var gm = new THREE.MeshPhongMaterial( { color: 0xff0000, map: gt, bumpMap: gt, bumpScale: 2 } )
			var ground = new THREE.Mesh( gg, gm );
			ground.rotation.x = -1.57; //No ANDROID 
			var anisotropyMax = this.getMaxAnisotropy(); ground.material.map.anisotropy = this.getMaxAnisotropy();
			ground.material.map.repeat.set( 16, 16 );
			ground.material.map.wrapS = ground.material.map.wrapT = THREE.RepeatWrapping;
			ground.receiveShadow = true; //No ANDROID
			gameRpgData.world.ground.object = ground;
			this.addToScene( gameRpgData.world.ground.object );

			for( var y in map.world.ambientMap ) for( var x in map.world.ambientMap[y] ) 
			{
			    gg.vertices[ gridToStream( { x: x, y: y } ) ].z = map.world.heightMap[x][y];
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
	    };

	    this.uninitializeMap = function( map ) 
	    {
			for( var y = 0; y < map.world.ambientObjects.length; y++ ) for( var x = 0; x < map.world.ambientObjects[y].length; x++ ) 
			{
			    if( map.world.ambientObjects[y][x] !== 0 ) this.removeFromScene( map.world.ambientObjects[y][x].root );
			}
			this.removeFromScene( gameRpgData.world.ground.object );
	    };

	    this.initialize = function()
	    {
	    	htmlRender.initialize();
	    	htmlRender.add( this.callbackScreenResize );
			addScene();
			addCamera();
			addLight();
			//addSkybox();
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
			character.md2.update( delta, true );
			//for( var y = 0; y < gameRpgData.world.ambientObjects.length; y++ ) for( var x = 0; x < gameRpgData.world.ambientObjects[y].length; x++ ) if( gameRpgData.world.ambientObjects[y][x] !== 0 ) gameRpgData.world.ambientObjects[y][x].update( delta, false );
			htmlRender.render( scene, camera );
			if( stats ) stats.update();
	    };

	    this.getMaxAnisotropy = function()
	    {
			return htmlRender.getMaxAnisotropy();
	    };
	};
})();