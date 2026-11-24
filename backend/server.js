
require("dotenv").config();

const express = require("express");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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
    if (!/^[a-f0-9]{64}$/.test(process.env.JWT_SECRET || "")) {
      throw new Error("JWT_SECRET is missing or invalid.");
    }

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

    // LOGIN API
    app.post("/api/login", async (req, res) => {
      try {
        const { email, password } = req.body || {};

        // Validate input
        if (
          typeof email !== "string" ||
          typeof password !== "string" ||
          !email.trim() ||
          !password
        ) {
          return res.status(400).json({
            message: "Email and password are required."
          });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Find user in MongoDB
        const user = await users.findOne({
          email: cleanEmail
        });

        // Use a generic message for invalid credentials
        if (!user) {
          return res.status(401).json({
            message: "Invalid email or password."
          });
        }

        // Verify password against stored bcrypt hash
        const passwordMatches = await bcrypt.compare(
          password,
          user.passwordHash
        );

        if (!passwordMatches) {
          return res.status(401).json({
            message: "Invalid email or password."
          });
        }

        
        // Generate JWT after successful authentication.
        const token = jwt.sign(
          { sub: user._id.toString() },
          process.env.JWT_SECRET,
          {
            algorithm: "HS256",
            expiresIn: "1h",
            issuer: "cyvatrix",
            audience: "cyvatrix-web"
          }
        );

        // Store JWT in an HttpOnly cookie.
        res.cookie("cyvatrix_session", token, {
          httpOnly: true,
          sameSite: "lax",
          secure: false,
          maxAge: 60 * 60 * 1000,
          path: "/api"
        });

        return res.status(200).json({
          message: "Login successful!",
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email
          }
        });


      } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
          message: "Internal server error."
        });
      }
    });

    // Middleware: verify the JWT session cookie.
    async function requireAuth(req, res, next) {
      try {
        const cookieHeader = req.headers.cookie || "";

        const sessionCookie = cookieHeader
          .split(";")
          .map(item => item.trim())
          .find(item => item.startsWith("cyvatrix_session="));

        if (!sessionCookie) {
          return res.status(401).json({
            message: "Authentication required."
          });
        }

        const token = sessionCookie.slice(
          "cyvatrix_session=".length
        );

        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET,
          {
            algorithms: ["HS256"],
            issuer: "cyvatrix",
            audience: "cyvatrix-web"
          }
        );

        if (
          typeof decoded.sub !== "string" ||
          !/^[a-f0-9]{24}$/i.test(decoded.sub)
        ) {
          return res.status(401).json({
            message: "Invalid session."
          });
        }

        const { ObjectId } = require("mongodb");

        const user = await users.findOne({
          _id: new ObjectId(decoded.sub)
        });

        if (!user) {
          return res.status(401).json({
            message: "User not found."
          });
        }

        req.user = user;
        next();

      } catch (error) {
        if (
          error.name === "JsonWebTokenError" ||
          error.name === "TokenExpiredError" ||
          error.name === "NotBeforeError"
        ) {
          return res.status(401).json({
            message: "Invalid or expired session."
          });
        }

        console.error("Authentication error:", error);
        return res.status(500).json({
          message: "Internal server error."
        });
      }
    }

    // Protected endpoint
    app.get("/api/me", requireAuth, (req, res) => {
      res.status(200).json({
        authenticated: true,
        user: {
          id: req.user._id.toString(),
          name: req.user.name,
          email: req.user.email
        }
      });
    });

    // Logout endpoint
    app.post("/api/logout", (req, res) => {
      res.clearCookie("cyvatrix_session", {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/api"
      });

      res.json({
        message: "Logout successful!"
      });
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
