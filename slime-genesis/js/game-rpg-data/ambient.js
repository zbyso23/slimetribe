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
	params: { scale: 0.9 }
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
	params: { scale: 0.9 }
    }
};

var GameRpgAmbientList = [ { id: 0, object: GameRpgAmbient.mushrom1 }, { id: 1, object: GameRpgAmbient.rock1 } ];