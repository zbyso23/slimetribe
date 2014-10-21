(function(){
	var baseUrl = "slime-genesis/md2/ambient/";
	var sets = {
		wood: 
		{
		    rock1: 
		    {
				config: 
				{
				    baseUrl: baseUrl, body: "rock-1.json", skins: [ "rock-1.jpg" ], animations: { idle: "stand" }
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
				    baseUrl: baseUrl, body: "rock-1.json", skins: [ "rock-2.jpg" ], animations: { idle: "stand" }
				},
				params: { scale: 0.7, z: -1, y: 0, x: 0, rot: 0, opacity: 0.53 },
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
				    baseUrl: baseUrl, body: "mushrom-1.json", skins: [ "mushrom-1.jpg" ], animations: { idle: "stand" }
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
				    baseUrl: baseUrl, body: "mushrom-1.json", skins: [ "mushrom-2.jpg" ], animations: { idle: "stand" }
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
				    baseUrl: baseUrl, body: "three-1.json", skins: [ "three-1.jpg" ], animations: { idle: "stand" }
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
				    baseUrl: baseUrl, body: "storage-1.json", skins: [ "storage-1.gif" ], animations: { idle: "stand" }
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
		}
	};

	var setsLists = 
	{
		wood: [
				    { id: 0,  object: sets.wood.storage1 },
				    { id: 1,  object: sets.wood.mushrom1 }, 
				    { id: 2,  object: sets.wood.mushrom2 }, 
				    { id: 3,  object: sets.wood.mushrom2 }, 
				    { id: 4,  object: sets.wood.mushrom2 }, 
				    { id: 5,  object: sets.wood.mushrom2 }, 
				    { id: 6,  object: sets.wood.rock1 },
				    { id: 7,  object: sets.wood.rock2 },
				    { id: 8,  object: sets.wood.rock2 },
				    { id: 9,  object: sets.wood.rock2 },
				    { id: 10, object: sets.wood.three1 }
		]
	};

	DataAmbientSets = function(name)
	{
		var name = name || 'wood';
		this.setName = function(name)
		{
			var name = name || 'wood';
		};

		this.get = function()
		{
			return sets[name];
		};

		this.getList = function()
		{
			return setsLists[name];
		};
	};
})();