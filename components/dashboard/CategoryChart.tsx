"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export interface CategoryDatum {
  category: string;
  count: number;
  color: string;
}

// recharts is only downloaded for this small decorative donut, after the page is interactive.
const CategoryPie = dynamic(() => import("./CategoryPie").then((m) => m.CategoryPie), {
  ssr: false,
  loading: () => <Skeleton className="mx-auto size-[144px] rounded-full" />,
});

export function CategoryChart({ data }: { data: CategoryDatum[] }) {
  return (
    <div className="flex h-[160px] w-full max-w-[200px] shrink-0 items-center justify-center" aria-hidden="true">
      <CategoryPie data={data} />
    </div>
  );
}
