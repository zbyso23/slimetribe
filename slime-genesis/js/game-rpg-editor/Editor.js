(function(){
	Editor = function()
	{
		var that = this;
		var fs, fg;
		var fsId;
		var layers = [];
		var layer;

		var controls = {
			active: false,
			modal: false
		};

		var tools = {
			brush:
			{
				size: 20,
				type: 'pixel',
				color: '#000',
				rotate: 0,
				alpha: 1.0
			}
		};

		var activeTool = tools.brush;

		var KEYS = 
		{
		    SHIFT: 16, 
		    CTRL : 17, 
		    ALT  : 18,
		    SPACE: 32, 
		    LEFT : 37, 
		    RIGHT: 39, 
		    UP   : 38, 
		    DOWN : 40,
		    SIZE_DOWN: 219,
		    SIZE_UP: 221
		};

		var eventMouseDown = function( e )
		{
			controls.active = true;
			layers[layer].brush( e.clientX, e.clientY, activeTool );
		};

		var eventMouseUp = function( e )
		{
			controls.active = false;
		};

		var eventMouseMove = function( e )
		{
			if( false === controls.active ) return;
			layers[layer].brush( e.clientX, e.clientY, activeTool );
			// if( activeTool.type === 'pixel' )
			// {
			// 	layers[layer].pixel( e.clientX, e.clientY, activeTool.size );
			// }
			// else if( activeTool.type === 'circle' )
			// {
			// 	layers[layer].circle( e.clientX, e.clientY, activeTool.size );	
			// }
		}

		var eventKeyboard = function( e )
		{
			e.preventDefault();
			e.stopPropagation();
			//console.log(e.keyCode);
			var key = e.keyCode;
			if( ( key < 48 || key > 57 ) && ( key < 96 || key > 105 ) )
			{
				switch(e.keyCode)
				{
					case(KEYS.SIZE_UP):
						activeTool.size += 1;
						break;

					case(KEYS.SIZE_DOWN):
						if(activeTool.size >= 2) activeTool.size -= 1;
						break;

					case(KEYS.SHIFT):
						if( false === controls.modal )
						{
							controls.modal = true;
							fg.showBrushModal();
							break;
						}
						activeTool.color = fg.getBrushColor();
						activeTool.alpha = fg.getBrushAlpha();
						activeTool.size = fg.getBrushSize();
						activeTool.type = fg.getBrushType();
						activeTool.rotate = fg.getBrushRotate();
						layers[layer].setAlpha( activeTool.alpha );
						layers[layer].setColor( activeTool.color );
						controls.modal = false;
						fg.hideBrushModal();
						layers[layer].updateBrush( activeTool );
						break;

					default:
						break;
				};

			}
			else
			{
				key = ( key > 57 ) ? key - 48 : key;
				var index = key - 48;
				var blendTypes = ['normal', 'lighter', 'multiply', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];
				layers[layer].setBlending( blendTypes[ index ] );
			}
			return false;
			//console.log(e.keyCode);
		};

		var initializeKeyboardEvents = function()
		{
			document.addEventListener( 'keyup', eventKeyboard );
			//document.addEventListener( 'keydown', eventKeyboard );
		};

		var initializeMouseEvents = function()
		{
			var canvasInput = document.getElementById( fsId );
			canvasInput.addEventListener( 'mousedown', eventMouseDown );
			canvasInput.addEventListener( 'mouseup', eventMouseUp );
			canvasInput.addEventListener( 'mousemove', eventMouseMove );
		};

		var addLayer = function()
		{
			layers.push( new FLayer() );
		};

		var refresh = function()
		{
			window.requestAnimationFrame( refresh );
			fs.drawLayers( layers );
		}

		this.run = function()
		{
			fs = new FScreen();
			fg = new FGui();
			fsId = 'fcanvas-' + guid();
			fs.initialize( fsId );
			fg.initialize();
			fs.clear();
			initializeMouseEvents();
			initializeKeyboardEvents();

			addLayer();
			layer = 0;
			fg.addBrushModal();

			refresh();
		};



	};

})();