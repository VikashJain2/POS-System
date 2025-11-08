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
      ],
      isAvailable: true,
    });
  }

  async getByStoreWithInventory(storeId) {
    return await this.find({ isAvailable: true });
  }
}

export default MenuItemRepository;
