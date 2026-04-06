const { Router } = require('express')

const RequestUserSolicitudeApi = require('../controllers/users.controller.js')

const router = Router()
//Metodo Post Crear Usuario
router.post('/users', RequestUserSolicitudeApi.CrearUsuario)
//Metodo Post Iniciar Session
router.post('/login', RequestUserSolicitudeApi.IniciarSesion)
module.exports = router
