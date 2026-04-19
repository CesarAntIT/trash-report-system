const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID de usuario es requerido'],
  },
  locationName: {
    type: String,
    required: [true, 'La dirección del reporte es requerida'],
    trim: true,
  },
  latitude: {
    type: Number,
    required: [true, 'La latitud es requerida'],
  },
  longitude: {
    type: Number,
    required: [true, 'La longitud es requerida'],
  },
  status: {
    type: String,
    enum: ['Recibido', 'Pendiente', 'Cancelado', 'Completado'],
    default: 'Recibido',
    required: [true, 'El estatus es requerido'],
  },
  evidencias: {
    type: [String],
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: 'Se requiere al menos una evidencia',
    },
  },
  fecha: {
    type: String,
    required: [true, 'La fecha es requerida'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Report', reportSchema);
