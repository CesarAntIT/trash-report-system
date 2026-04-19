const { Router } = require('express')

const RequestUserSolicitudeApi = require('../controllers/users.controller.js')

const router = Router()
//Metodo Get Para Filtra usuarios por nombre y/o dirección con radio de distancia.
router.get('/user', RequestUserSolicitudeApi.FiltrarUsuarios)
//Metodo Post Crear Usuario
router.post('/users', RequestUserSolicitudeApi.CrearUsuario)
//Metodo Post Iniciar Session
router.post('/login', RequestUserSolicitudeApi.IniciarSesion)
//Metodo Put Para Editar Usuario
router.put('/:id', RequestUserSolicitudeApi.EditarUsuario)
//Metodo Get Para Obtener La Informacion Del Usuario
router.get('/:id', authMiddleware, RequestUserSolicitudeApi.GetInfoUsuario) 

module.exports = router
