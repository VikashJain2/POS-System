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

  async findEmployees(storeId = null) {
    const conditions = { role: "employee" };
    if (storeId) {
      conditions.store = storeId;
    }
    return await this.find(conditions, ["store"]);
  }

  async findActiveUsers() {
    return await this.find({ isActive: true });
  }

  async getStaffCountByStore(storeId) {
    const result = await this.model.aggregate([
      {
        $match: {
          store: storeId,
          role: { $in: ["store_manager", "employee"] },
        },
      },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);
    return result;
  }

  async updateUserStatus(userId, isActive) {
    return await this.update(userId, { isActive });
  }

  async updateUserRole(userId, role, storeId = null) {
    const updateData = { role };
    if (storeId) updateData.store = storeId;
    return await this.update(userId, updateData);
  }
  async searchUsers(query, storeId = null){
    const conditions = {
      $or:[
        {name: {$regex: query, $options: 'i'}},
        {email: {$regex: query, $options: 'i'}}
      ]
    }
    if(storeId) conditions.store = storeId
    return await this.find(conditions, ['store'])
  }
  async getUserWithStoreInfo(){
    return await this.find({}, ['store'])
  }
}

export default UserRepository;
