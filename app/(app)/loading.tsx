import { PageSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="px-4 pt-6 lg:px-8">
      <PageSkeleton />
    </div>
  );
}
