// ONDC Buyer App JavaScript

// Global variables
let cartItems = [];
let currentLocation = 'Mumbai, Maharashtra';
let searchHistory = [];
let recentLocations = ['Mumbai, Maharashtra', 'Delhi, Delhi', 'Bangalore, Karnataka'];

// ONDC API Configuration
const ONDC_SEARCH_API_URL = 'https://pramaan.ondc.org/beta/preprod/mock/seller/search';
const ONDC_RESULTS_API_URL = 'https://neo-server.rozana.in/search-results';
const ONDC_SELECT_API_URL = 'https://pramaan.ondc.org/beta/preprod/mock/seller/select';
const BAP_ID = 'neo-server.rozana.in';
const BAP_URI = 'https://neo-server.rozana.in/bapl';
const BPP_ID = 'pramaan.ondc.org/beta/preprod/mock/seller';
const BPP_URI = 'https://pramaan.ondc.org/beta/preprod/mock/seller';

// ONDC Session Management
let currentTransactionId = null; // Will be generated once and reused for the entire order flow
let selectedItems = new Set(); // Track selected items to prevent duplicate select events

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchSuggestions = document.getElementById('searchSuggestions');
const cartBtn = document.getElementById('cartBtn');
const cartCount = document.querySelector('.cart-count');
const locationBtn = document.getElementById('locationBtn');
const currentLocationSpan = document.getElementById('currentLocation');
const changeLocationBtn = document.getElementById('changeLocationBtn');
const locationModal = document.getElementById('locationModal');
const closeLocationModal = document.getElementById('closeLocationModal');
const locationSearch = document.getElementById('locationSearch');
const searchLocationBtn = document.getElementById('searchLocationBtn');
const recentLocationsDiv = document.getElementById('recentLocations');
const featuredProductsDiv = document.getElementById('featuredProducts');
const localSellersDiv = document.getElementById('localSellers');

// Sample data
const sampleProducts = [
    {
        id: 1,
        name: 'Organic Fresh Vegetables',
        price: '₹299',
        seller: 'Green Farm Store',
        rating: 4.5,
        category: 'groceries',
        image: '🥬',
        available_on_cod: true // COD available
    },
    {
        id: 2,
        name: 'Wireless Bluetooth Headphones',
        price: '₹1,299',
        seller: 'Tech Hub',
        rating: 4.8,
        category: 'electronics',
        image: '🎧',
        available_on_cod: false // No COD for electronics
    },
    {
        id: 3,
        name: 'Cotton T-Shirt',
        price: '₹599',
        seller: 'Fashion World',
        rating: 4.3,
        category: 'fashion',
        image: '👕',
        available_on_cod: true // COD available
    },
    {
        id: 4,
        name: 'Indoor Plant Pot',
        price: '₹399',
        seller: 'Garden Paradise',
        rating: 4.6,
        category: 'home',
        image: '🪴',
        available_on_cod: false // No COD for home items
    },
    {
        id: 5,
        name: 'Face Moisturizer',
        price: '₹799',
        seller: 'Beauty Corner',
        rating: 4.4,
        category: 'health',
        image: '🧴',
        available_on_cod: true // COD available
    },
    {
        id: 6,
        name: 'Programming Book',
        price: '₹899',
        seller: 'Book World',
        rating: 4.7,
        category: 'books',
        image: '📚',
        available_on_cod: false // No COD for books
    }
];

const sampleSellers = [
    {
        id: 1,
        name: 'Green Farm Store',
        category: 'Groceries & Fresh Produce',
        rating: 4.5,
        avatar: '🌱'
    },
    {
        id: 2,
        name: 'Tech Hub',
        category: 'Electronics & Gadgets',
        rating: 4.8,
        avatar: '💻'
    },
    {
        id: 3,
        name: 'Fashion World',
        category: 'Clothing & Accessories',
        rating: 4.3,
        avatar: '👗'
    },
    {
        id: 4,
        name: 'Garden Paradise',
        category: 'Home & Garden',
        rating: 4.6,
        avatar: '🌺'
    }
];

const searchSuggestionsData = [
    'Smartphones', 'Laptops', 'Groceries', 'Fashion', 'Home Decor',
    'Books', 'Electronics', 'Beauty Products', 'Sports Equipment',
    'Kitchen Appliances', 'Furniture', 'Toys', 'Health Supplements'
];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadFeaturedProducts();
    loadLocalSellers();
    loadRecentLocations();
});

function initializeApp() {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('ondcCart');
    if (savedCart) {
        cartItems = JSON.parse(savedCart);
        updateCartCount();
    }
    
    // Load search history
    const savedHistory = localStorage.getItem('ondcSearchHistory');
    if (savedHistory) {
        searchHistory = JSON.parse(savedHistory);
    }
    
    // Load current location
    const savedLocation = localStorage.getItem('ondcLocation');
    if (savedLocation) {
        currentLocation = savedLocation;
        if (currentLocationSpan) {
            currentLocationSpan.textContent = currentLocation;
        }
    }
}

function setupEventListeners() {
    // Search functionality (only if elements exist)
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('focus', function() {
            showSearchSuggestions(searchSuggestionsData.slice(0, 6));
        });
        searchInput.addEventListener('blur', hideSearchSuggestions);
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            const category = this.dataset.category;
            searchInput.value = category;
            performSearch();
        });
    });
    
    // Category cards
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.dataset.category;
            searchInput.value = category;
            performSearch();
        });
    });
    
    // Location functionality (only if elements exist)
    if (locationBtn) {
        locationBtn.addEventListener('click', openLocationModal);
    }
    if (changeLocationBtn) {
        changeLocationBtn.addEventListener('click', openLocationModal);
    }
    if (closeLocationModal) {
        closeLocationModal.addEventListener('click', closeLocationModalFunction);
    }
    if (searchLocationBtn) {
        searchLocationBtn.addEventListener('click', searchLocation);
    }
    
    // Modal click outside to close (only if element exists)
    if (locationModal) {
        locationModal.addEventListener('click', function(e) {
            if (e.target === locationModal) {
                closeLocationModalFunction();
            }
        });
    }
    
    // Cart button (only if element exists)
    if (cartBtn) {
        cartBtn.addEventListener('click', function() {
            window.location.href = 'cart.html';
        });
    }
}

function handleSearchInput(e) {
    const query = e.target.value.toLowerCase();
    
    if (query.length > 0) {
        const filteredSuggestions = searchSuggestionsData.filter(item =>
            item.toLowerCase().includes(query)
        );
        showSearchSuggestions(filteredSuggestions);
    } else {
        showSearchSuggestions(searchSuggestionsData.slice(0, 6));
    }
}

