
require("dotenv").config();

const express = require("express");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
const PORT = 5000;
const HOST = "192.168.145.128";

app.use(express.json({ limit: "10kb" }));

app.use(cors({
  origin: "http://192.168.145.129:3000"
}));

const dbName = process.env.MONGO_DB;
const username = encodeURIComponent(process.env.MONGO_USER || "");
const password = encodeURIComponent(process.env.MONGO_PASSWORD || "");

const uri = `mongodb://${username}:${password}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${dbName}?authSource=${dbName}`;

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000
});

async function startServer() {
  try {
    await client.connect();

    const db = client.db(dbName);
    const users = db.collection("users");

    await users.createIndex({ email: 1 }, { unique: true });

    console.log("MongoDB connected successfully!");

    app.get("/api/health", (req, res) => {
      res.json({
        status: "success",
        message: "Cyvatrix Express Backend is running"
      });
    });

    app.post("/api/register", async (req, res) => {
      try {
        const { name, email, password } = req.body || {};

        if (
          typeof name !== "string" ||
          typeof email !== "string" ||
          typeof password !== "string"
        ) {
          return res.status(400).json({
            message: "Name, email and password are required."
          });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (
          cleanName.length < 2 ||
          cleanName.length > 100 ||
          cleanEmail.length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
          password.length < 8 ||
          password.length > 72
        ) {
          return res.status(400).json({
            message: "Invalid name, email or password. Password must be 8-72 characters."
          });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await users.insertOne({
          name: cleanName,
          email: cleanEmail,
          passwordHash: passwordHash,
          createdAt: new Date()
        });

        return res.status(201).json({
          message: "Registration successful!",
          userId: result.insertedId.toString()
        });

      } catch (error) {
        if (error.code === 11000) {
          return res.status(409).json({
            message: "Email already registered."
          });
        }

        console.error("Registration error:", error);
        return res.status(500).json({
          message: "Internal server error."
        });
      }
    });

    app.listen(PORT, HOST, () => {
      console.log(`Cyvatrix Backend running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Startup failed:", error.message);
    await client.close();
    process.exitCode = 1;
  }
}

startServer();
