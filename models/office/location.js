import mongoose from "mongoose";

const { Schema } = mongoose;

const locationSchema = new Schema({
  trip_id: {
    type: Schema.Types.ObjectId,
    ref: "TripOffice",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  lat: {
    type: Number,
    required: true,
  },
  long: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  address: {
    type: JSON,
  },
  odometer: {
    type: Number,
  },
});

const LocationOffice = mongoose.model("LocationOffice", locationSchema);

export default LocationOffice;
