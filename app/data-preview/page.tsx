"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DataResult, type DataResultStatus } from "@/components/results/data-result";
import { getAreaMetrics, getProjectUnits, projects } from "@/data/mock-real-estate";
import type { ProjectSummary } from "@/types/project";
import styles from "./preview.module.css";

const previewProject = projects[0] satisfies ProjectSummary;
const previewStates: { id: DataResultStatus; label: string }[] = [
  { id: "ready", label: "Ready" },
  { id: "partial", label: "PARTIAL" },
  { id: "loading", label: "Loading" },
  { id: "empty", label: "Empty" },
  { id: "error", label: "Error" },
];

export default function DataPreviewPage() {
  const [status, setStatus] = useState<DataResultStatus>("ready");
  const rows = useMemo(() => {
    const allRows = getProjectUnits(previewProject.id);
    return status === "partial"
      ? allRows.filter((row) => row.dataQuality === "PARTIAL" || row.code.endsWith("0001"))
      : allRows.filter((row) => row.dataQuality === "COMPLETE").slice(0, 48);
  }, [status]);

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div><span>LUU · DATA RESULT PREVIEW</span><h1>Kiểm tra giao diện dữ liệu</h1><p>Chọn một trạng thái để xem DataResult với dữ liệu mock. Trang này không gọi API.</p></div>
        <Link href="/">Quay lại workspace</Link>
      </header>
      <nav className={styles.controls} aria-label="Trạng thái preview">
        {previewStates.map((item) => <button key={item.id} type="button" aria-pressed={status === item.id} onClick={() => setStatus(item.id)}>{item.label}</button>)}
      </nav>
      <DataResult
        project={previewProject}
        rows={rows}
        metrics={getAreaMetrics(previewProject.id)}
        status={status}
        metadata={{ snapshotId: previewProject.snapshot, runId: "preview-run-001", runStatus: status === "partial" ? "partial" : "completed", dataGateStatus: status === "partial" ? "passed_with_warnings" : "passed", limitations: status === "partial" ? ["Một số trường dữ liệu cần được kiểm tra."] : [] }}
        sourceLabel="mock repository preview"
        errorMessage="Lỗi mô phỏng từ mock repository. Chọn Ready để quay lại dữ liệu mẫu."
        onRetry={() => setStatus("ready")}
      />
    </main>
  );
}
