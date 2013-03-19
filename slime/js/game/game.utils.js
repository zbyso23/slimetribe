Game.Utils = {
    cloneObj: function( obj ) {
	try {
	    if(obj == null || typeof(obj) != 'object') return obj;
	    var temp = obj.constructor();
	    for(var key in obj) temp[key] = Game.Utils.cloneObj(obj[key]);
	    return temp;
	} catch( e ) {

	}
    }

}