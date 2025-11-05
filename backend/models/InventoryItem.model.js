import mongoose from "mongoose";
const inventoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: [
      "dough",
      "sauce",
      "cheese",
      "toppings",
      "meat",
      "vegetables",
      "beverages",
      "packaging",
    ],
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0
  },
  minimumStock:{
    type: Number,
    required: true,
    min: 0
  },
  costPerUnit:{
    type:Number,
    required: true,
    min:0
  },
  supplier: String,
  lastRestocked: Date,
  store: {
    type: mongoose.Types.ObjectId,
    ref: "Store",
    required: true
  }
}, {
    timestamps: true
});

inventoryItemSchema.index({store: 1, name: 1}, {unique: true})
const inventoryItemModel = mongoose.model("InventoryItem", inventoryItemSchema);
export default inventoryItemModel