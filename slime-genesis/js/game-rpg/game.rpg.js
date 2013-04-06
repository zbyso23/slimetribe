var Game = ( typeof Game === "undefined" ) ? {} : Game;
Game.Rpg = {
    delta: 0,
    refresh: function() {
	Game.Rpg.delta = clock.getDelta();
	requestAnimationFrame( Game.Rpg.refresh );
	Game.Rpg.refreshLogic();
	if( gameRpgData.character.loaded === true && Game.Rpg.World.ambientItemsLoaded === true ) {
	    Game.Rpg.World.spawn();
	    Game.Rpg.Scene.Renderer.refresh();
	    stats.update();
	}
	tick++;
    },
    refreshLogic: function() {
	if( gameRpgData.run ) {
	    if( !gameRpgData.world.ready ) {
		Game.Rpg.generateWorld();
	    } else {
		if( gameRpgData.character.loaded === true ) {
		    gameRpgData.character.torch.position.x = gameRpgData.character.object.position.x;
		    gameRpgData.character.torch.position.y = gameRpgData.character.object.position.y + 10;
		    gameRpgData.character.torch.position.z = gameRpgData.character.object.position.z;
		}
	    }
	} else {
	    //Blank - space for Menu etc.
	    gameRpgData.run = true;
	}
    },
    generateWorld: function() {
	if( gameDataImages.loadedRemain == 0 ) {
	    Game.Rpg.generateWorldGround();
	    
	    Game.Rpg.generateCharacter();
	    gameRpgData.world.ready = true;
	}
    },

    
    gameLoader: function() {
	gameDataImages.loadedRemain = gameDataImages.list.length;

	var gameHidden = document.createElement( 'div' );
	gameHidden.style['display'] = 'none';
	gameHidden.setAttribute( 'id', 'game-hidden' );
	document.body.appendChild( gameHidden );

	for( i = 0; i <= gameDataImages.list.length; i++ ) {
	    if( gameDataImages.list[i] === undefined ) {
		continue;
	    }
	    var id = gameDataImages.list[i].id;
	    var w = gameDataImages.list[i].w;
	    var h = gameDataImages.list[i].h;
	    gameResources.images[id].image = new Image();
	    gameResources.images[id].image.onload = function() {
		var canvas = document.createElement( 'canvas' );
		canvas.setAttribute( 'id', 'canvas-' + id );
		canvas.setAttribute( 'width', w );
		canvas.setAttribute( 'height', h );
		gameHidden.appendChild( canvas );
		gameResources.images[id].canvas = canvas.getContext( "2d" );
		gameResources.images[id].canvas.drawImage( gameResources.images[id].image, 0, 0 );
		--gameDataImages.loadedRemain;
	    }
	    gameResources.images[id].image.src = gameDataImages.list[i].url;
	}
    },
    
    generateWorldGround: function() {
	var map = GameRpgMaps.current;
	//  GROUND
	var gt = THREE.ImageUtils.loadTexture( map.config.groundTexture );
	var quality = 16, step = 1024 / quality;
	//gameResources.images[ map.config.groundMap ].w
	var ggGridX = map.config.gridX;
	var ggGridY = map.config.gridY;
	var gg = new THREE.PlaneGeometry( map.ground.width, map.ground.height, ggGridX, ggGridY );
	console.log( 'map.config.groundMap', map.config.groundMap );
	console.log( 'gameResources.images', gameResources.images );
	var groundHeightMap = gameResources.images[ map.config.groundMap ].canvas.getImageData( 0, 0, gameResources.images[ map.config.groundMap ].w, gameResources.images[ map.config.groundMap ].h );
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
	for( var y in map.world.ambientMap ) for( var x in map.world.ambientMap[y] ) {
	    gg.vertices[ Game.Rpg.gridToStream( { x: x, y: y } ) ].z = map.world.heightMap[x][y];
	    var coords = Game.Rpg.gridToCoords( { x: x, y: y, center: false } );
	    var reversedGrid = Game.Rpg.reverseGrid( { x: x, y: y } );
	    if( map.world.ambientMap[x][y] !== 255 ) {
		Game.Rpg.addAmbientObject( { id: map.world.ambientMap[x][y], x: coords.x, y: coords.y, z: map.world.heightMap[reversedGrid.x][reversedGrid.y], gridX: x, gridY: y } )
	    }
	}
	
	var shininess = 50;
	//ANDROID
	var gm = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: false, map: gt, gtside: THREE.DoubleSide } ); 
	//Faster ANDROID
	//var gm = new THREE.MeshLambertMaterial( { color: 0xff0000, wireframe: false, map: gt, gtside: THREE.DoubleSide } ); 
	//No ANDROID var gm = new THREE.MeshPhongMaterial( { color: 0xff0000, map: gt, bumpMap: gt, bumpScale: 2 } )
	var ground = new THREE.Mesh( gg, gm );
	ground.rotation.x = -1.57;
	//No ANDROID var anisotropyMax = renderer.getMaxAnisotropy(); ground.material.map.anisotropy = renderer.getMaxAnisotropy();
	ground.material.map.repeat.set( 16, 16 );
	ground.material.map.wrapS = ground.material.map.wrapT = THREE.RepeatWrapping;
	//No ANDROID ground.receiveShadow = true;
	gameRpgData.world.ground.object = ground;
	scene.add( gameRpgData.world.ground.object );
    },
    addAmbientObject: function( params ) {
	var found = false;
	for( a in GameRpgAmbientList ) {
	    if( GameRpgAmbientList[ a ].id == params.id ) {
		found = GameRpgAmbientList[ a ].object;
		break;
	    }
	}
	if( !found ) return false;
	var ambientObject = Game.Rpg.addAmbient( found.config, found.params.scale, { x: params.x + found.params.x, y: params.z, z: params.y + found.params.y, gridX: params.gridX, gridY: params.gridY, rot: found.params.rot, height: found.params.z, opacity: found.params.opacity, attributes: found.attributes } );
	if( typeof gameRpgData.world.ambientObjects[params.gridY] === "undefined" ) gameRpgData.world.ambientObjects[params.gridY] = [];
	gameRpgData.world.ambientObjects[params.gridY][params.gridX] = ambientObject;
    },
    generateCharacter: function() {
	gameRpgData.character.md2 = new THREE.MD2CharacterComplex();
	gameRpgData.character.md2.scale = gameRpgData.player.params.scale;
	gameRpgData.character.md2.controls = controls;
	gameRpgData.character.md2.loadParts( gameRpgData.player.config );
	gameRpgData.character.md2.onLoadComplete = function () {
	    //NO ANDROID gameRpgData.character.md2.enableShadows( true );
	    //gameRpgData.character.md2.setWeapon( 0 );
	    gameRpgData.character.md2.setSkin( 0 );
	    gameRpgData.character.md2.root.position.x = gameRpgData.character.position.x;
	    gameRpgData.character.md2.root.position.y = gameRpgData.character.position.y;
	    gameRpgData.character.md2.root.position.z = gameRpgData.character.position.z;
	    gameRpgData.character.md2.params = { height: 2.5 };
	    scene.add( gameRpgData.character.md2.root );
	    gameRpgData.character.object = gameRpgData.character.md2.root;
	    gameRpgData.character.loaded = true;
	    var gyro = new THREE.Gyroscope();
	    gyro.add( camera );
	    gameRpgData.character.md2.root.add( gyro );
	}
    },
    addAmbient: function( config, scale, params ) {
	var ambient = new THREE.MD2CharacterComplex();
	ambient.controls = Game.Utils.cloneObj( controls );
	ambient.scale = 1;
	ambient.scale = scale;
	ambient.loadParts( config );
	Game.Rpg.World.ambientItemsCount++;
	ambient.onLoadComplete = function ( c ) {
	    ambient.setSkin( 0 );
	    ambient.root.position.x = params.x;
	    //ambient.root.position.y = params.y;
	    ambient.root.position.y = params.y;
	    ambient.root.position.z = params.z;
	    ambient.bodyOrientation = params.rot;
	    ambient.params = { height: params.height };
	    ambient.attributes = Game.Utils.cloneObj( params.attributes );
	    ambient.meshBody.material.transparent = true;
	    ambient.meshBody.material.opacity = params.opacity;
	    scene.add( ambient.root );
	    GameRpgMaps.current.world.ambientObjects[params.gridX][params.gridY] = ambient;
	    --Game.Rpg.World.ambientItemsCount;
	    if( Game.Rpg.World.ambientItemsCount === 0 ) Game.Rpg.World.ambientItemsLoaded = true;
	}
	return ambient;
    },
    
    coordsToGrid: function( params ) {
	var map = GameRpgMaps.current;
	var stepX = Math.round( map.ground.width / map.config.gridX );
	var stepY = Math.round( map.ground.height / map.config.gridY );
	var x = ( map.ground.width / 2 ) - params.x;//map.character.object.position.x;
	var y = ( map.ground.height / 2 ) - params.y;//map.character.object.position.z;
	var gridX = Math.round( x / stepX );
	var gridY = Math.round( y / stepY );
	return { x: gridX, y: gridY };
    },
    gridToCoords: function( params ) {
	var map = GameRpgMaps.current;
	
	var stepX = Math.round( map.ground.width / map.config.gridX );
	var stepY = Math.round( map.ground.height / map.config.gridY );
	var coordsX = ( map.ground.width / 2 ) - ( params.x * stepX );
	var coordsY = ( map.ground.height / 2 ) - ( params.y * stepY );
	if( params.center === true ) {
	    //coordsX = ( ( gameRpgData.world.ground.width / 2 ) > params.x ) ? coordsX + ( stepX / 2 ) : coordsX - ( stepX / 2 );
	    //coordsY = ( ( gameRpgData.world.ground.height / 2 ) > params.x ) ? coordsY + ( stepY / 2 ) : coordsY - ( stepY / 2 );
	}
	return { x: coordsX, y: coordsY, center: params.center };
    },
    reverseGrid: function( params ) {
	var map = GameRpgMaps.current;
	return { x: ( map.config.gridX ) - params.x, y: ( map.config.gridY ) - params.y };
    },
    gridToStream: function( params ) {
	var map = GameRpgMaps.current;
	return ( parseInt( params.x ) + ( parseInt( params.y ) * ( map.config.gridX + 1 ) ) );
    },

    initialize: function() {
	Game.Rpg.gameLoader();
	Game.Rpg.Html.initialize();
	Game.Rpg.Scene.add();
	Game.Rpg.Scene.Renderer.add();
	Game.Rpg.Scene.Camera.add();
	Game.Rpg.Scene.Lights.simplyAdd();
	Game.Rpg.Stats.add();
	Game.Rpg.Events.initialize();
	Game.Rpg.Events.Tablet.initialize();
	Game.Rpg.Events.Mouse.initialize();
	Game.Rpg.Events.Keyboard.initialize();
	Game.Rpg.Scene.Projection.initialize();
	GameRpgMaps.setActiveToCurrent();
	Game.Rpg.refresh();
    }
};