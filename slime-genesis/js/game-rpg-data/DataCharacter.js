(function(){
	    var object = 
	    {
			loaded: false,
			health: 100,
			object: {},
			md2: {},
			gyro: {},
			md2base: {},
			stats: {},
			controls: 
			{
			    reverseY: false,
			    reverseX: false
			},
			position: 
			{
			    x: 0, y: 87.6, z: 0
			},
			currentPosition: 
			{
			    x: 0, y: 72.6, z: 0
			},
			torch: {}
	    };

	    var player = 
	    {
			config: 
			{
				baseUrl: "slime-genesis/md2/slizak/",
				
			    body: "slizak.json",
			    skins: [ "slizak-red.gif" ],
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
			params: 
			{
			    scale: 3.430
			},
			items: 
			{
			    'rock1': 1,
			    'mushrom1': 0
			},
			stats: 
			{
			    health: 90,
			    healthRemain: 90,
			    experience: 0,
			    level: 1,
			    attack: 3,
			    defense: 4
			}
	    };

	    DataCharacter = function()
	    {
	    	this.get = function()
	    	{
	    		return player;
	    	};

	    	this.getObject = function()
	    	{
	    		return object;
	    	};
	    };
})();