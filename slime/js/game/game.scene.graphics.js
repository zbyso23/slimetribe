Game.Scene.Graphics = {};
Game.Scene.Graphics = {
    
    addGridCube: function( params ) {
	var geometry = new THREE.CubeGeometry( params.size, BATTLE_GRID.height, params.size );
	var material = new THREE.MeshBasicMaterial( { color: BATTLE_GRID.neutral.color, wireframe: false, transparent: BATTLE_GRID.transparent, opacity: 0.2, side: THREE.DoubleSide } )
	var mesh = new THREE.Mesh( geometry, material );
	mesh.position.x = params.x;
	mesh.position.y = params.y;
	mesh.position.z = params.z;
	gridModels[mesh.id] = { object: mesh, gridCords: params.gridX + ':' + params.gridY };
	if( typeof gridModelsCords[params.gridX] === "undefined" ) gridModelsCords[params.gridX] = [];
	gridModelsCords[params.gridX][params.gridY] = mesh.id;
	scene.add( mesh );
    },
    addHealthCube: function( params ) {
	var geometry = new THREE.CubeGeometry( params.size / 12, BATTLE_GRID.height, params.size );
	var material = new THREE.MeshBasicMaterial( { color: BATTLE_GRID.neutral.color, wireframe: false, transparent: BATTLE_GRID.transparent, opacity: 0.2, side: THREE.DoubleSide } )
	var mesh = new THREE.Mesh( geometry, material );
	mesh.position.x = params.x + params.size / 3;
	mesh.position.y = params.y + BATTLE_GRID.height;
	mesh.position.z = params.z;
	if( typeof gridHealthModels[params.gridX] === "undefined" ) gridHealthModels[params.gridX] = [];
	gridHealthModels[params.gridX][params.gridY] = mesh;
	scene.add( mesh );
    },
    setGridCube: function( cube, params ) {
	if( typeof params !== "undefined" && typeof params.color !== "undefined" && typeof params.opacity !== "undefined" ) {
	    cube.material.color = new THREE.Color( params.color );
	    cube.material.opacity = params.opacity;
	}
    },
    setHealthCube: function( cube, params, position ) {
	if( typeof params !== "undefined" && typeof params.color !== "undefined" && typeof params.opacity !== "undefined" ) {
	    cube.material.color = new THREE.Color( params.color );
	    cube.scale.z = ( position.size * 0.9 );
	    cube.position.z = position.x;
	    cube.material.opacity = params.opacity;
	}
    },
    addBattleGround: function() {
	if( typeof BATTLE.ground.textures.normal === "undefined" ) return false;
	var ggGridX = gameData.settings.graphics.models.groundGridX;
	var ggGridY = gameData.settings.graphics.models.groundGridY;
	var gg = new THREE.PlaneGeometry( gameData.battle.world.ground.width, gameData.battle.world.ground.height, ggGridX, ggGridY );
	var ggLength = gg.vertices.length;
	var ggLengthX = ggGridX;
	var ggLengthY = gg.vertices.length / ggGridY;
	var gt = THREE.ImageUtils.loadTexture( BATTLE.ground.textures.difuse );
	var anisotropySet = parseInt( gameData.settings.graphics.anisotropy );
	var anisotropyMax = renderer.getMaxAnisotropy();
	if( anisotropySet > anisotropyMax ) anisotropySet = anisotropyMax;
	gt.anisotropy = anisotropySet;
        if( gameData.settings.graphics.textures === "high" ) {
            var normalTexture = ( typeof BATTLE.ground.textures.normal !== "undefined" ) ? BATTLE.ground.textures.normal : BATTLE.ground.textures.difuse;
            var gNt = THREE.ImageUtils.loadTexture( normalTexture );
        }
        if( gameData.settings.graphics.textures === "medium" ) {
            var bumpTexture = ( typeof BATTLE.ground.textures.bump !== "undefined" ) ? BATTLE.ground.textures.bump : BATTLE.ground.textures.difuse;
            var gBt = THREE.ImageUtils.loadTexture( bumpTexture );
        }
        if( gameData.settings.graphics.textures === "high" ) {
            var gm = new THREE.MeshPhongMaterial( { color: BATTLE.ground.color, map: gt, bumpMap: gBt, bumpScale: BATTLE.ground.bump, normalMap:gNt, normalScale: BATTLE.ground.normalScale, specular: BATTLE.ground.specular, shininess: BATTLE.ground.shininess, shading: BATTLE.ground.shading } );    
        } else if( gameData.settings.graphics.textures === "medium" ) {
            var gm = new THREE.MeshPhongMaterial( { color: BATTLE.ground.color, map: gt, bumpMap: gBt, bumpScale: BATTLE.ground.bump, specular: BATTLE.ground.specular, shininess: BATTLE.ground.shininess, shading: BATTLE.ground.shading } );
        } else {
            var gm = new THREE.MeshPhongMaterial( { color: BATTLE.ground.color, map: gt, specular: BATTLE.ground.specular, shininess: BATTLE.ground.shininess, shading: BATTLE.ground.shading } );    
        }
	var ground = new THREE.Mesh( gg, gm );
	ground.rotation.x = BATTLE.ground.rotation;
	ground.material.map.wrapAround = true;
	gameData.battle.world.ground.object = ground;
	gameData.battle.world.ground.object.position.z += gameData.battle.world.ground.width / 2;
	gameData.battle.world.ground.object.position.x += gameData.battle.world.ground.width / 2;
	scene.add( gameData.battle.world.ground.object );
	if( gameData.settings.graphics.mobile === "off" ) Game.Scene.Graphics.setEffects( gameData.battle.world.ground.object );
    },
    addBattleAmbient: function() {
	var gat = THREE.ImageUtils.loadTexture( BATTLE.ambient.textures.difuse );
	var anisotropySet = parseInt( gameData.settings.graphics.anisotropy );
	var anisotropyMax = renderer.getMaxAnisotropy();
	if( anisotropySet > anisotropyMax ) anisotropySet = anisotropyMax;
	gat.anisotropy = anisotropySet;
        if( gameData.settings.graphics.textures === "high" ) {
            var normalTextureAmbient = ( typeof BATTLE.ambient.textures.normal !== "undefined" ) ? BATTLE.ambient.textures.normal : BATTLE.ambient.textures.difuse;
            var gaNt = THREE.ImageUtils.loadTexture( normalTextureAmbient );
            var gam = new THREE.MeshPhongMaterial( { color: BATTLE.ambient.color, map: gat, bumpMap: gaBt, bumpScale: BATTLE.ambient.bump, normalMap:gaNt, normalScale: BATTLE.ambient.normalScale, specular: BATTLE.ambient.specular, shininess: BATTLE.ambient.shininess, shading: BATTLE.ambient.shading } );    
        } else if( gameData.settings.graphics.textures === "medium" ) {
            var bumpTextureAmbient = ( typeof BATTLE.ambient.textures.bump !== "undefined" ) ? BATTLE.ambient.textures.bump : BATTLE.ambient.textures.difuse;
            var gaBt = THREE.ImageUtils.loadTexture( bumpTextureAmbient );
            var gam = new THREE.MeshPhongMaterial( { color: BATTLE.ambient.color, map: gat, bumpMap: gaBt, bumpScale: BATTLE.ambient.bump, specular: BATTLE.ambient.specular, shininess: BATTLE.ambient.shininess, shading: BATTLE.ambient.shading } );
        } else {
            var gam = new THREE.MeshPhongMaterial( { color: BATTLE.ambient.color, map: gat, specular: BATTLE.ambient.specular, shininess: BATTLE.ambient.shininess, shading: BATTLE.ambient.shading } );
        }
	
	gameData.battle.world.ambient.object = new THREE.Mesh( new THREE.CubeGeometry( 1600, 900, 40 ), gam );
	scene.add( gameData.battle.world.ambient.object );
	gameData.battle.world.ambient.object.rotation = BATTLE.ambient.rotation;
	gameData.battle.world.ambient.object.scale = BATTLE.ambient.scale;
	gameData.battle.world.ambient.object.position = BATTLE.ambient.position;
	if( gameData.settings.graphics.mobile === "off" ) Game.Scene.Graphics.setEffects( gameData.battle.world.ambient.object );
    },
    removeBattleAmbient: function() {
	scene.remove( gameData.battle.world.ambient.object );
    },
    removeBattleGround: function() {
	scene.remove( gameData.battle.world.ground.object );
    },
    setEffects: function( object ) {
	var anisotropySet = parseInt( gameData.settings.graphics.anisotropy );
	var anisotropyMax = renderer.getMaxAnisotropy();
	if( anisotropySet > anisotropyMax ) anisotropySet = anisotropyMax;
	object.receiveShadow = ( gameData.settings.graphics.shadows === "none" ) ? false : true;
	object.material.map.anisotropy = anisotropySet;
    }
};
