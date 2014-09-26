(function(){
	GameException = function( message )
	{
		this.message = message;
	};

	IGame = 
	{
		run: function() {},
		switchMap: function(map) {}
	};

	Game = function()
	{
	    var world  = new RpgWorld( this );

	    var coordsToGrid = function( params ) 
	    {
			var map = GameRpgMaps.current;
			var stepX = Math.round( map.ground.width / map.config.gridX );
			var stepY = Math.round( map.ground.height / map.config.gridY );
			var x = ( map.ground.width / 2 ) - params.x;//map.character.object.position.x;
			var y = ( map.ground.height / 2 ) - params.y;//map.character.object.position.z;
			var gridX = Math.round( x / stepX );
			var gridY = Math.round( y / stepY );
			return { x: gridX, y: gridY };
	    };

		this.run = function() 
	    {
	    	world.run();
		//	Game.Rpg.AI.birthWizzard(); //New
	    };

	    this.switchMap = function( map ) 
	    {
	    	world.switchMap( map );
	    };
	};
})();