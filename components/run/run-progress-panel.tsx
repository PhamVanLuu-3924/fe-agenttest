"use client";

import { Clock3, MoreHorizontal, RotateCcw, Square, X } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { getRunProgress } from "@/components/run/run-state";
import { TaskTimeline } from "@/components/run/task-timeline";
import type { Agent, AgentRun } from "@/types/workspace";
import styles from "./run.module.css";

const phaseLabels: Record<AgentRun["phase"], string> = {
  idle: "Chưa bắt đầu", receiving: "Đang tiếp nhận", thinking: "Đang lập kế hoạch",
  collaborating: "Đang phối hợp", complete: "Đã hoàn tất", partial: "Chờ bạn duyệt",
  failed: "Có bước thất bại", retrying: "Đang thử lại", cancelling: "Đang dừng", cancelled: "Đã dừng",
};

export function RunProgressPanel({ run, agents, onRetry, onCancel, onClose }: {
  run: AgentRun;
  agents: readonly Agent[];
  onRetry: () => void;
  onCancel: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"progress" | "history">("progress");
  const progress = getRunProgress(run);
  const isRunning = ["receiving", "thinking", "collaborating", "retrying", "cancelling"].includes(run.phase);

  return <aside className={styles.panel} aria-label="Quá trình phân tích">
    <header className={styles.header}><div><small>RUN {run.id.replace(/^run-/i, "").toUpperCase()}</small><h2>Quá trình phân tích</h2></div><div><button type="button" aria-label="Tùy chọn"><MoreHorizontal /></button><button type="button" onClick={onClose} aria-label="Đóng quá trình"><X /></button></div></header>
    <div className={styles.tabs} role="tablist"><button type="button" role="tab" aria-selected={tab === "progress"} onClick={() => setTab("progress")}>Tiến trình</button><button type="button" role="tab" aria-selected={tab === "history"} onClick={() => setTab("history")}>Lịch sử</button></div>
    {tab === "progress" ? <>
      <section className={styles.summary}>
        <div><small>YÊU CẦU</small><strong>{run.title}</strong><span><Clock3 /> Bắt đầu {run.startedAt}</span></div>
        <div className={styles.progressRing} style={{ "--progress": `${progress.percent * 3.6}deg` } as CSSProperties}><span>{progress.completed}/{progress.total}</span><small>BƯỚC</small></div>
      </section>
      <div className={`${styles.status} ${styles[`status_${run.phase}`]}`}><span>{phaseLabels[run.phase]}</span><small>{run.phase === "partial" ? `${run.pendingReviewCount ?? 0} claim cần xác nhận trước khi xuất báo cáo` : run.error ?? "Các thay đổi được cập nhật từ mock lifecycle."}</small></div>
      <TaskTimeline run={run} agents={agents} />
      <div className={styles.actions}>
        {(run.phase === "failed" || run.phase === "cancelled") && <button type="button" className={styles.primaryAction} onClick={onRetry}><RotateCcw /> Thử lại</button>}
        {isRunning && run.phase !== "cancelling" && <button type="button" className={styles.dangerAction} onClick={onCancel}><Square /> Dừng run</button>}
        {run.phase === "partial" && <button type="button" className={styles.primaryAction}>Xem để duyệt</button>}
      </div>
    </> : <div className={styles.history}>
      <span><Clock3 /><strong>{run.startedAt}</strong> Run được khởi tạo</span>
      <span><Clock3 /><strong>Hiện tại</strong> {phaseLabels[run.phase]}</span>
      <p>Lịch sử chi tiết sẽ được repository thật cung cấp. Bản mock vẫn giữ đúng contract giao diện.</p>
    </div>}
  </aside>;
}
