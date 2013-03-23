if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
var controls = {
    moveForward: false, moveBackward: false, moveLeft: false, moveRight: false, move: false,
    crouch: false, jump: false, attack: false, defense: false, healing: false, death: false, block: false, 
    lockForward: false, lockBackward: false, lockLeft: false, lockRight: false
};

var KEYS = { 
    RIGHT:39, UP:38, LEFT:37, DOWN:40, SPACE:32, CTRL: 17, SHIFT: 16, ALT: 18,
    F1: 112, F2: 113, F3: 114, F4: 115, F5: 116, F6: 117, 
    F7: 118, F8: 119, F9: 120, F10: 121, F11: 122, F12: 123,
    ESC: 27, ENTER: 13, INSERT: 45, DELETE: 46, HOME: 36, END: 35,
    NUM0: 48, NUM1: 49, NUM2: 50, NUM3: 51, NUM4: 52, NUM5: 53, NUM6: 54, NUM7: 55, NUM8: 56, NUM9: 57
};
var DIR = { 
    LEFT: -1.57, TOP: 3.14, BOTTOM: 0, RIGHT: 1.57,
    LEFTTOP: -2.35, RIGHTTOP: 2.35, LEFTBOTTOM: -0.78, RIGHTBOTTOM: 0.78
};
var playerKeys = KEYS;

var tick = 0;
var gameDataImages = {
    'loadedRemain': 0,
    'list': [
	{ 'id': 'loading-screen', 'url': 'slime/images/title.png', 'w': 1024, 'h': 768 }
    ]
};
var gameResources = {
    'images': {
	'loading-screen': { 'image': {}, 'canvas': {}, 'w': 1024, 'h': 768 }
    }
};

gameData = {
    run: false,
    gameOver: false,
    state: 'adventure',
    character: {
	position: {
	    x: 0, y: 51.6, z: 0
	},
	currentPosition: {
	    x: 0, y: 72.6, z: 0
	},
	controls: {
	    reverseY: false,
	    reverseX: false
	},
	torch: {}
    },
    rotation: {
	left: DIR.RIGHT,
	right: DIR.LEFT
    },
    battle: {
	selection: {
	    selected: false,
	    x: -1,
	    y: -1,
	    player: 'left',
	    path: [],
	    movePath: [],
	    attack: false,
	    attackCords: [],
	    turn: 1,
	    endTurn: false,
	    endTurnAnimation: false,
	    hero: {},
	    enemyHero: {}
	},
	plane: {
	    leftHero: 'knight',
	    rightHero: 'knight',
	    gridWidth: 10,
	    gridHeight: 10,
	    step: 0,
	    halfStep: 0,
	    grid: []
	},
	world: {
	    ready: false,
	    first: true,
	    reset: false,
	    ground: { 'width': 1024, 'height': 1024, 'id': 0, 'object': {}, 'map': [], 'collision': [], 'damage': [] },
	    ambient: { 'scale': { x: -1, y: 1, z: 1 }, 'id': 0, 'object': {} }
	},
	gui: {
	    cords: []
	}
    },
    adventure: {
	selection: {
	    selected: false,
	    x: -1,
	    y: -1,
	    player: 'left',
	    path: [],
	    movePath: [],
	    attack: false,
	    attackCords: [],
	    turn: 1,
	    endTurn: false,
	    endTurnAnimation: false,
	    hero: {},
	    enemyHero: {}
	},
	world: {
	    ready: false,
	    first: true,
	    reset: false,
	    map: {}
	},
	plane: {
	    gridWidth: 100,
	    gridHeight: 100,
	    step: 0,
	    halfStep: 0,
	    grid: []
	},
	gui: {
	    cords: []
	}
    },
    
    
    
    
    settings: {
	graphics: {
	    shadows: 'high',
	    antialiasing: false,
	    anisotropy: 0,
	    models: { 'name': 'Low', 'id': 'low', 'groundGridX': 127, 'groundGridY': 127 },
            textures: 'low'
	}
    },
    loader: {
	imagesCount: 0,
	jsonCount: 0,
	jsonCountAll: 0,
	jsonLoaded: false,
	soudsCount: 0,
	soundsLoaded: false,
	resourcesCount: 0,
	resourcesLoaded: false
    },
    animation: {
	run: false,
	progress: false,
	nextX: 0,
	nextY: 0,
	currX: 0,
	currX: 0,
	nextCX: 0,
	nextCY: 0,
	baseX: 0,
	baseY: 0,
	moveX: 0,
	moveY: 0,
	move: false,
	targetX: 0,
	targetY: 0,
	dirs: { x: 0, y: 0 },
	path: [],
	step: 0,
	length: 0,
	object: {},
	targetObject: {},
	realStep: 150,
	attack: false,
	withAttack: false,
	nearAttack: false,
	death: false,
	withDeath: false,
	healing: false,
	withHealing: false,
	centering: false,
	damage: 0,
	heal: 0
    }
};

