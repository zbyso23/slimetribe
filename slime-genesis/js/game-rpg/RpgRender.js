(function(){
	IRpgRender = 
	{
		this.imagesLoader = function() {},
		this.refreshGuiContent = function( stats, items ) {},
		this.callbackImagesLoaderError = function() {},
	    this.callbackScreenResize = function( event ) {},
	    this.addToScene = function( object ) {},
	    this.removeFromScene = function( object ) {},
	    this.initializeCharacter = function() {},
	    this.uninitializeCharacter = function() {},
	    this.initializeMap = function( map ) {},
	    this.uninitializeMap = function( map ) {},
	    this.initialize = function() {},
	    this.refresh = function(delta) {},
	    this.getMaxAnisotropy = function() {}
	}

	RpgRender = function( world )
	{
		var that = this;
		var scene;
		var camera;
		var light;
		var stats;
		var htmlRender = new HtmlRender( this );

	    var gridToCoords = function( params ) 
	    {
			var map = GameRpgMaps.current;
			
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
			var map = GameRpgMaps.current;
			return { x: ( map.config.gridX ) - params.x, y: ( map.config.gridY ) - params.y };
	    };

	    var gridToStream = function( params ) 
	    {
			var map = GameRpgMaps.current;
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
			gameRpgData.character.torch = new THREE.PointLight( 0xffffff, 1, 50 );
			scene.add( gameRpgData.character.torch );
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
			    GameRpgMaps.current.world.ambientObjects[params.gridX][params.gridY] = ambient;
			    world.removeAmbientItem();
			    if( world.getAmbientItems() === 0 ) world.ambientItemsLoaded = true;
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
	};

	RpgRender.prototype = Object.create(IRpgRender);

	RpgRender.prototype.imagesLoader = function()
	{
		htmlRender.imagesLoader( this.callbackImagesLoaderError );
	};

	RpgRender.prototype.refreshGuiContent = function( stats, items )
	{
		htmlRender.refreshGuiContent( stats, items );
	}

	RpgRender.prototype.callbackImagesLoaderError = function()
	{
		utils.log('pause');
		world.pause();
	};

    RpgRender.prototype.callbackScreenResize = function( event ) 
    {
		camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
		camera.updateProjectionMatrix();
		htmlRender.refreshButtons();
		htmlRender.refreshGui();
    };

    RpgRender.prototype.addToScene = function( object )
    {
    	if( false === utils.isObject( object ) ) return;
    	scene.add( object );
    };

    RpgRender.prototype.removeFromScene = function( object )
    {
    	if( false === utils.isObject( object ) ) return;
    	scene.remove( object );
    };

    RpgRender.prototype.initializeCharacter = function() 
    {
		gameRpgData.character.md2 = new THREE.MD2CharacterComplex();
		gameRpgData.character.md2.scale = gameRpgData.player.params.scale;
		gameRpgData.character.md2.controls = controls;
		gameRpgData.character.md2.loadParts( gameRpgData.player.config );
		gameRpgData.character.md2.onLoadComplete = function () 
		{
		    //NO ANDROID 
		    //gameRpgData.character.md2.enableShadows( true );
		    //gameRpgData.character.md2.setWeapon( 0 );
		    gameRpgData.character.md2.setSkin( 0 );
		    gameRpgData.character.md2.root.position.x = gameRpgData.character.position.x;
		    gameRpgData.character.md2.root.position.y = gameRpgData.character.position.y;
		    gameRpgData.character.md2.root.position.z = gameRpgData.character.position.z;
		    gameRpgData.character.md2.params = { height: 2.5 };
		    that.addToScene( gameRpgData.character.md2.root );
		    gameRpgData.character.object = gameRpgData.character.md2.root;
		    gameRpgData.character.gyro = new THREE.Gyroscope();
		    gameRpgData.character.gyro.add( camera );
		    gameRpgData.character.md2.root.add( gameRpgData.character.gyro );
		    gameRpgData.character.loaded = true;
		}
    };

    RpgRender.prototype.uninitializeCharacter = function() 
    {
		//gameRpgData.character.md2.root.remove( gameRpgData.character.gyro );
		//gameRpgData.character.gyro.remove( camera );
		this.removeFromScene( gameRpgData.character.md2.root );
    };

    RpgRender.prototype.initializeMap = function( map )
    {
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

    RpgRender.prototype.uninitializeMap = function( map ) 
    {
		for( var y = 0; y < map.world.ambientObjects.length; y++ ) for( var x = 0; x < map.world.ambientObjects[y].length; x++ ) 
		{
		    if( map.world.ambientObjects[y][x] !== 0 ) this.removeFromScene( map.world.ambientObjects[y][x].root );
		}
		this.removeFromScene( gameRpgData.world.ground.object );
    };

    RpgRender.prototype.initialize = function()
    {
    	htmlRender.initialize();
    	htmlRender.add( this.callbackScreenResize );
		addScene();
		addCamera();
		addLight();
		//addSkybox();
		addStats();
    };

    RpgRender.prototype.refresh = function(delta) 
    {
		if ( t > 1 ) t = 0;
		//cameraControls.update( delta );
		//refactor; if( gameRpgData.character.loaded ) 
		gameRpgData.character.torch.position.x = gameRpgData.character.object.position.x;
		gameRpgData.character.torch.position.y = gameRpgData.character.object.position.y + 10;
		gameRpgData.character.torch.position.z = gameRpgData.character.object.position.z;
		gameRpgData.character.md2.update( delta, true );
		
		//for( var y = 0; y < gameRpgData.world.ambientObjects.length; y++ ) for( var x = 0; x < gameRpgData.world.ambientObjects[y].length; x++ ) if( gameRpgData.world.ambientObjects[y][x] !== 0 ) gameRpgData.world.ambientObjects[y][x].update( delta, false );
		htmlRender.render( scene, camera );
		if( stats ) stats.update();
    };

    RpgRender.prototype.getMaxAnisotropy = function()
    {
		return renderer.getMaxAnisotropy();
    };
})();