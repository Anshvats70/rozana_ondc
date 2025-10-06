// Tracking page JavaScript
console.log('=== TRACKING PAGE INITIALIZATION ===');

// DOM Elements
const orderIdSpan = document.getElementById('orderId');
const transactionIdSpan = document.getElementById('transactionId');
const trackingIdSpan = document.getElementById('trackingId');
const trackingStatusSpan = document.getElementById('trackingStatus');
const trackingUrlSpan = document.getElementById('trackingUrl');
const lastUpdatedSpan = document.getElementById('lastUpdated');
const externalTrackingUrlSpan = document.getElementById('externalTrackingUrl');
const openTrackingUrlLink = document.getElementById('openTrackingUrl');
const refreshTrackingBtn = document.getElementById('refreshTracking');
const timelineContainer = document.getElementById('timelineContainer');

// Tracking data from ONDC response
let trackingData = null;

// Initialize tracking page
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== TRACKING PAGE INITIALIZATION ===');
    
    loadTrackingData();
    setupEventListeners();
    generateTimeline();
    
    console.log('=== TRACKING PAGE INITIALIZATION COMPLETE ===');
});

function setupEventListeners() {
    // Refresh tracking button
    if (refreshTrackingBtn) {
        refreshTrackingBtn.addEventListener('click', refreshTracking);
    }
    
    // Open external tracking URL
    if (openTrackingUrlLink) {
        openTrackingUrlLink.addEventListener('click', function(e) {
            e.preventDefault();
            const url = externalTrackingUrlSpan.textContent;
            if (url && url !== 'Loading...') {
                window.open(url, '_blank');
            }
        });
    }
}

function loadTrackingData() {
    // Get tracking data from localStorage or use default ONDC response
    const storedTrackingData = localStorage.getItem('trackingData');
    
    if (storedTrackingData) {
        trackingData = JSON.parse(storedTrackingData);
        console.log('Loaded tracking data from localStorage:', trackingData);
    } else {
        // Use the provided ONDC tracking response as default
        trackingData = {
            "context": {
                "domain": "ONDC:RET10",
                "action": "on_track",
                "country": "IND",
                "city": "std:011",
                "core_version": "1.2.0",
                "bap_id": "neo-server.rozana.in",
                "bap_uri": "https://neo-server.rozana.in/bapl",
                "bpp_id": "pramaan.ondc.org/beta/preprod/mock/seller",
                "bpp_uri": "https://pramaan.ondc.org/beta/preprod/mock/seller",
                "transaction_id": "bd58eaee-bb04-4818-a875-9d9ccc4c2747",
                "message_id": "030fa05d-e6fa-48ba-8acb-a9af44846709",
                "timestamp": "2025-10-03T06:31:53.384Z"
            },
            "message": {
                "tracking": {
                    "id": "86d1b76d-0f6e-4482-847f-70de9ce74d5a",
                    "url": "http://sequelstring-lsp-ondc.com/track",
                    "status": "active"
                }
            }
        };
        
        // Store the default data
        localStorage.setItem('trackingData', JSON.stringify(trackingData));
        console.log('Using default tracking data:', trackingData);
    }
    
    displayTrackingInfo();
}

function displayTrackingInfo() {
    if (!trackingData) return;
    
    // Display order information
    if (orderIdSpan) {
        const orderId = localStorage.getItem('currentOrderId') || 'O' + Date.now();
        orderIdSpan.textContent = orderId;
    }
    
    if (transactionIdSpan) {
        const transactionId = trackingData.context?.transaction_id || localStorage.getItem('currentTransactionId') || 'Not available';
        transactionIdSpan.textContent = transactionId;
    }
    
    if (trackingIdSpan) {
        const trackingId = trackingData.message?.tracking?.id || 'Not available';
        trackingIdSpan.textContent = trackingId;
    }
    
    if (trackingStatusSpan) {
        const status = trackingData.message?.tracking?.status || 'unknown';
        trackingStatusSpan.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        trackingStatusSpan.className = `status-badge status-${status === 'active' ? 'active' : 'inactive'}`;
    }
    
    if (trackingUrlSpan) {
        const url = trackingData.message?.tracking?.url || 'Not available';
        trackingUrlSpan.textContent = url;
    }
    
    if (externalTrackingUrlSpan) {
        const url = trackingData.message?.tracking?.url || 'http://sequelstring-lsp-ondc.com/track';
        externalTrackingUrlSpan.textContent = url;
        
        // Update the open tracking URL link
        if (openTrackingUrlLink) {
            openTrackingUrlLink.href = url;
        }
    }
    
    if (lastUpdatedSpan) {
        const timestamp = trackingData.context?.timestamp || new Date().toISOString();
        const date = new Date(timestamp);
        lastUpdatedSpan.textContent = date.toLocaleString();
    }
}

