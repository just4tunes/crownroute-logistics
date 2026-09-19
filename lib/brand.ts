export const brand = {
  name: "CrownRoute Logistics",
  shortName: "CrownRoute",
  tagline: "Precision across every mile.",
  description:
    "Premium international freight, courier and supply-chain services with intelligent shipment tracking.",

  contact: {
    phone: "+1 212 555 0147",
    email: "support@crownroutelogistics.com",
    address: "New York, United States",
  },

  statistics: [
    {
      value: "50K+",
      label: "Annual shipments",
    },
    {
      value: "150+",
      label: "Global routes",
    },
    {
      value: "99.8%",
      label: "On-time delivery",
    },
    {
      value: "24/7",
      label: "Operations support",
    },
  ],

  trackingModes: [
    {
      id: "parcel",
      label: "Parcel",
    },
    {
      id: "air",
      label: "Air",
    },
    {
      id: "ocean",
      label: "Ocean",
    },
    {
      id: "rail",
      label: "Rail",
    },
    {
      id: "express",
      label: "Express",
    },
  ],
} as const;