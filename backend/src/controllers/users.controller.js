// Conexion Del La Base De Datos Creado (Solo usar) No Volver A Crear
const { client } = require('../config/db.config.js')

// Modelo Entidad De la Clase O Tipo Usuario Requerido
const Usuario = require('../model/user.model.js')

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// Modelo De La Tabla Donde Se Almacenan Los Datos (Que Debemos Usar) Por Nombre DbCollecion
const dbColleccion = () => client.db('mydb').collection('usuarios')

/**
 * @class RequestUserSolicitudeApi
 *
 *Clase Que Maneja Todas Las Solicitudes Hecha Por Los Usuarios Atravez De Metodos Staticos De Forma Asincrona Que Espera Por La Respuesta De La Api Dependiendo Su Funcion
 *
 */

class RequestUserSolicitudeApi {
	/**
	 * Metodo Statico Que Crea Un Usuario Requerido
	 *
	 * @param {request} request - Lo Que Pide El Usuario Al Servidor
	 * @param {response} response - Lo QUe Devuelve El Servidor Si Tiene Lo Que Pide
	 * @returns {Usuario} Usuario - Devuelve Un Usuario Valido y Que Acepta El Servidor
	 */

	static async CrearUsuario(request, response) {
		try {
			const NuevoUsuario = new Usuario(request.body)
			const ExisteUsuario = await dbColleccion().findOne({
				correo: NuevoUsuario.correo,
			})

			//Arreglo De Verificacion De Usuario Con Correo (No Puede Ser Repetido)
			if (ExisteUsuario) {
				return response.status(409).json({
					success: false,
					message: 'Este Correo Ha Sido Tomado Por Otra Persona',
				})
			}

			// Encriptar contraseña antes de guardar
			const salt = await bcrypt.genSalt(10)
			NuevoUsuario.contrasena = await bcrypt.hash(NuevoUsuario.contrasena, salt)

			const resultado = await dbColleccion().insertOne(NuevoUsuario)

			// Generar token JWT
			const token = jwt.sign(
				{ userId: resultado.insertedId, correo: NuevoUsuario.correo },
				process.env.JWT_SECRET || 'secreto_seguro',
				{ expiresIn: '7d' }
			)

			response.status(201).json({
				success: true,
				token,
				user: {
					id: resultado.insertedId,
					nombre: NuevoUsuario.nombre,
					apellido: NuevoUsuario.apellido,
					correo: NuevoUsuario.correo,
				},
			})
		} catch (error) {
			response.status(500).json({ success: false, message: error.message })
		}
	}

	/**
	 * Metodo Statico Para Iniciar Sesion
	 * @param {request} request - Correo y Contrasena Del Usuario
	 * @param {response} response - Token JWT si las credenciales son correctas
	 */
	static async Login(request, response) {
		try {
			const { correo, contrasena } = request.body

			if (!correo || !contrasena) {
				return response.status(400).json({
					success: false,
					message: 'Correo y contraseña son requeridos',
				})
			}

			// Buscar usuario por correo
			const usuario = await dbColleccion().findOne({
				correo: correo.trim().toLowerCase(),
			})

			if (!usuario) {
				return response.status(401).json({
					success: false,
					message: 'El correo electrónico no está registrado',
				})
			}

			// Verificar contraseña
			const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena)
			if (!contrasenaValida) {
				return response.status(401).json({
					success: false,
					message: 'Contraseña incorrecta',
				})
			}

			// Generar token JWT
			const token = jwt.sign(
				{ userId: usuario._id, correo: usuario.correo },
				process.env.JWT_SECRET || 'secreto_seguro',
				{ expiresIn: '7d' }
			)

			response.json({
				success: true,
				token,
				user: {
					id: usuario._id,
					nombre: usuario.nombre,
					apellido: usuario.apellido,
					correo: usuario.correo,
				},
			})
		} catch (error) {
			response.status(500).json({ success: false, message: error.message })
		}
	}

	/**
	 * Metodo Para Iniciar Session Por El Usuario
	 *
	 * @param {correo} request - Campo Requerido Para Poder Iniciar Session Proveniente Del Formulario
	 * @param {contrasena} request - Campo Requerido Para Poder Iniciar Session Proveniente Del Formulario
	 * @returns {Mensaje} - Devuelve Un Mensaje Valido Al Usuario Luego De Iniciar Session Exitosamente
	 */

	static async IniciarSesion(request, response) {
		try {
			const { correo, contrasena } = request.body

			// Validar campos vacíos
			if (!correo || correo.trim() === '') {
				return response.status(400).json({
					success: false,
					message: 'El correo es requerido',
				})
			}

			if (!contrasena || contrasena.trim() === '') {
				return response.status(400).json({
					success: false,
					message: 'La contraseña es requerida',
				})
			}

			// Buscar solo por correo primero
			const ExisteUsuario = await dbColleccion().findOne({
				correo: correo.trim().toLowerCase(),
			})

			// Correo no registrado
			if (!ExisteUsuario) {
				return response.status(404).json({
					success: false,
					message: 'Este correo no está registrado',
				})
			}

			// Contraseña incorrecta
			if (ExisteUsuario.contrasena !== contrasena) {
				return response.status(401).json({
					success: false,
					message: 'Contraseña incorrecta',
				})
			}

			// Login exitoso
			response.status(200).json({
				success: true,
				message: 'Inicio de sesión exitoso',
			})
		} catch (error) {
			response.status(500).json({ success: false, message: error.message })
		}
	}
}

module.exports = RequestUserSolicitudeApi
