(function(){
	RpgWorld = function( game, gameData )
	{
		var data    = gameData.data;
		var ambient = gameData.dataAmbient;
		var maps    = gameData.dataMaps;

	    var render    = new RpgRender( this, data, ambient, maps );
	    var events    = new RpgEvents();
	    var character = new RpgCharacter( this, render, data, ambient, maps );

		var clock       = new THREE.Clock();
	    var delta       = 0;
	    var tick        = 0;
	    var gyro        = {};
		var loop;
	    var run         = false;
	    var stopRequest = false;

	    var spawnItems         = [];
	    var storageExperience  = 15;
	    var ambientItemsCount  = 0;
	    var ambientItemsLoaded = false;
	    var characterLoaded    = false;

	    var runLoop = function() 
	    {
	    	++tick;
			delta = clock.getDelta();
			refreshLogic();
			loop = window.requestAnimationFrame( runLoop );
//console.log(ambientItemsLoaded);
			if( true === run && true === characterLoaded && ambientItemsLoaded && true === data.getImagesLoaded() )
			{
		    	spawn();
		    	render.refresh( delta, character );
			}
			if(stopRequest)
			{
				stop();
				run = false;
			}
    	};

	    var refreshLogic = function() 
	    {
	    	if( false === run )
	    	{
			    //Blank - space for Menu etc.
			    //RUN manually - DEBUG and prepare menu
			    render.imagesLoader();
			    run = true;
			    return;
	    	}
		    if( data.getWorldReady() ) return;
		    if( false === data.getImagesLoaded() ) return;
			generateWorld();
	    };

	    var generateWorld = function() 
	    {
	    	initializeMap();
	    	render.initializeMap();
	    	character.initialize();
			//first AI refactor - disabled
			// wizzard = new GameRpgAIcharacter({
			// 		hiddenLayers: 3, 
			// 		hiddenLayerSize: 3, 
			// 		learningRate: 0.23,
			// 		input: ['moon', 'daytime', 'noise'],
			// 		output: ['search', 'rest', 'collect']
			// 	});
			// wizzard.birth();
		    data.setWorldReady( true );
	    };

	    var stop = function()
	    {
	     	loop = window.cancelAnimationFrame( runLoop );
			loop = undefined;
	    };

   	    var initializeMap = function() 
	    {
			var map             = maps.getCurrent();
			var mapResource     = data.getResourcesImage( 'map' );
			var ggGridX         = map.config.gridX;
			var ggGridY         = map.config.gridY;
			var groundHeightMap = mapResource.canvas.getImageData( 0, 0, mapResource.w, mapResource.h );
			map.world.ambientMap     = [];
			map.world.collisionMap   = [];
			map.world.ambientObjects = [];
			map.world.heightMap      = [];
			var heightMap            = [];
			var ambientRow           = [];
			var heightRow            = [];
			var collisionRow         = [];
			var ambientObjectsRow    = [];
			for( var i = 0, l = groundHeightMap.data.length; i < l; i = i + 4 ) 
			{
			    if( i > 0 && i % ( ( ggGridX + 1 ) * 4 ) === 0 ) 
			    {
					map.world.ambientMap.push( ambientRow );
					map.world.collisionMap.push( collisionRow );
					map.world.heightMap.push( heightRow );
					map.world.ambientObjects.push( ambientObjectsRow );
					var ambientRow = [];
					var heightRow = [];
					var collisionRow = [];
					var ambientObjectsRow = [];
			    }
			    var ambient = i
			    var heightMapIndex = i + 1;
			    var collisionIndex = i + 2;
			    ambientRow.push( groundHeightMap.data[ambient] );
			    heightRow.push( groundHeightMap.data[ heightMapIndex ]  );
			    heightMap.push( parseInt( groundHeightMap.data[ heightMapIndex ] )  );
			    collisionRow.push( groundHeightMap.data[ collisionIndex ] );
			    ambientObjectsRow.push( 0 );
			}
			map.world.ambientMap.push( ambientRow );
			map.world.ambientObjects.push( ambientObjectsRow );
			map.world.collisionMap.push( collisionRow );
			map.world.heightMap.push( heightRow );
	    };

	    var uninitilizeMap = function()
	    {
	    	var map = GameRpgMaps.current;
	    	render.uninitilizeMap( map );
	    };

	    var spawn = function( delta ) 
	    {
			try 
			{
			    var map       = maps.getCurrent();
			    var character = data.getCharacter();

			    if(controls.grow === true) throw "growing lock";
			    var newSpawnItems = [];
			    var change = false;
			    for( var i in spawnItems )
			    {
					var object = map.world.ambientObjects[ spawnItems[ i ][0] ][ spawnItems[ i ][1] ];
					object.attributes.timeout -= Game.Rpg.delta;
					if( object.attributes.timeout < 4 ) 
					{
					    object.meshBody.visible = true;
					    object.meshBody.material.opacity = .9;
					    change = true;
					} 
					else 
					{
					    newSpawnItems.push( Game.Rpg.World.spawnItems[ i ] );
					}
			    }
			    if( !change ) throw "no item fully spawned";
			    spawnItems = newSpawnItems;
			} 
			catch( e ) 
			{
			    //utils.log( 'spawn' , e );
			}
	    };

    	this.addItemToStorage = function( storage, item ) 
	    {
			try 
			{
			    if( storage.attributes.itemsMax <= storage.attributes.items.length ) throw "storage is full";
			    //REFACTOR TO: ambient.storageAccept(item)
			    if( GameRpgAmbient.storageAccept( item ) === false ) throw "storage dont get this item";
			    storage.attributes.items.push( item );
			} 
			catch( e ) 
			{
			    utils.log( 'addItemToStorage' , e );
			    return false;
			}
			return true;
	    };

	    this.addSpawnItem = function( coords )
	    {
			spawnItems.push( coords );
	    };

	    this.getStorageExperience = function() 
	    {
			return storageExperience;
	    };

	    this.addAmbientLoaderItem = function()
	    {
	    	++ambientItemsCount;
	    };

	    this.removeAmbientLoaderItem = function()
	    {
	    	--ambientItemsCount;
	    };

	    this.getAmbientLoaderItems = function()
	    {
	    	return Math.ceil( ambientItemsCount );
	    };

	    this.setAmbient = function()
	    {

	    };

	    this.run = function()
	    {
			render.initialize();
			events.initialize();
			maps.setActiveToCurrent();
	     	runLoop();
	    };

	    this.pause = function()
	    {
	    	stopRequest = true;
	    }

	    this.uninitialize = function()
	    {
	    	uninitializeMap();
	    	character.uninitialize();
	    };

	    this.switchMap = function( map ) 
	    {
		    if( false === maps.mapExists( map ) ) throw "map dont exists";
		    run = false;
	    	uninitializeMap();
	    	character.uninitialize();
		    maps.setActive( map );
		    maps.setActiveToCurrent();
		    render.imagesLoader();
	    	initializeMap();
	    	render.initializeMap();
	    	character.initialize();
		    run = true;
	    };

	    this.setAmbientItemsLoaded = function( state )
	    {
	    	ambientItemsLoaded = state;
	    };

	    this.setCharacterLoaded = function( state )
	    {
	    	characterLoaded = state;
	    };
	};
})();