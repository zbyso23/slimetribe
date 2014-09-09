GameRpgAIcharacter = function(config)
{
	this.config = config;
}

GameRpgAIcharacter.prototype.noise = 0;
GameRpgAIcharacter.prototype.isBirth = false;
GameRpgAIcharacter.prototype.movingCountTreshold = 1000;
GameRpgAIcharacter.prototype.movingCount = 0;
GameRpgAIcharacter.prototype.isMoving = false;
GameRpgAIcharacter.prototype.lastMove = false;
GameRpgAIcharacter.prototype.moves = {
											left: 'moveLeft',
											right: 'moveRight',
											forward: 'moveForward',
											backward: 'moveBackward'
										};
GameRpgAIcharacter.prototype.config = {};
GameRpgAIcharacter.prototype.person = {};
GameRpgAIcharacter.prototype.lastState = 'search';
GameRpgAIcharacter.prototype.isCollecting = false;
GameRpgAIcharacter.prototype.stateCountTreshold = 10000;
GameRpgAIcharacter.prototype.wait = false;

GameRpgAIcharacter.prototype.refresh = function()
{
	var talk = this.ask();
	if(this.isMoving === true) 
	{
		this.movingCount++;
		if(this.isSameDirectionLong() === true || Game.Rpg.Character.isCollisionDetect)
		{
			this.setRandomDirection();
		}
	}
	
	var treshold = 0.5;
	var tresholdRest = 0.55;
	var map = GameRpgMaps.current;
	var grid = Game.Rpg.coordsToGrid( { 
										x: gameRpgData.character.md2.root.position.x, 
										y: gameRpgData.character.md2.root.position.z 
									});
	var object = map.world.ambientObjects[grid.x][grid.y];
	var isGrow = ( object.attributes && object.attributes.type === 'item' && object.attributes.timeout !== 0 && !Game.Rpg.Character.isBagFull() ) ? true : false;
	if(isGrow) this.isCollecting = true;
	if(this.isCollecting === false && talk.search > treshold && talk.collect > treshold && talk.rest < tresholdRest)
	{
				console.log('wizzard search!');
		controls.grow = false;
		if(this.isMoving === false) this.setLastDirection();
	}
	else if(this.isCollecting === true && talk.rest < tresholdRest)
	{
		if(this.isMoving) this.stopMove();
		controls.grow = true;
				console.log('wizzard collect!');
	}
	else if(talk.rest >= tresholdRest && this.isMoving === false)
	{
		this.stopMove();
				console.log('wizzard resting!');
	}
	else
	{
				console.log('wizzard staying in last action!');
	}

	
}
		
GameRpgAIcharacter.prototype.ask = function() 
{
	if(!this.isBirth)
	{
		console.log('person is not birth yet');
		return null;
	}
	var input = { moon: this.getMoonPhase(), daytime: this.getDaytime(), noise: this.getNoise() };
	var output = this.person.run(input);
	if(this.binaryDice())
	{
		this.updateNoise(output);
		this.train([
			this.generateTrainItem([this.getMoonPhase(), this.getDaytime(), input.noise], [output.search, output.rest, output.collect])
		]);
	}
	return output;
}

GameRpgAIcharacter.prototype.train = function(data)
{
	this.person.train(data);
}

GameRpgAIcharacter.prototype.generateTrainItem = function(input, output)
{
	var item = {input: {}, output: {}};
	for(i = 0; i < this.config.input.length; i++)
	{
		item.input[this.config.input[i]] = input[i];
	}
	for(i = 0; i < this.config.output.length; i++)
	{
		item.output[this.config.output[i]] = output[i];
	}
	return item;
}

GameRpgAIcharacter.prototype.birth = function() 
{
	if(this.isBirth) return;
	var hiddenLayers = [];
	for(i = 0; i < this.config.hiddenLayers; i++)
	{
		hiddenLayers.push = this.config.hiddenLayerSize;
	}
	this.person = 
		new brain.NeuralNetwork({
			hiddenLayers: hiddenLayers,
			learningRate: this.config.learningRate
	});
	this.train([
		this.generateTrainItem([this.getMoonPhase(), 4, Math.random()], [Math.random() / 6, Math.random() / 6, 0.89]),
		this.generateTrainItem([this.getMoonPhase(), 10, Math.random()], [0.87, 0.95, Math.random() / 6]),
		this.generateTrainItem([this.getMoonPhase(), 15, Math.random()], [0.6, 0.7, Math.random() / 3]),
		this.generateTrainItem([this.getMoonPhase(), 22, Math.random()], [Math.random() / 5, Math.random() / 5, 0.91]),
	], {iterations: 5});
	this.isBirth = true;
}

GameRpgAIcharacter.prototype.updateNoise = function(output)
{
	var count = 0;
	var sum = 0;
	var noise;
	for(var i in output)
	{
		count++;
		sum += output[i];
	}
	noise = sum / count;
	this.noise = noise;
	this.movingCountTreshold = Math.ceil(((noise + noise + Math.random()) * 23));
}

GameRpgAIcharacter.prototype.stopMove = function()
{
	Game.Rpg.Events.resetMove();
	this.movingCount = 0;
	this.isMoving = false;
}

GameRpgAIcharacter.prototype.setRandomDirection = function() 
{
	this.stopMove();
	var dirrection = this.getRandomDirection();
	controls[this.moves[dirrection]] = true;
	this.lastMove = dirrection;
	this.movingCount = 0;
	this.isMoving = true;
}

GameRpgAIcharacter.prototype.setLastDirection = function()
{
	if(this.lastMove === false)
	{
		this.setRandomDirection();
		return;
	}
	this.stopMove();
	controls[this.moves[this.lastMove]] = true;
	this.isMoving = true;
}

GameRpgAIcharacter.prototype.getRandomDirection = function()
{
	var direction;
	var random = Math.random();
	if(this.lastMove !== false)
	{
		while(
				((this.lastMove === 'left' || this.lastMove === 'right') && random <= 0.5) ||
				((this.lastMove === 'forward' || this.lastMove === 'backward') && random > 0.5)
		)
		{
			random = Math.random();
		}
	}
	if(random <= 0.25)
	{
		direction = 'left';
	}
	else if(random > 0.25 && random <= 0.5)
	{
		direction = 'right';
	}
	else if(random > 0.5 && random <= 0.75)
	{
		direction = 'forward';
	}
	else
	{
		direction = 'backward';
	}
	return direction;
}

GameRpgAIcharacter.prototype.isSameDirectionLong = function()
{
	return (this.movingCountTreshold <= this.movingCount) ? true : false;
}

GameRpgAIcharacter.prototype.getMoving = function()
{
	return this.isMoving;
},

GameRpgAIcharacter.prototype.binaryDice = function()
{
	return (Math.random() > 0.51) ? true : false;
}

GameRpgAIcharacter.prototype.getNoise = function()
{
	this.noise = (this.noise === 0) ? Math.random() : this.noise;
	return this.noise;
}

GameRpgAIcharacter.prototype.getMoonPhase = function()
{
	var today = new Date();
	var GetFrac = function(fr) 
	{
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
	while (jday < thisJD) 
	{
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
	return (((thisJD - oldJ) / 29.53059));
}

GameRpgAIcharacter.prototype.getDaytime = function()
{
	var today = new Date();
	var hourFloat = today.getHours() + ((today.getMinutes() * 1.333) / 100) + ((today.getSeconds() * 1.333) / 100000);// + ((today.getMilliseconds() * 1.333) / 100000000);
	return hourFloat / 24;
}

