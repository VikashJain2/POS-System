import OrderRepository from "../repositories/OrderRepository.js";
import StoreRepository from "../repositories/StoreRepository.js";

class StoreService {
  constructor() {
    this.storeRepository = new StoreRepository();
    this.orderRepository = new OrderRepository();
  }

  async createStore(storeData) {
    try {
      if (!storeData.name || !storeData.address) {
        throw new Error("Store name and address are required", 400);
      }
      const store = await this.storeRepository.create(storeData);
      return store;
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError("Store with this name already exists", 400);
      }
      throw new Error(`Failed to create store: ${error.message}`, 500);
    }
  }

  async getStores(filters = {}) {
    try {
      const { active, withStats } = filters;
      let query = {};

      if (active !== undefined) query.isActive = active;
      let stores = await this.storeRepository.find(query, ["manager"]);
      if (withStats) {
        stores = await Promise.all(
          stores.map(async (store) => {
            const stats = await this.storeRepository.getStoreStats(store._id);
            return { ...store.toObject(), stats };
          })
        );
      }

      return stores;
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

      const performance = await this.storeRepository.getStorePerformace(
        storeId,
        startDate,
        endDate
      );
      return performance;
    } catch (error) {
      throw new AppError(
        `Failed to get store performance: ${error.message}`,
        500
      );
    }
  }

  async getStoresWithPerformance(startDate, endDate) {
    try {
      const stores = await this.storeRepository.getStoresWithPerformace(
        startDate,
        endDate
      );
      return stores;
    } catch (error) {
      throw new AppError(
        `Failed to get stores with performance: ${error.message}`,
        500
      );
    }
  }
}

export default StoreService;
