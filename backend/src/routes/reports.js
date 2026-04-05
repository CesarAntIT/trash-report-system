const express = require('express');
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/reports — crear reporte (requiere sesión)
router.post(
  '/',
  authMiddleware,
  [
    body('locationName').notEmpty().withMessage('El nombre de ubicación es requerido'),
    body('latitude').isNumeric().withMessage('Latitud inválida'),
    body('longitude').isNumeric().withMessage('Longitud inválida'),
    body('evidencias').isArray({ min: 1 }).withMessage('Se requiere al menos 1 evidencia'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { locationName, latitude, longitude, fecha, evidencias } = req.body;

    try {
      const report = new Report({
        user: req.userId,
        locationName,
        latitude,
        longitude,
        fecha: fecha || new Date().toLocaleString('es-MX'),
        evidencias,
      });

      await report.save();
      res.status(201).json({ message: 'Reporte creado exitosamente', report });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
);

// GET /api/reports/mine — mis reportes (requiere sesión)
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
