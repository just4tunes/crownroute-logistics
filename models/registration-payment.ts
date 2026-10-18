import { Document, Model, Schema, Types, model, models } from "mongoose";

export type RegistrationPaymentMethod =
  | "paypal"
  | "cash_app"
  | "bank_transfer"
  | "bitcoin"
  | "usdt";

export type RegistrationPaymentRequestStatus =
  | "awaiting_details"
  | "awaiting_payment"
  | "under_review"
  | "approved"
  | "rejected";

export interface IRegistrationPayment extends Document {
  customerId: Types.ObjectId;
  referenceCode: string;

  amount: number;
  currency: "USD";
  method: RegistrationPaymentMethod;
  status: RegistrationPaymentRequestStatus;

  paymentDetails?: {
    recipientName?: string;
    paymentAddress?: string;
    bankName?: string;
    instructions?: string;
  };

  assignedAt?: Date;
  expiresAt?: Date;
  paymentProof?: {
    data: Buffer;
    contentType: string;
    fileName: string;
    size: number;
    uploadedAt: Date;
  };

  submittedAt?: Date;

  rejectionReason?: string;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const registrationPaymentSchema = new Schema<IRegistrationPayment>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
      index: true,
    },

    referenceCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      default: 1000,
      min: 1000,
      max: 1000,
    },

    currency: {
      type: String,
      enum: ["USD"],
      default: "USD",
      required: true,
    },

    method: {
      type: String,
      enum: ["paypal", "cash_app", "bank_transfer", "bitcoin", "usdt"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "awaiting_details",
        "awaiting_payment",
        "under_review",
        "approved",
        "rejected",
      ],
      default: "awaiting_details",
      index: true,
    },

    paymentDetails: {
      recipientName: {
        type: String,
        trim: true,
      },

      paymentAddress: {
        type: String,
        trim: true,
      },

      bankName: {
        type: String,
        trim: true,
      },

      instructions: {
        type: String,
        trim: true,
        maxlength: 1000,
      },
    },

    assignedAt: Date,
    expiresAt: Date,

    paymentProof: {
      data: {
        type: Buffer,
        select: false,
      },

      contentType: {
        type: String,
        enum: ["image/jpeg", "image/png", "image/webp"],
      },

      fileName: {
        type: String,
        trim: true,
        maxlength: 180,
      },

      size: {
        type: Number,
        min: 1,
        max: 2 * 1024 * 1024,
      },

      uploadedAt: Date,
    },

    submittedAt: Date,

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    reviewedAt: Date,

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  },
);

export const RegistrationPayment: Model<IRegistrationPayment> =
  models.RegistrationPayment ||
  model<IRegistrationPayment>("RegistrationPayment", registrationPaymentSchema);
