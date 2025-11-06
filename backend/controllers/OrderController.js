import OrderService from "../services/OrderService.js";

class OrderController {
  constructor() {
    this.orderService = new OrderService();
  }

  createOrder = async (req, res, next) => {
    try {
      const order = await this.orderService.createOrder({
        ...req.body,
        store: req.user.store,
      });

      req.app
        .get("io")
        .to(`store-${req.user.store}`)
        .emit("order-created", order);

      return res.status(201).json({
        status: "success",
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  };

  getOrders = async (req, res, next) => {
    try {
      const { status } = req.query;
      const orders = await this.orderService.getStoreOrders(req.user.store, {
        status,
      });

      return res.status(200).json({
        status: "success",
        results: orders.length,
        data: { orders },
      });
    } catch (error) {
      next(error);
    }
  };

  updateOrderStatus = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await this.orderService.updateOrderStatus(
        id,
        status,
        req.user._id
      );

      req.app
        .get("io")
        .to(`store-${req.user.store}`)
        .emit("order-updated", order);

      return res.status(200).json({
        status: "success",
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  };

  getOrderAnalytics = async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      const analytics = await this.orderService.getOrderAnalytics(
        req.user.store,
        new Date(startDate),
        new Date(endDate)
      );

      return res.status(200).json({
        status: "success",
        data: { analytics },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default OrderController;
