const express = require('express');
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/reports — crear reporte (requiere sesión / ID de usuario)
router.post(
  '/',
  authMiddleware,
  [
    body('locationName').notEmpty().withMessage('La dirección del reporte es requerida'),
    body('latitude').isNumeric().withMessage('La latitud es requerida y debe ser un número'),
    body('longitude').isNumeric().withMessage('La longitud es requerida y debe ser un número'),
    body('evidencias').isArray({ min: 1 }).withMessage('Se requiere al menos una evidencia'),
    body('evidencias.*').notEmpty().withMessage('Las evidencias no pueden estar vacías'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { locationName, latitude, longitude, fecha, evidencias } = req.body;

    try {
      const report = new Report({
        user: req.userId,          // GUID del usuario (ObjectId)
        locationName,
        latitude,
        longitude,
        fecha: fecha || new Date().toLocaleString('es-MX'),
        evidencias,
        status: 'Recibido',        // Estado inicial
        // reportId se genera automáticamente como UUID v4
      });

      await report.save();

      res.status(201).json({
        message: 'Reporte creado exitosamente',
        report: {
          reportId: report.reportId,
          userId: report.user,
          locationName: report.locationName,
          latitude: report.latitude,
          longitude: report.longitude,
          status: report.status,
          evidencias: report.evidencias,
          fecha: report.fecha,
          createdAt: report.createdAt,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
);

// GET /api/reports/mine — reportes del usuario, ordenados por fecha desc
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PATCH /api/reports/:id/cancel — cancelar un reporte propio
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user: req.userId });
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }
    if (report.status === 'Cancelado') {
      return res.status(400).json({ message: 'El reporte ya está cancelado' });
    }
    if (report.status === 'Completado') {
      return res.status(400).json({ message: 'No se puede cancelar un reporte completado' });
    }
    report.status = 'Cancelado';
    await report.save();
    res.json({ message: 'Reporte cancelado', report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