var MOUSE2D = { x: 0, y: 10000, z: 0.5 }
var CAMERA = { x: 1425.48, y: 990, z: 512, rotX: -1.57, rotY: 0.7, rotZ: 1.57, ratio: window.innerWidth / window.innerHeight, far: 5000, near: 1, fov: 45 };
var FOG = { enabled: false, color: 0xffffff, near: 1, far: 4000 };
var LIGHTS = {
	ambient: { color: 0xffffff },
	light: { color: 0xffffff, intensity: 1.15, x: -1000, y: 2000, z: -1000 },
	healingLight: { color: 0xffffff, intensity: 1, distance: 150, x: -1000, y: 2000, z: -1000 },
	healerLight: { color: 0xff77ff, intensity: 1, distance: 150, x: -1000, y: 2000, z: -1000 },
	magicLight: { color: 0xffffff, intensity: 1, distance: 150, x: -1000, y: 2000, z: -1000 },
	magicanLight: { color: 0xffffff, intensity: 1, distance: 150, x: -1000, y: 2000, z: -1000 },
	torchLight: { color: 0x5555ff, intensity: 50, distance: 60, x: -1000, y: 20, z: -1000 }
    }
var BATTLE_GRID = {
    none: { color: 0xffffff, opacity: 0.15 },
    left: { color: 0x0000ff, opacity: 0.1 },
    right: { color: 0x00ff00, opacity: 0.1 },
    neutral: { color: 0xffffff, opacity: 0.45 },
    free: { color: 0x00ff00, opacity: 0.37 },
    freeClear: { color: 0x00ff00, opacity: 0.15 },
    enemy: { color: 0xff0000, opacity: 0.35 },
    enemyFar: { color: 0xaf90af, opacity: 0.30 },
    noMove: { color: 0x772222, opacity: 0.35 },
    noMoveClear: { color: 0x772222, opacity: 0.15 },
    magic: { color: 0xff00ff, opacity: 0.35 },
    magican: { color: 0xff00ff, opacity: 0.35 },
    healer: { color: 0xffff00, opacity: 0.35 },
    healing: { color: 0xffff00, opacity: 0.35 },
    height: 7,
    size: 90,
    transparent: true
};
var ADVENTURE_GRID = {
    none: { color: 0xffffff, opacity: 0.15 },
    left: { color: 0x0000ff, opacity: 0.1 },
    right: { color: 0x00ff00, opacity: 0.1 },
    neutral: { color: 0xffffff, opacity: 0.45 },
    free: { color: 0x00ff00, opacity: 0.37 },
    freeClear: { color: 0x00ff00, opacity: 0.15 },
    enemy: { color: 0xff0000, opacity: 0.35 },
    enemyFar: { color: 0xaf90af, opacity: 0.30 },
    noMove: { color: 0x772222, opacity: 0.35 },
    noMoveClear: { color: 0x772222, opacity: 0.15 },
    height: 7,
    size: 90,
    transparent: true
};
var BATTLE = {
    ground: {
	textures: {
	    difuse: "slime/textures/grasslight-big.jpg",
	    normal: "slime/textures/grasslight-big.jpg"
	},
	color: 0xffffff,
	shininess: 50,
	specular: 0x333333,
	normalScale: new THREE.Vector2( 0.8, 0.8 ),
	bump: 0,//7.5
	shading: THREE.SmoothShading,
	rotation: -1.57
    },
    ambient: {
	textures: {
	    difuse: "slime/textures/grass_sand_final.jpg",
	    normal: "slime/textures/grass_sand_final.jpg",
	    bump: "slime/textures/grass_sand_final.jpg"
	},
	color: 0xffffff,
	shininess: 50,
	specular: 0x333333,
	normalScale: new THREE.Vector2( 0.1, 0.1 ),
	bump: 0.5,
	shading: THREE.SmoothShading,
	position: {x: 500, y: 20, z: 555}, //{x: 470, y: 80, z: 535}
	rotation: { x: 1.57, y: 3.14, z: -1.57 },
	scale:  {x: -2.1, y: 2.2, z: 1}  // { x: -4.1, y: 4, z: 4 }
    }
};
var BATTLE_AI = {
    easy: {
	findBestManaFormula: function( a, b ){ return b['manaRemain'] - a['manaRemain'] },
	findBestEnemyIntruder: function( a, b ){ return ( a['healthRemain'] ) - ( b['healthRemain'] ) },
	findBestEnemyHealer: function( a, b ){ return b['manaRemain'] - a['manaRemain'] },
	findBestEnemyMagican: function( a, b ){ return b['healthRemain'] - a['healthRemain'] },
	findBestEnemyAttack: function( a, b ){ return ( a['stats']['attack'] ) - ( b['stats']['attack'] ) },
	findBestAttack: function( a, b ){ return ( b['stats']['attack'] * b['speedRemain'] ) - ( a['stats']['attack'] * b['speedRemain'] ) }
    },
    medium: {
	findBestManaFormula: function( a, b ){ return ( b['manaRemain'] * b['stats']['magic'] ) - ( a['manaRemain'] * a['stats']['magic'] ) },
	findBestEnemyIntruder: function( a, b ){ return ( a['healthRemain'] / a['stats']['speed'] ) - ( b['healthRemain'] / b['stats']['speed'] ) },
	findBestEnemyHealer: function( a, b ){ return b['stats']['magicDefense'] - a['stats']['magicDefense'] },
	findBestEnemyMagican: function( a, b ){ return a['healthRemain'] - b['healthRemain'] },
	findBestEnemyAttack: function( a, b ){ return ( ( a['stats']['defense'] ) * a['healthRemain'] ) - ( ( b['stats']['defense'] ) * b['healthRemain'] ) },
	findBestAttack: function( a, b ){ return ( b['stats']['attack'] * b['healthRemain'] * b['speedRemain'] ) - ( a['stats']['attack'] * a['healthRemain'] * b['speedRemain'] ) }
    },
    hard: {
	findBestManaFormula: function( a, b ){ return b['manaRemain'] - a['manaRemain'] },
	findBestEnemyIntruder: function( a, b ){ return ( a['stats']['attack'] * a['healthRemain'] ) - ( b['stats']['attack'] * b['healthRemain'] ) },
	findBestEnemyHealer: function( a, b ){ return b['stats']['magicDefense'] * b['stats']['defense'] - a['stats']['magicDefense'] * a['stats']['defense'] },
	findBestEnemyMagican: function( a, b ){ return a['healthRemain'] * a['stats']['magicDefense'] * a['stats']['defense'] - b['healthRemain'] * b['stats']['magicDefense'] * b['stats']['defense'] },
	findBestEnemyAttack: function( a, b ){ return ( a['stats']['attack'] * a['healthRemain'] ) - ( b['stats']['attack'] * b['healthRemain'] ) },
	findBestAttack: function( a, b ){ return ( b['stats']['attack'] * b['healthRemain'] * b['speedRemain'] ) - ( a['stats']['attack'] * a['healthRemain'] * b['speedRemain'] ) }
    }

};


