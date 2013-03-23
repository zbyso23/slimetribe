function NN() {
	this.vector = [];
	this.learning = [];
	this.output = [];
	this.training = [];
	this.learningRate;
	this.learningCount;
	this.errorLimit;
	this.countTrain = 0;
	this.countOutput = 0;

	this.construct = function( learningRate ) {
	    this.learningRate = ( typeof learningRate === "undefined" ) ? 0.6 : learningRate;
	    this.learningCount = 100;
	    this.errorLimit = 0.01;
	    //nahodne nastaveni pocatecnich vah
	    for ( var i = 1; i <= 3; i++ )
	    {
		for ( var j = 1; j <= 3; j++ )
		{
		    if( typeof this.vector[ i ] === "undefined" ) this.vector[ i ] = [];
		    this.vector[ i ][ j ] = ( Math.random( 0, 65535 ) / ( 65535 / 2 ) - 1 );
		}		
	    }
	} 

	// aktivacni funkce
	this.sigmoida = function( value )
	{
		return 1 / (1 + Math.exp( -value ) );	
	} 

	// odezva neuronove site
	this.run = function( values )
	{
	    var net1 = 1 * this.vector[1][1] + values[0] * this.vector[2][1] + values[1] * this.vector[3][1];
	    var net2 = 1 * this.vector[1][2] + values[0] * this.vector[2][2] + values[1] * this.vector[3][2];

	    var i3 = this.sigmoida( net1 );
	    var i4 = this.sigmoida( net2 );

	    net1 = 1 * this.vector[1][3] + i3 * this.vector[2][3] + i4 * this.vector[3][3];
	    return this.sigmoida( net1 );
	} 


	// uceni neuronove site
	this.train = function( value1, value2, out )
	{
	    // vstup skryte vrstvy
	    var net1 = 1 * this.vector[1][1] + value1 * this.vector[2][1] + value2 * this.vector[3][1];
	    var net2 = 1 * this.vector[1][2] + value1 * this.vector[2][2] + value2 * this.vector[3][2];
	    // vystup skryte vrstvy, respektive: vstup treti vrstvy
	    var i3 = this.sigmoida( net1 );
	    var i4 = this.sigmoida( net2 );
	    // vystup treti vrstvy
	    var net3 = 1 * this.vector[1][3] + i3 * this.vector[2][3] + i4 * this.vector[3][3];
	    var fout = this.sigmoida( net3 );
	    var d = [];
	    d[3] = fout * ( 1 - fout ) * ( out - fout );
	    d[2] = i4 * ( 1 - i4 ) * this.vector[3][3] * d[3];
	    d[1] = i3 * ( 1 - i3 ) * this.vector[2][3] * d[3];
	    // cykl pres vsechny vrstvy
	    for ( var i = 1; i <= 3; i++ ) {
		if ( i == 3 ) {
		    var v1 = i3;
		    var v2 = i4;
		} else {
		    var v1 = value1;
		    var v2 = value2;			
		}
		// zmena vah
		this.vector[1][i] += this.learningRate * 1 * d[i];
		this.vector[2][i] += this.learningRate * v1 * d[i];
		this.vector[3][i] += this.learningRate * v2 * d[i];
	    }
	}
	
	this.AddOutput = function( data ) {
	    this.countOutput++;
	    this.output[ this.countOutput ] = data;
	}
	
	this.AddTrain = function( data ) {
	    this.countTrain++;
	    for( item in data ) {
		if( typeof this.training[ this.countTrain ] === "undefined" ) this.training[ this.countTrain ] = [];
		this.training[ this.countTrain ].push( data[ item ] );
	    }
	}

	this.Reset = function() {
	    this.countTrain = 0;
	    this.countOutput = 0;
	}

	this.Learn = function( count ) {
	    this.learningCount = ( typeof $count === "undefined" || count < 2 ) ? this.learningCount : count;
	    // cyklus uceni
	    for ( var i = 0; i < this.learningCount; i++ ) {
		for( j = 0; j < this.countTrain; j++ ) {
		    if( typeof this.training[ this.countTrain ] === "undefined" ) this.training[ this.countTrain ] = [];
		    this.train( this.training[ j+1 ][0], this.training[ j+1 ][1], this.output[ j+1 ] );
		    this.learning[ j+1 ] = 0;
		}

		for( var j = 0; j < this.countTrain; j++ ) {
		    this.learning[ j+1 ] = this.run( this.training[ j + 1 ][0], this.training[ j+1 ][1] );
		}
		// vypocet chyby
		var tmp = 0;
		for( var j = 0; j < this.countTrain; j++ ) {
		    tmp = tmp + ( ( this.output[ j+1 ] - this.learning[ j+1 ] ) * ( this.output[ j+1 ] - this.learning[ j+1 ] ) );

		}
		var error = 0.5 * tmp;
		if( error <= this.errorLimit ) break;
	    }
	}
};

function Perceptron() {
    
        this.weight = [];
        this.size;
        this.threshold;

        this.construct = function( size ) {
	    this.size = size;
	    this.threshold = 10;
	    this.init_weight();
        }

        /**
         * Ask perceptron
         * @param array $vector input
         * @return int output
         */
        this.ask = function( vector ) {
	    var sum = 0;
	    for ( var i = 0; i < vector.length; i++ ) sum += vector[ i ] * this.weight[ i ];
	    if( sum > this.threshold ) return 1;
	    return -1;
        }

        this.init_weight = function() {
	    
	    for( var i = 0; i < this.size; i++ ) this.weight.push( Math.random(0, 10) );
        }

        /**
         * Teach perceptron
         * @param array $vector
         * @param int $d output
         */
        this.teach = function( vector, d ) {
	    if( d != this.ask( vector ) ) for( var i = 0; i < this.size; i++ ) this.weight[ i ] += d * vector[ i ]; //adjust weights of inputs
        }
    
}