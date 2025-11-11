import MenuItemModel from "../models/MenuItem.model";
import BaseRepository from "./BaseRepository";

class MenuItemRepository extends BaseRepository {
  constructor() {
    super(MenuItemModel);
  }

  async findByCategory(category) {
    return await this.find({ category, isAvailable: true });
  }

  async searchItems(searchTerm) {
    return await this.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { category: { $regex: searchTerm, $options: "i" } },
      ],
      isAvailable: true,
    });
  }

  async getAvailableItems() {
    return await this.find({ isAvailable: true });
  }

  async getPopularItems(limit = 10) {
    return await this.find({ isAvailable: true })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getCategories() {
    return await this.model.distinct("category", { isAvailable: true });
  }
  async updateAvailablility(itemId, isAvailable) {
    return await this.update(itemId, { isAvailable });
  }

  async blukUpdateAvailability(itemIds, isAvailable) {
    return await this.model.updateMany(
      { _id: { $in: itemIds } },
      { $set: { isAvailable } }
    );
  }
  async getByStoreWithInventory(storeId) {
    return await this.find({ isAvailable: true });
  }
}

export default MenuItemRepository;
