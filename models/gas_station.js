import mongoose from "mongoose";

const { Schema } = mongoose;

const gasStationSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const GasStation = mongoose.model("GasStation", gasStationSchema);

export default GasStation;
