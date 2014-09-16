(function(){
	FLayer = function()
	{
		var canvas;
		var ctx;
		var layerFillColor, layerAlpha;
		var blendTypes = ['normal', 'lighter', 'multiply', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];
		var availableBlendTypes = [];

		var initialize = function()
		{
			canvas = document.createElement( 'canvas' );
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			ctx = canvas.getContext('2d');
			initializeAvailableBlends();
			initializeBrush();
			ctx.globalCompositeOperation = 'hard-light';
		};

		var initializeAvailableBlends = function()
		{
			availableBlendTypes.push( 'normal' );
			for(i in blendTypes)
			{
				ctx.globalCompositeOperation = blendTypes[i];
				if( ctx.globalCompositeOperation === blendTypes[i] ) availableBlendTypes.push( blendTypes[i] );
			}
			console.log(availableBlendTypes);
		}

		var initializeBrush = function()
		{
			temp = document.getElementById('editor-temp');
			image = document.getElementById('editor-image');
			svg = document.getElementsByTagName('svg')[1];
			rotate = 125;
			rotateCenterX = 150;
			rotateCenterY = 145;
			svg.setAttribute('transform','rotate('+rotate+' ' + rotateCenterX + ' ' + rotateCenterY + ')');
			temp.innerHTML = '';
			temp.appendChild(svg.cloneNode(true));
			b64 = 'data:image/svg+xml;base64,'+window.btoa( temp.innerHTML );
			image.width = 300;
			image.height = 300;
			image.src = b64;
		};

		this.updateBrush = function( rotate )
		{
			rotate += 125;
			//if( rotate > 360 ) rotate -= 360;
			rotateCenterX = 150;
			rotateCenterY = 145;
			svg = document.getElementsByTagName('svg')[1];
			svg.setAttribute('transform','rotate('+rotate+' ' + rotateCenterX + ' ' + rotateCenterY + ')');
			temp.innerHTML = '';
			temp.appendChild(svg.cloneNode(true));
			temp.innerHTML = temp.innerHTML.replace('fill:#000000;fill-opacity:1;', 'fill:'+layerFillColor+''+';fill-opacity:'+layerAlpha+';');
			b64 = 'data:image/svg+xml;base64,'+window.btoa( temp.innerHTML );
			image.onload = function () 
			{
			// 	//fx.drawImage(image, 200, 20, 300, 300);
			}
			image.src = b64;
		};

		this.brush = function( x, y, config )
		{
			rotate = config.rotate || 0;
			w = 3;
			h = 3;
			w = config.size * w;
			h = config.size * h;
			x -= w / 2;
			y -= h / 2;
			ctx.drawImage(image, x, y, w, h);
		};

		this.pencil = function( x, y, size )
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
			layerFillColor = color;
		};
		
		this.setAlpha = function( alpha )
		{
			ctx.globalAlpha = alpha;
			layerAlpha = alpha;
		};

		this.get = function()
		{
			return canvas;
		};

		this.setBlending = function( blending )
		{
			for( i in availableBlendTypes ) if( blending === availableBlendTypes[ i ] ) ctx.globalCompositeOperation = blending;
		};

		initialize();
	};
})();