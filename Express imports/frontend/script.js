// Enhanced products data - ahora se cargarán desde la API
let products = [];
const cart = [];
const stockCart = [];

const productsGrid = document.getElementById('products-grid');
const searchInput = document.getElementById('search-input');
const cartBtn = document.getElementById('cart-btn');
const cartBtnProducts = document.getElementById('cart-btn-products');
const cartOverlay = document.getElementById('cart-overlay');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartCount = document.getElementById('cart-count');
const cartCountProducts = document.getElementById('cart-count-products');

const stockCartOverlay = document.getElementById('stock-cart-overlay');
const closeStockCartBtn = document.getElementById('close-stock-cart');
const stockCartItemsContainer = document.getElementById('stock-cart-items');
const stockCartSubtotal = document.getElementById('stock-cart-subtotal');
const stockCartTotal = document.getElementById('stock-cart-total');
const proceedCheckoutBtn = document.getElementById('proceed-checkout');

// Cargar productos desde la API
async function loadProducts() {
    try {
        console.log('Cargando productos desde la API...');
        const data = await API.products.getAll();
        products = data.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            originalPrice: product.original_price || product.price * 1.3,
            category: product.category,
            image: product.image_emoji || "📦",
            isNew: product.is_new,
            isOffer: product.is_offer,
            inStock: product.in_stock,
            stockQuantity: product.stock_quantity,
            shipping: product.shipping_info,
            isPremium: product.is_premium
        }));
        
        console.log('Productos cargados:', products);
        renderProducts(products);
    } catch (error) {
        console.error('Error cargando productos:', error);
        // Fallback: mostrar mensaje de error
        productsGrid.innerHTML = `
            <div class="col-span-full text-center p-8">
                <div class="text-4xl mb-4">⚠️</div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">Error de conexión</h3>
                <p class="text-gray-600 mb-4">No se pudo conectar con el servidor</p>
                <button onclick="loadProducts()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    Reintentar
                </button>
            </div>
        `;
    }
}

