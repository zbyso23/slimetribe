Game.Rpg.Scene.Projection = {

    casting: function() {
	var cords = [];
	try {
	    var character = gameRpgData.character.md2.root;
	    var pos = new THREE.Vector3( character.position.x, character.position.y, character.position.z );
	    var raycaster = projector.pickingRay( pos, camera );
	    var grid = [];
	    for( i in gameRpgData.world.ambientObjects ) grid.push( gameRpgData.world.ambientObjects[i].root );
	    var intersects = raycaster.intersectObjects( grid );
	    if ( intersects.length === 0 ) throw "no intersect";
	    //var cords = Game.Battle.Grid.findById( intersects[0].object.id );
	    if( cords.length === 0 ) throw "no cords for intersect";
	    //cords.push( intersects[0].object.id );
	    //if( typeof monstersModels[cords[0]][cords[1]] === "object" ) cords.push( monstersModels[cords[0]][cords[1]] );
	} catch( e ) {
	    console.log( 'e', e );
	    return false;
	}    
	return cords;
    },
    initialize: function() {
	projector = new THREE.Projector();
    }
}