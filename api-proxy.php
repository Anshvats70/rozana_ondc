<?php
/**
 * API Proxy for ONDC Orders
 * Handles CORS issues by proxying requests to the actual API
 */

// Enable CORS for all origins
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// API endpoint
$apiUrl = 'https://neo-server.rozana.in/orders';

try {
    // Initialize cURL
    $ch = curl_init();
    
    // Set cURL options
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_USERAGENT, 'ROZANA-ONDC-Proxy/1.0');
    
    // Set headers
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        'Content-Type: application/json'
    ]);
    
    // Execute request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    // Check for cURL errors
    if ($error) {
        throw new Exception("cURL Error: " . $error);
    }
    
    // Check HTTP status
    if ($httpCode !== 200) {
        throw new Exception("HTTP Error: " . $httpCode);
    }
    
    // Validate JSON response
    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON response: " . json_last_error_msg());
    }
    
    // Log successful request
    error_log("API Proxy: Successfully fetched " . (isset($data['data']) ? count($data['data']) : 0) . " orders");
    
    // Return the response
    echo $response;
    
} catch (Exception $e) {
    // Log error
    error_log("API Proxy Error: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'message' => 'Failed to fetch orders from API'
    ]);
}
?>
