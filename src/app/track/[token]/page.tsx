import { CampaignTrackingScreen } from "@/components/track/campaign-tracking-screen";

type TrackPageProps = {
  params: { token: string };
};

export default function TrackPage({ params }: TrackPageProps) {
  return <CampaignTrackingScreen token={params.token} />;
}
