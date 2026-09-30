"use client";

import { useEffect, useId, useRef } from "react";
import { isEvidenceValid } from "./report-checks";
import styles from "./report.module.css";

export type EvidenceDrawerProps = {
  open: boolean;
  claimText: string;
  evidenceIds: readonly string[];
  evidence: readonly {
    id: string;
    title: string;
    source: string;
    snapshot: string;
    description: string;
    limitation: string;
    calculation?: string;
    sampleScope?: string;
    traceSteps?: readonly string[];
  }[];
  onClose: () => void;
  onOpenSource?: (evidenceId: string) => void;
  onReviewClaim?: () => void;
  reviewed?: boolean;
};

export function EvidenceDrawer({ open, claimText, evidenceIds, evidence, onClose, onOpenSource, onReviewClaim, reviewed = false }: EvidenceDrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const closeButton = useRef<HTMLButtonElement>(null);
  const missing = evidenceIds.length === 0 || evidenceIds.some((id) => !evidence.some((item) => item.id === id && isEvidenceValid(item)));
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    closeButton.current?.focus();
    return () => {
      dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  return <dialog ref={ref} className={styles.drawer} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} onKeyDown={(event) => {
    if (event.key !== "Tab") return;
    const buttons = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
    const first = buttons[0];
    const last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}>
    <header><div><span className={styles.eyebrow}>TRUY VẾT BẰNG CHỨNG</span><h3 id={titleId}>Bằng chứng cho nhận định</h3></div><button ref={closeButton} className={styles.button} type="button" onClick={onClose} aria-label="Đóng bằng chứng">Đóng</button></header>
    <p>{claimText}</p>
    {evidenceIds.length === 0 && <p className={styles.warning}>Claim chưa có evidence liên kết.</p>}
    {evidenceIds.map((id) => {
      const item = evidence.find((entry) => entry.id === id);
      return item ? <article key={id}>
        <span className={styles.meta}>{item.id}</span><h4>{item.title}</h4>
        {!isEvidenceValid(item) && <p className={styles.warning}>Evidence chưa đủ nguồn, snapshot hoặc số liệu hỗ trợ để duyệt claim.</p>}
        <dl>
          <dt>Nguồn</dt><dd>{item.source}</dd>
          <dt>Snapshot</dt><dd>{item.snapshot}</dd>
          {item.calculation && <><dt>Phép tính</dt><dd>{item.calculation}</dd></>}
          {item.sampleScope && <><dt>Mẫu &amp; phạm vi</dt><dd>{item.sampleScope}</dd></>}
          <dt>Số liệu hỗ trợ</dt><dd>{item.description}</dd>
          <dt>Giới hạn</dt><dd>{item.limitation}</dd>
        </dl>
        {item.traceSteps?.length ? <div className={styles.trace}>
          <strong>Chuỗi truy vết</strong>
          <ol>{item.traceSteps.map((step, index) => <li key={`${item.id}-${step}`}><span>{String(index + 1).padStart(2, "0")}</span>{step}</li>)}</ol>
        </div> : null}
        {onOpenSource && <div className={styles.buttons}><button className={styles.primary} type="button" onClick={() => onOpenSource(item.id)}>Mở dữ liệu nguồn</button></div>}
      </article> : <p key={id} className={styles.warning}>Không tìm thấy evidence {id}. Chưa đủ bằng chứng để duyệt claim.</p>;
    })}
    {onReviewClaim && <div className={styles.buttons}><button type="button" disabled={missing || reviewed} onClick={onReviewClaim}>{reviewed ? "Claim đã được duyệt" : "Xác nhận đã duyệt claim"}</button></div>}
  </dialog>;
}
