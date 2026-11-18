import {
  Document,
  Model,
  Schema,
  Types,
  model,
  models,
} from "mongoose";

export const CHARGE_CATEGORIES = [
  "customs",
  "handling",
  "storage",
  "inspection",
  "documentation",
  "insurance",
  "delivery",
  "other",
] as const;

export type ChargeCategory =
  (typeof CHARGE_CATEGORIES)[number];

export const CHARGE_ISSUE_STATUSES = [
  "open",
  "resolved",
  "cancelled",
] as const;

export type ChargeIssueStatus =
  (typeof CHARGE_ISSUE_STATUSES)[number];

export const CHARGE_PAYMENT_STATUSES = [
  "unpaid",
  "awaiting_details",
  "awaiting_payment",
  "under_review",
  "paid",
  "rejected",
  "waived",
] as const;

export type ChargePaymentStatus =
  (typeof CHARGE_PAYMENT_STATUSES)[number];

export interface IShipmentCharge extends Document {
  shipmentId: Types.ObjectId;
  trackingNumber: string;
  category: ChargeCategory;
  title: string;
  description: string;
  amount: number;
  currency: string;
  issueStatus: ChargeIssueStatus;
  paymentStatus: ChargePaymentStatus;
  createdBy: Types.ObjectId;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  selectedPaymentMethod?: string;
  paymentDetails?: {
    recipientName?: string;
    paymentAddress?: string;
    providerName?: string;
    instructions?: string;
    assignedAt?: Date;
    expiresAt?: Date;
  };
  paymentReceipt?: {
    data: Buffer;
    contentType: string;
    fileName: string;
    size: number;
    uploadedAt: Date;
  };
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  rejectionReason?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const shipmentChargeSchema = new Schema<IShipmentCharge>(
  {
    shipmentId: {
      type: Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
    },

    trackingNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    category: {
      type: String,
      enum: CHARGE_CATEGORIES,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 700,
    },

    amount: {
      type: Number,
      required: true,
      min: Number.EPSILON,
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      match: /^[A-Z]{3}$/,
    },

    issueStatus: {
      type: String,
      enum: CHARGE_ISSUE_STATUSES,
      default: "open",
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: CHARGE_PAYMENT_STATUSES,
      default: "unpaid",
      required: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },

    resolvedAt: Date,

    selectedPaymentMethod: {
      type: String,
      trim: true,
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

      providerName: {
        type: String,
        trim: true,
      },

      instructions: {
        type: String,
        trim: true,
      },

      assignedAt: Date,
      expiresAt: Date,
    },

    paymentReceipt: {
      data: {
        type: Buffer,
        select: false,
      },

      contentType: String,
      fileName: String,
      size: Number,
      uploadedAt: Date,
    },

    submittedAt: Date,
    reviewedAt: Date,

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    paidAt: Date,
  },
  {
    timestamps: true,
  },
);

shipmentChargeSchema.index({
  shipmentId: 1,
  createdAt: -1,
});
shipmentChargeSchema.index({
  trackingNumber: 1,
  issueStatus: 1,
});
shipmentChargeSchema.index({
  paymentStatus: 1,
  createdAt: -1,
});

export const ShipmentCharge: Model<IShipmentCharge> =
  models.ShipmentCharge ||
  model<IShipmentCharge>("ShipmentCharge", shipmentChargeSchema);
