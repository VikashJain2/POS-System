import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: "INDIA",
      },
    },
    phone: String,
    email: String,
    operatingHours: {
      open: String,
      close: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    manager: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const StoreModel = mongoose.model("Store", storeSchema);
export default StoreModel;
