import {
  Document,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

export type AdminRole = "owner" | "developer" | "staff";

export interface IAdmin extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdmin>(
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
      trim: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["owner", "developer", "staff"],
      default: "staff",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: Date,
  },
  {
    timestamps: true,
  },
);

export const Admin: Model<IAdmin> =
  models.Admin || model<IAdmin>("Admin", adminSchema);