var HTML = {
    id: {
	leftPlayer: 'left-player',
	rightPlayer: 'right-player',
	turn: 'center-turn',
	loading: 'loading',
	loadingImage: 'loading-image',
	loadingAdventure: 'loading-adventure',
	loadingAdventureImage: 'loading-adventure-image',
	loadingBarBg: 'loading-bar-bg',
	loadingBar: 'loading-bar'


    }
};

var animSpeedFpsStep = 0.2;
var animSpeed = 120;
var animSpeedCalibrationCycles = 0;
var animSpeedCalibrated = false;

var gameMenu = {
    main: {
	newGame: { name: 'New Game' },
	loadGame: { name: 'Load Game' },
	settings: {
	    graphics: { 
		shadows: [
		    { name: 'None', id: 'none' },
		    { name: 'Low', id: 'low' },
		    { name: 'Medium', id: 'medium' },
		    { name: 'High', id: 'high' }
		],
		antialiasing: [
		    { name: 'Yes', id: true },
		    { name: 'No', id: false }
		],
		postprocessing: [
		    { name: 'None', id: 'none' },
		    { name: 'Low', id: 'low' },
		    { name: 'High', id: 'high' }
		],
		models: [
		    { name: 'Low', id: 'low' },
		    { name: 'Medium', id: 'medium' },
		    { name: 'High', id: 'High' },
		]
	    }
	}
    }
}

