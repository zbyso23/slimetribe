GameRpgAmbientList = [];
GameRpgAmbient = {
    rock1: {
	config: {
	    baseUrl: "slime-genesis/md2/ambient/",
	    body: "rock-1.js",
	    skins: [ "rock-1.gif" ],
	    weapons:  [ [ "rock-1.js", "rock-1.gif" ] ],
	    animations: { idle: "stand" },
	    runSpeed: 70,walkSpeed: 70,crouchSpeed: 25
	},
	params: { scale: 0.7, z: -1, y: 0, x: 0, rot: 0, opacity: 0.9 },
	attributes: {
	    type: 'item',
	    name: 'rock1',
	    spawn: true,
	    timeout: 0
	}
    },
    rock2: {
	config: {
	    baseUrl: "slime-genesis/md2/ambient/",
	    body: "rock-1.js",
	    skins: [ "rock-2.gif" ],
	    weapons:  [ [ "rock-1.js", "rock-2.gif" ] ],
	    animations: { idle: "stand" },
	    runSpeed: 70,walkSpeed: 70,crouchSpeed: 25
	},
	params: { scale: 0.7, z: -1, y: 0, x: 0, rot: 0, opacity: 0.9 },
	attributes: {
	    type: 'item',
	    name: 'rock2',
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
	    runSpeed: 70, walkSpeed: 70, crouchSpeed: 25
	},
	params: { scale: 0.55, z: 0, y: 0, x: 0, rot: 0, opacity: 0.9 },
	attributes: {
	    type: 'item',
	    name: 'mushrom1',
	    spawn: true,
	    timeout: 0
	}
    },
    mushrom2: {
	config: {
	    baseUrl: "slime-genesis/md2/ambient/",
	    body: "mushrom-1.js",
	    skins: [ "mushrom-2.gif" ],
	    weapons:  [ [ "weapon-blender2.js", "test-sword2.gif" ] ],
	    animations: {
		    idle: "stand"
	    },
	    runSpeed: 70, walkSpeed: 70, crouchSpeed: 25
	},
	params: { scale: 0.55, z: 0, y: 0, x: 0, rot: 0, opacity: 0.9 },
	attributes: {
	    type: 'item',
	    name: 'mushrom2',
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
	    itemsMax: 150,
	    items: [],
	    accept: [ 0, 1, 3, 4 ],
	    spawn: false,
	    timeout: 0
	}
    },
    storageAccept: function( id ) {
	var accept = false;
	for( i in GameRpgAmbient.storage1.attributes.accept ) {
	    console.log( 'GameRpgAmbient.storage1.attributes.accept', GameRpgAmbient.storage1.attributes.accept[i] );
	    console.log( 'GameRpgAmbient.storage1.attributes.accept <- ', id );
	    if( GameRpgAmbient.storage1.attributes.accept[i] == id ) accept = true;
	}
	return accept;
    },

    
    getAmbient: function( id ) {
	var ambient = false;
	try {
	    var i = -1;
	    for( i in GameRpgAmbientList ) {
		if( GameRpgAmbientList[i].id == id ) {
		    ambient = GameRpgAmbientList[i].object;
		    break;
		}
	    }
	} catch( e ) {
	    console.log( 'getAmbient ee', e );
	}
	return { item: ambient, name: i };
    }

};

GameRpgAmbientList = [ 
    { id: 0, object: GameRpgAmbient.mushrom1 }, 
    { id: 1, object: GameRpgAmbient.rock1 },
    { id: 2, object: GameRpgAmbient.storage1 },
    { id: 3, object: GameRpgAmbient.mushrom2 }, 
    { id: 4, object: GameRpgAmbient.rock2 }
];



