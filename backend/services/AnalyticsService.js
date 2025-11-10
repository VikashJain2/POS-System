import AnalyticRepository from "../repositories/AnalyticsRepository";
import OrderRepository from "../repositories/OrderRepository";
import StoreRepository from "../repositories/StoreRepository";
import UserRepository from "../repositories/UserRepository";
import { AppError } from "../utils/errors";
import InventoryService from "./InventoryService";

class AnalyticsService {
  constructor() {
    this.analyticsRepository = new AnalyticRepository();
    this.orderRepository = new OrderRepository();
    this.storeRepository = new StoreRepository();
    this.userRepository = new UserRepository();
    this.inventoryService = new InventoryService();
  }

  async getStoreAnalytics(storeId, startDate, endDate) {
    try {
      const orders = await this.orderRepository.getOrdersByDateRange(
        storeId,
        startDate,
        endDate
      );

      const analytics = this.calculateOrderAnalytics(orders);

      await this.analyticsRepository.updateOrCreateDailyAnalytics(
        storeId,
        new Date(),
        analytics
      );

      return analytics;
    } catch (error) {
      throw new AppError(
        `Failed to get store analytics: ${error.message}`,
        500
      );
    }
  }

  calculateOrderAnalytics(orders) {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const statusCount = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      baking: 0,
      quality_check: 0,
      ready: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    };

    const popularItems = {};
    const hourlyData = Array(24)
      .fill()
      .map((_, hour) => ({
        hour,
        orders: 0,
        revenue: 0,
      }));

    orders.forEach((order) => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;

      order.items.forEach((item) => {
        const itemName = item.menuItem?.name || "Unknown Item";
        popularItems[itemName] = (popularItems[itemName] || 0) + item.quantity;
      });

      const orderHour = new Date(order.createdAt).getHours();
      hourlyData[orderHour].orders += 1;
      hourlyData[orderHour].revenue += order.total;
    });

    const sortedPopularItems = Object.entries(popularItems)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      statusCount,
      popularItems: sortedPopularItems,
      hourlyData,
    };
  }

  async getSystemAnalytics(startDate, endDate) {
    try {
      const stores = await this.storeRepository.find();
      const users = await this.userRepository.find();

      const allOrders = await this.orderRepository.model
        .find({
          createdAt: { $gte: startDate, $lte: endDate },
        })
        .populate("store");
      const totalRevenue = allOrders.reduce(
        (sum, order) => sum + order.total,
        0
      );
      const totalOrders = allOrders.length;

      const storePerformace = stores
        .map((store) => {
          const storeOrders = allOrders.filter(
            (order) => order.store._id.toString() === store._id.toString()
          );

          const storeRevenue = storeOrders.reduce(
            (sum, order) => sum + order.total,
            0
          );
          const storeOrderCount = storeOrders.length;
          const avgOrderValue =
            storeOrderCount > 0 ? storeRevenue / storeOrderCount : 0;

          return {
            store: store._id,
            storeName: store.name,
            revenue: storeRevenue,
            orders: storeOrderCount,
            averageOrderValue: avgOrderValue,
          };
        })
        .sort((a, b) => b.revenue - a.revenue);
      const activeUsers = users.filter((user) => user.isActive).length;
      const newRegistrations = users.filter(
        (user) => user.createdAt >= startDate && user.createdAt <= endDate
      ).length;

      return {
        totalStores: stores.length,
        totalUsers: users.length,
        totalOrders,
        totalRevenue,
        storePerformace,
        userActivity: {
          activeUsers,
          newRegistrations,
          logins: 0,
        },
      };
    } catch (error) {
      throw new AppError(
        `Failed to get system analytics: ${error.message}`,
        500
      );
    }
  }

  async getDashboardStats(storeId) {
    try {
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0));
      const endOfToday = new Date(today.setHours(23, 59, 59, 999));

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
      const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

      const todayOrders = await this.orderRepository.getOrdersByDateRange(
        storeId,
        startOfToday,
        endOfToday
      );

      const yesterdayOrders = await this.orderRepository.getOrdersByDateRange(
        storeId,
        startOfYesterday,
        endOfYesterday
      );

      const lowStockItems = await this.inventoryService.getLowStock(storeId);

      const todayRevenue = todayOrders.reduce(
        (sum, order) => sum + order.total,
        0
      );
      const yesterdayRevenue = yesterdayOrders.reduce(
        (sum, order) => sum + order.total,
        0
      );

      const revenueChange =
        yesterdayRevenue > 0
          ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
          : 0;

      return {
        todayOrders: todayOrders.length,
        todayRevenue,
        revenueChange,
        lowStockItems: lowStockItems.length,
        activeOrders: todayOrders.filter(
          (order) => !["delivered", "cancelled"].includes(order.status).length
        ),
      };
    } catch (error) {
      throw new AppError(
        `Failed to get dashboard stats: ${error.message}`,
        500
      );
    }
  }
}

export default AnalyticsService;