// Functions
function renderProducts(filteredProducts) {
    productsGrid.innerHTML = '';
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '<p class="text-center text-gray-500 col-span-full">No se encontraron productos en esta categoría.</p>';
        return;
    }
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all transform hover:scale-105';
        let stockLabel = '';
        if (product.inStock) {
            stockLabel = `<span class="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold animate-pulse">EN STOCK</span>`;
        } else if (product.isPremium) {
            stockLabel = `<span class="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold">PREMIUM</span>`;
        } else if (product.isNew) {
            stockLabel = `<span class="bg-gray-800 text-white text-xs px-3 py-1 rounded-full font-semibold">NOVEDAD</span>`;
        }
        
        const offerLabel = product.isOffer ? `<span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">OFERTA</span>` : '';
        const shippingLabel = product.shipping ? `<span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">${product.shipping} ENVÍO</span>` : '';

        const addToCartButton = product.inStock
            ? `<button onclick="addToStockCart(${product.id})" class="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg mt-4">🛒 Comprar Ahora</button>`
            : `<button onclick="addToCart(${product.id})" class="w-full bg-yellow-400 text-gray-900 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg mt-4">➕ Agregar a Mi Lista</button>`;

        productCard.innerHTML = `
            <div class="relative">
                <div class="h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-6xl">${product.image}</div>
                <div class="absolute top-3 left-3">${stockLabel}</div>
                <div class="absolute top-3 right-3">${offerLabel}</div>
                <div class="absolute bottom-3 left-3">${shippingLabel}</div>
            </div>
            <div class="p-6">
                <h3 class="text-lg font-bold mb-2 custom-blue-text leading-tight">${product.name}</h3>
                <p class="text-sm text-gray-600 mb-4">${product.inStock ? 'Disponible en almacén de Miami' : 'Importación directa, entrega de 7-15 días'}</p>
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <span class="text-2xl font-bold custom-blue-text">$${product.price.toFixed(2)}</span>
                        <span class="text-sm text-gray-500 line-through ml-2">$${product.originalPrice.toFixed(2)}</span>
                        <div class="text-xs text-green-600 font-semibold">${product.inStock ? `✅ ${product.stockQuantity} unidades disponibles` : `Ahorras $${(product.originalPrice - product.price).toFixed(2)}`}</div>
                    </div>
                </div>
                ${addToCartButton}
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

function updateCartUI() {
    cartItemsContainer.innerHTML = '';
    let total = 0;
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-gray-500 text-center">Tu lista está vacía</p>';
    } else {
        cart.forEach((item, index) => {
            const product = products.find(p => p.id === item.id);
            total += product.price;
            const cartItem = document.createElement('div');
            cartItem.className = 'flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4';
            cartItem.innerHTML = `
                <div class="flex items-center space-x-4">
                    <div class="text-3xl">${product.image}</div>
                    <div>
                        <div class="font-semibold text-sm">${product.name}</div>
                        <div class="text-xs text-gray-500">Precio estimado: $${product.price.toFixed(2)}</div>
                    </div>
                </div>
                <button onclick="removeFromCart(${index})" class="text-red-500 text-xl hover:text-red-700">&times;</button>
            `;
            cartItemsContainer.appendChild(cartItem);
        });
    }
    cartTotal.textContent = `$${total.toFixed(2)}`;
    cartCount.textContent = cart.length;
    cartCountProducts.textContent = cart.length;
    if (cart.length > 0) {
        cartCount.classList.remove('hidden');
        cartCountProducts.classList.remove('hidden');
        document.getElementById('generate-order').disabled = false;
    } else {
        cartCount.classList.add('hidden');
        cartCountProducts.classList.add('hidden');
        document.getElementById('generate-order').disabled = true;
    }
}

function updateStockCartUI() {
    stockCartItemsContainer.innerHTML = '';
    let subtotal = 0;
    if (stockCart.length === 0) {
        stockCartItemsContainer.innerHTML = '<p class="text-gray-500 text-center">Tu carrito está vacío</p>';
    } else {
        stockCart.forEach((item, index) => {
            const product = products.find(p => p.id === item.id);
            subtotal += product.price;
            const stockCartItem = document.createElement('div');
            stockCartItem.className = 'flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4';
            stockCartItem.innerHTML = `
                <div class="flex items-center space-x-4">
                    <div class="text-3xl">${product.image}</div>
                    <div>
                        <div class="font-semibold text-sm">${product.name}</div>
                        <div class="text-xs text-gray-500">Precio: $${product.price.toFixed(2)}</div>
                    </div>
                </div>
                <button onclick="removeFromStockCart(${index})" class="text-red-500 text-xl hover:text-red-700">&times;</button>
            `;
            stockCartItemsContainer.appendChild(stockCartItem);
        });
    }
    stockCartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    stockCartTotal.textContent = `$${subtotal.toFixed(2)}`;
    if (stockCart.length > 0) {
        proceedCheckoutBtn.disabled = false;
    } else {
        proceedCheckoutBtn.disabled = true;
    }
}

function showProductsPage(filter = 'todos') {
    document.getElementById('products-page').classList.remove('hidden');
    filterProducts(filter);
    document.body.style.overflow = 'hidden';
}

function hideProductsPage() {
    document.getElementById('products-page').classList.add('hidden');
    document.body.style.overflow = '';
}

function filterProducts(category) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.filter-btn[onclick*="${category}"]`).classList.add('active');

    let filtered = products;
    if (category === 'stock') {
        filtered = products.filter(p => p.inStock);
    } else if (category === 'ofertas') {
        filtered = products.filter(p => p.isOffer);
    } else if (category !== 'todos') {
        filtered = products.filter(p => p.category === category);
    }
    renderProducts(filtered);
}

