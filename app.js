require('dotenv').config()
const express = require('express')
const app = express()
const mysql = require('mysql')

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
	connection.query('SELECT COUNT(*) AS count FROM weather;', (error, results) => {
		if (error) {
			res.status(500).send(error)
		} else {
			res.send(results)
		}
	})
})

app.listen(3000, () => {
	console.log('Listening on port 3000')
})