/**
 * Entidad Usuario
 * @class
 */

class Usuario {
	/**
	 * Crea Una Instancia De Usuario
	 * @param {string} nombre - Nombre Del Usuario
	 * @param {string} apellido - Apellido Del Usuario
	 * @param {stirng} numero_telefono - Numero Del Usuario
	 * @param {string} correo - Correo Del Usuario
	 * @param {string} contrasena - Contrasena Del Usuario
	 * @param {number} longitud - Logintud Que Proviene Del Usuario(Para Ubicar El En Mapa)
	 * @param {number} latitud -Latitud Que Proviene Del Usuario(Para Ubicar El En Mapa)
	 * @param {string} direccion -Direccion Que Proviene Del Usuario(Para Ubicar El En Mapa)
	 */
	constructor({
		nombre,
		apellido,
		numero_telefono,
		correo,
		contrasena,
		longitud,
		latitud,
		direccion,
	}) {
		//Validaciones De Que Los Campos No Esten Vacios  y No Contengan Espacios
		if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
			throw new Error('nombre es requerido y debe ser texto')
		}
		if (!apellido || typeof apellido !== 'string' || apellido.trim() === '') {
			throw new Error('apellido es requerido y debe ser texto')
		}

		if (
			!numero_telefono ||
			typeof numero_telefono !== 'string' ||
			numero_telefono.trim().length !== 9
		) {
			throw new Error('Numero De Telefono No Valido')
		}
		if (!correo || typeof correo !== 'string') {
			throw new Error('correo electrónico inválido')
		}

		const dominiosPermitidos = [
			'gmail.com',
			'hotmail.com',
			'yahoo.com',
			'outlook.com',
		]
		const dominio = correo.trim().toLowerCase().split('@')[1]

		if (!dominiosPermitidos.includes(dominio)) {
			throw new Error(
				'Solo se permiten correos de Gmail, Hotmail, Yahoo u Outlook'
			)
		}

		if (
			!contrasena ||
			typeof contrasena !== 'string' ||
			contrasena.length < 6
		) {
			throw new Error('contraseña requerida y mínimo 6 caracteres')
		}

		//Limpiar Campos Para Mantenerlos En Buen Estado Para que Llegue Mongo Limpios
		this.nombre = nombre.trim()
		this.apellido = apellido.trim()
		this.numero_telefono =
			typeof numero_telefono === 'string' ? numero_telefono : ''.trim()
		this.correo = correo.trim().toLowerCase()
		this.contrasena = contrasena.trim()
		this.isAdmin = false

		this.longitud = typeof longitud === 'number' ? longitud : 0
		this.latitud = typeof latitud === 'number' ? latitud : 0
		this.direccion = typeof direccion === 'string' ? direccion.trim() : ''

		this.creadoEn = new Date()
	}
}

module.exports = Usuario
