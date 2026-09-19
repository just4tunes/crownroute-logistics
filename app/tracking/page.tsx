import { TrackingClient } from "@/components/tracking/tracking-client";

type TrackingPageProps = {
  searchParams: Promise<{
    number?: string;
  }>;
};

export default async function TrackingPage({
  searchParams,
}: TrackingPageProps) {
  const params = await searchParams;

  return <TrackingClient initialNumber={params.number ?? ""} />;
}