// Global Variables
let currentSection = 'dashboard';
let products = [];
let customers = [];
let sales = [];
let currentSale = {
    items: [],
    customer: null,
    total: 0
};
let isAdminMode = false;
const ADMIN_PASSWORD = 'CAFE2024'; // Cambiar por una contraseña más segura

// API Base URL - works both locally and on Railway
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

// DOM Elements
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const sections = document.querySelectorAll('.section');
const menuItems = document.querySelectorAll('.menu-item');
const loadingSpinner = document.getElementById('loadingSpinner');
const toastContainer = document.getElementById('toastContainer');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

// App Initialization
async function initializeApp() {
    showLoading();
    try {
        await loadProducts();
        await loadCustomers();
        await loadSales();
        updateDashboard();
        showToast('Aplicación cargada correctamente', 'success');
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('Error al cargar la aplicación', 'error');
    } finally {
        hideLoading();
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Menu Navigation
    menuToggle.addEventListener('click', toggleSidebar);
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            navigateToSection(section);
        });
    });

    // Download Excel Button
    const downloadExcelBtn = document.getElementById('downloadExcelBtn');
    if (downloadExcelBtn) {
        downloadExcelBtn.addEventListener('click', downloadExcelData);
    }

    // Admin Toggle Button
    const adminToggle = document.getElementById('adminToggle');
    if (adminToggle) {
        adminToggle.addEventListener('click', toggleAdminMode);
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target) &&
            sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });

    // Products Event Listeners
    setupProductsEventListeners();
    
    // Sales Event Listeners
    setupSalesEventListeners();
    
    // Customers Event Listeners
    setupCustomersEventListeners();
    
    // Inventory Event Listeners
    setupInventoryEventListeners();
    
    // Modal Event Listeners
    setupModalEventListeners();
}

// Navigation Functions
function toggleSidebar() {
    sidebar.classList.toggle('open');
}

function navigateToSection(sectionName) {
    // Update active menu item
    menuItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update active section
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionName).classList.add('active');
    
    currentSection = sectionName;
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }
    
    // Update section content
    switch(sectionName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'products':
            renderProducts();
            break;
        case 'inventory':
            renderInventory();
            break;
        case 'sales':
            renderSales();
            break;
        case 'customers':
            renderCustomers();
            break;
    }
}

// Utility Functions
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('currentDateTime').textContent = 
        now.toLocaleDateString('es-ES', options);
}

function showLoading() {
    loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${getToastIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

// API Functions
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        // Return mock data for development
        return getMockData(endpoint, method, data);
    }
}

// Mock Data Functions (for development)
function getMockData(endpoint, method, data) {
    if (endpoint === '/products') {
        if (method === 'GET') return products;
        if (method === 'POST') {
            const newProduct = { ...data, id: generateId() };
            products.push(newProduct);
            return newProduct;
        }
    }
    
    if (endpoint === '/customers') {
        if (method === 'GET') return customers;
        if (method === 'POST') {
            const newCustomer = { ...data, id: generateId(), totalPurchases: 0, lastPurchase: null };
            customers.push(newCustomer);
            return newCustomer;
        }
    }
    
    if (endpoint === '/sales') {
        if (method === 'GET') return sales;
        if (method === 'POST') {
            const newSale = { 
                ...data, 
                id: generateId(), 
                date: new Date().toISOString(),
                total: data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            };
            sales.push(newSale);
            
            // Update product stock
            data.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    product.stock -= item.quantity;
                }
            });
            
            return newSale;
        }
    }
    
    return [];
}

