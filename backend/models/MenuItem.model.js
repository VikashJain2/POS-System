import mongoose from "mongoose";
const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    category: {
      type: String,
      enum: ["pizza", "sides", "drinks", "desserts", "combos"],
      required: true,
    },
    size: {
      type: String,
      enum: ["small", "medium", "large", "family", "none"],
      default: "none",
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    image: String,
    ingredients: [
      {
        inventoryItem: {
          type: mongoose.Types.ObjectId,
          ref: "InventoryItem",
        },
        quantity: Number,
      },
    ],
    customizationOptions: {
      crust: [String],
      toppings: [String],
      extras: [String],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number,
      default: 15,
    },

    nutritionalInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
    },
  },
  {
    timestamps: true,
  }
);

menuItemSchema.index({ category: 1, isAvailable: 1 });

const MenuItemModel = mongoose.model("MenuItem", menuItemSchema);
export default MenuItemModel;
