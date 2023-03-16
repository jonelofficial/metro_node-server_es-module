import express from "express";
import isAuth from "../middleware/is-auth.js";
import {
  createStation,
  deleteAllStations,
  deleteStation,
  getStation,
  importGasStations,
  updateStation,
} from "../controllers/gas_station.js";

const router = express.Router();

router.get("/stations", getStation);
router.post("/station", isAuth, createStation);
router.put("/station/:stationId", isAuth, updateStation);
router.delete("/station/:stationId", isAuth, deleteStation);

router.post("/import-stations", isAuth, importGasStations);
router.delete("/delete-all-stations", isAuth, deleteAllStations);

export default router;
