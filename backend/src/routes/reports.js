const express = require('express');
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const authMiddleware = require('../middleware/auth');
const Notification = require('../models/Notifications.js');

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

      await Notification.create({
        user: req.userId,
        message: `Tu reporte en "${locationName}" ha sido enviado.`,
      });

      await Notification.create({
        user: req.userId,
        message: `Tu reporte en "${locationName}" ha sido guardado en el servidor.`,
      });

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

// GET /api/reports?address=&startDate=&endDate=&status=
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { address, startDate, endDate, status } = req.query;
    const filter = {};

    if (address) {
      filter.locationName = { $regex: address, $options: 'i' };
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const [d, m, y] = startDate.split('-');
        filter.createdAt.$gte = new Date(`${y}-${m}-${d}`);
      }
      if (endDate) {
        const [d, m, y] = endDate.split('-');
        filter.createdAt.$lte = new Date(`${y}-${m}-${d}`);
      }
    }

    const reports = await Report.find(filter).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @method GetDetalleReporte
 * @description Devuelve la información completa de un reporte por su reportId (UUID).
 * Accesible por cualquier usuario autenticado (ciudadano o administrador).
 */
router.get('/:reportId', authMiddleware, async (req, res) => {
  try {
    const { reportId } = req.params

    const reporte = await Report.findOne({ reportId })

    if (!reporte) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado',
      })
    }

    res.status(200).json({
      success: true,
      reporte: {
        reportId: reporte.reportId,
        usuarioId: reporte.user,
        locationName: reporte.locationName,
        ubicacion: {
          latitud: reporte.latitude,
          longitud: reporte.longitude,
        },
        fecha: reporte.fecha,
        status: reporte.status,
        evidencias: reporte.evidencias,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})

module.exports = router;
