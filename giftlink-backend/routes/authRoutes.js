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

    const authToken = jwt.sign(payload, JWT_SECRET);
    logger.info(`User registered: ${email}`);
    res.status(201).json({ authToken, email });
  } catch (e) {
    logger.error("Register error:", e.message);
    return res
      .status(500)
      .json({ error: "Internal server error", details: e.message });
  }
});

router.post("/login", async (req, res) => {
  console.log("\n\n Inside login");
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    logger.info("Starting Login Process...");

    //Connect to Database
    const db = await connectToDatabase();
    logger.info("Connecting to Database...");

    // Search for user
    const collection = db.collection("users");
    logger.info("Finding User...");
    const theUser = await collection.findOne({ email: email });

    // Does the user exist?
    if (!theUser) {
      logger.warn("Login failed: User not found");
      return res.status(400).json({ error: "Invalid credentials" });
    } else {
      logger.info("User Found!");
    }

    //Check if password matches
    if (theUser) {
      //Grab user password
      const userPassword = theUser.password;

      let result = await bcryptjs.compare(password, userPassword);

      if (!result) {
        logger.error("Passwords do not match");
        return res.status(400).json({ error: "Wrong password" });
      }

      let payload = {
        user: {
          id: theUser.insertedId.toString(),
        },
      };

      //Fetch User Details
      const userName = theUser.name;
      const userEmail = theUser.email;

      //Sign JWT Token
      const authToken = jwt.sign(payload, JWT_SECRET);
      logger.info("User logged in succesfully");
      res.status(200).json({ authToken, userName, userEmail });
    } else {
      logger.error("User not found");
      return res.status(404).json({ error: "User not found" });
    }
  } catch (e) {
    logger.error("Login error", e.message);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: e.message });
  }
});

module.exports = router;
