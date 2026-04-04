//Conexion Del La Base De Datos Creado (Solo usar) No Volver A Crear
const { client } = require('../config/db.config.js')

//Modelo Entidad De la Clase O Tipo Usuario Requerido
const Usuario = require('../model/user.model.js')

// Modelo De La Tabla Donde Se Almacenan Los Datos (Que Debemos Usar) Por Nombre DbCollecion
const dbColleccion = () => client.db('mydb').collection('usuarios')

class RequestUserSolicitudeApi {
	/**
	 * Metodo Statico Que Crea Un Usuario Requerido
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
					message: 'Este Correo Ha Sido Tomado Por Otra Persona ',
				})
			}
			const resultado = await dbColleccion().insertOne(NuevoUsuario)
			response.status(201).json({ success: true, id: resultado.insertedId })
		} catch (error) {
			response.status(500).json({ success: false, message: error.message })
		}
	}
}

module.exports = RequestUserSolicitudeApi
