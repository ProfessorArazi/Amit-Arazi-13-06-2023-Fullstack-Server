const mysql = require("mysql");

const connection = mysql.createConnection({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_USER,
});

connection.connect((error) => {
  if (error) {
    console.error("Error connecting to MySQL:", error);
    return;
  }
});

module.exports = { connection };