// Data Loading Functions
async function loadProducts() {
    try {
        products = await apiCall('/products');
        if (products.length === 0) {
            // Initialize with sample data
            products = [
                {
                    id: 'prod_1',
                    name: 'Café Americano',
                    description: 'Café negro tradicional, fuerte y aromático',
                    category: 'bebidas-calientes',
                    price: 3500,
                    stock: 50,
                    minStock: 10,
                    image: null
                },
                {
                    id: 'prod_2',
                    name: 'Cappuccino',
                    description: 'Café con leche espumosa y canela',
                    category: 'bebidas-calientes',
                    price: 4500,
                    stock: 30,
                    minStock: 5,
                    image: null
                },
                {
                    id: 'prod_3',
                    name: 'Croissant',
                    description: 'Croissant francés recién horneado',
                    category: 'postres',
                    price: 2500,
                    stock: 8,
                    minStock: 10,
                    image: null
                },
                {
                    id: 'prod_4',
                    name: 'Jugo de Naranja',
                    description: 'Jugo natural de naranja recién exprimido',
                    category: 'bebidas-frias',
                    price: 3000,
                    stock: 25,
                    minStock: 5,
                    image: null
                }
            ];
        }
    } catch (error) {
        console.error('Error loading products:', error);
        products = [];
    }
}

async function loadCustomers() {
    try {
        customers = await apiCall('/customers');
        if (customers.length === 0) {
            // Initialize with sample data
            customers = [
                {
                    id: 'cust_1',
                    name: 'María García',
                    email: 'maria@email.com',
                    phone: '300-123-4567',
                    totalPurchases: 15,
                    lastPurchase: '2024-01-15',
                    totalSpent: 67500
                },
                {
                    id: 'cust_2',
                    name: 'Juan Pérez',
                    email: 'juan@email.com',
                    phone: '300-987-6543',
                    totalPurchases: 8,
                    lastPurchase: '2024-01-14',
                    totalSpent: 36000
                }
            ];
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        customers = [];
    }
}

async function loadSales() {
    try {
        sales = await apiCall('/sales');
        if (sales.length === 0) {
            // Initialize with sample data
            sales = [
                {
                    id: 'sale_1',
                    date: '2024-01-15T10:30:00Z',
                    customerId: 'cust_1',
                    customerName: 'María García',
                    items: [
                        { productId: 'prod_1', productName: 'Café Americano', quantity: 2, price: 3500 },
                        { productId: 'prod_3', productName: 'Croissant', quantity: 1, price: 2500 }
                    ],
                    total: 9500
                },
                {
                    id: 'sale_2',
                    date: '2024-01-15T11:15:00Z',
                    customerId: null,
                    customerName: 'Cliente General',
                    items: [
                        { productId: 'prod_2', productName: 'Cappuccino', quantity: 1, price: 4500 }
                    ],
                    total: 4500
                }
            ];
        }
    } catch (error) {
        console.error('Error loading sales:', error);
        sales = [];
    }
}

// Dashboard Functions
function updateDashboard() {
    updateDashboardStats();
    renderRecentSales();
    renderStockAlerts();
}

function updateDashboardStats() {
    const today = new Date().toDateString();
    const todaySales = sales.filter(sale => 
        new Date(sale.date).toDateString() === today
    );
    
    const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const lowStockProducts = products.filter(product => product.stock <= product.minStock);
    
    document.getElementById('todaySales').textContent = formatCurrency(todayTotal);
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('lowStockItems').textContent = lowStockProducts.length;
    document.getElementById('totalCustomers').textContent = customers.length;
}

function renderRecentSales() {
    const recentSales = sales.slice(-5).reverse();
    const container = document.getElementById('recentSalesList');
    
    if (recentSales.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light);">No hay ventas registradas</p>';
        return;
    }
    
    container.innerHTML = recentSales.map(sale => `
        <div style="padding: 1rem; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${sale.customerName}</strong>
                <br>
                <small style="color: var(--text-light);">${new Date(sale.date).toLocaleDateString('es-ES')} - ${new Date(sale.date).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}</small>
            </div>
            <div style="text-align: right;">
                <strong style="color: var(--coffee-green);">${formatCurrency(sale.total)}</strong>
                <br>
                <small style="color: var(--text-light);">${sale.items.length} producto(s)</small>
            </div>
        </div>
    `).join('');
}

