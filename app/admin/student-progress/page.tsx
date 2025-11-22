import { StudentProgressPage } from "./_components/StudentProgressPage";
import { Suspense } from "react";

export default function StudentProgress() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentProgressPage />
    </Suspense>
  );
}
