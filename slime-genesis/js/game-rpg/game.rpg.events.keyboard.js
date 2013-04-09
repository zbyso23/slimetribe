Game.Rpg.Events.Keyboard = {
    keysDown: function( event ) {
	event.preventDefault();
	var kc = event.keyCode;
	Game.Rpg.Events.resetMove();
	switch( kc ) {
		case KEYS.UP: controls.moveForward = true; break;
		case KEYS.DOWN: controls.moveBackward = true; break;
		case KEYS.LEFT: controls.moveLeft = true; break;
		case KEYS.RIGHT: controls.moveRight = true; break;

		case KEYS.SPACE: controls.grow = true; break;
		case KEYS.CTRL: controls.attack = true; break;
	}
	
	if( controls.grow || controls.attack ) {
	    controls.moveForward = false;
	    controls.moveBackward = false;
	    controls.moveLeft = false;
	    controls.moveRight = false;
	}
    },
    keysUp: function( event ) {
	event.preventDefault();
	var kc = event.keyCode;
	Game.Rpg.Events.resetMove();
	switch( kc ) {
		case KEYS.UP: controls.moveForward = false; break;
		case KEYS.DOWN: controls.moveBackward = false; break;
		case KEYS.LEFT: controls.moveLeft = false; break;
		case KEYS.RIGHT: controls.moveRight = false; break;

		case KEYS.SPACE: controls.grow = false; break;
		case KEYS.CTRL: controls.attack = false; break;
	}
    },

    initialize: function(){
	document.addEventListener( 'keydown', Game.Rpg.Events.Keyboard.keysDown, false);
	document.addEventListener( 'keyup', Game.Rpg.Events.Keyboard.keysUp, false);
    }

}