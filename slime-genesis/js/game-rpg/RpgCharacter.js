(function(){
	RpgCharacter = function( world, render, data, ambient, maps )
	{
		//REFACTOR MOVE FROM Data.js: 
		var position = { x: 0, y: 87.6, z: 0 };

	    var config   = {
			stats: {},
			controls:
			{
			    reverseY: false,
			    reverseX: false
			},
			currentPosition: 
			{
			    x: 0, y: 72.6, z: 0
			}
	    };

	    var getLevel = function( experience ) 
	    {
			var level = 1;
			for( var i in this.levels ) 
			{
				if( experience >= this.levels[ i ] ) level = i;
			}
			return level;
	    }

		this.stats = 
	    {
			itemsMax  : 12,
			experience: 0,
			health    : 100,
			level     : 1
	    };
		this.items = [];
		this.levels = 
	    {
			1: 0,
			2: 115,
			3: 230,
			4: 400,
			5: 900,
			6: 1500,
			7: 3000,
			8: 5000,
			9: 7000,
			10: 10000
	    };
		this.closed = false;
		this.isCollisionDetect = false;

		this.initialize = function()
	    {
	    	render.initializeCharacter( this );
	    };

	    this.uninitialize = function()
	    {
	    	render.uninitializeCharacter( this );
	    };

	    this.isBagFull = function() 
	    {
			try 
			{
				if( this.stats.itemsMax <= this.items.length ) throw "bag is full";
			} 
			catch( e )
			{
				utils.log( 'isBagFull e', e );
				return true;
			}
			return false;
	    };
		    
	    this.addItem = function( item ) 
	    {
			try 
			{
				if( this.isBagFull() ) throw "bag is full";
				this.items.push( item );
				render.refreshGuiContent( this.stats, this.items );
			} 
			catch( e ) 
			{
				utils.log( 'addItem e', e );
				return false;
			}
			return true;
	    };

	    this.removeItem = function( item ) 
	    {
			try 
			{
				if( this.items.length === 0 ) throw "bag is empty";
				var itemsWithoutItem = [];
				var removed = false;
				for( i in this.items ) {
					if( this.items[i] !== item || removed ) itemsWithoutItem.push( this.items[i] );
					if( this.items[i] === item && !removed ) removed = true;
				}
				if( removed === false ) throw "is no item";
				this.items = itemsWithoutItem;
				render.refreshGuiContent( this.stats, this.items );
			} 
			catch( e ) 
			{
				utils.log( 'removeItem e', e );
				return false;
			}
			return true;
	    };

	    this.getItems = function() 
	    {
			return this.items;
	    };

	    this.removeItems = function() 
	    {
			this.items = [];
			render.refreshGuiContent( this.stats, this.items );
	    };

	    this.action = function( grid ) 
	    {
			var map = maps.getCurrent();
			this.closed = true;
			try 
			{
				if( map.world.ambientMap[grid.x][grid.y] === 255 ) throw "no ambient here";
console.log('ACTION',  map.world.ambientMap[grid.x][grid.y]);
				this.actionGrowAmbient( grid );

				this.actionStorage( grid );
			} 
			catch( e ) 
			{
				utils.log('RpgCharacter action exception');
			}
			this.closed = false;
	    };

	    this.actionGrowAmbient = function( grid ) 
	    {
			try 
			{
				var map = maps.getCurrent();
				var object = map.world.ambientObjects[grid.x][grid.y];
				if( object.attributes.type !== 'item' ) throw "no item or to grow";
				if( object.attributes.timeout !== 0 ) throw "growing, wait...";
				if( this.isBagFull() ) throw "bag is full";
				if( object.meshBody.material.opacity > .3 ) 
				{
					object.meshBody.material.opacity -= Game.Rpg.delta;
				} 
				else 
				{
					if( !this.addItem( map.world.ambientMap[grid.x][grid.y] ) ) throw "item not added?";
					this.addExperience( object.attributes.experience );
					object.meshBody.visible = false;
					object.attributes.timeout = 500;
					object.meshBody.material.opacity = 0;
					world.addSpawnItem( [ grid.x, grid.y ] );
					render.refreshGuiContent( this.stats, this.items );
				}
			} 
			catch( e ) 
			{
				utils.log( 'Ambient e', e );
			}
	    };

	    this.actionStorage = function( grid ) 
	    {
			try 
			{
				var map = maps.getCurrent();
				var object = map.world.ambientObjects[grid.x][grid.y];
				if( object.attributes.type !== 'storage' ) throw "no storage here";
				if( this.items.length === 0 ) throw "bag is empty";
				for( var i = 0; i < this.items.length; i++ ) 
				{
					if( false === world.addItemToStorage( object, this.items[i] ) ) continue;
					this.removeItem( this.items[i] );
					this.addExperience( world.getStorageExperience() );
				}
				render.refreshGuiContent( this.stats, this.items );
			}
			catch( e ) 
			{
				utils.log( 'actionStorage e', e );
			}
	    };

	    this.addExperience = function( experience ) 
	    {
			try 
			{
				this.stats.experience += experience;
				var newLevel = getLevel( this.stats.experience );
				if( newLevel > this.stats.level ) 
				{
					this.stats.level = newLevel;
				}
			} 
			catch( e ) 
			{
				utils.log( 'addExperience e', e );
			}
	    };

	    this.getModel = function()
	    {
	    	return model;
	    };

	    this.getObject = function()
	    {
	    	return object;
	    };

	    this.getGyro = function()
	    {
	    	return gyro;
	    };

	    this.getPosition = function()
	    {
	    	return position;
	    };
	};
})();