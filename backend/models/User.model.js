import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: function (email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: "Invalid email format",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "store_manager", "employee", "customer"],
      default: "employee",
    },
    store: {
      type: mongoose.Types.ObjectId,
      ref: "Store",
      required: function () {
        return ["store_manager", "employee"].includes(this.role);
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    permissions: [
      {
        type: String,
        enum: [
          "read_orders",
          "write_orders",
          "manage_inventory",
          "manage_users",
          "view_reports",
          "process_payments",
        ],
      },
    ],

    lastLogin: {
      type: Date,
    },
    phone: String,
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
