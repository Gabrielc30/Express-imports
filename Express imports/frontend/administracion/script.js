// Mobile menu functionality
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobile-overlay');

mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
    mobileOverlay.classList.remove('hidden');
});
mobileOverlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    mobileOverlay.classList.add('hidden');
});
// Section navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('[id$="-section"]').forEach(section => {
        section.classList.add('hidden');
    });
    // Show selected section
    document.getElementById(sectionName + '-section').classList.remove('hidden');
    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.sidebar-item').classList.add('active');
    
    // Update page title
    const titles = {
        'dashboard': { title: 'Dashboard', subtitle: 'Resumen general de tu negocio' },
        'productos': { title: 'Gestión de Productos', subtitle: 'Administra tu catálogo de productos' },
        'pedidos': { title: 'Gestión de Pedidos', subtitle: 'Administra las órdenes de tus clientes' },
        'configuracion': { title: 'Configuración', subtitle: 'Ajustes del sistema y preferencias' }
    };
    document.getElementById('page-title').textContent = titles[sectionName].title;
    document.getElementById('page-subtitle').textContent = titles[sectionName].subtitle;
    
    // Close mobile menu if open
    sidebar.classList.remove('active');
    mobileOverlay.classList.add('hidden');
}

// Add product modal (placeholder)
function showAddProductModal() {
    showSection('productos');
}

// File upload functionality
document.addEventListener('DOMContentLoaded', function() {
    const fileUploadArea = document.querySelector('.border-dashed');
    const fileInput = document.querySelector('input[type="file"]');
    
    if (fileUploadArea && fileInput) {
        fileUploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.classList.add('border-blue-400', 'bg-blue-50');
        });
        
        fileUploadArea.addEventListener('dragleave', () => {
            fileUploadArea.classList.remove('border-blue-400', 'bg-blue-50');
        });
        
        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.classList.remove('border-blue-400', 'bg-blue-50');
            // Handle file drop logic here
        });
    }
});

// Form submission handlers
document.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    successMessage.textContent = '✅ Producto agregado exitosamente';
    document.body.appendChild(successMessage);
    
    setTimeout(() => {
        successMessage.remove();
    }, 3000);
    
    // Reset form
    e.target.reset();
});
// Table action handlers
document.addEventListener('click', function(e) {
    if (e.target.textContent === 'Editar') {
        alert('Función de edición - Próximamente disponible');
    } else if (e.target.textContent === 'Archivar') {
        if (confirm('¿Estás seguro de que quieres archivar este producto?')) {
            e.target.closest('tr').style.opacity = '0.5';
            setTimeout(() => {
                e.target.closest('tr').remove();
            }, 300);
        }
    } else if (e.target.textContent === 'Ver') {
        alert('Abriendo detalles del pedido - Próximamente disponible');
    } else if (e.target.textContent === 'Procesar') {
        e.target.textContent = 'Procesando...';
        e.target.classList.add('opacity-50');
        setTimeout(() => {
            e.target.textContent = 'Completado';
            e.target.classList.remove('text-green-600', 'bg-green-50', 'hover:bg-green-100');
            e.target.classList.add('text-blue-600', 'bg-blue-50', 'hover:bg-blue-100');
        }, 2000);
    }
});