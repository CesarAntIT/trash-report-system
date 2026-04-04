const express = require('express')

//Conexion Con La Base De Datos
const { connectDb } = require('./src/config/db.config.js')

//Las Rutas La Api (Verbos Http (GET,DELETE,POST,CREATE,UPDATE))
const rutas = require('./src/routes/userGate.routes.js')

//Variables Privadas Del .Env

require('dotenv').config()

//Dependencia Del Codigo Solo De Prueba
const ms = require('ms')

const PORT = process.env.PORT ?? 3094
const app = express()

//Middelware (Verifica Primero las Rutas Antes De Ejecutar Algo por Ejemplo Las Rutas)

app.use(express.json())
app.use('/api', rutas)

//Estado Del Servidor (Solo Prueba)
app.get('/healt', (request, response) => {
	const time = process.uptime() * 1000

	response.json({
		success: true,
		message: 'Servidor Encendido',
		uptime: ms(time, { long: true }),
	})
})

//Gates De La Api (Dirreciones A Donde Puede Ir El Usuario)

app.get('/home', (request, response) => {
	response.send('<h1>Hola Estamos En Prueba</h1>')
})

//Para Rutas No Existentes (Devuelve Una Ruta Por Defecto No Encontrada)

app.use((request, response, next) => {
	response.status(404).json({
		success: false,
		message: 'Ruta No Existente',
	})
	next()
})

//Inicio Al Servidor (Estado Encendido)

async function StartServer() {
	await connectDb()
	app.listen(PORT, () => {
		console.log(`Enlace del servidor http://localhost:${PORT}`)
	})
}

StartServer()
