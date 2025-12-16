/* ===================================
   Restaurant Page JavaScript
   =================================== */

// Global State
let menu = [];
let cart = [];
let currentCategory = 'all';

// ===================================
// Initialization
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    loadCartFromStorage();
    updateCartUI();
});

// ===================================
// Menu Functions
// ===================================
async function loadMenu() {
    const grid = document.getElementById('menuGrid');
    
    try {
        const response = await fetch('/api/menu');
        if (!response.ok) throw new Error('Failed to fetch menu');
        
        menu = await response.json();
        renderMenu(menu);
    } catch (error) {
        console.error('Error loading menu:', error);
        grid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load menu</p>
            </div>
        `;
    }
}

function renderMenu(items) {
    const grid = document.getElementById('menuGrid');
    
    if (items.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No items found</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = items.map(item => `
        <div class="menu-item" data-id="${item._id}">
            <div class="item-image">
                <img src="${item.image || 'images/menu-placeholder.png'}" alt="${escapeHtml(item.name)}" loading="lazy">
                <span class="item-badge ${item.isVegetarian ? 'veg' : 'non-veg'}">
                    ${item.isVegetarian ? 'VEG' : 'NON-VEG'}
                </span>
                ${!item.isAvailable ? '<span class="item-badge unavailable">Sold Out</span>' : ''}
            </div>
            <div class="item-content">
                <h3 class="item-name">${escapeHtml(item.name)}</h3>
                <p class="item-description">${escapeHtml(item.description || '')}</p>
                <div class="item-footer">
                    <span class="item-price">₹${item.price}</span>
                    <button 
                        class="add-btn" 
                        onclick="addToCart('${item._id}')"
                        ${!item.isAvailable ? 'disabled' : ''}
                    >
                        <i class="fas fa-plus"></i>
                        ${item.isAvailable ? 'Add' : 'Unavailable'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ===================================
// Filter & Search
// ===================================
function filterByCategory(category, btn) {
    currentCategory = category;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Clear search
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearch').classList.remove('visible');
    
    // Filter menu
    if (category === 'all') {
        renderMenu(menu);
    } else {
        const filtered = menu.filter(item => item.category === category);
        renderMenu(filtered);
    }
}

function handleSearch(query) {
    const clearBtn = document.getElementById('clearSearch');
    
    if (query.trim()) {
        clearBtn.classList.add('visible');
    } else {
        clearBtn.classList.remove('visible');
    }
    
    // Reset category filter
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-category="all"]').classList.add('active');
    currentCategory = 'all';
    
    const term = query.toLowerCase().trim();
    
    if (!term) {
        renderMenu(menu);
        return;
    }
    
    const filtered = menu.filter(item => 
        item.name.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        item.category.toLowerCase().includes(term)
    );
    
    renderMenu(filtered);
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearch').classList.remove('visible');
    renderMenu(menu);
}

// ===================================
// Cart Functions
// ===================================
function addToCart(itemId) {
    const item = menu.find(i => i._id === itemId);
    if (!item || !item.isAvailable) return;
    
    const existing = cart.find(c => c.menuItemId === itemId);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            menuItemId: item._id,
            name: item.name,
            price: item.price,
            quantity: 1
        });
    }
    
    saveCartToStorage();
    updateCartUI();
    showToast(`Added ${item.name} to cart`);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCartToStorage();
    updateCartUI();
}

function updateQuantity(index, change) {
    cart[index].quantity += change;
    
    if (cart[index].quantity <= 0) {
        removeFromCart(index);
    } else {
        saveCartToStorage();
        updateCartUI();
    }
}

