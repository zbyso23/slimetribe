<?php
function pre ($data, $kill = 0) 
{
  echo "<pre>";
  print_r($data);
  echo "</pre>";
  if ($kill == 1) 
  {
    die();
  }
  return;
}
?>
