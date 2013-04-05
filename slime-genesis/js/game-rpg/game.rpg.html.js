Game.Rpg.Html = {
    initialize: function() {
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	Game.Rpg.Html.refreshButtons();
	Game.Rpg.Html.refreshGui();
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
    },
    
    refreshGui: function() {
	var x = window.innerWidth / 100;
	var y = window.innerHeight / 100;
	var gui = document.getElementById( 'gui' );
	gui.style.width = ( x * 70 ) + 'px';
	gui.style.height = ( y * 10 ) + 'px';
	gui.style.top = ( y * 0 ) + 'px';
	gui.style.left = ( x * 15 ) + 'px';
	console.log('style',gui.style );
    },
    refreshGuiContent: function() {
	var contentHtml = Game.Rpg.Html._parseContentHtml();
	document.getElementById( 'gui' ).innerHTML = contentHtml;
    },
    _parseContentHtml: function() {
	var items = 'items: ' + Game.Rpg.Character.items.length;
	var experience = 'Level ' + Game.Rpg.Character.stats.level + ' (Exp: ' + Game.Rpg.Character.stats.experience + ')';
	var html = '<p>' + items + '<br />' + experience + '</p>';
	return html;
    }
};