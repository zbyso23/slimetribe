var tick = 0;
var gameDataImages = {
    loadedRemain: 0,
    loaded: false,
    items: [],
    list: [
	{ id: 'map', url: 'slime-genesis/textures/ground/map02light.png', w: 128, h: 128 }
	
    ]
};
var gameResources = {
    images: {
	map: { image: {}, canvas: {}, w: 128, h: 128 }
    }
}
var gameRpgData = {
    run: false,
    character: {
	loaded: false,
	health: 100,
	object: {},
	md2: {},
	gyro: {},
	md2base: {},
	stats: {},
	controls: {
	    reverseY: false,
	    reverseX: false
	},
	position: {
	    x: 0, y: 87.6, z: 0
	},
	currentPosition: {
	    x: 0, y: 72.6, z: 0
	},
	torch: {}
    },
    world: {
		ready: false,
		ground: { width: 4096, height: 4096, id: 0, object: {}/*refactor, map: [], collision: [], ambient: [] */},
		skybox: { size: 5000, imagesPath: "slime-genesis/images/skybox/space/", object: {}, loaded: false },
		ambientObjects: [],
		ambientMap: [],
		collisionMap: [],
		heightMap: []
	
    },
    settings: {
	graphics: {
	    shadows: 'low',
	    antialiasing: true,
	    models: { name: 'Low', id: 'low', groundGridX: 127, groundGridY: 127, divider: 3 }
	}
    },
    player: {
		config: {
			baseUrl: "slime-genesis/md2/slizak/",

			body: "slizak.json",
			skins: [ "slizak-necro2.gif" ],
			weapons:  [ [ "weapon-blender2.json", "test-sword2.gif" ] ],
			animations: {
				move: "run",
				idle: "stand",
				attack: "attack",
				grow: "grow"
			},
			runSpeed: 130,
			walkSpeed: 130,
			crouchSpeed: 25
		},
		params: {
			scale: 1.430
		},
		items: {
			'rock1': 0,
			'mushrom1': 0
		},
		stats: {
			health: 90,
			healthRemain: 90,
			experience: 0,
			level: 1,
			attack: 3,
			defense: 4
		}
    }
};


var gameMenu = {
    'main': {
	'new': { 'name': 'New Game' },
	'load': { 'name': 'Load Game' },
	'character': { 'name': 'Character Editor' },
	'settings': {
	    'graphics': { 
		'shadows': [
		    { 'name': 'None', 'id': 'none' },
		    { 'name': 'Low', 'id': 'low' },
		    { 'name': 'Medium', 'id': 'medium' },
		    { 'name': 'High', 'id': 'high' }
		],
		'antialiasing': [
		    { 'name': 'Yes', 'id': true },
		    { 'name': 'No', 'id': false }
		],
		'postprocessing': [
		    { 'name': 'None', 'id': 'none' },
		    { 'name': 'Low', 'id': 'low' },
		    { 'name': 'High', 'id': 'high' }
		],
		'models': [
		    { 'name': 'Low', 'id': 'low', 'groundGridX': 32, 'groundGridY': 32 },
		    { 'name': 'Medium', 'id': 'medium', 'groundGridX': 128, 'groundGridY': 128 },
		    { 'name': 'High', 'id': 'High', 'groundGridX': 512, 'groundGridY': 512 },
		]
	    },
	    'controls': {
		'define': [
		    { 'name': 'Up', 'id': 'UP' },
		    { 'name': 'Down', 'id': 'DOWN' },
		    { 'name': 'Left', 'id': 'LEFT' },
		    { 'name': 'Right', 'id': 'RIGHT' },
		    { 'name': 'Jump', 'id': 'JUMP' },
		    { 'name': 'Sprint', 'id': 'SPRINT' },
		    { 'name': 'Use', 'id': 'USE' },
		    { 'name': 'Attack', 'id': 'ATTACK' },
		    { 'name': 'Defense', 'id': 'DEFENSE' }
		],
		'sensitivity': [
		    { 'name': 'Low', 'id': 'low' },
		    { 'name': 'High', 'id': 'high' }
		]
	    }
	}
    }
}

// var KEYS = { 
//     LEFT:37, RIGHT:39, UP:38, DOWN:40, 
//     SPACE:32, CTRL: 17, SHIFT: 16, ALT: 18 
// };

// var playerKeys = KEYS;
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;
var container, camera, scene, renderer, projector;
var groundHeightMap;
var vectorsGround = [];
var vectors = [];
var w;
var characters = [];
var nCharacters = 0;
var cameraControls;
var controls = {
	moveForward: false,
	moveBackward: false,
	moveLeft: false,
	moveRight: false,
	jump: false,
	attack: false,
	block: false,
	grow: false,
	lockForward: false,
	lockBackward: false,
	lockLeft: false,
	lockRight: false
};



var t = 0;