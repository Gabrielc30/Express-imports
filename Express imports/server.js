const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'express_imports',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

// Initialize database
async function initDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    
    // Test connection
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    
    // Create tables if they don't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2) DEFAULT NULL,
        category VARCHAR(100) NOT NULL,
        image_emoji VARCHAR(10) DEFAULT '📦',
        stock_quantity INT DEFAULT 0,
        in_stock BOOLEAN DEFAULT FALSE,
        is_offer BOOLEAN DEFAULT FALSE,
        is_new BOOLEAN DEFAULT FALSE,
        is_premium BOOLEAN DEFAULT FALSE,
        shipping_info VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        message TEXT,
        status ENUM('pending', 'reviewed', 'quoted', 'accepted', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quote_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quote_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS stock_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        shipping_address TEXT NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'processing', 'shipped', 'delivered') DEFAULT 'pending',
        tracking_number VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS stock_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES stock_orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Insert sample products if table is empty
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM products');
    if (rows[0].count === 0) {
      await insertSampleProducts(connection);
    }

    connection.release();
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

// Insert sample products
async function insertSampleProducts(connection) {
  const sampleProducts = [
    {
      name: 'iPhone 15 Pro Max - Titanium',
      description: 'Exclusivo modelo titanium no disponible localmente',
      price: 899.99,
      original_price: 1199.99,
      category: 'electronica',
      image_emoji: '📱',
      stock_quantity: 0,
      in_stock: false,
      is_offer: true,
      is_new: false,
      is_premium: true
    },
    {
      name: 'AirPods Pro 3 - Stock USA',
      description: 'Disponible en almacén Miami - Envío inmediato',
      price: 189.99,
      original_price: 249.99,
      category: 'electronica',
      image_emoji: '🎧',
      stock_quantity: 15,
      in_stock: true,
      is_offer: true,
      is_new: false,
      shipping_info: '24H'
    },
    {
      name: 'Cafetera Italiana De\'Longhi',
      description: 'Importada directamente de Italia',
      price: 299.99,
      original_price: 449.99,
      category: 'hogar',
      image_emoji: '☕',
      stock_quantity: 0,
      in_stock: false,
      is_offer: false,
      is_new: false,
      is_premium: true
    },
    {
      name: 'Lámpara LED Philips Hue',
      description: 'Sistema inteligente - Stock inmediato',
      price: 149.99,
      original_price: 199.99,
      category: 'hogar',
      image_emoji: '💡',
      stock_quantity: 8,
      in_stock: true,
      is_offer: false,
      is_new: false,
      shipping_info: '24H'
    },
    {
      name: 'Apple Watch Ultra 2',
      description: 'Para aventureros y deportistas extremos',
      price: 649.99,
      original_price: 799.99,
      category: 'electronica',
      image_emoji: '⌚',
      stock_quantity: 0,
      in_stock: false,
      is_offer: true,
      is_new: false,
      is_premium: true
    },
    {
      name: 'Difusor Aromático Japonés',
      description: 'Tecnología ultrasónica - Listo para enviar',
      price: 89.99,
      original_price: 129.99,
      category: 'hogar',
      image_emoji: '🌸',
      stock_quantity: 12,
      in_stock: true,
      is_offer: false,
      is_new: true,
      shipping_info: '24H'
    },
    {
      name: 'MacBook Pro 16" M3',
      description: 'Última generación con chip M3',
      price: 2199.99,
      original_price: 2499.99,
      category: 'electronica',
      image_emoji: '💻',
      stock_quantity: 0,
      in_stock: false,
      is_offer: true,
      is_new: true,
      is_premium: true
    },
    {
      name: 'Robot Aspiradora Roomba i7+',
      description: 'Vaciado automático incluido',
      price: 599.99,
      original_price: 799.99,
      category: 'hogar',
      image_emoji: '🤖',
      stock_quantity: 5,
      in_stock: true,
      is_offer: true,
      is_new: false,
      shipping_info: '48H'
    }
  ];

  for (const product of sampleProducts) {
    await connection.execute(`
      INSERT INTO products (name, description, price, original_price, category, image_emoji, stock_quantity, in_stock, is_offer, is_new, is_premium, shipping_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      product.name, product.description, product.price, product.original_price,
      product.category, product.image_emoji, product.stock_quantity, product.in_stock,
      product.is_offer, product.is_new, product.is_premium, product.shipping_info
    ]);
  }
}

// Email configuration
const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Routes

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Express Imports API funcionando correctamente',
    server: 'Express Imports Backend',
    timestamp: new Date().toISOString(),
    status: 'online'
  });
});

// Products routes
app.get('/api/products', async (req, res) => {
  try {
    const { search, category, in_stock } = req.query;
    let query = 'SELECT * FROM products';
    let params = [];
    let conditions = [];

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ? OR category LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category && category !== 'todos') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (in_stock === 'true') {
      conditions.push('in_stock = true');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const {
      name, description, price, original_price, category, image_emoji,
      stock_quantity, in_stock, is_offer, is_new, is_premium, shipping_info
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Nombre, precio y categoría son requeridos' });
    }

    const [result] = await pool.execute(`
      INSERT INTO products (name, description, price, original_price, category, image_emoji, stock_quantity, in_stock, is_offer, is_new, is_premium, shipping_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, description || null, price, original_price || price * 1.3, category,
      image_emoji || '📦', stock_quantity || 0, !!in_stock, !!is_offer, !!is_new, !!is_premium, shipping_info || null
    ]);

    res.status(201).json({
      id: result.insertId,
      message: 'Producto creado exitosamente'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const {
      name, description, price, original_price, category, image_emoji,
      stock_quantity, in_stock, is_offer, is_new, is_premium, shipping_info
    } = req.body;

    const [result] = await pool.execute(`
      UPDATE products SET 
      name = ?, description = ?, price = ?, original_price = ?, category = ?,
      image_emoji = ?, stock_quantity = ?, in_stock = ?, is_offer = ?, is_new = ?, is_premium = ?, shipping_info = ?
      WHERE id = ?
    `, [
      name, description, price, original_price, category, image_emoji,
      stock_quantity, !!in_stock, !!is_offer, !!is_new, !!is_premium, shipping_info, req.params.id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// Quotes routes
app.get('/api/quotes', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT q.*, GROUP_CONCAT(CONCAT(p.name, ' (x', qi.quantity, ')') SEPARATOR ', ') as items
      FROM quotes q
      LEFT JOIN quote_items qi ON q.id = qi.quote_id
      LEFT JOIN products p ON qi.product_id = p.id
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Error al obtener cotizaciones' });
  }
});

app.post('/api/quotes', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { customer_name, customer_email, message, items } = req.body;

    if (!customer_name || !customer_email || !items || items.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos para la cotización' });
    }

    // Create quote
    const [quoteResult] = await connection.execute(`
      INSERT INTO quotes (customer_name, customer_email, message)
      VALUES (?, ?, ?)
    `, [customer_name, customer_email, message || '']);

    const quoteId = quoteResult.insertId;

    // Add quote items
    for (const item of items) {
      await connection.execute(`
        INSERT INTO quote_items (quote_id, product_id, quantity)
        VALUES (?, ?, ?)
      `, [quoteId, item.product_id, item.quantity || 1]);
    }

    await connection.commit();

    // Send email notification (optional)
    try {
      await transport.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: 'Nueva Solicitud de Cotización - Express Imports',
        html: `
          <h2>Nueva Solicitud de Cotización</h2>
          <p><strong>Cliente:</strong> ${customer_name}</p>
          <p><strong>Email:</strong> ${customer_email}</p>
          <p><strong>Mensaje:</strong> ${message || 'Sin mensaje'}</p>
          <p><strong>Productos solicitados:</strong> ${items.length}</p>
          <p>Revisa el panel de administración para más detalles.</p>
        `
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    res.status(201).json({
      id: quoteId,
      message: 'Cotización creada exitosamente'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating quote:', error);
    res.status(500).json({ error: 'Error al crear cotización' });
  } finally {
    connection.release();
  }
});

app.put('/api/quotes/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'reviewed', 'quoted', 'accepted', 'rejected'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const [result] = await pool.execute(
      'UPDATE quotes SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    res.json({ message: 'Estado actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating quote status:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// Stock orders routes
app.get('/api/stock-orders', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT so.*, GROUP_CONCAT(CONCAT(p.name, ' (x', soi.quantity, ')') SEPARATOR ', ') as items
      FROM stock_orders so
      LEFT JOIN stock_order_items soi ON so.id = soi.order_id
      LEFT JOIN products p ON soi.product_id = p.id
      GROUP BY so.id
      ORDER BY so.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

app.post('/api/stock-orders', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { customer_name, customer_email, shipping_address, items } = req.body;

    if (!customer_name || !customer_email || !shipping_address || !items || items.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos para la orden' });
    }

    let total = 0;

    // Validate products and calculate total
    for (const item of items) {
      const [productRows] = await connection.execute(
        'SELECT * FROM products WHERE id = ? AND in_stock = true',
        [item.product_id]
      );

      if (productRows.length === 0) {
        throw new Error(`Producto ${item.product_id} no disponible en stock`);
      }

      const product = productRows[0];
      if (product.stock_quantity < (item.quantity || 1)) {
        throw new Error(`Stock insuficiente para ${product.name}`);
      }

      total += product.price * (item.quantity || 1);
    }

    // Create order
    const [orderResult] = await connection.execute(`
      INSERT INTO stock_orders (customer_name, customer_email, shipping_address, total)
      VALUES (?, ?, ?, ?)
    `, [customer_name, customer_email, shipping_address, total]);

    const orderId = orderResult.insertId;

    // Add order items and update stock
    for (const item of items) {
      const [productRows] = await connection.execute(
        'SELECT * FROM products WHERE id = ?',
        [item.product_id]
      );
      const product = productRows[0];

      await connection.execute(`
        INSERT INTO stock_order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `, [orderId, item.product_id, item.quantity || 1, product.price]);

      // Update stock
      const newQuantity = product.stock_quantity - (item.quantity || 1);
      await connection.execute(`
        UPDATE products SET stock_quantity = ?, in_stock = ? WHERE id = ?
      `, [newQuantity, newQuantity > 0, item.product_id]);
    }

    await connection.commit();

    // Send confirmation email
    try {
      await transport.sendMail({
        from: process.env.EMAIL_USER,
        to: customer_email,
        subject: 'Confirmación de Pedido - Express Imports',
        html: `
          <h2>¡Pedido Confirmado!</h2>
          <p>Hola ${customer_name},</p>
          <p>Tu pedido #${orderId} ha sido confirmado exitosamente.</p>
          <p><strong>Total:</strong> $${total.toFixed(2)}</p>
          <p><strong>Dirección de envío:</strong> ${shipping_address}</p>
          <p>Recibirás el número de tracking por email en las próximas 24 horas.</p>
          <p>¡Gracias por confiar en Express Imports!</p>
        `
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }

    res.status(201).json({
      id: orderId,
      total: total,
      message: 'Orden creada exitosamente'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message || 'Error al crear orden' });
  } finally {
    connection.release();
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Express Imports API running on port ${PORT}`);
    console.log(`Test the API at: http://localhost:${PORT}/api/test`);
  });
});

module.exports = app;