"use client";

import { useId, useState } from "react";
import { FileText } from "lucide-react";
import { EvidenceDrawer, type EvidenceDrawerProps } from "./evidence-drawer";
import { ReportActions, reviewBadgeClass, reviewLabels, type ReportActionsProps } from "./report-actions";
import { ReportSection, type ReportSectionProps } from "./report-section";
import { checkReportCompleteness, isEvidenceValid, reportSections } from "./report-checks";
import styles from "./report.module.css";

export type ReportDraftProps = {
  projectName: string;
  snapshot: string;
  sampleSize: number;
  partialCount: number;
  version: number;
  sections: readonly Pick<ReportSectionProps, "id" | "title" | "paragraphs" | "claims">[];
  evidence: EvidenceDrawerProps["evidence"];
  chartCount: number;
  initialMode?: "full" | "summary" | "evidence";
  status?: "ready" | "loading" | "empty" | "partial" | "error";
  actions: Omit<ReportActionsProps, "complete" | "incompleteReasons">;
  onReviewClaim: (id: string) => void;
  onOpenEvidenceSource?: (evidenceId: string) => void;
};

export function ReportDraft({ projectName, snapshot, sampleSize, partialCount, version, sections, evidence, chartCount, initialMode = "full", status = "ready", actions, onReviewClaim, onOpenEvidenceSource }: ReportDraftProps) {
  const [mode, setMode] = useState(initialMode);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const anchorPrefix = useId();
  const claims = sections.flatMap((section) => section.claims);
  const selected = claims.find((claim) => claim.id === selectedId);
  const completeness = checkReportCompleteness({ sections, evidence });
  const availableEvidenceIds = evidence.filter(isEvidenceValid).map((item) => item.id);
  const visibleSections = reportSections.map((required) => sections.find((section) => section.id === required.id) ?? { ...required, paragraphs: [], claims: [] });
  return <section className={`${styles.card} ${mode === "summary" ? styles.summary : ""}`} aria-label="Báo cáo hiệu suất bán hàng" aria-busy={status === "loading"}>
    <header className={styles.header}>
      <div className={styles.cardTitle}><FileText size={15} aria-hidden="true" /><h3>Báo cáo quyết định</h3></div>
      <span className={reviewBadgeClass[actions.reviewStatus]}>{reviewLabels[actions.reviewStatus]}</span>
    </header>
    <p className={styles.meta}>{projectName} · {snapshot} · Sales Manager · V{version}</p>
    {status === "loading" ? <p role="status" className={styles.state}>Đang chuẩn bị báo cáo…</p>
      : status === "error" ? <p role="alert" className={styles.error}>Không thể tải báo cáo. Vui lòng thử lại từ kết quả phân tích.</p>
      : status === "empty" || sampleSize === 0 ? <p className={styles.state}>Chưa có dữ liệu để tạo báo cáo.</p>
      : <>
        <div className={styles.toolbar} role="group" aria-label="Chế độ báo cáo">
          <button type="button" aria-pressed={mode === "full"} onClick={() => setMode("full")}>Báo cáo 6 phần</button>
          <button type="button" aria-pressed={mode === "summary"} onClick={() => setMode("summary")}>Tóm tắt 1 trang</button>
          <button type="button" aria-pressed={mode === "evidence"} onClick={() => setMode("evidence")}>Claim & evidence</button>
        </div>
        <div className={styles.tiles}>
          <div className={`${styles.tile} ${styles.tile0}`}>
            <span className={styles.tileLabel}>Chất lượng dữ liệu</span>
            <span className={styles.tileValue}>{sampleSize > 0 ? `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(((sampleSize - partialCount) / sampleSize) * 100)}%` : "—"}</span>
            <span className={styles.tileSub}>{sampleSize.toLocaleString("vi-VN")} căn · {partialCount} PARTIAL</span>
          </div>
          <div className={`${styles.tile} ${styles.tile1}`}>
            <span className={styles.tileLabel}>Biểu đồ</span>
            <span className={styles.tileValue}>{chartCount}</span>
            <span className={styles.tileSub}>Từ selector dữ liệu chung</span>
          </div>
          <div className={`${styles.tile} ${styles.tile2}`}>
            <span className={styles.tileLabel}>Evidence</span>
            <span className={styles.tileValue}>{evidence.length}</span>
            <span className={styles.tileSub}>Liên kết theo claim</span>
          </div>
          <div className={`${styles.tile} ${styles.tile3}`}>
            <span className={styles.tileLabel}>Claim chờ duyệt</span>
            <span className={styles.tileValue}>{claims.filter((claim) => !claim.reviewed).length}</span>
            <span className={styles.tileSub}>Tổng {claims.length} claim</span>
          </div>
        </div>
        {(status === "partial" || partialCount > 0) && <p className={styles.warning}>PARTIAL · {partialCount} bản ghi cần kiểm tra chất lượng. Báo cáo mô tả tín hiệu quan sát, không khẳng định nguyên nhân.</p>}
        <div className={styles.completeness} aria-label="Kiểm tra độ đầy đủ">
          {completeness.complete ? <p className={styles.calloutOk}>Đủ 6 phần, evidence hợp lệ và mọi claim đã được duyệt.</p>
            : <details open={mode === "evidence"}><summary>{completeness.issues.length} mục cần hoàn thiện</summary><ul className={styles.checklist}>{completeness.issues.map((issue, index) => <li key={index}><a href={`#${anchorPrefix}-${issue.target}-${issue.id}`} onClick={() => setMode("full")}>{issue.message}</a></li>)}</ul></details>}
        </div>
        {mode === "evidence" && claims.length === 0 && <p className={styles.state}>Báo cáo chưa có claim để kiểm tra.</p>}
        <div className={styles.sectionGrid}>
          {visibleSections.map((section, index) => mode === "evidence" && !section.claims.length ? null : <ReportSection key={section.id} {...section} number={index + 1} availableEvidenceIds={availableEvidenceIds} anchorPrefix={anchorPrefix} onSelectClaim={setSelectedId} summary={mode === "summary"} evidenceOnly={mode === "evidence"} />)}
        </div>
        <ReportActions {...actions} complete={completeness.complete} incompleteReasons={completeness.issues.map((issue) => issue.message)} />
        <p className={styles.source}>Nguồn: {projectName} · {snapshot} · {sampleSize.toLocaleString("vi-VN")} căn</p>
        <EvidenceDrawer open={Boolean(selected)} claimText={selected?.text ?? ""} evidenceIds={selected?.evidenceIds ?? []} evidence={evidence} reviewed={selected?.reviewed} onClose={() => setSelectedId(null)} onOpenSource={onOpenEvidenceSource} onReviewClaim={selected && actions.reviewStatus === "pending_review" ? () => onReviewClaim(selected.id) : undefined} />
      </>}
  </section>;
}
