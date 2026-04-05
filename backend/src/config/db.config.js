const { MongoClient } = require('mongodb')
//variables Privadas Importadas Lista Para La Lectura
require('dotenv').config()
const URI = process.env.URI

/**
 * Este Es Nuestro Cliente MongoDB
 * Donde Crea Nuestra Conexion Mediante La URI Privada De Prueba
 */

const client = new MongoClient(URI, {
	maxPoolSize: 200,
})

/**
 * Hace Posible La Conexion A MongoDB
 * @returns {Promise<client>} Resuelve Y Espera A Que La Conexion Se Complete
 */
async function connectDb() {
	try {
		await client.connect()
		console.log('Conexion Exitosa Con MongoDb')
	} catch (error) {
		console.error('Error al conectar Con Mongodb', error.message)
		process.exit(1)
	}
}

module.exports = { client, connectDb }
