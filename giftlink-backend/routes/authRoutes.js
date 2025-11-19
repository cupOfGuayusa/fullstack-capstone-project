const express = require("express");
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
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const db = await connectToDatabase();
    const collection = db.collection("users");

    const existingEmail = await collection.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(password, salt);

    const newUser = await collection.insertOne({
      email: normalizedEmail,
      firstName: firstName || "",
      lastName: lastName || "",
      password: hash,
      createdAt: new Date(),
    });

    const payload = { user: { id: newUser.insertedId } };
    const authtoken = jwt.sign(payload, JWT_SECRET);
    logger.info(`User registered: ${normalizedEmail}`);
    res.status(201).json({ authtoken, email: normalizedEmail });
  } catch (e) {
    logger.error("Register error:", e.message);
    return res
      .status(500)
      .json({ error: "Internal server error", details: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    logger.info("Starting Login Process...");

    const normalizedEmail = email.trim().toLowerCase();

    const db = await connectToDatabase();
    logger.info("Connecting to Database...");

    const collection = db.collection("users");
    logger.info("Finding User...");
    const theUser = await collection.findOne({ email: normalizedEmail });

    if (!theUser) {
      logger.warn("Login failed: User not found");
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const userPassword = theUser.password;
    const result = await bcryptjs.compare(password, userPassword);
    if (!result) {
      logger.error("Passwords do not match");
      return res.status(400).json({ error: "Wrong password" });
    }

    const payload = { user: { id: theUser._id.toString() } };
    const userName = theUser.firstName || "";
    const userEmail = theUser.email || "";

    const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    logger.info("User logged in succesfully");
    res.status(200).json({ authtoken, name: userName, email: userEmail });
  } catch (e) {
    logger.error("Login error", e.message);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: e.message });
  }
});

router.put("/update", async (req, res) => {
  console.log("\n=== PUT /update REQUEST ===");
  console.log("Headers email:", req.headers.email);
  console.log("Body:", req.body);

  try {
    const rawEmail = req.headers.email;

    if (!rawEmail) {
      console.log("ERROR: No email header");
      return res
        .status(400)
        .json({ error: "Email not found in the request header" });
    }

    const email = rawEmail.trim().toLowerCase();
    console.log("Looking for email:", email);

    const db = await connectToDatabase();
    const collection = db.collection("users");

    const user = await collection.findOne({ email });
    console.log("User found:", !!user);

    if (!user) {
      console.log("ERROR: User not found");
      return res.status(404).json({ error: "User not found" });
    }

    console.log("Updating user:", email);

    const updateFields = {};
    if (req.body.name) {
      updateFields.firstName = req.body.name;
      console.log("New firstName:", req.body.name);
    }
    updateFields.updatedAt = new Date();

    // Update the user
    await collection.updateOne({ email }, { $set: updateFields });

    // Fetch the updated user
    const updatedUser = await collection.findOne({ email });
    console.log("Update successful");

    if (!updatedUser) {
      console.log("ERROR: Could not retrieve updated user");
      return res.status(500).json({ error: "Update failed" });
    }

    const payload = { user: { id: updatedUser._id.toString() } };
    const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    console.log("=== PUT /update SUCCESS ===\n");
    return res.json({
      authtoken,
      name: updatedUser.firstName || "",
      email: updatedUser.email || "",
    });
  } catch (e) {
    console.error("=== PUT /update ERROR ===");
    console.error("Error:", e.message);
    console.error(e);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: e.message });
  }
});

module.exports = router;
