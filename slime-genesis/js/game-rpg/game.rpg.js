var Game = ( typeof Game === "undefined" ) ? {} : Game;
Game.Rpg = {
    refresh: function() {
	requestAnimationFrame( Game.Rpg.refresh );
	Game.Rpg.refreshLogic();
	Game.Rpg.refreshAmbient();
	Game.Rpg.Scene.Renderer.refresh();
	stats.update();
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
    refreshAmbient: function() {
	/*
	for( i in gameRpgData.world.ambientMap ) {
	    if( typeof gameRpgData.world.ambientMap[ i ] === "undefined" || typeof gameRpgData.world.ambientMap[ i ].attributes === "undefined" || gameRpgData.world.ambientMap[ i ].attributes.timeout === 0 || gameRpgData.world.ambientMap[ i ].attributes.spawn === false ) continue;
	    gameRpgData.world.ambientMap[ i ].attributes.timeout -= 1;
	    if( gameRpgData.world.ambientMap[ i ].attributes.timeout === 0 ) {
		gameRpgData.world.ambientMap[ i ].meshBody.visible = true;
	    }
	}*/
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
	//  GROUND
	var gt = THREE.ImageUtils.loadTexture( "slime-genesis/textures/terrain/grass-1024.jpg" );
	var quality = 16, step = 1024 / quality;
	var ggGridX = gameRpgData.settings.graphics.models.groundGridX;
	var ggGridY = gameRpgData.settings.graphics.models.groundGridY;
	var gg = new THREE.PlaneGeometry( gameRpgData.world.ground.width, gameRpgData.world.ground.height, ggGridX, ggGridY );
	
	groundHeightMap = gameResources.images['ground-test1-128'].canvas.getImageData( 0, 0, gameResources.images['ground-test1-128'].w, gameResources.images['ground-test1-128'].h );
	var x = y = 0;
	gameRpgData.world.ambientMap = [];
	var heightMap = [];
	var ambientRow = [];
	var heightRow = [];
	var collisionRow = [];
	var heightMap = [];
	var ambientObjectsRow = [];
	gameRpgData.world.ambientObjects = [];
	for( var i = 0, l = groundHeightMap.data.length; i < l; i = i + 4 ) {
	    if( i > 0 && i % ( ( gameRpgData.settings.graphics.models.groundGridX + 1 ) * 4 ) === 0 ) {
		gameRpgData.world.ambientMap.push( ambientRow );
		gameRpgData.world.collisionMap.push( collisionRow );
		gameRpgData.world.heightMap.push( heightRow );
		gameRpgData.world.ambientObjects.push( ambientObjectsRow );
		var ambientRow = [];
		var heightRow = [];
		var collisionRow = [];
		var ambientObjectsRow = [];
	    }
	    
	    var ambient = i
	    var map = i + 1;
	    var collision = i + 2;
	    ambientRow.push( groundHeightMap.data[ambient] );
	    heightRow.push( groundHeightMap.data[map] / 3.3333333 );
	    heightMap.push( parseInt( groundHeightMap.data[map] ) / 3.3333333 );
	    collisionRow.push( groundHeightMap.data[collision] );
	    ambientObjectsRow.push( 0 );
	}
	gameRpgData.world.ambientMap.push( ambientRow );
	gameRpgData.world.collisionMap.push( collisionRow );
	gameRpgData.world.heightMap.push( heightRow );

	for( var i = 0, l = gg.vertices.length; i < l; i++ ) gg.vertices[ i ].z = heightMap[i];
	for( var y in gameRpgData.world.ambientMap ) for( var x in gameRpgData.world.ambientMap[y] ) {
	    var coords = Game.Rpg.gridToCoords( { x: x, y: y, center: true } );
	    if( gameRpgData.world.ambientMap[y][x] !== 255 ) Game.Rpg.addAmbientObject( { id: gameRpgData.world.ambientMap[y][x], x: coords.x, y: coords.y, z: gameRpgData.world.heightMap[y][x], gridX: x, gridY: y } )
	}
	
	console.log( 'gameRpgData.world.ambientObjects', gameRpgData.world.ambientObjects );
	
	var shininess = 50;
	//ANDROID
	var gm = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: false, map: gt, gtside: THREE.DoubleSide } ); 
	//Faster ANDROID
	//var gm = new THREE.MeshLambertMaterial( { color: 0xff0000, wireframe: false, map: gt, gtside: THREE.DoubleSide } ); 
	//No ANDROID var gm = new THREE.MeshPhongMaterial( { color: 0xff0000, map: gt, bumpMap: gt, bumpScale: 2 } )
	var ground = new THREE.Mesh( gg, gm );
	ground.rotation.x = -1.57;
	//No ANDROID var anisotropyMax = renderer.getMaxAnisotropy(); ground.material.map.anisotropy = renderer.getMaxAnisotropy();
	ground.material.map.repeat.set( 2, 2 );
	ground.material.map.wrapS = ground.material.map.wrapT = THREE.RepeatWrapping;
	//No ANDROID ground.receiveShadow = true;
	gameRpgData.world.ground.object = ground;
	scene.add( gameRpgData.world.ground.object );
	/*var ggSky = new THREE.SphereGeometry( 90, 32, 32 );
	var gmSky = new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe: false, map: gt, gtside: THREE.DoubleSide } );
	var sky = new THREE.Mesh( ggSky, gmSky );
	sky.scale.set( -6, -6, -6 );
	gameRpgData.world.sky.object = sky;
	scene.add( gameRpgData.world.sky.object );*/
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
	var ambientObject = Game.Rpg.addAmbient( found.config, found.params.scale, { x: params.x + found.params.x, y: params.z, z: params.y + found.params.y, rot: found.params.rot, height: found.params.z, opacity: found.params.opacity, attributes: found.attributes } );
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
	ambient.onLoadComplete = function ( c ) {
	    ambient.setSkin( 0 );
	    ambient.root.position.x = params.x;
	    ambient.root.position.y = params.y;
	    ambient.root.position.z = params.z;
	    ambient.bodyOrientation = params.rot;
	    ambient.params = { height: params.height };
	    ambient.attributes = Game.Utils.cloneObj( params.attributes );
	    ambient.meshBody.material.transparent = true;
	    ambient.meshBody.material.opacity = params.opacity;
	    scene.add( ambient.root );
	    gameRpgData.world.ambientObjects.push( ambient );
	}
	console.log( 'params ambient', params );
	return ambient;
    },
    
    coordsToGrid: function( params ) {
	var stepX = Math.round( gameRpgData.world.ground.width / gameRpgData.settings.graphics.models.groundGridX );
	var stepY = Math.round( gameRpgData.world.ground.height / gameRpgData.settings.graphics.models.groundGridY );
	var x = ( gameRpgData.world.ground.width / 2 ) - params.x;//gameRpgData.character.object.position.x;
	var y = ( gameRpgData.world.ground.height / 2 ) - params.y;//gameRpgData.character.object.position.z;
	var gridX = ( gameRpgData.settings.graphics.models.groundGridX + 1 ) - Math.round( x / stepX );
	var gridY = ( gameRpgData.settings.graphics.models.groundGridY + 1 ) - Math.round( y / stepY );
	return { x: gridX, y: gridY };
    },
    gridToCoords: function( params ) {
	var stepX = Math.round( gameRpgData.world.ground.width / gameRpgData.settings.graphics.models.groundGridX );
	var stepY = Math.round( gameRpgData.world.ground.height / gameRpgData.settings.graphics.models.groundGridY );
	var coordsX = ( gameRpgData.world.ground.width / 2 ) - ( params.x * stepX );
	var coordsY = ( gameRpgData.world.ground.height / 2 ) - ( params.y * stepY );
	coordsX = ( params.center === true ) ? coordsX + ( stepX / 2 ) : coordsX;
	coordsY = ( params.center === true ) ? coordsY + ( stepY / 2 ) : coordsY;
	return { x: coordsX, y: coordsY, center: params.center };
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
	Game.Rpg.Scene.Projection.initialize();
	Game.Rpg.refresh();
    }
};