var heroes = {
    left: {
	params: {
	    scale: 2.4
	},
	ai: false,
	level: 'medium',
	army: [ 
	    { name: 'healer-swamp', pos: [ [0,0], [0,8] ] }, 
	    { name: 'healer', pos: [ [0,7] ] },
	    { name: 'magican-swamp', pos: [ [0,3] ] },
	    { name: 'magican', pos: [ [0,6] ] },
	    { name: 'slizak-swamp', pos: [ [1,1], [1,4], [1,6] ] },
	    { name: 'octopus', pos: [ [1,3] ] },
	    { name: 'octopus-swamp', pos: [ [1,8] ] },
	    { name: 'slizak', pos: [ [1,5], [1,7] ] }
	],/*
	army: [ 
	    { name: 'slizak', pos: [ [1,5] ] }
	],*/
	controls: controls,
	grid: [],
	monsters: []
    },
    right: {
	params: {
	    scale: 0.4
	},
	ai: true,
	level: 'medium',
	army: [
	    { name: 'healer-necro', pos: [ [0,0], [0,2], [0,6] ] }, 
	    { name: 'magican-necro', pos: [ [0,4], [0,8] ] },
	    { name: 'octopus-necro', pos: [ [1,0], [1,8] ] },
	    { name: 'slizak-necro', pos: [ [1,1], [1,2], [1,5], [0,6], [1,7], [1,9] ] }
	],/*
	army: [
	    { name: 'slizak-necro', pos: [ [1,5] ] }
	],*/
	controls: controls,
	grid: [],
	monsters: []
    }
}

var tribe = {
    player: {
	army: [ 
	    { name: 'healer-swamp', pos: [ [0,0], [0,8] ] }, 
	    { name: 'healer', pos: [ [0,7] ] },
	    { name: 'magican-swamp', pos: [ [0,3] ] },
	    { name: 'magican', pos: [ [0,6] ] },
	    { name: 'slizak-swamp', pos: [ [1,1], [1,4], [1,6] ] },
	    { name: 'octopus', pos: [ [1,3] ] },
	    { name: 'octopus-swamp', pos: [ [1,8] ] },
	    { name: 'slizak', pos: [ [1,5], [1,7] ] }
	],
	character: { name: 'magican-swamp' },
	controls: controls,
	grid: [],
	monsters: []
    }
}



gameData.battle.selection.hero = ( gameData.battle.selection.player == "left" ) ? heroes.left : heroes.right;
gameData.battle.selection.enemyHero = ( gameData.battle.selection.player == "right" ) ? heroes.left : heroes.right;

var monstersModels = [];
var gridModels = [];
var gridModelsCords = [];
var deathGridModels = [];
var healing, healer;

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var canvas, container;
var camera, scene, renderer;
var raycaster, projector;
var mouse2D, mouse3D;
var light, ambientLight, torch;
var clock = new THREE.Clock();
var delta;
