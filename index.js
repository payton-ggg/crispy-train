import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { updateUser } from "./server/controllers/userController.js";
import launchBot from "./bot/bot.js";
import { verifyTelegramInitData } from "./server/controllers/verifyController.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.post("/api/users", updateUser);
app.post("/api/verify", verifyTelegramInitData);

export const Bot = launchBot();

async function start() {
  try {
    // await mongoose.connect(process.env.MONGO_URL);

    app.listen(process.env.PORT, async () => {
      console.log("server started");
    });
  } catch (e) {
    console.log("Server error", e);
    process.exit(1);
  }
}

void start();
//
