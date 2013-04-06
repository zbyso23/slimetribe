var GameRpgMaps = {
    active: 'map02',
    map01: {
	config: {
	    groundTexture: "slime-genesis/textures/terrain/grass-1024.jpg",
	    groundMap: "ground-map1",
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
	    groundMap: "ground-map2",
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
    setActiveToCurrent: function() {
	GameRpgMaps.current = GameRpgMaps[ GameRpgMaps.active ];
    }
    
};