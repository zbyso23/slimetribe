var GAMMA = 1.0;
var AiUtils = {
    makeWeights: function( x, y, randomize ) {
	randomize = ( typeof randomize !== "undefined" ) ? randomize : false;
	var grid = [];
	for( var myX = 0; myX < x; myX++ ) {
	    grid[myX] = [];
	    for( var myY = 0; myY < y; myY++ ) {
		grid[myX][myY] = ( randomize === true ) ? 1.0 - 2.0 * Math.random() : 0;
	    }
	}
        return grid;
    },
    
    makeLayer: function( length ) {
	var layer = [];
	for( i = 0; i < length; i++ ) {
	    layer.push( i );
	}
	return layer;
    },

    makeMultiLayer: function( length, innerLength ) {
	var layer = [];
	var innerLayer = AiUtils.makeLayer( innerLength );
	for( i = 0; i < length; i++ ) {
	    layer[i] = innerLayer;
	}
	return layer;
    },


    clasifyHelper: function( input, inputSize, weights, outputSize ) {
	var outputLayer = [];
	for( var i = 0; i < outputSize; i++ ) {
	    outputLayer[i] = weights[(input.length - 1)][i];
	    for( var j = 0; j < input.length; j++ ) {
		outputLayer[i] += input[j] * weights[j][i];
	    }
	    outputLayer[i] *= -GAMMA;
	    outputLayer[i] = 1.0 / ( 1.0 + Math.exp( outputLayer[i] ) );
	}
	return outputLayer;
    },
    
    clasify: function( input, config, weights ) {
	var classLayer, classLayerSize, classWeights;
	var outputLayers = [];
	var outputLayer;
	try {
	    if( input.length < 1 || input.length < this.input ) throw "Soo little array on input, teach me more.";
	    for( var layer = 1; layer < config.layers.length; layer++ ) {
		classLayer = ( layer === 1 ) ? input : outputLayer;
		classLayerSize = ( layer === 1 ) ? input.length : outputLayer.length;
		classWeights = weights[ layer ];
		outputLayer = AiUtils.clasifyHelper( classLayer, classLayerSize, classWeights, config.layers[ layer ].size );
		outputLayers[layer] = outputLayer;
	    }
	} catch( error ) {
	    AiUtils.log( "Ai clasify failed: " + error );
	}
        return outputLayers;
    },
    
    
    
    log: function( message ) {
	console.log( message  );
    }
};



var Ai = function( config, nn ) {
    this.config = config;
    this.input = 0;
    this.output = 0;
    this.nn = ( typeof nn !== "undefined" ) ? nn : {};
    this.weights = [];
    this.outputLayers = [];
    this.dWeights = [];
    this.dWeightsLayers = [];
    this.initialized = false;
};

