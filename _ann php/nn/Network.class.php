<?php
Class Network {
	private $vector = Array();
	private $learning = Array();
	private $output = Array();
	private $training = Array();
	private $learningRate;
	private $learningCount;
	private $errorLimit;
	private $countTrain = 0;
	private $countOutput = 0;
	private $network = Array();
	
	private $inputs = 0; //Pocet vstupu
	private $layers = Array(); //pocet vrstev (pole s cislem vstupu ve kterem je ulozen pocet neuronu)
	private $vectors = Array();	//vektory (pole [vrstva][neuron])
	private $neuronCount = 0; //Pocet neuronu

	function __construct ($layers) 
	{ 
		$this->learningRate = 0.6;
		$this->learningCount = 100;
		$this->errorLimit = 0.01;
		
		if (!empty($layers) && is_array($layers) && count($layers) > 0)
		{
			//Nastaveni vrstev a pocet neuronu
			$i = 0;
			foreach ($layers as $item) {
				$this->layers[$i] = $item;
				if ($i > 0) $this->neuronCount += $item;
				$i++;
			}

			//nahodne nastaveni pocatecnich vah
			$vrstva = 0;
			for ( $x = 1; $x <= $this->neuronCount; $x++ )
			{
				if ($vrstva > 0) 
				{
					$count = $this->layers[$vrstva - 1] + 1;
				}
				else
				{
					$count = $this->layers[$vrstva] + 1;
				}
				for ( $y = 1; $y <= ($count); $y++ )
				{
					$this->vectors[$x][$y] = (float) (rand(0, 65535) / (65535 / 2) - 1);
				}
				$vrstva++;		
			}
		}
		
		pre($this->vectors);
	} 

	// aktivacni funkce
	function sigmoida ($value)
	{
		return 1 / (1 + exp(-(float) $value));	
	} 

	// odezva neuronove site
	function run ($input)
	{
		$net = Array();
		
		if ($this->layers[0] == count($input)) {
			$neuron = 1;
			$vrstva = 0;

			for ( $x = 1; $x <= $this->layers[$vrstva]; $x++ )
			{
				if ($vrstva > 0) 
				{
					$count = $this->layers[$vrstva - 1] + 1;
				}
				else
				{
					$count = $this->layers[$vrstva] + 1;
				}
				for ( $y = 1; $y <= ($count); $y++ )
				{
					$net[$x][$y] = 1 * $this->vectors[$x][$y];
					if ($vrstva < 1)
					{
						foreach ($input as $key => $item)
						{
							$net[$x][$y] += $item * $this->vectors[$x + 1][$y];
						}
					} else {
						for ($i = 0; $i <= count($net[$x - 1]); $i++)
						{
							$net[$x][$y] += $this->sigmoida($net[$x - 1][$y]) * $this->vectors[$x + 1][$y];
						}
					}
				}
				$neuron++;
			}
pre($net,1);

			//$net1 = 1 * $this->vector[1][1] + $value1 * $this->vector[2][1] + $value2 * $this->vector[3][1];
			//$net2 = 1 * $this->vector[1][2] + $value1 * $this->vector[2][2] + $value2 * $this->vector[3][2];
			
			$net1 = $this->sigmoida($net1);
			$net2 = $this->sigmoida($net2);
			
			$net3 = 1 * $this->vector[1][3] + $net1 * $this->vector[2][3] + $net2 * $this->vector[3][3];
			return $this->sigmoida($net1);
		} else {
			return false;
		}
	} 

	// uceni neuronove site
	function train ($value1, $value2, $out)
	{
		// vstup skryte vrstvy
		$net1 = 1 * $this->vector[1][1] + $value1 * $this->vector[2][1] + $value2 * $this->vector[3][1];
		$net2 = 1 * $this->vector[1][2] + $value1 * $this->vector[2][2] + $value2 * $this->vector[3][2];
		
		// vystup skryte vrstvy, respektive: vstup treti vrstvy
		$i3 = $this->sigmoida($net1);
		$i4 = $this->sigmoida($net2);
		
		// vystup treti vrstvy
		$net3 = 1 * $this->vector[1][3] + $i3 * $this->vector[2][3] + $i4 * $this->vector[3][3];
		$fout = $this->sigmoida($net3);
	
		$d = array();
		$d[3] = $fout * ( 1 - $fout ) * ($out - $fout);
		$d[2] = $i4 * ( 1 - $i4 ) * $this->vector[3][3] * $d[3];
		$d[1] = $i3 * ( 1 - $i3 ) * $this->vector[2][3] * $d[3];
		
		for ( $i = 1; $i <= 3; $i++ ) // cykl pres vsechny vrstvy
		{
			if ( $i == 3 )
			{
				$v1 = $i3;
				$v2 = $i4;
			}
			else
			{
				$v1 = $value1;
				$v2 = $value2;			
			}
			
			// zmena vah
			$this->vector[1][$i] += $this->learningRate * 1 * $d[$i];
			$this->vector[2][$i] += $this->learningRate * $v1 * $d[$i];
			$this->vector[3][$i] += $this->learningRate * $v2 * $d[$i];
		}
	}
}
?>
