import mongoose from "mongoose";
const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Types.ObjectId,
    ref: "MenuItem",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  customization: {
    crust: String,
    toppings: [String],
    extras: [String],
    specialInstructions: String,
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    customer: {
      name: String,
      phone: {
        type: String,
        required: function () {
          return this.orderType === "delivery";
        },
      },
      email: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
      },
    },

    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    orderType: {
      type: String,
      enum: ["dine-in", "takeaway", "delivery"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "baking",
        "quality_check",
        "ready",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online"],
      required: true,
    },
    paymentDetails: {
      paymentId: String,
      razorpayOrderId: String,
      refundId: String,
      paymentGateway: {
        type: String,
        enum: ["razorpay", "cash"],
        default: "cash",
      },
    },
    store: {
      type: mongoose.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    assignedTo: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    estimatedDelivery: Date,
    notes: String,
    preparationTime: Number,
    loyaltyPointsEarned: {
      type: Number,
      default: 0,
    },
    loyaltyPointsRedeemed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    const count = await mongoose.model("Order").countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      },
    });

    this.orderNumber = `DOM${year}${month}${day}${(count + 1)
      .toString()
      .padStart(4, "0")}`;
  }

  if (this.isModified("items") && this.items.length > 0) {
    const menuItems = await mongoose.model("MenuItem").find({
      _id: { $in: this.items.map((item) => item.menuItem) },
    });

    this.preparationTime = this.items.reduce((total, item) => {
      const menuItem = menuItems.find((mi) => mi._id.equals(item.menuItem));

      return total + (menuItem?.preparationTime || 15) * item.quantity;
    }, 0);
  }
  next();
});

orderSchema.index({ store: 1, status: 1 });
orderSchema.index({ createdAt: 1 });
orderSchema.index({ "customer.phone": 1 });
const OrderModel = mongoose.model("Order", orderSchema);
export default OrderModel;
