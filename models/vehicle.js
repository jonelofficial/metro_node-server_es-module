import mongoose from "mongoose";

const { Schema } = mongoose;

const vehicleSchema = new Schema(
  {
    plate_no: {
      type: String,
      required: true,
      unique: true,
    },
    vehicle_type: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    fuel_type: {
      type: String,
      required: true,
    },
    km_per_liter: {
      type: Number,
      required: true,
    },
    profile: {
      type: String,
    },
    department: {
      //  type: String
      type: Object,
    },
  },
  { timestamps: true }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;
