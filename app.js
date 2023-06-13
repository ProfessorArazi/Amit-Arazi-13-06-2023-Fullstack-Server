const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./src/db/mysql");
const userRouter = require("./src/routers/user");
const favoritesRouter = require("./src/routers/favorites");
const weatherRouter = require("./src/routers/weather");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.use(userRouter);
app.use(favoritesRouter);
app.use(weatherRouter);

app.get("/", (req, res) => {
  res.send({ message: "working" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, console.log(`Server started on port ${PORT}`));

module.exports = app;
