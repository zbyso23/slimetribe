(function(){
	Editor = function()
	{
		var that = this;
		var fs, fg;
		var fsId;
		var layers = [];
		var layer;

		var controls = {
			active: false
		};

		var tools = {
			brush:
			{
				size: 20
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
		};

		var eventMouseUp = function( e )
		{
			controls.active = false;
		};

		var eventMouseMove = function( e )
		{
			if( false === controls.active ) return;
			layers[layer].setAlpha(fg.getAlpha());
			layers[layer].setColor( fg.getColor() );
			layers[layer].pixel( e.clientX, e.clientY, activeTool.size );
			fs.drawLayers( layers );
		}

		var eventKeyboard = function( e )
		{
			switch(e.keyCode)
			{
				case(KEYS.SIZE_UP):
					activeTool.size += 1;
					break;

				case(KEYS.SIZE_DOWN):
					if(activeTool.size >= 2) activeTool.size -= 1;
					break;

				default:
					fg.showColorModal();
					break;
			}
			//console.log(e.keyCode);
		};

		var initializeKeyboardEvents = function()
		{
			document.addEventListener( 'keyup', eventKeyboard );
			document.addEventListener( 'keydown', eventKeyboard );
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
			fg.addColorModal();		
		};



	};

})();