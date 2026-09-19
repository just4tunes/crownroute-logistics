import { isValidObjectId } from "mongoose";
import { notFound, redirect } from "next/navigation";

import { ShipmentManager } from "@/components/admin/shipment-manager";
import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";
import { Shipment } from "@/models/shipment";

export const dynamic = "force-dynamic";

type ShipmentPageProps = {
  params: Promise<{
    shipmentId: string;
  }>;
};

export default async function ShipmentManagementPage({
  params,
}: ShipmentPageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  await connectToDatabase();

  const admin = await Admin.exists({
    _id: session.adminId,
    isActive: true,
  });

  if (!admin) {
    redirect("/admin/login");
  }

  const { shipmentId } = await params;

  if (!isValidObjectId(shipmentId)) {
    notFound();
  }

  const shipment = await Shipment.findById(
    shipmentId,
  ).lean();

  if (!shipment) {
    notFound();
  }

  const serializedShipment = JSON.parse(
    JSON.stringify(shipment),
  );

  return (
    <ShipmentManager
      initialShipment={serializedShipment}
    />
  );
}