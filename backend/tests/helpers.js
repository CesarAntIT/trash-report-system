/**
 * Helpers compartidos entre todos los archivos de test.
 * Provee: setup/teardown de mongo en memoria, factories de usuarios y reportes.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

process.env.JWT_SECRET = 'test_secret_qa_2026';

let mongoServer;

async function setupDb() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}

async function teardownDb() {
  await mongoose.disconnect();
  await mongoServer.stop();
}

async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

function makeToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

async function createUser(overrides = {}) {
  const User = require('../src/models/User');
  const hash = await bcrypt.hash('password123', 10);
  return User.create({
    name:     overrides.name     ?? 'Test User',
    email:    overrides.email    ?? `user_${Date.now()}@test.com`,
    password: hash,
    phone:    overrides.phone    ?? '',
    isAdmin:  overrides.isAdmin  ?? false,
    address:  overrides.address  ?? undefined,
  });
}

async function createReport(userId, overrides = {}) {
  const Report = require('../src/models/Report');
  return Report.create({
    user:         userId,
    locationName: overrides.locationName ?? 'Parque Central',
    latitude:     overrides.latitude     ?? 20.9674,
    longitude:    overrides.longitude    ?? -89.6237,
    fecha:        overrides.fecha        ?? '20/04/2026, 10:00',
    evidencias:   overrides.evidencias   ?? ['data:image/jpeg;base64,abc123'],
    status:       overrides.status       ?? 'Pendiente',
  });
}

const VALID_REPORT_BODY = {
  locationName: 'Parque Central',
  latitude:     20.9674,
  longitude:    -89.6237,
  fecha:        '20/04/2026, 10:00',
  evidencias:   ['data:image/jpeg;base64,abc123'],
};

module.exports = {
  setupDb, teardownDb, clearCollections,
  makeToken, createUser, createReport,
  VALID_REPORT_BODY,
};
