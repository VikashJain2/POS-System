import UserRepository from "../repositories/UserRepository";
import jwt from "jsonwebtoken";
class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async registerUser(userData) {
    try {
      const exisingUser = await this.userRepository.findByEmail(userData.email);
      if (exisingUser) {
        throw new AppError("User already exists with this email", 400);
      }

      const user = await this.userRepository.create(userData);
      user.password = undefined;

      const token = this.generateToken(user);
      return { user, token };
    } catch (error) {
      throw new AppError(`User registration failed: ${error.message}`, 400);
    }
  }

  async loginUser(email, password) {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user || !(await user.correctPassword(password, user.password))) {
        throw new AppError("Incorrect email or password", 401);
      }
      if (!user.isActive) {
        throw new AppError("Account is deactivated", 401);
      }

      user.password = undefined;
      const token = this.generateToken(user);
      return { user, token };
    } catch (error) {
      throw new AppError(`Login failed: ${error.message}`, 401);
    }
  }

  async generateToken(user) {
    return jwt.sign(
      {
        id: user._id,
        role: user.role,
        store: user.store,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );
  }

  async getStoreUsers(storeId, role = null) {
    return await this.userRepository.findByStore(storeId, role);
  }

  async updateUser(userId, updateData) {
    if (updateData.password) {
      delete updateData.password;
    }

    const user = await this.userRepository.update(userId, updateData);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    user.password = undefined;
    return user;
  }
}

export default UserService;
