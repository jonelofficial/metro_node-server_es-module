import express from "express";
import cors from "cors";
import path from "path";
import bodyParse from "body-parser";
import mongoose from "mongoose";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import socket from "./socket.js";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: "/.env" });

import authRoutes from "./routes/auth.js";
import vehicleRoutes from "./routes/vehicle.js";
import gasStationRoutes from "./routes/gas_station.js";
import officeTripRoutes from "./routes/office/trip.js";
import dashboardRoutes from "./routes/dashboard.js";

const app = express();

// Images Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4());
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// request file size
app.use(bodyParse.json({ limit: "100mb" }));
app.use(bodyParse.urlencoded({ limit: "100mb", extended: true }));

app.use(multer({ storage: storage, fileFilter: fileFilter }).single("image"));
app.use("/images", express.static(path.join(__dirname, "images")));

// END IMAGE UPLOAD

app.use(
  cors({
    origin: "*",
    methods: "*",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Authentication
app.use("/auth", authRoutes);
// Vehicle
app.use("/vehicle", vehicleRoutes);
//  Gas Station
app.use("/gas-station", gasStationRoutes);

// Office Routes
app.use("/office", officeTripRoutes);

// Dashboard
app.use("/dashboard", dashboardRoutes);

// Error Cb
app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ error: message, data: data });
});
// Database connection
mongoose
  .connect(process.env.DB_CONN)
  .then(() => {
    const server = app.listen(process.env.PORT || 8080);
    // const io = require("./socket").init(server);
    const io = socket.init(server);
    io.on("connection", (socket) => {
      console.log("Client Connected");
    });
  })
  .catch((err) => console.log(err));
