const express = require("express");
const router = new express.Router();
const axios = require("axios");
const { connection } = require("../db/mysql");

router.get("/autocomplete/:query", async (req, res) => {
  // getting autocomplete results

  const { query } = req.params;
  await axios(
    `${process.env.API_URL}/locations/v1/cities/autocomplete?apikey=${process.env.API_KEY}&q=${query}`
  )
    .then((response) => {
      res.status(200).json(response.data);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ error: "Can't fetch results" });
    });
});

router.get("/getCurrentWeather/:key", async (req, res) => {
  const { key } = req.params;

  // check if key exists in the weather table
  const checkKeySql = "SELECT * FROM weather WHERE cityKey = ?";
  connection.query(checkKeySql, [key], (error, results) => {
    if (error) {
      console.error("Error checking key in weather table:", error);
      res.status(500).json({ error: "Failed to get weather" });
      return;
    }
    if (results.length === 0) {
      // fetch weather data from the API
      fetchWeatherData(key);
    } else {
      // key exists in the weather table, get and return the weather data
      const weatherData = results[0];

      // the object structure is the same as the structure returned by the weather API

      res.status(200).json({
        weatherData: [
          {
            Temperature: {
              Metric: {
                Value: weatherData.temperature,
              },
            },
            WeatherText: weatherData.weatherText,
          },
        ],
      });
    }
  });

  // function to fetch weather data from the API and save it in the weather table
  const fetchWeatherData = (locationKey) => {
    // make API request to fetch weather data
    axios
      .get(
        `${process.env.API_URL}/currentconditions/v1/${locationKey}?apikey=${process.env.API_KEY}`
      )
      .then((response) => {
        const weatherData = response.data;

        // save the weather data in the weather table
        const saveDataSql =
          "INSERT INTO weather (cityKey, weatherText, temperature) VALUES (?, ?, ?)";
        connection.query(
          saveDataSql,
          [
            locationKey,
            weatherData[0].WeatherText,
            weatherData[0].Temperature.Metric.Value,
          ],
          (error) => {
            if (error) {
              console.error("Error saving weather data:", error);
              res.status(500).json({ error: "Failed to get weather" });
              return;
            }
            res.status(200).json({ weatherData });
          }
        );
      })
      .catch((error) => {
        console.error("Error fetching weather data from API:", error);
        res.status(500).json({ error: "Failed to get weather" });
      });
  };
});

module.exports = router;
