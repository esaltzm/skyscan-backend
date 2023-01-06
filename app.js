require('dotenv').config()
const express = require('express')
const app = express()
const mysql = require('mysql')
const bodyParser = require('body-parser')
const cors = require('cors')


app.use(bodyParser.json())
app.use(cors())

const connection = mysql.createConnection({
	host: process.env.HOST,
	user: 'admin',
	password: process.env.PASSWORD,
	database: 'weather_db'
})

app.get('/', (req, res) => {
	res.send('Welcome to the SkyScan Weather API!')
})

app.get('/count', (req, res) => {
	connection.query(`SELECT COUNT(*) AS count FROM weather;`, (error, results) => {
		if (error) {
			res.status(500).send(error)
		} else {
			res.send(results)
		}
	})
})

app.get('/size', (req, res) => {
	connection.query(`
		SELECT 
			table_name AS \`Table\`, 
			round(((data_length + index_length) / 1024 / 1024 / 1000), 2) \`Size in GB\` 
		FROM information_schema.TABLES 
		WHERE table_schema = "weather_db"
			AND table_name = "weather";
	`, (error, results) => {
		if (error) {
			res.status(500).send(error)
		} else {
			res.send(results)
		}
	})
})

app.get('/times', (req, res) => {
	connection.query(`SELECT UNIQUE time_start FROM weather ORDER BY time_start;`, (error, results) => {
		if (error) {
			res.status(500).send(error)
		} else {
			res.send(results)
		}
	})
})

app.get('/weather/:param/:time/:coords', (req, res) => {
	const param = req.params.param
	const time = req.params.time
	const coords = JSON.parse(req.params.coords) // bounding coords are SW and NE
	const [lowerLat, upperLat] = [coords[0][0], coords[1][0]]
	const [lowerLng, upperLng] = [coords[0][1], coords[1][1]]
	connection.query(`
		SELECT latitude, longitude, ${param}
			FROM weather 
		WHERE latitude > ${lowerLat} AND 
			latitude < ${upperLat} AND 
			longitude > ${lowerLng} AND 
			longitude < ${upperLng} AND 
			time_start = ${time};
	`, (error, results) => {
		if (error) {
			res.status(500).send(error)
		} else {
			const dataRaw = results
			const values = dataRaw.values()
			const data = [...values].map(val => [val.latitude, val.longitude, val[param]])
			res.send(JSON.stringify(data))
		}
	})
})

const port = process.env.PORT || 8080

app.listen(port, () => {
	console.log(`Listening on port ${port}`)
})