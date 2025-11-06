import UserService from "../services/UserService.js";
import { AppError } from "../utils/errors.js";
class AuthController {
  constructor() {
    this.userService = new UserService();
  }

  register = async (req, res, next) => {
    try {
      const { user, token } = await this.userService.registerUser(req.body);
      return res.status(201).json({
        status: "success",
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError("Please provide email and password", 400);
      }

      const { user, token } = await this.userService.loginUser(email, password);

      return res.status(200).json({
        status: "success",
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req, res, next) => {
    try {
      return res.status(200).json({
        status: "success",
        data: { user: req.user },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
