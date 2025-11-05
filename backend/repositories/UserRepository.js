import UserModel from "../models/User.model.js";
import BaseRepository from "./BaseRepository.js";

class UserRepository extends BaseRepository {
  constructor() {
    super(UserModel);
  }
  async findByEmail(email) {
    return await this.findOne({ email: email.toLowerCase() });
  }

  async findByStore(storeId, role = null) {
    const conditions = { store: storeId };
    if (role) conditions.role = role;
    return await this.find(conditions, ["store"]);
  }

  async findManager() {
    return await this.find({ role: "store_manager" }, ["store"]);
  }
}

export default UserRepository;
