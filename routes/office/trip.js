import express from "express";
import {
  createApkTrip,
  deleteAllTrips,
  deleteTrip,
  getApkTrips,
  getTrips,
  updateTrip,
} from "../../controllers/office/trip.js";
import isAuth from "../../middleware/is-auth.js";

const router = express.Router();

router.get("/trips", isAuth, getTrips);
router.put("/trip/:tripId", isAuth, updateTrip);
router.delete("/trip/:tripId", isAuth, deleteTrip);
router.delete("/trips/:userId", isAuth, deleteAllTrips);

router.post("/apk-trip", isAuth, createApkTrip);
router.get("/apk-trips", isAuth, getApkTrips);

export default router;
