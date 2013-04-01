Game.Rpg.Events = {
    resize: function( event ) {
	SCREEN_WIDTH = window.innerWidth;
	SCREEN_HEIGHT = window.innerHeight;
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

	camera.aspect = SCREEN_WIDTH/ SCREEN_HEIGHT;
	camera.updateProjectionMatrix();
	Game.Rpg.Html.refreshButtons();
    },
    
    buttons: function( params ) {
	var touch = params.touch;
	var onePieceX = params.x;
	var onePieceY = params.y;
	//Move
	if( touch.pageX <= ( onePieceX * 30 ) && ( touch.pageY >= ( onePieceY * 60 ) ) ) {
	    //Orientations
	    if( ( touch.pageX >= 0 && touch.pageX < ( onePieceX * 10 ) ) ) {
		controls.moveLeft = true;
	    } else if( ( touch.pageX >= ( onePieceX * 20 ) && touch.pageX < ( onePieceX * 30 ) ) ) {
		controls.moveRight = true;
	    } else if( ( touch.pageY >= ( onePieceY * 60 ) && touch.pageY < ( onePieceY * 80 ) ) ) {
		controls.moveForward = true;
	    } else if( ( touch.pageY >= ( onePieceY * 80 ) && touch.pageY < ( onePieceY * 100 ) ) ) {
		controls.moveBackward = true;
	    }
	//Action
	} else if( touch.pageX >= ( onePieceX * 50 ) && ( touch.pageY >= ( onePieceY * 70 ) ) ) {
	    //Attack
	    if( ( touch.pageX >= ( onePieceX * 80 ) && touch.pageX < ( onePieceX * 90 ) ) ) {
		controls.attack = true;
	    //Action
	    } else if( touch.pageX >= ( onePieceX * 90 ) && touch.pageX < ( onePieceX * 100 ) ) {
		controls.grow = true;
	    }

	}
    },
    
    resetMove: function() {
	controls.attack = false;
	controls.jump = false;
	controls.grow = false;
	controls.moveForward = false;
	controls.moveBackward = false;
	controls.moveLeft = false;
	controls.moveRight = false;
    },
    
    initialize: function() {
	window.addEventListener( 'resize', Game.Rpg.Events.resize, false );
    }
    
    
    
    
    
};