import type { Metadata } from "next";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { getStudentProgressData } from "./actions";
import { StudentProgressPage } from "./_components/StudentProgressPage";

export const metadata: Metadata = {
  title: "Admin · Student progress",
};

export default async function StudentProgress() {
  await requireAdmin();
  // Rendered on the server for the first paint; the client then keeps it live.
  const initialResult = await getStudentProgressData();

  return <StudentProgressPage initialResult={initialResult} />;
}
