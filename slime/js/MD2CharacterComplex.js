/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.MD2CharacterComplex = function () {

	var scope = this;
	

	this.scale = 1;
	this.myPi = 3.14;
	// animation parameters

	this.animationFPS = 4;
	this.transitionFrames = 4;
	this.orientations = {};

       this.invert = { 'x': true, 'z': true };

	// movement model parameters
	this.maxSpeed = 475;
	this.maxReverseSpeed = -175;

	this.frontAcceleration = 70;
	this.backAcceleration = 70;

	this.frontDecceleration = 100;

	this.angularSpeed = 2.5;

	// rig

	this.root = new THREE.Object3D();

	this.meshBody = null;
	this.meshWeapon = null;

	this.controls = null;

	// skins

	this.skinsBody = [];
	this.skinsWeapon = [];

	this.weapons = [];

	this.currentSkin = undefined;

	this.onLoadComplete = function () {};

	// internals

	this.meshes = [];
	this.animations = {};

	this.loadCounter = 0;

	// internal movement control variables

	this.speed = 0;
	this.bodyOrientation = (Math.PI * 2);

	this.walkSpeed = this.maxSpeed;
	this.crouchSpeed = this.maxSpeed * 0.5;

	// internal animation parameters

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
	
	this.unlockKeys = function ( ) {
	    controls.lockForward = false;
	    controls.lockBackward = false;
	}
	
	this.setBodyOrientation = function ( orientation ) {
		this.bodyOrientation = orientation;
	};

	this.shareParts = function ( original ) {
		this.animations = original.animations;
		this.walkSpeed = original.walkSpeed;
		this.crouchSpeed = original.crouchSpeed;

		this.skinsBody = original.skinsBody;
		this.skinsWeapon = original.skinsWeapon;

		// BODY
		if( typeof this.skinsBody[ 1 ] === "undefined" ) {
		    var mesh = createPart( original.meshBody.geometry, this.skinsBody[ 0 ] );
		} else if( typeof this.skinsBody[ 2 ] === "undefined" ) {
		    var mesh = createPart( original.meshBody.geometry, this.skinsBody[ 0 ], this.skinsBody[ 1 ] );
		} else {
		    var mesh = createPart( original.meshBody.geometry, this.skinsBody[ 0 ], this.skinsBody[ 1 ], this.skinsBody[ 2 ] );
		}
		mesh.scale.set( this.scale, this.scale, this.scale );
		this.root.position.y = original.root.position.y;
		this.root.add( mesh );
		this.meshBody = mesh;
		this.meshes.push( mesh );

		// WEAPONS
		for ( var i = 0; i < original.weapons.length; i ++ ) {
			var meshWeapon = createPart( original.weapons[ i ].geometry, this.skinsWeapon[ i ] );
			meshWeapon.scale.set( this.scale, this.scale, this.scale );
			meshWeapon.visible = false;
			meshWeapon.name = original.weapons[ i ].name;
			this.root.add( meshWeapon );
			this.weapons[ i ] = meshWeapon;
			this.meshWeapon = meshWeapon;
			this.meshes.push( meshWeapon );
		}
	};

	this.loadParts = function ( config ) {
		this.animations = config.animations;
		this.walkSpeed = config.walkSpeed;
		this.crouchSpeed = config.crouchSpeed;
		this.orientations = config.orientations;
		if( typeof config.invert !== "undefined" ) {
		    this.invert = config.invert;
		}

		this.loadCounter = config.weapons.length * 2 + config.skins.length + 1;

		var weaponsTextures = []
		for ( var i = 0; i < config.weapons.length; i ++ ) weaponsTextures[ i ] = config.weapons[ i ][ 1 ];

		// SKINS
		this.skinsBody = loadTextures( config.baseUrl + "skins/", config.skins );
		this.skinsWeapon = loadTextures( config.baseUrl + "skins/", weaponsTextures );

		// BODY
		var loader = new THREE.JSONLoader();

		loader.load( config.baseUrl + config.body, function( geo ) {
			geo.computeBoundingBox();
			scope.root.position.y = - scope.scale * geo.boundingBox.min.y;

			if( typeof scope.skinsBody[ 0 ] === "undefined" ) {
			    var mesh = createPart( geo, scope.skinsBody[ 0 ] );
			} else if( typeof scope.skinsBody[ 1 ] === "undefined" ) {
			    var mesh = createPart( geo, scope.skinsBody[ 0 ], scope.skinsBody[ 1 ] );
			} else {
			    var mesh = createPart( geo, scope.skinsBody[ 0 ], scope.skinsBody[ 1 ], scope.skinsBody[ 2 ] );
			}
			mesh.scale.set( scope.scale, scope.scale, scope.scale );

			scope.root.add( mesh );

			scope.meshBody = mesh;
			scope.meshes.push( mesh );

			checkLoadingComplete();

		} );

		// WEAPONS
		var generateCallback = function ( index, name ) {
			return function( geo ) {
				var mesh = createPart( geo, scope.skinsWeapon[ index ] );
				mesh.scale.set( scope.scale, scope.scale, scope.scale );
				mesh.visible = false;
				mesh.name = name;
				scope.root.add( mesh );
				scope.weapons[ index ] = mesh;
				scope.meshWeapon = mesh;
				scope.meshes.push( mesh );
				checkLoadingComplete();
			}
		}

		for ( var i = 0; i < config.weapons.length; i ++ ) {
			loader.load( config.baseUrl + config.weapons[ i ][ 0 ], generateCallback( i, config.weapons[ i ][ 0 ] ) );
		}
	};

	this.setPlaybackRate = function ( rate ) {
		if ( this.meshBody ) this.meshBody.duration = this.meshBody.baseDuration / rate;
		if ( this.meshWeapon ) this.meshWeapon.duration = this.meshWeapon.baseDuration / rate;
	};

	this.setWireframe = function ( wireframeEnabled ) {
		if ( wireframeEnabled ) {
			if ( this.meshBody ) this.meshBody.material = this.meshBody.materialWireframe;
			if ( this.meshWeapon ) this.meshWeapon.material = this.meshWeapon.materialWireframe;
		} else {
			if ( this.meshBody ) this.meshBody.material = this.meshBody.materialTexture;
			if ( this.meshWeapon ) this.meshWeapon.material = this.meshWeapon.materialTexture;
		}
	};

	this.setSkin = function( index ) {
		if ( this.meshBody && this.meshBody.material.wireframe === false ) {
			this.meshBody.material.map = this.skinsBody[ index ];
			this.currentSkin = index;
		}
	};

	this.setWeapon = function ( index ) {
		for ( var i = 0; i < this.weapons.length; i ++ ) this.weapons[ i ].visible = false;
		var activeWeapon = this.weapons[ index ];
		if ( activeWeapon ) {
			activeWeapon.visible = true;
			this.meshWeapon = activeWeapon;

			if ( this.activeAnimation ) {
				activeWeapon.playAnimation( this.activeAnimation );
				this.meshWeapon.setAnimationTime( this.activeAnimation, this.meshBody.getAnimationTime( this.activeAnimation ) );
			}
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

	this.update = function ( delta ) {
		if ( this.controls ) this.updateMovementModel( delta );

		if ( this.animations ) {
			this.updateBehaviors( delta );
			this.updateAnimations( delta );
		}
	};

	this.updateAnimations = function ( delta ) {
		var mix = 1;

		if ( this.blendCounter > 0 ) {
			mix = ( this.transitionFrames - this.blendCounter ) / this.transitionFrames;
			this.blendCounter -= 1;
		}

		if ( this.meshBody ) {
			this.meshBody.update( delta );
			this.meshBody.setAnimationWeight( this.activeAnimation, mix );
			this.meshBody.setAnimationWeight( this.oldAnimation,  1 - mix );
		}

		if ( this.meshWeapon ) {
			this.meshWeapon.update( delta );

			this.meshWeapon.setAnimationWeight( this.activeAnimation, mix );
			this.meshWeapon.setAnimationWeight( this.oldAnimation,  1 - mix );
		}
	};

	this.updateBehaviors = function ( delta ) {

		var controls = this.controls;
		var animations = this.animations;
		var animation;
		
		var moveAnimation, idleAnimation;

		if( controls.move ) {
		    animation = animations[ "move" ];
		} else if( controls.jump ) {
		    animation = animations[ "jump" ];
		} else if( controls.attack ) {
		    animation = animations[ "attack" ];
		} else if( controls.defense ) {
		    animation = animations[ "defense" ];
		} else if( controls.healing ) {
		    animation = animations[ "healing" ];
		} else if( controls.death ) {
		    animation = animations[ "death" ];
		} else {
		    animation = animations[ "idle" ];
		}
		if ( this.activeAnimation != animation ) {
		    this.setAnimation( animation );
		}
	};

	this.updateMovementModel = function ( delta ) {
		this.root.rotation.y = this.bodyOrientation;
	};

	// internal helpers
	function loadTextures( baseUrl, textureUrls ) {
		var mapping = new THREE.UVMapping();
		var textures = [];

		for ( var i = 0; i < textureUrls.length; i ++ ) {
			textures[ i ] = THREE.ImageUtils.loadTexture( baseUrl + textureUrls[ i ], mapping, checkLoadingComplete );
			textures[ i ].name = textureUrls[ i ];
		}

		return textures;
	};

	function createPart( geometry, skinMap, skinBumpMap, skinNormalMap ) {
		geometry.computeMorphNormals();
		
		var whiteMap = THREE.ImageUtils.generateDataTexture( 1, 1, new THREE.Color( 0xffffff ) );
		var materialWireframe = new THREE.MeshPhongMaterial( { color: 0xffaa00, specular: 0x111111, shininess: 50, wireframe: true, shading: THREE.SmoothShading, map: whiteMap, morphTargets: true, morphNormals: true, metal: true } );
		
		if( typeof skinBumpMap === "undefined" ) {
		    var materialTexture = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x111111, shininess: 50, wireframe: false, shading: THREE.SmoothShading, map: skinMap, morphTargets: true, morphNormals: true, metal: true } );
		} else if( typeof skinNormalMap === "undefined" ){
		    var materialTexture = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x111111, shininess: 50, bumpMap: skinBumpMap, bumpScale: 13.5, wireframe: false, shading: THREE.SmoothShading, map: skinMap, morphTargets: true, morphNormals: true, metal: true } );
		} else {
		    var nScale = new THREE.Vector2( -0.8, 0.8 );
		    var materialTexture = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x555555, shininess: 0, bumpMap: skinBumpMap, bumpScale: 13.5, normalMap: skinNormalMap, normalScale: nScale, wireframe: false, shading: THREE.SmoothShading, map: skinMap, morphTargets: true, morphNormals: true, metal: false, opacity: 0.9 } );
		}
		
		materialTexture.wrapAround = true;
		//
		var mesh = new THREE.MorphBlendMesh( geometry, materialTexture );
		mesh.rotation.y = -Math.PI/2;
		//
		mesh.materialTexture = materialTexture;
		mesh.materialWireframe = materialWireframe;
		//
		mesh.autoCreateAnimations( scope.animationFPS );

		return mesh;
	};

	function checkLoadingComplete() {
		scope.loadCounter -= 1;
		if ( scope.loadCounter === 0 ) 	scope.onLoadComplete();
	};

	function exponentialEaseOut( k ) { return k === 1 ? 1 : - Math.pow( 2, - 10 * k ) + 1; }
};
