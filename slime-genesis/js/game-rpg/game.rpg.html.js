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
	var menu = document.getElementById( 'buttons-menu' );
	var character = document.getElementById( 'buttons-character' );
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
	
	menu.style.width = ( x * 7 ) + 'px';
	menu.style.height = ( y * 10 ) + 'px';
	character.style.width = ( x * 7 ) + 'px';
	character.style.height = ( y * 10 ) + 'px';
	
	menu.style.top = ( y * 1 ) + 'px';
	menu.style.left = ( x * 1 ) + 'px';
	character.style.top = ( y * 1 ) + 'px';
	character.style.left = ( x * 10 ) + 'px';

    },
    
    refreshGui: function() {
	var x = window.innerWidth / 100;
	var y = window.innerHeight / 100;
	var gui = document.getElementById( 'gui' );
	gui.style.width = ( x * 79 ) + 'px';
	gui.style.height = ( y * 9.5 ) + 'px';
	gui.style.top = ( y * 1 ) + 'px';
	gui.style.left = ( x * 19 ) + 'px';
    },
    refreshGuiContent: function() {
	var contentHtml = Game.Rpg.Html._parseContentHtml();
	document.getElementById( 'gui' ).innerHTML = contentHtml;
    },
    _parseContentHtml: function() {
	var items = 'ITEMS: ' + Game.Rpg.Character.items.length + ' / ' + Game.Rpg.Character.stats.itemsMax;
	var experience = 'LEVEL: ' + Game.Rpg.Character.stats.level + ' (' + Game.Rpg.Character.stats.experience + ' exp)';
	var html = '<p> ::::::: ' + items + ' :::::: ' + experience + ' ::::::: </p>';
	return html;
    }
};