function generateTimeline() {
    if (!timelineContainer) return;
    
    // Create timeline based on order status and tracking data
    const timelineItems = [
        {
            id: 'order_placed',
            title: 'Order Placed',
            description: 'Your order has been successfully placed',
            time: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString(), // 2 hours ago
            status: 'completed',
            icon: 'fas fa-shopping-cart'
        },
        {
            id: 'order_confirmed',
            title: 'Order Confirmed',
            description: 'Seller has confirmed your order',
            time: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toLocaleString(), // 1.5 hours ago
            status: 'completed',
            icon: 'fas fa-check-circle'
        },
        {
            id: 'order_processing',
            title: 'Processing',
            description: 'Your order is being prepared for dispatch',
            time: new Date(Date.now() - 1 * 60 * 60 * 1000).toLocaleString(), // 1 hour ago
            status: 'completed',
            icon: 'fas fa-cog'
        },
        {
            id: 'order_dispatched',
            title: 'Dispatched',
            description: 'Your order has been dispatched from the warehouse',
            time: new Date(Date.now() - 30 * 60 * 1000).toLocaleString(), // 30 minutes ago
            status: 'current',
            icon: 'fas fa-truck'
        },
        {
            id: 'order_in_transit',
            title: 'In Transit',
            description: 'Your order is on the way to your location',
            time: 'In progress',
            status: 'current',
            icon: 'fas fa-shipping-fast'
        },
        {
            id: 'order_delivered',
            title: 'Delivered',
            description: 'Your order has been delivered to your address',
            time: 'Expected in 2-4 hours',
            status: 'pending',
            icon: 'fas fa-home'
        }
    ];
    
    // Clear loading spinner
    timelineContainer.innerHTML = '';
    
    // Generate timeline items
    timelineItems.forEach((item, index) => {
        const timelineItem = document.createElement('div');
        timelineItem.className = `timeline-item ${item.status}`;
        
        timelineItem.innerHTML = `
            <div class="timeline-icon ${item.status}">
                <i class="${item.icon}"></i>
            </div>
            <div class="timeline-content">
                <div class="timeline-title-text">${item.title}</div>
                <div class="timeline-description">${item.description}</div>
            </div>
            <div class="timeline-time">${item.time}</div>
        `;
        
        timelineContainer.appendChild(timelineItem);
    });
}

function refreshTracking() {
    console.log('Refreshing tracking data...');
    
    // Show loading state
    if (refreshTrackingBtn) {
        const originalText = refreshTrackingBtn.innerHTML;
        refreshTrackingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        refreshTrackingBtn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            // Update timestamp
            if (trackingData) {
                trackingData.context.timestamp = new Date().toISOString();
                localStorage.setItem('trackingData', JSON.stringify(trackingData));
            }
            
            // Refresh display
            displayTrackingInfo();
            generateTimeline();
            
            // Reset button
            refreshTrackingBtn.innerHTML = originalText;
            refreshTrackingBtn.disabled = false;
            
            // Show notification
            showNotification('Tracking information updated', 'success');
            
        }, 2000);
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    
    // Set background color based on type
    let backgroundColor = '#10b981'; // success
    if (type === 'error') backgroundColor = '#ef4444';
    if (type === 'warning') backgroundColor = '#f59e0b';
    if (type === 'info') backgroundColor = '#3b82f6';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-weight: 500;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Function to simulate receiving tracking updates
function simulateTrackingUpdate() {
    console.log('Simulating tracking update...');
    
    if (trackingData) {
        // Update status randomly
        const statuses = ['active', 'inactive'];
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        trackingData.message.tracking.status = newStatus;
        trackingData.context.timestamp = new Date().toISOString();
        
        // Save updated data
        localStorage.setItem('trackingData', JSON.stringify(trackingData));
        
        // Refresh display
        displayTrackingInfo();
        
        // Show notification
        showNotification(`Tracking status updated to ${newStatus}`, 'info');
    }
}

// Function to set tracking data from external source
function setTrackingData(data) {
    console.log('Setting tracking data:', data);
    
    trackingData = data;
    localStorage.setItem('trackingData', JSON.stringify(trackingData));
    
    // Refresh display
    displayTrackingInfo();
    generateTimeline();
    
    showNotification('Tracking data updated', 'success');
}

// Function to get current tracking data
function getTrackingData() {
    return trackingData;
}

// Make functions globally available
window.setTrackingData = setTrackingData;
window.getTrackingData = getTrackingData;
window.simulateTrackingUpdate = simulateTrackingUpdate;

// Auto-refresh every 30 seconds
setInterval(() => {
    if (trackingData && trackingData.message?.tracking?.status === 'active') {
        console.log('Auto-refreshing tracking data...');
        refreshTracking();
    }
}, 30000);

console.log('=== TRACKING PAGE LOADED ===');
