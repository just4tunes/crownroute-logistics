import { Document, Model, Schema, model, models } from "mongoose";

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

export type CheckpointStatus = "pending" | "active" | "completed";

export type UpdateSource = "admin" | "automatic";

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
  completionSource?: UpdateSource;
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

  departureDate?: Date;
  arrivalDate?: Date;

  // Kept for compatibility with shipments created before
  // departureDate and arrivalDate were introduced.
  estimatedDelivery?: Date;

  progress: number;
  autoProgressEnabled: boolean;
  lastAutomaticUpdateAt?: Date;

  currentLocation?: {
    name?: string;
    latitude?: number;
    longitude?: number;
    source?: UpdateSource;
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

    estimatedArrival: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["pending", "active", "completed"],
      default: "pending",
    },

    completionSource: {
      type: String,
      enum: ["admin", "automatic"],
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

      address: {
        type: String,
        trim: true,
      },

      latitude: {
        type: Number,
      },

      longitude: {
        type: Number,
      },
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

      address: {
        type: String,
        trim: true,
      },

      latitude: {
        type: Number,
      },

      longitude: {
        type: Number,
      },
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

    departureDate: {
      type: Date,
    },

    arrivalDate: {
      type: Date,
    },

    estimatedDelivery: {
      type: Date,
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    autoProgressEnabled: {
      type: Boolean,
      default: true,
    },

    lastAutomaticUpdateAt: {
      type: Date,
    },

    currentLocation: {
      name: {
        type: String,
        trim: true,
      },

      latitude: {
        type: Number,
      },

      longitude: {
        type: Number,
      },

      source: {
        type: String,
        enum: ["admin", "automatic"],
      },
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
  models.Shipment || model<IShipment>("Shipment", shipmentSchema);
