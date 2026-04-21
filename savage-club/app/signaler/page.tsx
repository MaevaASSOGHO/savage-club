// app/signaler/page.tsx
import { Suspense } from "react";
import ReportPage from "./ReportContent";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F0A1F]" />}>
      <ReportPage />
    </Suspense>
  );
}