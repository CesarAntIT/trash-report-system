const express = require('express');
const Notification = require('../models/Notifications.js');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Obtener notificaciones del usuario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.userId })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Marcar notificación como leída (desaparece al tocarla)
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;