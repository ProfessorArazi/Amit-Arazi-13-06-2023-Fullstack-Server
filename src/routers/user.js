const express = require("express");
const router = new express.Router();
const { v4: uuidv4 } = require("uuid");
const { connection } = require("../db/mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  // Check if the username already exists in the database
  const checkUsernameQuery =
    "SELECT COUNT(*) AS count FROM users WHERE username = ?";
  connection.query(checkUsernameQuery, [username], async (error, results) => {
    if (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ error: "Failed to sign up" });
      return;
    }

    const { count } = results[0];

    if (count > 0) {
      res.status(400).json({ error: "Username already exists" });
      return;
    }

    // Generate a unique userId
    const userId = uuidv4();
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a token
    const token = jwt.sign({ userId }, "soccerbasketball");

    // Insert the user into the database with an empty favorites array
    const insertUserQuery =
      "INSERT INTO users (username, password, token, favorites, userId) VALUES (?, ?, ?, ?, ?)";
    connection.query(
      insertUserQuery,
      [username, hashedPassword, token, JSON.stringify([]), userId],
      (error, results) => {
        if (error) {
          console.error("Error signing up:", error);
          res.status(500).json({ error: "Failed to sign up" });
          return;
        }
        res
          .status(201)
          .json({ message: "Signed up successfully", token, userId });
      }
    );
  });
});

// Login route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Retrieve the user from the database
  const sql = "SELECT * FROM users WHERE username = ?";
  connection.query(sql, [username], async (error, results) => {
    if (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ error: "Failed to log in" });
      return;
    }

    // Check if user exists
    if (results.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Compare the hashed password
    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Create and sign a JWT token
    const token = jwt.sign({ userId: user.userId }, "soccerbasketball");

    // Update the user's token in the database
    const updateSql = "UPDATE users SET token = ? WHERE userId = ?";
    connection.query(updateSql, [token, user.userId], (error) => {
      if (error) {
        console.error("Error updating token:", error);
        res.status(500).json({ error: "Failed to log in" });
        return;
      }
      res
        .status(200)
        .json({ token, userId: user.userId, favorites: user.favorites });
    });
  });
});

module.exports = router;
