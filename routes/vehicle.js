import express from "express";
import isAuth from "../middleware/is-auth.js";
import {
  getVehicles,
  createVehicle,
  deleteAllVehicles,
  deleteVehicle,
  getUserVehicle,
  importVehicles,
  updateVehicle,
} from "../controllers/vehicle.js";

const router = express.Router();

router.get("/cars", getVehicles);
router.post("/car", isAuth, createVehicle);
router.put("/car/:vehicleId", isAuth, updateVehicle);
router.delete("/car/:vehicleId", isAuth, deleteVehicle);

//:plateNo
router.get("/car/user", isAuth, getUserVehicle);

router.post("/import-vehicles", isAuth, importVehicles);
router.delete("/delete-all-vehicles", isAuth, deleteAllVehicles);

export default router;
