import mongoose from "mongoose";

const systemAnalyticsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    totalStores: Number,
    totalUsers: Number,
    totalRevenue: Number,
    totalOrders: Number,
    storePerformace: [
      {
        store: {
          type: mongoose.Types.ObjectId,
          ref: "Store",
        },
        revenue: Number,
        orders: Number,
        avarageOrderValue: Number,
      },
    ],
    userActivity: {
      logins: Number,
      newRegistrations: Number,
      activeUsers: Number,
    },
  },
  {
    timestamps: true,
  }
);

const systemAnalyticsModel = mongoose.model(
  "SystemAnalytics",
  systemAnalyticsSchema
);

export default systemAnalyticsModel;
