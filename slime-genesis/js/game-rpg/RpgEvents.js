(function(){
	IRpgEvents = 
	{
		initialize: function() {}
	};

	RpgEvents = function()
	{
		var KEYS = 
		{
		    SHIFT: 16, 
		    CTRL : 17, 
		    ALT  : 18,
		    SPACE: 32, 
		    LEFT : 37, 
		    RIGHT: 39, 
		    UP   : 38, 
		    DOWN : 40
		};
		
	    var touches = function( event ) 
	    {
			event.preventDefault();
			resetControls();
			var onePieceX = window.innerWidth / 100;
			var onePieceY = window.innerHeight / 100;
			for( i in event.touches ) 
			{
			    var touch = event.touches[i];
			    buttons( { touch: touch, x: onePieceX, y: onePieceY } );
			}
	    };

	    var mouse = function( event ) 
	    {
			event.preventDefault();
			resetControls();
			var onePieceX = window.innerWidth / 100;
			var onePieceY = window.innerHeight / 100;
			buttons( { touch: event, x: onePieceX, y: onePieceY } );
	    };

	    var keyDown = function( event ) 
	    {
			event.preventDefault();
			var kc = event.keyCode;
			resetControls();
			switch( kc ) 
			{
				case KEYS.UP: controls.moveForward = true; break;
				case KEYS.DOWN: controls.moveBackward = true; break;
				case KEYS.LEFT: controls.moveLeft = true; break;
				case KEYS.RIGHT: controls.moveRight = true; break;

				case KEYS.SPACE: controls.grow = true; break;
				case KEYS.CTRL: controls.attack = true; break;
			}

			if( controls.grow || controls.attack ) 
			{
				controls.moveForward = false;
				controls.moveBackward = false;
				controls.moveLeft = false;
				controls.moveRight = false;
			}
	    };

	    var keyUp = function( event ) 
	    {
			event.preventDefault();
			var kc = event.keyCode;
			resetControls();
			switch( kc ) 
			{
				case KEYS.UP: controls.moveForward = false; break;
				case KEYS.DOWN: controls.moveBackward = false; break;
				case KEYS.LEFT: controls.moveLeft = false; break;
				case KEYS.RIGHT: controls.moveRight = false; break;

				case KEYS.SPACE: controls.grow = false; break;
				case KEYS.CTRL: controls.attack = false; break;
			}

			if( controls.grow || controls.attack ) 
			{
				controls.moveForward = false;
				controls.moveBackward = false;
				controls.moveLeft = false;
				controls.moveRight = false;
			}
	    };

	    var resetControls = function() 
	    {
			controls.attack       = false;
			controls.jump         = false;
			controls.grow         = false;
			controls.moveForward  = false;
			controls.moveBackward = false;
			controls.moveLeft     = false;
			controls.moveRight    = false;
	    };

	    var buttons = function( params ) 
	    {
			var touch = params.touch;
			var onePieceX = params.x;
			var onePieceY = params.y;
			//Move
			if( touch.pageX <= ( onePieceX * 30 ) && ( touch.pageY >= ( onePieceY * 60 ) ) ) 
			{
			    //Orientations
			    if( ( touch.pageX >= 0 && touch.pageX < ( onePieceX * 10 ) ) ) 
			    {
					controls.moveLeft = true;
			    } 
			    else if( ( touch.pageX >= ( onePieceX * 20 ) && touch.pageX < ( onePieceX * 30 ) ) ) 
			    {
					controls.moveRight = true;
			    } 
			    else if( ( touch.pageY >= ( onePieceY * 60 ) && touch.pageY < ( onePieceY * 80 ) ) ) 
			    {
					controls.moveForward = true;
			    } 
			    else if( ( touch.pageY >= ( onePieceY * 80 ) && touch.pageY < ( onePieceY * 100 ) ) ) 
			    {
					controls.moveBackward = true;
			    }
			//Action
			} 
			else if( touch.pageX >= ( onePieceX * 50 ) && ( touch.pageY >= ( onePieceY * 70 ) ) ) 
			{
			    //Attack
			    if( ( touch.pageX >= ( onePieceX * 80 ) && touch.pageX < ( onePieceX * 90 ) ) ) 
			    {
					controls.attack = true;
			    //Action
			    } 
			    else if( touch.pageX >= ( onePieceX * 90 ) && touch.pageX < ( onePieceX * 100 ) )
			    {
					controls.grow = true;
			    }
			}
	    };
	};

	RpgEvents.prototype = Object.create(IRpgEvents);

    RpgEvents.initialize = function() 
    {
		//touch screen controls
		document.addEventListener( 'touchstart', touches, false);
		document.addEventListener( 'touchmove',  touches, false);
		document.addEventListener( 'touchend',   touches, false);
		document.addEventListener( 'touchleave', touches, false);
		//mouse buttons controls
		document.addEventListener( 'mousemove', mouse, false);
		document.addEventListener( 'mousedown', mouse, false);
		//keyboard controls
		document.addEventListener( 'keydown', keyDown, false);
		document.addEventListener( 'keyup',   keyUp, false);
    };
})();