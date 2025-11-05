import OrderRepository from "../repositories/OrderRepository.js";
import InventoryService from "./InventoryService.js";
import { AppError } from "../utils/errors";
class OrderService {
  constructor() {
    this.orderRepository = new OrderRepository();
    this.inventoryService = new InventoryService();
  }

  async createOrder(orderData) {
    try {
      await this.validateOrderInventory(orderData.items, orderData.store);

      const totals = this.calculateOrderTotals(orderData.items);
      orderData = { ...orderData, ...totals };

      const order = await this.orderRepository.create(orderData);

      await this.inventoryService.updateInventoryForOrder(
        order.items,
        order.store
      );
      return order;
    } catch (error) {
      throw new AppError(`Order creation failed: ${error.message}`, 400);
    }
  }

  async validateOrderInventory(items, storeId) {
    for (const item of items) {
      const menuItem = await this.inventoryService.getMenuItemWithInventory(
        item.menuItem
      );

      for (const ingredient of menuItem.ingredients) {
        const available = await this.inventoryService.checkStock(
          ingredient.inventoryItem._id,
          ingredient.quantity * item.quantity
        );

        if (!available) {
          throw new AppError(
            `Insufficient stock for ${ingredient.inventoryItem.name}`,
            400
          );
        }
      }
    }
  }

  async calculateOrderTotals(items) {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.08;
    const deliveryFee = 2.99;
    const total = subtotal + tax + deliveryFee;

    return { subtotal, tax, deliveryFee, total };
  }

  async updateOrderStatus(orderId, status, userId = null) {
    const updateData = { status };
    if (userId) updateData.assignedTo = userId;
    const order = await this.orderRepository.update(orderId, updateData);

    if (!order) {
      throw new AppError("Order Not Found", 404);
    }

    return order;
  }

  async getStoreOrders(storeId, filters = {}) {
    return await this.orderRepository.findByStore(storeId, filters?.status);
  }

  async getOrderAnalytics(storeId, startDate, endDate) {
    const orders = await this.orderRepository.getOrdersByDateRange(
      storeId,
      startDate,
      endDate
    );
    const analytics = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      avarageOrderValue: 0,
      statusCount: {},
      popularItems: this.getPopularItems(orders),
    };

    orders.forEach((order) => {
      analytics.statusCount[order.status] =
        (analytics.statusCount[order.status] || 0) + 1;
    });

    analytics.avarageOrderValue =
      analytics.totalRevenue / (analytics.totalOrders || 1);

    return analytics;
  }

  async getPopularItems(orders) {
    const itemCount = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const itemName = item.menuItem.name;
        itemCount[itemName] = (itemCount[itemName] || 0) + item.quantity;
      });
    });

    return Object.entries(itemCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }
}

export default OrderService;
