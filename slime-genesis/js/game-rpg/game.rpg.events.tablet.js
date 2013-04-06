Game.Rpg.Events.Tablet = {
    touch: function( event ) {
	event.preventDefault();
	Game.Rpg.Events.resetMove();
	var onePieceX = window.innerWidth / 100;
	var onePieceY = window.innerHeight / 100;
	for( i in event.touches ) {
	    var touch = event.touches[i];
	    Game.Rpg.Events.buttons( { touch: touch, x: onePieceX, y: onePieceY } );
	}
    },
			
    initialize: function(){
	document.addEventListener( 'touchstart', Game.Rpg.Events.Tablet.touch, false);
	document.addEventListener( 'touchmove', Game.Rpg.Events.Tablet.touch, false);
	document.addEventListener( 'touchend', Game.Rpg.Events.Tablet.touch, false);
    }
    
};
