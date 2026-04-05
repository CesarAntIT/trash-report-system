const { Router } = require('express')

//Las Funciones Que Viene Del Controller Para Usar En El Router Y Se Ejecuten En cual quir Accion Http

const RequestUserSolicitudeApi = require('../controllers/users.controller.js')

const router = Router()
//Metodo Post Crear Usuario
router.post('/users', RequestUserSolicitudeApi.CrearUsuario)
<<<<<<< HEAD
//Metodo Post Iniciar Session
router.post('/login', RequestUserSolicitudeApi.IniciarSesion)
=======

>>>>>>> 57a75317353f8cdc13726a738675ba99222070b8
module.exports = router