Ai.prototype = {
    getConfig: function() {
        return this.config;
    },
    
    initialize: function() {
	try
	{
	    if( this.config.layers.length < 2 ) throw "Too little layers, add layer to Your network.";
	    var isInput = false;
	    var isOutput = false;
	    var isFailed = false;
	    for( var i in this.config.layers ) {
		if( this.config.layers[i].type === "input" && this.config.layers[i].size > 0 ) {
		    isInput = true;
		    this.input = this.config.layers[i].size;
		} else if( this.config.layers[i].type === "output" && this.config.layers[i].size > 0 ) {
		    isOutput = true;
		    this.output = this.config.layers[i].size;
		} else if( this.config.layers[i].type !== "hidden" || this.config.layers[i].size < 1 ) {
		    isFailed = true;
		}
	    }
	    if( !isInput || !isOutput || isFailed ) throw "Check Your configuration. One layer have bad size or bad type, or is missing input or output layer.";
	    for( var layer = 1; layer < this.config.layers.length; layer++ ) {
		var x = this.config.layers[layer - 1].size;
		var y = this.config.layers[layer].size;
		this.weights[layer] = AiUtils.makeWeights( x, y, true );
		this.dWeights[layer] = AiUtils.makeWeights( x, y, false );
	    }
	    this.initialized = true;
	} catch( error ) {
	    AiUtils.log( "Ai initialization failed: " + error );
	}
	console.log( 'this', this );
        return;
    },

    multiply: function() {
	try
	{
	    if( this.initialized === false ) throw "Please initialize network first."
	    //TODO Multiply network by 2
	    //this.input *= 2;
	    //this.output *= 2;

	} catch( error ) {
	    AiUtils.log( "Ai multiply failed: " + error );
	}
        return;
    },

    clasify: function( input ) {
	this.outputLayers = AiUtils.clasify( input, this.config, this.weights );
	var outputLayer = this.outputLayers[ this.outputLayers.length - 1 ];
        return outputLayer;
    },
    
    learn: function( inputData, outputData, learnSpeed, momentum ) {
	try {
	    var ml = AiUtils.makeMultiLayer( 3, 5 );
	    var output;
	    var delta;
	    var dWeights;
	    for( var iData = 0; iData < inputData.length; iData++ ) {
		    var input = inputData[ iData ];
		    var expectedOutput = outputData[ iData ];
		    this.outputLayers = AiUtils.clasify( input, this.config, this.weights );
		    
		    output = this.outputLayers[ this.outputLayers.length - 1 ];
		    
		    var isOutputLayer = true;
		    for( var layer = this.outputLayers.length - 1; layer > 0; layer-- ) {
			/*
			if( isOutputLayer === false ) {
			    var s = AiUtils.makeLayer( this.config.layers[ layer ].size );
			    for(var i = 0; i < this.config.layers[ layer ].size; i++ ) {
				s[ i ] = 0.0;
				for( var j = 0; j < this.config.layers[ layer - 1 ].size; j++ ) s[ i ] += delta[ j ] * this.weights[ layer ][ i ][ j ]; 
			    }
			}*/
			delta = AiUtils.makeLayer( this.config.layers[ layer - 1 ].size );
			
			for( var i = 0; i < this.config.layers[ layer ].size; i++ ) {
				if( isOutputLayer === true ) {
				    delta[ i ] = GAMMA * ( this.outputLayers[ layer ][ i ] * ( 1 - this.outputLayers[ layer ][ i ] ) * ( expectedOutput[ i ] - this.outputLayers[ layer ][ i ] ) );
				} else {
				    //delta[ i ] = GAMMA * ( this.outputLayers[ layer ][ i ] * ( 1 - this.outputLayers[ layer ][ i ] ) * s[ i ] );
				}
			}
			dWeights = AiUtils.makeMultiLayer( ( this.config.layers[ layer ].size + 1 ), (this.config.layers[ layer - 1 ].size + 1) );
			//console.log('dWeights',dWeights);
			for( var i = 0; i < this.config.layers[ ( layer - 1 ) ].size; i++ ) {
				for( var j = 0; j < this.config.layers[ layer ].size; j++ ) dWeights[ j ][ i ] = learnSpeed * delta[ i ] * input[ j ];
			}
			
			//for( var j = 0; j < this.config.layers[ layer ].size; j++ ) dWeights[ j ][ this.config.layers[ ( layer - 1 ) ].size ] = learnSpeed * delta[ j ];
			//this.plus( this.weights[ layer ], dWeights, 1.0 );
			//this.plus( this.weights[ layer ], this.dWeightsLayers[ layer ], momentum );
			this.dWeightsLayers[ layer ] = dWeights;
			console.log(this.dWeightsLayers[ layer ]);
			console.log(layer);
			if( isOutputLayer === true ) isOutputLayer = false;
			
			break;
		    }
		    

	    }
	} catch ( error ) {
	    AiUtils.log( "Ai learn failed: " + error );
	}
    }

    

};



var nnConfig = { 
		    'layers': [ 
			{ 'type': 'input', 'size': 2 },
			{ 'type': 'hidden', 'size': 5 },
			{ 'type': 'hidden', 'size': 5 },
			{ 'type': 'hidden', 'size': 5 },
			{ 'type': 'output', 'size': 2 }
		    ] 
		};
var nn = new Ai( nnConfig );
nn.initialize();

var input = [ 1, 0.5 ];
var inputData = [ [ 1, 0.5 ], [ 1, 0 ], [ 0.7, 1 ] ];
var outputData = [ [ 0, 0 ], [ 0, 0 ], [ 1, 1 ] ];
var result;
result = nn.clasify( input );
console.log( result );
var learn;
learn = nn.learn( inputData, outputData, 2, 2 );
//result = nn.clasify( input );
//console.log( result );
