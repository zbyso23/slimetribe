var Game = ( typeof Game === "undefined" ) ? {} : Game;
Game.Rpg.AI = {
	persons: [],
	wizzardConfig: {
		hiddenLayers: 2,
		hiddenLayerSize: 5,
		learningRate: 0.23,
		wizzardBirth: false,
	},
	
	birthWizzard: function() {
		var hiddenLayers;
		hiddenLayers = [];
		for(i = 0;i < Game.Rpg.AI.wizzardConfig.hiddenLayers;i++)
		{
			hiddenLayers.push = Game.Rpg.AI.wizzardConfig.hiddenLayerSize;
		}
		Game.Rpg.AI.wizzard = 
			new brain.NeuralNetwork({
				hiddenLayers: hiddenLayers,
				learningRate: Game.Rpg.AI.wizzardConfig.learningRate
		});
		Game.Rpg.AI.trainWizzard([
			Game.Rpg.AI.generateWizzardTrainItem([Game.Rpg.AI.getMoonPhase(), Game.Rpg.AI.getDaytime(), Math.random()], [Math.random(), Math.random(), Math.random()])
			]);
		Game.Rpg.AI.wizzardBirth = true;
	},
	trainWizzard: function(data)
	{
		Game.Rpg.AI.wizzard.train(data);
	},
	generateWizzardTrainItem: function(input, output)
	{
		var item;
		item = {input: {}, output: {}};
		for(i = 0; i < Game.Rpg.AI.wizzardConfig.input.length; i++)
		{
			item.input[Game.Rpg.AI.wizzardConfig.input[i]] = input[i];
		}
		for(i = 0; i < Game.Rpg.AI.wizzardConfig.output.length; i++)
		{
			item.output[Game.Rpg.AI.wizzardConfig.output[i]] = output[i];
		}
		return item;
	},
	askWizzard: function() {
		if(!Game.Rpg.AI.wizzardBirth)
		{
			console.log('Wizzard is not birth yet');
			return NULL;
		}
		var noise = (Game.Rpg.AI.noise === false) ? Math.random() : Game.Rpg.AI.noise;
		var input = { moon: Game.Rpg.AI.getMoonPhase(), daytime: Game.Rpg.AI.getDaytime(), noise: noise };
		var output = Game.Rpg.AI.wizzard.run(input);
		Game.Rpg.AI.updateNoise(output);
		if(noise > 0.4)
		{
			Game.Rpg.AI.trainWizzard([
				Game.Rpg.AI.generateWizzardTrainItem([Game.Rpg.AI.getMoonPhase(), Game.Rpg.AI.getDaytime(), input.noise], [output.search, output.rest, output.collect])
			]);
		}
		return output;
	},
	updateNoise: function(output)
	{
		var count = 0;
		var sum = 0;
		var noise = 0;Game.Rpg.AI.noise
		for(var i in output)
		{
			count++;
			sum += output[i];
		}
		noise = sum / count;
		Game.Rpg.AI.noise = noise;
		Game.Rpg.AI.movingCountTreshold = Game.Rpg.AI.noise * 100;
	},
	setRandomDirection: function() 
	{
		Game.Rpg.Events.resetMove();
		var noise = (Game.Rpg.AI.noise === false) ? Math.random() : Game.Rpg.AI.noise;
		noise = Math.random();
		if(noise <= 0.25)
		{
			controls.moveLeft = true;
		}
		else if(noise > 0.25 && noise <= 0.5)
		{
			controls.moveForward = true;
		}
		else if(noise > 0.5 && noise <= 0.75)
		{
			controls.moveRight = true;
		}
		else
		{
			controls.moveBackward = true;
		}
		Game.Rpg.AI.movingCount = 0;
		Game.Rpg.AI.isMoving = true;
	},
	stopMove: function()
	{
		Game.Rpg.Events.resetMove();
		Game.Rpg.AI.movingCount = 0;
		Game.Rpg.AI.isMoving = false;
	},
	isWizzardMoving: function()
	{
		Game.Rpg.AI.movingCount++;
		return Game.Rpg.AI.isMoving;
	},
	isSameDirectionLong: function()
	{
		return (Game.Rpg.AI.movingCountTreshold <= Game.Rpg.AI.movingCount) ? true : false;
	},
	getMoonPhase: function()
	{
		var today = new Date();
		var GetFrac = function(fr) {
			return (fr - Math.floor(fr));
		};
		var thisJD = today.getJulian();
		var year = today.getFullYear();
		var degToRad = 3.14159265 / 180;
		var K0, T, T2, T3, J0, F0, M0, M1, B1, oldJ;
		K0 = Math.floor((year - 1900) * 12.3685);
		T = (year - 1899.5) / 100;
		T2 = T * T;
		T3 = T * T * T;
		J0 = 2415020 + 29 * K0;
		F0 = 0.0001178 * T2 - 0.000000155 * T3 + (0.75933 + 0.53058868 * K0) - (0.000837 * T + 0.000335 * T2);
		M0 = 360 * (GetFrac(K0 * 0.08084821133)) + 359.2242 - 0.0000333 * T2 - 0.00000347 * T3;
		M1 = 360 * (GetFrac(K0 * 0.07171366128)) + 306.0253 + 0.0107306 * T2 + 0.00001236 * T3;
		B1 = 360 * (GetFrac(K0 * 0.08519585128)) + 21.2964 - (0.0016528 * T2) - (0.00000239 * T3);
		var phase = 0;
		var jday = 0;
		while (jday < thisJD) {
			var F = F0 + 1.530588 * phase;
			var M5 = (M0 + phase * 29.10535608) * degToRad;
			var M6 = (M1 + phase * 385.81691806) * degToRad;
			var B6 = (B1 + phase * 390.67050646) * degToRad;
			F -= 0.4068 * Math.sin(M6) + (0.1734 - 0.000393 * T) * Math.sin(M5);
			F += 0.0161 * Math.sin(2 * M6) + 0.0104 * Math.sin(2 * B6);
			F -= 0.0074 * Math.sin(M5 - M6) - 0.0051 * Math.sin(M5 + M6);
			F += 0.0021 * Math.sin(2 * M5) + 0.0010 * Math.sin(2 * B6 - M6);
			F += 0.5 / 1440;
			oldJ = jday;
			jday = J0 + 28 * phase + Math.floor(F);
			phase++;
		}
		// 29.53059 days per lunar month
		return (((thisJD - oldJ) / 29.53059));
	},
	getDaytime: function()
	{
		var today = new Date();
		var hourFloat = today.getHours() + ((today.getMinutes() * 1.333) / 100) + ((today.getSeconds() * 1.333) / 100000);// + ((today.getMilliseconds() * 1.333) / 100000000);
		return hourFloat / 24;
	}
};