function showSearchSuggestions(suggestions = searchSuggestionsData.slice(0, 6)) {
    if (!searchSuggestions) {
        console.log('Search suggestions element not found, skipping...');
        return;
    }
    
    searchSuggestions.innerHTML = '';
    
    // Ensure suggestions is an array
    if (!Array.isArray(suggestions)) {
        suggestions = searchSuggestionsData.slice(0, 6);
    }
    
    suggestions.forEach(suggestion => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.textContent = suggestion;
        suggestionItem.addEventListener('click', function() {
            if (searchInput) {
                searchInput.value = suggestion;
                performSearch();
                hideSearchSuggestions();
            }
        });
        searchSuggestions.appendChild(suggestionItem);
    });
    
    searchSuggestions.style.display = 'block';
}

function hideSearchSuggestions() {
    if (!searchSuggestions) return;
    
    setTimeout(() => {
        searchSuggestions.style.display = 'none';
    }, 200);
}

async function performSearch() {
    if (!searchInput) {
        console.log('Search input not found, skipping search...');
        return;
    }
    
    const query = searchInput.value.trim();
    
    if (query) {
        // Add to search history
        if (!searchHistory.includes(query)) {
            searchHistory.unshift(query);
            searchHistory = searchHistory.slice(0, 10); // Keep only last 10 searches
            localStorage.setItem('ondcSearchHistory', JSON.stringify(searchHistory));
        }
        
        // Show loading state
        showLoading(searchBtn);
        searchBtn.textContent = 'Searching...';
        
        try {
            // Make API call to ONDC search endpoint
            const searchResponse = await callONDCSearchAPI(query);
            
            // Wait a moment for the search to be processed
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Fetch results from the results API with retry mechanism
            const searchResults = await fetchSearchResultsWithRetry(currentTransactionId, 2, 1000);
            
            // Process and display results
            displaySearchResults(searchResults, query);
            
            console.log(`Search completed for: ${query}`, searchResults);
            
        } catch (error) {
            console.error('Search error:', error);
            showNotification('Search failed. Please try again.');
        } finally {
            // Hide loading state
            hideLoading(searchBtn);
            searchBtn.textContent = 'Search';
            hideSearchSuggestions();
        }
    }
}

function loadFeaturedProducts() {
    if (!featuredProductsDiv) {
        console.log('Featured products div not found, skipping...');
        return;
    }
    
    featuredProductsDiv.innerHTML = '';
    
    sampleProducts.slice(0, 4).forEach(product => {
        const productCard = createProductCard(product);
        featuredProductsDiv.appendChild(productCard);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
        <div class="product-image">
            <span style="font-size: 3rem;">${product.image}</span>
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">${product.price}</div>
            <div class="product-seller">by ${product.seller}</div>
            <div class="product-rating">
                <div class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}</div>
                <span class="rating-text">${product.rating}</span>
            </div>
            <div class="product-actions">
                <button class="btn btn-secondary add-to-cart" onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
    
    
    return card;
}

function loadLocalSellers() {
    if (!localSellersDiv) {
        console.log('Local sellers div not found, skipping...');
        return;
    }
    
    localSellersDiv.innerHTML = '';
    
    sampleSellers.forEach(seller => {
        const sellerCard = createSellerCard(seller);
        localSellersDiv.appendChild(sellerCard);
    });
}

function createSellerCard(seller) {
    const card = document.createElement('div');
    card.className = 'seller-card';
    
    card.innerHTML = `
        <div class="seller-avatar">
            <span style="font-size: 2rem;">${seller.avatar}</span>
        </div>
        <h3 class="seller-name">${seller.name}</h3>
        <div class="seller-category">${seller.category}</div>
        <div class="seller-rating">
            <div class="stars">${'★'.repeat(Math.floor(seller.rating))}${'☆'.repeat(5 - Math.floor(seller.rating))}</div>
            <span class="rating-text">${seller.rating}</span>
        </div>
        <button class="view-store" onclick="viewStore(${seller.id})">
            View Store
        </button>
    `;
    
    return card;
}

function loadRecentLocations() {
    if (!recentLocationsDiv) {
        console.log('Recent locations div not found, skipping...');
        return;
    }
    
    recentLocationsDiv.innerHTML = '';
    
    recentLocations.forEach(location => {
        const locationItem = document.createElement('div');
        locationItem.className = 'location-item';
        locationItem.textContent = location;
        locationItem.addEventListener('click', function() {
            setLocation(location);
            closeLocationModalFunction();
        });
        recentLocationsDiv.appendChild(locationItem);
    });
}

function addToCart(productId) {
    const product = sampleProducts.find(p => p.id === productId);
    if (product) {
        const existingItem = cartItems.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
        cartItems.push({
            ...product,
            quantity: 1
            // Don't override available_on_cod - use original value from product
        });
        
        console.log('Added to cart:', cartItems[cartItems.length - 1]);
        console.log('Available on COD:', cartItems[cartItems.length - 1].available_on_cod);
        }
        
        updateCartCount();
        saveCart();
        
        // Show success message
        showNotification(`${product.name} added to cart!`);
    }
}

function updateCartCount() {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    
    // Debug: Log cart items to console
    console.log('Cart items:', cartItems);
    console.log('Total items:', totalItems);
}

function saveCart() {
    localStorage.setItem('ondcCart', JSON.stringify(cartItems));
}

function viewStore(sellerId) {
    const seller = sampleSellers.find(s => s.id === sellerId);
    if (seller) {
        alert(`Opening ${seller.name} store...\n\nThis would show all products from this seller in the ONDC network!`);
    }
}

function openLocationModal() {
    locationModal.classList.add('show');
    locationSearch.focus();
}

function closeLocationModalFunction() {
    locationModal.classList.remove('show');
}

function searchLocation() {
    const query = locationSearch.value.trim();
    
    if (query) {
        // Simulate location search
        const mockLocations = [
            `${query}, Maharashtra`,
            `${query}, Delhi`,
            `${query}, Karnataka`,
            `${query}, Tamil Nadu`
        ];
        
        // For demo, just set the first result
        setLocation(mockLocations[0]);
        closeLocationModalFunction();
        
        showNotification(`Location updated to ${mockLocations[0]}`);
    }
}

