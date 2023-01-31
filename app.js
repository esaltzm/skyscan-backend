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
	database: 'weather'
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
	connection.query(`SELECT MIN(time_start) AS lowest, MAX(time_start) AS highest FROM weather;`, (error, results) => {
		if (error) {
			res.status(500).send(error)
		} else {
			res.send(results)
		}
	})
})

app.get('/minmax/:time/:param', (req, res) => {
	const time = req.params.time
	const param = req.params.param
	connection.query(`SELECT MIN(${param}) AS min, MAX(${param}) AS max FROM weather WHERE time_start = ${time}`, (error, results) => {
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

// route for PhotoCast app - get weather at specific location and time
app.get('/photocast/:time/:lat/:long', (req, res) => {
	const [lat, long] = [req.params.lat, req.params.long]
	connection.query(`
	SELECT * FROM weather
		WHERE time_start >= (${req.params.time} - 5400)
		AND time_start <= (${req.params.time} + 5400)
		AND latitude >= (${lat} - 0.1)
		AND latitude <= (${lat} + 0.1)
		AND longitude >= (${long} - 0.1)
		AND longitude <= (${long} + 0.1);
	`, (error, results) => {
		if (error) {
			res.status(500).send(error)
		} else {
			const haversineDistance = (coord1, coord2) => {
				var p = 0.017453292519943295
				var c = Math.cos
				var a = 0.5 - c((coord2[0] - coord1[0]) * p) / 2 +
					c(coord1[0] * p) * c(coord2[0] * p) *
					(1 - c((coord2[1] - coord1[1]) * p)) / 2
				return Math.asin(Math.sqrt(a))
			}
			const sortedByDistance = results.sort((coord1, coord2) => {
				const distance1 = haversineDistance(coord1, [lat, long]);
				const distance2 = haversineDistance(coord2, [lat, long]);
				return distance1 - distance2;
			})
			res.send(sortedByDistance[0])
		}
	})
})



const port = process.env.PORT || 8080

app.listen(port, () => {
	console.log(`Listening on port ${port}`)
})