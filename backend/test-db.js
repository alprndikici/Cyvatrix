
require("dotenv").config();

const { MongoClient } = require("mongodb");

const host = process.env.MONGO_HOST;
const port = process.env.MONGO_PORT;
const database = process.env.MONGO_DB;

const username = encodeURIComponent(process.env.MONGO_USER || "");
const password = encodeURIComponent(process.env.MONGO_PASSWORD || "");

const uri = `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=${database}`;

async function testConnection() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000
  });

  try {
    await client.connect();

    const result = await client.db(database).command({ ping: 1 });

    console.log("MongoDB connection successful!");
    console.log("Database:", database);
    console.log("Ping result:", result.ok);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

testConnection();
