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
  async findCriticalStock(storeId) {
    return await this.find({
      store: storeId,
      expr: { $lte: ["$currentStock", { $multiply: ["$minimumStock", 1.5] }] },
    });
  }

  async decrementStock(itemId, quantity) {
    return await this.model.findByIdAndUpdate(
      itemId,
      {
        $inc: { currentStock: -quantity },
        $set: { lastUpdated: new Date() },
      },
      {
        new: true,
      }
    );
  }

  async incrementStock(itemId, quantity) {
    return await this.model.findByIdAndUpdate(
      itemId,
      {
        $inc: { currentStock: quantity },
        $set: { lastUpdated: new Date() },
      },
      { new: true }
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
          totalItems: {
            $sum: 1,
          },
          lowStockItems: {
            $sum: {
              $cond: [{ $lte: ["$currentStock", "$minimumStock"] }, 1, 0],
            },
          },
        },
      },
    ]);
    return result[0] || { totalValue: 0, totalItems: 0, lowStockItems: 0 };
  }

  async getCategorySummary(storeId) {
    return await this.model.aggregate([
      {
        $match: {
          store: new mongoose.Types.ObjectId(storeId),
        },
      },
      {
        $group: {
          _id: "$category",
          totalItems: { $sum: 1 },
          totalValue: {
            $sum: {
              $multiply: ["$currentStock", "$costPerUnit"],
            },
          },
          averageCost: {
            $avg: "$costPerUnit",
          },
          lowStockItems: {
            $sum: {
              $cond: [{ $lte: ["$currentStock", "$minimumStck"] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { totalValue: -1 },
      },
    ]);
  }

  async getRestockSuggestions(storeId) {
    return await this.model.aggregate([
      {
        $match: {
          store: new mongoose.Types.ObjectId(storeId),
          $expr: {
            $or: [
              { $lte: ["$currentStock", "$minimumStock"] },
              {
                $lte: ["$currentStock", { $multiply: ["$minimumStock", 1.5] }],
              },
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          category: 1,
          currentStock: 1,
          minimumStock: 1,
          unit: 1,
          costPerUnit: 1,
          supplier: 1,
          urgency: {
            $cond: [
              { $lte: ["$currentStock", "$minimumStock"] },
              "high",
              "medium",
            ],
          },
          suggestedOrder: {
            $multiply: [
              "$minimumStock",
              {
                $cond: [{ $lte: ["$currentStock", "$minimumStock"] }, 3, 2],
              },
            ],
          },
          estimatedCost: {
            $multiply: [
              {
                $multiply: [
                  "$minimumStock",
                  {
                    $cond: [{ $lte: ["$currentStock", "$minimumStock"] }, 3, 2],
                  },
                ],
              },
              "$costPerUnit",
            ],
          },
        },
      },
      {
        $sort: { urgency: -1, currentStock: 1 },
      },
    ]);
  }
}

export default InventoryRepository;
