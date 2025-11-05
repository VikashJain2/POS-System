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
    return await this.model
      .find({
        store: storeId,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .populate("items.menuItem");
  }
}

export default OrderRepository;
