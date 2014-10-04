THREE.MD2Simple = function () 
{
	var scope = this;
	this.scale = 1;
	this.myPi = 3.14;
	// animation parameters
	this.animationFPS = 9;
	this.transitionFrames = 15;
	
	// rig
	this.root = new THREE.Object3D();
	this.meshBody = null;
	this.controls = null;
	// skins
	this.skinsBody = [];
	this.currentSkin = undefined;
	this.onLoadComplete = function () {};
	// internals
	this.meshes = [];
	this.animations = {};
	this.loadCounter = 0;
	this.params = {};
	// internal movement control variables

	this.activeAnimation = null;
	this.oldAnimation = null;

	// API

	this.enableShadows = function ( enable ) {
	    for ( var i = 0; i < this.meshes.length; i ++ ) {
		this.meshes[ i ].castShadow = enable;
		this.meshes[ i ].receiveShadow = enable;
	    }
	};

	this.setVisible = function ( enable ) {
	    for ( var i = 0; i < this.meshes.length; i ++ ) {
		this.meshes[ i ].visible = enable;
		this.meshes[ i ].visible = enable;
	    }
	};
	
	this.coordsToGrid = function( ) {
		var map = GameRpgMaps.current;
		var stepX = Math.round( map.ground.width / map.config.gridX );
		var stepY = Math.round( map.ground.height / map.config.gridY );
		var x = ( map.ground.width / 2 ) - params.x;//map.character.object.position.x;
		var y = ( map.ground.height / 2 ) - params.y;//map.character.object.position.z;
		var gridX = Math.round( x / stepX );
		var gridY = Math.round( y / stepY );
		return { x: gridX, y: gridY };

	}
	
	this.setHeight = function () {
	    var map = GameRpgMaps.current;
	    var grid = Game.Rpg.coordsToGrid( { x: this.root.position.x, y: this.root.position.z } );
	    
	    if( grid.x < 0 || grid.Y < 0 || grid.x > map.config.gridX || grid.y > map.config.gridY ) return;
	    var reversedGrid = Game.Rpg.reverseGrid( grid );
	    var diff = ( this.root.position.y - map.world.heightMap[reversedGrid.x][reversedGrid.y] );
	    if( Math.abs( diff ) > 2 ) {
		var target = ( diff > 0 ) ? diff : diff * -1;
		target = ( target / ( this.animationFPS * 2.3 ) );
		this.root.position.y = ( diff > 0 ) ? this.root.position.y - target : this.root.position.y + target;
	    }
	}

	this.loadParts = function ( config ) 
	{
	    this.animations = config.animations;
	    this.walkSpeed = config.walkSpeed;
	    this.loadCounter = config.skins.length + 1;
	    // SKINS
	    this.skinsBody = loadTextures( config.baseUrl + "skins/", config.skins );
	    // BODY
	    var loader = new THREE.JSONLoader();
	    loader.load( config.baseUrl + config.body, function( geo ) {
		geo.computeBoundingBox();
		scope.root.position.y = - scope.scale * geo.boundingBox.min.y;
		var mesh = createPart( geo, scope.skinsBody[ 0 ] );
		mesh.scale.set( scope.scale, scope.scale, scope.scale );
		scope.root.add( mesh );

		scope.meshBody = mesh;
		scope.meshes.push( mesh );
		checkLoadingComplete();
	    } );
	};

	this.setPlaybackRate = function ( rate ) {
	    if ( this.meshBody ) this.meshBody.duration = this.meshBody.baseDuration / rate;
	};

	this.setWireframe = function ( wireframeEnabled ) {
	    if ( wireframeEnabled ) {
		if ( this.meshBody ) this.meshBody.material = this.meshBody.materialWireframe;
	    } else {
		if ( this.meshBody ) this.meshBody.material = this.meshBody.materialTexture;
	    }
	};

	this.setSkin = function( index ) {
	    if ( this.meshBody && this.meshBody.material.wireframe === false ) {
		this.meshBody.material.map = this.skinsBody[ index ];
		this.currentSkin = index;
	    }
	};

	this.setAnimation = function ( animationName ) {
	    if ( animationName === this.activeAnimation || !animationName ) return;
	    if ( this.meshBody ) {
		this.meshBody.setAnimationWeight( animationName, 0 );
		this.meshBody.playAnimation( animationName );

		this.oldAnimation = this.activeAnimation;
		this.activeAnimation = animationName;

		this.blendCounter = this.transitionFrames;
	    }
	    if ( this.meshWeapon ) {
		this.meshWeapon.setAnimationWeight( animationName, 0 );
		this.meshWeapon.playAnimation( animationName );
	    }
	};

	this.update = function ( delta, character ) {
	    if ( this.animations ) 
	    {
			this.updateBehaviors( delta );
			this.updateAnimations( delta );
	    }
	};

	this.updateAnimations = function ( delta ) 
	{
	    var mix = 1;
	    if ( this.blendCounter > 0 ) 
	    {
			mix = ( this.transitionFrames - this.blendCounter ) / this.transitionFrames;
			this.blendCounter -= 1;
	    }
	    if ( this.meshBody ) 
	    {
			this.meshBody.update( delta );
			this.meshBody.setAnimationWeight( this.activeAnimation, mix );
			this.meshBody.setAnimationWeight( this.oldAnimation,  1 - mix );
	    }
	};

	this.updateBehaviors = function ( delta ) 
	{
	    var animations = this.animations;
	    this.setAnimation( animations[ "idle" ] );
	};

	// internal helpers
	function loadTextures( baseUrl, textureUrls ) 
	{
	    var mapping = new THREE.UVMapping();
	    var textures = [];
	    for ( var i = 0; i < textureUrls.length; i ++ ) {
		textures[ i ] = THREE.ImageUtils.loadTexture( baseUrl + textureUrls[ i ], mapping, checkLoadingComplete );
		textures[ i ].name = textureUrls[ i ];
	    }
	    return textures;
	};

	function createPart( geometry, skinMap ) 
	{
	    geometry.computeMorphNormals();
	    var materialTexture = new THREE.MeshBasicMaterial( { color: 0xffffff, specular: 0x111111, shininess: 50, wireframe: false, map: skinMap, morphTargets: true, morphNormals: true } );
	    materialTexture.wrapAround = true;
	    var mesh = new THREE.MorphBlendMesh( geometry, materialTexture );
	    mesh.rotation.y = -Math.PI/2;
	    mesh.materialTexture = materialTexture;
	    mesh.autoCreateAnimations( scope.animationFPS );
	    return mesh;
	};

	function checkLoadingComplete() 
	{
	    scope.loadCounter -= 1;
	    if ( scope.loadCounter === 0 ) 	scope.onLoadComplete();
	};
	function exponentialEaseOut( k ) { return k === 1 ? 1 : - Math.pow( 2, - 10 * k ) + 1; }
};