function setLocation(location) {
    currentLocation = location;
    currentLocationSpan.textContent = location;
    localStorage.setItem('ondcLocation', location);
    
    // Add to recent locations if not already there
    if (!recentLocations.includes(location)) {
        recentLocations.unshift(location);
        recentLocations = recentLocations.slice(0, 5); // Keep only 5 recent locations
        loadRecentLocations();
    }
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Focus search input with Ctrl+K or Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Close modal with Escape
    if (e.key === 'Escape') {
        closeLocationModal();
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading states for better UX
function showLoading(element) {
    element.style.opacity = '0.6';
    element.style.pointerEvents = 'none';
}

function hideLoading(element) {
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.category-card, .product-card, .seller-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// ONDC API Functions
async function callONDCSearchAPI(searchTerm) {
    // Generate or reuse transaction ID (same for entire order flow)
    if (!currentTransactionId) {
        currentTransactionId = generateUUID();
        console.log('Generated new transaction ID:', currentTransactionId);
        // Store in localStorage for use across pages
        localStorage.setItem('currentTransactionId', currentTransactionId);
    }
    
    // Generate unique message ID and timestamp for this specific API call
    const messageId = generateUUID();
    const timestamp = new Date().toISOString();
    
    // Get current location coordinates (default to Delhi for demo)
    const location = getCurrentLocationCoordinates();
    
    // Prepare the request body according to ONDC specification
    const requestBody = {
        "context": {
            "domain": "ONDC:RET10",
            "country": "IND",
            "city": "std:011",
            "action": "search",
            "core_version": "1.2.0",
            "bap_id": BAP_ID,
            "bap_uri": BAP_URI,
            "transaction_id": currentTransactionId,
            "message_id": messageId,
            "timestamp": timestamp,
            "ttl": "PT30S"
        },
        "message": {
            "intent": {
                "item": {
                    "descriptor": {
                        "name": searchTerm
                    }
                },
                "fulfillment": {
                    "type": "Delivery",
                    "end": {
                        "location": {
                            "gps": location.gps,
                            "address": {
                                "area_code": location.areaCode
                            }
                        }
                    }
                },
                "payment": {
                    "@ondc/org/buyer_app_finder_fee_type": "percent",
                    "@ondc/org/buyer_app_finder_fee_amount": "3"
                },
                "tags": [
                    {
                        "code": "bap_terms",
                        "list": [
                            {
                                "code": "static_terms",
                                "value": ""
                            },
                            {
                                "code": "static_terms_new",
                                "value": "https://github.com/ONDC-Official/NP-Static-Terms/buyerNP_BNP/1.0/tc.pdf"
                            },
                            {
                                "code": "effective_date",
                                "value": "2023-10-01T00:00:00.000Z"
                            }
                        ]
                    }
                ]
            }
        }
    };
    
    try {
        console.log('Making ONDC API call with request:', requestBody);
        
        const response = await fetch(ONDC_SEARCH_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('ONDC API response:', data);
        console.log('Search term sent:', searchTerm);
        
        return data;
        
    } catch (error) {
        console.error('ONDC API call failed:', error);
        throw error;
    }
}

// Function to fetch search results from the results API
async function fetchSearchResults(transactionId) {
    if (!transactionId) {
        throw new Error('No transaction ID available');
    }
    
    const resultsUrl = `${ONDC_RESULTS_API_URL}/${transactionId}`;
    
    try {
        console.log('Fetching results from:', resultsUrl);
        
        const response = await fetch(resultsUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Results API response:', data);
        
        return data;
        
    } catch (error) {
        console.error('Results API call failed:', error);
        throw error;
    }
}

// Function to fetch search results with retry mechanism
async function fetchSearchResultsWithRetry(transactionId, maxRetries = 3, delay = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt} to fetch results for transaction: ${transactionId}`);
            const results = await fetchSearchResults(transactionId);
            
            // Check if results are meaningful (not empty or error)
            console.log('Checking results structure:', results);
            if (results && (results.products || results.items || results.data || results.message || Object.keys(results).length > 0)) {
                console.log('Results look meaningful, returning:', results);
                return results;
            }
            
            // If results are empty, wait and retry
            if (attempt < maxRetries) {
                console.log(`Results not ready yet, waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            
        } catch (error) {
            console.log(`Attempt ${attempt} failed:`, error.message);
            
            if (attempt < maxRetries) {
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    
    // If all retries failed, return empty results
    return { products: [], items: [], data: [] };
}

function displaySearchResults(results, searchTerm) {
    // Store search results globally for cart functionality
    window.searchResults = results;
    console.log('Stored search results globally:', window.searchResults);
    
    // Create a results section if it doesn't exist
    let resultsSection = document.getElementById('searchResults');
    if (!resultsSection) {
        resultsSection = document.createElement('section');
        resultsSection.id = 'searchResults';
        resultsSection.className = 'search-results-section';
        resultsSection.innerHTML = `
            <div class="container">
                <h2 class="section-title">Search Results for "${searchTerm}"</h2>
                <div class="results-grid" id="resultsGrid"></div>
            </div>
        `;
        
        // Insert after the hero section
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.insertAdjacentElement('afterend', resultsSection);
        } else {
            console.log('Hero section not found, appending to body');
            document.body.appendChild(resultsSection);
        }
    } else {
        // Update existing results
        if (resultsSection) {
            const titleElement = resultsSection.querySelector('.section-title');
            if (titleElement) {
                titleElement.textContent = `Search Results for "${searchTerm}"`;
            }
        }
    }
    
    const resultsGrid = document.getElementById('resultsGrid');
    if (!resultsGrid) {
        console.log('Results grid not found, skipping...');
        return;
    }
    resultsGrid.innerHTML = '';
    
    // Process ONDC response and display results
    console.log('Processing results for search term:', searchTerm);
    console.log('Full results object:', results);
    
    // Check for different possible response formats
    let hasResults = false;
    
    console.log('Analyzing results structure...');
    console.log('Results type:', typeof results);
    console.log('Results keys:', results ? Object.keys(results) : 'null');
    
    // Format 1: Direct products array
    if (results && results.products && Array.isArray(results.products) && results.products.length > 0) {
        console.log('Found products in results.products:', results.products);
        results.products.forEach(product => {
            const productCard = createProductCardFromResultsAPI(product);
            resultsGrid.appendChild(productCard);
        });
        hasResults = true;
    }
    // Format 2: Items array
    else if (results && results.items && Array.isArray(results.items) && results.items.length > 0) {
        console.log('Found items in results.items:', results.items);
        results.items.forEach(item => {
            const productCard = createProductCardFromResultsAPI(item);
            resultsGrid.appendChild(productCard);
        });
        hasResults = true;
    }
    // Format 3: Data array
    else if (results && results.data && Array.isArray(results.data) && results.data.length > 0) {
        console.log('Found data in results.data:', results.data);
        results.data.forEach(item => {
            const productCard = createProductCardFromResultsAPI(item);
            resultsGrid.appendChild(productCard);
        });
        hasResults = true;
    }
    // Format 4: Direct array response
    else if (results && Array.isArray(results) && results.length > 0) {
        console.log('Found direct array response:', results);
        results.forEach(item => {
            const productCard = createProductCardFromResultsAPI(item);
            resultsGrid.appendChild(productCard);
        });
        hasResults = true;
    }
    // Format 5: ONDC catalog format (original)
    else if (results && results.message && results.message.catalog) {
        const catalog = results.message.catalog;
        console.log('Found ONDC catalog format:', catalog);
        
        if (catalog['bpp/providers'] && catalog['bpp/providers'].length > 0) {
            catalog['bpp/providers'].forEach(provider => {
                console.log('Provider:', provider);
                if (provider.items && provider.items.length > 0) {
                    provider.items.forEach(item => {
                        console.log('Item:', item);
                        const productCard = createProductCardFromONDC(item, provider);
                        resultsGrid.appendChild(productCard);
                    });
                    hasResults = true;
                }
            });
        }
    }
    // Format 6: Results array with seller and items structure
    else if (results && results.results && Array.isArray(results.results) && results.results.length > 0) {
        console.log('Found results array with seller/items structure:', results.results);
        results.results.forEach(result => {
            if (result.items && Array.isArray(result.items) && result.items.length > 0) {
                result.items.forEach(item => {
                    const productCard = createProductCardFromSellerItems(item, result.seller);
                    resultsGrid.appendChild(productCard);
                });
                hasResults = true;
            }
        });
    }
    // Format 7: Check for any array-like structure in the response
    else if (results && typeof results === 'object') {
        console.log('Checking for array-like structures in response...');
        for (const [key, value] of Object.entries(results)) {
            if (Array.isArray(value) && value.length > 0) {
                console.log(`Found array in results.${key}:`, value);
                value.forEach(item => {
                    const productCard = createProductCardFromResultsAPI(item);
                    resultsGrid.appendChild(productCard);
                });
                hasResults = true;
                break;
            }
        }
    }
    
    if (!hasResults) {
        // Show no results message with debug info
        console.log('No products found, showing debug info');
        resultsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                <h3>No products found for "${searchTerm}"</h3>
                <p>Try searching with different keywords or browse our categories.</p>
                <details style="margin-top: 1rem; text-align: left;">
                    <summary style="cursor: pointer; color: #2563eb;">Debug: Raw API Response</summary>
                    <pre style="background: #f1f5f9; padding: 1rem; border-radius: 8px; margin-top: 0.5rem; font-size: 0.8rem; overflow-x: auto;">${JSON.stringify(results, null, 2)}</pre>
                </details>
            </div>
        `;
    }
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function createProductCardFromONDC(item, provider) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Extract product information from ONDC response
    const productName = item.descriptor?.name || 'Product';
    const productPrice = item.price?.value || 'Price not available';
    const productImage = item.descriptor?.images?.[0] || '📦';
    const sellerName = provider.descriptor?.name || 'Seller';
    const productRating = item.rating || 4.0;
    
    card.innerHTML = `
        <div class="product-image">
            <span style="font-size: 3rem;">${productImage}</span>
        </div>
        <div class="product-info">
            <h3 class="product-name">${productName}</h3>
            <div class="product-price">₹${productPrice}</div>
            <div class="product-seller">by ${sellerName}</div>
            <div class="product-rating">
                <div class="stars">${'★'.repeat(Math.floor(productRating))}${'☆'.repeat(5 - Math.floor(productRating))}</div>
                <span class="rating-text">${productRating}</span>
            </div>
            <div class="product-actions">
                <button class="btn btn-secondary add-to-cart" onclick="addToCartFromONDC('${item.id}', '${productName}', '${productPrice}', '${sellerName}')">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
    
    
    return card;
}

function createProductCardFromResultsAPI(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Extract product information from Results API response
    const productName = product.name || product.title || product.product_name || 'Product';
    const productPrice = product.price || product.cost || product.amount || 'Price not available';
    const productImage = product.image || product.image_url || product.thumbnail || '📦';
    const sellerName = product.seller || product.vendor || product.provider || 'Seller';
    const productRating = product.rating || product.stars || 4.0;
    const productId = product.id || product.product_id || Date.now().toString();
    
    // Extract new features from API response - more robust checking
    const isReturnable = product.is_returnable === 1 || product.is_returnable === true;
    const isCancellable = product.is_cancellable === 1 || product.is_cancellable === true;
    const availableOnCOD = product.available_on_cod === 1 || product.available_on_cod === true;
    const returnWindow = product.return_window || 'PT1H';
    const timeToShip = product.time_to_ship || 'PT45M';
    
    console.log('Results API product card created with ID:', productId, 'for product:', product);
    console.log('Product features:', { isReturnable, isCancellable, availableOnCOD });
    console.log('Raw feature values:', {
        is_returnable: product.is_returnable,
        is_cancellable: product.is_cancellable,
        available_on_cod: product.available_on_cod
    });
    
    // Create feature badges
    let featureBadges = '';
    if (isReturnable) {
        featureBadges += '<span class="feature-badge returnable"><i class="fas fa-undo"></i> Returnable</span>';
    }
    if (isCancellable) {
        featureBadges += '<span class="feature-badge cancellable"><i class="fas fa-ban"></i> Can Cancel</span>';
    }
    if (availableOnCOD) {
        featureBadges += '<span class="feature-badge cod"><i class="fas fa-money-bill-wave"></i> COD Available</span>';
    }
    
    // If no features are detected, show a message
    if (!featureBadges) {
        console.log('No features detected for product:', productName);
        featureBadges = '<span class="feature-badge" style="background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db;"><i class="fas fa-info-circle"></i> Check seller for details</span>';
    }
    
    card.innerHTML = `
        <div class="product-image">
            <span style="font-size: 3rem;">${productImage}</span>
        </div>
        <div class="product-info">
            <h3 class="product-name">${productName}</h3>
            <div class="product-price">₹${productPrice}</div>
            <div class="product-seller">by ${sellerName}</div>
            <div class="product-rating">
                <div class="stars">${'★'.repeat(Math.floor(productRating))}${'☆'.repeat(5 - Math.floor(productRating))}</div>
                <span class="rating-text">${productRating}</span>
            </div>
            <div class="product-features">
                ${featureBadges}
            </div>
            <div class="product-details">
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>Delivery: ${timeToShip}</span>
                </div>
                ${isReturnable ? `<div class="detail-item">
                    <i class="fas fa-undo"></i>
                    <span>Return within: ${returnWindow}</span>
                </div>` : ''}
            </div>
            <div class="product-actions">
                <button class="btn btn-secondary add-to-cart" onclick="addToCartFromResultsAPI('${productId}', '${productName}', '${productPrice}', '${sellerName}')">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
    
    
    return card;
}

function createProductCardFromSellerItems(item, seller) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Extract product information from the seller/items response format
    const productName = item.name || 'Product';
    const productPrice = item.price || 'Price not available';
    const productDescription = item.description || '';
    const productCategory = item.category || '';
    const sellerName = seller.name || 'Seller';
    const sellerLocation = seller.location || '';
    const productId = item.item_id || item.id || Date.now().toString();
    
    // Extract new features from API response - more robust checking
    const isReturnable = item.is_returnable === 1 || item.is_returnable === true;
    const isCancellable = item.is_cancellable === 1 || item.is_cancellable === true;
    const availableOnCOD = item.available_on_cod === 1 || item.available_on_cod === true;
    const returnWindow = item.return_window || 'PT1H';
    const timeToShip = item.time_to_ship || 'PT45M';
    
    console.log('Product card created with ID:', productId, 'for item:', item);
    console.log('Product features:', { isReturnable, isCancellable, availableOnCOD });
    console.log('Raw feature values:', {
        is_returnable: item.is_returnable,
        is_cancellable: item.is_cancellable,
        available_on_cod: item.available_on_cod
    });
    
    // Choose appropriate emoji based on category
    let productImage = '📦'; // default
    if (productCategory.toLowerCase().includes('atta') || productCategory.toLowerCase().includes('flour')) {
        productImage = '🌾';
    } else if (productCategory.toLowerCase().includes('dal') || productCategory.toLowerCase().includes('pulse')) {
        productImage = '🫘';
    } else if (productCategory.toLowerCase().includes('rice')) {
        productImage = '🍚';
    } else if (productCategory.toLowerCase().includes('spice')) {
        productImage = '🌶️';
    }
    
    // Create feature badges
    let featureBadges = '';
    if (isReturnable) {
        featureBadges += '<span class="feature-badge returnable"><i class="fas fa-undo"></i> Returnable</span>';
    }
    if (isCancellable) {
        featureBadges += '<span class="feature-badge cancellable"><i class="fas fa-ban"></i> Can Cancel</span>';
    }
    if (availableOnCOD) {
        featureBadges += '<span class="feature-badge cod"><i class="fas fa-money-bill-wave"></i> COD Available</span>';
    }
    
    // If no features are detected, show a message
    if (!featureBadges) {
        console.log('No features detected for product:', productName);
        featureBadges = '<span class="feature-badge" style="background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db;"><i class="fas fa-info-circle"></i> Check seller for details</span>';
    }
    
    card.innerHTML = `
        <div class="product-image">
            <span style="font-size: 3rem;">${productImage}</span>
        </div>
        <div class="product-info">
            <h3 class="product-name">${productName}</h3>
            <div class="product-price">₹${productPrice}</div>
            <div class="product-seller">by ${sellerName} (${sellerLocation})</div>
            ${productCategory ? `<div class="product-category" style="font-size: 0.8rem; color: #64748b; margin: 0.25rem 0;">${productCategory}</div>` : ''}
            ${productDescription ? `<div class="product-description" style="font-size: 0.8rem; color: #64748b; margin: 0.5rem 0; line-height: 1.4;">${productDescription}</div>` : ''}
            <div class="product-rating">
                <div class="stars">★★★★☆</div>
                <span class="rating-text">4.0</span>
            </div>
            <div class="product-features">
                ${featureBadges}
            </div>
            <div class="product-details">
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>Delivery: ${timeToShip}</span>
                </div>
                ${isReturnable ? `<div class="detail-item">
                    <i class="fas fa-undo"></i>
                    <span>Return within: ${returnWindow}</span>
                </div>` : ''}
            </div>
            <div class="product-actions">
                <button class="btn btn-secondary add-to-cart" onclick="addToCartFromSellerItems('${productId}', '${productName}', '${productPrice}', '${sellerName}')">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
    
    
    return card;
}

function addToCartFromONDC(productId, productName, productPrice, sellerName) {
    const product = {
        id: productId,
        name: productName,
        price: `₹${productPrice}`,
        seller: sellerName,
        rating: 4.0,
        image: '📦',
        available_on_cod: true // Default to COD for ONDC products
    };
    
    const existingItem = cartItems.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({
            ...product,
            quantity: 1
        });
        
        console.log('Added ONDC item to cart:', cartItems[cartItems.length - 1]);
        console.log('Available on COD:', cartItems[cartItems.length - 1].available_on_cod);
    }
    
    updateCartCount();
    saveCart();
    showNotification(`${productName} added to cart!`);
}

function addToCartFromResultsAPI(productId, productName, productPrice, sellerName) {
    // Find the original product data to get real COD availability
    let originalProduct = null;
    
    if (window.searchResults) {
        console.log('Search results structure:', window.searchResults);
        
        // Handle different possible structures
        let productsArray = [];
        if (Array.isArray(window.searchResults)) {
            productsArray = window.searchResults;
        } else if (window.searchResults.results && Array.isArray(window.searchResults.results)) {
            // Extract all items from all sellers
            productsArray = [];
            window.searchResults.results.forEach(seller => {
                if (seller.items && Array.isArray(seller.items)) {
                    productsArray = productsArray.concat(seller.items);
                }
            });
        } else if (window.searchResults.products && Array.isArray(window.searchResults.products)) {
            productsArray = window.searchResults.products;
        } else if (window.searchResults.items && Array.isArray(window.searchResults.items)) {
            productsArray = window.searchResults.items;
        } else if (window.searchResults.data && Array.isArray(window.searchResults.data)) {
            productsArray = window.searchResults.data;
        }
        
        console.log('Products array for search:', productsArray);
        console.log('Looking for productId:', productId);
        
        // Try different ID fields to find the product
        originalProduct = productsArray.find(p => {
            console.log('Checking product:', p);
            console.log('Product ID fields:', {
                id: p.id,
                product_id: p.product_id,
                item_id: p.item_id,
                productId: p.productId
            });
            return (p.id === productId || 
                   p.product_id === productId || 
                   p.item_id === productId ||
                   p.productId === productId);
        });
        
        console.log('Found original product:', originalProduct);
    }
    
    const product = {
        id: productId,
        name: productName,
        price: `₹${productPrice}`,
        seller: sellerName,
        rating: 4.0,
        image: '📦',
        available_on_cod: originalProduct ? originalProduct.available_on_cod : false // Default to non-COD if not found
    };
    
    console.log('Adding to cart - Original product:', originalProduct);
    console.log('Adding to cart - Original available_on_cod:', originalProduct ? originalProduct.available_on_cod : 'not found');
    console.log('Adding to cart - Product COD availability:', product.available_on_cod);
    
    // Check for COD compatibility before adding
    const codCompatibility = checkCODCompatibility(product);
    if (!codCompatibility.isValid) {
        // Store product for potential clear cart and add
        window.currentProductToAdd = product;
        showCODCompatibilityError(codCompatibility.message, productName);
        return;
    }
    
    const existingItem = cartItems.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCartCount();
    saveCart();
    showNotification(`${productName} added to cart!`);
}

function addToCartFromSellerItems(productId, productName, productPrice, sellerName) {
    console.log('Adding to cart from seller items:', { productId, productName, productPrice, sellerName });
    
    // Find the original product data to get real COD availability
    let originalProduct = null;
    
    if (window.searchResults) {
        console.log('Search results structure for seller items:', window.searchResults);
        
        // Handle different possible structures
        let productsArray = [];
        if (Array.isArray(window.searchResults)) {
            productsArray = window.searchResults;
        } else if (window.searchResults.results && Array.isArray(window.searchResults.results)) {
            // Extract all items from all sellers
            productsArray = [];
            window.searchResults.results.forEach(seller => {
                if (seller.items && Array.isArray(seller.items)) {
                    productsArray = productsArray.concat(seller.items);
                }
            });
        } else if (window.searchResults.products && Array.isArray(window.searchResults.products)) {
            productsArray = window.searchResults.products;
        } else if (window.searchResults.items && Array.isArray(window.searchResults.items)) {
            productsArray = window.searchResults.items;
        } else if (window.searchResults.data && Array.isArray(window.searchResults.data)) {
            productsArray = window.searchResults.data;
        }
        
        console.log('Products array for seller search:', productsArray);
        console.log('Looking for productId:', productId);
        
        // Try different ID fields to find the product
        originalProduct = productsArray.find(p => {
            console.log('Checking product:', p);
            console.log('Product ID fields:', {
                id: p.id,
                product_id: p.product_id,
                item_id: p.item_id,
                productId: p.productId
            });
            return (p.id === productId || 
                   p.product_id === productId || 
                   p.item_id === productId ||
                   p.productId === productId);
        });
        
        console.log('Found original product:', originalProduct);
    }
    
    const product = {
        id: productId, // This should be the original item_id from search results
        name: productName,
        price: `₹${productPrice}`,
        seller: sellerName,
        rating: 4.0,
        image: '📦',
        available_on_cod: originalProduct ? originalProduct.available_on_cod : false // Default to non-COD if not found
    };
    
    console.log('Adding to cart from seller - Original product:', originalProduct);
    console.log('Adding to cart from seller - Original available_on_cod:', originalProduct ? originalProduct.available_on_cod : 'not found');
    console.log('Adding to cart from seller - Product COD availability:', product.available_on_cod);
    console.log('Product object created:', product);
    
    // Check for COD compatibility before adding
    const codCompatibility = checkCODCompatibility(product);
    if (!codCompatibility.isValid) {
        // Store product for potential clear cart and add
        window.currentProductToAdd = product;
        showCODCompatibilityError(codCompatibility.message, productName);
        return;
    }
    
    const existingItem = cartItems.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
        console.log('Updated existing item quantity:', existingItem);
    } else {
        cartItems.push({
            ...product,
            quantity: 1
        });
        console.log('Added new item to cart:', cartItems[cartItems.length - 1]);
    }
    
    updateCartCount();
    saveCart();
    showNotification(`${productName} added to cart!`);
}

// COD Compatibility Functions
function checkCODCompatibility(newProduct) {
    // If cart is empty, any product can be added
    if (cartItems.length === 0) {
        return { isValid: true };
    }
    
    // Check if cart already has mixed COD/non-COD items
    const codItems = cartItems.filter(item => item.available_on_cod === true || item.available_on_cod === 1);
    const nonCODItems = cartItems.filter(item => item.available_on_cod === false || item.available_on_cod === 0);
    
    // If cart has both COD and non-COD items, it's already mixed
    if (codItems.length > 0 && nonCODItems.length > 0) {
        return {
            isValid: false,
            message: "Your cart already contains both COD and non-COD items. Please clear your cart and add items with the same payment method."
        };
    }
    
    // If cart has only COD items and new product is non-COD
    if (codItems.length > 0 && (newProduct.available_on_cod === false || newProduct.available_on_cod === 0)) {
        return {
            isValid: false,
            message: "This item is not available for Cash on Delivery. Your cart contains COD items only."
        };
    }
    
    // If cart has only non-COD items and new product is COD
    if (nonCODItems.length > 0 && (newProduct.available_on_cod === true || newProduct.available_on_cod === 1)) {
        return {
            isValid: false,
            message: "This item is available for Cash on Delivery, but your cart contains non-COD items only."
        };
    }
    
    return { isValid: true };
}

function showCODCompatibilityError(message, productName) {
    // Create error modal
    const errorModal = document.createElement('div');
    errorModal.className = 'cod-compatibility-modal';
    errorModal.innerHTML = `
        <div class="cod-compatibility-content">
            <div class="cod-compatibility-header">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Payment Method Conflict</h3>
            </div>
            <div class="cod-compatibility-body">
                <p><strong>Cannot add "${productName}" to cart</strong></p>
                <p>${message}</p>
                <div class="cod-compatibility-options">
                    <p>You can:</p>
                    <ul>
                        <li>Clear your cart and add items with the same payment method</li>
                        <li>Continue shopping for items with the same payment method</li>
                    </ul>
                </div>
            </div>
            <div class="cod-compatibility-actions">
                <button class="btn btn-primary" onclick="clearCartAndAdd()">Clear Cart & Add Item</button>
                <button class="btn btn-secondary" onclick="closeCODCompatibilityError()">Cancel</button>
            </div>
        </div>
    `;
    
    // Add styles
    errorModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    document.body.appendChild(errorModal);
}

function clearCartAndAdd() {
    // Store the current product that user wants to add
    const currentProduct = window.currentProductToAdd;
    
    // Clear the cart
    cartItems = [];
    updateCartCount();
    saveCart();
    
    // Add the product
    if (currentProduct) {
        cartItems.push({
            ...currentProduct,
            quantity: 1
        });
        updateCartCount();
        saveCart();
        showNotification(`${currentProduct.name} added to cart!`);
    }
    
    closeCODCompatibilityError();
}

function closeCODCompatibilityError() {
    const errorModal = document.querySelector('.cod-compatibility-modal');
    if (errorModal) {
        document.body.removeChild(errorModal);
    }
}

// Utility functions
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getCurrentLocationCoordinates() {
    // Default to Delhi coordinates, in real app this would come from user's location
    return {
        gps: "28.6139,77.2090",
        areaCode: "110037"
    };
}

// ONDC Order Flow Functions
async function callONDCSelectAPI(selectedItems) {
    // Reuse the same transaction ID, generate new message ID and timestamp
    const messageId = generateUUID();
    const timestamp = new Date().toISOString();
    
    const requestBody = {
        "context": {
            "domain": "ONDC:RET10",
            "country": "IND",
            "city": "std:011",
            "action": "select",
            "core_version": "1.2.0",
            "bap_id": BAP_ID,
            "bap_uri": BAP_URI,
            "transaction_id": currentTransactionId, // Same transaction ID
            "message_id": messageId, // New message ID
            "timestamp": timestamp, // New timestamp
            "ttl": "PT30S"
        },
        "message": {
            "order": {
                "items": selectedItems,
                "fulfillment": {
                    "type": "Delivery",
                    "end": {
                        "location": {
                            "gps": getCurrentLocationCoordinates().gps,
                            "address": {
                                "area_code": getCurrentLocationCoordinates().areaCode
                            }
                        }
                    }
                }
            }
        }
    };
    
    try {
        console.log('Making ONDC Select API call:', requestBody);
        // API call implementation would go here
        return requestBody;
    } catch (error) {
        console.error('ONDC Select API call failed:', error);
        throw error;
    }
}

async function callONDCInitAPI(orderDetails) {
    // Reuse the same transaction ID, generate new message ID and timestamp
    const messageId = generateUUID();
    const timestamp = new Date().toISOString();
    
    const requestBody = {
        "context": {
            "domain": "ONDC:RET10",
            "country": "IND",
            "city": "std:011",
            "action": "init",
            "core_version": "1.2.0",
            "bap_id": BAP_ID,
            "bap_uri": BAP_URI,
            "transaction_id": currentTransactionId, // Same transaction ID
            "message_id": messageId, // New message ID
            "timestamp": timestamp, // New timestamp
            "ttl": "PT30S"
        },
        "message": {
            "order": orderDetails
        }
    };
    
    try {
        console.log('Making ONDC Init API call:', requestBody);
        // API call implementation would go here
        return requestBody;
    } catch (error) {
        console.error('ONDC Init API call failed:', error);
        throw error;
    }
}

async function callONDCConfirmAPI(confirmDetails) {
    // Reuse the same transaction ID, generate new message ID and timestamp
    const messageId = generateUUID();
    const timestamp = new Date().toISOString();
    
    const requestBody = {
        "context": {
            "domain": "ONDC:RET10",
            "country": "IND",
            "city": "std:011",
            "action": "confirm",
            "core_version": "1.2.0",
            "bap_id": BAP_ID,
            "bap_uri": BAP_URI,
            "transaction_id": currentTransactionId, // Same transaction ID
            "message_id": messageId, // New message ID
            "timestamp": timestamp, // New timestamp
            "ttl": "PT30S"
        },
        "message": {
            "order": confirmDetails
        }
    };
    
    try {
        console.log('Making ONDC Confirm API call:', requestBody);
        // API call implementation would go here
        return requestBody;
    } catch (error) {
        console.error('ONDC Confirm API call failed:', error);
        throw error;
    }
}

// Function to start a new transaction (call this when starting a new order flow)
function startNewTransaction() {
    currentTransactionId = generateUUID();
    console.log('Started new transaction with ID:', currentTransactionId);
}

// Function to get current transaction ID (useful for debugging)
function getCurrentTransactionId() {
    return currentTransactionId;
}

// ONDC Select Event Functions
/**
 * Generate a unique message ID for each select event
 */
function generateMessageId() {
    return generateUUID();
}

/**
 * Generate current timestamp in ISO format
 */
function generateTimestamp() {
    return new Date().toISOString();
}

/**
 * Create the ONDC select event payload using the exact structure provided
 */
function createSelectPayload(product, sellerInfo = null) {
    if (!currentTransactionId) {
        throw new Error('Transaction ID not set. Please perform a search first.');
    }

    const messageId = generateMessageId();
    const timestamp = generateTimestamp();

    const payload = {
        context: {
            domain: "ONDC:RET10",
            country: "IND",
            city: "std:011",
            action: "select",
            core_version: "1.2.0",
            bap_id: BAP_ID,
            bap_uri: BAP_URI,
            transaction_id: currentTransactionId,
            message_id: messageId,
            timestamp: timestamp,
            ttl: "PT30S",
            bpp_id: BPP_ID,
            bpp_uri: BPP_URI
        },
        message: {
            order: {
                provider: {
                    id: sellerInfo?.provider_id || "pramaan_provider_1",
                    locations: [
                        {
                            id: "SSL1"
                        }
                    ]
                },
                items: [
                    {
                        id: product.item_id || product.id,
                        quantity: {
                            count: 1
                        },
                        location_id: "SSL1"
                    }
                ],
                fulfillments: [
                    {
                        id: "F0",
                        type: "Delivery",
                        end: {
                            location: {
                                gps: "28.613900,77.209000",
                                address: {
                                    area_code: "110037"
                                }
                            }
                        }
                    }
                ],
                payment: {
                    "@ondc/org/buyer_app_finder_fee_type": "percent",
                    "@ondc/org/buyer_app_finder_fee_amount": "3"
                }
            }
        }
    };

    console.log('Created select payload:', payload);
    return payload;
}

/**
 * Send select event to seller API
 */
async function sendSelectEvent(payload) {
    try {
        console.log('Sending select event to:', ONDC_SELECT_API_URL);
        console.log('Select payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(ONDC_SELECT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Select event response:', result);
        return result;

    } catch (error) {
        console.error('Error sending select event:', error);
        throw error;
    }
}

/**
 * Handle product selection - main entry point
 */
async function handleProductSelect(product, sellerInfo = null) {
    try {
        // Create unique key for this item selection
        const itemKey = `${product.item_id || product.id}_${sellerInfo?.provider_id || 'default'}`;
        
        // Check if we've already sent select for this item
        if (selectedItems.has(itemKey)) {
            console.log('Select event already sent for this item:', itemKey);
            showNotification('Product already selected!', 'info');
            return false;
        }

        // Validate required fields
        if (!product.item_id && !product.id) {
            throw new Error('Product must have item_id or id');
        }

        if (!currentTransactionId) {
            throw new Error('Transaction ID not set. Please perform a search first.');
        }

        // Create and send select payload
        const payload = createSelectPayload(product, sellerInfo);
        const response = await sendSelectEvent(payload);

        // Mark this item as selected to prevent duplicate events
        selectedItems.add(itemKey);
        console.log('Item marked as selected:', itemKey);

        // Show success notification
        showNotification(`${product.name} selected successfully!`, 'success');

        return true;

    } catch (error) {
        console.error('Error handling product select:', error);
        showNotification('Failed to select product. Please try again.', 'error');
        return false;
    }
}

/**
 * Clear selected items (useful for new search sessions)
 */
function clearSelectedItems() {
    selectedItems.clear();
    console.log('Selected items cleared');
}

/**
 * Check if an item has been selected
 */
function isItemSelected(productId, sellerId = null) {
    const itemKey = `${productId}_${sellerId || 'default'}`;
    return selectedItems.has(itemKey);
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: white;
                border-radius: 8px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                padding: 16px 20px;
                min-width: 300px;
                max-width: 400px;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s ease;
            }
            .notification.show {
                transform: translateX(0);
                opacity: 1;
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .notification-content i {
                font-size: 18px;
            }
            .notification-success {
                border-left: 4px solid #10b981;
            }
            .notification-success .notification-content i {
                color: #10b981;
            }
            .notification-error {
                border-left: 4px solid #ef4444;
            }
            .notification-error .notification-content i {
                color: #ef4444;
            }
            .notification-info {
                border-left: 4px solid #3b82f6;
            }
            .notification-info .notification-content i {
                color: #3b82f6;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Mock search results function for when API doesn't return proper data
function showMockSearchResults(searchTerm, resultsGrid) {
    if (!resultsGrid) {
        console.log('Results grid not provided to showMockSearchResults');
        return;
    }
    
    const mockResults = getMockResultsForSearchTerm(searchTerm);
    
    if (mockResults.length > 0) {
        mockResults.forEach(product => {
            const productCard = createMockProductCard(product);
            resultsGrid.appendChild(productCard);
        });
    } else {
        resultsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                <h3>No products found for "${searchTerm}"</h3>
                <p>Try searching with different keywords or browse our categories.</p>
            </div>
        `;
    }
}

function getMockResultsForSearchTerm(searchTerm) {
    const term = searchTerm.toLowerCase();
    
    // Define mock results based on search terms
    const mockData = {
        'coffee': [
            { name: 'Premium Coffee Beans', price: '₹299', seller: 'Coffee Corner', rating: 4.5, image: '☕' },
            { name: 'Instant Coffee Powder', price: '₹149', seller: 'Beverage Store', rating: 4.2, image: '☕' },
            { name: 'Coffee Maker', price: '₹1,299', seller: 'Kitchen Appliances', rating: 4.7, image: '☕' }
        ],
        'electronics': [
            { name: 'Smartphone', price: '₹15,999', seller: 'Tech Hub', rating: 4.8, image: '📱' },
            { name: 'Laptop', price: '₹45,999', seller: 'Computer World', rating: 4.6, image: '💻' },
            { name: 'Headphones', price: '₹1,299', seller: 'Audio Store', rating: 4.4, image: '🎧' }
        ],
        'groceries': [
            { name: 'Fresh Vegetables', price: '₹199', seller: 'Green Farm', rating: 4.3, image: '🥬' },
            { name: 'Rice Bag', price: '₹299', seller: 'Grain Store', rating: 4.5, image: '🍚' },
            { name: 'Cooking Oil', price: '₹149', seller: 'Kitchen Essentials', rating: 4.2, image: '🫒' }
        ],
        'fashion': [
            { name: 'Cotton T-Shirt', price: '₹599', seller: 'Fashion World', rating: 4.3, image: '👕' },
            { name: 'Jeans', price: '₹1,299', seller: 'Style Store', rating: 4.6, image: '👖' },
            { name: 'Sneakers', price: '₹2,499', seller: 'Footwear Hub', rating: 4.7, image: '👟' }
        ]
    };
    
    // Find matching results
    for (const [key, results] of Object.entries(mockData)) {
        if (term.includes(key) || key.includes(term)) {
            return results;
        }
    }
    
    // Default results if no specific match
    return [
        { name: `${searchTerm} - Product 1`, price: '₹299', seller: 'Local Store', rating: 4.0, image: '📦' },
        { name: `${searchTerm} - Product 2`, price: '₹499', seller: 'Online Shop', rating: 4.2, image: '📦' }
    ];
}

function createMockProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
        <div class="product-image">
            <span style="font-size: 3rem;">${product.image}</span>
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">${product.price}</div>
            <div class="product-seller">by ${product.seller}</div>
            <div class="product-rating">
                <div class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}</div>
                <span class="rating-text">${product.rating}</span>
            </div>
            <button class="add-to-cart" onclick="addToCartFromMock('${product.name}', '${product.price}', '${product.seller}')">
                Add to Cart
            </button>
        </div>
    `;
    
    return card;
}

function addToCartFromMock(productName, productPrice, sellerName) {
    const product = {
        id: 'mock-' + Date.now(),
        name: productName,
        price: productPrice,
        seller: sellerName,
        rating: 4.0,
        image: '📦',
        available_on_cod: false // Default to non-COD for mock products to test mixed payment
    };
    
    const existingItem = cartItems.find(item => item.name === productName);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCartCount();
    saveCart();
    showNotification(`${productName} added to cart!`);
}

// Test function to add mixed COD items to cart
function testMixedPaymentFromMainPage() {
    console.log('🧪 Testing mixed payment from main page...');
    
    // Clear cart first
    cartItems = [];
    saveCart();
    
    // Add a COD item (sample product)
    console.log('Adding COD item...');
    addToCart(1); // Organic Fresh Vegetables (COD)
    
    // Add a non-COD item (sample product)
    console.log('Adding non-COD item...');
    addToCart(2); // Wireless Bluetooth Headphones (non-COD)
    
    console.log('Cart after adding mixed items:', cartItems);
    cartItems.forEach((item, index) => {
        console.log(`Item ${index}: ${item.name}, COD: ${item.available_on_cod}`);
    });
    
    // Navigate to cart page to test validation
    console.log('Navigate to cart page to test validation...');
    window.location.href = 'cart.html';
}

// Make test function globally available
window.testMixedPaymentFromMainPage = testMixedPaymentFromMainPage;

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment when you have a service worker file
        // navigator.serviceWorker.register('/sw.js');
    });
}
