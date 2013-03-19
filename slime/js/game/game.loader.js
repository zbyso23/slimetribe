Game.Loader = {
    resourceLoader: function() {
	gameDataImages.loadedRemain = gameDataImages.list.length;
	var gameHidden = document.createElement( 'div' );
	gameHidden.style['display'] = 'none';
	gameHidden.setAttribute( 'id', 'game-hidden' );
	document.body.appendChild( gameHidden );

	for( i in gameDataImages.list ) {
	    if( gameDataImages.list[i] === undefined ) {
		continue;
	    }
	    var id = gameDataImages.list[i].id;
	    var w = gameDataImages.list[i].w;
	    var h = gameDataImages.list[i].h;
	    gameResources.images[id].image = new Image();
	    gameResources.images[id].image.onload = function() {
		var canvas = document.createElement( 'canvas' );
		canvas.setAttribute( 'id', 'canvas-' + id );
		canvas.setAttribute( 'width', w );
		canvas.setAttribute( 'height', h );
		gameHidden.appendChild( canvas );
		gameResources.images[id].canvas = canvas.getContext( "2d" );
		gameResources.images[id].canvas.drawImage( gameResources.images[id].image, 0, 0 );
		--gameDataImages.loadedRemain;
	    }
	    gameResources.images[id].image.src = gameDataImages.list[i].url;
	}
    }
}