(function(){
	FGui = function()
	{
		var modals =
		{

		};

		var controlsBrushChange = function(e)
		{
			document.getElementById(e.target.id+'-value').innerHTML = e.target.value;
			console.log(e);
		};

		this.initialize = function( modalContent )
		{
		};

		this.addModal = function( id, modalContent ) 
		{
			var modal = document.createElement( 'div' );
			modal.id = id;
			modal.classList.add( 'modal' );
			modal.classList.add( 'fade' );

			var dialog = document.createElement( 'div' );
			dialog.classList.add( 'modal-dialog' );

			var content = document.createElement( 'div' );
			content.classList.add( 'modal-content' );

			var body = document.createElement( 'div' );
			body.classList.add( 'modal-body' );

			body.innerHTML = modalContent;

			content.appendChild( body );
			dialog.appendChild( content );
			modal.appendChild( dialog );
			document.body.appendChild( modal );
			return modal.id;
		};

		this.addBrushModal = function() 
		{
			var id = 'fgui-modal-' + guid();
			modals.brush = id;
			var inputColorId = id + '-color';
			var inputAlphaId = id + '-alpha';
			var inputRotateId = id + '-rotate';
			var inputSizeId = id + '-size';
			var inputTypeId = id + '-type';
			var modalContent = '<legend>Color</legend><input type="color" id="' + inputColorId + '" /><span id="' + inputColorId + '-value">#000000</span>';
			modalContent += '<legend>Alpha</legend><input type="range" id="' + inputAlphaId + '" min="0" max="255" value="255" /><span id="' + inputAlphaId + '-value">255</span>';
			modalContent += '<legend>Rotate</legend><input type="range" id="' + inputRotateId + '" min="0" max="360" value="0" /><span id="' + inputRotateId + '-value">0</span>';
			modalContent += '<legend>Size</legend><input type="range" id="' + inputSizeId + '" min="1" max="200" value="20" /><span id="' + inputSizeId + '-value">10</span>';
			modalContent += '<legend>Type</legend><select id="' + inputTypeId + '">';
			modalContent += '<option value="pixel">pixel</option>';
			modalContent += '<option value="circle" selected>circle</option>';
			modalContent += '</select>';
			this.addModal(id, modalContent);
			document.getElementById(inputColorId).addEventListener('change', controlsBrushChange, false);
			document.getElementById(inputAlphaId).addEventListener('change', controlsBrushChange, false);
			document.getElementById(inputRotateId).addEventListener('change', controlsBrushChange, false);
			document.getElementById(inputSizeId).addEventListener('change', controlsBrushChange, false);
			return id;
		};

		this.getBrushColor = function()
		{
			var colorHex = document.getElementById( modals.brush + '-color' ).value;
			return colorHex;
		};

		this.getBrushAlpha = function()
		{
			var alphaInput = document.getElementById( modals.brush + '-alpha' ).value;
			return parseInt( alphaInput ) / 255;
		};

		this.getBrushRotate = function()
		{
			var rotateInput = document.getElementById( modals.brush + '-rotate' ).value;
			return parseInt( rotateInput );
		};

		this.getBrushSize = function()
		{
			var sizeInput = document.getElementById( modals.brush + '-size' ).value;
			return parseInt( sizeInput );
		};

		this.getBrushType = function()
		{
			var typeInput = document.getElementById( modals.brush + '-type' ).value;
			return typeInput;
		};

		this.showBrushModal = function()
		{
			$( '#'+modals.brush ).modal('show');
		};

		this.hideBrushModal = function()
		{
			$( '#'+modals.brush ).modal('hide');
		};
	};
})();