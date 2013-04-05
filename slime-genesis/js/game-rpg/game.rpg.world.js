Game.Rpg.World = {
    storageExperience: 15,
    addItemToStorage: function( storage, item ) {
	try {
	    if( storage.attributes.itemsMax <= storage.attributes.items.length ) throw "storage is full";
	    if( GameRpgAmbient.storageAccept( item ) === false ) throw "storage dont get this item";
	    storage.attributes.items.push( item );
	} catch( e ) {
	    return false;
	}
	return true;
    },
    getStorageExperience: function() {
	return Math.round( Game.Rpg.World.storageExperience + Math.random() * 2.3 );
    }

};