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
    setActive: function( map ) 
    {
		try 
		{
		    var exists = GameRpgMaps.mapExists( map );
		    if( false === exists ) throw "map not found";
		    GameRpgMaps.active = map;
		} 
		catch( e ) 
		{
		    
		}
		return exists;
		
    },
    setActiveToCurrent: function() 
    {
		GameRpgMaps.current = GameRpgMaps[ GameRpgMaps.active ];
    },
    mapExists: function( map ) 
    {
		for( i in GameRpgMaps.mapList ) if( GameRpgMaps.mapList[ i ] === map ) return true;
		return false;
    }
};