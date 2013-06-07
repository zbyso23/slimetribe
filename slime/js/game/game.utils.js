Game.Utils = {
    cloneObj: function( obj ) {
	try {
	    if(obj == null || typeof(obj) != 'object') return obj;
	    var temp = obj.constructor();
	    for(var key in obj) temp[key] = Game.Utils.cloneObj(obj[key]);
	    return temp;
	} catch( e ) {

	}
    },
    dec2hex: function(n){
	n = parseInt(n); var c = 'ABCDEF';
	var b = n / 16; var r = n % 16; b = b-(r/16); 
	b = ((b>=0) && (b<=9)) ? b : c.charAt(b-10);    
	return ((r>=0) && (r<=9)) ? b+''+r : b+''+c.charAt(r-10);
    },
    log: function( message ) {
	console.log( message );
    }


}