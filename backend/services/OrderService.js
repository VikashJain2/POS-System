import OrderRepository from "../repositories/OrderRepository.js";
import InventoryService from "./InventoryService.js";
import LoyaltyService from ('./LoyaltyService.js');
import EmailService from ('./EmailService.js');
import OrderQueue from ('../queues/OrderQueue.js');
import { AppError } from "../utils/errors.js";
class OrderService {
  constructor() {
    this.orderRepository = new OrderRepository(); 
    this.inventoryService = new InventoryService();
    this.loyaltyService = new LoyaltyService();
    this.emailService = new EmailService();
    this.orderQueue = OrderQueue;
  }

  async createOrder(orderData) {
    try {
      await this.validateOrderInventory(orderData.items, orderData.store);

      const totals = this.calculateOrderTotals(orderData.items, orderData.discount || 0);
      orderData = { ...orderData, ...totals };

      const order = await this.orderRepository.create(orderData);
      await this.orderQueue.add(order)
      await this.inventoryService.updateInventoryForOrder(
        order.items,
        order.store
      );
      if(order?.customer?.phone){
        await this.loyaltyService.earnPoints(order)
      }
      if(order?.customer?.email){
        await this.emailService.sendOrderConfirmation(order, order.customer.email)
      }
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

  async calculateOrderTotals(items,discount = 0) {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.08;
    const deliveryFee = 2.99;
    const total = Math.max(0,subtotal-discount + tax + deliveryFee);

    return { subtotal, tax: Math.round(tax * 100) / 100, deliveryFee, discount, total: Math.round(total*100)/100 };
  }

  async updateOrderStatus(orderId, status, userId = null, notes = '') {
    const updateData = { status };
    if (userId) updateData.assignedTo = userId;
    if(notes) updateData.notes = notes;
    const order = await this.orderRepository.update(orderId, updateData);

    if (!order) {
      throw new AppError("Order Not Found", 404);
    }

    await this.orderQueue.updateOrderStatus(orderId, status, notes)
    if(order.customer?.email){
      await this.emailService.sendOrderStatusUpdate(order, order.customer.email, status)
    }

    return order;
  }

  async updatePaymentStatus(orderId, status, method = null, paymentId =null){
    const updateData = {paymentStatus: status}
    if(method) updateData.paymentMethod = method;
    if(paymentId) updateData.paymentDetails = {paymentId, paymentGateway: 'razorpay'}

    const order = await this.orderRepository.update(orderId, updateData);
    if(!order){
      throw new AppError("Order Not Found", 404);
    }
    return order
  }

  async getStoreOrders(storeId, filters = {}) {
    const {status, page = 1, limit = 50} = filters
    let conditions = {store: storeId}
    if(status){
      if(status.includes(',')){
        conditions.status = {$in: status.split(',')}
      }else{
        conditions.status = status
      }
    }
    return await this.orderRepository.paginate(conditions, page, limit, ['items.menuItem', 'assignedTo'], {createdAt: -1});
  }

  async getOrderAnalytics(storeId, startDate, endDate) {
  const orders = await this.orderRepository.find({
    store: storeId,
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    }
  }, ['items.menuItem'])
    return calculateOrderAnalytics(orders)
  }

  calculateOrderAnalytics(orders){
    const totalOrder = orders.length;
    const totalRevenue = orders.reduce((sum, order)=>sum+order.total,0);
    const averageOrderValue = totalOrder > 0 ? totalRevenue/totalOrder : 0;

    const statusCount = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      baking: 0,
      quality_check: 0,
      ready: 0,
      out_for_delivery: 0,
      deliverd: 0,
      cancelled: 0
    }
    const popularItems = {}
    const hourlyData = Array(24).fill().map((_, hour) =>({
      hour,
      orders: 0,
      revenue: 0
    }))

    orders.forEach(order=>{
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
      order.items.forEach(item=>{
        const itemName = item.menuItem?.name;
        popularItems[itemName] = (popularItems[itemName] || 0) + item.quantity
      })
      const orderHour = new Date(order.createdAt).getHours();
      hourlyData[orderHour].orders += 1;
      hourlyData[orderHour].revenue += order.total
    })

    const sortedPopularItems = Object.entries(popularItems).sort(([,a], [,b]) => b-a).slice(0,10).map(([name, count])=>({name, count}))

    return {
      totalOrder,
      totalRevenue,
      averageOrderValue,
      statusCount,
      popularItems: sortedPopularItems,
      hourlyData
    }
  }

  async getQueueStats(storeId = null){
    const stats = await this.orderQueue.getQueueStats(storeId);
    return stats;
  }

  async retryFailedOrders(){
    const jobs = await this.orderQueue.queue.getJobs(['failed'])
    const failedJob = jobs.find(job => job.data.orderId === orderId)  
    if(!failedJob){
throw new AppError('No failed job found for this order', 404);
    }

     await failedJob.retry();
    return { message: 'Order retry initiated' };
  }
}

export default OrderService;
