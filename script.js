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
let currentSaleData = null;
let currentCustomerData = null;
let isAdminMode = false;
const ADMIN_PASSWORD = 'CAFE2024'; // Cambiar por una contraseña más segura

// Variables para categorías de productos
let currentCategory = 'all';
let allProducts = [];

// API Base URL - works both locally and on Railway
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

// Loyverse API Configuration
const LOYVERSE_CONFIG = {
    baseUrl: 'https://api.loyverse.com/v1.0',
    accessToken: '', // Se configurará desde el panel admin
    storeId: '', // Se configurará desde el panel admin
    enabled: false
};

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
        // Cargar configuración de Loyverse
        loadLoyverseConfig();
        
        await loadProducts();
        await loadCustomers();
        await loadSales();
        updateDashboard();
        showToast('Aplicación cargada correctamente', 'success');
        
        // Mostrar estado de Loyverse si está en modo admin (sin prompts automáticos)
        if (isAdminMode && LOYVERSE_CONFIG.enabled) {
            showToast('Loyverse integrado ✓', 'info');
        }
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

    // Configure Loyverse Button
    const configureLoyverseBtn = document.getElementById('configureLoyverseBtn');
    if (configureLoyverseBtn) {
        configureLoyverseBtn.addEventListener('click', configureLoyverse);
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
    
    // Event Listeners para Venta Rápida
    setupVentaRapidaEventListeners();
}

// Navigation Functions
function toggleSidebar() {
    sidebar.classList.toggle('open');
}

function navigateToSection(sectionName) {
    // Update active menu item
    menuItems.forEach(item => item.classList.remove('active'));
    const menuItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (menuItem) {
        menuItem.classList.add('active');
    }
    
    // Update active section
    sections.forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    currentSection = sectionName;
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }
    
    // Update section content
    switch(sectionName) {
        case 'venta-rapida':
            renderVentaRapidaProducts('all'); // Cargar todos los productos por defecto
            break;
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
        
        // Siempre sincronizar allProducts con products
        allProducts = [...products]; // Usar los productos tal como están, manteniendo sus categorías originales
        
        // Si la API devuelve menos de 10 productos, cargar productos locales
        if (products.length < 10) {
            await loadLocalProducts();
        }
    } catch (error) {
        console.error('Error loading products from API:', error);
        // Si falla la API, cargar productos locales
        await loadLocalProducts();
    }
}

