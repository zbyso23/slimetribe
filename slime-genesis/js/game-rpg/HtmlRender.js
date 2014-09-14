(function(){
	IHtmlRender = 
	{
		refreshButtons: function() {},
		refreshGui: function() {},
		refreshGuiContent: function( stats, items ) {},
		initialize: function() {},
		add: function( callbackScreenResize ) {},
		imagesLoader: function( callbackError ) {},
		render: function( scene, camera ) {},
		getMaxAnisotropy: function() {}
	}

	var HtmlRender = function()
	{
		var that = this;
		var renderer;
		var imagesLoaderRun   = false;
		var imagesLoaderError = false;

	    var addStats = function() 
	    {
			stats = new Stats();
			container.appendChild( stats.domElement );
	    };

	    var getStatsHtml = function( stats, items )
	    {
			var itemsHtml = 'ITEMS: ' + items.length + ' / ' + stats.itemsMax;
			var experienceHtml = 'LEVEL: ' + stats.level + ' (' + stats.experience + ' exp)';
			var contentHtml = '<p> ::::::: ' + itemsHtml + ' :::::: ' + experienceHtml + ' ::::::: </p>';
			return contentHtml;
		};
	};

	HtmlRender.prototype = Object.create(IHtmlRender);

    HtmlRender.prototype.refreshButtons = function() 
    {
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
    };
	    
    HtmlRender.prototype.refreshGui = function() 
    {
		var x = window.innerWidth / 100;
		var y = window.innerHeight / 100;
		var gui = document.getElementById( 'gui' );
		gui.style.width = ( x * 79 ) + 'px';
		gui.style.height = ( y * 9.5 ) + 'px';
		gui.style.top = ( y * 1 ) + 'px';
		gui.style.left = ( x * 19 ) + 'px';
    };

    HtmlRender.prototype.refreshGuiContent = function( stats, items ) 
    {
		document.getElementById( 'gui' ).innerHTML = getStatsHtml( stats, items );
    };

    HtmlRender.prototype.initialize = function() 
    {
		container = document.createElement( 'div' );
		document.body.appendChild( container );
		this.refreshButtons();
		this.refreshGui();
	};

    HtmlRender.prototype.add = function( callbackScreenResize, statsDisabled ) 
    {
    	if( true !== statsDisabled ) addStats();
		var SCREEN_WIDTH = window.innerWidth;
		var SCREEN_HEIGHT = window.innerHeight;
		renderer = new THREE.WebGLRenderer( { antialias: gameRpgData.settings.graphics.antialiasing } );
		renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
		renderer.setClearColor( 0x000000, 1 );
		container.appendChild( renderer.domElement );
		renderer.gammaInput = true;
		renderer.gammaOutput = true;
		//NO ANDROID renderer.shadowMapEnabled = true;
    	//Screen resize / device rotate
		window.addEventListener( 'resize', function() {
			SCREEN_WIDTH = window.innerWidth;
			SCREEN_HEIGHT = window.innerHeight;
			renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
			callbackScreenResize();
		}, false );

    };

    HtmlRender.prototype.imagesLoader = function( callbackError )
    {
    	if( true === imagesLoaderRun ) return;
    	imagesLoaderRun = true;
		gameDataImages.loadedRemain = 1;
		//refactor - remove adding elements to DOM, create only in vars
		// var gameHidden = document.createElement( 'div' );
		// gameHidden.style['display'] = 'none';
		// gameHidden.setAttribute( 'id', 'game-hidden' );
		// document.body.appendChild( gameHidden );
		var map = GameRpgMaps.current;
		for( i = 0; i <= gameDataImages.list.length; i++ ) 
		{
		    if( gameDataImages.list[i] === undefined ) continue;
		    var id = gameDataImages.list[i].id;
		    var w = map.config.gridX + 1;
		    var h = map.config.gridY + 1;
		    gameResources.images.map.image = new Image();
		    gameResources.images.map.image.onload = function() 
		    {
				var canvas = document.createElement( 'canvas' );
				canvas.setAttribute( 'id', 'canvas-map' );
				canvas.setAttribute( 'width', w );
				canvas.setAttribute( 'height', h );
				//refactor - remove adding elements to DOM, create only in vars
				//gameHidden.appendChild( canvas );
				gameResources.images.map.canvas = canvas.getContext( "2d" );
				gameResources.images.map.canvas.drawImage( gameResources.images.map.image, 0, 0 );
				--gameDataImages.loadedRemain;
				if( gameDataImages.loadedRemain === 0 ) gameDataImages.loaded = true;
		    }
		    gameResources.images.map.image.onerror = callbackError;
		    gameResources.images.map.image.src = map.config.groundImage;
		}
    };

    HtmlRender.prototype.render = function( scene, camera )
    {
		renderer.render( scene, camera );
    };

    HtmlRender.prototype.getMaxAnisotropy = function()
    {
    	return renderer.getMaxAnisotropy();
    };
})();