function renderStockAlerts() {
    const lowStockProducts = products.filter(product => product.stock <= product.minStock);
    const container = document.getElementById('stockAlerts');
    
    if (lowStockProducts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light);">No hay alertas de stock</p>';
        return;
    }
    
    container.innerHTML = lowStockProducts.map(product => `
        <div style="padding: 1rem; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${product.name}</strong>
                <br>
                <small style="color: var(--text-light);">${getCategoryName(product.category)}</small>
            </div>
            <div style="text-align: right;">
                <span class="status-badge ${product.stock === 0 ? 'status-critical' : 'status-low'}">
                    ${product.stock} disponibles
                </span>
            </div>
        </div>
    `).join('');
}

// Products Functions
function setupProductsEventListeners() {
    const addProductBtn = document.getElementById('addProductBtn');
    const productSearch = document.getElementById('productSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const gridView = document.getElementById('gridView');
    const listView = document.getElementById('listView');
    
    addProductBtn.addEventListener('click', () => openProductModal());
    productSearch.addEventListener('input', filterProducts);
    categoryFilter.addEventListener('change', filterProducts);
    gridView.addEventListener('click', () => setProductView('grid'));
    listView.addEventListener('click', () => setProductView('list'));
}

function renderProducts() {
    filterProducts();
}

function filterProducts() {
    const search = document.getElementById('productSearch').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    
    let filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(search) ||
                            product.description.toLowerCase().includes(search);
        const matchesCategory = !category || product.category === category;
        return matchesSearch && matchesCategory;
    });
    
    renderProductsGrid(filteredProducts);
}

function renderProductsGrid(productsToShow) {
    const container = document.getElementById('productsGrid');
    
    if (productsToShow.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light); grid-column: 1/-1;">No se encontraron productos</p>';
        return;
    }
    
    container.innerHTML = productsToShow.map(product => `
        <div class="product-card">
            <div class="product-image">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}">` : 
                    '<i class="fas fa-coffee"></i>'
                }
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-details">
                    <span class="product-price">${formatCurrency(product.price)}</span>
                    <span class="product-stock ${product.stock <= product.minStock ? 'stock-low' : ''}">
                        ${product.stock} disponibles
                    </span>
                </div>
                <div class="product-actions">
                    <button class="btn-icon btn-edit" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function setProductView(view) {
    const gridBtn = document.getElementById('gridView');
    const listBtn = document.getElementById('listView');
    
    if (view === 'grid') {
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
        document.getElementById('productsGrid').className = 'products-grid';
    } else {
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
        document.getElementById('productsGrid').className = 'products-list';
    }
}

function getCategoryName(category) {
    const categories = {
        'bebidas-calientes': 'Bebidas Calientes',
        'bebidas-frias': 'Bebidas Frías',
        'postres': 'Postres',
        'snacks': 'Snacks',
        'otros': 'Otros'
    };
    return categories[category] || category;
}

async function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        openProductModal(product);
    }
}

async function deleteProduct(productId) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        showLoading();
        try {
            await apiCall(`/products/${productId}`, 'DELETE');
            products = products.filter(p => p.id !== productId);
            renderProducts();
            updateDashboard();
            showToast('Producto eliminado correctamente', 'success');
        } catch (error) {
            showToast('Error al eliminar el producto', 'error');
        } finally {
            hideLoading();
        }
    }
}

// Inventory Functions
function setupInventoryEventListeners() {
    const updateStockBtn = document.getElementById('updateStockBtn');
    updateStockBtn.addEventListener('click', () => {
        showToast('Selecciona un producto para actualizar su stock', 'info');
    });
}

function renderInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-light);">No hay productos en el inventario</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(product => {
        const status = getStockStatus(product);
        return `
            <tr>
                <td>
                    <strong>${product.name}</strong>
                    <br>
                    <small style="color: var(--text-light);">${product.description}</small>
                </td>
                <td>${getCategoryName(product.category)}</td>
                <td>${product.stock}</td>
                <td>${product.minStock}</td>
                <td>
                    <span class="status-badge ${status.class}">${status.text}</span>
                </td>
                <td>
                    <button class="btn-icon btn-edit" onclick="openStockModal('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function getStockStatus(product) {
    if (product.stock === 0) {
        return { class: 'status-critical', text: 'Agotado' };
    } else if (product.stock <= product.minStock) {
        return { class: 'status-low', text: 'Stock Bajo' };
    } else {
        return { class: 'status-normal', text: 'Normal' };
    }
}

function openStockModal(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        document.getElementById('stockProduct').value = product.name;
        document.getElementById('stockCurrent').value = product.stock;
        document.getElementById('stockNew').value = product.stock;
        document.getElementById('stockModal').classList.add('active');
        document.getElementById('stockModal').dataset.productId = productId;
    }
}

// Sales Functions
function setupSalesEventListeners() {
    const newSaleBtn = document.getElementById('newSaleBtn');
    const cancelSaleBtn = document.getElementById('cancelSaleBtn');
    const completeSaleBtn = document.getElementById('completeSaleBtn');
    const saleProductSearch = document.getElementById('saleProductSearch');
    
    newSaleBtn.addEventListener('click', startNewSale);
    cancelSaleBtn.addEventListener('click', cancelSale);
    completeSaleBtn.addEventListener('click', completeSale);
    saleProductSearch.addEventListener('input', searchProductsForSale);
    
    // Setup customer select
    updateCustomerSelect();
}

function renderSales() {
    renderSalesHistory();
}

function startNewSale() {
    currentSale = { items: [], customer: null, total: 0 };
    document.getElementById('saleFormContainer').style.display = 'block';
    document.getElementById('customerSelect').value = '';
    document.getElementById('saleProductSearch').value = '';
    document.getElementById('productSuggestions').style.display = 'none';
    renderSaleItems();
    updateSaleTotal();
}

function cancelSale() {
    document.getElementById('saleFormContainer').style.display = 'none';
    currentSale = { items: [], customer: null, total: 0 };
}

async function completeSale() {
    if (currentSale.items.length === 0) {
        showToast('Agrega al menos un producto a la venta', 'warning');
        return;
    }
    
    const customerId = document.getElementById('customerSelect').value;
    const customer = customers.find(c => c.id === customerId);
    
    const saleData = {
        customerId: customerId || null,
        customerName: customer ? customer.name : 'Cliente General',
        items: currentSale.items,
        total: currentSale.total
    };
    
    showLoading();
    try {
        await apiCall('/sales', 'POST', saleData);
        showToast('Venta registrada correctamente ✓', 'success');
        
        // Show ticket option
        setTimeout(() => {
            if (confirm('¿Desea imprimir el ticket para el cliente?')) {
                showTicket(saleData, customer);
                // Auto-open print dialog after ticket is shown
                setTimeout(() => {
                    printTicket();
                }, 300);
            }
        }, 500);
        
        cancelSale();
        renderSales();
        updateDashboard();
        
        // Update customer stats if applicable
        if (customer) {
            customer.totalPurchases++;
            customer.lastPurchase = new Date().toISOString().split('T')[0];
            customer.totalSpent = (customer.totalSpent || 0) + currentSale.total;
        }
    } catch (error) {
        showToast('Error al registrar la venta', 'error');
    } finally {
        hideLoading();
    }
}

function searchProductsForSale() {
    const search = document.getElementById('saleProductSearch').value.toLowerCase();
    const suggestions = document.getElementById('productSuggestions');
    
    if (search.length < 2) {
        suggestions.style.display = 'none';
        return;
    }
    
    const matchingProducts = products.filter(product => 
        product.name.toLowerCase().includes(search) && product.stock > 0
    );
    
    if (matchingProducts.length === 0) {
        suggestions.style.display = 'none';
        return;
    }
    
    suggestions.innerHTML = matchingProducts.map(product => `
        <div class="suggestion-item" onclick="addProductToSale('${product.id}')">
            <strong>${product.name}</strong> - ${formatCurrency(product.price)}
            <br>
            <small>Stock: ${product.stock}</small>
        </div>
    `).join('');
    
    suggestions.style.display = 'block';
}

function addProductToSale(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock === 0) {
        showToast('Producto no disponible', 'warning');
        return;
    }
    
    const existingItem = currentSale.items.find(item => item.productId === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            showToast('No hay suficiente stock', 'warning');
            return;
        }
    } else {
        currentSale.items.push({
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: 1
        });
    }
    
    document.getElementById('saleProductSearch').value = '';
    document.getElementById('productSuggestions').style.display = 'none';
    renderSaleItems();
    updateSaleTotal();
}

function renderSaleItems() {
    const container = document.getElementById('saleItems');
    
    if (currentSale.items.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light);">No hay productos en la venta</p>';
        return;
    }
    
    container.innerHTML = currentSale.items.map((item, index) => `
        <div class="sale-item">
            <div class="sale-item-info">
                <strong>${item.productName}</strong>
                <br>
                <small>${formatCurrency(item.price)} c/u</small>
            </div>
            <div class="sale-item-controls">
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="updateSaleItemQuantity(${index}, -1)">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                           onchange="setSaleItemQuantity(${index}, this.value)">
                    <button class="quantity-btn" onclick="updateSaleItemQuantity(${index}, 1)">+</button>
                </div>
                <strong>${formatCurrency(item.price * item.quantity)}</strong>
                <button class="btn-icon btn-delete" onclick="removeSaleItem(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateSaleItemQuantity(index, change) {
    const item = currentSale.items[index];
    const product = products.find(p => p.id === item.productId);
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
        removeSaleItem(index);
        return;
    }
    
    if (newQuantity > product.stock) {
        showToast('No hay suficiente stock', 'warning');
        return;
    }
    
    item.quantity = newQuantity;
    renderSaleItems();
    updateSaleTotal();
}

