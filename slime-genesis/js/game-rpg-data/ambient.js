var GameRpgAmbient = {
    rock1: {
	config: {
	    baseUrl: "slime-genesis/md2/ambient/",
	    body: "rock-1.js",
	    skins: [ "rock-1.gif" ],
	    weapons:  [ [ "rock-1.js", "rock-1.gif" ] ],
	    animations: {
		    idle: "stand"
	    },
	    runSpeed: 70,
	    walkSpeed: 70,
	    crouchSpeed: 25
	},
	params: { scale: 0.7, z: -1, y: 0, x: 0, rot: 0, opacity: 0.9 },
	attributes: {
	    type: 'item',
	    name: 'rock1',
	    spawn: true,
	    timeout: 0
	}
    },
    mushrom1: {
	config: {
	    baseUrl: "slime-genesis/md2/ambient/",
	    body: "mushrom-1.js",
	    skins: [ "mushrom-1.gif" ],
	    weapons:  [ [ "weapon-blender2.js", "test-sword2.gif" ] ],
	    animations: {
		    idle: "stand"
	    },
	    runSpeed: 70,
	    walkSpeed: 70,
	    crouchSpeed: 25
	},
	params: { scale: 0.55, z: 0, y: 0, x: 0, rot: 0, opacity: 0.9 },
	attributes: {
	    type: 'item',
	    name: 'mushrom1',
	    spawn: true,
	    timeout: 0
	}
    },
    storage1: {
	config: {
	    baseUrl: "slime-genesis/md2/ambient/",
	    body: "storage-1.js",
	    skins: [ "storage-1.gif" ],
	    weapons:  [ [ "weapon-blender2.js", "test-sword2.gif" ] ],
	    animations: {
		    idle: "stand"
	    },
	    runSpeed: 70,
	    walkSpeed: 70,
	    crouchSpeed: 25
	},
	params: { scale: 2.05, z: 7, y: 0, x: 0, rot: -1.57, opacity: 0.45 },
	attributes: {
	    type: 'storage',
	    accept: [ 'mushrom1', 'rock1' ],
	    spawn: false,
	    timeout: 0
	}
    }

};

var GameRpgAmbientList = [ 
    { id: 0, object: GameRpgAmbient.mushrom1 }, 
    { id: 1, object: GameRpgAmbient.rock1 },
    { id: 2, object: GameRpgAmbient.storage1 }
];