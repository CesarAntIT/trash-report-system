// Conexion Del La Base De Datos Creado (Solo usar) No Volver A Crear
const { client } = require('../config/db.config.js')

//ObjectId Para Verificar Que Sea UN Id Valido De Mongo Clase Especial De Mongo
const { ObjectId } = require('mongodb')

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

			const dominiosPermitidos = [
				'gmail.com',
				'hotmail.com',
				'yahoo.com',
				'outlook.com',
			]
			const dominio = correo.trim().toLowerCase().split('@')[1]

			if (!dominiosPermitidos.includes(dominio)) {
				return response.status(400).json({
					success: false,
					message:
						'Solo se permiten correos de Gmail, Hotmail, Yahoo u Outlook',
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

	/**
	 * @description Edita los datos de un usuario existente en la base de datos.
	 * Solo actualiza los campos que lleguen con valores válidos.
	 * Los campos vacíos o en blanco se ignoran y conservan su valor anterior.
	 *
	 * @route   PUT /usuarios/:idUser
	 * @access  Public
	 *
	 * @param {request}  request  - Objeto de solicitud HTTP
	 * @param {response } response - Objeto de respuesta HTTP
	 *
	 * @param {string} request.params.idUser - ID del usuario a editar (ObjectId de MongoDB)
	 *
	 * @param {Object} request.body - Campos a actualizar
	 * @param {string}[request.body.numero_telefono] - Número de teléfono del usuario
	 * @param {string}[request.body.correo_electronico] - Correo electrónico del usuario
	 * @param {string}[request.body.direccion_personal] - Dirección personal en texto
	 * @param {Object}[request.body.ubicacion_cordenadas] - Coordenadas de ubicación
	 * @param {number}[request.body.ubicacion_cordenadas.latitud] - Latitud (ej: 18.4861)
	 * @param {number} [request.body.ubicacion_cordenadas.longitud] - Longitud (ej: -69.9312)
	 *
	 * @returns {Object} JSON con el resultado de la operación
	 *
	 * @example
	 * // Request
	 * PUT http://localhost:3000/api/69d3f718a643a4ad930abfe7
	 * {
	 *   "numero_telefono": "849-123-4567",
	 *   "correo_electronico": "nuevo@correo.com",
	 *   "direccion_personal": "Calle Principal 123",
	 *   "ubicacion_cordenadas": {
	 *     "latitud": 18.4861,
	 *     "longitud": -69.9312
	 *   }
	 * }
	 *
	 * @example
	 * // Respuesta exitosa - 200
	 * { "success": true, "message": "Usuario actualizado correctamente" }
	 *
	 * @example
	 * // Respuesta error - 404
	 * { "success": false, "message": "Usuario no encontrado" }
	 */
	static async EditarUsuario(request, response) {
		try {
			const { id } = request.params

			//Validar EL ID Por La CLase Especial De Mongo
			if (!ObjectId.isValid(id)) {
				return response.status(400).json({
					success: false,
					message: 'ID de usuario inválido',
				})
			}

			// Verificar que el usuario exista
			const ExisteUsuario = await dbColleccion().findOne({
				_id: new ObjectId(id),
			})

			if (!ExisteUsuario) {
				return response.status(404).json({
					success: false,
					message: 'Usuario no encontrado',
				})
			}

			const {
				numero_telefono,
				correo_electronico,
				direccion_personal,
				ubicacion_cordenadas,
			} = request.body

			// Solo actualiza los campos que llegaron
			// Si un campo está vacío o no llegó, se queda con el valor anterior
			const camposActualizar = {}

			if (numero_telefono && numero_telefono.trim() !== '') {
				if (numero_telefono.trim().length !== 9) {
					return response.status(400).json({
						success: false,
						message: 'El número de teléfono debe tener exactamente 9 dígitos',
					})
				}
				camposActualizar.numero_telefono = numero_telefono.trim()
			}

			const dominiosPermitidos = [
				'gmail.com',
				'hotmail.com',
				'yahoo.com',
				'outlook.com',
			]
			const dominio = correo_electronico.trim().toLowerCase().split('@')[1]

			if (correo_electronico && correo_electronico.trim() !== '') {
				if (!dominiosPermitidos.includes(dominio)) {
					return response.status(400).json({
						success: false,
						message:
							'Solo se permiten correos de Gmail, Hotmail, Yahoo u Outlook',
					})
				}

				// verificar que el nuevo correo no lo tenga otro usuario
				const CorreoExiste = await dbColleccion().findOne({
					correo: correo_electronico.trim().toLowerCase(),
					_id: { $ne: new ObjectId(id) }, // que no sea el mismo usuario
				})

				if (CorreoExiste) {
					return response.status(409).json({
						success: false,
						message: 'Este correo ya está registrado por otro usuario',
					})
				}

				camposActualizar.correo = correo_electronico.trim().toLowerCase()
			}

			if (direccion_personal && direccion_personal.trim() !== '') {
				camposActualizar.direccion = direccion_personal.trim()
			}

			// ubicacion_cordenadas = { latitud: 18.4861, longitud: -69.9312 }
			if (ubicacion_cordenadas) {
				const { latitud, longitud } = ubicacion_cordenadas

				if (typeof latitud === 'number' && typeof longitud === 'number') {
					camposActualizar.latitud = latitud
					camposActualizar.longitud = longitud
				}
			}

			// Si no hay nada que actualizar
			if (Object.keys(camposActualizar).length === 0) {
				return response.status(400).json({
					success: false,
					message: 'No hay campos válidos para actualizar',
				})
			}

			camposActualizar.actualizadoEn = new Date()

			// Actualizar en MongoDB
			await dbColleccion().updateOne(
				{ _id: new ObjectId(id) },
				{ $set: camposActualizar }
			)

			response.status(200).json({
				success: true,
				message: 'Usuario actualizado correctamente',
			})
		} catch (error) {
			response.status(500).json({ success: false, message: error.message })
		}
	}
}

module.exports = RequestUserSolicitudeApi
