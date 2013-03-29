Game.Battle.Controls = {
    resetMove: function( character ) {
	if( ( gameData.animation.path.length )  < ( gameData.animation.step + 2 ) ) {
	    //character.speed = 0;
	} else {
	    //character.speed = character.speed / 2;
	}
	character.controls.moveLeft = false;
	character.controls.moveRight = false;
	character.controls.moveForward = false;
	character.controls.moveBackward = false;
	character.controls.move = false;
	character.controls.attack = false;
	character.controls.defense = false;
	character.controls.healing = false;
	character.controls.jump = false;

    }
};