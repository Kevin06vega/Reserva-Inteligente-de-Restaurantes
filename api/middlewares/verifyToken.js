const Keycloak = require("keycloak-connect");
const Jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "Token is required",
        authentication: "Unauthorized",
      });
    }

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

    keycloak.grantManager
      .validateAccessToken(token)
      .then((result) => {
        if (!result) {
          return res.status(401).json({
            message: "Secret Token Invalid",
            authentication: "Unauthorized",
          });
        }

        // Opcional: decodificar y guardar info del usuario
        const decoded = Jwt.decode(result);
        req.user = decoded;
        next();
      })
      .catch((err) => {
        console.error("❌ Token inválido", err.message);
        return res.status(401).json({
          error: "Invalid token",
          details: err.message,
        });
      });
  } catch (err) {
    console.error("🔴 Error en el middleware:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  authMiddleware,
};
