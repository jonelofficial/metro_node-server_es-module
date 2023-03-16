import express from "express";
import isAuth from "../middleware/is-auth.js";
import {
  HighestKMrun,
  LongestTravelDuration,
  TVDTdeparment,
  TotalTripDriver,
} from "../controllers/dashboard.js";
const router = express.Router();

router.get("/tvdt-department", isAuth, TVDTdeparment);
router.get("/highest-km", isAuth, HighestKMrun);
router.get("/longest-duration", isAuth, LongestTravelDuration);
router.get("/total-trip-driver", isAuth, TotalTripDriver);

export default router;