// Función para cargar productos del archivo local
async function loadLocalProducts() {
    try {
        const response = await fetch('./productos_inventario.json');
        
        if (response.ok) {
            const data = await response.json();
            const localProducts = data.products || [];
            
            // Intentar agregar cada producto local a la base de datos si no existe
            for (const product of localProducts) {
                try {
                    await apiCall('/products', 'POST', {
                        ...product,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                } catch (error) {
                    console.warn(`No se pudo agregar el producto ${product.name}:`, error);
                }
            }
            
            // Recargar productos desde la base de datos
            products = await apiCall('/products');
        } else {
            throw new Error(`No se pudo cargar el archivo de productos. Status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading local products:', error);
        // Initialize with sample data como fallback
        products = [
            {
                id: 'prod_1',
                name: 'Café Americano',
                description: 'Café Americano',
                category: 'bebidas',
                price: 8000,
                stock: 200,
                minStock: 20,
                image: null
            },
            {
                id: 'prod_2',
                name: 'Capuccino',
                description: 'Capuccino',
                category: 'bebidas',
                price: 8000,
                stock: 200,
                minStock: 20,
                image: null
            },
            {
                id: 'prod_3',
                name: 'Cerveza Budweiser',
                description: 'Cerveza Budweiser',
                category: 'cervezas',
                price: 8000,
                stock: 30,
                minStock: 5,
                image: null
            },
            {
                id: 'prod_4',
                name: 'HIDRA TAO',
                description: 'HIDRA TAO',
                category: 'liquidos',
                price: 7000,
                stock: 30,
                minStock: 5,
                image: null
            }
        ];
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
            // Eliminar del backend
            await apiCall(`/products/${productId}`, 'DELETE');
            
            // Eliminar de la variable local products
            products = products.filter(p => p.id !== productId);
            
            // Eliminar también de allProducts si existe
            if (allProducts.length > 0) {
                allProducts = allProducts.filter(p => p.id !== productId);
            }
            
            renderProducts();
            updateDashboard();
            
            // Si estamos en venta rápida, actualizar también esa vista
            if (currentSection === 'venta-rapida') {
                renderVentaRapidaProducts(currentCategory);
            }
            
            showToast('Producto eliminado correctamente', 'success');
        } catch (error) {
            console.error('Error al eliminar producto:', error);
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
    
    // Event listener para el botón de prueba de impresión
    const testPrintBtn = document.getElementById('testPrintBtn');
    if (testPrintBtn) {
        testPrintBtn.addEventListener('click', testPrintWithCurrentSale);
    }
    
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
        // Registrar venta en nuestro sistema
        await apiCall('/sales', 'POST', saleData);
        
        // Enviar a Loyverse API si está configurado
        const loyverseResult = await sendToLoyverse(saleData, customer);
        
        if (loyverseResult) {
            showToast('Venta registrada y enviada a Loyverse ✓', 'success');
            // Con Loyverse configurado, la impresión será automática
            showToast('Ticket enviado a impresora automáticamente 🖨️', 'info');
        } else {
            showToast('Venta registrada correctamente ✓', 'success');
            
            // Solo mostrar opción manual si Loyverse no está configurado
            setTimeout(() => {
                if (confirm('¿Desea imprimir el ticket para el cliente?')) {
                    // Generar documento de impresión automáticamente
                    generatePrintDocument(saleData, customer);
                    showToast('Documento de impresión generado. Selecciona tu impresora preferida.', 'success');
                }
            }, 500);
        }
        
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
    
    // Actualizar las opciones de categoría con todas las disponibles
    updateProductCategoryOptions();
    
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

// Función para actualizar las opciones de categoría en el modal
function updateProductCategoryOptions() {
    const categorySelect = document.getElementById('productCategory');
    if (!categorySelect) return;
    
    // Categorías actualizadas que incluyen las nuevas
    const categories = [
        { value: 'bebidas', label: 'Bebidas Café' },
        { value: 'cervezas', label: 'Cervezas' },
        { value: 'liquidos', label: 'Líquidos' },
        { value: 'snacks', label: 'Snacks' },
        { value: 'chocolates_cafe', label: 'Chocolates y Café' },
        { value: 'otros', label: 'Otros' }
    ];
    
    // Limpiar opciones existentes
    categorySelect.innerHTML = '';
    
    // Agregar nuevas opciones
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.value;
        option.textContent = category.label;
        categorySelect.appendChild(option);
    });
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
            // Actualizar en el backend
            const updatedProduct = await apiCall(`/products/${isEdit}`, 'PUT', productData);
            
            // Actualizar en la variable local
            const productIndex = products.findIndex(p => p.id === isEdit);
            if (productIndex !== -1) {
                products[productIndex] = { ...products[productIndex], ...productData };
            }
            
            // Actualizar también en allProducts si existe
            if (allProducts.length > 0) {
                const allProductIndex = allProducts.findIndex(p => p.id === isEdit);
                if (allProductIndex !== -1) {
                    allProducts[allProductIndex] = { ...allProducts[allProductIndex], ...productData };
                }
            }
            
            showToast('Producto actualizado correctamente', 'success');
        } else {
            // Crear nuevo producto
            const newProduct = await apiCall('/products', 'POST', productData);
            
            // Agregar a la variable local
            products.push(newProduct);
            
            // Agregar también a allProducts si existe
            if (allProducts.length > 0) {
                allProducts.push(newProduct);
            }
            
            showToast('Producto creado correctamente', 'success');
        }
        
        closeModal('productModal');
        renderProducts();
        updateDashboard();
        
        // Si estamos en venta rápida, actualizar también esa vista
        if (currentSection === 'venta-rapida') {
            renderVentaRapidaProducts(currentCategory);
        }
        
    } catch (error) {
        console.error('Error al guardar producto:', error);
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
        // Actualizar en el backend
        await apiCall(`/products/${productId}/stock`, 'PUT', { stock: newStock });
        
        // Actualizar en la variable local products
        const product = products.find(p => p.id === productId);
        if (product) {
            product.stock = newStock;
        }
        
        // Actualizar también en allProducts si existe
        if (allProducts.length > 0) {
            const allProduct = allProducts.find(p => p.id === productId);
            if (allProduct) {
                allProduct.stock = newStock;
            }
        }
        
        closeModal('stockModal');
        renderInventory();
        updateDashboard();
        
        // Si estamos en venta rápida, actualizar también esa vista
        if (currentSection === 'venta-rapida') {
            renderVentaRapidaProducts(currentCategory);
        }
        
        showToast('Stock actualizado correctamente', 'success');
    } catch (error) {
        console.error('Error al actualizar stock:', error);
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
    
    if (!ticketModal || !ticketContent) {
        console.error('Elementos del modal no encontrados');
        showToast('Error: Modal no disponible', 'error');
        return;
    }
    
    console.log('Mostrando modal del ticket...');
    ticketContent.innerHTML = generateTicket(saleData, customerData);
    ticketModal.classList.add('active');
    
    // Verificar que se agregó la clase
    console.log('Modal activo:', ticketModal.classList.contains('active'));
    console.log('Modal visible:', ticketModal.style.display, ticketModal.style.visibility, ticketModal.style.opacity);
}

function printTicket() {
    window.print();
}

// Nueva función para imprimir con impresoras del sistema
async function printTicketWithSystemPrinter() {
    try {
        // Verificar si el navegador soporta la Web Printing API
        if (!window.navigator.printing) {
            showToast('Tu navegador no soporta impresión directa. Usa la opción de navegador.', 'warning');
            return;
        }

        // Obtener lista de impresoras disponibles
        const printers = await window.navigator.printing.getPrinters();
        
        if (printers.length === 0) {
            showToast('No se encontraron impresoras conectadas al sistema', 'warning');
            return;
        }

        // Si hay múltiples impresoras, mostrar selector
        let selectedPrinter = printers[0];
        if (printers.length > 1) {
            const printerOptions = printers.map((printer, index) => 
                `${index + 1}. ${printer.name}`
            ).join('\n');
            
            const selection = prompt(`Impresoras disponibles:\n${printerOptions}\n\nSelecciona el número de impresora (1-${printers.length}):`);
            const printerIndex = parseInt(selection) - 1;
            
            if (printerIndex >= 0 && printerIndex < printers.length) {
                selectedPrinter = printers[printerIndex];
            } else {
                showToast('Selección cancelada', 'info');
                return;
            }
        }

        // Preparar contenido para impresión
        const ticketContent = document.getElementById('ticketContent').innerHTML;
        
        // Crear documento de impresión
        const printDocument = new PrintDocument();
        printDocument.title = 'Ticket - Café Nare Balneario';
        
        // Configurar opciones de impresión
        const printOptions = {
            printer: selectedPrinter,
            copies: 1,
            mediaSize: 'receipt', // Para impresoras de tickets
            orientation: 'portrait'
        };

        // Ejecutar impresión
        await printDocument.print(ticketContent, printOptions);
        
        showToast(`✓ Ticket enviado a impresora: ${selectedPrinter.name}`, 'success');
        
    } catch (error) {
        console.error('Error en impresión directa:', error);
        
        // Fallback a impresión del navegador si falla
        if (error.name === 'NotSupportedError') {
            showToast('Impresión directa no soportada. Usando impresión del navegador...', 'info');
            printTicket();
        } else {
            showToast(`Error de impresión: ${error.message}`, 'error');
        }
    }
}

// Función alternativa usando la Print API más moderna
async function printTicketWithWebAPI() {
    try {
        showToast('Preparando impresión directa...', 'info');
        
        const ticketContent = document.getElementById('ticketContent').innerHTML;
        
        // Método 1: Intentar usar la impresora predeterminada del sistema directamente
        if (window.navigator.userAgent.includes('Windows')) {
            await printWithWindowsSystem(ticketContent);
        } else {
            await printWithStandardAPI(ticketContent);
        }
        
    } catch (error) {
        console.error('Error en impresión con Web API:', error);
        showToast('Error en impresión directa. Prueba con la opción de navegador.', 'warning');
    }
}

// Función específica para Windows que intenta usar impresoras del sistema
async function printWithWindowsSystem(ticketContent) {
    try {
        // Crear ventana temporal optimizada para impresión de tickets
        const printWindow = window.open('', '_blank', 'width=300,height=500,scrollbars=no,resizable=no');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ticket - Café Nare Balneario</title>
                <style>
                    @page { 
                        size: 80mm auto; 
                        margin: 5mm; 
                    }
                    @media print {
                        body { 
                            margin: 0; 
                            padding: 0; 
                            font-family: 'Courier New', monospace; 
                            font-size: 11px; 
                            line-height: 1.2;
                            width: 80mm;
                        }
                        .ticket-header { text-align: center; margin-bottom: 8px; }
                        .ticket-title { font-weight: bold; font-size: 13px; }
                        .ticket-info { margin: 3px 0; font-size: 10px; }
                        .ticket-items { margin: 8px 0; }
                        .ticket-item { display: flex; justify-content: space-between; margin: 1px 0; font-size: 10px; }
                        .ticket-total { text-align: right; font-weight: bold; margin-top: 8px; font-size: 11px; }
                        .ticket-footer { text-align: center; margin-top: 8px; font-size: 9px; }
                    }
                    @media screen {
                        body { 
                            width: 280px; 
                            margin: 10px auto; 
                            font-family: 'Courier New', monospace; 
                            font-size: 11px;
                            background: white;
                            padding: 10px;
                        }
                    }
                </style>
            </head>
            <body>
                ${ticketContent}
                <script>
                    window.onload = function() {
                        // Intentar abrir automáticamente el diálogo de impresión
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                    
                    window.onafterprint = function() {
                        window.close();
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        showToast('✓ Abriendo diálogo de impresión del sistema', 'success');
        
    } catch (error) {
        throw error;
    }
}

// Función estándar para otros sistemas operativos
async function printWithStandardAPI(ticketContent) {
    try {
        // Crear un iframe oculto con el contenido del ticket
        const printFrame = document.createElement('iframe');
        printFrame.style.display = 'none';
        document.body.appendChild(printFrame);
        
        const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
        frameDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ticket - Café Nare Balneario</title>
                <style>
                    @media print {
                        body { margin: 0; padding: 10px; font-family: 'Courier New', monospace; font-size: 12px; }
                        .ticket-header { text-align: center; margin-bottom: 10px; }
                        .ticket-title { font-weight: bold; font-size: 14px; }
                        .ticket-info { margin: 5px 0; font-size: 11px; }
                        .ticket-items { margin: 10px 0; }
                        .ticket-item { display: flex; justify-content: space-between; margin: 2px 0; }
                        .ticket-total { text-align: right; font-weight: bold; margin-top: 10px; }
                        .ticket-footer { text-align: center; margin-top: 10px; font-size: 10px; }
                    }
                </style>
            </head>
            <body>${ticketContent}</body>
            </html>
        `);
        frameDoc.close();

        // Intentar acceder a las impresoras del sistema
        frameDoc.defaultView.print();
        showToast('✓ Usando impresora predeterminada del sistema', 'success');
        
        // Limpiar el iframe después de un momento
        setTimeout(() => {
            document.body.removeChild(printFrame);
        }, 2000);
        
    } catch (error) {
        throw error;
    }
}

// Función adicional para detectar impresoras disponibles (experimental)
async function detectSystemPrinters() {
    try {
        // Esta función usa APIs experimentales que pueden no estar disponibles
        if ('serviceWorker' in navigator && 'print' in navigator) {
            console.log('Intentando detectar impresoras...');
            
            // En algunos navegadores modernos, esta información podría estar disponible
            if (navigator.permissions) {
                const permission = await navigator.permissions.query({name: 'printing'});
                console.log('Permiso de impresión:', permission.state);
            }
        }
        
        return {
            available: true,
            method: 'system-default'
        };
    } catch (error) {
        console.log('Detección de impresoras no disponible:', error);
        return {
            available: false,
            method: 'browser-fallback'
        };
    }
}

// Función de prueba para el botón de detección de impresoras
async function testPrinterDetection() {
    showToast('Iniciando diagnóstico de impresoras...', 'info');
    
    try {
        const result = await detectSystemPrinters();
        
        // Información del navegador y sistema
        const browserInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            vendor: navigator.vendor,
            language: navigator.language
        };
        
        // APIs disponibles relacionadas con impresión
        const apis = {
            print: 'print' in window,
            navigatorPrint: 'print' in navigator,
            serviceWorker: 'serviceWorker' in navigator,
            permissions: 'permissions' in navigator,
            bluetooth: 'bluetooth' in navigator,
            usb: 'usb' in navigator
        };
        
        let diagnosticInfo = `DIAGNÓSTICO DE IMPRESIÓN\n\n`;
        diagnosticInfo += `Sistema Operativo: ${browserInfo.platform}\n`;
        diagnosticInfo += `Navegador: ${browserInfo.vendor} - ${browserInfo.userAgent.split(' ')[0]}\n\n`;
        
        diagnosticInfo += `APIs DISPONIBLES:\n`;
        Object.entries(apis).forEach(([api, available]) => {
            diagnosticInfo += `• ${api}: ${available ? '✓ Disponible' : '✗ No disponible'}\n`;
        });
        
        diagnosticInfo += `\nRESULTADO:\n`;
        diagnosticInfo += `• Detección: ${result.available ? '✓ Exitosa' : '✗ Falló'}\n`;
        diagnosticInfo += `• Método: ${result.method}\n\n`;
        
        diagnosticInfo += `RECOMENDACIONES:\n`;
        if (browserInfo.platform.includes('Win')) {
            diagnosticInfo += `• Chrome/Edge: Mejor compatibilidad\n`;
            diagnosticInfo += `• Impresora predeterminada: Se usará automáticamente\n`;
        } else {
            diagnosticInfo += `• Sistema: ${browserInfo.platform}\n`;
            diagnosticInfo += `• Usar opción de navegador como alternativa\n`;
        }
        
        alert(diagnosticInfo);
        showToast('Diagnóstico completado. Revisa la información.', 'success');
        
    } catch (error) {
        console.error('Error en diagnóstico:', error);
        showToast('Error durante el diagnóstico de impresoras', 'error');
    }
}

function printTicketPreview() {
    // Create a new window with the ticket content for testing
    const ticketContent = document.getElementById('ticketContent').innerHTML;
    const newWindow = window.open('', '_blank', 'width=400,height=600');
    
    newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket - Café Nare Balneario</title>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: 'Courier New', monospace;
                    background-color: #f5f5f5;
                }
                .ticket-preview {
                    background: white;
                    padding: 15px;
                    border: 2px dashed #8B4513;
                    max-width: 300px;
                    margin: 0 auto;
                    line-height: 1.4;
                    font-size: 12px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .ticket-header {
                    text-align: center;
                    border-bottom: 1px dashed #8B4513;
                    padding-bottom: 10px;
                    margin-bottom: 10px;
                }
                .ticket-title {
                    font-weight: bold;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .ticket-info {
                    margin: 10px 0;
                    font-size: 11px;
                }
                .ticket-items {
                    border-top: 1px dashed #8B4513;
                    border-bottom: 1px dashed #8B4513;
                    padding: 10px 0;
                    margin: 10px 0;
                }
                .ticket-item {
                    display: flex;
                    justify-content: space-between;
                    margin: 3px 0;
                    font-size: 11px;
                }
                .ticket-total {
                    text-align: right;
                    font-weight: bold;
                    font-size: 13px;
                    margin-top: 10px;
                    border-top: 1px dashed #8B4513;
                    padding-top: 5px;
                }
                .ticket-footer {
                    text-align: center;
                    margin-top: 15px;
                    font-size: 10px;
                    border-top: 1px dashed #8B4513;
                    padding-top: 10px;
                }
                .print-button {
                    text-align: center;
                    margin-top: 20px;
                }
                .btn {
                    background-color: #8B4513;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    margin: 0 5px;
                }
                .btn:hover {
                    background-color: #A0522D;
                }
                .btn-secondary {
                    background-color: #6c757d;
                }
                .btn-secondary:hover {
                    background-color: #5a6268;
                }
            </style>
        </head>
        <body>
            <div class="ticket-preview">
                ${ticketContent}
            </div>
            <div class="print-button">
                <button class="btn" onclick="window.print()">🖨️ Imprimir Real</button>
                <button class="btn btn-secondary" onclick="window.close()">❌ Cerrar</button>
            </div>
        </body>
        </html>
    `);
    
    newWindow.document.close();
}

function closeTicketModal() {
    document.getElementById('ticketModal').classList.remove('active');
}

// ===== LOYVERSE API INTEGRATION =====

// Configurar Loyverse desde el panel admin
async function configureLoyverse() {
    if (!isAdminMode) {
        showToast('Acceso denegado. Activa modo administrador primero.', 'error');
        return;
    }
    
    // Verificar que estamos en la ventana activa
    if (document.hidden) {
        showToast('Por favor asegúrate de que esta pestaña esté activa', 'warning');
        return;
    }
    
    const accessToken = prompt('Ingresa el Access Token de Loyverse API:\n\nEjemplo: 99c19a699e2045c9bc349176da3f7e4f');
    
    if (accessToken && accessToken.trim() !== '') {
        showLoading();
        showToast('Obteniendo información de tiendas...', 'info');
        
        try {
            // Obtener automáticamente las tiendas usando el token
            const storesResponse = await fetch(`${API_BASE}/loyverse/stores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    accessToken: accessToken.trim()
                })
            });
            
            const storesData = await storesResponse.json();
            
            let storeId = '';
            
            if (storesResponse.ok && storesData.stores && storesData.stores.length > 0) {
                if (storesData.stores.length === 1) {
                    // Si solo hay una tienda, usar automáticamente
                    storeId = storesData.stores[0].id;
                    showToast(`✓ Tienda encontrada: ${storesData.stores[0].name}`, 'success');
                } else {
                    // Si hay múltiples tiendas, mostrar opciones
                    const storeOptions = storesData.stores.map((store, index) => 
                        `${index + 1}. ${store.name} (ID: ${store.id})`
                    ).join('\n');
                    
                    const selection = prompt(`Tiendas encontradas:\n${storeOptions}\n\nIngresa el número de tienda (1-${storesData.stores.length}):`);
                    const storeIndex = parseInt(selection) - 1;
                    
                    if (storeIndex >= 0 && storeIndex < storesData.stores.length) {
                        storeId = storesData.stores[storeIndex].id;
                    } else {
                        throw new Error('Selección inválida');
                    }
                }
            } else {
                // Fallback manual si la API falla
                storeId = prompt('No se pudieron obtener tiendas automáticamente.\nIngresa manualmente el Store ID de Loyverse:') || '';
            }
            
            LOYVERSE_CONFIG.accessToken = accessToken.trim();
            LOYVERSE_CONFIG.storeId = storeId.trim();
            LOYVERSE_CONFIG.enabled = true;
            
            // Guardar en localStorage
            localStorage.setItem('loyverse_config', JSON.stringify(LOYVERSE_CONFIG));
            showToast('✓ Configuración de Loyverse guardada correctamente', 'success');
            
            // Mostrar resumen de configuración
            console.log('Loyverse configurado:', {
                tokenLength: accessToken.length,
                storeId: storeId || 'No especificado',
                enabled: true
            });
            
        } catch (error) {
            console.error('Error configurando Loyverse:', error);
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    } else if (accessToken !== null) {
        showToast('Access Token es requerido', 'error');
    }
}

