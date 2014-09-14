utils = {
    cloneObj: function( obj ) 
    {
		try {
		    if( obj === null || typeof( obj ) !== 'object' ) return obj;
		    var temp = obj.constructor();
		    for( var key in obj ) temp[key] = this.cloneObj( obj[key] );
		    return temp;
		} 
		catch( e ) 
		{
			this.log(e.message);
			//todo
		}
    },
    dec2hex: function(n)
    {
		n = parseInt(n); var c = 'ABCDEF';
		var b = n / 16; 
		var r = n % 16; 
		b = b - ( r / 16 ); 
		b = ( ( b >= 0 ) && ( b <= 9 ) ) ? b : c.charAt( b - 10 );
		return ( ( r >= 0 ) && ( r <= 9 ) ) ? b + '' + r : b + '' + c.charAt( r - 10 );
    },
    log: function( name, message ) 
    {
    	return ( message ) ? console.log( name, message ) : console.log( name );
    },
	isObject: function(input)
	{
		return (typeof input === "object" && Object.prototype.toString.call(input) !== '[object Array]');
	},
	has: function(input, property)
	{
		return (this.isObject(input) === true && input.hasOwnProperty(property) === true);
	},
	isArray: function(input)
	{
		return (typeof input === "object" && Object.prototype.toString.call(input) === '[object Array]');
	},
	isFunction: function(input)
	{
		return (typeof input === "function");
	},
	isNumber: function(input)
	{
		return (typeof input === "number");
	},
	isString: function(input)
	{
		return (typeof input === "string");
	},
	isFloat: function(input)
	{
		return (typeof input === "number" && input !== Math.floor(input));
	},
	isInteger: function(input)
	{
		return (typeof input === "number" && input === Math.floor(input));
	},
	isSet: function(input)
	{
		return (typeof input !== "undefined");
	},
	isEmpty: function(input)
	{
		return (((this.isInteger(input) === true || this.isFloat(input)) && input === 0) || (this.isString(input) === true && input === '') || this.isSet(input) === false || this.isNull(input) === true);
	},
	isNull: function(input)
	{
		return (typeof input === "object" && Object.prototype.toString.call(input) === '[object Null]');
	},

	getActivePage: function()
	{
		return $("body").pagecontainer("getActivePage")[0].id;
	},
	changePage: function(page)
	{
		$("body").pagecontainer("change", "#"+page);
		return;
	}
};