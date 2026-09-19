import type {
  CheckpointStatus,
  ShipmentCheckpoint,
} from "@/models/shipment";

type ServiceMode =
  | "parcel"
  | "air"
  | "ocean"
  | "rail"
  | "express";

type RouteLocation = {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
};

type GenerateRouteInput = {
  serviceMode: ServiceMode;
  origin: RouteLocation;
  destination: RouteLocation;
  departureDate: Date;
  arrivalDate: Date;
};

type RouteTemplate = {
  location: string;
  description: string;
  position: "origin" | "middle" | "destination";
};

const templates: Record<ServiceMode, RouteTemplate[]> = {
  air: [
    {
      location: "Origin collection point",
      description: "Shipment awaiting collection",
      position: "origin",
    },
    {
      location: "Origin processing facility",
      description: "Shipment processing and documentation",
      position: "origin",
    },
    {
      location: "Origin international airport",
      description: "Shipment prepared for air transportation",
      position: "origin",
    },
    {
      location: "International transit",
      description: "Shipment travelling between countries",
      position: "middle",
    },
    {
      location: "Destination international airport",
      description: "Shipment arriving at destination airport",
      position: "destination",
    },
    {
      location: "Customs facility",
      description: "Shipment awaiting customs processing",
      position: "destination",
    },
    {
      location: "Final delivery",
      description: "Shipment delivered to the recipient",
      position: "destination",
    },
  ],

  ocean: [
    {
      location: "Origin collection point",
      description: "Cargo awaiting collection",
      position: "origin",
    },
    {
      location: "Origin freight terminal",
      description: "Cargo processing and consolidation",
      position: "origin",
    },
    {
      location: "Origin seaport",
      description: "Cargo prepared for vessel departure",
      position: "origin",
    },
    {
      location: "International waters",
      description: "Cargo transported by sea",
      position: "middle",
    },
    {
      location: "Destination seaport",
      description: "Cargo arriving at destination port",
      position: "destination",
    },
    {
      location: "Customs facility",
      description: "Cargo undergoing customs processing",
      position: "destination",
    },
    {
      location: "Final delivery",
      description: "Cargo delivered to the recipient",
      position: "destination",
    },
  ],

  rail: [
    {
      location: "Origin collection point",
      description: "Shipment awaiting collection",
      position: "origin",
    },
    {
      location: "Origin rail terminal",
      description: "Shipment prepared for rail transportation",
      position: "origin",
    },
    {
      location: "Rail transit checkpoint",
      description: "Shipment travelling by rail",
      position: "middle",
    },
    {
      location: "Destination rail terminal",
      description: "Shipment arriving at destination terminal",
      position: "destination",
    },
    {
      location: "Regional distribution centre",
      description: "Shipment prepared for final delivery",
      position: "destination",
    },
    {
      location: "Final delivery",
      description: "Shipment delivered to the recipient",
      position: "destination",
    },
  ],

  express: [
    {
      location: "Express collection",
      description: "Shipment awaiting priority collection",
      position: "origin",
    },
    {
      location: "Express sorting facility",
      description: "Shipment receiving priority processing",
      position: "origin",
    },
    {
      location: "Express transit",
      description: "Shipment travelling on the priority route",
      position: "middle",
    },
    {
      location: "Destination sorting facility",
      description: "Shipment prepared for local delivery",
      position: "destination",
    },
    {
      location: "Out for delivery",
      description: "Courier transporting shipment to recipient",
      position: "destination",
    },
    {
      location: "Final delivery",
      description: "Shipment delivered to the recipient",
      position: "destination",
    },
  ],

  parcel: [
    {
      location: "Parcel collection point",
      description: "Parcel awaiting collection",
      position: "origin",
    },
    {
      location: "Origin sorting facility",
      description: "Parcel sorted for transportation",
      position: "origin",
    },
    {
      location: "Regional transit facility",
      description: "Parcel moving through the delivery network",
      position: "middle",
    },
    {
      location: "Destination sorting facility",
      description: "Parcel sorted for local delivery",
      position: "destination",
    },
    {
      location: "Out for delivery",
      description: "Parcel assigned to a local courier",
      position: "destination",
    },
    {
      location: "Final delivery",
      description: "Parcel delivered to the recipient",
      position: "destination",
    },
  ],
};

export function generateRouteCheckpoints({
  serviceMode,
  origin,
  destination,
  departureDate,
  arrivalDate,
}: GenerateRouteInput): ShipmentCheckpoint[] {
  const template = templates[serviceMode];

  if (!template) {
    throw new Error(`Unsupported service mode: ${serviceMode}`);
  }

  const departureTime = departureDate.getTime();
  const arrivalTime = arrivalDate.getTime();

  if (
    Number.isNaN(departureTime) ||
    Number.isNaN(arrivalTime)
  ) {
    throw new Error("Departure and arrival dates must be valid.");
  }

  if (arrivalTime <= departureTime) {
    throw new Error(
      "Arrival date must be later than the departure date.",
    );
  }

  const totalDuration = arrivalTime - departureTime;

  const middleLatitude =
    (origin.latitude + destination.latitude) / 2;

  const middleLongitude =
    (origin.longitude + destination.longitude) / 2;

  return template.map((checkpoint, index) => {
    const progressPosition =
      template.length === 1
        ? 1
        : index / (template.length - 1);

    const estimatedArrival = new Date(
      departureTime + totalDuration * progressPosition,
    );

    let city = origin.city;
    let country = origin.country;
    let latitude = origin.latitude;
    let longitude = origin.longitude;

    if (checkpoint.position === "middle") {
      city = "International transit";
      country = "In transit";
      latitude = middleLatitude;
      longitude = middleLongitude;
    }

    if (checkpoint.position === "destination") {
      city = destination.city;
      country = destination.country;
      latitude = destination.latitude;
      longitude = destination.longitude;
    }

    const status: CheckpointStatus =
      index === 0 ? "active" : "pending";

    return {
      location: checkpoint.location,
      city,
      country,
      latitude,
      longitude,
      description: checkpoint.description,
      estimatedArrival,
      status,
    };
  });
}
