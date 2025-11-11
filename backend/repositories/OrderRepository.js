import mongoose from "mongoose";
import OrderModel from "../models/Order.model.js";
import BaseRepository from "./BaseRepository.js";

class OrderRepository extends BaseRepository {
  constructor() {
    super(OrderModel);
  }

  async findByStore(storeId, status = null) {
    const conditions = {
      store: storeId,
    };
    if (status) conditions.status = status;
    return await this.find(conditions, ["items.menuItem", "assignedTo"], {
      createdAt: -1,
    });
  }

  async getTodayOrders(storeId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setDate(23, 59, 59, 999);

    return await this.model
      .find({
        store: storeId,
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      })
      .populate("items.menuItem");
  }

  async getOrdersByDateRange(storeId, startDate, endDate) {
    return await this.find({
      store: storeId,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    }).populate("items.menuItem");
  }

  async getOrdersByStatus(storeId, status) {
    return await this.find(
      {
        store: storeId,
        status: status,
      },
      ["items.menuItem", "assignedTo"],
      { createdAt: 1 }
    );
  }
  async getCustomerOrders(phone) {
    return await this.find(
      {
        "customer.phone": phone,
      },
      ["items.menuItem"],
      { createdAt: -1 }
    );
  }
  async getRevenueByDateRange(storeId, startDate, endDate) {
    const result = await this.model.aggregate([
      {
        $match: {
          store: new mongoose.Types.ObjectId(storeId),
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: "$total" },
        },
      },
    ]);
    return (
      result[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 }
    );
  }
}

export default OrderRepository;
