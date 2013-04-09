<?php
include ("header.html");
include ("functions.php");
include ("Network.class.php");

	//Nastaveni site, vrstva 0 -> vstupy
	$layers = Array();
	$layers[0] = 2;
	$layers[1] = 2;
	$layers[2] = 1;
	$network = new Network ($layers);
	$input = Array();
	$input[] = 1.0;
	$input[] = 0.0;
	$network->run($input);

//OR
	//0
	$network->AddTrain(Array(0.0,1.0,0.0,1.0,0.0,1.0,1.0,0.0,1.0,1.0,0.0,1.0,1.0,0.0,1.0,1.0,0.0,1.0,0.0,1.0,0.0));
	$network->AddOutput(0.20);
	$network->Learn(45);
//print_r($network);
$network->Reset();
//print_r($network);

	$network->AddTrain(Array(0.0,0.7,1.0,1.0,1.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0));
	$network->AddOutput(0.50);
	$network->Learn(45);

$network->Reset();
	//0
	$network->AddTrain(Array(0.0,1.0,0.0,1.0,0.0,1.0,1.0,0.0,1.0,1.0,0.0,1.0,1.0,0.0,1.0,1.0,0.0,1.0,0.0,1.0,0.-0));
	$network->AddOutput(0.15);
	$network->Learn(45);
	
	$network->AddTrain(Array(0.0,0.97,1.0,1.0,1.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0));
	$network->AddOutput(0.75);
	$network->Learn(45);
	//print_r($network->run(0.0,1.0,0.0,1.0,0.5,1.0,1.0,0.0,1.0,1.0,0.0,1.0,1.0,0.0,1.0,1.0,0.0,1.0,0.0,1.0,0.0));
	//print_r($network->run(0.0,1.0));
	
	
	
	echo "<br />";
	echo "<br />";

include ("footer.html");
?>
