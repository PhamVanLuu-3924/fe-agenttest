import { Sparkles } from "lucide-react";
import styles from "./conversation.module.css";

type ArtifactSkeletonProps = {
  agentId?: string;
  label?: string;
};

export function ArtifactSkeleton({ agentId, label = "Đang tổng hợp kết quả phân tích…" }: ArtifactSkeletonProps) {
  const isInsight = agentId === "insight";
  const title = isInsight ? "Tổng hợp insight có bằng chứng" : "Chênh lệch so với peer group";

  return (
    <div
      className={styles.artifactSkeleton}
      role="status"
      aria-busy="true"
      aria-label={`Đang tải ${title}`}
    >
      <div className={styles.skeletonHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={14} style={{ color: "var(--token-brand, #2563eb)" }} />
          <div className={styles.skeletonBar} style={{ width: "180px", height: "14px" }} />
        </div>
        <div className={styles.skeletonBar} style={{ width: "64px", height: "18px", borderRadius: "999px" }} />
      </div>

      {/* 4 Cards Skeleton */}
      <div className={styles.skeletonGrid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonBar} style={{ width: "60%", height: "9px" }} />
            <div className={styles.skeletonBar} style={{ width: "85%", height: "18px", marginTop: "4px" }} />
            <div className={styles.skeletonBar} style={{ width: "70%", height: "8px" }} />
          </div>
        ))}
      </div>

      {/* Chart Slot Skeleton */}
      <div className={styles.skeletonChart}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <div className={styles.skeletonBar} style={{ width: "120px", height: "10px" }} />
          <span style={{ fontSize: "10px", color: "var(--token-text-secondary, #7a7d83)" }}>
            {label}
          </span>
        </div>
      </div>

      {/* Warning/Limit note Skeleton */}
      <div className={styles.skeletonBar} style={{ width: "100%", height: "24px", borderRadius: "8px" }} />
    </div>
  );
}
