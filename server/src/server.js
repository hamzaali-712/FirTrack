import mongoose from "mongoose";
import { createApp } from "./app.js";
import { loadEnvironment } from "./config/env.js";
import { connectDatabase } from "./db/connect.js";

async function startServer() {
  const config = loadEnvironment();
  await connectDatabase(config.mongoUri);

  const app = createApp();
  const server = app.listen(config.port, "127.0.0.1", () => {
    console.log(`FitTrack API listening on http://127.0.0.1:${config.port}`);
  });

  const shutdown = (signal) => {
    console.log(`Received ${signal}; shutting down FitTrack API.`);
    server.close(() => {
      mongoose.disconnect().catch(() => {
        console.error("MongoDB disconnect failed during shutdown.");
        process.exitCode = 1;
      });
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((error) => {
  const message = error.message.replace(/mongodb(?:\+srv)?:\/\/\S+/gi, "[redacted MongoDB URI]");
  console.error(`FitTrack API failed to start: ${message}`);
  process.exitCode = 1;
});
