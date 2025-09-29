<?php
// Set CORS headers FIRST
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Request-With, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Add debug logging
error_log('PHP Proxy called: ' . $_SERVER['REQUEST_URI']);

// Get the target URL from query parameter
$targetUrl = isset($_GET['url']) ? $_GET['url'] : 'https://neo-server.rozana.in/orders';

// Add cache-busting parameters
$cacheBusting = '?_t=' . time() . '&_r=' . uniqid() . '&_proxy=php';
if (strpos($targetUrl, '?') !== false) {
    $cacheBusting = '&_t=' . time() . '&_r=' . uniqid() . '&_proxy=php';
}
$targetUrl .= $cacheBusting;

try {
    // Log the target URL
    error_log('Fetching from: ' . $targetUrl);
    
    // Initialize cURL
    $ch = curl_init();
    
    // Set cURL options with more robust settings
    curl_setopt($ch, CURLOPT_URL, $targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json, text/plain, */*',
        'Accept-Language: en-US,en;q=0.9',
        'Accept-Encoding: gzip, deflate, br',
        'Connection: keep-alive',
        'Upgrade-Insecure-Requests: 1'
    ]);
    
    // Execute request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    $info = curl_getinfo($ch);
    
    curl_close($ch);
    
    // Log response details
    error_log('HTTP Code: ' . $httpCode);
    error_log('Response length: ' . strlen($response));
    
    if ($error) {
        error_log('cURL Error: ' . $error);
        throw new Exception('cURL Error: ' . $error);
    }
    
    if ($httpCode !== 200) {
        error_log('HTTP Error: ' . $httpCode . ' - Response: ' . substr($response, 0, 500));
        throw new Exception('HTTP Error: ' . $httpCode);
    }
    
    // Check if response is empty
    if (empty($response)) {
        throw new Exception('Empty response from server');
    }
    
    // Validate JSON
    $jsonData = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('JSON Error: ' . json_last_error_msg() . ' - Response: ' . substr($response, 0, 500));
        throw new Exception('Invalid JSON response: ' . json_last_error_msg());
    }
    
    // Log success
    error_log('Successfully fetched and parsed JSON data');
    
    // Return the response
    echo $response;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'proxy' => 'php',
        'target_url' => $targetUrl,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>