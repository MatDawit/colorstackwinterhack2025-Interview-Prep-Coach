import "dotenv/config";                 // 1) Loads .env into process.env early
import { PrismaClient } from "../generated/prisma"; // 2) Your generated Prisma client
import { PrismaPg } from "@prisma/adapter-pg";      // 3) Prisma 7 Postgres adapter

// 4) Create an adapter using your Supabase DATABASE_URL
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,      // "!" means “we promise it exists”
});

// 5) Create PrismaClient using the adapter (Prisma 7 requirement)
export const prisma = new PrismaClient({ adapter });
