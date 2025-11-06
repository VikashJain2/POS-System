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

  async getLowStock(storeId) {
    return await this.inventoryRepository.find({
      store: storeId,
      currentStock: { $lte: { $min: "$minimumStock" } },
    });
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
    const items = await this.inventoryRepository.find({ store: storeId });
    return items.reduce((total, item) => {
      return total + item.currentStock * item.costPerUnit;
    }, 0);
  }
}

export default InventoryService;
