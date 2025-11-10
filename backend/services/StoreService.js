import OrderRepository from "../repositories/OrderRepository.js";
import StoreRepository from "../repositories/StoreRepository.js";

class StoreService {
  constructor() {
    this.storeRepository = new StoreRepository();
    this.orderRepository = new OrderRepository()
  }

  async createStore(storeData) {
    try {
      if (!storeData.name || !storeData.address) {
        throw new Error("Store name and address are required", 400);
      }
      const store = await this.storeRepository.create(storeData);
      return store;
    } catch (error) {
      throw new Error(`Failed to create store: ${error.message}`, 500);
    }
  }

  async getStores(filters = {}) {
    try {
      const { active } = filters;
      let query = {};

      if (active !== undefined) query.isActive = active;

      return await this.storeRepository.find(query, ["manager"]);
    } catch (error) {
      throw new Error(`Failed to fetch stores: ${error.message}`, 500);
    }
  }

  async updateStore(storeId, updateData) {
    try {
      const store = await this.storeRepository.update(storeId, updateData);
      if (!store) {
        throw new Error("Store not found", 404);
      }
      return store;
    } catch (error) {
      throw new Error(`Failed to update store: ${error.message}`, 500);
    }
  }

  async getStorePerformance(storeId, period = "month") {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (period) {
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }

      const orders = await this.orderRepository.getOrdersByDateRange(storeId, startDate, endDate);

      const performance = {
        
      }
    } catch (error) {}
  }
}
