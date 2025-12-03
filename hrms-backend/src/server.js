// src/server.js
import dotenv from "dotenv";
import prisma from "./prismaClient.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Connected to PostgreSQL database");

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
