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
			//ctx.save();

			size = size || 1;
			//ctx.globalAlpha = alpha || 1.0;
		    ctx.fillRect( x, y, size, size );
		    //ctx.restore();
		};

		this.setColor = function( color )
		{
			console.log(color);
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