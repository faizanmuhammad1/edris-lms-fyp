import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "../../_components/PageContainer";
import { PageHeaderSkeleton } from "../../_components/DashboardSkeletons";

export default function CertificateLoading() {
  return (
    <PageContainer width="medium">
      <span className="sr-only" role="status">
        Loading certificate…
      </span>
      <PageHeaderSkeleton withAction />
      {/* Same A4-landscape proportion as the certificate. */}
      <Skeleton className="aspect-[1.414/1] w-full rounded-none" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </PageContainer>
  );
}
