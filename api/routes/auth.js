const express = require('express');
const router = express.Router();
const Keycloak = require('keycloak-connect');
const axios = require('axios');
require('dotenv').config();

const keycloakConfig = {
  clientId: process.env.KEYCLOAK_CLIENT_ID, // cliente de la API, ej: restaurante-api
  bearerOnly: true,
  serverUrl: process.env.KEYCLOAK_SERVER_URL, // http://keycloak:8080
  realm: process.env.KEYCLOAK_REALM, // restaurante-app
  credentials: {
    secret: process.env.KEYCLOAK_CLIENT_SECRET,
  },
};

const keycloak = new Keycloak({}, keycloakConfig);

// 🔐 POST /auth/login → Login con usuario y contraseña
router.post('/login', async (req, res) => {
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

// ✅ POST /auth/register → Crear usuario en Keycloak desde la API
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // Paso 1: Obtener token de administrador desde el realm master
    const tokenResponse = await axios.post(
      `${process.env.KEYCLOAK_SERVER_URL}/realms/master/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: process.env.KEYCLOAK_ADMIN_USERNAME,
        password: process.env.KEYCLOAK_ADMIN_PASSWORD,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const adminToken = tokenResponse.data.access_token;

    // Paso 2: Crear usuario
    const userPayload = {
      username,
      enabled: true,
      credentials: [{
        type: 'password',
        value: password,
        temporary: false,
      }],
    };

    await axios.post(
      `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`,
      userPayload,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(201).json({ message: 'Usuario registrado correctamente ✅' });
  } catch (err) {
    console.error('❌ Error al registrar usuario:', err.response?.data || err.message);
    res.status(500).json({
      message: 'Error registrando usuario',
      error: err.response?.data || err.message,
    });
  }
});

module.exports = router;