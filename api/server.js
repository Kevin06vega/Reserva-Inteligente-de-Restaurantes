const express = require('express');
const pool = require('./db');
require('dotenv').config();

const { authMiddleware } = require('./middlewares/verifyToken');

// 🚩 Rutas
const authRoutes = require('./routes/auth');

const app = express();
const port = 3000;

app.use(express.json());

// 👉 Registrar rutas
app.use('/auth', authRoutes);

// 🔧 Crear tabla (solo una vez)
app.get('/setup', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        address VARCHAR(150) NOT NULL
      );
    `);
    res.status(200).json({ message: 'Tabla restaurants creada correctamente' });
  } catch (err) {
    console.error('Error creando tabla:', err);
    res.sendStatus(500);
  }
});

// 📥 Crear restaurante
app.post('/restaurants', async (req, res) => {
  const { name, address } = req.body;
  try {
    await pool.query(
      'INSERT INTO restaurants (name, address) VALUES ($1, $2)',
      [name, address]
    );
    res.status(201).json({ message: 'Restaurante creado exitosamente' });
  } catch (err) {
    console.error('Error insertando restaurante:', err);
    res.sendStatus(500);
  }
});

// 📤 Obtener todos los restaurantes
app.get('/restaurants', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM restaurants');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error obteniendo restaurantes:', err);
    res.sendStatus(500);
  }
});

// 🔒 Ruta protegida
app.get('/protected', authMiddleware, (req, res) => {
  res.status(200).json({
    message: 'Acceso concedido ✅',
    user: req.user,
  });
});

// 🚀 Iniciar servidor
app.listen(port, () => {
  console.log(`API de restaurantes corriendo en puerto ${port}`);
});
