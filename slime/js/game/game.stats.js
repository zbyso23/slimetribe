Game.Stats = {};

Game.Stats = {
    add: function() {
	stats = new Stats();
	container.appendChild( stats.domElement );
    },
    refresh: function() {
	stats.update();
    }
};