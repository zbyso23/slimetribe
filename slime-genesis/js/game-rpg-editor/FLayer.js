(function(){
	FLayer = function()
	{
		var canvas;
		var ctx;

		var initialize = function()
		{
			canvas = document.createElement( 'canvas' );
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			ctx = canvas.getContext('2d');
		};

		this.pixel = function( x, y, size )
		{
			size = size || 1;
		    ctx.fillRect( x, y, size, size );
		};

		this.circle = function( x, y, size )
		{
			size = size || 1;
			ctx.beginPath();
			ctx.arc( x, y, size, 0, 2 * Math.PI, false );
			ctx.fill();
		};

		this.setColor = function( color )
		{
			ctx.fillStyle = color;
		};
		
		this.setAlpha = function( alpha )
		{
			ctx.globalAlpha = alpha;
		};

		this.get = function()
		{
			return canvas;
		};

		initialize();
	};
})();