/**
 * Servidor de mongo-express para visualizar MongoDB en el navegador.
 * Corre en http://localhost:8081
 *
 * Uso: node mongo-express.js
 */
require('dotenv').config();

const mongoExpressConfig = {
  mongodb: {
    server: 'localhost',
    port: 27017,
    dbName: 'trash-report',
    connectionString: process.env.MONGODB_URI || 'mongodb://localhost:27017/trash-report',
  },
  site: {
    baseUrl: '/',
    cookieKeyName: 'mongo-express',
    cookieSecret: 'trash-report-mongo-express-secret',
    host: 'localhost',
    port: 8081,
    requestSizeLimit: '50mb',
    sessionSecret: 'trash-report-session-secret',
  },
  useBasicAuth: false,
  options: {
    console: true,
  },
};

const mongoExpress = require('mongo-express/lib/middleware');
const express = require('express');

const app = express();

mongoExpress(mongoExpressConfig).then((router) => {
  app.use('/', router);
  app.listen(8081, () => {
    console.log('mongo-express corriendo en http://localhost:8081');
  });
}).catch((err) => {
  console.error('Error al iniciar mongo-express:', err.message);
});
