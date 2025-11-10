import StoreModel from "../models/Store.model";
import BaseRepository from "./BaseRepository";

class StoreRepository extends BaseRepository {
  constructor() {
    super(StoreModel);
  }

  async findByManager(managerId) {
    return await this.findOne({
      managerId,
    });
  }

  async findActiveStores() {
    return await this.find({ isActive: true });
  }

  async getStorePerformace(storeId, startDate, endDate) {
    const orders = await this.model.aggregate([
      {
        $match: {
          _id: storeId,
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "store",
          as: "orders",
        },
      },
      {
        $unwind: "$orders",
      },
      {
        $match: {
          "orders.createdAt": {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$orders.total" },
          averageOrderValue: { $avg: "$orders.total" },
        },
      },
    ]);

    return (
      orders[0] || {
        _id: storeId,
        name: "Unknown Store",
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
      }
    );
  }

  async getStoresWithPerformace(startDate, endDate) {
    return await this.model.aggregate([
      {
        $lookup: {
          from: "orders",
          let: { storeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$store", "$$storeId"] },
                    { $gte: ["$createdAt", startDate] },
                    { $lte: ["$createdAt", endDate] },
                  ],
                },
              },
            },
          ],
          as: "orders",
        },
      },
      {
        $project: {
          name: 1,
          address: 1,
          isActive: 1,
          totalOrders: { $size: "$orders" },
          totalRevenue: { $sum: "$orders.total" },
          averageOrderValue: {
            $cond: {
              if: { $gt: [{ $size: "$orders" }, 0] },
              then: {
                $divide: [{ $sum: "$orders.total" }, { $size: "$orders" }],
              },
              else: 0,
            },
          },
          manager: 1,
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);
  }

  async getStoreStats(storeId) {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

    const stats = this.model.aggregate([
      {
        $match: { _id: storeId },
      },
      {
        $lookup: {
          from: "orders",
          let: { storeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$store", "$$storeId"] },
                createdAt: { $gte: startOfToday, $lte: endOfToday },
              },
            },
          ],
          as: "todayOrders",
        },
      },
      {
        $lookup: {
          from: "orders",
          let: { storeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$store", "$$storeId"],
                },
                createdAt: {
                  $gte: startOfYesterday,
                  $lte: endOfYesterday,
                },
              },
            },
          ],
          as: "yesterdayOrders",
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "store",
          as: "staff",
        },
      },
      {
        $project: {
          name: 1,
          todayOrders: { $size: "$todayOrders" },
          todayRevenue: { $sum: "$todayOrders.total" },
          yesterdayOrders: { $size: "$yesterdayOrders" },
          yesterdayRevenue: { $sum: "$yesterdayOrders.total" },
          totalStaff: { $size: "$staff" },
          activeStaff: {
            $size: {
              $filter: {
                input: "$staff",
                as: "employee",
                cond: { $eq: ["$$employee.isActive", true] },
              },
            },
          },
        },
      },
    ]);

    return stats[0] || null;
  }
}

export default StoreRepository;
