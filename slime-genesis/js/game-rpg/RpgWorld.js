(function(){
	var clock = new THREE.Clock();
	var delta;
	var loop;

	RpgWorld = function( game )
	{
	    var delta  = 0;
	    var tick   = 0;
	    var gyro   = {};

	    var spawnItems = [];
	    var storageExperience = 15;
	    var ambientItemsCount = 0;
	    var ambientItemsLoaded = false;

	    var render = new RpgRender( this );
	    var events = new RpgEvents();


	    var runLoop = function() 
	    {
			delta = clock.getDelta();
			refreshLogic();
			loop = window.requestAnimationFrame( runLoop );
			if( gameRpgData.run && gameRpgData.character.loaded && ambientItemsLoaded && gameDataImages.loaded ) 
			{
		    	spawn();
		    	render.refresh( delta );
			}
			tick++;
    	};

	    var refreshLogic = function() 
	    {
			if( gameRpgData.run )
			{
			    if( !gameRpgData.world.ready ) 
			    {
					generateWorld();
			    } 
			    else 
			    {
					if( gameRpgData.character.loaded === true ) 
					{
						gameRpgData.character.torch.position.x = gameRpgData.character.object.position.x;
						gameRpgData.character.torch.position.y = gameRpgData.character.object.position.y + 10;
						gameRpgData.character.torch.position.z = gameRpgData.character.object.position.z;
					}
					//wizzard.refresh();
			    }
			    return;
			} 

		    //Blank - space for Menu etc.
		    //RUN manually - DEBUG and prepare menu
		    render.imagesLoader();
		    gameRpgData.run = true;
	    };

	    var generateWorld = function() 
	    {
			if( !gameDataImages.loaded ) return;
	    	initializeMap();
	    	render.initializeCharacter();

			//first AI refactor - disabled
			// wizzard = new GameRpgAIcharacter({
			// 		hiddenLayers: 3, 
			// 		hiddenLayerSize: 3, 
			// 		learningRate: 0.23,
			// 		input: ['moon', 'daytime', 'noise'],
			// 		output: ['search', 'rest', 'collect']
			// 	});
			// wizzard.birth();
		    gameRpgData.world.ready = true;
	    };


	    this.addItemToStorage = function( storage, item ) 
	    {
			try 
			{
			    if( storage.attributes.itemsMax <= storage.attributes.items.length ) throw "storage is full";
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

	    this.getStorageExperience = function() 
	    {
			return storageExperience;
	    };

	    this.addAmbientItem = function()
	    {
	    	++ambientItemsCount;
	    };

	    this.removeAmbientItem = function()
	    {
	    	--ambientItemsCount;
	    };

	    this.getAmbientItems = function()
	    {
	    	return Math.ceil( ambientItemsCount );
	    };

	    this.setAmbient = function()
	    {

	    };

	    this.run = function()
	    {
			Game.Rpg.Html.initialize();
			render.initialize();
			events.initialize();
			GameRpgMaps.setActiveToCurrent();
	    	runLoop();
	    };

	    this.pause = function()
	    {
	    	loop = window.cancelAnimationFrame( runLoop );
			loop = undefined;
	    };

	    this.uninitialize = function()
	    {
	    	uninitializeMap();
	    	render.uninitializeCharacter();
	    };

	    this.switchMap = function( map ) 
	    {
		    if( !GameRpgMaps.mapExists( map ) ) throw "map dont exists";
		    gameRpgData.run = false;
		    this.uninitialize();
		    GameRpgMaps.setActive( map );
		    GameRpgMaps.setActiveToCurrent();
		    render.imagesLoader();
	    	uninitializeMap();
	    	render.uninitializeCharacter();
		    gameRpgData.run = true;

	    };


   	    var initializeMap = function() 
	    {
			var map = GameRpgMaps.current;
			var ggGridX = map.config.gridX;
			var ggGridY = map.config.gridY;
			var groundHeightMap = gameResources.images.map.canvas.getImageData( 0, 0, gameResources.images.map.w, gameResources.images.map.h );
			var x = y = 0;
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
			    
			    //if( groundHeightMap.data[ambient] !== 255 ) console.log( 'ambient ' + ambientRow.length - 1 + ' x ' + gameRpgData.world.ambientMap.length - 1 );
			    heightRow.push( groundHeightMap.data[ heightMapIndex ] / 3.3333333 );
			    heightMap.push( parseInt( groundHeightMap.data[ heightMapIndex ] ) / 3.3333333 );
			    collisionRow.push( groundHeightMap.data[ collisionIndex ] );
			    ambientObjectsRow.push( 0 );
			}
			map.world.ambientMap.push( ambientRow );
			map.world.ambientObjects.push( ambientObjectsRow );
			map.world.collisionMap.push( collisionRow );
			map.world.heightMap.push( heightRow );
			render.initializeMap( map );
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
			    var map = GameRpgMaps.current;
			    if( gameRpgData.character.md2.controls.grow === true ) throw "growing lock";
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
			    Game.Rpg.World.spawnItems = newSpawnItems;
			} 
			catch( e ) 
			{
		//	    utils.log( 'spawn' , e );
			}
	    };
	};
})();
