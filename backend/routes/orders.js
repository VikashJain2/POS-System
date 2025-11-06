import express from "express";
import OrderController from "../controllers/OrderController";
import { protect, restrictTo } from "../middleware/auth";
const router = express.Router();

const orderController = new OrderController();

router.use(protect);

router
  .route("/")
  .post(restrictTo("employee", "store_manager"), orderController.createOrder)
  .get(orderController.getOrders);

router
  .route("/:id/status")
  .patch(
    restrictTo("employee", "store_manager"),
    orderController.updateOrderStatus
  );

router
  .route("/analytics")
  .get(restrictTo("store_manager", "admin"), orderController.getOrderAnalytics);
export default router;
