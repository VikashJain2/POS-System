import MenuItemRepository from "../repositories/MenuItemRepository";
import { AppError } from "../utils/errors";

class MenuService {
  constructor() {
    this.menuItemRepository = new MenuItemRepository();
  }

  async getMenuItems(filters = {}) {
    try {
      const { category, search, available } = filters;
      let query = {};

      if (category) query.category = category;
      if (available !== undefined) query.isAvailable = available;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }
      return await this.menuItemRepository.find(query);
    } catch (error) {
      throw new AppError(`Failed to fetch menu items: ${error.message}`, 500);
    }
  }

  async createMenuItem(menuItemData) {
    try {
      if (
        !menuItemData.name ||
        !menuItemData.category ||
        !menuItemData.basePrice
      ) {
        throw new AppError(
          "Name, category, and base price are required to create a menu item.",
          400
        );
      }

      const menuItem = this.menuItemRepository.create(menuItemData);
      return menuItem;
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError(`Menu item with the same name already exists.`, 400);
      }
      throw new AppError(`Failed to create menu item: ${error.message}`, 400);
    }
  }

  async updateMenuItem(itemId, updateData) {
    try {
      const menuItem = await this.menuItemRepository.update(itemId, updateData);

      if (!menuItem) {
        throw new AppError("Menu Item not found", 404);
      }
      return menuItem;
    } catch (error) {
      throw new AppError(`Failed to update menu item: ${error.message}`, 400);
    }
  }

  async deleteMenuItem(itemId) {
    try {
      const menuItem = await this.menuItemRepository.delete(itemId);

      if (!menuItem) {
        throw new AppError("Menu Item not found", 404);
      }
      return menuItem;
    } catch (error) {
      throw new AppError(`Failed to delete menu item: ${error.message}`, 400);
    }
  }

  async getCategories() {
    try {
      const categories = await this.menuItemRepository.getCategories();
      return categories;
    } catch (error) {
      throw new AppError(`Failed to fetch categories: ${error.message}`, 500);
    }
  }
}

export default MenuService;
