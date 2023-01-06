# SkyScan - Weather Visualization App

## Description:

This project was designed to visualize the weather data I extracted from the [NOAA RAP weather model](https://www.ncei.noaa.gov/products/weather-climate-models/rapid-refresh-update). The backend was built using the Node/Express framework, displaying requested information with a [React frontend](https://github.com/esaltzm/skyscan-frontend). The backend queries an [AWS MariaDB database](https://github.com/esaltzm/weather-api) containing weather data for the continental U.S. going back one year, and uses just a single route to retrieve requested weather information. 

## Technologies Used:

- Node.js and Express
- MySQL
- Deployment via Heroku

## Routes

All routes are GET requests, and only one is actually called by the frontend (the others are just informational)
- '/count' - number of rows in table (was useful during loading)
- '/size' - size in GB of the table
- '/times' - ordered list of unique times present in the table
- '/weather/:param/:time/:coords' This route is used to retrieve data from the front end upon loading of the map, as well as when weather parameter, time, or viewport is changed. 

## Code Snippet

This was the SQL query called by the front end through the weather route:

		SELECT latitude, longitude, ${param}
			FROM weather 
		WHERE latitude > ${lowerLat} AND 
			latitude < ${upperLat} AND 
			longitude > ${lowerLng} AND 
			longitude < ${upperLng} AND 
			time_start = ${time};

## Problems and Solutions

### Changing Project Scope
I had initially planned for the backend of my project by Python based, using the Django framework, but as my goals shifted from a photo sharing app with users and other models to a singular weather database, it made more sense to implement the backend using Node/Express.

### Removing Request Body
While working on the frontend, I realized that Axios was unable to submit a body with a get request as I had tested using Postman, so to fix this issue, I switched the information previously contained in the body (the SW and NE coordinates of the area of interest) to the params. On the frontend, this two dimensional array was first stringified to JSON format, then on the backend was parsed back to its array format to be passed into the SQL query. 

## Future Features

- I may try to implement a filter for the SQL queries with large amounts of datapoints, as the plotting library used in the frontend is not able to handle large amounts of data. This might save time during the data transfer phase of the request-response cycle. 
- The backend could use some security features. Because there ended up being no users / user information held in my database, this was an afterthought, but I would love to limit requests to avoid charges to my AWS RDB account where it is hosted. 