// db.js
require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;

// MongoDB connection URL from environment or fallback to localhost
const url = process.env.MONGO_URL || "mongodb://127.0.0.1:27017";

let dbInstance = null;
const dbName = "giftdb";

async function connectToDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const client = new MongoClient(url);

    // Connect to the MongoDB server
    await client.connect();

    // Get the database instance by name
    dbInstance = client.db(dbName);

    console.log(`✓ Connected to MongoDB database: ${dbName}`);
    return dbInstance;
  } catch (error) {
    console.error(`✗ Failed to connect to MongoDB at ${url}:`, error.message);
    throw error; // Re-throw so the app knows connection failed
  }
}

module.exports = connectToDatabase;
