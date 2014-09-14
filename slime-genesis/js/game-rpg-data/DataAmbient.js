(function(){

	IDataAmbient =
	{
		this.initialize = function() {},
	    this.storageAccept = function( id ) {},
	    this.getAmbient = function( id ) {}
	};

	var RpgAmbientList = [];
	var RpgAmbient     = 
	{
	    rock1: 
	    {
			config: 
			{
			    baseUrl: "slime-genesis/md2/ambient/",
			    body: "rock-1.json",
			    skins: [ "rock-1.gif" ],
			    weapons:  [ [ "rock-1.json", "rock-1.gif" ] ],
			    animations: { idle: "stand" },
			    runSpeed: 70,walkSpeed: 70,crouchSpeed: 25
			},
			params: { scale: 0.7, z: -1, y: 0, x: 0, rot: 0, opacity: 0.9 },
			attributes: 
			{
			    type: 'item',
			    name: 'rock1',
			    spawn: true,
			    experience: 5,
			    timeout: 0
			}
	    },
	    rock2: 
	    {
			config: 
			{
			    baseUrl: "slime-genesis/md2/ambient/",
			    body: "rock-1.json",
			    skins: [ "rock-2.gif" ],
			    weapons:  [ [ "rock-1.json", "rock-2.gif" ] ],
			    animations: { idle: "stand" },
			    runSpeed: 70,walkSpeed: 70,crouchSpeed: 25
			},
			params: { scale: 0.7, z: -1, y: 0, x: 0, rot: 0, opacity: 0.9 },
			attributes: 
			{
			    type: 'item',
			    name: 'rock2',
			    experience: 230,
			    spawn: true,
			    timeout: 0
			}
	    },
	    mushrom1: 
	    {
			config: 
			{
			    baseUrl: "slime-genesis/md2/ambient/",
			    body: "mushrom-1.json",
			    skins: [ "mushrom-1.gif" ],
			    weapons:  [ [ "weapon-blender2.json", "test-sword2.gif" ] ],
			    animations: { idle: "stand" },
			    runSpeed: 70, walkSpeed: 70, crouchSpeed: 25
			},
			params: { scale: 0.55, z: 0, y: 0, x: 0, rot: 0, opacity: 0.9 },
			attributes: 
			{
			    type: 'item',
			    experience: 7,
			    name: 'mushrom1',
			    spawn: true,
			    timeout: 50
			}
	    },
	    mushrom2: 
	    {
			config: 
			{
			    baseUrl: "slime-genesis/md2/ambient/",
			    body: "mushrom-1.json",
			    skins: [ "mushrom-2.gif" ],
			    weapons:  [ [ "weapon-blender2.json", "test-sword2.gif" ] ],
			    animations: {
				    idle: "stand"
			    },
			    runSpeed: 70, walkSpeed: 70, crouchSpeed: 25
			},
			params: { scale: 0.55, z: 0, y: 0, x: 0, rot: 0, opacity: 0.9 },
			attributes: 
			{
			    type: 'item',
			    name: 'mushrom2',
			    spawn: true,
			    experience: 7,
			    timeout: 100
			}
	    },
	    three1: 
	    {
			config: 
			{
			    baseUrl: "slime-genesis/md2/ambient/",
			    body: "three-1.json",
			    skins: [ "three-1.gif" ],
			    weapons:  [ [ "weapon-blender2.json", "test-sword2.gif" ] ],
			    animations: { idle: "stand" },
			    runSpeed: 70, walkSpeed: 70, crouchSpeed: 25
			},
			params: { scale: 1.23, z: 0, y: 0, x: 0, rot: 0, opacity: 0.75 },
			attributes: 
			{
			    type: 'static',
			    name: 'three1',
			    spawn: false,
			    experience: 1,
			    timeout: 0
			}
	    },
	    storage1: 
	    {
			config: 
			{
			    baseUrl: "slime-genesis/md2/ambient/",
			    body: "storage-1.json",
			    skins: [ "storage-1.gif" ],
			    weapons:  [ [ "weapon-blender2.json", "test-sword2.gif" ] ],
			    animations: { idle: "stand" },
			    runSpeed: 70,
			    walkSpeed: 70,
			    crouchSpeed: 25
			},
			params: { scale: 2.05, z: 7, y: 0, x: 0, rot: -1.57, opacity: 0.45 },
			attributes: 
			{
			    type: 'storage',
			    itemsMax: 150,
			    items: [],
			    accept: [ 1, 2, 3, 4, 5, 6 ],
			    spawn: false,
			    timeout: 0
			}
	    }
	};

	DataAmbient = function()	
	{
		GameRpgAmbientList = 
		[
		    { id: 0,  object: RpgAmbient.storage1 },
		    { id: 1,  object: RpgAmbient.mushrom1 }, 
		    { id: 2,  object: RpgAmbient.mushrom2 }, 
		    { id: 3,  object: RpgAmbient.mushrom2 }, 
		    { id: 4,  object: RpgAmbient.mushrom2 }, 
		    { id: 5,  object: RpgAmbient.mushrom2 }, 
		    { id: 6,  object: RpgAmbient.rock1 },
		    { id: 7,  object: RpgAmbient.rock2 },
		    { id: 8,  object: RpgAmbient.rock2 },
		    { id: 9,  object: RpgAmbient.rock2 },
		    { id: 10, object: RpgAmbient.three1 }
		];
	};

	DataAmbient.prototype = Object.create(IDataAmbient);

	DataAmbient.prototype.initialize = function()
	{
	};

    DataAmbient.prototype.storageAccept = function( id ) 
    {
		for( i in RpgAmbient.storage1.attributes.accept ) if( RpgAmbient.storage1.attributes.accept[i] == id ) return true;
		return false;
    },
    
    DataAmbient.prototype.getAmbient = function( id ) 
    {
		var ambient = false;
		try 
		{
		    var i = -1;
		    for( i in GameRpgAmbientList ) 
		    {
				if( GameRpgAmbientList[i].id == id )
				{
				    ambient = GameRpgAmbientList[i].object;
				    break;
				}
		    }
		} 
		catch( e ) 
		{
		    console.log( 'getAmbient ee', e );
		}
		return { item: ambient, name: i };
    };
})();