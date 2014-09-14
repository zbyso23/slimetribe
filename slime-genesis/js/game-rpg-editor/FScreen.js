(function(){
	FScreen = function()
	{
		var canvas;
		var ctx;

		var fill = function()
		{
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		};

		this._pixel = function( x, y )
		{
		    this.ctx.fillRect( x, y );
		};

		var setColor = function( color )
		{
			ctx.fillStyle = color;
		};
		
		var setAlpha = function( alpha )
		{
			ctx.globalAlpha = alpha;
		};

		this.initialize = function( id )
		{
			canvas = document.createElement( 'canvas' );
			canvas.id = id;
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			document.body.appendChild( canvas );
			ctx = canvas.getContext('2d');
		};

		this.clear = function()
		{
			setAlpha( 1.0 );
			setColor( '#FF1' );
			fill();
		};

		this.drawLayers = function( layers )
		{
			this.clear();
			for( var i = 0; i < layers.length; i++ )
			{
				ctx.drawImage( layers[i].get(), 0, 0 );
			}
		}

	};

})();