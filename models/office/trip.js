import mongoose from "mongoose";

const { Schema } = mongoose;

const tripSchema = new Schema(
  {
    trip_date: {
      type: Date,
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicle_id: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    locations: [
      {
        type: Schema.Types.ObjectId,
        ref: "LocationOffice",
      },
    ],
    diesels: [{ type: Schema.Types.ObjectId, ref: "DieselOffice" }],
    odometer: {
      type: Number,
      required: true,
    },
    odometer_done: {
      type: Number,
    },
    odometer_image_path: {
      type: String,
    },
    others: {
      type: String,
    },
    charging: {
      type: String,
    },
    companion: {
      type: JSON,
    },
    points: {
      type: JSON,
    },
  },
  { timestamps: true }
);

const TripOffice = mongoose.model("TripOffice", tripSchema);

export default TripOffice;
