<?php
/* SEZNAM ZBOZI.XML */
include('inc/ProductImport.php');
$xml = file_get_contents('seznam.xml');
$zbozi = new ProductImport();
$zbozi->parseXML($xml);
$zbozi->processProducts();
print_r($zbozi->output);
?>