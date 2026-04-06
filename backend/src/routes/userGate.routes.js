const { Router } = require('express')

const RequestUserSolicitudeApi = require('../controllers/users.controller.js')

const router = Router()

// POST /api/users — Crear usuario (registro)
router.post('/users', RequestUserSolicitudeApi.CrearUsuario)

// POST /api/users/login — Iniciar sesión
router.post('/users/login', RequestUserSolicitudeApi.Login)

module.exports = router
