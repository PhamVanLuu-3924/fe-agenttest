"use client";

import { useId, useState } from "react";
import { reviewTransitionAllowed } from "./report-checks";
import styles from "./report.module.css";

export type ReportActionsProps = {
  reviewStatus: "draft" | "pending_review" | "changes_requested" | "approved";
  exportState: { status: "idle" | "exporting" | "success" | "error" | "expired"; reference?: string; expiresAt?: string; label?: string };
  complete: boolean;
  incompleteReasons: readonly string[];
  revisionReason?: string;
  error?: string;
  busy?: boolean;
  onReview: (next: ReportActionsProps["reviewStatus"], reason?: string) => void;
  onExport: () => void;
};

export const reviewLabels: Record<ReportActionsProps["reviewStatus"], string> = {
  draft: "Bản nháp", pending_review: "Chờ duyệt", changes_requested: "Yêu cầu chỉnh sửa", approved: "Đã phê duyệt",
};

/** Badge tone mirrors the Figma status badge: neutral, warning, danger, success. */
export const reviewBadgeClass: Record<ReportActionsProps["reviewStatus"], string> = {
  draft: styles.badge, pending_review: `${styles.badge} ${styles.badgeWarning}`, changes_requested: `${styles.badge} ${styles.badgeDanger}`, approved: `${styles.badge} ${styles.badgeSuccess}`,
};

export function ReportActions({ reviewStatus, exportState, complete, incompleteReasons, revisionReason, error, busy = false, onReview, onExport }: ReportActionsProps) {
  const [reason, setReason] = useState("");
  const reasonId = useId();
  const blockedId = useId();
  const send = (next: ReportActionsProps["reviewStatus"]) => {
    if (!busy && reviewTransitionAllowed(reviewStatus, next, complete, reason)) onReview(next, reason.trim());
  };
  return <section className={styles.actions} aria-label="Thao tác báo cáo">
    <span className={reviewBadgeClass[reviewStatus]}>{reviewLabels[reviewStatus]}</span>
    {revisionReason && <p className={styles.warning}>Yêu cầu chỉnh sửa: {revisionReason}</p>}
    {reviewStatus === "pending_review" && <>
      <label htmlFor={reasonId}>Lý do yêu cầu chỉnh sửa</label>
      <textarea id={reasonId} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nêu phần cần bổ sung hoặc điều chỉnh…" />
      {!complete && <div id={blockedId} className={styles.warning}><strong>Chưa thể phê duyệt</strong><ul className={styles.checklist}>{incompleteReasons.map((message, index) => <li key={index}>{message}</li>)}</ul></div>}
    </>}
    <div className={styles.buttons}>
      {reviewStatus === "draft" && <button className={styles.primary} type="button" disabled={busy} onClick={() => send("pending_review")}>Gửi duyệt</button>}
      {reviewStatus === "pending_review" && <>
        <button className={styles.primary} type="button" disabled={busy || !complete} aria-describedby={!complete ? blockedId : undefined} onClick={() => send("approved")}>Phê duyệt báo cáo</button>
        <button type="button" disabled={busy || !reason.trim()} onClick={() => send("changes_requested")}>Yêu cầu chỉnh sửa</button>
      </>}
      {reviewStatus === "changes_requested" && <button type="button" disabled={busy} onClick={() => send("draft")}>Hoàn tất chỉnh sửa</button>}
      <button type="button" disabled={busy || exportState.status === "exporting"} onClick={onExport}>{exportState.status === "exporting" ? "Đang export…" : exportState.status === "error" ? "Thử export lại" : exportState.status === "expired" ? "Tạo lại link mô phỏng" : "Export PDF mô phỏng"}</button>
    </div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.export} role="status" aria-live="polite">
      {exportState.status === "idle" && <span>Export chỉ mô phỏng trạng thái, không tạo hoặc tải file PDF.</span>}
      {exportState.status === "exporting" && <span>Đang chuẩn bị kết quả export mô phỏng…</span>}
      {exportState.status === "error" && <span>Export mô phỏng thất bại. Bạn có thể thử lại.</span>}
      {exportState.status === "expired" && <span>Link mô phỏng đã hết hạn. Hãy tạo lại để tiếp tục.</span>}
      {exportState.status === "success" && <>
        <strong>Export mô phỏng thành công · {exportState.label ?? (reviewStatus === "approved" ? "Đã phê duyệt" : "Bản nháp")}</strong>
        <code>{exportState.reference ?? "Chưa có tham chiếu mô phỏng"}</code>
        {exportState.expiresAt && <span>Hết hạn: {exportState.expiresAt}. </span>}
        <span>Đây là thông tin giả lập, không phải liên kết tải PDF.</span>
      </>}
    </div>
  </section>;
}
