import { PageLoader } from "@/components/ui/page-loader";

export default function AuthLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <PageLoader message="Loading..." />
        </div>
    );
}
