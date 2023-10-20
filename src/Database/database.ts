import mongoose from "mongoose";
import "dotenv/config";
let database: mongoose.Connection;
const uri:(string|any) = process.env.MONGO_URL;

export const connect = () => {
  if (database) {
    return;
  }
  mongoose.connect(uri);
  database = mongoose.connection;
  database.once("open", async () => {
    console.log("Connected to database");
  });
  database.on("error", () => {
    console.log("Error connecting to database");
  });
};
export const disconnect = () => {
  if (!database) {
    return;
  }
  mongoose.disconnect();
};
