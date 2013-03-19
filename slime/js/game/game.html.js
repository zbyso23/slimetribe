Game.Html = {};
Game.Html = {
	playerStyle: {},
	enemyStyle: {},
	middleStyle: {},
	leftPlayer: {},
	rightPlayer: {},
	middle: {},
	loading: {},
	loadingImage: {},
	loadingImageSize: { w: 0, h: 0 },
	loadingBarBg: {},
	loadingBar: {},
	init: false,
	
	getPlayersStyle: function() {
	    if( gameData.battle.selection.player === "left" ) {
		Game.Html.playerStyle = Game.Html.leftPlayer.style;
		Game.Html.enemyStyle = Game.Html.rightPlayer.style;
	    } else { 
		Game.Html.enemyStyle = Game.Html.leftPlayer.style;
		Game.Html.playerStyle = Game.Html.rightPlayer.style;
	    }
	    Game.Html.middleStyle = Game.Html.middle.style;
	},
	
	showChangeTurn: function () {
	    Game.Html.getPlayersStyle();
	    var playerName = ( gameData.battle.selection.player === "left" ) ? "Blue Player" : "Green Player";
	    playerName += ( heroes[ gameData.battle.selection.player ].ai ) ? " (AI)" : "";
	    gameData.battle.selection.endTurnAnimation = true;
	    var turnHtml = Game.Html.classDiv( gameData.battle.selection.player, gameData.battle.selection.turn + ' Turn' );
	    turnHtml += Game.Html.classDiv( gameData.battle.selection.player, playerName );
	    Game.Html.middle.innerHTML = turnHtml;
	    Game.Html.middle.style.opacity = 0.89;
	    Game.Html.middle.style.marginTop = ( window.innerHeight / 1.5 ) + 'px';
	},
	hideChangeTurn: function () {
	    Game.Html.getPlayersStyle();
	    Game.Html.middle.style.marginTop = '-100px';
	    Game.Html.middle.style.opacity = 0;
	    Game.Html.enemyStyle.opacity = 0;
	    gameData.battle.selection.endTurnAnimation = false;
	},
	showBattleLoadingScreen: function () {
	    Game.Html.loading.style.display = 'block';
	    Game.Html.loadingBarBg.style.display = 'block';
	    Game.Html.loadingBar.style.display = 'block';
	    Game.Html.loading.style.opacity = 0.99;
	    Game.Html.loadingImage.style.opacity = 0.99;
	    Game.Html.updateLoadingBar();
	},
	updateLoadingBar: function() {
	    try {
		if( gameData.loader.jsonCountAll < 1 ) throw "no json";
		Game.Html.loadingBarBg.style.opacity = 0.75;
		Game.Html.loadingBar.style.opacity = 0.90;
		Game.Html.loadingImage.style.width = ( window.innerWidth / 0.85 ) + 'px';
		Game.Html.loadingImage.style.height = ( window.innerHeight / 0.85 ) + 'px';
		var barWidth = Game.Html.loadingBar.clientWidth;
		var barHeight = Game.Html.loadingBar.clientHeight;
		var fullWidth = Game.Html.loadingBarBg.clientWidth;
		var barBg = gameData.loader.jsonCountAll * 20;
		var bar = ( gameData.loader.jsonCount > 0 ) ? ( gameData.loader.jsonCountAll - gameData.loader.jsonCount ) * 20 : ( barBg - ( barBg / 50 ) );
		    
		var left = ( ( window.innerWidth / 2 ) - ( fullWidth / 2 ) );
		var top = ( window.innerHeight / 1.3 );
		Game.Html.loadingBar.style.left = left + 'px';
		Game.Html.loadingBarBg.style.left = left + 'px';
		Game.Html.loadingBar.style.top = top + 'px';
		Game.Html.loadingBarBg.style.top = top + 'px';
		Game.Html.loadingBar.style.width = ( bar ) + 'px';
		Game.Html.loadingBarBg.style.width = ( barBg ) + 'px';
		console.log( 'jo jo', Game.Html.loadingBar.clientWidth );
	    } catch( e ) {
		Game.Html.loadingBarBg.style.opacity = 0;
		Game.Html.loadingBar.style.opacity = 0;
	    }
	    Game.Html.updateLoadingScreen();
	},
	updateLoadingScreen: function() {
	    try {
		var width = Game.Html.loadingImageSize.w;
		var height = Game.Html.loadingImageSize.h;
		width = ( ( window.innerWidth / 2 ) < Game.Html.loadingImageSize.w ) ? ( window.innerWidth / 1.5 ) : Game.Html.loadingImageSize.w;
		height = ( ( window.innerHeight / 2 ) < Game.Html.loadingImageSize.h ) ? ( window.innerHeight / 1.125 ) : Game.Html.loadingImageSize.h;
		Game.Html.loadingImage.style.width = width + 'px';
		Game.Html.loadingImage.style.height = height + 'px';
		Game.Html.loadingImage.style.backgroundSize = width + 'px ' + height + 'px';
		var left = ( window.innerWidth / 2 ) - ( width / 2 );
		var top = ( window.innerHeight / 2 ) - ( height / 2 );
		Game.Html.loadingImage.style.left = left + 'px';
		Game.Html.loadingImage.style.top = top + 'px';
	    } catch( e ) {

	    }
	},
	hideBattleLoadingScreen: function () {
	    Game.Html.loading.style.display = 'none';
	    Game.Html.loadingBarBg.style.display = 'none';
	    Game.Html.loadingBar.style.display = 'none';
	    Game.Html.loading.style.opacity = 0;
	    Game.Html.loadingImage.style.opacity = 0;
	    Game.Html.loadingBarBg.style.opacity = 0;
	    Game.Html.loadingBar.style.opacity = 0;
	},

	animateChangeTurn: function () {
	    Game.Html.getPlayersStyle();
	    var marginTopValue = parseFloat( Game.Html.middle.style.marginTop );
	    if( marginTopValue === null ) return;
	    var animSpeedDiv = 1 / animSpeed;
	    Game.Html.middle.style.opacity -= animSpeedDiv * .1;
	    var opacity = Game.Html.middle.style.opacity;
	    if( marginTopValue <= 0 || opacity <= ( 1 - 0.89 ) ) {
		Game.Html.hideChangeTurn();
	    } else {
		Game.Html.middle.style.marginTop = ( marginTopValue - (animSpeedDiv * 100) ) + 'px';
		Game.Html.middle.style.opacity = ( opacity - (animSpeedDiv * 0.1) );
	    }
	},
	showPoints: function( animate, points, type ) {
	    try {
		type = ( typeof type === "undefined" ) ? 'damage' : type;
		animate = ( typeof animate === "undefined" ) ? false : animate;
		var divIdCenter = 'damage';
		if( animate === true ) {
		    var animSpeedDiv = 1/animSpeed;
		    var opacity = document.getElementById( divIdCenter ).style.opacity;
		    document.getElementById( divIdCenter ).style.opacity -= animSpeedDiv * .1;
		    var marginTopValue = parseFloat( document.getElementById( divIdCenter ).style.marginTop );
		    if( marginTopValue != null ) {
			if( marginTopValue <= 0 || opacity <= (1 - 0.89) ) {
			    document.getElementById( divIdCenter ).style.marginTop = '-1000px';
			} else {
			    document.getElementById( divIdCenter ).style.marginTop = ( marginTopValue - (animSpeedDiv * 100) ) + 'px';
			}
		    }
		} else {
		    var damageHtml = '<div class="' + type + '">' + points;
		    if( points === 0 ) {
			damageHtml = '</div><div class="' + type + '">Miss!';
		    }
		    damageHtml += '</div>';
		    document.getElementById( divIdCenter ).innerHTML = damageHtml;
		    document.getElementById( divIdCenter ).style.opacity = '0.79';
		    document.getElementById( divIdCenter ).style.marginTop = ( window.innerHeight / 1.5 ) + 'px';
		}
	    } catch( e ) {
	    }
	},
	showGUI: function() {
	    try {
		var cords = gameData.battle.gui.cords;
		//Selected Player
		if( gameData.battle.selection.selected === true ) {
		    var characterStats = gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y];
		    var statsHtml = Game.Html.makeStats( gameData.battle.selection.hero.monsters[gameData.battle.selection.x][gameData.battle.selection.y] )
		    document.getElementById( gameData.battle.selection.player + '-damage' ).innerHTML = statsHtml;
		    document.getElementById( gameData.battle.selection.player + '-damage' ).style.opacity = .9;
		    if( cords.length === 2 && ( gameData.battle.selection.hero.monsters[cords[0]][cords[1]] !== 0 || gameData.battle.selection.enemyHero.monsters[cords[0]][cords[1]] !== 0 ) ) {
			var enemy = ( gameData.battle.selection.player === "left" ) ? "right" : "left";
			var player = ( gameData.battle.selection.hero.monsters[cords[0]][cords[1]] === 0 ) ? enemy : gameData.battle.selection.player;
			statsHtml = ( gameData.battle.selection.hero.monsters[cords[0]][cords[1]] === 0 ) ? Game.Html.makeStats( gameData.battle.selection.enemyHero.monsters[cords[0]][cords[1]] ) : Game.Html.makeStats( gameData.battle.selection.hero.monsters[cords[0]][cords[1]] );
			document.getElementById( player + '-damage' ).innerHTML = statsHtml;
			document.getElementById( player + '-damage' ).style.opacity = .9;
		    }
		} else {
		    if( cords.length === 2 && ( gameData.battle.selection.hero.monsters[cords[0]][cords[1]] !== 0 || gameData.battle.selection.enemyHero.monsters[cords[0]][cords[1]] !== 0 ) ) {
			var enemy = ( gameData.battle.selection.player === "left" ) ? "right" : "left";
			var player = ( gameData.battle.selection.hero.monsters[cords[0]][cords[1]] === 0 ) ? enemy : gameData.battle.selection.player;
			statsHtml = ( gameData.battle.selection.hero.monsters[cords[0]][cords[1]] === 0 ) ? Game.Html.makeStats( gameData.battle.selection.enemyHero.monsters[cords[0]][cords[1]] ) : Game.Html.makeStats( gameData.battle.selection.hero.monsters[cords[0]][cords[1]], false );
			document.getElementById( player + '-damage' ).innerHTML = statsHtml;
			document.getElementById( player + '-damage' ).style.opacity = .9;
		    } else {
			document.getElementById( gameData.battle.selection.player + '-damage' ).style.opacity = 0;
			document.getElementById( 'right-damage' ).style.opacity = 0;
		    }
		}
	    } catch( e ) {

	    }
	},
	activePlayerGUI: function() {
	    if( gameData.battle.selection.player === "left" ) {
		//Game.Html._setAttr( 'left-damage', "class", "active" );
		//Game.Html._setAttr( 'right-damage', "class", "normal" );
		document.getElementById( 'left-damage' ).setAttribute( "class", "active" );
		document.getElementById( 'right-damage' ).setAttribute( "class", "normal" );
	    } else {
		document.getElementById( 'right-damage' ).setAttribute( "class", "active" );
		document.getElementById( 'left-damage' ).setAttribute( "class", "normal" );
	    }
	    document.getElementById( 'left-damage' ).style.opacity = 0;
	    document.getElementById( 'right-damage' ).style.opacity = 0;
	},
	showGameOver: function( hide ) {
	    try {
		if( typeof hide !== "undefined" ) throw "hide";
		var divId = 'gameover';
		var playerName = ( gameData.battle.selection.player === "left" ) ? "Blue" : "Green";
		var gameOverHtml = '<div class="player-' + gameData.battle.selection.player + '">' + playerName + ' Player wins!</div><div class="turn">In ' + gameData.battle.selection.turn + ' Turn <br />(F4 for Restart)</div>';
		document.getElementById( divId ).innerHTML = gameOverHtml;
		document.getElementById( divId ).style.opacity = .79;
	    } catch( e ) {
		document.getElementById( divId ).style.opacity = 0;
	    }
	},
	initialize: function() {
	    Game.Html.middleStyle = document.getElementById( HTML.id.turn ).style;
	    Game.Html.leftPlayerStyle = document.getElementById( HTML.id.leftPlayer ).style;
	    Game.Html.rightPlayerStyle = document.getElementById( HTML.id.rightPlayer ).style;
	    Game.Html.middle = document.getElementById( HTML.id.turn );
	    Game.Html.loading = document.getElementById( HTML.id.loading );
	    Game.Html.loadingImage = document.getElementById( HTML.id.loadingImage );
	    Game.Html.loadingImageSize = { w: Game.Html.loadingImage.clientWidth, h: Game.Html.loadingImage.clientHeight };

	    Game.Html.loadingBarBg = document.getElementById( HTML.id.loadingBarBg );
	    Game.Html.loadingBar = document.getElementById( HTML.id.loadingBar );
	    
	    Game.Html.leftPlayer = document.getElementById( HTML.id.leftPlayer );
	    Game.Html.rightPlayer = document.getElementById( HTML.id.rightPlayer );
	    Game.Html.init = true;
	},
	classDiv: function( divClass, divContent ) {
	    return '<div class="' + divClass + '">' + divContent + '</div>';
	},
	idDiv: function( divId, divContent ) {
	    return '<div id="' + divId + '">' + divContent + '</div>';
	},
	makeStats: function( stats, active ) {
	    try {
		active = ( typeof active === "undefined" ) ? true : active;
		var statsParts = [];
		var statsHtml;
		statsParts.push( '<span class="name">Attack: </span>' + stats.stats.attack );
		statsParts.push( '<span class="name">Defense: </span>' + stats.stats.defense );
		statsParts.push( '<span class="name">Magic: </span>' + stats.stats.magic );
		statsParts.push( '<span class="name">M Defense: </span>' + stats.stats.magicDefense );
		statsParts.push( '<span class="name">Health: </span>' + stats.healthRemain + ' / ' + stats.stats.health );
		statsParts.push( '<span class="name">Speed: </span>' + stats.speedRemain + ' / ' + stats.stats.speed );
		statsParts.push( '<span class="name">Mana: </span>' + stats.manaRemain + ' / ' + stats.stats.mana );
		statsHtml = '<div class="part">';
		statsHtml += statsParts.join( '</div><div class="part">' );
		statsHtml += '</div>';
		
		if( stats.stats.spell === true ) {
		    var spells = stats.stats.spellsList;
		    //consle.log('spells',spells);
		    //statsHtml += '<span class="name">Active Spell: </span>' + spellsList[ stats.stats.activeSpell ].name;
		    var activeAttack = ( stats.stats.magicAttack === true ) ? "Magic" : "Melee"
		    statsHtml += '<div class="part"><span class="name">Active Attack: </span>' + activeAttack + '</div>';
		    statsHtml += '<div class="part"><span class="name">Active Spell: </span></div><div class="part">' + spellsList[ stats.stats.activeSpell ].name + '</div><div class="part">(' + spellsList[ stats.stats.activeSpell ].manaCost + 'Mana / ' + spellsList[ stats.stats.activeSpell ].damage + 'Damage)</div>';
		    statsHtml += '<div class="spells">';
		    
		    var itemSpell;
		    for( spell in spells ) {
			itemSpell = spellsList[ spells[ spell ] ];
			if( stats.stats.activeSpell === spells[ spell ] && active === true ) {
			    statsHtml += '<div class="' + itemSpell.color + ' active">' + itemSpell.icon + '</div>';
			} else {
			    statsHtml += '<div class="' + itemSpell.color + '">' + itemSpell.icon + '</div>';
			}
		    }
		    statsHtml += '</div>';
		}
		return statsHtml;
	    } catch( e ) {

	    }	    
	},
	
	_setAttr: function( id, attr, value ) {
	    try {
		if( typeof id === "undefined" || typeof attr === "undefined" || typeof value === "undefined" ) return false;
		document.getElementById( id ).setAttribute( attr, value );
	    } catch( e ) {
		return false;
	    }
	    return true;
	}


};