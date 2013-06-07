Game.Rpg.World = {
    spawnItems: [],
    storageExperience: 15,
    ambientItemsCount: 0,
    ambientItemsLoaded: false,
    addItemToStorage: function( storage, item ) {
	try {
	    if( storage.attributes.itemsMax <= storage.attributes.items.length ) throw "storage is full";
	    if( GameRpgAmbient.storageAccept( item ) === false ) throw "storage dont get this item";
	    storage.attributes.items.push( item );
	} catch( e ) {
	    Game.Utils.log( 'addItemToStorage' , e );
	    return false;
	}
	return true;
    },
    getStorageExperience: function() {
	return Math.round( Game.Rpg.World.storageExperience + Math.random() * 2.3 );
    },
    spawn: function( delta ) {
	try {
	    var map = GameRpgMaps.current;
	    if( gameRpgData.character.md2.controls.grow === true ) throw "growing lock";
	    var newSpawnItems = [];
	    var change = false;
	    for( var i in Game.Rpg.World.spawnItems ) {
		var object = map.world.ambientObjects[ Game.Rpg.World.spawnItems[ i ][0] ][ Game.Rpg.World.spawnItems[ i ][1] ];
		object.attributes.timeout -= Game.Rpg.delta;
		if( object.attributes.timeout < 4 ) {
		    object.meshBody.visible = true;
		    object.meshBody.material.opacity = .9;
		    change = true;
		} else {
		    newSpawnItems.push( Game.Rpg.World.spawnItems[ i ] );
		}
	    }
	    if( !change ) throw "no item fully spawned";
	    Game.Rpg.World.spawnItems = newSpawnItems;
	} catch( e ) {
	    Game.Utils.log( 'spawn' , e );
	}
    }

};