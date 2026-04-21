const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:id — info del usuario (cualquier autenticado puede ver)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    res.json({
      success: true,
      esPropietario: req.userId === req.params.id,
      usuario: {
        id: user._id,
        nombre_completo: user.name,
        correo_electronico: user.email,
        numero_telefono: user.phone || '',
        direccion_personal: user.address?.text || '',
        ubicacion: user.address?.latitude != null
          ? { latitud: user.address.latitude, longitud: user.address.longitude }
          : null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// PUT /api/users/:id — editar perfil (solo el mismo usuario)
router.put(
  '/:id',
  authMiddleware,
  [
    body('phone').optional().trim(),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Correo inválido'),
    body('address.text').optional().trim(),
    body('address.latitude').optional().isNumeric(),
    body('address.longitude').optional().isNumeric(),
  ],
  async (req, res) => {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ message: 'Solo puedes editar tu propia cuenta' });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { phone, email, address } = req.body;
      const update = {};

      if (phone && phone.trim()) update.phone = phone.trim();
      if (email && email.trim()) {
        const existing = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: req.params.id } });
        if (existing) return res.status(400).json({ message: 'El correo ya está en uso por otra cuenta' });
        update.email = email.trim().toLowerCase();
      }
      if (address) {
        update.address = {};
        if (address.text && address.text.trim()) update.address.text = address.text.trim();
        if (address.latitude != null) update.address.latitude = address.latitude;
        if (address.longitude != null) update.address.longitude = address.longitude;
      }

      if (Object.keys(update).length === 0) {
        return res.status(400).json({ message: 'No se enviaron campos para actualizar' });
      }

      const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).select('-password');
      res.json({ success: true, message: 'Perfil actualizado', usuario: user });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }
);

module.exports = router;
