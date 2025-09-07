const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");
const router = express.Router();

router.post("/register", (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
    if (row) return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    db.run("INSERT INTO users (email, password) VALUES (?, ?)", [email, hashed], (err) => {
      if (err) return res.status(500).json({ message: "Error saving user" });
      res.status(201).json({ message: "User registered successfully" });
    });
  });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    req.session.userId = user.id;
    res.json({ message: "Login successful" });
  });
});

router.get("/me", (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not logged in" });

  db.get("SELECT id, email FROM users WHERE id = ?", [req.session.userId], (err, user) => {
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json(user);
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});

module.exports = router;
