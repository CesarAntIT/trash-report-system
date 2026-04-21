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
        status: 'Pendiente',       // Estado inicial — Admin cambia a Recibido
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
    if (report.status !== 'Pendiente') {
      return res.status(400).json({ message: 'Solo se pueden cancelar reportes en estado Pendiente' });
    }
    report.status = 'Cancelado';
    await report.save();
    res.json({ message: 'Reporte cancelado', report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PATCH /api/reports/:id/receive — Admin cambia Pendiente → Recibido
router.patch('/:id/receive', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const usuario = await User.findById(req.userId);
    if (!usuario || !usuario.isAdmin) {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
    }
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Reporte no encontrado' });
    if (report.status !== 'Pendiente') {
      return res.status(400).json({ message: `El reporte está en estado "${report.status}", solo se pueden recibir reportes Pendientes` });
    }
    report.status = 'Recibido';
    await report.save();

    await Notification.create({
      user: report.user,
      message: `Tu reporte en "${report.locationName}" ha sido recibido por el ayuntamiento.`,
    });

    res.json({ message: 'Reporte marcado como Recibido', report });
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
    } else {
      filter.status = { $ne: 'Cancelado' };
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

// GET /api/reports/UbicacionesDelMes — reportes del mes actual con posición inicial del mapa
/**
 * @method GetUbicacionesDelMes
 * @description Devuelve las coordenadas de todos los reportes del mes actual
 * para mostrarlos como punteros en el mapa.
 */

router.get('/UbicacionesDelMes', authMiddleware, async (req, res) => {
  try {
    const SANTO_DOMINGO = { latitud: 18.4861, longitud: -69.9312 }
    const User = require('../models/User')
    const usuarioActual = await User.findById(req.userId)
 
    if (!usuarioActual) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      })
    }

    let posicion_inicial = { ...SANTO_DOMINGO, fuente: 'default' }

    const esAdmin = usuarioActual.isAdmin === true

    if (!esAdmin) {
      const tieneUbicacion =
        usuarioActual.address &&
        typeof usuarioActual.address.latitude === 'number' &&
        typeof usuarioActual.address.longitude === 'number'

      if (tieneUbicacion) {
        posicion_inicial = {
          latitud: usuarioActual.address.latitude,
          longitud: usuarioActual.address.longitude,
          fuente: 'usuario',
        }
      }
    }

    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999)

    const reportesDelMes = await Report.find({
      createdAt: { $gte: inicioMes, $lte: finMes },
    }).select('reportId locationName latitude longitude status fecha')

    // Mapea a formato de punteros
    const punteros = reportesDelMes.map((r) => ({
      reportId: r.reportId,
      locationName: r.locationName,
      latitud: r.latitude,
      longitud: r.longitude,
      status: r.status,
      fecha: r.fecha,
    }))
    res.status(200).json({
      success: true,
      posicion_inicial,
      punteros,
      total: punteros.length,
    })
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})


/**
 * @route   GET /api/reports/metricas/resumen
 * @desc    Total de reportes del mes, cantidad por estado (Recibido, Pendiente, etc.)
 * @access  Privado - Solo Administrador
 */
router.get('/metricas/resumen', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User')
    const usuarioActual = await User.findById(req.userId)

    if (!usuarioActual || !usuarioActual.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo administradores.',
      })
    }

    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999)

    const agrupado = await Report.aggregate([
      { $match: { createdAt: { $gte: inicioMes, $lte: finMes } } },
      { $group: { _id: '$status', cantidad: { $sum: 1 } } },
    ])

    // Construir resumen con todos los estados
    const estados = ['Recibido', 'Pendiente', 'Cancelado', 'Completado']
    const resumen = { total: 0 }

    estados.forEach((e) => (resumen[e] = 0))
    agrupado.forEach(({ _id, cantidad }) => {
      if (resumen[_id] !== undefined) resumen[_id] = cantidad
      resumen.total += cantidad
    })

    const mes = ahora.toLocaleString('es-MX', { month: 'long', year: 'numeric' })

    res.status(200).json({ success: true, mes, resumen })
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})


/**
 * @route   GET /api/reports/metricas/distribucion
 * @desc    Distribución de reportes del mes por estado (para gráfico de barras o pastel)
 * @access  Privado - Solo Administrador
 */
router.get('/metricas/distribucion', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User')
    const usuarioActual = await User.findById(req.userId)

    if (!usuarioActual || !usuarioActual.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo administradores.',
      })
    }

    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999)

    const agrupado = await Report.aggregate([
      { $match: { createdAt: { $gte: inicioMes, $lte: finMes } } },
      { $group: { _id: '$status', cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } },
    ])

    const total = agrupado.reduce((acc, { cantidad }) => acc + cantidad, 0)

    const distribucion = agrupado.map(({ _id, cantidad }) => ({
      estado: _id,
      cantidad,
      porcentaje: total > 0 ? parseFloat(((cantidad / total) * 100).toFixed(1)) : 0,
    }))

    res.status(200).json({ success: true, distribucion })
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})


/**
 * @route   GET /api/reports/metricas/top-direcciones
 * @desc    Top de direcciones con mayor cantidad de reportes (de todos los tiempos)
 * @access  Privado - Solo Administrador
 */
router.get('/metricas/top-direcciones', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User')
    const usuarioActual = await User.findById(req.userId)

    if (!usuarioActual || !usuarioActual.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo administradores.',
      })
    }

    const limite = parseInt(req.query.limite) || 5

    const topDirecciones = await Report.aggregate([
      { $group: { _id: '$locationName', total_reportes: { $sum: 1 } } },
      { $sort: { total_reportes: -1 } },
      { $limit: limite },
      { $project: { _id: 0, direccion: '$_id', total_reportes: 1 } },
    ])

    res.status(200).json({ success: true, top_direcciones: topDirecciones })
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor' })
  }
})

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
