import UserRepository from "../repositories/UserRepository";

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

      user.password = undefined
      const token = this.generateToken(user);
      return { user, token };
    } catch (error) {
        throw new AppError(`Login failed: ${error.message}`, 401);
    }
  }
}
