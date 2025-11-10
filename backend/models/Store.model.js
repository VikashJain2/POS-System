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
    settings: {
      taxRate: {
        type: Number,
        default: 0.0
      },
      deliveryFee: {
        type: Number,
        default: 2.99
      },
      currency: {
        type: String,
        default: "INR"
      }
    }
  },
  {
    timestamps: true,
  }
);

const StoreModel = mongoose.model("Store", storeSchema);
export default StoreModel;
