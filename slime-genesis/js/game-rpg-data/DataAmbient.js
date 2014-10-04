(function(){

	IDataAmbient =
	{
		initialize: function() {},
	    storageAccept: function( id ) {},
	    getAmbient: function( id ) {}
	};

	var baseUrl = "slime-genesis/md2/ambient/";
	var RpgAmbientList = [];
	var RpgAmbient     = 
	{
	    rock1: 
	    {
			config: 
			{
			    baseUrl: baseUrl,
			    body: "rock-1.json",
			    skins: [ "rock-1.gif" ],
			    animations: { idle: "stand" }
			},
			params: { scale: 1.1, z: -1, y: 0, x: 0, rot: 0, opacity: 0.95 },
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
			    baseUrl: baseUrl,
			    body: "rock-1.json",
			    skins: [ "rock-2.gif" ],
			    animations: { idle: "stand" }
			},
			params: { scale: 1.1, z: -1, y: 0, x: 0, rot: 0, opacity: 0.95 },
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
			    baseUrl: baseUrl,
			    body: "mushrom-1.json",
			    skins: [ "mushrom-1.gif" ],
			    animations: { idle: "stand" }
			},
			params: { scale: 1.15, z: 0, y: 0, x: 0, rot: 0, opacity: 0.95 },
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
			    baseUrl: baseUrl,
			    body: "mushrom-1.json",
			    skins: [ "mushrom-2.gif" ],
			    animations: { idle: "stand" }
			},
			params: { scale: 1.15, z: 0, y: 0, x: 0, rot: 0, opacity: 0.95 },
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
			    baseUrl: baseUrl,
			    body: "three-1.json",
			    skins: [ "three-1.gif" ],
			    animations: { idle: "stand" }
			},
			params: { scale: 5.23, z: 0, y: 0, x: 0, rot: 0, opacity: 0.95 },
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
			    baseUrl: baseUrl,
			    body: "storage-1.json",
			    skins: [ "storage-1.gif" ],
			    animations: { idle: "stand" }
			},
			params: { scale: 5.05, z: 7, y: 0, x: 0, rot: -1.57, opacity: 0.45 },
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

		this.initialize = function()
		{

		};

	    this.storageAccept = function( id ) 
	    {
			for( i in RpgAmbient.storage1.attributes.accept ) if( RpgAmbient.storage1.attributes.accept[i] == id ) return true;
			return false;
	    },
	    
	    this.getAmbient = function( id ) 
	    {
			var ambient = false;
			try 
			{
			    var i;
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
			return ambient;
	    };
	};

})();