function addToCart(id) {
    const productToAdd = products.find(p => p.id === id);
    if (productToAdd) {
        cart.push(productToAdd);
        updateCartUI();
        alert('✅ Producto añadido a tu lista de cotización.');
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function addToStockCart(id) {
    const productToAdd = products.find(p => p.id === id);
    if (productToAdd) {
        stockCart.push(productToAdd);
        updateStockCartUI();
        alert('🛒 Producto añadido al carrito de compra inmediata.');
        openStockCart();
    }
}

function removeFromStockCart(index) {
    stockCart.splice(index, 1);
    updateStockCartUI();
}

function openCart() {
    cartOverlay.classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('cart-sidebar').classList.add('active');
    }, 10);
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    document.getElementById('cart-sidebar').classList.remove('active');
    setTimeout(() => {
        cartOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }, 300);
}

function openStockCart() {
    stockCartOverlay.classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('stock-cart-sidebar').classList.add('active');
    }, 10);
    document.body.style.overflow = 'hidden';
}

function closeStockCart() {
    document.getElementById('stock-cart-sidebar').classList.remove('active');
    setTimeout(() => {
        stockCartOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }, 300);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Test de conexión inicial
    const connected = await testConnection();
    if (connected) {
        await loadProducts();
    }

    const elementsToFadeIn = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.2 });

    elementsToFadeIn.forEach(element => {
        observer.observe(element);
    });

    updateCartUI();
    updateStockCartUI();

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = products.filter(product => 
                product.name.toLowerCase().includes(query) || 
                product.category.toLowerCase().includes(query)
            );
            renderProducts(filtered);
        });
    }
});

// Sidebar open/close logic
cartBtn.addEventListener('click', openCart);
if (cartBtnProducts) cartBtnProducts.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', (e) => {
    if (e.target.id === 'cart-overlay') {
        closeCart();
    }
});

closeStockCartBtn.addEventListener('click', closeStockCart);
stockCartOverlay.addEventListener('click', (e) => {
    if (e.target.id === 'stock-cart-overlay') {
        closeStockCart();
    }
});

// Generar cotización
document.getElementById('generate-order').addEventListener('click', async () => {
    if (cart.length === 0) return;

    const customerName = prompt('Ingresa tu nombre completo:');
    if (!customerName) return;

    const customerEmail = prompt('Ingresa tu email:');
    if (!customerEmail) return;

    try {
        const quoteData = {
            customer_name: customerName,
            customer_email: customerEmail,
            message: 'Solicitud de cotización desde el sitio web',
            items: cart.map(product => ({
                product_id: product.id,
                quantity: 1
            }))
        };

        await API.quotes.create(quoteData);
        alert('¡Cotización enviada exitosamente! Te contactaremos pronto.');
        
        // Limpiar carrito
        cart.length = 0;
        updateCartUI();
        closeCart();
        
    } catch (error) {
        alert('Error al enviar la cotización. Intenta nuevamente.');
    }
});

// Checkout de productos en stock
proceedCheckoutBtn.addEventListener('click', async () => {
    if (stockCart.length === 0) return;

    const customerName = prompt('Ingresa tu nombre completo:');
    if (!customerName) return;

    const customerEmail = prompt('Ingresa tu email:');
    if (!customerEmail) return;

    const shippingAddress = prompt('Ingresa tu dirección de envío:');
    if (!shippingAddress) return;

    try {
        const orderData = {
            customer_name: customerName,
            customer_email: customerEmail,
            shipping_address: shippingAddress,
            items: stockCart.map(product => ({
                product_id: product.id,
                quantity: 1
            }))
        };

        const result = await API.stockOrders.create(orderData);
        alert(`¡Pedido confirmado! Total: $${result.total.toFixed(2)}\n\nRecibirás un email con los detalles y el número de tracking.\n\n¡Gracias por confiar en Express Imports!`);
        
        // Limpiar carrito y recargar productos para actualizar stock
        stockCart.length = 0;
        updateStockCartUI();
        closeStockCart();
        await loadProducts();
        
    } catch (error) {
        alert('Error al procesar el pedido: ' + error.message);
    }
});