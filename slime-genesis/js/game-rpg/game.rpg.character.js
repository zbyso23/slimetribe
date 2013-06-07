Game.Rpg.Character = {
    stats: {
	itemsMax: 12,
	experience: 0,
	level: 1
    },
    items: [],
    levels: {
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
    },
    
    closed: false,
    
    isBagFull: function() {
	try {
	    if( Game.Rpg.Character.stats.itemsMax <= Game.Rpg.Character.items.length ) throw "bag is full";
	} catch( e ) {
	    Game.Utils.log( 'isBagFull e', e );
	    return true;
	}
	return false;
    },
    
    addItem: function( item ) {
	try {
	    if( Game.Rpg.Character.isBagFull() ) throw "bag is full";
	    Game.Rpg.Character.items.push( item );
	    Game.Rpg.Html.refreshGuiContent();
	} catch( e ) {
	    Game.Utils.log( 'addItem e', e );
	    return false;
	}
	return true;
    },
    removeItem: function( item ) {
	try {
	    if( Game.Rpg.Character.items.length === 0 ) throw "bag is empty";
	    var itemsWithoutItem = [];
	    var removed = false;
	    for( i in Game.Rpg.Character.items ) {
		if( Game.Rpg.Character.items[i] !== item || removed ) itemsWithoutItem.push( Game.Rpg.Character.items[i] );
		if( Game.Rpg.Character.items[i] === item && !removed ) removed = true;
	    }
	    if( removed === false ) throw "is no item";
	    Game.Rpg.Character.items = itemsWithoutItem;
	    Game.Rpg.Html.refreshGuiContent();
	} catch( e ) {
	    Game.Utils.log( 'removeItem e', e );
	    return false;
	}
	return true;
    },
    getItems: function() {
	return Game.Rpg.Character.items;
    },
    removeItems: function() {
	Game.Rpg.Character.items = [];
	Game.Rpg.Html.refreshGuiContent();
    },
    
    
    action: function( grid ) {
	//if( Game.Rpg.Character.closed === true ) return;
	var map = GameRpgMaps.current;
	Game.Rpg.Character.closed = true;
	try {
	    if( map.world.ambientMap[grid.x][grid.y] === 255 ) throw "no ambient here";
	    Game.Rpg.Character.actionGrowAmbient( grid );
	    Game.Rpg.Character.actionStorage( grid );
	} catch( e ) {
	    
	}
	Game.Rpg.Character.closed = false;
    },
    
    actionGrowAmbient: function( grid ) {
	try {
	    var map = GameRpgMaps.current;
	    var object = map.world.ambientObjects[grid.x][grid.y];
	    if( object.attributes.type !== 'item' ) throw "no item or to grow";
	    if( object.attributes.timeout !== 0 ) throw "growing, wait...";
	    if( Game.Rpg.Character.isBagFull() ) throw "bag is full";
	    if( object.meshBody.material.opacity > .3 ) {
		object.meshBody.material.opacity -= Game.Rpg.delta;
	    } else {
		if( !Game.Rpg.Character.addItem( map.world.ambientMap[grid.x][grid.y] ) ) throw "item not added?";
		Game.Rpg.Character.addExperience( object.attributes.experience );
		object.meshBody.visible = false;
		object.attributes.timeout = 500;
		object.meshBody.material.opacity = 0;
		Game.Rpg.World.spawnItems.push( [ grid.x, grid.y ] );
		Game.Rpg.Html.refreshGuiContent();
	    }
	} catch( e ) {
	    Game.Utils.log( 'Ambient e', e );
	}
    },
    actionStorage: function( grid ) {
	try {
	    var map = GameRpgMaps.current;
	    var object = map.world.ambientObjects[grid.x][grid.y];
	    if( object.attributes.type !== 'storage' ) throw "no storage here";
	    if( Game.Rpg.Character.items.length === 0 ) throw "bag is empty";
	    for( var i = 0; i < Game.Rpg.Character.items.length; i++ ) {
		if( Game.Rpg.World.addItemToStorage( object, Game.Rpg.Character.items[i] ) ) {
		    Game.Rpg.Character.removeItem( Game.Rpg.Character.items[i] );
		    Game.Rpg.Character.addExperience( Game.Rpg.World.getStorageExperience() );
		}
	    }
	    Game.Rpg.Html.refreshGuiContent();
	} catch( e ) {
	    Game.Utils.log( 'actionStorage e', e );
	}
    },
    addExperience: function( experience ) {
	try {
	    Game.Rpg.Character.stats.experience += experience;
	    var newLevel = Game.Rpg.Character.getLevel( Game.Rpg.Character.stats.experience );
	    if( newLevel > Game.Rpg.Character.stats.level ) {
		Game.Rpg.Character.stats.level = newLevel;
	    }
	} catch( e ) {
	    Game.Utils.log( 'addExperience e', e );
	}
    },
    getLevel: function( experience ) {
	var level = 1;
	for( var i in Game.Rpg.Character.levels ) {
	    if( experience >= Game.Rpg.Character.levels[ i ] ) level = i;
	}
	return level;
    }
};