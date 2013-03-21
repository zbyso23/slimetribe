<?
class Perceptron {
        private $weight;
        private $size;
        private $threshold;

        /**
         * Constructs perceptron
         * @param int $n size
         */
        public function __construct($n) {
                $this->size = $n;
                $this->threshold = 60;
                $this->init_weight();
        }

        /**
         * Ask perceptron
         * @param array $vector input
         * @return int output
         */
        public function ask($vector) {
                $sum = 0;
                for ($i = 0; $i < count($vector); $i++) {
                        $sum += $vector[$i] * $this->weight[$i];
                }
                if ($sum > $this->threshold) {
                        return 1;
                }
                return -1;
        }

        /**
         * Initialize weights by random values
         */
        public function init_weight() {
                for($i = 0; $i < $this->size; $i++) {
                        $this->weight[] = rand(0, 10);
                }
        }

        /**
         * Teach perceptron
         * @param array $vector
         * @param int $d output
         */
        public function teach($vector, $d) {
                if($d != $this->ask($vector)) {
                        for($i = 0; $i < $this->size; $i++) {
                                $this->weight[$i] += $d * $vector[$i]; //adjust weights of inputs
                        }
                }
        }
}

$neural_network = new Perceptron(64); // 8х8

/**
 * Teach rectangles
 */
$v = array(
1, 1, 1, 1, 1, 1, 1, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 1, 1, 1, 1, 1, 1, 1,
);
$neural_network->teach($v, 1);
//print_r($neural_network);
//$neural_network->teach($v, 1);
//print_r($neural_network);
//die();

$v = array(
0, 1, 1, 1, 1, 1, 1, 1,
0, 1, 0, 0, 0, 0, 0, 1,
0, 1, 0, 0, 0, 0, 0, 1,
0, 1, 0, 0, 0, 0, 0, 1,
0, 1, 0, 0, 0, 0, 0, 1,
0, 1, 0, 0, 0, 0, 0, 1,
0, 1, 0, 0, 0, 0, 0, 1,
0, 1, 1, 1, 1, 1, 1, 1,
);
$neural_network->teach($v, 1);

$v = array(
0, 0, 0, 0, 0, 0, 0, 0,
1, 1, 1, 1, 1, 1, 1, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 1, 1, 1, 1, 1, 1, 1,
);
$neural_network->teach($v, 1);

$v = array(
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
1, 1, 1, 1, 1, 1, 1, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 1, 1, 1, 1, 1, 1, 1,
);
$neural_network->teach($v,1);

$v = array(
0, 0, 1, 1, 1, 1, 1, 1,
0, 0, 1, 0, 0, 0, 0, 1,
0, 0, 1, 0, 0, 0, 0, 1,
0, 0, 1, 0, 0, 0, 0, 1,
0, 0, 1, 0, 0, 0, 0, 1,
0, 0, 1, 0, 0, 0, 0, 1,
0, 0, 1, 1, 1, 1, 1, 1,
0, 0, 0, 0, 0, 0, 0, 0,
);
$neural_network->teach($v, 1);

$v = array(
1, 1, 1, 1, 1, 1, 1, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 0, 0, 0, 0, 0, 0, 1,
1, 1, 1, 1, 1, 1, 1, 1,
);

$neural_network->teach($v, 1);

/**
 * Teach lines
 */
$v = array(
1, 1, 1, 1, 1, 1, 1, 1,
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
);
$neural_network->teach($v, -1);

$v = array(
0, 0, 0, 0, 0, 0, 0, 1,
0, 0, 0, 0, 0, 0, 1, 0,
0, 0, 0, 0, 0, 1, 0, 0,
0, 0, 0, 0, 1, 0, 0, 0,
0, 0, 0, 1, 0, 0, 0, 0,
0, 0, 1, 0, 0, 0, 0, 0,
0, 1, 0, 0, 0, 0, 0, 0,
1, 0, 0, 0, 0, 0, 0, 0,
);
$neural_network->teach($v, -1);

$v = array(
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
1, 1, 1, 1, 1, 1, 1, 1,
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
);
$neural_network->teach($v, -1);

$v = array(
0, 1, 0, 0, 0, 0, 0, 0,
0, 1, 0, 0, 0, 0, 0, 0,
0, 1, 0, 0, 0, 0, 0, 0,
0, 1, 0, 0, 0, 0, 0, 0,
0, 1, 0, 0, 0, 0, 0, 0,
0, 1, 0, 0, 0, 0, 0, 0,
0, 1, 0, 0, 0, 0, 0, 0,
0, 1, 0, 0, 0, 0, 0, 0,
);
$neural_network->teach($v, -1);

$v = array(
1, 0, 0, 0, 0, 0, 0, 0,
0, 1, 0, 0, 0, 0, 0, 0,
0, 0, 1, 0, 0, 0, 0, 0,
0, 0, 0, 1, 0, 0, 0, 0,
0, 0, 0, 0, 1, 0, 0, 0,
0, 0, 0, 0, 0, 1, 0, 0,
0, 0, 0, 0, 0, 0, 1, 0,
0, 0, 0, 0, 0, 0, 0, 1,
);
$neural_network->teach($v,-1);

$v = array(
0, 0, 0, 0, 0, 1, 0, 0,
0, 0, 0, 0, 0, 1, 0, 0,
0, 0, 0, 0, 0, 1, 0, 0,
0, 0, 0, 0, 0, 1, 0, 0,
0, 0, 0, 0, 0, 1, 0, 0,
0, 0, 0, 0, 0, 1, 0, 0,
0, 0, 0, 0, 0, 1, 0, 0,
0, 0, 0, 0, 0, 1, 0, 0,
);
$neural_network->teach($v,-1);
//print_r($neural_network);

// Test rectangle
$v = array(
0, 0, 1, 1, 1, 1, 1, 1,
0, 0, 1, 0, 0, 0, 0, 0,
0, 0, 1, 0, 0, 0, 0, 0,
0, 0, 0, 1, 0, 0, 1, 0,
0, 0, 1, 0, 0, 0, 0, 1,
0, 0, 1, 0, 0, 0, 0, 1,
1, 1, 1, 0, 0, 0, 0, 1,
0, 0, 1, 1, 1, 1, 1, 1,
);
echo $neural_network->ask($v) == 1 ? "Rectangle" : "Line";
echo "\r\n";

// Test lines
$v = array(
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0,
1, 1, 1, 1, 1, 1, 1, 1,
0, 0, 0, 0, 0, 0, 0, 0,
);
echo $neural_network->ask($v) == 1 ? "Rectangle" : "Line";
echo "\r\n";

$v =   array(
0, 0, 0, 0, 1, 0, 0, 0,
0, 0, 0, 1, 0, 1, 0, 0,
0, 0, 1, 0, 0, 0, 1, 0,
0, 1, 0, 0, 0, 0, 0, 1,
1, 0, 0, 0, 0, 0, 1, 0,
0, 1, 0, 0, 0, 1, 0, 0,
0, 0, 1, 0, 1, 0, 0, 0,
0, 0, 0, 1, 0, 0, 0, 0,
);
echo $neural_network->ask($v) == 1 ? "Rectangle":"Line";
echo "\r\n";
?>