import mongoose from "mongoose";
import { loadEnvironment } from "../config/env.js";
import { connectDatabase } from "../db/connect.js";
import { seedExerciseCatalog } from "../catalog/exerciseSeed.js";

async function main() {
  const config = loadEnvironment();
  await connectDatabase(config.mongoUri);
  try {
    const report = await seedExerciseCatalog();
    console.log("Exercise catalog seed audit passed.", report);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  const message = String(error.message).replace(
    /mongodb(?:\+srv)?:\/\/\S+/gi,
    "[redacted MongoDB URI]",
  );
  console.error(`Exercise catalog seed failed: ${message}`);
  process.exitCode = 1;
});
