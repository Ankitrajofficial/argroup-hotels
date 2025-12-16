/* ===================================
   Admin Dashboard JavaScript - New Design
   =================================== */

// ===================================
// State Management
// ===================================
const state = {
    currentSection: 'dashboard',
    theme: localStorage.getItem('admin_theme') || 'dark',
    sidebarCollapsed: false,
    currentUser: null
};

// ===================================
// Initialization
// ===================================
document.addEventListener('DOMContentLoaded', async () => {
    // Apply saved theme
    applyTheme(state.theme);
    
    // Check admin access
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) return;
    
    // Initialize UI
    setupEventListeners();
    loadDashboard();
    
    // Load bookings by default
    loadBookings();
});

// ===================================
// Admin Access Check
// ===================================
async function checkAdminAccess() {
    try {
        const response = await fetch('/api/admin/check');
        const data = await response.json();
        
        if (!data.isAdmin) {
            showAccessDenied();
            return false;
        }
        
        state.currentUser = data.user;
        document.getElementById('adminName').textContent = data.user?.name || 'Admin';
        return true;
    } catch (error) {
        console.error('Access check failed:', error);
        showAccessDenied();
        return false;
    }
}

function showAccessDenied() {
    document.body.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: var(--bg-primary); color: var(--text-primary);">
            <i class="fas fa-lock" style="font-size: 4rem; color: var(--danger); margin-bottom: 1rem;"></i>
            <h1 style="margin-bottom: 0.5rem;">Access Denied</h1>
            <p style="color: var(--text-secondary);">You don't have permission to access this page.</p>
            <a href="../index.html" style="margin-top: 1rem; color: var(--accent-gold);">← Return to Homepage</a>
        </div>
    `;
}

// ===================================
// Theme Management
// ===================================
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('admin_theme', theme);
    state.theme = theme;
}

function toggleTheme() {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

// ===================================
// Sidebar Management
// ===================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
    state.sidebarCollapsed = sidebar.classList.contains('collapsed');
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// ===================================
// Section Navigation
// ===================================
function goToSection(sectionName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionName) {
            item.classList.add('active');
        }
    });
    
    // Update sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    state.currentSection = sectionName;
    
    // Load section data
    switch (sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'bookings':
            loadBookings();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'users':
            loadUsers();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'menu':
            loadMenuItems();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// ===================================
// Event Listeners
// ===================================
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    
    // Sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('mobileToggle')?.addEventListener('click', toggleMobileSidebar);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            goToSection(item.dataset.section);
        });
    });
    
    // User dropdown
    document.getElementById('userBtn')?.addEventListener('click', () => {
        document.getElementById('userDropdown').classList.toggle('active');
    });
    
    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
            document.getElementById('userDropdown')?.classList.remove('active');
        }
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    
    // Notifications
    document.getElementById('notificationBtn')?.addEventListener('click', toggleNotifications);
    
    // Filter tabs (bookings, orders, contacts)
    document.querySelectorAll('.filter-tabs').forEach(tabGroup => {
        tabGroup.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                tabGroup.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const status = tab.dataset.status;
                const section = state.currentSection;
                
                if (section === 'bookings') filterBookings(status);
                else if (section === 'orders') filterOrders(status);
                else if (section === 'contacts') filterContacts(status);
            });
        });
    });
    
    // Search inputs
    document.getElementById('bookingSearch')?.addEventListener('input', debounce(searchBookings, 300));
    document.getElementById('userSearch')?.addEventListener('input', debounce(searchUsers, 300));
    document.getElementById('menuSearch')?.addEventListener('input', debounce(searchMenu, 300));
    
    // Menu form
    document.getElementById('menuForm')?.addEventListener('submit', saveMenuItem);
    
    // Settings save
    document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);
}

// ===================================
// Dashboard
// ===================================
async function loadDashboard() {
    try {
        // Load stats
        const statsRes = await fetch('/api/admin/stats');
        const statsData = await statsRes.json();
        
        if (statsData.success) {
            document.getElementById('statUsers').textContent = statsData.stats.totalUsers || 0;
        }
        
        // Load booking counts
        const bookingsRes = await fetch('/api/bookings');
        const bookingsData = await bookingsRes.json();
        
        if (bookingsData.success) {
            const pending = bookingsData.bookings.filter(b => b.status === 'pending').length;
            document.getElementById('statBookings').textContent = pending;
            document.getElementById('bookingsBadge').textContent = pending;
        }
        
        // Load order counts
        const ordersRes = await fetch('/api/orders');
        const ordersData = await ordersRes.json();
        
        if (ordersData.success) {
            const pendingOrders = ordersData.orders.filter(o => o.status === 'Pending' || o.status === 'Preparing').length;
            document.getElementById('statOrders').textContent = pendingOrders;
            document.getElementById('ordersBadge').textContent = pendingOrders;
        }
        
        // Load contact counts
        const contactsRes = await fetch('/api/contact');
        const contactsData = await contactsRes.json();
        
        if (contactsData.success) {
            const pendingContacts = contactsData.contacts.filter(c => c.status === 'pending').length;
            document.getElementById('messagesBadge').textContent = pendingContacts;
        }
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// ===================================
// Bookings
// ===================================
let allBookings = [];

async function loadBookings() {
    const grid = document.getElementById('bookingsGrid');
    grid.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i><p>Loading bookings...</p></div>';
    
    try {
        const response = await fetch('/api/bookings');
        const data = await response.json();
        
        if (data.success) {
            allBookings = data.bookings;
            renderBookings(allBookings);
            updateBookingStats(allBookings);
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        grid.innerHTML = '<div class="loading-placeholder"><p>Failed to load bookings</p></div>';
    }
}

function renderBookings(bookings) {
    const grid = document.getElementById('bookingsGrid');
    
    if (bookings.length === 0) {
        grid.innerHTML = '<div class="loading-placeholder"><i class="fas fa-calendar-times"></i><p>No bookings found</p></div>';
        return;
    }
    
    grid.innerHTML = bookings.map(booking => `
        <div class="booking-card">
            <div class="booking-card-header">
                <div class="guest-info">
                    <div class="guest-avatar">${booking.guestName?.charAt(0) || 'G'}</div>
                    <div>
                        <div class="guest-name">${escapeHtml(booking.guestName)}</div>
                        <div class="guest-phone">${escapeHtml(booking.phone || '')}</div>
                    </div>
                </div>
                <span class="status-badge ${booking.status}">${booking.status}</span>
            </div>
            <div class="booking-card-body">
                <div class="booking-details">
                    <div class="detail-item">
                        <span class="detail-label">Room</span>
                        <span class="detail-value">${escapeHtml(booking.roomType || 'Standard')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Guests</span>
                        <span class="detail-value">${booking.guests || 1}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Check-in</span>
                        <span class="detail-value">${formatDate(booking.checkIn)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Check-out</span>
                        <span class="detail-value">${formatDate(booking.checkOut)}</span>
                    </div>
                </div>
                ${booking.specialRequests ? `
                    <div class="booking-notes">
                        <p>"${escapeHtml(booking.specialRequests)}"</p>
                    </div>
                ` : ''}
                <div class="booking-card-footer">
                    <button class="btn-action" onclick="viewBooking('${booking._id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${booking.status === 'pending' ? `
                        <button class="btn-action primary" onclick="updateBookingStatus('${booking._id}', 'confirmed')">
                            <i class="fas fa-check"></i> Confirm
                        </button>
                    ` : ''}
                    ${booking.status === 'confirmed' ? `
                        <button class="btn-action primary" onclick="updateBookingStatus('${booking._id}', 'checked-in')">
                            <i class="fas fa-door-open"></i> Check In
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function updateBookingStats(bookings) {
    const pending = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const checkedIn = bookings.filter(b => b.status === 'checked-in').length;
    
    document.getElementById('bookingPending').textContent = pending;
    document.getElementById('bookingConfirmed').textContent = confirmed;
    document.getElementById('bookingCheckedIn').textContent = checkedIn;
}

function filterBookings(status) {
    if (status === 'all') {
        renderBookings(allBookings);
    } else {
        const filtered = allBookings.filter(b => b.status === status);
        renderBookings(filtered);
    }
}

function searchBookings() {
    const query = document.getElementById('bookingSearch').value.toLowerCase();
    if (!query) {
        renderBookings(allBookings);
        return;
    }
    
    const filtered = allBookings.filter(b => 
        b.guestName?.toLowerCase().includes(query) ||
        b.phone?.includes(query) ||
        b.email?.toLowerCase().includes(query)
    );
    renderBookings(filtered);
}

async function updateBookingStatus(bookingId, status) {
    try {
        const response = await fetch(`/api/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            showToast('Booking updated successfully', 'success');
            loadBookings();
        } else {
            showToast('Failed to update booking', 'error');
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        showToast('Error updating booking', 'error');
    }
}

function viewBooking(bookingId) {
    const booking = allBookings.find(b => b._id === bookingId);
    if (!booking) return;
    
    const modal = document.getElementById('bookingModal');
    const body = document.getElementById('bookingModalBody');
    
    body.innerHTML = `
        <div class="booking-details" style="display: block;">
            <p><strong>Guest:</strong> ${escapeHtml(booking.guestName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(booking.email || 'N/A')}</p>
            <p><strong>Phone:</strong> ${escapeHtml(booking.phone || 'N/A')}</p>
            <p><strong>Room:</strong> ${escapeHtml(booking.roomType || 'Standard')}</p>
            <p><strong>Guests:</strong> ${booking.guests || 1}</p>
            <p><strong>Check-in:</strong> ${formatDate(booking.checkIn)}</p>
            <p><strong>Check-out:</strong> ${formatDate(booking.checkOut)}</p>
            <p><strong>Status:</strong> <span class="status-badge ${booking.status}">${booking.status}</span></p>
            ${booking.specialRequests ? `<p><strong>Notes:</strong> ${escapeHtml(booking.specialRequests)}</p>` : ''}
        </div>
    `;
    
    modal.classList.add('active');
}

function closeBookingModal() {
    document.getElementById('bookingModal').classList.remove('active');
}

// ===================================
// Food Orders
// ===================================
let allOrders = [];

async function loadOrders() {
    const grid = document.getElementById('ordersGrid');
    grid.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i><p>Loading orders...</p></div>';
    
    try {
        const response = await fetch('/api/orders');
        const data = await response.json();
        
        if (data.success) {
            allOrders = data.orders;
            renderOrders(allOrders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        grid.innerHTML = '<div class="loading-placeholder"><p>Failed to load orders</p></div>';
    }
}

function renderOrders(orders) {
    const grid = document.getElementById('ordersGrid');
    
    if (orders.length === 0) {
        grid.innerHTML = '<div class="loading-placeholder"><i class="fas fa-shopping-bag"></i><p>No orders found</p></div>';
        return;
    }
    
    grid.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">#${order._id.slice(-6).toUpperCase()}</span>
                <span class="order-time">${formatTime(order.createdAt)}</span>
            </div>
            <div class="order-guest">
                <i class="fas fa-user"></i>
                <span>${escapeHtml(order.customerDetails?.name || 'Guest')}</span>
                <span class="room-badge">Room ${order.customerDetails?.roomNumber || '?'}</span>
            </div>
            <div class="order-items">
                ${order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
            </div>
            <div class="order-total">₹${order.totalAmount}</div>
            <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
            <div class="order-actions">
                ${getOrderActionButton(order)}
            </div>
        </div>
    `).join('');
}

function getOrderActionButton(order) {
    switch (order.status) {
        case 'Pending':
            return `<button class="order-status-btn preparing" onclick="updateOrderStatus('${order._id}', 'Preparing')">Start Preparing</button>`;
        case 'Preparing':
            return `<button class="order-status-btn ready" onclick="updateOrderStatus('${order._id}', 'Ready')">Mark Ready</button>`;
        case 'Ready':
            return `<button class="order-status-btn delivered" onclick="updateOrderStatus('${order._id}', 'Delivered')">Mark Delivered</button>`;
        default:
            return `<span style="color: var(--text-muted);">Completed</span>`;
    }
}

function filterOrders(status) {
    if (status === 'all') {
        renderOrders(allOrders);
    } else {
        const filtered = allOrders.filter(o => o.status === status);
        renderOrders(filtered);
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            showToast('Order updated successfully', 'success');
            loadOrders();
        } else {
            showToast('Failed to update order', 'error');
        }
    } catch (error) {
        console.error('Error updating order:', error);
        showToast('Error updating order', 'error');
    }
}

// ===================================
// Users
// ===================================
let usersPage = 1;

async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    
    try {
        const response = await fetch(`/api/admin/users?page=${usersPage}`);
        const data = await response.json();
        
        if (data.success) {
            renderUsers(data.users);
            renderPagination(data.pagination, 'usersPagination', 'users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        tbody.innerHTML = '<tr><td colspan="6">Failed to load users</td></tr>';
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td>${escapeHtml(user.phone || 'N/A')}</td>
            <td>
                <select onchange="changeUserRole('${user._id}', this.value)" ${user.role === 'admin' ? 'disabled' : ''}>
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            </td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <button class="btn-action" onclick="deleteUser('${user._id}')" ${user.role === 'admin' ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function searchUsers() {
    // Implement search
    const query = document.getElementById('userSearch').value;
    loadUsers(query);
}

async function changeUserRole(userId, newRole) {
    try {
        const response = await fetch(`/api/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
        });
        
        if (response.ok) {
            showToast('User role updated', 'success');
        } else {
            showToast('Failed to update role', 'error');
            loadUsers();
        }
    } catch (error) {
        console.error('Error updating role:', error);
        showToast('Error updating role', 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('User deleted', 'success');
            loadUsers();
        } else {
            showToast('Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Error deleting user', 'error');
    }
}

// ===================================
// Contacts
// ===================================
let allContacts = [];

async function loadContacts() {
    const list = document.getElementById('contactsList');
    list.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i><p>Loading messages...</p></div>';
    
    try {
        const response = await fetch('/api/contact');
        const data = await response.json();
        
        if (data.success) {
            allContacts = data.contacts;
            renderContacts(allContacts);
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
        list.innerHTML = '<div class="loading-placeholder"><p>Failed to load messages</p></div>';
    }
}

function renderContacts(contacts) {
    const list = document.getElementById('contactsList');
    
    if (contacts.length === 0) {
        list.innerHTML = '<div class="loading-placeholder"><i class="fas fa-envelope-open"></i><p>No messages found</p></div>';
        return;
    }
    
    list.innerHTML = contacts.map(contact => `
        <div class="activity-item" onclick="viewContact('${contact._id}')">
            <div class="activity-icon ${contact.status}">
                <i class="fas fa-envelope"></i>
            </div>
            <div class="activity-content">
                <p><strong>${escapeHtml(contact.name)}</strong> - ${escapeHtml(contact.subject || 'No subject')}</p>
                <span class="activity-time">${formatDate(contact.createdAt)}</span>
            </div>
            <span class="status-badge ${contact.status}">${contact.status}</span>
        </div>
    `).join('');
}

function filterContacts(status) {
    if (status === 'all') {
        renderContacts(allContacts);
    } else {
        const filtered = allContacts.filter(c => c.status === status);
        renderContacts(filtered);
    }
}

function viewContact(contactId) {
    const contact = allContacts.find(c => c._id === contactId);
    if (!contact) return;
    
    const modal = document.getElementById('contactModal');
    const body = document.getElementById('contactModalBody');
    
    body.innerHTML = `
        <p><strong>From:</strong> ${escapeHtml(contact.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(contact.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(contact.phone || 'N/A')}</p>
        <p><strong>Subject:</strong> ${escapeHtml(contact.subject || 'N/A')}</p>
        <p><strong>Message:</strong></p>
        <p style="background: var(--bg-primary); padding: 1rem; border-radius: var(--radius-sm);">${escapeHtml(contact.message)}</p>
        <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
            <button class="btn-action" onclick="updateContactStatus('${contact._id}', 'in-progress')">Mark In Progress</button>
            <button class="btn-action primary" onclick="updateContactStatus('${contact._id}', 'resolved')">Mark Resolved</button>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeContactModal() {
    document.getElementById('contactModal').classList.remove('active');
}

async function updateContactStatus(contactId, status) {
    try {
        const response = await fetch(`/api/contact/${contactId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            showToast('Status updated', 'success');
            closeContactModal();
            loadContacts();
        }
    } catch (error) {
        console.error('Error updating contact:', error);
    }
}

// ===================================
// Menu Items
// ===================================
let allMenuItems = [];

async function loadMenuItems() {
    const tbody = document.getElementById('menuTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    
    try {
        const response = await fetch('/api/menu');
        const data = await response.json();
        
        allMenuItems = data;
        renderMenuItems(data);
    } catch (error) {
        console.error('Error loading menu:', error);
        tbody.innerHTML = '<tr><td colspan="6">Failed to load menu</td></tr>';
    }
}

function renderMenuItems(items) {
    const tbody = document.getElementById('menuTableBody');
    
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No menu items found</td></tr>';
        return;
    }
    
    tbody.innerHTML = items.map(item => `
        <tr>
            <td><img src="${item.image || '../images/menu-placeholder.png'}" alt="${escapeHtml(item.name)}" style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--radius-sm);"></td>
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.category)}</td>
            <td>₹${item.price}</td>
            <td><span class="status-badge ${item.isAvailable ? 'confirmed' : 'pending'}">${item.isAvailable ? 'Available' : 'Unavailable'}</span></td>
            <td>
                <button class="btn-action" onclick="editMenuItem('${item._id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-action" onclick="deleteMenuItem('${item._id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function searchMenu() {
    const query = document.getElementById('menuSearch').value.toLowerCase();
    if (!query) {
        renderMenuItems(allMenuItems);
        return;
    }
    
    const filtered = allMenuItems.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
    renderMenuItems(filtered);
}

function openMenuModal() {
    document.getElementById('menuForm').reset();
    document.getElementById('menuItemId').value = '';
    document.getElementById('menuModalTitle').textContent = 'Add Menu Item';
    document.getElementById('menuModal').classList.add('active');
}

function closeMenuModal() {
    document.getElementById('menuModal').classList.remove('active');
}

function editMenuItem(itemId) {
    const item = allMenuItems.find(i => i._id === itemId);
    if (!item) return;
    
    document.getElementById('menuItemId').value = item._id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemDescription').value = item.description || '';
    document.getElementById('itemImage').value = item.image || '';
    document.getElementById('itemVegetarian').checked = item.isVegetarian;
    document.getElementById('itemAvailable').checked = item.isAvailable;
    
    document.getElementById('menuModalTitle').textContent = 'Edit Menu Item';
    document.getElementById('menuModal').classList.add('active');
}

async function saveMenuItem(e) {
    e.preventDefault();
    
    const itemId = document.getElementById('menuItemId').value;
    const itemData = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        description: document.getElementById('itemDescription').value,
        image: document.getElementById('itemImage').value,
        isVegetarian: document.getElementById('itemVegetarian').checked,
        isAvailable: document.getElementById('itemAvailable').checked
    };
    
    try {
        const url = itemId ? `/api/menu/${itemId}` : '/api/menu';
        const method = itemId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });
        
        if (response.ok) {
            showToast('Menu item saved', 'success');
            closeMenuModal();
            loadMenuItems();
        } else {
            showToast('Failed to save item', 'error');
        }
    } catch (error) {
        console.error('Error saving menu item:', error);
        showToast('Error saving item', 'error');
    }
}

async function deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        const response = await fetch(`/api/menu/${itemId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Item deleted', 'success');
            loadMenuItems();
        } else {
            showToast('Failed to delete item', 'error');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showToast('Error deleting item', 'error');
    }
}

// ===================================
// Settings
// ===================================
async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        
        if (data.success && data.settings) {
            const s = data.settings;
            document.getElementById('offerEnabled').checked = s.offerEnabled !== false;
            document.getElementById('offerName').value = s.offerName || '';
            document.getElementById('offerDiscount').value = s.offerDiscount || 30;
            document.getElementById('offerDescription').value = s.offerDescription || '';
            document.getElementById('coupleSectionEnabled').checked = s.coupleSectionEnabled !== false;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function saveSettings() {
    const settings = {
        offerEnabled: document.getElementById('offerEnabled').checked,
        offerName: document.getElementById('offerName').value,
        offerDiscount: parseInt(document.getElementById('offerDiscount').value),
        offerDescription: document.getElementById('offerDescription').value,
        coupleSectionEnabled: document.getElementById('coupleSectionEnabled').checked
    };
    
    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        
        if (response.ok) {
            showToast('Settings saved', 'success');
        } else {
            showToast('Failed to save settings', 'error');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Error saving settings', 'error');
    }
}

// ===================================
// Occupancy Calendar
// ===================================
function toggleCalendar() {
    const calendar = document.getElementById('occupancyCalendar');
    calendar.style.display = calendar.style.display === 'none' ? 'block' : 'none';
    
    if (calendar.style.display === 'block') {
        renderCalendar();
    }
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    document.getElementById('calendarMonth').textContent = month;
    
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    let html = daysOfWeek.map(d => `<div class="calendar-day header">${d}</div>`).join('');
    
    // Empty cells for days before first of month
    for (let i = 0; i < firstDay.getDay(); i++) {
        html += '<div class="calendar-day"></div>';
    }
    
    // Days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const status = day === now.getDate() ? 'partial' : (day % 3 === 0 ? 'booked' : 'available');
        html += `<div class="calendar-day ${status}">${day}</div>`;
    }
    
    grid.innerHTML = html;
}

// ===================================
// Notifications
// ===================================
function toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    panel.classList.toggle('active');
}

// ===================================
// Utilities
// ===================================
function logout() {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '../index.html';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function renderPagination(pagination, containerId, section) {
    const container = document.getElementById(containerId);
    if (!container || !pagination) return;
    
    let html = '';
    
    if (pagination.hasPrev) {
        html += `<button onclick="goToPage('${section}', ${pagination.currentPage - 1})">Prev</button>`;
    }
    
    for (let i = 1; i <= pagination.totalPages; i++) {
        html += `<button class="${i === pagination.currentPage ? 'active' : ''}" onclick="goToPage('${section}', ${i})">${i}</button>`;
    }
    
    if (pagination.hasNext) {
        html += `<button onclick="goToPage('${section}', ${pagination.currentPage + 1})">Next</button>`;
    }
    
    container.innerHTML = html;
}

function goToPage(section, page) {
    if (section === 'users') {
        usersPage = page;
        loadUsers();
    }
}
