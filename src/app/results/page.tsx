import { LivePublicResults } from "@/components/results/live-public-results";

export const metadata = {
  title: "Live Results | NIESV Voting",
  description: "Live election results for NIESV Abuja Branch",
};

export default function ResultsPage({
  searchParams,
}: {
  searchParams: { wing?: string };
}) {
  return <LivePublicResults wingSlug={searchParams.wing ?? null} />;
}
