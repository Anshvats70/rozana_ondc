@echo off
echo Starting local web server for ONDC Order Details...
echo.
echo The server will be available at:
echo http://localhost:8080
echo.
echo To access the order details page:
echo http://localhost:8080/order-details.html?transaction_id=e4c8de8c-a59c-480f-80e2-99d8316c10f8
echo.
echo Press Ctrl+C to stop the server
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Python HTTP server...
    python -m http.server 8080
) else (
    REM Check if Node.js is available
    node --version >nul 2>&1
    if %errorlevel% == 0 (
        echo Using Node.js HTTP server...
        npx http-server -p 8080 -c-1
    ) else (
        echo Neither Python nor Node.js found.
        echo Please install Python or Node.js to run the local server.
        echo.
        echo Alternative: Use XAMPP and access via http://localhost/rozana_ondc/order-details.html
        pause
    )
)
