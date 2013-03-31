Game.Rpg.Events.Mouse = {
    mouse: function( event ) {
	event.preventDefault();
	Game.Rpg.Events.resetMove();
	var onePieceX = window.innerWidth / 100;
	var onePieceY = window.innerHeight / 100;
	Game.Rpg.Events.buttons( { touch: event, x: onePieceX, y: onePieceY } );
    },

    initialize: function(){
	document.addEventListener( 'mousemove', Game.Rpg.Events.Mouse.mouse, false);
	document.addEventListener( 'mousedown', Game.Rpg.Events.Mouse.mouse, false);
    }

}