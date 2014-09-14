(function(){
	FGui = function()
	{
		var modals =
		{

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

		this.addColorModal = function() 
		{
			var id = 'fgui-modal-' + guid();
			modals.color = id;
			var inputColorId = id + '-color';
			var inputAlphaId = id + '-alpha';
			var modalContent = '<input type="color" id="' + inputColorId + '" />';
			modalContent += '<input type="range" id="' + inputAlphaId + '" min="0" max="255" />';
			this.addModal(id, modalContent);
			return id;
		};

		this.getColor = function()
		{
			var colorHex = document.getElementById( modals.color + '-color' ).value;
			return colorHex;
		};

		this.getAlpha = function()
		{
			var alphaInput = document.getElementById( modals.color + '-alpha' ).value;
			return parseInt( alphaInput ) / 255;
		};

		this.showColorModal = function()
		{
			$( '#'+modals.color ).modal('show');
		};

		this.hideColorModal = function()
		{
			$( '#'+modals.color ).modal('hide');
		};

	};
})();