(function(){
	DataAmbient = function()	
	{
		var sets = new DataAmbientSets();
	    this.storageAccept = function( id ) 
	    {
	    	var set = sets.get();
			for( i in set.storage1.attributes.accept ) if( set.storage1.attributes.accept[i] == id ) return true;
			return false;
	    },
	    
	    this.getAmbient = function( id ) 
	    {
	    	var setList = sets.getList();
			var ambient = false;
			try 
			{
				ambient = setList[id].object;
			}
			catch( e ) 
			{
			    console.log( 'getAmbient ee', e );
			}
			return ambient;
	    };
	};
})();