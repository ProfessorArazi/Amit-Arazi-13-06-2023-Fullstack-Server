const express = require("express");
const router = new express.Router();
const jwt = require("jsonwebtoken");
const { connection } = require("../db/mysql");

const verifyTokenAndUserId = (req, res, next) => {
  // checking if the token belongs to the user

  const { token, userId } = req.body;

  if (!token || !userId) {
    res.status(401).json({ error: "Token and/or user ID not provided" });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    if (decoded.userId !== userId) {
      res.status(401).json({ error: "Token does not match user ID" });
      return;
    }

    req.userId = userId;
    next();
  });
};

// get favorites route
router.post("/favorites", verifyTokenAndUserId, (req, res) => {
  const { userId } = req.body;

  // getting favorites from the database for the user with userId
  const selectSql = "SELECT favorites FROM users WHERE userId = ?";
  connection.query(selectSql, [userId], (error, results) => {
    if (error) {
      console.error("Error getting favorites:", error);
      res.status(500).json({ error: "Failed to get favorites" });
      return;
    }
    const favorites = JSON.parse(results[0].favorites);
    res.status(200).json({ favorites });
  });
});

// delete favorite route
router.post("/favorites/delete", verifyTokenAndUserId, (req, res) => {
  const { userId, favoriteId } = req.body;

  // getting favorites from the database for the user with userId
  const selectSql = "SELECT favorites FROM users WHERE userId = ?";
  connection.query(selectSql, [userId], (error, results) => {
    if (error) {
      console.error("Error getting favorites:", error);
      res.status(500).json({ error: "Failed to get favorites" });
      return;
    }

    const favorites = JSON.parse(results[0].favorites);

    // find the index of the favorite to be deleted
    const index = favorites.findIndex(
      (favorite) => favorite.Key === favoriteId
    );

    // if the favorite is found, remove it from the array
    if (index !== -1) {
      favorites.splice(index, 1);

      // update the favorites in the database
      const updateSql = "UPDATE users SET favorites = ? WHERE userId = ?";
      connection.query(
        updateSql,
        [JSON.stringify(favorites), userId],
        (error) => {
          if (error) {
            console.error("Error updating favorites:", error);
            res.status(500).json({ error: "Failed to update favorites" });
            return;
          }
          res
            .status(200)
            .json({ message: "Favorite deleted successfully", favorites });
        }
      );
    } else {
      res.status(404).json({ error: "Favorite not found" });
    }
  });
});

// add favorite route
router.post("/favorites/new", verifyTokenAndUserId, (req, res) => {
  const { newFavorite, userId } = req.body;

  // getting favorites from the database for the user with userId
  const selectSql = "SELECT favorites FROM users WHERE userId = ?";
  connection.query(selectSql, [userId], (error, results) => {
    if (error) {
      console.error("Error getting favorites:", error);
      res.status(500).json({ error: "Failed to get favorites" });
      return;
    }

    const favorites = JSON.parse(results[0].favorites);

    // check if the new favorite already exists
    const existingFavorite = favorites.find(
      (favorite) => favorite.Key === newFavorite.Key
    );
    if (existingFavorite) {
      res.status(400).json({ error: "Favorite already exists" });
      return;
    }

    // add the new favorite to the array
    favorites.push(newFavorite);

    // update the favorites in the database
    const updateSql = "UPDATE users SET favorites = ? WHERE userId = ?";
    connection.query(
      updateSql,
      [JSON.stringify(favorites), userId],
      (error) => {
        if (error) {
          console.error("Error updating favorites:", error);
          res.status(500).json({ error: "Failed to update favorites" });
          return;
        }
        res.status(200).json({ favorites });
      }
    );
  });
});

module.exports = router;
