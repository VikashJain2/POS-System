import mongoose from "mongoose";
const orderAnalyticsSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Types.ObejectId,
      ref: "Store",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    avarageOrderValue: {
      type: Number,
      default: 0,
    },
    statusCount: {
      pending: { type: Number, default: 0 },
      confirmed: { type: Number, default: 0 },
      preparing: { type: Number, default: 0 },
      baking: { type: Number, default: 0 },
      quality_check: { type: Number, default: 0 },
      ready: { type: Number, default: 0 },
      out_for_delivery: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 },
    },
    popularItems: [
      {
        menuItem: {
          type: mongoose.Types.ObjectId,
          ref: "MenuItem",
        },
        count: Number,
      },
    ],
    hourlyData: [
      {
        hour: Number,
        orders: Number,
        revenue: Number,
      },
    ],
  },
  { timestamps: true }
);

orderAnalyticsSchema.index({ store: 1, date: 1 }, { unique: true });

const orderAnalyticsModel = mongoose.model(
  "orderAnalytics",
  orderAnalyticsSchema
);
export default orderAnalyticsModel;
