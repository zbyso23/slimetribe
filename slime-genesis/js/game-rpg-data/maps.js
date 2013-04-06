var GameRpgMaps = {
    active: 'map02',
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
    current: {},
    setActive: function( map ) {
	var found = false;
	for( i in GameRpgMaps.mapList ) if( GameRpgMaps.mapList[ i ] === map ) found = true;
	if( found === true ) GameRpgMaps.active = map;
	return found;
    },
    setActiveToCurrent: function() {
	GameRpgMaps.current = GameRpgMaps[ GameRpgMaps.active ];
	
    },
    mapList: [ 'map01', 'map02' ]
    
};