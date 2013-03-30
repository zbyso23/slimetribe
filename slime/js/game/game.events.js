Game.Events = {
    windowResize: false,
    keyUp: false,
    keyDown: false,
    
    onWindowResize: function( event ) {
	if( Game.Events.windowResize === true ) return;
	Game.Events.windowResize = true;
	SCREEN_WIDTH = window.innerWidth;
	SCREEN_HEIGHT = window.innerHeight;
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
	camera.aspect = SCREEN_WIDTH/ SCREEN_HEIGHT;
	camera.updateProjectionMatrix();
	Game.Events.windowResize = false;
    },
    onKeyDown: function( event ) {
	if( Game.Events.keyDown === true ) return;
	Game.Events.keyDown = true;
	var kc = event.keyCode;
	switch( kc ) {
		case playerKeys.UP: controls.moveForward = true; break;
		case playerKeys.DOWN: controls.moveBackward = true; break;
		case playerKeys.LEFT: controls.moveLeft = true; break;
		case playerKeys.RIGHT: controls.moveRight = true; break;
		case playerKeys.HOME: Game.calibrateAnimationSpeed(); break;
		case playerKeys.ALT: controls.crouch = true; break;
		case playerKeys.SPACE: controls.jump = true; break;
		case playerKeys.CTRL: controls.attack = true; break;
	}
	if( kc > KEYS.F4 || kc <= KEYS.F12 ) {
	} else {
	    event.preventDefault();
	}
	Game.Events.keyDown = false;
    },

    onKeyUp: function( event ) {
	event.preventDefault();
	if( Game.Events.keyUp === true ) return;
	Game.Events.keyUp = true;
	var kc = event.keyCode;

	switch( kc ) {
		case playerKeys.UP: controls.moveForward = false; break;
		case playerKeys.DOWN: controls.moveBackward = false; break;
		case playerKeys.LEFT: controls.moveLeft = false; break;
		case playerKeys.RIGHT: controls.moveRight = false; break;

		case playerKeys.ALT: controls.crouch = false; break;
		case playerKeys.SPACE: controls.jump = false; break;
		case playerKeys.CTRL: controls.attack = false; break;
	}
	Game.Events.keyUp = false;
    },
    initialize: function() {
	    window.addEventListener( 'resize', Game.Events.onWindowResize, false );
	    document.addEventListener( 'keydown', Game.Events.onKeyDown, false );
	    document.addEventListener( 'keyup', Game.Events.onKeyUp, false );
    },
    uninitialize: function() {
	    window.removeEventListener( 'resize', Game.Events.onWindowResize, false );
	    document.removeEventListener( 'keydown', Game.Events.onKeyDown, false );
	    document.removeEventListener( 'keyup', Game.Events.onKeyUp, false );
    }
}