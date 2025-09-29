<?php
// Simple test for the proxy
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Proxy Test</title>
</head>
<body>
    <h1>Testing PHP Proxy</h1>
    
    <h2>1. Direct PHP Proxy Test</h2>
    <button onclick="testDirectProxy()">Test Direct Proxy</button>
    <div id="directResult"></div>
    
    <h2>2. JavaScript Fetch Test</h2>
    <button onclick="testJavaScriptFetch()">Test JavaScript Fetch</button>
    <div id="fetchResult"></div>
    
    <h2>3. Server-side Test</h2>
    <?php
    echo "<p>Testing server-side cURL to API...</p>";
    
    $targetUrl = 'https://neo-server.rozana.in/orders';
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo "<p style='color: red;'>❌ cURL Error: " . htmlspecialchars($error) . "</p>";
    } elseif ($httpCode !== 200) {
        echo "<p style='color: red;'>❌ HTTP Error: " . $httpCode . "</p>";
    } else {
        $data = json_decode($response, true);
        if ($data && isset($data['success']) && $data['success']) {
            echo "<p style='color: green;'>✅ Server-side API call successful!</p>";
            echo "<p>Orders found: " . count($data['data']) . "</p>";
            
            // Check for order 142
            $order142 = null;
            foreach ($data['data'] as $order) {
                if ($order['order_id'] == 142) {
                    $order142 = $order;
                    break;
                }
            }
            
            if ($order142) {
                echo "<p style='color: green;'>✅ Order 142 found:</p>";
                echo "<ul>";
                echo "<li>Issue Status: " . ($order142['issue_details_status'] ?? 'null') . "</li>";
                echo "<li>Issue Actions: " . ($order142['issue_actions'] ?? 'null') . "</li>";
                echo "<li>Issue ID: " . ($order142['issue_id'] ?? 'null') . "</li>";
                echo "</ul>";
            } else {
                echo "<p style='color: orange;'>⚠️ Order 142 not found</p>";
            }
        } else {
            echo "<p style='color: red;'>❌ Invalid JSON response</p>";
        }
    }
    ?>
    
    <script>
        async function testDirectProxy() {
            const result = document.getElementById('directResult');
            result.innerHTML = '<p>Testing...</p>';
            
            try {
                const response = await fetch('./api-proxy.php');
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = `
                        <p style="color: green;">✅ Direct proxy successful!</p>
                        <p>Orders: ${data.data.length}</p>
                        <pre>${JSON.stringify(data.data[0], null, 2)}</pre>
                    `;
                } else {
                    result.innerHTML = `<p style="color: red;">❌ Proxy failed: ${data.error}</p>`;
                }
            } catch (error) {
                result.innerHTML = `<p style="color: red;">❌ Error: ${error.message}</p>`;
            }
        }
        
        async function testJavaScriptFetch() {
            const result = document.getElementById('fetchResult');
            result.innerHTML = '<p>Testing...</p>';
            
            try {
                const response = await fetch('./api-proxy.php', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    const order142 = data.data.find(o => o.order_id === 142);
                    result.innerHTML = `
                        <p style="color: green;">✅ JavaScript fetch successful!</p>
                        <p>Orders: ${data.data.length}</p>
                        ${order142 ? `
                            <p><strong>Order 142:</strong></p>
                            <ul>
                                <li>Issue Status: ${order142.issue_details_status}</li>
                                <li>Issue Actions: ${order142.issue_actions}</li>
                                <li>Issue ID: ${order142.issue_id}</li>
                            </ul>
                        ` : '<p>Order 142 not found</p>'}
                    `;
                } else {
                    result.innerHTML = `<p style="color: red;">❌ Fetch failed: ${data.error}</p>`;
                }
            } catch (error) {
                result.innerHTML = `<p style="color: red;">❌ Error: ${error.message}</p>`;
            }
        }
    </script>
</body>
</html>
