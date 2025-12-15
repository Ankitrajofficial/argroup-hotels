// ===================================
// Admin Dashboard JavaScript
// ===================================

// State
let currentPage = 1;
let searchQuery = '';
let isLoading = false;

// Contact state
let contactPage = 1;
let contactFilter = 'all';
let contactSearchQuery = ''; // Search by name or email
let currentContactId = null;

// Booking state
let bookingPage = 1;
let bookingFilter = 'all';
let bookingDateFilter = ''; // Date filter for specific date
let bookingSearchQuery = ''; // Search by guest name
let currentBookingId = null;

// Dining state
let menuItems = [];
let foodOrders = [];
let diningView = 'menu'; // 'menu' or 'orders'
let foodOrderFilter = 'all';

// ===================================
// Initialize Dashboard
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize theme from localStorage
    initializeTheme();
    
    // Check if user is admin
    const isAdmin = await checkAdminAccess();
    
    if (!isAdmin) {
        showAccessDenied();
        return;
    }
    
    // Load dashboard data
    await loadDashboard();
    
    // Setup event listeners
    setupEventListeners();
});

// ===================================
// Check Admin Access
// ===================================

async function checkAdminAccess() {
    try {
        const response = await fetch('/api/admin/check', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.isAdmin && data.user) {
            document.getElementById('adminName').textContent = data.user.name;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Admin check error:', error);
        return false;
    }
}

// ===================================
// Show Access Denied
// ===================================

function showAccessDenied() {
    document.querySelector('.admin-main').innerHTML = `
        <div class="access-denied">
            <i class="fas fa-lock"></i>
            <h2>Access Denied</h2>
            <p>You don't have permission to access this page.</p>
            <a href="../index.html">Go to Homepage</a>
        </div>
    `;
}

// ===================================
// Load Dashboard
// ===================================

async function loadDashboard() {
    showLoading(true);
    
    try {
        await Promise.all([
            loadStats(),
            loadUsers(),
            loadContactStats(),
            loadContacts(),
            loadBookingStats(),
            loadBookingStats(),
            loadBookings(),
            loadArchivedCount(),
            loadMenu(),
            loadFoodOrders()
        ]);
    } catch (error) {
        console.error('Dashboard load error:', error);
        showToast('Error loading dashboard', 'error');
    }
    
    showLoading(false);
}

// ===================================
// Load Statistics
// ===================================

async function loadStats() {
    try {
        const response = await fetch('/api/admin/stats', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalUsers').textContent = data.stats.totalUsers;
            document.getElementById('totalAdmins').textContent = data.stats.totalAdmins;
            document.getElementById('regularUsers').textContent = data.stats.regularUsers;
            document.getElementById('newToday').textContent = data.stats.newToday;
            
            // Update users badge directly (avoids duplicate API call)
            const usersBadge = document.getElementById('usersBadge');
            usersBadge.textContent = data.stats.totalUsers || 0;
            usersBadge.style.display = data.stats.totalUsers > 0 ? 'inline' : 'none';
        }
    } catch (error) {
        console.error('Stats error:', error);
    }
}

// ===================================
// Load Users
// ===================================

async function loadUsers() {
    try {
        const response = await fetch(
            `/api/admin/users?page=${currentPage}&limit=10&search=${encodeURIComponent(searchQuery)}`,
            { credentials: 'include' }
        );
        const data = await response.json();
        
        if (data.success) {
            renderUsers(data.users);
            renderPagination(data.pagination);
        }
    } catch (error) {
        console.error('Users error:', error);
    }
}

// ===================================
// Render Users Table
// ===================================

function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #888; padding: 2rem;">
                    No users found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>
                <strong>${escapeHtml(user.name)}</strong>
                ${user.googleId ? '<i class="fab fa-google" style="color: #d4af37; margin-left: 5px;" title="Google User"></i>' : ''}
            </td>
            <td>${escapeHtml(user.email)}</td>
            <td>${escapeHtml(user.phone)}</td>
            <td>
                <span class="role-badge ${user.role}">${user.role}</span>
            </td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                ${user.role === 'user' 
                    ? `<button class="action-btn make-admin" onclick="changeRole('${user._id}', 'admin')">
                         <i class="fas fa-crown"></i> Make Admin
                       </button>`
                    : `<button class="action-btn make-user" onclick="changeRole('${user._id}', 'user')">
                         <i class="fas fa-user"></i> Make User
                       </button>`
                }
                <button class="action-btn delete" onclick="deleteUser('${user._id}', '${escapeHtml(user.name)}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===================================
// Render Pagination
// ===================================

function renderPagination(pagination) {
    const container = document.getElementById('pagination');
    
    if (pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = `
        <button class="page-btn" onclick="goToPage(${pagination.currentPage - 1})" ${!pagination.hasPrev ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
        if (i === 1 || i === pagination.totalPages || 
            (i >= pagination.currentPage - 1 && i <= pagination.currentPage + 1)) {
            html += `
                <button class="page-btn ${i === pagination.currentPage ? 'active' : ''}" onclick="goToPage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === pagination.currentPage - 2 || i === pagination.currentPage + 2) {
            html += `<span class="page-info">...</span>`;
        }
    }
    
    html += `
        <button class="page-btn" onclick="goToPage(${pagination.currentPage + 1})" ${!pagination.hasNext ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
        <span class="page-info">Total: ${pagination.totalUsers} users</span>
    `;
    
    container.innerHTML = html;
}

// ===================================
// Change User Role
// ===================================

async function changeRole(userId, newRole) {
    if (!confirm(`Change this user to ${newRole}?`)) return;
    
    showLoading(true);
    
    try {
        const response = await fetch(`/api/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ role: newRole })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            await loadDashboard();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Change role error:', error);
        showToast('Error changing role', 'error');
    }
    
    showLoading(false);
}

// ===================================
// Delete User
// ===================================

async function deleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to delete "${userName}"? This cannot be undone.`)) return;
    
    showLoading(true);
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            await loadDashboard();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Error deleting user', 'error');
    }
    
    showLoading(false);
}

// ===================================
// Pagination Navigation
// ===================================

function goToPage(page) {
    if (page < 1) return;
    currentPage = page;
    loadUsers();
}

// ===================================
// Contact Queries Functions
// ===================================

async function loadContactStats() {
    try {
        const response = await fetch('/api/contact/stats', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('contactPending').textContent = data.stats.pending;
            document.getElementById('contactInProgress').textContent = data.stats.inProgress;
            document.getElementById('contactResolved').textContent = data.stats.resolved;
            document.getElementById('contactToday').textContent = data.stats.today;
            document.getElementById('pendingBadge').textContent = data.stats.pending;
            
            // Hide badge if no pending
            document.getElementById('pendingBadge').style.display = 
                data.stats.pending > 0 ? 'inline' : 'none';
            
            // Update contacts category badge directly (avoids duplicate API call)
            const contactsBadge = document.getElementById('contactsBadge');
            contactsBadge.textContent = data.stats.pending || 0;
            contactsBadge.style.display = data.stats.pending > 0 ? 'inline' : 'none';
        }
    } catch (error) {
        console.error('Contact stats error:', error);
    }
}

async function loadContacts() {
    try {
        const statusParam = contactFilter !== 'all' ? `&status=${contactFilter}` : '';
        const searchParam = contactSearchQuery ? `&search=${encodeURIComponent(contactSearchQuery)}` : '';
        const response = await fetch(
            `/api/contact/queries?page=${contactPage}&limit=10${statusParam}${searchParam}`,
            { credentials: 'include' }
        );
        const data = await response.json();
        
        if (data.success) {
            // Client-side filtering if search query exists (backup if server doesn't support it)
            let filteredContacts = data.contacts;
            if (contactSearchQuery) {
                filteredContacts = data.contacts.filter(contact => 
                    contact.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
                    contact.email.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
                    (contact.subject && contact.subject.toLowerCase().includes(contactSearchQuery.toLowerCase()))
                );
            }
            renderContacts(filteredContacts);
            renderContactPagination(data.pagination);
        }
    } catch (error) {
        console.error('Contacts error:', error);
    }
}

