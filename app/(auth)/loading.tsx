import { PageLoader } from "@/components/ui/page-loader";

export default function AuthLoading() {
    return (
        <div className="flex min-h-64 items-center justify-center">
            <PageLoader message="Loading..." />
        </div>
    );
}
