const express = require("express");
const router = express.Router();

const tripController = require("../controllers/trip");

// Get all trips
router.get("/trips", tripController.getTrips);

module.exports = router;
