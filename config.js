// Archivo para centralizar la carga de variables de entorno de forma segura
// Asegúrate de instalar dotenv con: npm install dotenv
require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    name: process.env.DB_NAME,
  },
  apiKey: process.env.API_KEY,
};

// Validación básica (No levanta la app si faltan credenciales vitales en prod)
if (config.env === 'production') {
  if (!config.db.user || !config.db.pass) {
    throw new Error(
      '⚠️ ERROR CRÍTICO: Credenciales de BD no definidas para Producción.'
    );
  }
} else {
  if (!config.db.user || !config.db.pass) {
    console.warn(
      '⚠️ ADVERTENCIA: Credenciales de BD no definidas en el entorno local.'
    );
  }
}

module.exports = config;
