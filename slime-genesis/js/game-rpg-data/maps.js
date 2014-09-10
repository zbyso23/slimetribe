var GameRpgMaps = {
    mapList: [ 'map01', 'map02' ],
    active: 'map01',
    current: {},
    map01: {
	config: {
	    groundTexture: "slime-genesis/textures/terrain/grass-1024.jpg",
	    groundImage: "slime-genesis/textures/ground/map01light.png",
	    groundMap: "map",
	    gridX: 127,
	    gridY: 127
	},
	world: {
	    ambientMap: [],
	    ambientObjects: [],
	    collisionMap: [],
	    heightMap: []
	},
	ground: {
	    width: 4096, 
	    height: 4096, 
	    id: 0, object: {}
	}
    },
    map02: {
	config: {
	    groundTexture: "slime-genesis/textures/terrain/grass-1024.jpg",
	    groundImage: "slime-genesis/textures/ground/map02light.png",
	    groundMap: "map",
	    gridX: 127,
	    gridY: 127
	},
	world: {
	    ambientMap: [],
	    ambientObjects: [],
	    collisionMap: [],
	    heightMap: []
	},
	ground: {
	    width: 4096, 
	    height: 4096, 
	    id: 0, object: {}
	}
    },
    setActive: function( map ) {
	try {
	    var exists = GameRpgMaps.mapExists( map );
<<<<<<< HEAD
	    if( false === exists ) throw "map not found";
=======
	    if( !exists ) throw "map not found";
>>>>>>> fb93c3f738b35af0f6ca3c998fa00faee7a57e98
	    GameRpgMaps.active = map;
	} catch( e ) {
	    
	}
	return exists;
	
    },
    setActiveToCurrent: function() {
	GameRpgMaps.current = GameRpgMaps[ GameRpgMaps.active ];
    },
    mapExists: function( map ) {
<<<<<<< HEAD
	for( i in GameRpgMaps.mapList ) if( GameRpgMaps.mapList[ i ] === map ) return true;
	return false;
=======
	var exists = false;
	for( i in GameRpgMaps.mapList ) if( GameRpgMaps.mapList[ i ] === map ) exists = true;
	return exists;
>>>>>>> fb93c3f738b35af0f6ca3c998fa00faee7a57e98
    }
};