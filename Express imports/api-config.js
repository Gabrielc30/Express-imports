// api-config.js - Configuración de la API para Express Imports

// URL del backend - Cambia esto por la URL de tu servidor deployado
const API_BASE_URL = 'https://tu-backend-url.herokuapp.com'; // Reemplaza con tu URL real

// Configuración global de la API
const API = {
  baseURL: API_BASE_URL,
  
  // Test de conexión
  async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/test`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      console.log('✅ Conexión exitosa:', data);
      return true;
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }
  },

  // Manejo de errores y requests
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Productos
  products: {
    async getAll(filters = {}) {
      let query = '';
      if (Object.keys(filters).length > 0) {
        query = '?' + new URLSearchParams(filters).toString();
      }
      return await API.request(`/api/products${query}`);
    },

    async getById(id) {
      return await API.request(`/api/products/${id}`);
    },

    async create(productData) {
      return await API.request('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
    },

    async update(id, productData) {
      return await API.request(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
    },

    async delete(id) {
      return await API.request(`/api/products/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Cotizaciones
  quotes: {
    async getAll() {
      return await API.request('/api/quotes');
    },

    async create(quoteData) {
      return await API.request('/api/quotes', {
        method: 'POST',
        body: JSON.stringify(quoteData)
      });
    },

    async updateStatus(id, status) {
      return await API.request(`/api/quotes/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    }
  },

  // Órdenes de stock
  stockOrders: {
    async getAll() {
      return await API.request('/api/stock-orders');
    },

    async create(orderData) {
      return await API.request('/api/stock-orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
    }
  }
};

  // Test automático de conexión al cargar
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔄 Probando conexión con la API...');
  const connected = await API.testConnection();
  
  // Mostrar estado de conexión en la interfaz si existe el elemento
  const connectionStatus = document.getElementById('connection-status');
  if (connectionStatus) {
    const dot = connectionStatus.querySelector('span:first-child');
    const text = connectionStatus.querySelector('span:last-child');
    
    if (connected) {
      dot.className = 'w-2 h-2 bg-green-500 rounded-full';
      text.textContent = 'Conectado';
      connectionStatus.classList.remove('hidden');
    } else {
      dot.className = 'w-2 h-2 bg-red-500 rounded-full';
      text.textContent = 'Desconectado';
      connectionStatus.classList.remove('hidden');
    }
  }
});

// Función global para probar conexión manualmente
window.testConnection = async function() {
  return await API.testConnection();
};

// Exportar API para uso global
window.API = API;