import { redirect } from "next/navigation";

import { CreateShipmentForm } from "@/components/admin/create-shipment-form";
import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";

export const dynamic = "force-dynamic";

export default async function NewShipmentPage() {
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

  return <CreateShipmentForm />;
}