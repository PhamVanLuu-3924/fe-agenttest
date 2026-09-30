"use client";

import styles from "./report.module.css";

/** UI contract; the repository's domain models can map to these props. */
export type ReportSectionProps = {
  id: string;
  number: number;
  title: string;
  paragraphs: readonly string[];
  claims: readonly {
    id: string;
    text: string;
    evidenceIds: readonly string[];
    reviewed: boolean;
  }[];
  availableEvidenceIds: readonly string[];
  onSelectClaim: (claimId: string) => void;
  anchorPrefix: string;
  summary?: boolean;
  evidenceOnly?: boolean;
};

export function ReportSection({ id, number, title, paragraphs, claims, availableEvidenceIds, onSelectClaim, anchorPrefix, summary = false, evidenceOnly = false }: ReportSectionProps) {
  const numberTone = [styles.tone0, styles.tone1, styles.tone2, styles.tone3][(number - 1) % 4];
  return <section id={`${anchorPrefix}-section-${id}`} className={styles.section} aria-label={title} tabIndex={-1}>
    <span className={`${styles.sectionNumber} ${numberTone}`}>{String(number).padStart(2, "0")}</span>
    <h4>{title}</h4>
    {!evidenceOnly && (paragraphs.some((text) => text.trim()) ? (summary ? paragraphs.slice(0, 1) : paragraphs).map((text, index) => <p key={index}>{text}</p>) : <p className={styles.warning}>Phần này chưa có nội dung.</p>)}
    {!summary && claims.map((claim) => {
      const missing = claim.evidenceIds.length === 0 || claim.evidenceIds.some((evidenceId) => !availableEvidenceIds.includes(evidenceId));
      return <article key={claim.id} id={`${anchorPrefix}-claim-${claim.id}`} className={styles.claim}>
        <strong>{claim.text}</strong>
        <div className={styles.claimFooter}>
          <span className={styles.meta}>{missing ? "Thiếu evidence" : `${claim.evidenceIds.length} bằng chứng`} · {claim.reviewed ? "Đã duyệt claim" : "Claim chờ duyệt"}</span>
          <button className={styles.textButton} type="button" onClick={() => onSelectClaim(claim.id)}>Xem bằng chứng</button>
        </div>
      </article>;
    })}
  </section>;
}
