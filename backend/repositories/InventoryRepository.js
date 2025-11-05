import mongoose from "mongoose";
import inventoryItemModel from "../models/InventoryItem.model.js";
import BaseRepository from "./BaseRepository.js";

class InventoryRepository extends BaseRepository {
  constructor() {
    super(inventoryItemModel);
  }

  async findByStore(storeId) {
    return await this.find({ store: storeId });
  }
  async findLowStock(storeId) {
    return await this.find({
      store: storeId,
      $expr: { $lte: ["$currentStock", "$minimumStock"] },
    });
  }

  async decrementStock(itemId, quantity) {
    return await this.model.findByIdAndUpdate(
      itemId,
      {
        $inc: { currentStock: -quantity },
      },
      {
        new: true,
      }
    );
  }

  async getInventoryValue(storeId) {
    const result = await this.model.aggregate([
      {
        $match: { store: new mongoose.Types.ObjectId(storeId) },
      },
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: { $multiply: ["$currentStock", "$costPerUnit"] },
          },
        },
      },
    ]);
    return result[0]?.totalValue || 0;
  }
}

export default InventoryRepository;
