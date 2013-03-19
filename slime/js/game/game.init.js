Game.Init = {
    projector: function() {
	projector = new THREE.Projector();
    },
    plane: function() {
	gameData.battle.plane.step = Math.ceil( ( gameData.battle.world.ground.width / gameData.battle.plane.gridWidth ) );
	gameData.battle.plane.halfStep = Math.ceil( gameData.battle.plane.step / 2 );
    },
    
    controls: function() {
	mouse2D = new THREE.Vector3( MOUSE2D.x, MOUSE2D.y, MOUSE2D.z );
    },
    
    dom: function() {
	container = document.createElement( 'div' );
	document.body.appendChild( container );

    }
}