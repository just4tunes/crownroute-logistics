import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CrownRoute Logistics",
    template: "%s | CrownRoute Logistics",
  },

  description:
    "Premium international freight, courier and intelligent shipment tracking services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
