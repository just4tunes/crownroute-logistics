import {
  Document,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

export type ShipmentStatus =
  | "created"
  | "processing"
  | "in_transit"
  | "customs"
  | "held"
  | "delayed"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type CheckpointStatus =
  | "pending"
  | "active"
  | "completed";

export type NotificationType =
  | "information"
  | "success"
  | "warning"
  | "critical";

export type ShipmentCheckpoint = {
  location: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  description: string;
  estimatedArrival?: Date;
  completedAt?: Date;
  status: CheckpointStatus;
};

export type ShipmentNotification = {
  title: string;
  message: string;
  type: NotificationType;
  showAsPopup: boolean;
  createdAt: Date;
};

export interface IShipment extends Document {
  trackingNumber: string;

  sender: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };

  recipient: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };

  origin: {
    city: string;
    country: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };

  destination: {
    city: string;
    country: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };

  packageDescription: string;
  weight?: number;
  serviceMode: string;
  status: ShipmentStatus;
  estimatedDelivery?: Date;
  progress: number;

  currentLocation?: {
    name?: string;
    latitude?: number;
    longitude?: number;
  };

  checkpoints: ShipmentCheckpoint[];
  notifications: ShipmentNotification[];
  createdAt: Date;
  updatedAt: Date;
}

const checkpointSchema = new Schema<ShipmentCheckpoint>(
  {
    location: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    estimatedArrival: Date,
    completedAt: Date,

    status: {
      type: String,
      enum: ["pending", "active", "completed"],
      default: "pending",
    },
  },
  {
    _id: true,
  },
);

const notificationSchema = new Schema<ShipmentNotification>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["information", "success", "warning", "critical"],
      default: "information",
    },

    showAsPopup: {
      type: Boolean,
      default: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  },
);

const shipmentSchema = new Schema<IShipment>(
  {
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    sender: {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
      },

      phone: {
        type: String,
        trim: true,
      },

      address: {
        type: String,
        trim: true,
      },
    },

    recipient: {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
      },

      phone: {
        type: String,
        trim: true,
      },

      address: {
        type: String,
        trim: true,
      },
    },

    origin: {
      city: {
        type: String,
        required: true,
        trim: true,
      },

      country: {
        type: String,
        required: true,
        trim: true,
      },

      address: String,
      latitude: Number,
      longitude: Number,
    },

    destination: {
      city: {
        type: String,
        required: true,
        trim: true,
      },

      country: {
        type: String,
        required: true,
        trim: true,
      },

      address: String,
      latitude: Number,
      longitude: Number,
    },

    packageDescription: {
      type: String,
      required: true,
      trim: true,
    },

    weight: {
      type: Number,
      min: 0,
    },

    serviceMode: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "created",
        "processing",
        "in_transit",
        "customs",
        "held",
        "delayed",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "created",
    },

    estimatedDelivery: Date,

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    currentLocation: {
      name: String,
      latitude: Number,
      longitude: Number,
    },

    checkpoints: {
      type: [checkpointSchema],
      default: [],
    },

    notifications: {
      type: [notificationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export const Shipment: Model<IShipment> =
  models.Shipment ||
  model<IShipment>("Shipment", shipmentSchema);