import InventoryRepository from "../repositories/InventoryRepository.js";
const MenuItemRepository = require("../repositories/MenuItemRepository.js");
class InventoryService {
  constructor() {
    this.inventoryRepository = new InventoryRepository();
    this.menuItemRepository = new MenuItemRepository();
  }

  async updateInventory(itemId, updateData) {
    const inventoryItem = await this.inventoryRepository.update(
      itemId,
      updateData
    );
    if (!inventoryItem) {
      throw new AppError("Inventory item not found", 404);
    }

    return inventoryItem;
  }

  async checkStock(itemId, requiredQuantity) {
    const item = await this.inventoryRepository.findById(itemId);
    return item && item.currentStock >= requiredQuantity;
  }

  async getLowStockItems(storeId) {
    return await this.inventoryRepository.findLowStock(storeId);
  }

  async updateInventoryForOrder(orderItems, storeId) {
    for (const orderItem of orderItems) {
      const menuItem = await this.getMenuItemWithInventory(orderItem.menuItem);

      for (const ingredient of menuItem.ingredients) {
        await this.inventoryRepository.decrementStock(
          ingredient.inventoryItem._id,
          ingredient.quantity * orderItem.quantity
        );
      }
    }
  }

  async getMenuItemWithInventory(menuItemId) {
    return await this.menuItemRepository.findById(menuItemId, [
      "ingredients.inventoryItem",
    ]);
  }

  async restockInventory(itemId, quantity, cost) {
    const item = await this.inventoryRepository.findById(itemId);
    if (!item) {
      throw new AppError("Inventory item not found", 404);
    }

    const updateItem = await this.inventoryRepository.update(itemId, {
      currentStock: item.currentStock + quantity,
      lastRestocked: new Date(),
      costPerUnit: cost || item.costPerUnit,
    });

    return updateItem;
  }

  async getInventoryValue(storeId) {
    return await this.inventoryRepository.getInventoryValue(storeId);
  }

  async getCategorySummary(storeId) {
    return await this.inventoryRepository.getCategorySummary(storeId);
  }
  async getRestockSuggestions(storeId) {
    return await this.inventoryRepository.getRestockSuggestions(storeId);
  }
}

export default InventoryService;
