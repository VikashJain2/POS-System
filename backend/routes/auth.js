import express from "express";
import AuthController from "../controllers/AuthController";
import { protect } from "../middleware/auth";
const router = express.Router();

const authController = new AuthController();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", protect, authController.getMe);

export default router;
