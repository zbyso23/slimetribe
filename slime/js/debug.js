var BUG = {};
var BUG = {
    onceName: false,
    names: [],
    show: false,
    once: function( yes ) {
	yes = ( typeof yes === "undefined" ) ? !BUG.onceName : yes;
	BUG.onceName = yes;
    },
    off: function( yes ) {
	BUG.show = ( typeof yes === "undefined" ) ? false : yes;
    },
    l: function( name, message ) {
	if( typeof message === "undefined" ) {
	    message = name;
	    name = '(empty)';
	}
	var isName = false;
	if( BUG.onceName === true ) isName = BUG._is( name );
	if( ( BUG.onceName === false || isName === false ) ) console.log( name, BUG.cObj( message ) );
	if( BUG.onceName === true && isName === false ) BUG.names.push( name );
    },
    
    _is: function( name ) {
	for( i in BUG.names ) if( BUG.names[i] == name ) return true;
	return false;
    },
    cObj: function( obj ) {
	if(obj == null || typeof(obj) != 'object') return obj;
	var temp = obj.constructor();
	for(var key in obj) temp[key] = Game.Utils.cloneObj(obj[key]);
	return temp;
    }
    
};