function renderContacts(contacts) {
    const tbody = document.getElementById('contactsTableBody');
    
    if (contacts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #888; padding: 2rem;">
                    No contact queries found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = contacts.map(contact => `
        <tr>
            <td><strong>${escapeHtml(contact.name)}</strong></td>
            <td>${escapeHtml(contact.email)}</td>
            <td>${escapeHtml(contact.subject || 'General Inquiry')}</td>
            <td><span class="status-badge ${contact.status}">${contact.status}</span></td>
            <td>${formatDate(contact.createdAt)}</td>
            <td>
                <button class="action-btn view" onclick="viewContact('${contact._id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="action-btn delete" onclick="deleteContact('${contact._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderContactPagination(pagination) {
    const container = document.getElementById('contactPagination');
    
    if (pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = `
        <button class="page-btn" onclick="goToContactPage(${pagination.currentPage - 1})" ${!pagination.hasPrev ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    for (let i = 1; i <= pagination.totalPages; i++) {
        if (i === 1 || i === pagination.totalPages || 
            (i >= pagination.currentPage - 1 && i <= pagination.currentPage + 1)) {
            html += `
                <button class="page-btn ${i === pagination.currentPage ? 'active' : ''}" onclick="goToContactPage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === pagination.currentPage - 2 || i === pagination.currentPage + 2) {
            html += `<span class="page-info">...</span>`;
        }
    }
    
    html += `
        <button class="page-btn" onclick="goToContactPage(${pagination.currentPage + 1})" ${!pagination.hasNext ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
        <span class="page-info">Total: ${pagination.totalContacts} queries</span>
    `;
    
    container.innerHTML = html;
}

function goToContactPage(page) {
    if (page < 1) return;
    contactPage = page;
    loadContacts();
}

function filterContacts(status) {
    contactFilter = status;
    contactPage = 1;
    loadContacts();
    
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.status === status);
    });
}

// Store loaded contacts for quick access
let loadedContacts = [];

async function viewContact(contactId) {
    currentContactId = contactId;
    
    // Show modal with loading state
    const modal = document.getElementById('contactModal');
    const body = document.getElementById('contactModalBody');
    modal.classList.add('show');
    body.innerHTML = '<div style="text-align: center; padding: 2rem; color: #888;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i><p>Loading...</p></div>';
    
    try {
        const response = await fetch(`/api/contact/query/${contactId}`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.contact) {
            showContactModal(data.contact);
        } else {
            body.innerHTML = '<div style="text-align: center; padding: 2rem; color: #dc3545;"><i class="fas fa-exclamation-circle" style="font-size: 2rem;"></i><p>Contact not found</p></div>';
            showToast('Contact not found', 'error');
        }
    } catch (error) {
        console.error('View contact error:', error);
        body.innerHTML = '<div style="text-align: center; padding: 2rem; color: #dc3545;"><i class="fas fa-exclamation-circle" style="font-size: 2rem;"></i><p>Error loading contact</p></div>';
        showToast('Error loading contact details', 'error');
    }
}

function showContactModal(contact) {
    const modal = document.getElementById('contactModal');
    const body = document.getElementById('contactModalBody');
    
    // Prepare WhatsApp message
    const whatsappMessage = encodeURIComponent(
        `Hello ${contact.name},\n\nThank you for contacting Hotel Ortus regarding "${contact.subject || 'your inquiry'}".\n\nWe have received your message and would like to assist you.\n\nBest regards,\nHotel Ortus Team`
    );
    
    // Prepare Email subject and body
    const emailSubject = encodeURIComponent(`Re: ${contact.subject || 'Your Inquiry'} - Hotel Ortus`);
    const emailBody = encodeURIComponent(
        `Dear ${contact.name},\n\nThank you for contacting Hotel Ortus.\n\nRegarding your inquiry:\n"${contact.message}"\n\nWe would like to inform you that...\n\n\nBest regards,\nHotel Ortus Team\nPhone: XXXXXXX\nEmail: XXXXXXX`
    );
    
    // Clean phone number for WhatsApp (remove spaces, dashes)
    const cleanPhone = (contact.phone || '').replace(/[\s\-()]/g, '');
    const whatsappLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('+') ? cleanPhone.slice(1) : '91' + cleanPhone}?text=${whatsappMessage}` : '';
    
    body.innerHTML = `
        <div class="contact-detail-row">
            <label><i class="fas fa-user"></i> Name</label>
            <div class="value">${escapeHtml(contact.name)}</div>
        </div>
        <div class="contact-detail-row">
            <label><i class="fas fa-envelope"></i> Email</label>
            <div class="value">
                <a href="mailto:${escapeHtml(contact.email)}">
                    ${escapeHtml(contact.email)}
                </a>
            </div>
        </div>
        ${contact.phone ? `
        <div class="contact-detail-row">
            <label><i class="fas fa-phone"></i> Phone</label>
            <div class="value">
                <a href="tel:${escapeHtml(contact.phone)}">
                    ${escapeHtml(contact.phone)}
                </a>
            </div>
        </div>
        ` : ''}
        <div class="contact-detail-row">
            <label><i class="fas fa-tag"></i> Subject</label>
            <div class="value">${escapeHtml(contact.subject || 'General Inquiry')}</div>
        </div>
        <div class="contact-detail-row">
            <label><i class="fas fa-calendar-alt"></i> Date</label>
            <div class="value">${formatDateTime(contact.createdAt)}</div>
        </div>
        <div class="contact-detail-row">
            <label><i class="fas fa-info-circle"></i> Current Status</label>
            <div class="value"><span class="status-badge ${contact.status}">${contact.status}</span></div>
        </div>
        <div class="contact-detail-row">
            <label><i class="fas fa-comment-dots"></i> Message</label>
            <div class="contact-message">${escapeHtml(contact.message)}</div>
        </div>
        
        <!-- Reply Options -->
        <div class="reply-section">
            <label><i class="fas fa-reply"></i> Quick Reply</label>
            <div class="reply-buttons">
                ${contact.phone ? `
                <a href="${whatsappLink}" target="_blank" class="reply-btn whatsapp">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
                ` : ''}
                <a href="mailto:${escapeHtml(contact.email)}?subject=${emailSubject}&body=${emailBody}" class="reply-btn email">
                    <i class="fas fa-envelope"></i> Email
                </a>
                ${contact.phone ? `
                <a href="tel:${escapeHtml(contact.phone)}" class="reply-btn call">
                    <i class="fas fa-phone-alt"></i> Call
                </a>
                ` : ''}
            </div>
        </div>
        
        <!-- Status Actions -->
        <div class="modal-actions">
            <button class="modal-btn pending" onclick="updateContactStatus('${contact._id}', 'pending')">
                <i class="fas fa-clock"></i> Pending
            </button>
            <button class="modal-btn in-progress" onclick="updateContactStatus('${contact._id}', 'in-progress')">
                <i class="fas fa-hourglass-half"></i> In Progress
            </button>
            <button class="modal-btn resolved" onclick="updateContactStatus('${contact._id}', 'resolved')">
                <i class="fas fa-check-circle"></i> Resolved
            </button>
            <button class="modal-btn delete" onclick="deleteContact('${contact._id}'); closeContactModal();">
                <i class="fas fa-trash-alt"></i> Delete
            </button>
        </div>
    `;
    
    modal.classList.add('show');
}

// Format date with time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function closeContactModal() {
    document.getElementById('contactModal').classList.remove('show');
    currentContactId = null;
}

async function updateContactStatus(contactId, status) {
    try {
        const response = await fetch(`/api/contact/${contactId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`Status updated to ${status}`, 'success');
            closeContactModal();
            await loadContactStats();
            await loadContacts();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Update status error:', error);
        showToast('Error updating status', 'error');
    }
}

async function deleteContact(contactId) {
    // Find and show loading state on button
    const button = document.querySelector(`button[onclick="deleteContact('${contactId}')"]`);
    const originalText = button ? button.innerHTML : '';
    if (button) {
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Deleting...`;
        button.disabled = true;
    }
    
    try {
        const response = await fetch(`/api/contact/${contactId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Query deleted successfully', 'success');
            closeContactModal();
            await loadContactStats();
            await loadContacts();
        } else {
            showToast(data.message || 'Error deleting query', 'error');
            if (button) {
                button.innerHTML = originalText;
                button.disabled = false;
            }
        }
    } catch (error) {
        console.error('Delete contact error:', error);
        showToast('Error deleting query', 'error');
        if (button) {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
}

// ===================================
// Setup Event Listeners
// ===================================

function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = e.target.value;
            currentPage = 1;
            loadUsers();
        }, 300);
    });
    
    // Logout button
    document.getElementById('adminLogout').addEventListener('click', async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            window.location.href = '../index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
    
    // Filter tabs
    // Contact filter tabs
    document.querySelectorAll('.contacts-section .filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            filterContacts(tab.dataset.status);
        });
    });
    
    // Booking filter tabs
    document.querySelectorAll('#bookingFilterTabs .filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            filterBookings(tab.dataset.status);
        });
    });
    
    // Date filter for bookings
    const dateFilterInput = document.getElementById('bookingDateFilter');
    if (dateFilterInput) {
        dateFilterInput.addEventListener('change', (e) => {
            bookingDateFilter = e.target.value;
            bookingPage = 1;
            loadBookings();
        });
    }
    
    // Clear date filter button
    const clearDateBtn = document.getElementById('clearDateFilter');
    if (clearDateBtn) {
        clearDateBtn.addEventListener('click', () => {
            const dateInput = document.getElementById('bookingDateFilter');
            if (dateInput) {
                dateInput.value = '';
            }
            bookingDateFilter = '';
            bookingPage = 1;
            loadBookings();
        });
    }
    
    // Booking search input
    const bookingSearchInput = document.getElementById('bookingSearchInput');
    let bookingSearchTimeout;
    if (bookingSearchInput) {
        bookingSearchInput.addEventListener('input', (e) => {
            clearTimeout(bookingSearchTimeout);
            bookingSearchTimeout = setTimeout(() => {
                bookingSearchQuery = e.target.value.trim().toLowerCase();
                bookingPage = 1;
                loadBookings();
            }, 300);
        });
    }
    
    // Contact search input
    const contactSearchInput = document.getElementById('contactSearchInput');
    let contactSearchTimeout;
    if (contactSearchInput) {
        contactSearchInput.addEventListener('input', (e) => {
            clearTimeout(contactSearchTimeout);
            contactSearchTimeout = setTimeout(() => {
                contactSearchQuery = e.target.value.trim().toLowerCase();
                contactPage = 1;
                loadContacts();
            }, 300);
        });
    }
    
    // Close modal on outside click
    document.getElementById('contactModal').addEventListener('click', (e) => {
        if (e.target.id === 'contactModal') {
            closeContactModal();
        }
    });
    
    // Category navigation buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            
            // Update active button
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide sections
            document.getElementById('bookingsSection').style.display = section === 'bookings' ? 'block' : 'none';
            document.getElementById('contactsSection').style.display = section === 'contacts' ? 'block' : 'none';
            document.getElementById('usersSection').style.display = section === 'users' ? 'block' : 'none';
            document.getElementById('settingsSection').style.display = section === 'settings' ? 'block' : 'none';
            
            // Load settings when settings tab is shown
            if (section === 'settings') {
                loadSettings();
            }
            
            // Handle Dining section visibility
            document.getElementById('diningSection').style.display = section === 'dining' ? 'block' : 'none';
        });
    });

    // Dining Tabs (Menu / Orders)
    document.querySelectorAll('#diningTabs .filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.dataset.view;
            diningView = view;
            
            // Update tabs
            document.querySelectorAll('#diningTabs .filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show views
            document.getElementById('menuView').style.display = view === 'menu' ? 'block' : 'none';
            document.getElementById('ordersView').style.display = view === 'orders' ? 'block' : 'none';
        });
    });

    // Order Status Filters
    document.querySelectorAll('#orderFilterTabs .filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
             const status = tab.dataset.status;
             foodOrderFilter = status;
             
             document.querySelectorAll('#orderFilterTabs .filter-tab').forEach(t => t.classList.remove('active'));
             tab.classList.add('active');
             
             renderFoodOrders(); // Re-render with filter
        });
    });

    // Menu Form Submit
    document.getElementById('menuForm').addEventListener('submit', handleMenuSubmit);

    // Menu Search
    document.getElementById('menuSearchInput').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = menuItems.filter(item => 
            item.name.toLowerCase().includes(query) || 
            item.category.toLowerCase().includes(query)
        );
        renderMenu(filtered);
    });
    
    // Note: Badge counts are now updated directly in loadStats, loadContactStats, and loadBookingStats
    // to avoid duplicate API calls and improve loading performance
}

// Update category navigation badges
async function updateCategoryBadges() {
    try {
        // Bookings badge - show pending count
        const bookingStats = await fetch('/api/booking/stats', { credentials: 'include' });
        const bookingData = await bookingStats.json();
        if (bookingData.success) {
            const bookingsBadge = document.getElementById('bookingsBadge');
            bookingsBadge.textContent = bookingData.stats.pending || 0;
            bookingsBadge.style.display = bookingData.stats.pending > 0 ? 'inline' : 'none';
        }
        
        // Contacts badge - show pending count
        const contactStats = await fetch('/api/contact/stats', { credentials: 'include' });
        const contactData = await contactStats.json();
        if (contactData.success) {
            const contactsBadge = document.getElementById('contactsBadge');
            contactsBadge.textContent = contactData.stats.pending || 0;
            contactsBadge.style.display = contactData.stats.pending > 0 ? 'inline' : 'none';
        }
        
        // Users badge - show total count
        const userStats = await fetch('/api/admin/stats', { credentials: 'include' });
        const userData = await userStats.json();
        if (userData.success) {
            const usersBadge = document.getElementById('usersBadge');
            usersBadge.textContent = userData.stats.totalUsers || 0;
            usersBadge.style.display = userData.stats.totalUsers > 0 ? 'inline' : 'none';
        }
    } catch (error) {
        console.error('Error updating category badges:', error);
    }
}

// ===================================
// Utility Functions
// ===================================

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.toggle('show', show);
    isLoading = show;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// ===================================
// Booking Functions
// ===================================

async function loadBookingStats() {
    try {
        const response = await fetch('/api/booking/stats', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('bookingPending').textContent = data.stats.pending;
            document.getElementById('bookingConfirmed').textContent = data.stats.confirmed;
            document.getElementById('bookingCompleted').textContent = data.stats.completed;
            document.getElementById('bookingToday').textContent = data.stats.today;
            document.getElementById('bookingPendingBadge').textContent = data.stats.pending;
            
            document.getElementById('bookingPendingBadge').style.display = 
                data.stats.pending > 0 ? 'inline' : 'none';
            
            // Update bookings category badge directly (avoids duplicate API call)
            const bookingsBadge = document.getElementById('bookingsBadge');
            bookingsBadge.textContent = data.stats.pending || 0;
            bookingsBadge.style.display = data.stats.pending > 0 ? 'inline' : 'none';
        }
        
        // Also load payment stats
        await loadPaymentStats();
    } catch (error) {
        console.error('Booking stats error:', error);
    }
}

async function loadPaymentStats() {
    try {
        const response = await fetch('/api/booking/payment/stats', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            const todayEl = document.getElementById('todayCollection');
            if (todayEl) {
                todayEl.textContent = `₹${data.stats.todayCollection.toLocaleString('en-IN')}`;
            }
        }
    } catch (error) {
        console.error('Payment stats error:', error);
    }
}

async function loadBookings() {
    try {
        let queryParams = `page=${bookingPage}&limit=10`;
        
        // Handle time-based filters (upcoming/past)
        if (bookingFilter === 'upcoming') {
            queryParams += `&timeFilter=upcoming`;
        } else if (bookingFilter === 'past') {
            queryParams += `&timeFilter=past`;
        } else if (bookingFilter !== 'all') {
            // Handle status-based filters
            queryParams += `&status=${bookingFilter}`;
        }
        
        const response = await fetch(
            `/api/booking/all?${queryParams}`,
            { credentials: 'include' }
        );
        const data = await response.json();
        
        if (data.success) {
            // Client-side filtering for upcoming/past
            let filteredBookings = data.bookings;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (bookingFilter === 'upcoming') {
                // New/Upcoming: NOT completed/cancelled AND check-in is today or future
                filteredBookings = data.bookings.filter(b => {
                    const checkInDate = new Date(b.checkIn);
                    checkInDate.setHours(0, 0, 0, 0);
                    return b.status !== 'completed' && 
                           b.status !== 'cancelled' && 
                           checkInDate >= today;
                });
            } else if (bookingFilter === 'past') {
                // Old/Past: Completed bookings OR checkout date is in the past
                filteredBookings = data.bookings.filter(b => {
                    const checkOutDate = new Date(b.checkOut);
                    checkOutDate.setHours(0, 0, 0, 0);
                    return b.status === 'completed' || checkOutDate < today;
                });
            }
            
            // Apply date filter if set
            if (bookingDateFilter) {
                const filterDate = new Date(bookingDateFilter);
                filterDate.setHours(0, 0, 0, 0);
                filteredBookings = filteredBookings.filter(b => {
                    const checkIn = new Date(b.checkIn);
                    const checkOut = new Date(b.checkOut);
                    checkIn.setHours(0, 0, 0, 0);
                    checkOut.setHours(0, 0, 0, 0);
                    // Show bookings where the date falls within check-in to check-out range
                    return filterDate >= checkIn && filterDate <= checkOut;
                });
            }
            
            // Apply search filter if set
            if (bookingSearchQuery) {
                filteredBookings = filteredBookings.filter(b => 
                    b.name.toLowerCase().includes(bookingSearchQuery)
                );
            }
            
            renderBookings(filteredBookings);
            renderBookingPagination(data.pagination);
        }
    } catch (error) {
        console.error('Bookings error:', error);
    }
}

function renderBookings(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    
    if (bookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #888; padding: 2rem;">
                    No bookings found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = bookings.map(booking => `
        <tr>
            <td><strong>${escapeHtml(booking.name)}</strong></td>
            <td>${escapeHtml(booking.roomType)}</td>
            <td>${formatDate(booking.checkIn)}</td>
            <td>${formatDate(booking.checkOut)}</td>
            <td>${booking.guests}</td>
            <td><span class="status-badge ${booking.status}">${booking.status}</span></td>
            <td>
                <button class="action-btn view" onclick="viewBooking('${booking._id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="action-btn archive" onclick="archiveBooking('${booking._id}')">
                    <i class="fas fa-archive"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderBookingPagination(pagination) {
    const container = document.getElementById('bookingPagination');
    
    if (pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = `
        <button class="page-btn" onclick="goToBookingPage(${pagination.currentPage - 1})" ${!pagination.hasPrev ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    for (let i = 1; i <= pagination.totalPages; i++) {
        if (i === 1 || i === pagination.totalPages || 
            (i >= pagination.currentPage - 1 && i <= pagination.currentPage + 1)) {
            html += `
                <button class="page-btn ${i === pagination.currentPage ? 'active' : ''}" onclick="goToBookingPage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === pagination.currentPage - 2 || i === pagination.currentPage + 2) {
            html += `<span class="page-info">...</span>`;
        }
    }
    
    html += `
        <button class="page-btn" onclick="goToBookingPage(${pagination.currentPage + 1})" ${!pagination.hasNext ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
        <span class="page-info">Total: ${pagination.totalBookings} bookings</span>
    `;
    
    container.innerHTML = html;
}

function goToBookingPage(page) {
    if (page < 1) return;
    bookingPage = page;
    loadBookings();
}

function filterBookings(status) {
    bookingFilter = status;
    bookingPage = 1;
    
    // If archived filter, load archived bookings, otherwise load regular
    if (status === 'archived') {
        loadArchivedBookingsInTable();
    } else {
        loadBookings();
    }
    
    document.querySelectorAll('#bookingFilterTabs .filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.status === status);
    });
}

// Load archived bookings into the main table
async function loadArchivedBookingsInTable() {
    const tableBody = document.getElementById('bookingsTableBody');
    tableBody.innerHTML = '<tr><td colspan="7" class="no-data"><i class="fas fa-spinner fa-spin"></i> Loading archived bookings...</td></tr>';
    
    try {
        const response = await fetch(`/api/booking/archived/all?page=${bookingPage}&limit=10`, { credentials: 'include' });
        const data = await response.json();
        
        if (data.success) {
            if (data.bookings.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" class="no-data"><i class="fas fa-archive"></i> No archived bookings</td></tr>';
            } else {
                tableBody.innerHTML = data.bookings.map(booking => `
                    <tr class="archived-row">
                        <td><strong>${escapeHtml(booking.name)}</strong><br><span style="font-size: 0.8rem; color: #888;">${escapeHtml(booking.phone)}</span></td>
                        <td>${escapeHtml(booking.roomType)}</td>
                        <td>${formatDate(booking.checkIn)}</td>
                        <td>${formatDate(booking.checkOut)}</td>
                        <td>${booking.guests}</td>
                        <td><span class="status-badge ${booking.status}">${booking.status}</span></td>
                        <td>
                            <button class="action-btn view" onclick="viewBooking('${booking._id}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="action-btn restore" onclick="unarchiveBooking('${booking._id}')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
            renderBookingPagination(data.pagination);
        }
    } catch (error) {
        console.error('Load archived bookings error:', error);
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data"><i class="fas fa-exclamation-circle"></i> Error loading archived bookings</td></tr>';
    }
}

async function viewBooking(bookingId) {
    currentBookingId = bookingId;
    
    const modal = document.getElementById('bookingModal');
    const body = document.getElementById('bookingModalBody');
    modal.classList.add('show');
    body.innerHTML = '<div style="text-align: center; padding: 2rem; color: #888;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i><p>Loading...</p></div>';
    
    try {
        const response = await fetch(`/api/booking/${bookingId}`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.booking) {
            showBookingModal(data.booking);
        } else {
            body.innerHTML = '<div style="text-align: center; padding: 2rem; color: #dc3545;"><i class="fas fa-exclamation-circle" style="font-size: 2rem;"></i><p>Booking not found</p></div>';
        }
    } catch (error) {
        console.error('View booking error:', error);
        body.innerHTML = '<div style="text-align: center; padding: 2rem; color: #dc3545;"><i class="fas fa-exclamation-circle" style="font-size: 2rem;"></i><p>Error loading booking</p></div>';
    }
}

function showBookingModal(booking) {
    const body = document.getElementById('bookingModalBody');
    
    const whatsappMessage = encodeURIComponent(
        `Hello ${booking.name},\n\nYour booking at Hotel Ortus is ${booking.status}!\n\nRoom: ${booking.roomType}\nCheck-in: ${formatDate(booking.checkIn)}\nCheck-out: ${formatDate(booking.checkOut)}\nGuests: ${booking.guests}\n\nThank you for choosing Hotel Ortus!\n\nBest regards,\nHotel Ortus Team`
    );
    
    const cleanPhone = (booking.phone || '').replace(/[\s\-()]/g, '');
    const whatsappLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('+') ? cleanPhone.slice(1) : '91' + cleanPhone}?text=${whatsappMessage}` : '';
    
    // Calculate nights and suggested price
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    // Room prices
    const roomPrices = {
        'Deluxe Room': 2500,
        'Executive Suite': 4000,
        'Family Room': 5500
    };
    const pricePerNight = roomPrices[booking.roomType] || 2500;
    const suggestedAmount = booking.paymentAmount || (nights * pricePerNight);
    const paidAmount = booking.paidAmount || 0;
    const paymentStatus = booking.paymentStatus || 'unpaid';
    
    // Payment status badge color
    const paymentBadgeClass = {
        'unpaid': 'pending',
        'partial': 'in-progress',
        'paid': 'resolved',
        'refunded': 'delete'
    }[paymentStatus] || 'pending';
    
    body.innerHTML = `
        <div class="booking-details-grid">
            <div class="contact-detail-row">
                <label><i class="fas fa-user"></i> Guest Name</label>
                <div class="value">${escapeHtml(booking.name)}</div>
            </div>
            <div class="contact-detail-row">
                <label><i class="fas fa-phone"></i> Phone</label>
                <div class="value"><a href="tel:${escapeHtml(booking.phone)}">${escapeHtml(booking.phone)}</a></div>
            </div>
            <div class="contact-detail-row full-width">
                <label><i class="fas fa-envelope"></i> Email</label>
                <div class="value"><a href="mailto:${escapeHtml(booking.email)}">${escapeHtml(booking.email)}</a></div>
            </div>
            <div class="contact-detail-row full-width">
                <label><i class="fas fa-bed"></i> Room Type</label>
                <div class="value">${escapeHtml(booking.roomType)} <small>(₹${pricePerNight}/night)</small></div>
            </div>
            <div class="contact-detail-row">
                <label><i class="fas fa-calendar-plus"></i> Check-In</label>
                <div class="value">${formatDate(booking.checkIn)}</div>
            </div>
            <div class="contact-detail-row">
                <label><i class="fas fa-calendar-minus"></i> Check-Out</label>
                <div class="value">${formatDate(booking.checkOut)} <small>(${nights} night${nights > 1 ? 's' : ''})</small></div>
            </div>
            <div class="contact-detail-row">
                <label><i class="fas fa-users"></i> Guests</label>
                <div class="value">${booking.guests}</div>
            </div>
            <div class="contact-detail-row">
                <label><i class="fas fa-info-circle"></i> Booking Status</label>
                <div class="value"><span class="status-badge ${booking.status}">${booking.status}</span></div>
            </div>
            ${booking.specialRequests ? `
            <div class="contact-detail-row full-width">
                <label><i class="fas fa-comment-dots"></i> Special Requests</label>
                <div class="contact-message">${escapeHtml(booking.specialRequests)}</div>
            </div>
            ` : ''}
        </div>
        
        <!-- Payment Section -->
        <div class="payment-section">
            <div class="payment-header">
                <h4><i class="fas fa-rupee-sign"></i> Payment Information</h4>
                <label class="payment-toggle">
                    <input type="checkbox" id="paymentToggle" ${getPaymentEnabled() ? 'checked' : ''} onchange="togglePaymentSection()">
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">${getPaymentEnabled() ? 'Enabled' : 'Disabled'}</span>
                </label>
            </div>
            <div class="payment-content" id="paymentContent" style="display: ${getPaymentEnabled() ? 'block' : 'none'};">
                <div class="payment-row">
                    <label>Payment Status</label>
                    <span class="status-badge ${paymentBadgeClass}">${paymentStatus}</span>
                </div>
                <div class="payment-row">
                    <label>Total Amount (₹)</label>
                    <input type="number" id="paymentAmountInput" value="${suggestedAmount}" min="0" step="100" class="payment-input">
                </div>
                <div class="payment-row">
                    <label>Paid Amount (₹)</label>
                    <input type="number" id="paidAmountInput" value="${paidAmount}" min="0" step="100" class="payment-input">
                </div>
                <div class="payment-actions">
                    <button class="payment-btn partial" onclick="updatePayment('${booking._id}', 'partial')">
                        <i class="fas fa-coins"></i> Mark Partial
                    </button>
                    <button class="payment-btn paid" onclick="updatePayment('${booking._id}', 'paid')">
                        <i class="fas fa-check-circle"></i> Payment Done
                    </button>
                    <button class="payment-btn refund" onclick="updatePayment('${booking._id}', 'refunded')">
                        <i class="fas fa-undo"></i> Refund
                    </button>
                </div>
            </div>
            <div class="payment-disabled-message" id="paymentDisabledMessage" style="display: ${getPaymentEnabled() ? 'none' : 'block'};">
                <p><i class="fas fa-info-circle"></i> Payment tracking is disabled. Enable to manage payments.</p>
            </div>
        </div>
        
        <div class="reply-section">
            <label><i class="fas fa-reply"></i> Quick Reply</label>
            <div class="reply-buttons">
                ${booking.phone ? `
                <a href="${whatsappLink}" target="_blank" class="reply-btn whatsapp">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
                ` : ''}
                <a href="mailto:${escapeHtml(booking.email)}" class="reply-btn email">
                    <i class="fas fa-envelope"></i> Email
                </a>
                ${booking.phone ? `
                <a href="tel:${escapeHtml(booking.phone)}" class="reply-btn call">
                    <i class="fas fa-phone-alt"></i> Call
                </a>
                ` : ''}
            </div>
        </div>
        
        <!-- Check-in/Check-out Tracking Section -->
        <div class="checkin-checkout-section">
            <h4><i class="fas fa-door-open"></i> Guest Arrival/Departure</h4>
            ${getTimingNotice(booking)}
            <div class="checkin-checkout-status">
                <div class="checkin-status">
                    <label><i class="fas fa-sign-in-alt"></i> Arrived (Check-In)</label>
                    <div class="timestamp-display ${booking.actualCheckIn ? 'recorded' : 'pending'}">
                        ${booking.actualCheckIn 
                            ? formatDateTime(booking.actualCheckIn) 
                            : '<span class="not-yet">Not checked in yet</span>'}
                    </div>
                </div>
                <div class="checkout-status">
                    <label><i class="fas fa-sign-out-alt"></i> Departed (Check-Out)${booking.extendedBy ? ` <span class="extended-badge">+${booking.extendedBy} day${booking.extendedBy > 1 ? 's' : ''}</span>` : ''}</label>
                    <div class="timestamp-display ${booking.actualCheckOut ? 'recorded' : 'pending'}">
                        ${booking.actualCheckOut 
                            ? formatDateTime(booking.actualCheckOut) 
                            : '<span class="not-yet">Not checked out yet</span>'}
                    </div>
                </div>
            </div>
            <div class="checkin-checkout-actions">
                <button class="checkin-btn ${isCheckinDisabled(booking) ? 'disabled' : ''}" 
                        onclick="recordCheckInOut('${booking._id}', 'checkin')"
                        ${isCheckinDisabled(booking) ? 'disabled' : ''}
                        title="${getCheckinButtonTitle(booking)}">
                    <i class="fas fa-sign-in-alt"></i> Check-In
                </button>
                <button class="extend-btn ${!booking.actualCheckIn || booking.actualCheckOut ? 'disabled' : ''}" 
                        onclick="extendBooking('${booking._id}')"
                        ${!booking.actualCheckIn || booking.actualCheckOut ? 'disabled' : ''}
                        title="Extend stay by 1 day">
                    <i class="fas fa-calendar-plus"></i> Extend
                </button>
                <button class="checkout-btn ${!booking.actualCheckIn || booking.actualCheckOut ? 'disabled' : ''}" 
                        onclick="recordCheckInOut('${booking._id}', 'checkout')"
                        ${!booking.actualCheckIn || booking.actualCheckOut ? 'disabled' : ''}>
                    <i class="fas fa-sign-out-alt"></i> Check-Out
                </button>
            </div>
        </div>
        
        <div class="modal-actions">
            <button class="modal-btn pending" onclick="updateBookingStatus('${booking._id}', 'pending')">
                <i class="fas fa-clock"></i> Pending
            </button>
            <button class="modal-btn in-progress" onclick="updateBookingStatus('${booking._id}', 'confirmed')">
                <i class="fas fa-check"></i> Confirm
            </button>
            <button class="modal-btn resolved" onclick="updateBookingStatus('${booking._id}', 'completed')">
                <i class="fas fa-check-circle"></i> Complete
            </button>
            <button class="modal-btn delete" onclick="updateBookingStatus('${booking._id}', 'cancelled')">
                <i class="fas fa-times-circle"></i> Cancel
            </button>
        </div>
    `;
}

// Update Payment Status
async function updatePayment(bookingId, paymentStatus) {
    const paymentAmount = parseFloat(document.getElementById('paymentAmountInput').value) || 0;
    const paidAmount = parseFloat(document.getElementById('paidAmountInput').value) || 0;
    
    // Validate based on status
    if (paymentStatus === 'paid' && paidAmount < paymentAmount) {
        if (!confirm(`Paid amount (₹${paidAmount}) is less than total (₹${paymentAmount}). Mark as fully paid anyway?`)) {
            return;
        }
    }
    
    try {
        const response = await fetch(`/api/booking/${bookingId}/payment`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ paymentStatus, paymentAmount, paidAmount })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            closeBookingModal();
            await loadBookingStats();
            await loadBookings();
            updateCategoryBadges();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Update payment error:', error);
        showToast('Error updating payment', 'error');
    }
}

function closeBookingModal() {
    document.getElementById('bookingModal').classList.remove('show');
    currentBookingId = null;
}

async function updateBookingStatus(bookingId, status) {
    try {
        const response = await fetch(`/api/booking/${bookingId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`Booking ${status}`, 'success');
            closeBookingModal();
            await loadBookingStats();
            await loadBookings();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Update booking error:', error);
        showToast('Error updating booking', 'error');
    }
}

async function archiveBooking(bookingId) {
    // Find and show loading state on button
    const button = document.querySelector(`button[onclick="archiveBooking('${bookingId}')"]`);
    const originalText = button ? button.innerHTML : '';
    if (button) {
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
        button.disabled = true;
    }
    
    try {
        const response = await fetch(`/api/booking/${bookingId}/archive`, {
            method: 'PUT',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Booking archived', 'success');
            // Close modal if open
            closeBookingModal();
            await loadBookingStats();
            await loadBookings();
            await loadArchivedCount();
        } else {
            showToast(data.message || 'Error archiving booking', 'error');
            // Restore button
            if (button) {
                button.innerHTML = originalText;
                button.disabled = false;
            }
        }
    } catch (error) {
        console.error('Archive booking error:', error);
        showToast('Error archiving booking', 'error');
        // Restore button
        if (button) {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
}

// Unarchive booking
async function unarchiveBooking(bookingId) {
    const button = document.querySelector(`button[onclick="unarchiveBooking('${bookingId}')"]`);
    const originalText = button ? button.innerHTML : '';
    if (button) {
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
        button.disabled = true;
    }
    
    try {
        const response = await fetch(`/api/booking/${bookingId}/unarchive`, {
            method: 'PUT',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Booking restored', 'success');
            await loadArchivedBookingsInTable();
            await loadArchivedCount();
        } else {
            showToast(data.message || 'Error restoring booking', 'error');
            if (button) {
                button.innerHTML = originalText;
                button.disabled = false;
            }
        }
    } catch (error) {
        console.error('Unarchive booking error:', error);
        showToast('Error restoring booking', 'error');
        if (button) {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
}

// Load archived bookings count
async function loadArchivedCount() {
    try {
        const response = await fetch('/api/booking/archived/all?limit=1', { credentials: 'include' });
        const data = await response.json();
        if (data.success) {
            const badge = document.getElementById('archivedCountBadge');
            if (badge) {
                badge.textContent = data.pagination.totalBookings;
                badge.style.display = data.pagination.totalBookings > 0 ? 'inline-flex' : 'none';
            }
        }
    } catch (error) {
        console.error('Load archived count error:', error);
    }
}

// Load archived bookings
let archivedPage = 1;
async function loadArchivedBookings() {
    try {
        const response = await fetch(`/api/booking/archived/all?page=${archivedPage}&limit=10`, { credentials: 'include' });
        const data = await response.json();
        
        if (data.success) {
            renderArchivedBookings(data.bookings);
        }
    } catch (error) {
        console.error('Load archived bookings error:', error);
        showToast('Error loading archived bookings', 'error');
    }
}

// Render archived bookings
function renderArchivedBookings(bookings) {
    const container = document.getElementById('archivedBookingsBody');
    if (!container) return;
    
    if (bookings.length === 0) {
        container.innerHTML = `<tr><td colspan="7" class="no-data"><i class="fas fa-archive"></i> No archived bookings</td></tr>`;
        return;
    }
    
    container.innerHTML = bookings.map(booking => `
        <tr>
            <td><strong>${escapeHtml(booking.name)}</strong></td>
            <td>${escapeHtml(booking.roomType)}</td>
            <td>${formatDate(booking.checkIn)}</td>
            <td>${formatDate(booking.checkOut)}</td>
            <td><span class="status-badge ${booking.status}">${booking.status}</span></td>
            <td>
                <button class="action-btn restore" onclick="unarchiveBooking('${booking._id}')">
                    <i class="fas fa-undo"></i> Restore
                </button>
            </td>
        </tr>
    `).join('');
}

// Toggle archived view
function toggleArchivedView() {
    const archivedSection = document.getElementById('archivedBookingsSection');
    const mainSection = document.getElementById('bookingsSection');
    
    if (archivedSection.style.display === 'none' || !archivedSection.style.display) {
        archivedSection.style.display = 'block';
        mainSection.style.display = 'none';
        loadArchivedBookings();
    } else {
        archivedSection.style.display = 'none';
        mainSection.style.display = 'block';
    }
}

// Close booking modal on outside click
document.getElementById('bookingModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'bookingModal') {
        closeBookingModal();
    }
});

// Record Check-in or Check-out
async function recordCheckInOut(bookingId, action) {
    console.log('recordCheckInOut called with:', bookingId, action);
    const actionLabel = action === 'checkin' ? 'Check-In' : 'Check-Out';
    
    // Show loading state on button
    const button = document.querySelector(`.${action === 'checkin' ? 'checkin-btn' : 'checkout-btn'}:not(.disabled)`);
    const originalText = button ? button.innerHTML : '';
    if (button) {
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;
        button.disabled = true;
    }
    
    try {
        console.log('Making API request to:', `/api/booking/${bookingId}/checkin-checkout`);
        const response = await fetch(`/api/booking/${bookingId}/checkin-checkout`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ action })
        });
        
        console.log('API response status:', response.status);
        const data = await response.json();
        console.log('API response data:', data);
        
        if (data.success) {
            showToast(data.message, 'success');
            // Refresh the modal to show updated timestamps
            await viewBooking(bookingId);
            await loadBookingStats();
            await loadBookings();
        } else {
            showToast(data.message || 'Operation failed', 'error');
            // Restore button state on error
            if (button) {
                button.innerHTML = originalText;
                button.disabled = false;
            }
        }
    } catch (error) {
        console.error(`${actionLabel} error:`, error);
        showToast(`Error recording ${actionLabel}: ${error.message}`, 'error');
        // Restore button state on error
        if (button) {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
}

// ===================================
// Theme Toggle Functions
// ===================================

function initializeTheme() {
    const savedTheme = localStorage.getItem('adminTheme');
    const body = document.body;
    
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
    } else {
        body.classList.remove('light-theme');
    }
    
    // Add theme toggle event listener
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const body = document.body;
    const isLightTheme = body.classList.toggle('light-theme');
    
    // Save preference to localStorage
    localStorage.setItem('adminTheme', isLightTheme ? 'light' : 'dark');
    
    // Show toast notification
    showToast(`Switched to ${isLightTheme ? 'Light' : 'Dark'} mode`, 'success');
}

// ===================================
// Payment Toggle Functions
// ===================================

function getPaymentEnabled() {
    const saved = localStorage.getItem('paymentEnabled');
    // Default to enabled if not set
    return saved === null ? true : saved === 'true';
}

function togglePaymentSection() {
    const toggle = document.getElementById('paymentToggle');
    const content = document.getElementById('paymentContent');
    const disabledMessage = document.getElementById('paymentDisabledMessage');
    const toggleLabel = toggle?.parentElement?.querySelector('.toggle-label');
    
    const isEnabled = toggle?.checked || false;
    
    // Save preference
    localStorage.setItem('paymentEnabled', isEnabled.toString());
    
    // Update UI
    if (content) {
        content.style.display = isEnabled ? 'block' : 'none';
    }
    if (disabledMessage) {
        disabledMessage.style.display = isEnabled ? 'none' : 'block';
    }
    if (toggleLabel) {
        toggleLabel.textContent = isEnabled ? 'Enabled' : 'Disabled';
    }
    
    // Show toast
    showToast(`Payment tracking ${isEnabled ? 'enabled' : 'disabled'}`, 'success');
}

// ===================================
// Check-in/Check-out Timing Functions
// ===================================

// Check if check-in button should be disabled based on timing
function isCheckinDisabled(booking) {
    // Already checked in
    if (booking.actualCheckIn) return true;
    
    // Check if it's before 11 AM on check-in day
    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    
    // Set check-in date to 11 AM
    const checkInTime = new Date(checkInDate);
    checkInTime.setHours(11, 0, 0, 0);
    
    // If current time is before 11 AM on check-in day, disable
    if (now < checkInTime) return true;
    
    return false;
}

// Get title/tooltip for check-in button
function getCheckinButtonTitle(booking) {
    if (booking.actualCheckIn) return 'Already checked in';
    
    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    const checkInTime = new Date(checkInDate);
    checkInTime.setHours(11, 0, 0, 0);
    
    if (now < checkInTime) {
        return `Check-in opens at 11:00 AM on ${formatDate(booking.checkIn)}`;
    }
    
    return 'Click to record guest check-in';
}

// Get timing notice message for the booking modal
function getTimingNotice(booking) {
    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    
    const checkInTime = new Date(checkInDate);
    checkInTime.setHours(11, 0, 0, 0);
    
    const checkOutTime = new Date(checkOutDate);
    checkOutTime.setHours(11, 0, 0, 0);
    
    // If not checked in yet and before check-in time
    if (!booking.actualCheckIn && now < checkInTime) {
        const timeUntil = getTimeUntil(checkInTime);
        return `<div class="timing-notice info">
            <i class="fas fa-clock"></i> 
            Check-in opens at 11:00 AM on ${formatDate(booking.checkIn)} (${timeUntil})
        </div>`;
    }
    
    // If checked in but not checked out, and approaching auto-checkout time
    if (booking.actualCheckIn && !booking.actualCheckOut) {
        const hoursUntilAutoCheckout = (checkOutTime - now) / (1000 * 60 * 60);
        
        if (hoursUntilAutoCheckout <= 24 && hoursUntilAutoCheckout > 0) {
            const timeUntil = getTimeUntil(checkOutTime);
            return `<div class="timing-notice warning">
                <i class="fas fa-exclamation-triangle"></i> 
                Auto-checkout in ${timeUntil} (at 11:00 AM on ${formatDate(booking.checkOut)})
            </div>`;
        } else if (hoursUntilAutoCheckout <= 0) {
            return `<div class="timing-notice danger">
                <i class="fas fa-exclamation-circle"></i> 
                Auto-checkout pending - click Check-Out or Extend now
            </div>`;
        }
    }
    
    return '';
}

// Helper to format time until a date
function getTimeUntil(targetDate) {
    const now = new Date();
    const diff = targetDate - now;
    
    if (diff <= 0) return 'now';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes} minutes`;
    }
}

// Extend booking stay by 1 day
async function extendBooking(bookingId) {
    const extendBtn = document.querySelector('.extend-btn');
    if (extendBtn) {
        extendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Extending...';
        extendBtn.disabled = true;
    }
    
    try {
        const response = await fetch(`/api/booking/${bookingId}/extend`, {
            method: 'PUT',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            // Refresh the modal to show updated dates
            await viewBooking(bookingId);
            // Reload bookings list
            loadBookings();
        } else {
            showToast(data.message || 'Error extending booking', 'error');
            if (extendBtn) {
                extendBtn.innerHTML = '<i class="fas fa-calendar-plus"></i> Extend';
                extendBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('Extend booking error:', error);
        showToast('Error extending booking', 'error');
        if (extendBtn) {
            extendBtn.innerHTML = '<i class="fas fa-calendar-plus"></i> Extend';
            extendBtn.disabled = false;
        }
    }
}

// ===================================
// Settings Functions
// ===================================

async function loadSettings() {
    try {
        const response = await fetch('/api/settings/admin', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            const settings = data.data;
            
            // Populate offer settings
            document.getElementById('offerEnabled').checked = settings.offerEnabled;
            document.getElementById('offerName').value = settings.offerName || '';
            document.getElementById('offerDiscount').value = settings.offerDiscount || 30;
            document.getElementById('offerDescription').value = settings.offerDescription || '';
            
            // Format date for input
            if (settings.offerExpiry) {
                const expiryDate = new Date(settings.offerExpiry);
                document.getElementById('offerExpiry').value = expiryDate.toISOString().split('T')[0];
            }
            
            // Load offer image
            if (settings.offerImage) {
                document.getElementById('offerPreviewImg').src = '../' + settings.offerImage;
            }
            
            // Populate couple section settings
            document.getElementById('coupleSectionEnabled').checked = settings.coupleSectionEnabled;
            updateCoupleStatusText(settings.coupleSectionEnabled);
            
            // Setup toggle listeners and image upload
            setupSettingsListeners();
            setupImageUpload();
        }
    } catch (error) {
        console.error('Load settings error:', error);
        showToast('Error loading settings', 'error');
    }
}

function setupSettingsListeners() {
    // Couple section toggle - update preview text
    const coupleToggle = document.getElementById('coupleSectionEnabled');
    coupleToggle.addEventListener('change', (e) => {
        updateCoupleStatusText(e.target.checked);
    });
    
    // Save settings button
    const saveBtn = document.getElementById('saveSettingsBtn');
    saveBtn.addEventListener('click', saveSettings);
}

// Flag to prevent duplicate listeners
let imageUploadInitialized = false;

function updateCoupleStatusText(enabled) {
    const statusText = document.getElementById('coupleStatusText');
    if (enabled) {
        statusText.className = 'preview-status enabled';
        statusText.innerHTML = '<i class="fas fa-check-circle"></i> Visible on Main Page';
    } else {
        statusText.className = 'preview-status disabled';
        statusText.innerHTML = '<i class="fas fa-times-circle"></i> Hidden from Main Page';
    }
}

async function saveSettings() {
    const btn = document.getElementById('saveSettingsBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;
    
    try {
        const settings = {
            offerEnabled: document.getElementById('offerEnabled').checked,
            offerName: document.getElementById('offerName').value,
            offerDiscount: parseInt(document.getElementById('offerDiscount').value) || 30,
            offerDescription: document.getElementById('offerDescription').value,
            offerExpiry: document.getElementById('offerExpiry').value,
            coupleSectionEnabled: document.getElementById('coupleSectionEnabled').checked
        };
        
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(settings)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Settings saved successfully!', 'success');
            
            // Show saved message
            const savedMsg = document.getElementById('settingsSavedMsg');
            savedMsg.style.display = 'flex';
            setTimeout(() => {
                savedMsg.style.display = 'none';
            }, 3000);
        } else {
            showToast(data.message || 'Error saving settings', 'error');
        }
    } catch (error) {
        console.error('Save settings error:', error);
        showToast('Error saving settings', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Store selected file for upload
let selectedOfferImage = null;

function setupImageUpload() {
    const fileInput = document.getElementById('offerImageInput');
    const chooseBtn = document.getElementById('chooseImageBtn');
    const uploadBtn = document.getElementById('uploadImageBtn');
    const previewImg = document.getElementById('offerPreviewImg');
    
    // Choose image button click
    chooseBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File selected
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image must be less than 5MB', 'error');
                return;
            }
            
            // Validate file type
            if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
                showToast('Please select a valid image file', 'error');
                return;
            }
            
            selectedOfferImage = file;
            
            // Preview the image
            const reader = new FileReader();
            reader.onload = (event) => {
                previewImg.src = event.target.result;
            };
            reader.readAsDataURL(file);
            
            // Show upload button
            uploadBtn.style.display = 'flex';
        }
    });
    
    // Upload button click
    uploadBtn.addEventListener('click', uploadOfferImage);
}

async function uploadOfferImage() {
    if (!selectedOfferImage) {
        showToast('Please select an image first', 'error');
        return;
    }
    
    const uploadBtn = document.getElementById('uploadImageBtn');
    const originalText = uploadBtn.innerHTML;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    uploadBtn.classList.add('uploading');
    uploadBtn.disabled = true;
    
    try {
        const formData = new FormData();
        formData.append('offerImage', selectedOfferImage);
        
        const response = await fetch('/api/settings/upload-offer-image', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Image uploaded successfully!', 'success');
            selectedOfferImage = null;
            uploadBtn.style.display = 'none';
        } else {
            showToast(data.message || 'Error uploading image', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Error uploading image', 'error');
    } finally {
        uploadBtn.innerHTML = originalText;
        uploadBtn.classList.remove('uploading');
        uploadBtn.disabled = false;
    }
}



// ===================================
// Dining & Menu Management
// ===================================

async function loadMenu() {
    try {
        const response = await fetch('/api/menu/all', { credentials: 'include' });
        const data = await response.json(); // Array of items
        menuItems = data;
        renderMenu(menuItems);
    } catch (error) {
        console.error('Error loading menu:', error);
        showToast('Error loading menu', 'error');
    }
}

function renderMenu(items) {
    const tbody = document.getElementById('menuTableBody');
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No menu items found</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>
                <img src="${item.image || 'images/menu-placeholder.png'}" alt="Item" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
            </td>
            <td><strong>${escapeHtml(item.name)}</strong>${item.isVegetarian ? ' <span style="color:green;" title="Veg">●</span>' : ' <span style="color:red;" title="Non-Veg">●</span>'}</td>
            <td>${escapeHtml(item.category)}</td>
            <td>₹${item.price}</td>
            <td>
                ${item.isAvailable 
                    ? '<span class="status-badge confirmed">Available</span>' 
                    : '<span class="status-badge cancelled">Unavailable</span>'}
            </td>
            <td>
                <button class="action-btn view" onclick="openEditMenuModal('${item._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteMenuItem('${item._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function loadFoodOrders() {
    try {
        const response = await fetch('/api/orders', { credentials: 'include' });
        const data = await response.json(); // Array of orders
        foodOrders = data;
        
        // Update badge
        const pendingCount = foodOrders.filter(o => o.status === 'Pending').length;
        const badge = document.getElementById('orderPendingBadge');
        badge.textContent = pendingCount;
        badge.style.display = pendingCount > 0 ? 'inline' : 'none';

        renderFoodOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function renderFoodOrders() {
    let filtered = foodOrders;
    if (foodOrderFilter !== 'all') {
        filtered = foodOrders.filter(o => o.status === foodOrderFilter);
    }

    const tbody = document.getElementById('ordersTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem;">No orders found</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(order => `
        <tr>
            <td><small>#${order._id.slice(-6)}</small></td>
            <td>${escapeHtml(order.customerDetails.name)}</td>
            <td>${escapeHtml(order.customerDetails.roomNumber)}</td>
            <td>
                <small>${order.items.map(i => `${i.quantity}x ${i.name}`).join('<br>')}</small>
            </td>
            <td><strong>₹${order.totalAmount}</strong></td>
            <td><span class="status-badge ${order.status.toLowerCase()}">${order.status}</span></td>
            <td>${formatDateTime(order.createdAt)}</td>
            <td>
                <select onchange="updateOrderStatus('${order._id}', this.value)" style="padding: 4px; border-radius: 4px;">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                    <option value="Ready" ${order.status === 'Ready' ? 'selected' : ''}>Ready</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
        </tr>
    `).join('');
}

async function handleMenuSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('menuItemId').value;
    const isEdit = !!id;

    const payload = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        price: Number(document.getElementById('itemPrice').value),
        description: document.getElementById('itemDescription').value,
        image: document.getElementById('itemImage').value,
        isVegetarian: document.getElementById('itemVegetarian').checked,
        isAvailable: document.getElementById('itemAvailable').checked
    };

    try {
        const url = isEdit ? `/api/menu/${id}` : '/api/menu';
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast(`Item ${isEdit ? 'updated' : 'added'} successfully`, 'success');
            closeMenuModal();
            loadMenu();
        } else {
            showToast('Error saving item', 'error');
        }
    } catch (error) {
        console.error('Save error:', error);
        showToast('Error saving item', 'error');
    }
}

async function deleteMenuItem(id) {
    if (!confirm('Delete this menu item?')) return;
    try {
        const response = await fetch(`/api/menu/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (response.ok) {
            showToast('Item deleted', 'success');
            loadMenu();
        } else {
            showToast('Error deleting item', 'error');
        }
    } catch (error) {
        showToast('Error deleting item', 'error');
    }
}

async function updateOrderStatus(id, status) {
    try {
        const response = await fetch(`/api/orders/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status })
        });
        if (response.ok) {
            showToast(`Order marked as ${status}`, 'success');
            loadFoodOrders();
        }
    } catch (error) {
        showToast('Error updating status', 'error');
    }
}

// Modal Helpers
function openAddMenuModal() {
    document.getElementById('menuForm').reset();
    document.getElementById('menuItemId').value = '';
    document.getElementById('menuModalTitle').textContent = 'Add Menu Item';
    document.getElementById('menuModal').classList.add('show');
}

function openEditMenuModal(id) {
    const item = menuItems.find(i => i._id === id);
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
    document.getElementById('menuModal').classList.add('show');
}

function closeMenuModal() {
    document.getElementById('menuModal').classList.remove('show');
}

// Initial Load Call if on Dining Page (handled in loadDashboard)
