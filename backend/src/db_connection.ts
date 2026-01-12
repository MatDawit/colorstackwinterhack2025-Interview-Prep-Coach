/**
 * Prisma database connection
 * Initializes Prisma Client with the Postgres adapter using `DATABASE_URL`.
 */
import "dotenv/config";
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });
