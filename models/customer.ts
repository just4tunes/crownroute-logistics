import {
  Document,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

export type CustomerAccountStatus =
  | "pending_payment"
  | "active"
  | "suspended"
  | "rejected";

export type RegistrationPaymentStatus =
  | "not_started"
  | "awaiting_details"
  | "awaiting_payment"
  | "under_review"
  | "approved"
  | "rejected";

export interface ICustomer extends Document {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  passwordHash: string;

  accountStatus: CustomerAccountStatus;
  registrationPaymentStatus: RegistrationPaymentStatus;

  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      minlength: 7,
      maxlength: 30,
    },

    country: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    address: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 300,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    accountStatus: {
      type: String,
      enum: [
        "pending_payment",
        "active",
        "suspended",
        "rejected",
      ],
      default: "pending_payment",
      index: true,
    },

    registrationPaymentStatus: {
      type: String,
      enum: [
        "not_started",
        "awaiting_details",
        "awaiting_payment",
        "under_review",
        "approved",
        "rejected",
      ],
      default: "not_started",
      index: true,
    },

    lastLoginAt: Date,
  },
  {
    timestamps: true,
  },
);

export const Customer: Model<ICustomer> =
  models.Customer ||
  model<ICustomer>("Customer", customerSchema);