const express = require('express');
const pool = require('./db');

const { authMiddleware } = require('./middlewares/verifyToken.js');

const port = 3000;

const app = express();
app.use(express.json());

// 🔧 Ruta para crear tabla (solo una vez)
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


// Ruta protegida
app.get('/protected', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'Acceso concedido ✅', user: req.user });
});



// 🚀 Iniciar servidor
app.listen(port, () => {
  console.log(`API de restaurantes corriendo en puerto ${port}`);
});




const Keycloak = require('keycloak-connect');
require('dotenv').config();

const keycloakConfig = {
  clientId: process.env.KEYCLOAK_CLIENT_ID,
  bearerOnly: true,
  serverUrl: process.env.KEYCLOAK_SERVER_URL,
  realm: process.env.KEYCLOAK_REALM,
  credentials: {
    secret: process.env.KEYCLOAK_CLIENT_SECRET,
  },
};

const keycloak = new Keycloak({}, keycloakConfig);

// 🚪 Endpoint para login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Faltan credenciales' });
    }

    const grant = await keycloak.grantManager.obtainDirectly(username, password);

    res.status(200).json({
      message: 'Login exitoso ✅',
      access_token: grant.access_token.token,
      refresh_token: grant.refresh_token.token,
      user_id: grant.access_token.content.sub,
      roles: grant.access_token.content.realm_access.roles,
    });
  } catch (error) {
    console.error('❌ Error al hacer login:', error.message);
    res.status(401).json({
      message: 'Login fallido',
      error: error.message,
    });
  }
});
