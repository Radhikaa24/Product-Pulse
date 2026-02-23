// src/config/database.js
// Prisma client singleton — reused across the app

const { PrismaClient } = require("@prisma/client");

let prisma;

function getDb() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
    });
  }
  return prisma;
}

async function disconnect() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

module.exports = { getDb, disconnect };
