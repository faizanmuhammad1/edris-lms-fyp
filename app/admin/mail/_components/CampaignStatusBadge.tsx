import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { CAMPAIGN_STATUS_META, type CampaignStatus } from "../_lib/campaign";

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const meta = CAMPAIGN_STATUS_META[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}
