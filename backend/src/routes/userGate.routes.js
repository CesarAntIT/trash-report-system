const { Router } = require('express')

//Las Funciones Que Viene Del Controller Para Usar En El Router Y Se Ejecuten En cual quir Accion Http

const RequestUserSolicitudeApi = require('../controllers/users.controller.js')

const router = Router()
//Metodo Post Crear Usuario
router.post('/users', RequestUserSolicitudeApi.CrearUsuario)
//Metodo Post Iniciar Session
router.post('/login', RequestUserSolicitudeApi.IniciarSesion)
//Metodo Put Para Editar Usuario
router.put('/:id', RequestUserSolicitudeApi.EditarUsuario)
module.exports = router