// Cargar configuración de Loyverse desde localStorage
function loadLoyverseConfig() {
    const savedConfig = localStorage.getItem('loyverse_config');
    if (savedConfig) {
        const config = JSON.parse(savedConfig);
        LOYVERSE_CONFIG.accessToken = config.accessToken;
        LOYVERSE_CONFIG.storeId = config.storeId;
        LOYVERSE_CONFIG.enabled = config.enabled;
    }
}

// Enviar venta a Loyverse API a través de nuestro proxy
async function sendToLoyverse(saleData, customerData = null) {
    if (!LOYVERSE_CONFIG.enabled || !LOYVERSE_CONFIG.accessToken) {
        console.log('Loyverse no configurado, omitiendo envío');
        return null;
    }
    
    try {
        // Enviar a nuestro proxy server que maneja CORS
        const response = await fetch(`${API_BASE}/loyverse/receipt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accessToken: LOYVERSE_CONFIG.accessToken,
                storeId: LOYVERSE_CONFIG.storeId,
                saleData: saleData,
                customerData: customerData
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('Venta enviada a Loyverse:', result);
            
            // Activar impresión automática en Loyverse
            if (result.receipt_number) {
                await triggerLoyversePrint(result.receipt_number);
            }
            
            return result;
        } else {
            console.error('Error al enviar a Loyverse:', result);
            throw new Error(result.error || `Error Loyverse: ${response.status}`);
        }
    } catch (error) {
        console.error('Error en integración Loyverse:', error);
        showToast(`Error al sincronizar con Loyverse: ${error.message}`, 'warning');
        return null;
    }
}

// Activar impresión en Loyverse (si el dispositivo está configurado)
async function triggerLoyversePrint(receiptNumber) {
    try {
        // Esta función depende de la configuración específica de Loyverse
        // En la mayoría de casos, si Loyverse está configurado para auto-imprimir,
        // esto sucederá automáticamente al crear el recibo
        console.log(`Recibo ${receiptNumber} creado en Loyverse - impresión automática activada`);
    } catch (error) {
        console.error('Error al activar impresión Loyverse:', error);
    }
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
    
    // Función de prueba para el modal (puedes ejecutarla desde la consola)
    window.testTicketModal = function() {
        const testData = {
            items: [
                { productName: 'Café Americano', quantity: 2, price: 3500 },
                { productName: 'Croissant', quantity: 1, price: 2500 }
            ],
            total: 9500
        };
        showTicket(testData, { name: 'Cliente de Prueba' });
        console.log('Modal de prueba abierto. Verifica que sea visible.');
    };
    
    console.log('Modal del ticket inicializado. Usa testTicketModal() para probar.');
})

// Función para generar documento de impresión automática
// Función para probar impresión con datos actuales de la venta
function testPrintWithCurrentSale() {
    console.log('Iniciando prueba de impresión...');
    
    // Debug: verificar elementos del DOM
    const saleItems = document.querySelectorAll('.sale-item');
    const saleTotal = document.getElementById('saleTotal');
    
    console.log('Elementos de venta encontrados:', saleItems.length);
    console.log('Elemento total encontrado:', saleTotal);
    
    if (saleItems.length === 0) {
        showToast('No hay productos en la venta actual. Agrega productos primero.', 'warning');
        return;
    }
    
    // Obtener datos actuales de la venta
    const currentItems = getCurrentSaleItems();
    const currentTotal = getCurrentSaleTotal();
    
    console.log('Items extraídos:', currentItems);
    console.log('Total extraído:', currentTotal);
    
    if (currentItems.length === 0) {
        showToast('Error al extraer datos de los productos. Verifica la estructura del HTML.', 'error');
        return;
    }
    
    // Crear objeto de venta con formato correcto
    const testSaleData = {
        items: currentItems,
        total: currentTotal,
        date: new Date().toLocaleString(),
        id: 'TEST-' + Date.now()
    };
    
    console.log('Datos de prueba para impresión:', testSaleData);
    
    // Generar y abrir documento de impresión
    generatePrintDocument(testSaleData);
}

// Función para obtener items actuales de la venta
function getCurrentSaleItems() {
    const items = [];
    const saleItems = document.querySelectorAll('.sale-item');
    
    saleItems.forEach(item => {
        // Buscar el nombre del producto en el primer div (sale-item-info)
        const nameElement = item.querySelector('.sale-item-info strong');
        const name = nameElement ? nameElement.textContent : 'Producto desconocido';
        
        // Buscar la cantidad en el input de cantidad
        const quantityInput = item.querySelector('.quantity-input');
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
        
        // Buscar el precio en el texto pequeño (c/u)
        const priceElement = item.querySelector('.sale-item-info small');
        const priceText = priceElement ? priceElement.textContent : '';
        const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
        
        if (name && quantity > 0 && price > 0) {
            items.push({
                name: name,
                quantity: quantity,
                price: price,
                total: quantity * price
            });
        }
    });
    
    return items;
}

// Función para obtener total actual de la venta
function getCurrentSaleTotal() {
    const totalElement = document.getElementById('saleTotal');
    if (!totalElement) {
        console.warn('Elemento saleTotal no encontrado');
        return 0;
    }
    
    const totalText = totalElement.textContent;
    // Extraer solo números del texto (remover $ y otros caracteres)
    const total = parseFloat(totalText.replace(/[^\d.]/g, '')) || 0;
    
    return total;
}

// Función para generar documento de impresión automática
function generatePrintDocument(saleData, customerData = null) {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Convertir el formato de datos para que sea compatible
    const convertedData = {
        items: saleData.line_items ? saleData.line_items.map(item => ({
            productName: item.item_name,
            quantity: item.quantity,
            price: item.price / 100  // Convertir de centavos a pesos
        })) : [],
        total: saleData.total_money ? saleData.total_money / 100 : 0
    };
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket - Café Nare Balneario</title>
            <meta charset="UTF-8">
            <style>
                @media print {
                    body { margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                }
                
                body {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    line-height: 1.2;
                    margin: 0;
                    padding: 10px;
                    background: white;
                }
                
                .ticket-header {
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                    margin-bottom: 15px;
                }
                
                .ticket-title {
                    font-size: 18px;
                    font-weight: bold;
                    margin: 0;
                }
                
                .ticket-subtitle {
                    font-size: 14px;
                    margin: 5px 0;
                }
                
                .ticket-info {
                    margin: 10px 0;
                }
                
                .ticket-items {
                    margin: 15px 0;
                }
                
                .item-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 5px 0;
                    border-bottom: 1px dotted #ccc;
                    padding-bottom: 3px;
                }
                
                .ticket-total {
                    border-top: 2px solid #000;
                    margin-top: 15px;
                    padding-top: 10px;
                    font-weight: bold;
                }
                
                .ticket-footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 10px;
                    border-top: 1px solid #000;
                    padding-top: 10px;
                }
                
                .print-button {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                }
                
                .print-button:hover {
                    background: #0056b3;
                }
            </style>
        </head>
        <body>
            <button class="print-button no-print" onclick="window.print()">
                🖨️ Imprimir
            </button>
            
            <div class="ticket-header">
                <h1 class="ticket-title">CAFÉ NARE BALNEARIO</h1>
                <p class="ticket-subtitle">Restaurante y Bar</p>
                <p class="ticket-subtitle">Dirección del Local</p>
                <p class="ticket-subtitle">Tel: (123) 456-7890</p>
            </div>
            
            <div class="ticket-info">
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                <p><strong>Hora:</strong> ${new Date().toLocaleTimeString('es-ES')}</p>
                <p><strong>Ticket #:</strong> ${saleData.receipt_number || 'N/A'}</p>
                ${customerData ? `<p><strong>Cliente:</strong> ${customerData.name || 'Cliente General'}</p>` : ''}
            </div>
            
            <div class="ticket-items">
                <h3>ITEMS:</h3>
                ${convertedData.items.map(item => `
                    <div class="item-row">
                        <span>${item.quantity}x ${item.productName}</span>
                        <span>$${item.price.toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="ticket-total">
                <div class="item-row">
                    <span><strong>TOTAL:</strong></span>
                    <span><strong>$${convertedData.total.toFixed(2)}</strong></span>
                </div>
            </div>
            
            <div class="ticket-footer">
                <p>¡Gracias por su visita!</p>
                <p>Esperamos verlo pronto</p>
                <p>www.cafenarebalneario.com</p>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Auto-abrir diálogo de impresión después de un breve delay
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
    }, 500);
    
    return printWindow;
}
;

// ===== FUNCIONES DE VENTA RÁPIDA =====

// Función para renderizar productos en venta rápida
function renderVentaRapidaProducts(category = 'all') {
    currentCategory = category;
    
    // Siempre sincronizar con los productos actuales
    allProducts = [...products]; // Usar los productos tal como están, manteniendo sus categorías originales
    
    let productsToShow = allProducts;
    
    // Filtrar por categoría si no es "all"
    if (category !== 'all') {
        productsToShow = allProducts.filter(product => product.category === category);
    }
    
    renderVentaRapidaProductsFiltered(productsToShow);
}

// Función para determinar la categoría de un producto basado en su nombre
function determineProductCategory(productName) {
    const name = productName.toLowerCase();
    
    // Bebidas Café
    if (name.includes('café') || name.includes('cafe') || name.includes('capuccino') || name.includes('mocacino') ||
        name.includes('latte') || name.includes('americano') || name.includes('expresso') || name.includes('aromatica') ||
        name.includes('chocolate') || name.includes('jugo')) {
        return 'bebidas';
    } 
    // Cervezas
    else if (name.includes('cerveza') || name.includes('budweiser') || name.includes('pilsen') || name.includes('bitburger') ||
             name.includes('bbc') || name.includes('club colombia') || name.includes('aguila') || name.includes('corona') ||
             name.includes('stella') || name.includes('heineken') || name.includes('redds') || name.includes('peroni') ||
             name.includes('andina')) {
        return 'cervezas';
    } 
    // Líquidos
    else if (name.includes('hidra') || name.includes('gatorade') || name.includes('electrolit') || name.includes('four loko') ||
             name.includes('jp') || name.includes('cuba libre') || name.includes('smirnoff') || name.includes('redbull') ||
             name.includes('agua') || name.includes('hatsu') || name.includes('te')) {
        return 'liquidos';
    } 
    // Snacks
    else if (name.includes('papas') || name.includes('chips') || name.includes('snack')) {
        return 'snacks';
    } 
    // Chocolates-Café
    else if (name.includes('chocolate') || name.includes('chocolatina') || name.includes('café 125g') || 
             name.includes('café 250g') || name.includes('café 500g') || name.includes('paquete x12') ||
             name.includes('unidad x4') || name.includes('unidad x10')) {
        return 'chocolates_cafe';
    } 
    else {
        return 'otros';
    }
}

// Función para cambiar categoría activa
function changeCategory(category) {
    // Remover clase active de todas las pestañas
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Agregar clase active a la pestaña seleccionada
    const selectedTab = document.querySelector(`[data-category="${category}"]`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Renderizar productos de la categoría
    renderVentaRapidaProducts(category);
}

// Función para agregar producto a la venta rápida
function agregarProductoVentaRapida(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock === 0) {
        showToast('Producto no disponible', 'warning');
        return;
    }
    
    // Inicializar currentSale si no existe
    if (!window.currentSale) {
        window.currentSale = { items: [], customer: null, total: 0 };
    }
    
    // Mostrar panel de venta si no está visible
    const panel = document.getElementById('ventaRapidaPanel');
    if (panel && panel.style.display === 'none') {
        panel.style.display = 'block';
    }
    
    const existingItem = window.currentSale.items.find(item => item.productId === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            showToast('No hay suficiente stock', 'warning');
            return;
        }
    } else {
        window.currentSale.items.push({
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: 1
        });
    }
    
    renderVentaRapidaItems();
    updateVentaRapidaTotal();
    showToast(`${product.name} agregado a la venta`, 'success');
}

