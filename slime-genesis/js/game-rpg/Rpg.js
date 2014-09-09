(function(){
	Game     = {};
	Game.Rpg = {};

	var clock = new THREE.Clock();
	var scene;

	Rpg = function()
	{
	    var delta  = 0;
	    var tick   = 0;
	    var gyro   = {};
	    var render = new RpgRender(this);

	    var refresh = function() 
	    {
			delta = clock.getDelta();
			requestAnimationFrame( refresh );
			refreshLogic();
			if( gameRpgData.run && gameRpgData.character.loaded && Game.Rpg.World.ambientItemsLoaded && gameDataImages.loaded ) 
			{
		    	Game.Rpg.World.spawn();
		    	render.refresh(delta);
		    	stats.update();
			}
			//utils.log('referesh');
			tick++;

    	};

	    var refreshLogic = function() 
	    {
			if( gameRpgData.run ) 
			{
			    if( !gameRpgData.world.ready ) 
			    {
					generateWorld();
			    } 
			    else 
			    {
					if( gameRpgData.character.loaded === true ) 
					{
						gameRpgData.character.torch.position.x = gameRpgData.character.object.position.x;
						gameRpgData.character.torch.position.y = gameRpgData.character.object.position.y + 10;
						gameRpgData.character.torch.position.z = gameRpgData.character.object.position.z;
					}
					//wizzard.refresh();
			    }
			} 
			else 
			{
			    //Blank - space for Menu etc.
			    //RUN manually - DEBUG and prepare menu
			    gameRpgData.run = true;
			}
	    };

	    var generateWorld = function() 
	    {
			if( gameDataImages.loaded ) 
			{
			    initializeMap();
			    //addSkybox();
			    initializeCharacter();
				//first AI
				wizzard = new GameRpgAIcharacter({
						hiddenLayers: 3, 
						hiddenLayerSize: 3, 
						learningRate: 0.23,
						input: ['moon', 'daytime', 'noise'],
						output: ['search', 'rest', 'collect']
					});
				wizzard.birth();
			    gameRpgData.world.ready = true;
			}
	    };

	    this.gameImagesLoader = function()
	    {
			gameDataImages.loadedRemain = 1;

			var gameHidden = document.createElement( 'div' );
			gameHidden.style['display'] = 'none';
			gameHidden.setAttribute( 'id', 'game-hidden' );
			document.body.appendChild( gameHidden );
			
			var map = GameRpgMaps.current;
			for( i = 0; i <= gameDataImages.list.length; i++ ) 
			{
			    if( gameDataImages.list[i] === undefined ) continue;
			    var id = gameDataImages.list[i].id;
			    var w = map.config.gridX + 1;
			    var h = map.config.gridY + 1;
			    gameResources.images.map.image = new Image();
			    gameResources.images.map.image.onload = function() 
			    {
					var canvas = document.createElement( 'canvas' );
					canvas.setAttribute( 'id', 'canvas-map' );
					canvas.setAttribute( 'width', w );
					canvas.setAttribute( 'height', h );
					gameHidden.appendChild( canvas );
					gameResources.images.map.canvas = canvas.getContext( "2d" );
					gameResources.images.map.canvas.drawImage( gameResources.images.map.image, 0, 0 );
					--gameDataImages.loadedRemain;
					if( gameDataImages.loadedRemain === 0 ) gameDataImages.loaded = true;
			    }
			    gameResources.images.map.image.src = map.config.groundImage;
			}
	    };

	    var initializeMap = function() 
	    {
			var map = GameRpgMaps.current;
			//  GROUND
			var gt = THREE.ImageUtils.loadTexture( map.config.groundTexture );
			var quality = 16, step = 1024 / quality;
			var ggGridX = map.config.gridX;
			var ggGridY = map.config.gridY;
			var gg = new THREE.PlaneGeometry( map.ground.width, map.ground.height, ggGridX, ggGridY );
			var groundHeightMap = gameResources.images.map.canvas.getImageData( 0, 0, gameResources.images.map.w, gameResources.images.map.h );
			var x = y = 0;
			map.world.ambientMap = [];
			map.world.collisionMap = [];
			map.world.ambientObjects = [];
			map.world.heightMap = [];
			var heightMap = [];
			var ambientRow = [];
			var heightRow = [];
			var collisionRow = [];
			var heightMap = [];
			var ambientObjectsRow = [];
			for( var i = 0, l = groundHeightMap.data.length; i < l; i = i + 4 ) {
			    if( i > 0 && i % ( ( ggGridX + 1 ) * 4 ) === 0 ) {
				map.world.ambientMap.push( ambientRow );
				map.world.collisionMap.push( collisionRow );
				map.world.heightMap.push( heightRow );
				map.world.ambientObjects.push( ambientObjectsRow );
				var ambientRow = [];
				var heightRow = [];
				var collisionRow = [];
				var ambientObjectsRow = [];
			    }
			    
			    var ambient = i
			    var heightMapIndex = i + 1;
			    var collisionIndex = i + 2;
			    ambientRow.push( groundHeightMap.data[ambient] );
			    
			    //if( groundHeightMap.data[ambient] !== 255 ) console.log( 'ambient ' + ambientRow.length - 1 + ' x ' + gameRpgData.world.ambientMap.length - 1 );
			    heightRow.push( groundHeightMap.data[ heightMapIndex ] / 3.3333333 );
			    heightMap.push( parseInt( groundHeightMap.data[ heightMapIndex ] ) / 3.3333333 );
			    collisionRow.push( groundHeightMap.data[ collisionIndex ] );
			    ambientObjectsRow.push( 0 );
			}
			map.world.ambientMap.push( ambientRow );
			map.world.ambientObjects.push( ambientObjectsRow );
			map.world.collisionMap.push( collisionRow );
			map.world.heightMap.push( heightRow );
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
			
			var shininess = 50;
			//ANDROID
			var gm = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: false, map: gt, gtside: THREE.DoubleSide } ); 
			//Faster ANDROID
			var gm = new THREE.MeshLambertMaterial( { color: 0xff0000, wireframe: false, map: gt, gtside: THREE.DoubleSide } ); 
			//No ANDROID 
			var gm = new THREE.MeshPhongMaterial( { color: 0xff0000, map: gt, bumpMap: gt, bumpScale: 2 } )
			var ground = new THREE.Mesh( gg, gm );
			ground.rotation.x = -1.57;
			//No ANDROID 
			var anisotropyMax = render.getMaxAnisotropy(); ground.material.map.anisotropy = render.getMaxAnisotropy();
			ground.material.map.repeat.set( 16, 16 );
			ground.material.map.wrapS = ground.material.map.wrapT = THREE.RepeatWrapping;
			//No ANDROID 
			ground.receiveShadow = true;
			gameRpgData.world.ground.object = ground;
			scene.add( gameRpgData.world.ground.object );
	    };

	    this.uninitializeMap = function() 
	    {
			var map = GameRpgMaps.current;
			for( var y = 0; y < map.world.ambientObjects.length; y++ ) for( var x = 0; x < map.world.ambientObjects[y].length; x++ ) 
			{
			    if( map.world.ambientObjects[y][x] !== 0 ) scene.remove( map.world.ambientObjects[y][x].root );
			}
			scene.remove( gameRpgData.world.ground.object );
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
	        skybox.object = new THREE.Mesh( skyGeometry, skyMaterial );
	        scene.add( skybox.object );
	        skybox.loaded = true;
	    };

	    this.removeSkybox = function() 
	    {
	    	if(gameRpgData.world.skybox.loaded === false) return;
	    	scene.remove( gameRpgData.world.skybox.object );
	    	gameRpgData.world.skybox.object = {};
	    	skybox.loaded = false;
	    };

	    var addAmbientObject = function( params ) 
	    {
			var found = false;
			for( a in GameRpgAmbientList ) {
			    if( GameRpgAmbientList[ a ].id == params.id ) {
				found = GameRpgAmbientList[ a ].object;
				break;
			    }
			}
			if( !found ) return false;
			var ambientParams = { 
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
			Game.Rpg.World.ambientItemsCount++;
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
			    scene.add( ambient.root );
			    GameRpgMaps.current.world.ambientObjects[params.gridX][params.gridY] = ambient;
			    --Game.Rpg.World.ambientItemsCount;
			    if( Game.Rpg.World.ambientItemsCount === 0 ) Game.Rpg.World.ambientItemsLoaded = true;
			}
			return ambient;
	    };

	    var initializeCharacter = function() 
	    {
			gameRpgData.character.md2 = new THREE.MD2CharacterComplex();
			gameRpgData.character.md2.scale = gameRpgData.player.params.scale;
			gameRpgData.character.md2.controls = controls;
			gameRpgData.character.md2.loadParts( gameRpgData.player.config );
			gameRpgData.character.md2.onLoadComplete = function () 
			{
			    //NO ANDROID 
			    gameRpgData.character.md2.enableShadows( true );
			    //gameRpgData.character.md2.setWeapon( 0 );
			    gameRpgData.character.md2.setSkin( 0 );
			    gameRpgData.character.md2.root.position.x = gameRpgData.character.position.x;
			    gameRpgData.character.md2.root.position.y = gameRpgData.character.position.y;
			    gameRpgData.character.md2.root.position.z = gameRpgData.character.position.z;
			    gameRpgData.character.md2.params = { height: 2.5 };
			    scene.add( gameRpgData.character.md2.root );
			    gameRpgData.character.object = gameRpgData.character.md2.root;
			    gameRpgData.character.loaded = true;
			    gameRpgData.character.gyro = new THREE.Gyroscope();
			    gameRpgData.character.gyro.add( camera );
			    gameRpgData.character.md2.root.add( gameRpgData.character.gyro );
			}
	    };

	    this.uninitializeCharacter = function() 
	    {
		//gameRpgData.character.md2.root.remove( gameRpgData.character.gyro );
		//gameRpgData.character.gyro.remove( camera );
			scene.remove( gameRpgData.character.md2.root );
	    };

	    var coordsToGrid = function( params ) 
	    {
			var map = GameRpgMaps.current;
			var stepX = Math.round( map.ground.width / map.config.gridX );
			var stepY = Math.round( map.ground.height / map.config.gridY );
			var x = ( map.ground.width / 2 ) - params.x;//map.character.object.position.x;
			var y = ( map.ground.height / 2 ) - params.y;//map.character.object.position.z;
			var gridX = Math.round( x / stepX );
			var gridY = Math.round( y / stepY );
			return { x: gridX, y: gridY };
	    };

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

	    this.run = function() 
	    {
			Game.Rpg.Html.initialize();
			render.add();
			render.addScene();
			render.addCamera();
			render.addLight();
			render.addStats();
			Game.Rpg.Events.initialize();
			Game.Rpg.Events.Tablet.initialize();
			Game.Rpg.Events.Mouse.initialize();
			Game.Rpg.Events.Keyboard.initialize();
			//disabled - refactor; Game.Rpg.Scene.Projection.initialize();
			GameRpgMaps.setActiveToCurrent();
			this.gameImagesLoader();
		//	Game.Rpg.AI.birthWizzard(); //New
			refresh();
	    };
	    
	    this.switchMap = function( map ) 
	    {
			try 
			{
			    if( !GameRpgMaps.mapExists( map ) ) throw "map dont exists";
			    gameRpgData.run = false;
			    this.uninitializeMap();
			    //Game.Rpg.removeSkybox();
			    this.uninitializeCharacter();
			    GameRpgMaps.setActive( map );
			    GameRpgMaps.setActiveToCurrent();
			    this.gameImagesLoader();
			    this.initializeCharacter();
			    //Game.Rpg.addSkybox();
			    this.initializeMap();
			    gameRpgData.run = true;
			} 
			catch( e ) 
			{
			    throw e;
			}
			return true;
	    };
	};

})();
