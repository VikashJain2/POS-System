import mongoose from "mongoose";
import orderAnalyticsModel from "../models/OrderAnalytics.model";
import systemAnalyticsModel from "../models/SystemAnalytics.model";
import BaseRepository from "./BaseRepository";

class AnalyticRepository extends BaseRepository {
  constructor() {
    super(orderAnalyticsModel);
  }

  async getStoreAnalytics(storeId, startDate, endDate) {
    return await this.find({
      store: storeId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });
  }

  async getDailyStoreAnalytics(storeId, date) {
    return await this.findOne({
      store: storeId,
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lte: new Date(date.setHours(23, 59, 59, 999)),
    });
  }

  async updateOrCreateDailyAnalytics(storeId, date, data) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.model.findOneAndUpdate(
      {
        store: storeId,
        date: { $gte: startOfDay, $lte: endOfDay },
      },
      { ...data, store: storeId, date: startOfDay },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  async getSystemAnalytics(startDate, endDate) {
    return await systemAnalyticsModel.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });
  }

  async updateOrCreateSystemAnalytics(date, data) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await systemAnalyticsModel.findOneAndUpdate(
      {
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
      {
        ...data,
        date: startOfDay,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  async getRevenueTrends(storeId, days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getDate() - days);

    return await this.model.aggregate([
      {
        $match: {
          store: new mongoose.Types.ObjectId(storeId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $project: {
          date: 1,
          totalRevenue: 1,
          totalOrders: 1,
          averageOrderValue: 1,
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);
  }
}

export default AnalyticRepository;
