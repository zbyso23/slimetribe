(function(){

    var mapList = [ 'map01', 'map02' ];
    var active  = 'map01';
    var current = {};
    var maps    = 
    {
	    map01:
	    {
			config: 
			{
			    groundTexture: "slime-genesis/textures/terrain/grass-1024.jpg",
			    groundImage: "slime-genesis/textures/ground/map01light.png",
			    groundMap: "map",
			    gridX: 127,
			    gridY: 127
			},
			world: 
			{
			    ambientMap: [],
			    ambientObjects: [],
			    collisionMap: [],
			    heightMap: []
			},
			ground: 
			{
			    width: 4096, 
			    height: 4096, 
			    id: 0, object: {}
			}
	    },
	    map02: 
	    {
			config: 
			{
			    groundTexture: "slime-genesis/textures/terrain/grass-1024.jpg",
			    groundImage: "slime-genesis/textures/ground/map02light.png",
			    groundMap: "map",
			    gridX: 127,
			    gridY: 127
			},
			world: 
			{
			    ambientMap: [],
			    ambientObjects: [],
			    collisionMap: [],
			    heightMap: []
			},
			ground: 
			{
			    width: 4096, 
			    height: 4096, 
			    id: 0, object: {}
			}
	    }
    };

	DataMaps = function()
	{
    	this.setActive = function( map ) 
	    {
			try
			{
			    var exists = this.mapExists( map );
			    if( false === exists ) throw "map not found";
			    active = map;
			} 
			catch( e ) 
			{
			    console.log( "DataMaps.setActive: "+e.message );
			}
			return exists;
			
	    };

	    this.setActiveToCurrent = function() 
	    {
			current = maps[ active ];
	    };

	    this.getCurrent = function()
	    {
	    	return current;
	    };

	    this.mapExists = function( map ) 
	    {
			for( i in mapList ) if( mapList[ i ] === map ) return true;
			return false;
	    };
	};
})();