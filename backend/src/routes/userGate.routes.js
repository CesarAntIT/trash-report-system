const { Router } = require('express')

//Las Funciones Que Viene Del Controller Para Usar En El Router Y Se Ejecuten En cual quir Accion Http

const RequestUserSolicitudeApi = require('../controllers/users.controller.js')

const router = Router()
//Metodo Post Crear Usuario
<<<<<<< HEAD
router.post('/', RequestUserSolicitudeApi.CrearUsuario)

=======
router.post('/users', RequestUserSolicitudeApi.CrearUsuario)
//Metodo Post Iniciar Session
router.post('/login', RequestUserSolicitudeApi.IniciarSesion)
>>>>>>> 825b0d5 (feat: Nuevo Ruta Agregada Para Iniciar Session)
module.exports = router
