import mongoose from "mongoose";
const loyaltyTransactionSchema = new mongoose.Schema(
  {
    customer: {
      phone: { type: String, required: true },
      name: String,
      email: String,
    },
    order: {
      type: mongoose.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["earned", "redeedmed", "expired"],
      required: true,
    },
    description: String,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

const loyaltyProgramSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    name: {
      type: String,
      required: true,
      default: "Domino's Rewards",
    },
    pointsPerRupee: {
      type: Number,
      default: 1,
    },
    minimumRedeemablePoints: {
      type: Number,
      default: 100,
    },
    pointsValuePerRupee: {
      type: Number,
      default: 0.1,
    },
    pointsExpiryDays: {
      type: Number,
      default: 365,
    },
    tiers: [
      {
        name: String,
        minimumPoints: Number,
        benefits: [String],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const customerLoyaltySchema = new mongoose.Schema(
  {
    customer: {
      phone: { type: String, required: true, unique: true },
      name: String,
      email: String,
    },
    store: {
      type: mongoose.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    availablePoints: {
      type: Number,
      default: 0,
    },
    tier: {
      type: String,
      default: "bronze",
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    lastOrderDate: {
      type: Date,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const LoyaltyProgram = mongoose.model("LoyaltyProgram", loyaltyProgramSchema);
const CustomerLoyalty = mongoose.model(
  "CustomerLoyalty",
  customerLoyaltySchema
);
const LoyaltyTransaction = mongoose.model(
  "LoyaltyTransaction",
  loyaltyTransactionSchema
);

export { LoyaltyProgram, CustomerLoyalty, LoyaltyTransaction };