// Función para renderizar items de la venta rápida
function renderVentaRapidaItems() {
    const container = document.getElementById('ventaRapidaItems');
    if (!container || !window.currentSale) return;
    
    if (window.currentSale.items.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light);">No hay productos en la venta</p>';
        return;
    }
    
    container.innerHTML = window.currentSale.items.map((item, index) => `
        <div class="venta-item">
            <div class="venta-item-info">
                <strong>${item.productName}</strong>
                <br>
                <small>${formatCurrency(item.price)} c/u</small>
            </div>
            <div class="venta-item-controls">
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="updateVentaRapidaQuantity(${index}, -1)">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                           onchange="setVentaRapidaQuantity(${index}, this.value)">
                    <button class="quantity-btn" onclick="updateVentaRapidaQuantity(${index}, 1)">+</button>
                </div>
                <strong>${formatCurrency(item.price * item.quantity)}</strong>
                <button class="btn-icon btn-delete" onclick="removeVentaRapidaItem(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Función para actualizar total de venta rápida
function updateVentaRapidaTotal() {
    if (!window.currentSale) return;
    
    window.currentSale.total = window.currentSale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalElement = document.getElementById('ventaRapidaTotal');
    if (totalElement) {
        totalElement.textContent = formatCurrency(window.currentSale.total);
    }
}

// Función para actualizar cantidad en venta rápida
function updateVentaRapidaQuantity(index, change) {
    if (!window.currentSale || !window.currentSale.items[index]) return;
    
    const item = window.currentSale.items[index];
    const product = products.find(p => p.id === item.productId);
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
        removeVentaRapidaItem(index);
        return;
    }
    
    if (newQuantity > product.stock) {
        showToast('No hay suficiente stock', 'warning');
        return;
    }
    
    item.quantity = newQuantity;
    renderVentaRapidaItems();
    updateVentaRapidaTotal();
}

// Función para establecer cantidad en venta rápida
function setVentaRapidaQuantity(index, quantity) {
    if (!window.currentSale || !window.currentSale.items[index]) return;
    
    const item = window.currentSale.items[index];
    const product = products.find(p => p.id === item.productId);
    const newQuantity = parseInt(quantity);
    
    if (newQuantity <= 0) {
        removeVentaRapidaItem(index);
        return;
    }
    
    if (newQuantity > product.stock) {
        showToast('No hay suficiente stock', 'warning');
        item.quantity = product.stock;
    } else {
        item.quantity = newQuantity;
    }
    
    renderVentaRapidaItems();
    updateVentaRapidaTotal();
}

// Función para remover item de venta rápida
function removeVentaRapidaItem(index) {
    if (!window.currentSale) return;
    
    window.currentSale.items.splice(index, 1);
    renderVentaRapidaItems();
    updateVentaRapidaTotal();
    
    // Ocultar panel si no hay items
    if (window.currentSale.items.length === 0) {
        const panel = document.getElementById('ventaRapidaPanel');
        if (panel) {
            panel.style.display = 'none';
        }
    }
}

// Función para cancelar venta rápida
function cancelarVentaRapida() {
    window.currentSale = { items: [], customer: null, total: 0 };
    const panel = document.getElementById('ventaRapidaPanel');
    if (panel) {
        panel.style.display = 'none';
    }
}

// Función para completar venta rápida
async function completarVentaRapida(shouldPrint = false) {
    if (!window.currentSale || window.currentSale.items.length === 0) {
        showToast('Agrega al menos un producto a la venta', 'warning');
        return;
    }
    
    const saleData = {
        customerId: null,
        customerName: 'Cliente General',
        items: window.currentSale.items.map(item => ({
            productId: item.productId,
            productName: item.name,
            name: item.name,
            price: parseFloat(item.price),
            quantity: parseInt(item.quantity)
        })),
        total: window.currentSale.total,
        print: shouldPrint
    };
    
    showLoading();
    try {
        // Registrar venta en el backend
        const result = await apiCall('/sales', 'POST', saleData);
        
        // Actualizar stock local
        window.currentSale.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                product.stock -= item.quantity;
            }
        });
        
        // Enviar a Loyverse API si está configurado
        const loyverseResult = await sendToLoyverse(saleData, null);
        
        if (loyverseResult) {
            showToast('Venta registrada y enviada a Loyverse ✓', 'success');
        } else {
            showToast('Venta registrada correctamente ✓', 'success');
        }
        
        if (shouldPrint && result.receiptHtml) {
            // Crear un nuevo documento para la impresión
            const printWindow = window.open('', '_blank');
            printWindow.document.write(result.receiptHtml);
            printWindow.document.close();
            // Esperar a que los estilos se carguen
            setTimeout(() => {
                printWindow.print();
                // Cerrar la ventana después de imprimir
                printWindow.close();
            }, 500);
        }
        
        // Limpiar venta
        cancelarVentaRapida();
        renderSales();
        updateDashboard();
        
        // Actualizar la vista de productos para mostrar el nuevo stock
        renderVentaRapidaProducts(currentCategory);
        
    } catch (error) {
        showToast('Error al registrar la venta', 'error');
    } finally {
        hideLoading();
    }
}

// Función para vender sin imprimir (solo registrar)
async function venderRapida() {
    if (!window.currentSale || window.currentSale.items.length === 0) {
        showToast('Agrega al menos un producto a la venta', 'warning');
        return;
    }
    
    const saleData = {
        customerId: null,
        customerName: 'Cliente General',
        items: window.currentSale.items,
        total: window.currentSale.total
    };
    
    showLoading();
    try {
        // Registrar venta en el backend
        await apiCall('/sales', 'POST', saleData);
        
        // Actualizar stock local
        window.currentSale.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                product.stock -= item.quantity;
            }
        });
        
        // Enviar a Loyverse API si está configurado
        const loyverseResult = await sendToLoyverse(saleData, null);
        
        if (loyverseResult) {
            showToast('Venta registrada y enviada a Loyverse ✓', 'success');
        } else {
            showToast('Venta registrada correctamente ✓', 'success');
        }
        
        // Limpiar venta
        cancelarVentaRapida();
        renderSales();
        updateDashboard();
        
        // Actualizar la vista de productos para mostrar el nuevo stock
        renderVentaRapidaProducts(currentCategory);
        
    } catch (error) {
        showToast('Error al registrar la venta', 'error');
    } finally {
        hideLoading();
    }
}

// Función para probar impresión en venta rápida
function probarImpresionVentaRapida() {
    if (!window.currentSale || window.currentSale.items.length === 0) {
        showToast('No hay productos en la venta actual', 'warning');
        return;
    }
    
    const testSaleData = {
        items: window.currentSale.items,
        total: window.currentSale.total,
        date: new Date().toLocaleString(),
        id: 'TEST-' + Date.now()
    };
    
    generatePrintDocument(testSaleData);
}

// Función para filtrar productos en venta rápida
function filterVentaRapidaProducts() {
    const searchTerm = document.getElementById('ventaRapidaSearch').value.toLowerCase();
    
    let productsToShow = allProducts;
    
    // Primero filtrar por categoría actual
    if (currentCategory !== 'all') {
        productsToShow = allProducts.filter(product => product.category === currentCategory);
    }
    
    // Luego filtrar por término de búsqueda
    if (searchTerm) {
        productsToShow = productsToShow.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }
    
    renderVentaRapidaProductsFiltered(productsToShow);
}

// Función para renderizar productos filtrados en venta rápida
function renderVentaRapidaProductsFiltered(productsToShow) {
    const container = document.getElementById('productsGridVenta');
    
    if (!container) return;
    
    if (productsToShow.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light); grid-column: 1/-1;">No se encontraron productos</p>';
        return;
    }
    
    container.innerHTML = productsToShow.map(product => `
        <div class="product-card-venta" onclick="agregarProductoVentaRapida('${product.id}')">
            <div class="product-image">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}">` : 
                    getProductCategoryIcon(product.category)
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
                <div class="add-to-cart">
                    <i class="fas fa-plus-circle"></i> Agregar
                </div>
            </div>
        </div>
    `).join('');
}

// Función para obtener el ícono según la categoría del producto
function getProductCategoryIcon(category) {
    switch(category) {
        case 'bebidas':
            return '<i class="fas fa-coffee" style="color: #8B4513;"></i>';
        case 'cervezas':
            return '<i class="fas fa-beer" style="color: #FFD700;"></i>';
        case 'liquidos':
            return '<i class="fas fa-tint" style="color: #00BFFF;"></i>';
        case 'snacks':
            return '<i class="fas fa-cookie-bite" style="color: #FF6B35;"></i>';
        case 'chocolates_cafe':
            return '<i class="fas fa-mug-hot" style="color: #8B0000;"></i>';
        case 'otros':
        default:
            return '<i class="fas fa-box" style="color: #6c757d;"></i>';
    }
}

// Event Listeners para Venta Rápida
function setupVentaRapidaEventListeners() {
    const searchInput = document.getElementById('ventaRapidaSearch');
    const cancelarBtn = document.getElementById('cancelarVentaRapida');
    const venderSinImprimirBtn = document.getElementById('venderSinImprimir');
    const venderEImprimirBtn = document.getElementById('venderEImprimir');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterVentaRapidaProducts);
    }
    
    if (cancelarBtn) {
        cancelarBtn.addEventListener('click', () => {
            cancelarVentaRapida();
            showToast('Venta cancelada', 'info');
        });
    }
    
    if (venderSinImprimirBtn) {
        venderSinImprimirBtn.addEventListener('click', () => completarVentaRapida(false));
    }
    
    if (venderEImprimirBtn) {
        venderEImprimirBtn.addEventListener('click', () => completarVentaRapida(true));
    }
    
    // Configurar pestañas de categorías
    setupCategoryTabs();
}

// Función para configurar los event listeners de las pestañas
function setupCategoryTabs() {
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.getAttribute('data-category');
            changeCategory(category);
        });
    });
}


