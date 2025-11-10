import AnalyticRepository from "../repositories/AnalyticsRepository";
import OrderRepository from "../repositories/OrderRepository";
import StoreRepository from "../repositories/StoreRepository";
import UserRepository from "../repositories/UserRepository";
import { AppError } from "../utils/errors";

class AnalyticsService {
  constructor() {
    this.analyticsRepository = new AnalyticRepository();
    this.orderRepository = new OrderRepository();
    this.storeRepository = new StoreRepository();
    this.userRepository = new UserRepository();
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
}

export default AnalyticsService;