function updateCartUI() {
    const cartBody = document.getElementById('cartBody');
    const cartBadge = document.getElementById('cartBadge');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('totalAmount');
    const stickyBtn = document.getElementById('stickyCartBtn');
    const stickyCount = document.getElementById('stickyItemCount');
    const stickyTotal = document.getElementById('stickyCartTotal');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update badge
    cartBadge.textContent = totalItems;
    
    // Update sticky button
    if (totalItems > 0) {
        stickyBtn.classList.add('visible');
        stickyCount.textContent = `${totalItems} item${totalItems > 1 ? 's' : ''}`;
        stickyTotal.textContent = `₹${totalAmount}`;
    } else {
        stickyBtn.classList.remove('visible');
    }
    
    // Update totals
    subtotalEl.textContent = `₹${totalAmount}`;
    totalEl.textContent = `₹${totalAmount}`;
    
    // Render cart items
    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-basket"></i>
                <p>Your cart is empty</p>
                <span>Add some delicious items!</span>
            </div>
        `;
        return;
    }
    
    cartBody.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${escapeHtml(item.name)}</div>
                <div class="cart-item-price">₹${item.price * item.quantity}</div>
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="updateQuantity(${index}, -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${index}, 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            <button class="remove-item" onclick="removeFromCart(${index})">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join('');
}

function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('active');
    document.getElementById('cartOverlay').classList.toggle('active');
    document.body.style.overflow = document.getElementById('cartSidebar').classList.contains('active') ? 'hidden' : '';
}

// ===================================
// Checkout
// ===================================
async function placeOrder() {
    if (cart.length === 0) {
        showToast('Your cart is empty');
        return;
    }
    
    const name = document.getElementById('guestName').value.trim();
    const room = document.getElementById('roomNumber').value.trim();
    const notes = document.getElementById('specialNotes').value.trim();
    
    if (!name || !room) {
        showToast('Please enter your name and room number');
        return;
    }
    
    const totalAmount = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    const orderData = {
        items: cart,
        totalAmount,
        customerDetails: {
            name,
            roomNumber: room,
            notes
        }
    };
    
    const btn = document.getElementById('checkoutBtn');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';
    btn.disabled = true;
    
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
            showToast('Order placed successfully!');
            cart = [];
            saveCartToStorage();
            updateCartUI();
            toggleCart();
            
            // Clear form
            document.getElementById('guestName').value = '';
            document.getElementById('roomNumber').value = '';
            document.getElementById('specialNotes').value = '';
            
            // Start order tracking
            startOrderTracking();
        } else {
            showToast('Failed to place order. Please try again.');
        }
    } catch (error) {
        console.error('Order error:', error);
        showToast('Something went wrong. Please try again.');
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
}

// ===================================
// Storage
// ===================================
function saveCartToStorage() {
    localStorage.setItem('ortus_cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const saved = localStorage.getItem('ortus_cart');
    if (saved) {
        try {
            cart = JSON.parse(saved);
        } catch (e) {
            console.error('Error parsing cart', e);
            cart = [];
        }
    }
}

// ===================================
// Toast Notification
// ===================================
function showToast(message) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    
    msgEl.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===================================
// Utilities
// ===================================
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ===================================
// Order Status Tracking
// ===================================
let orderTrackingInterval = null;
const ORDER_DURATION = 20 * 60 * 1000; // 20 minutes in milliseconds
const STEP_MESSAGES = [
    "Order received! We're getting started.",
    "Chef is preparing your food with care.",
    "Your food is ready and looking delicious!",
    "On the way to your room!"
];

// Initialize order tracking on page load
document.addEventListener('DOMContentLoaded', () => {
    checkExistingOrder();
});

function checkExistingOrder() {
    const orderData = localStorage.getItem('ortus_active_order');
    if (orderData) {
        const order = JSON.parse(orderData);
        const elapsed = Date.now() - order.startTime;
        
        if (elapsed < ORDER_DURATION) {
            // Resume tracking
            resumeOrderTracking(order);
        } else {
            // Order completed, clear it
            localStorage.removeItem('ortus_active_order');
        }
    }
}

function startOrderTracking() {
    const orderData = {
        startTime: Date.now(),
        currentStep: 1
    };
    
    localStorage.setItem('ortus_active_order', JSON.stringify(orderData));
    
    // Show tracking button
    document.getElementById('orderStatusBtn').style.display = 'flex';
    
    // Reset all steps
    resetOrderSteps();
    updateOrderStep(1);
    
    // Start the timer
    startOrderTimer(orderData.startTime);
    
    // Auto-open the status modal
    setTimeout(() => {
        toggleOrderStatus();
    }, 500);
}

function resumeOrderTracking(orderData) {
    // Show tracking button
    document.getElementById('orderStatusBtn').style.display = 'flex';
    
    // Calculate current step based on elapsed time
    const elapsed = Date.now() - orderData.startTime;
    const stepDuration = ORDER_DURATION / 4;
    const currentStep = Math.min(4, Math.floor(elapsed / stepDuration) + 1);
    
    // Reset and update steps
    resetOrderSteps();
    for (let i = 1; i <= currentStep; i++) {
        updateOrderStep(i);
    }
    
    // Start the timer
    startOrderTimer(orderData.startTime);
}

function resetOrderSteps() {
    document.querySelectorAll('.status-step').forEach(step => {
        step.classList.remove('active', 'completed');
    });
}

function updateOrderStep(stepNumber) {
    const steps = document.querySelectorAll('.status-step');
    
    steps.forEach((step, index) => {
        const stepNum = index + 1;
        
        if (stepNum < stepNumber) {
            step.classList.remove('active');
            step.classList.add('completed');
        } else if (stepNum === stepNumber) {
            step.classList.add('active');
            step.classList.remove('completed');
        }
    });
    
    // Update message
    document.getElementById('statusMessage').textContent = STEP_MESSAGES[stepNumber - 1];
}

function startOrderTimer(startTime) {
    // Clear any existing interval
    if (orderTrackingInterval) {
        clearInterval(orderTrackingInterval);
    }
    
    orderTrackingInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, ORDER_DURATION - elapsed);
        
        // Update timer display
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        document.getElementById('estimatedTime').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update step based on time
        const stepDuration = ORDER_DURATION / 4;
        const currentStep = Math.min(4, Math.floor(elapsed / stepDuration) + 1);
        
        // Update steps UI
        resetOrderSteps();
        for (let i = 1; i <= currentStep; i++) {
            updateOrderStep(i);
        }
        
        // Check if order is complete
        if (remaining <= 0) {
            clearInterval(orderTrackingInterval);
            orderTrackingInterval = null;
            document.getElementById('statusMessage').textContent = "Your order has been delivered! Enjoy your meal!";
            document.getElementById('estimatedTime').textContent = "Done!";
            
            // Clear order data after a delay
            setTimeout(() => {
                localStorage.removeItem('ortus_active_order');
                document.getElementById('orderStatusBtn').style.display = 'none';
            }, 30000); // Hide after 30 seconds
        }
    }, 1000);
}

function toggleOrderStatus() {
    const modal = document.getElementById('orderStatusModal');
    const overlay = document.getElementById('orderStatusOverlay');
    
    modal.classList.toggle('active');
    overlay.classList.toggle('active');
}
