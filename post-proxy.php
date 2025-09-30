<?php
/**
 * POST API Proxy for ONDC Accept Proposal
 * Handles POST requests with JSON payload
 */

// Enable CORS for all origins
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
error_log('POST Proxy called: ' . $_SERVER['REQUEST_URI']);
error_log('Request method: ' . $_SERVER['REQUEST_METHOD']);

// Get the target URL from query parameter
$targetUrl = isset($_GET['url']) ? $_GET['url'] : '';

if (empty($targetUrl)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Target URL is required',
        'usage' => 'post-proxy.php?url=TARGET_URL'
    ]);
    exit();
}

try {
    // Log the target URL
    error_log('POST Proxy - Target URL: ' . $targetUrl);
    
    // Get the request body (JSON payload)
    $requestBody = file_get_contents('php://input');
    error_log('POST Proxy - Request body: ' . $requestBody);
    
    // Initialize cURL
    $ch = curl_init();
    
    // Set cURL options for POST request
    curl_setopt($ch, CURLOPT_URL, $targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_USERAGENT, 'ROZANA-ONDC-POST-Proxy/1.0');
    
    // Set headers for JSON POST request
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        'Content-Type: application/json',
        'Content-Length: ' . strlen($requestBody)
    ]);
    
    // Execute request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    $info = curl_getinfo($ch);
    
    curl_close($ch);
    
    // Log response details
    error_log('POST Proxy - HTTP Code: ' . $httpCode);
    error_log('POST Proxy - Response length: ' . strlen($response));
    error_log('POST Proxy - Response: ' . substr($response, 0, 500));
    
    if ($error) {
        error_log('POST Proxy - cURL Error: ' . $error);
        throw new Exception('cURL Error: ' . $error);
    }
    
    // Set appropriate HTTP response code
    http_response_code($httpCode);
    
    // Check if response is empty
    if (empty($response)) {
        if ($httpCode >= 200 && $httpCode < 300) {
            // Success but empty response
            echo json_encode([
                'success' => true,
                'message' => 'Request completed successfully',
                'data' => [],
                'http_code' => $httpCode
            ]);
        } else {
            throw new Exception('Empty response from server (HTTP ' . $httpCode . ')');
        }
    } else {
        // Return the response as-is
        echo $response;
    }
    
} catch (Exception $e) {
    error_log('POST Proxy - Exception: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'proxy' => 'post-proxy',
        'target_url' => $targetUrl,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
