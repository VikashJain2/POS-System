import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { AppError } from "../utils/errors";

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError(
          "You are not logged in! Please log in to get access. ",
          401
        )
      );
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decode.id);
    if (!currentUser) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }

    if (!currentUser.isActive) {
      return next(new AppError("Your account has been deactivated.", 401));
    }
    req.user = currentUser;
    next();
  } catch (error) {
    next(new AppError("Invalid token", 401));
  }
};

const restrictTo = (...roles) => {
  return (req, _, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next()
  };
};

export {
    protect,
    restrictTo  
}