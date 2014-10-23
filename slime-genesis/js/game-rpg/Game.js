(function(){
	GameException = function( message )
	{
		this.message = message;
	};

	Game = function()
	{
		var data        = new Data();
		var dataAmbient = new DataAmbient();
		var dataMaps    = new DataMaps();
	    var world       = new RpgWorld( this, { "data": data, "dataAmbient": dataAmbient, "dataMaps": dataMaps  } );

	    var coordsToGrid = function( params ) 
	    {
			var map = dataMaps.getCurrent();
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