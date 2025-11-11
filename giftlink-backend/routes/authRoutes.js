const express = require("express");
const app = express();
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const connectToDatabase = require("../models/db");
const router = express.Router();
const dotenv = require("dotenv");
const pino = require("pino");

const logger = pino();
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

router.post("/register", async (req, res) => {
  try {
    // Validate required fields
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Connect to database
    const db = await connectToDatabase();
    const collection = db.collection("users");

    // Check if email already exists
    const existingEmail = await collection.findOne({ email: email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(password, salt);

    // Save user to database
    const newUser = await collection.insertOne({
      email: email,
      firstName: firstName || "",
      lastName: lastName || "",
      password: hash,
      createdAt: new Date(),
    });

    // Create JWT token
    const payload = {
      user: {
        id: newUser.insertedId,
      },
    };

    const authtoken = jwt.sign(payload, JWT_SECRET);
    logger.info(`User registered: ${email}`);
    res.status(201).json({ authtoken, email });
  } catch (e) {
    logger.error("Register error:", e.message);
    return res.status(500).json({ error: "Internal server error", details: e.message });
  }
});

module.exports = router;
