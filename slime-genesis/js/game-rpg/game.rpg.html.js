Game.Rpg.Html = {
    initialize: function() {
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	Game.Rpg.Html.refreshButtons();
    },
    
    
    refreshButtons: function() {
	var x = window.innerWidth / 100;
	var y = window.innerHeight / 100;
	var arrows = document.getElementById( 'buttons-arrows' );
	var action = document.getElementById( 'buttons-action' );
	var attack = document.getElementById( 'buttons-attack' );
	arrows.style.width = ( x * 30 ) + 'px';
	arrows.style.height = ( y * 40 ) + 'px';
	arrows.style.top = ( y * 60 ) + 'px';
	arrows.style.left = '0px';

	action.style.width = ( x * 10 ) + 'px';
	action.style.height = ( y * 15 ) + 'px';
	attack.style.width = action.style.width;
	attack.style.height = action.style.height

	action.style.top = ( y * 70 ) + 'px';
	action.style.left = ( x * 90 ) + 'px';
	attack.style.top = ( y * 85 ) + 'px';
	attack.style.left = ( x * 80 ) + 'px';
    }
};