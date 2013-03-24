Game.Battle.Sounds = {};
Game.Battle.Sounds = {
    ready: false,
    playing: false,
    play: function() {
	try {
	    if( Game.Battle.Sounds.ready === false ) throw "noready";
	    var el = document.getElementById( 'battle-sound' );
	    el.addEventListener('canplaythrough', function(){
				if( Game.Battle.Sounds.playing === true ) this.play();
			    }, false);
	} catch( e ) {
	    
	}
	Game.Battle.Sounds.playing = true;
    },
    isPlay: function() {
	var el = document.getElementById( 'battle-sound' );
	return el.played;
    },
    isPause: function() {
	var el = document.getElementById( 'battle-sound' );
	return el.paused;
    },
    isEnd: function() {
	var el = document.getElementById( 'battle-sound' );
	return el.ended;
    },
    stop: function() {
	try {
	    Game.Battle.Sounds.pause();
	    Game.Battle.Sounds.playing = false;
	    if( Game.Battle.Sounds.ready === false ) throw "noready";
	    if( Game.Battle.Sounds.isEnd() === true ) return;
	} catch( e ) {
	    
	}
    },
    pause: function() {
	try {
	    if( Game.Battle.Sounds.ready === false ) throw "noready";
	    if( Game.Battle.Sounds.isPaused() === true ) return;
	    var el = document.getElementById( 'battle-sound' );
	    el.removeEventListener('ended', function(){
				this.currentTime = 0;
				if( Game.Battle.Sounds.playing === true ) this.play();
			    }, false);
	    el.pause();
	} catch( e ) {
	    
	}
    },
    load: function( url ) {
	Game.Battle.Sounds.stop();
	//var elMp3 = document.getElementById( 'battle-sound-mp3' );
	var elOgg = document.getElementById( 'battle-sound-ogg' );
	//elMp3.setAttribute( 'src', url + '.mp3');
	elOgg.setAttribute( 'src', url + '.ogg');
	var el = document.getElementById( 'battle-sound' );
	el.load();
	el.addEventListener('ended', function(){
			    this.currentTime = 0;
			    if( Game.Battle.Sounds.playing === true ) this.play();
			}, false);
	Game.Battle.Sounds.ready = true
    },
    _repeat: function() {
	
    },
    prepare: function( params ) {
	try {
	    if( typeof params.sounds.parts[ params.active ] === "undefined" ) throw "nosound";
	    Game.Battle.Sounds.load( params.sounds.baseUrl + params.sounds.parts[ params.active ] );
	    Game.Battle.Sounds.ready = true;
	} catch( e ) {
	    Game.Battle.Sounds.ready = false;
	}
    },
    preloader: function() {
	var sounds = Game.Battle.Sounds.__findMonsterSounds();
	for( i in sounds ) {
	    ++gameData.loader.soundsCount;
	    var audio = new Audio();
	    audio.addEventListener( 'canplaythrough', Game.Battle.Sounds.preloaderLoaded, false );
	    audio.src = sounds[i] + '.ogg';
	}
    },
    __findMonsterSounds: function() {
	sounds = [];
	for( m in monstersList ) {
	    var baseUrl = monstersList[m].sounds.baseUrl;
	    for( s in monstersList[m].sounds.parts ) {
		var url = baseUrl + monstersList[m].sounds.parts[s];
		var is = false;
		for( i in sounds ) if( sounds[i] == url ) is = true;
		if( is === false ) sounds.push( url );
	    }
	}
	return sounds;
    },
    preloaderLoaded: function( e ) {
	--gameData.loader.soundsCount;
	if( gameData.loader.soundsCount === 0 ) gameData.loader.soundsLoaded = true;
    }
    
};
