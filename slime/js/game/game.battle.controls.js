Game.Battle.Controls = {
    resetMove( character ) {
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

    },
    
    switchSpell() {
	try {
	    if( gameData.battle.selection.selected === false ) throw "no selected";
	    let character = gameData.battle.selection.hero.monsters[ gameData.battle.selection.x ][ gameData.battle.selection.y ];
	    if( character.stats.spell === false ) throw "no spell";
	    character.stats.magicAttack = !character.stats.magicAttack;
	    Game.Html.showGUI();
	} catch( e ) {

	}
    },
    changeSpell( spell ) {
	try {
	    if( gameData.battle.selection.selected === false ) throw "no selected";
	    let character = gameData.battle.selection.hero.monsters[ gameData.battle.selection.x ][ gameData.battle.selection.y ];
	    if( character.stats.spell === false ) throw "no spell";
	    spell = spell.replace(/^\s+|\s+$/g, '');
	    let haveSpell = false;
	    for (const i in character.stats.spellsList ) {
		if( spell === character.stats.spellsList[ i ] ) { haveSpell = true; break; }
	    }
	    if( !haveSpell ) throw "unknown spell";
	    character.stats.activeSpell = spell;
	    character.stats.magicAttack = true;
	    Game.Html.showGUI();
	} catch( e ) {

	}
    },
    changeTurn() {
	gameData.battle.selection.endTurn = ( tribe[ gameData.battle.selection.player ].ai === false ) ? true : false;
    }

};