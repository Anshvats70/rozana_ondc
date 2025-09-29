@echo off
echo Starting local HTTP server for CORS-free testing...
echo.
echo Open your browser and go to:
echo http://localhost:8080/order-details.html?transaction_id=efbb4c5b-c6b1-4011-a593-51a446a2c009^&order_id=142
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"

REM Try Python 3 first
python -m http.server 8080 2>nul
if %errorlevel% neq 0 (
    REM Try Python 2 if Python 3 fails
    python -m SimpleHTTPServer 8080 2>nul
    if %errorlevel% neq 0 (
        REM Try Node.js if Python fails
        npx http-server -p 8080 2>nul
        if %errorlevel% neq 0 (
            echo Error: No suitable HTTP server found.
            echo Please install Python or Node.js to run a local server.
            echo.
            echo Alternative: Use XAMPP and access via http://localhost/rozana_ondc/
            pause
        )
    )
)