function setSaleItemQuantity(index, quantity) {
    const item = currentSale.items[index];
    const product = products.find(p => p.id === item.productId);
    const newQuantity = parseInt(quantity);
    
    if (newQuantity <= 0) {
        removeSaleItem(index);
        return;
    }
    
    if (newQuantity > product.stock) {
        showToast('No hay suficiente stock', 'warning');
        item.quantity = product.stock;
    } else {
        item.quantity = newQuantity;
    }
    
    renderSaleItems();
    updateSaleTotal();
}

function removeSaleItem(index) {
    currentSale.items.splice(index, 1);
    renderSaleItems();
    updateSaleTotal();
}

function updateSaleTotal() {
    currentSale.total = currentSale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('saleTotal').textContent = formatCurrency(currentSale.total);
}

function updateCustomerSelect() {
    const select = document.getElementById('customerSelect');
    select.innerHTML = '<option value="">Cliente general</option>' +
        customers.map(customer => `
            <option value="${customer.id}">${customer.name}</option>
        `).join('');
}

function renderSalesHistory() {
    const tbody = document.getElementById('salesTableBody');
    
    if (sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-light);">No hay ventas registradas</td></tr>';
        return;
    }
    
    const recentSales = sales.slice().reverse();
    
    tbody.innerHTML = recentSales.map(sale => `
        <tr>
            <td>
                ${new Date(sale.date).toLocaleDateString('es-ES')}
                <br>
                <small>${new Date(sale.date).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}</small>
            </td>
            <td>${sale.customerName}</td>
            <td>
                ${sale.items.map(item => `${item.productName} (${item.quantity})`).join(', ')}
            </td>
            <td><strong>${formatCurrency(sale.total)}</strong></td>
            <td>
                <button class="btn-icon btn-edit" onclick="viewSaleDetails('${sale.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function viewSaleDetails(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
        const details = `
            Venta: ${sale.id}
            Fecha: ${new Date(sale.date).toLocaleDateString('es-ES')} ${new Date(sale.date).toLocaleTimeString('es-ES')}
            Cliente: ${sale.customerName}
            
            Productos:
            ${sale.items.map(item => `• ${item.productName} x${item.quantity} = ${formatCurrency(item.price * item.quantity)}`).join('\n')}
            
            Total: ${formatCurrency(sale.total)}
        `;
        alert(details);
    }
}

// Customers Functions
function setupCustomersEventListeners() {
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    addCustomerBtn.addEventListener('click', () => openCustomerModal());
}

function renderCustomers() {
    const container = document.getElementById('customersGrid');
    
    if (customers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light); grid-column: 1/-1;">No hay clientes registrados</p>';
        return;
    }
    
    container.innerHTML = customers.map(customer => `
        <div class="customer-card">
            <div class="customer-avatar">
                ${customer.name.charAt(0).toUpperCase()}
            </div>
            <h3 class="customer-name">${customer.name}</h3>
            <div class="customer-info">
                ${customer.email ? `<div><i class="fas fa-envelope"></i> ${customer.email}</div>` : ''}
                ${customer.phone ? `<div><i class="fas fa-phone"></i> ${customer.phone}</div>` : ''}
            </div>
            <div class="customer-stats">
                <div class="customer-stat">
                    <div class="customer-stat-value">${customer.totalPurchases || 0}</div>
                    <div class="customer-stat-label">Compras</div>
                </div>
                <div class="customer-stat">
                    <div class="customer-stat-value">${formatCurrency(customer.totalSpent || 0)}</div>
                    <div class="customer-stat-label">Total</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Modal Functions
function setupModalEventListeners() {
    // Product Modal
    const productModal = document.getElementById('productModal');
    const closeProductModal = document.getElementById('closeProductModal');
    const cancelProductBtn = document.getElementById('cancelProductBtn');
    const productForm = document.getElementById('productForm');
    
    closeProductModal.addEventListener('click', () => closeModal('productModal'));
    cancelProductBtn.addEventListener('click', () => closeModal('productModal'));
    productForm.addEventListener('submit', handleProductSubmit);
    
    // Customer Modal
    const customerModal = document.getElementById('customerModal');
    const closeCustomerModal = document.getElementById('closeCustomerModal');
    const cancelCustomerBtn = document.getElementById('cancelCustomerBtn');
    const customerForm = document.getElementById('customerForm');
    
    closeCustomerModal.addEventListener('click', () => closeModal('customerModal'));
    cancelCustomerBtn.addEventListener('click', () => closeModal('customerModal'));
    customerForm.addEventListener('submit', handleCustomerSubmit);
    
    // Stock Modal
    const stockModal = document.getElementById('stockModal');
    const closeStockModal = document.getElementById('closeStockModal');
    const cancelStockBtn = document.getElementById('cancelStockBtn');
    const stockForm = document.getElementById('stockForm');
    
    closeStockModal.addEventListener('click', () => closeModal('stockModal'));
    cancelStockBtn.addEventListener('click', () => closeModal('stockModal'));
    stockForm.addEventListener('submit', handleStockSubmit);
    
    // Close modals when clicking outside
    [productModal, customerModal, stockModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

function openProductModal(product = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm');
    
    if (product) {
        title.textContent = 'Editar Producto';
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productMinStock').value = product.minStock;
        modal.dataset.productId = product.id;
    } else {
        title.textContent = 'Nuevo Producto';
        form.reset();
        delete modal.dataset.productId;
    }
    
    modal.classList.add('active');
}

function openCustomerModal(customer = null) {
    const modal = document.getElementById('customerModal');
    const title = document.getElementById('customerModalTitle');
    const form = document.getElementById('customerForm');
    
    if (customer) {
        title.textContent = 'Editar Cliente';
        document.getElementById('customerName').value = customer.name;
        document.getElementById('customerEmail').value = customer.email || '';
        document.getElementById('customerPhone').value = customer.phone || '';
        modal.dataset.customerId = customer.id;
    } else {
        title.textContent = 'Nuevo Cliente';
        form.reset();
        delete modal.dataset.customerId;
    }
    
    modal.classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const modal = document.getElementById('productModal');
    const isEdit = modal.dataset.productId;
    
    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        minStock: parseInt(document.getElementById('productMinStock').value),
        image: null // File upload would be handled separately
    };
    
    showLoading();
    try {
        if (isEdit) {
            await apiCall(`/products/${isEdit}`, 'PUT', productData);
            const productIndex = products.findIndex(p => p.id === isEdit);
            products[productIndex] = { ...products[productIndex], ...productData };
            showToast('Producto actualizado correctamente', 'success');
        } else {
            const newProduct = await apiCall('/products', 'POST', productData);
            showToast('Producto creado correctamente', 'success');
        }
        
        closeModal('productModal');
        renderProducts();
        updateDashboard();
    } catch (error) {
        showToast('Error al guardar el producto', 'error');
    } finally {
        hideLoading();
    }
}

async function handleCustomerSubmit(e) {
    e.preventDefault();
    
    const modal = document.getElementById('customerModal');
    const isEdit = modal.dataset.customerId;
    
    const customerData = {
        name: document.getElementById('customerName').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value
    };
    
    showLoading();
    try {
        if (isEdit) {
            await apiCall(`/customers/${isEdit}`, 'PUT', customerData);
            const customerIndex = customers.findIndex(c => c.id === isEdit);
            customers[customerIndex] = { ...customers[customerIndex], ...customerData };
            showToast('Cliente actualizado correctamente', 'success');
        } else {
            const newCustomer = await apiCall('/customers', 'POST', customerData);
            showToast('Cliente creado correctamente', 'success');
        }
        
        closeModal('customerModal');
        renderCustomers();
        updateCustomerSelect();
        updateDashboard();
    } catch (error) {
        showToast('Error al guardar el cliente', 'error');
    } finally {
        hideLoading();
    }
}

async function handleStockSubmit(e) {
    e.preventDefault();
    
    const modal = document.getElementById('stockModal');
    const productId = modal.dataset.productId;
    const newStock = parseInt(document.getElementById('stockNew').value);
    
    showLoading();
    try {
        await apiCall(`/products/${productId}/stock`, 'PUT', { stock: newStock });
        const product = products.find(p => p.id === productId);
        product.stock = newStock;
        
        closeModal('stockModal');
        renderInventory();
        updateDashboard();
        showToast('Stock actualizado correctamente', 'success');
    } catch (error) {
        showToast('Error al actualizar el stock', 'error');
    } finally {
        hideLoading();
    }
}

// Admin Mode Functions
function toggleAdminMode(e) {
    e.preventDefault();
    
    if (isAdminMode) {
        // Salir del modo admin
        exitAdminMode();
    } else {
        // Entrar al modo admin
        enterAdminMode();
    }
}

function enterAdminMode() {
    const password = prompt('Introduce la contraseña de administrador:');
    
    if (password === ADMIN_PASSWORD) {
        isAdminMode = true;
        document.body.classList.add('admin-mode');
        document.getElementById('adminToggleText').textContent = 'Salir Admin';
        document.getElementById('adminToggle').classList.add('active');
        
        // Mostrar elementos solo para admin
        document.querySelectorAll('.admin-only').forEach(element => {
            element.style.display = 'block';
        });
        
        showToast('Modo administrador activado', 'success');
    } else if (password !== null) {
        showToast('Contraseña incorrecta', 'error');
    }
}

function exitAdminMode() {
    isAdminMode = false;
    document.body.classList.remove('admin-mode');
    document.getElementById('adminToggleText').textContent = 'Modo Administrador';
    document.getElementById('adminToggle').classList.remove('active');
    
    // Ocultar elementos solo para admin
    document.querySelectorAll('.admin-only').forEach(element => {
        element.style.display = 'none';
    });
    
    showToast('Modo empleado activado', 'info');
}

// Download Excel Data Function
async function downloadExcelData() {
    if (!isAdminMode) {
        showToast('Función solo disponible para administradores', 'warning');
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/export/excel`);
        
        if (!response.ok) {
            throw new Error('Error al descargar archivo Excel');
        }
        
        // Get filename from response headers
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'cafe_data_export.xlsx';
        
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        
        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Excel descargado correctamente', 'success');
    } catch (error) {
        console.error('Error downloading Excel:', error);
        showToast('Error al descargar Excel', 'error');
    } finally {
        hideLoading();
    }
}

// Ticket System Functions
function generateTicketNumber() {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-6);
    return `#${timestamp}`;
}

function generateTicket(saleData, customerData = null) {
    const now = new Date();
    const ticketNumber = generateTicketNumber();
    
    const ticketHTML = `
        <div class="ticket-header">
            <div class="ticket-title">CAFÉ NARE BALNEARIO</div>
            <div>================================</div>
        </div>
        
        <div class="ticket-info">
            <div>Fecha: ${now.toLocaleDateString('es-CO')}</div>
            <div>Hora: ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
            <div>Ticket: ${ticketNumber}</div>
            <div>Cajero: Sistema</div>
        </div>
        
        ${customerData ? `
        <div class="ticket-info">
            <div>Cliente: ${customerData.name || 'Cliente General'}</div>
            ${customerData.phone ? `<div>Tel: ${customerData.phone}</div>` : ''}
        </div>
        ` : ''}
        
        <div class="ticket-items">
            <div style="display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 3px; margin-bottom: 5px;">
                <span>PRODUCTO</span>
                <span>TOTAL</span>
            </div>
            ${saleData.items.map(item => `
                <div class="ticket-item">
                    <div style="flex: 1;">
                        <div>${item.productName}</div>
                        <div style="font-size: 10px; color: #666;">
                            ${item.quantity} x $${item.price.toLocaleString('es-CO')}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        $${(item.price * item.quantity).toLocaleString('es-CO')}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="ticket-total">
            <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                <span>SUBTOTAL:</span>
                <span>$${saleData.total.toLocaleString('es-CO')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                <span>IVA (0%):</span>
                <span>$0</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 14px; border-top: 1px dashed #333; padding-top: 3px;">
                <span><strong>TOTAL:</strong></span>
                <span><strong>$${saleData.total.toLocaleString('es-CO')}</strong></span>
            </div>
        </div>
        
        <div class="ticket-footer">
            <div>¡GRACIAS POR SU COMPRA!</div>
            <div>Vuelva pronto</div>
            <div>@cafenarebalneario</div>
            <div>================================</div>
        </div>
    `;
    
    return ticketHTML;
}

function showTicket(saleData, customerData = null) {
    const ticketModal = document.getElementById('ticketModal');
    const ticketContent = document.getElementById('ticketContent');
    
    ticketContent.innerHTML = generateTicket(saleData, customerData);
    ticketModal.style.display = 'block';
}

function printTicket() {
    window.print();
}

function closeTicketModal() {
    document.getElementById('ticketModal').style.display = 'none';
}

// Initialize ticket modal events
document.addEventListener('DOMContentLoaded', function() {
    const ticketModal = document.getElementById('ticketModal');
    const closeBtn = document.getElementById('closeTicket');
    
    if (closeBtn) {
        closeBtn.onclick = closeTicketModal;
    }
    
    if (ticketModal) {
        window.onclick = function(event) {
            if (event.target == ticketModal) {
                closeTicketModal();
            }
        }
    }
});
