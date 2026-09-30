import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Lightbulb,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { MetricCard } from "@/components/shared/metric-card";
import styles from "./analysis.module.css";
import { selectInsightData } from "./selectors";
import type { InsightConfidence, InsightResultProps } from "./types";

export function InsightResult({
  data: propData,
  projectId = "green-avenue",
  status = "normal",
  errorMessage,
  chartSlot,
  children,
  onOpenEvidence,
  onViewLimits,
  onRetry,
}: InsightResultProps) {
  const [limitsExpanded, setLimitsExpanded] = useState(false);

  // Lấy dữ liệu qua selector dùng chung nếu không truyền data trực tiếp qua props
  const data = useMemo(() => {
    if (propData) return propData;
    return selectInsightData(projectId, {
      mockWarningScenario: status === "warning" || status === "partial",
    });
  }, [propData, projectId, status]);

  const isWarning = status === "warning" || status === "partial";

  // 1. Trạng thái Loading
  if (status === "loading") {
    return (
      <div
        className={styles.analysisRoot}
        role="status"
        aria-busy="true"
        aria-label="Đang tổng hợp insight có bằng chứng…"
      >
        <div className={styles.cardHeader}>
          <div className={styles.titleGroup}>
            <Lightbulb size={16} style={{ color: "var(--token-brand, #2563eb)" }} />
            <h3 className={styles.cardTitle}>Đang tổng hợp insight…</h3>
          </div>
        </div>
        <div className={styles.metricsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: "68px",
                background: "var(--token-bg-subtle, #f1f5f9)",
                borderRadius: "8px",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // 2. Trạng thái Failed (Thất bại)
  if (status === "failed") {
    return (
      <div className={styles.analysisRoot} role="alert">
        <div className={styles.failedContainer}>
          <div className={styles.failedDetails}>
            <span className={styles.failedTitle}>
              <AlertCircle size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
              Không thể tổng hợp insight
            </span>
            <p className={styles.failedDesc}>
              {errorMessage || "Lỗi mô hình hoặc dữ liệu bất thường (mã lỗi INSIGHT_GEN_FAILED)."}
            </p>
          </div>
          {onRetry && (
            <button
              type="button"
              className={styles.limitsButton}
              style={{ color: "var(--token-danger, #dc2626)", borderColor: "var(--token-danger, #dc2626)" }}
              onClick={onRetry}
              aria-label="Thử lại việc tổng hợp insight"
            >
              <RotateCcw size={11} style={{ marginRight: "4px", display: "inline" }} /> Thử lại
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Trạng thái Empty (Rỗng)
  if (status === "empty" || !data.insights.length) {
    return (
      <div className={styles.analysisRoot} role="status">
        <div style={{ textAlign: "center", padding: "24px 16px" }}>
          <Lightbulb size={24} style={{ color: "var(--token-text-secondary, #475569)", margin: "0 auto 8px" }} />
          <h4 style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--token-text-primary, #23262d)" }}>
            Chưa có insight nào được tổng hợp
          </h4>
          <p style={{ margin: 0, fontSize: "10px", color: "var(--token-text-secondary, #475569)" }}>
            Dữ liệu chưa đủ điều kiện phát hiện pattern bất thường. Hãy mở rộng phạm vi thời gian hoặc tiêu chí lọc.
          </p>
        </div>
      </div>
    );
  }

  const renderConfidenceBadge = (confidence: InsightConfidence, label: string) => {
    switch (confidence) {
      case "high":
        return (
          <span className={`${styles.confidenceBadge} ${styles.confidenceHigh}`} aria-label={label}>
            <CheckCircle2 size={11} aria-hidden="true" />
            <span>{label}</span>
          </span>
        );
      case "medium":
        return (
          <span className={`${styles.confidenceBadge} ${styles.confidenceMedium}`} aria-label={label}>
            <AlertTriangle size={11} aria-hidden="true" />
            <span>{label}</span>
          </span>
        );
      case "low":
        return (
          <span className={`${styles.confidenceBadge} ${styles.confidenceLow}`} aria-label={label}>
            <ShieldAlert size={11} aria-hidden="true" />
            <span>{label}</span>
          </span>
        );
    }
  };

  return (
    <section
      className={styles.analysisRoot}
      aria-label={`Tổng hợp insight: ${data.projectName}`}
    >
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <Lightbulb size={16} style={{ color: "var(--token-brand, #2563eb)" }} aria-hidden="true" />
          <h3 className={styles.cardTitle}>Tổng hợp insight</h3>
        </div>
        <span
          className={styles.peerBadge}
          style={
            isWarning
              ? {
                  color: "var(--token-warning, #d97706)",
                  borderColor: "var(--token-warning, #d97706)",
                  background: "rgba(217, 119, 6, 0.08)",
                }
              : undefined
          }
        >
          {data.badge}
        </span>
      </div>

      {/* Cảnh báo đặc biệt khi trạng thái warning hoặc partial */}
      {isWarning && data.warningNotice && (
        <div className={styles.insufficientBanner} role="alert">
          <div className={styles.insufficientHeader}>
            <AlertTriangle size={15} aria-hidden="true" />
            <span>Insight có cảnh báo: dữ liệu partial / độ tin cậy vừa</span>
          </div>
          <p className={styles.insufficientDesc}>{data.warningNotice}</p>
        </div>
      )}

      {/* Đoạn tóm tắt nhận định chính */}
      <div className={styles.summaryHighlight} role="region" aria-label="Tóm tắt nhận định chính">
        <strong>Tóm tắt phát hiện: </strong>
        <span>{data.summary}</span>
      </div>

      {/* 4 Thẻ số: Khối Insight có bằng chứng */}
      <div className={styles.metricsGrid}>
        <MetricCard
          label="TRÊN NGƯỠNG GIÁ"
          value={`${data.abovePriceThresholdPercent}%`}
          detail="Giá/m² cao hơn peer 6,8%"
          tone="warning"
        />

        <MetricCard
          label="VIEW NỘI KHU"
          value={`${data.internalViewPercent}%`}
          detail="Trong nhóm chậm"
          tone="warning"
        />

        <MetricCard
          label="THIẾU METADATA VIEW"
          value={`${data.missingMetadataPercent}%`}
          detail="Giới hạn mẫu phân tích"
          tone={data.missingMetadataPercent > 5 ? "warning" : undefined}
        />

        <MetricCard
          label="KẾT LUẬN CÓ CĂN CỨ"
          value={`${data.groundedConclusionCount} insight`}
          detail={`${data.unresolvedCount} điểm chưa kết luận`}
          tone="good"
        />
      </div>

      {/* Slot Biểu đồ (Dành cho Sơn ghép Biểu đồ tín hiệu DOM > 90 và Donut) */}
      <div className={styles.chartSlotContainer}>
        {chartSlot || children ? (
          chartSlot || children
        ) : (
          <>
            <div className={styles.chartPlaceholder}>
              <span>
                <BarChart2 size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "5px" }} />
                Tín hiệu trong nhóm DOM &gt;90 ngày (Slot dành cho Sơn)
              </span>
              <span style={{ fontSize: "9px", color: "var(--token-text-secondary, #475569)" }}>
                Tỷ lệ theo từng nhóm: 71% / 54% / 8% · Donut trên ngưỡng giá
              </span>
            </div>
            <div className={styles.chartVisualProxy}>
              <span>
                Trên ngưỡng giá: {data.abovePriceThresholdPercent}% | View nội khu: {data.internalViewPercent}% | Thiếu metadata: {data.missingMetadataPercent}%
              </span>
            </div>
          </>
        )}
      </div>

      {/* Danh sách Insight có mức độ Confidence bằng nhãn chữ và Evidence bấm được */}
      <div className={styles.tableSection}>
        <div className={styles.sectionHeading}>
          <span>Nhận định chi tiết có căn cứ ({data.insights.length} insight)</span>
        </div>

        <div className={styles.insightList} role="list">
          {data.insights.map((item) => (
            <article
              key={item.id}
              className={styles.insightCard}
              role="listitem"
              aria-label={`${item.title} — ${item.confidenceLabel}`}
            >
              <div className={styles.insightHeadRow}>
                <div className={styles.insightTitleGroup}>
                  <span className={styles.insightOrder} aria-hidden="true">
                    {item.order}
                  </span>
                  <h4 className={styles.insightTitle}>{item.title}</h4>
                </div>

                {/* Nhãn chữ mức độ tin cậy (Confidence Text Badge) */}
                {renderConfidenceBadge(item.confidence, item.confidenceLabel)}
              </div>

              <p className={styles.insightDescription}>{item.description}</p>

              <div className={styles.insightFootRow}>
                {/* Evidence reference: Bấm được, callback qua props, không tự điều hướng */}
                <button
                  type="button"
                  className={styles.evidenceButton}
                  onClick={() => onOpenEvidence?.(item.evidenceCode)}
                  aria-label={`Xem chi tiết bằng chứng ${item.evidenceCode}: ${item.evidenceName}`}
                >
                  <FileText size={11} aria-hidden="true" />
                  <span>Bằng chứng: <strong>{item.evidenceCode}</strong> ({item.evidenceName})</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* PHẦN GIỚI HẠN KẾT LUẬN — LUÔN HIỂN THỊ THEO YÊU CẦU */}
      <div className={styles.limitationAlwaysVisible} role="region" aria-label="Giới hạn kết luận của phân tích">
        <ShieldCheck
          size={16}
          style={{ flexShrink: 0, marginTop: "2px", color: "var(--token-warning, #d97706)" }}
          aria-hidden="true"
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
          <div className={styles.limitationHeader}>{data.limitationTitle}</div>
          <div>{data.limitationText}</div>

          <button
            type="button"
            className={styles.limitsButton}
            onClick={() => {
              setLimitsExpanded(!limitsExpanded);
              onViewLimits?.();
            }}
            aria-expanded={limitsExpanded}
            aria-label="Xem chi tiết phạm vi và giới hạn kết luận của insight"
          >
            {limitsExpanded ? (
              <>
                Thu gọn giới hạn <ChevronUp size={11} style={{ display: "inline" }} />
              </>
            ) : (
              <>
                Xem giới hạn <ChevronDown size={11} style={{ display: "inline" }} />
              </>
            )}
          </button>

          {/* Chi tiết giới hạn khi mở rộng */}
          {limitsExpanded && data.detailedLimitations && (
            <div
              style={{
                marginTop: "8px",
                padding: "8px 10px",
                borderRadius: "6px",
                background: "#ffffff",
                border: "1px solid rgba(217, 119, 6, 0.2)",
                fontSize: "9px",
                color: "var(--token-text-secondary, #475569)",
                lineHeight: "1.5",
              }}
            >
              {data.detailedLimitations}
            </div>
          )}
        </div>
      </div>

      {/* Dòng nguồn dữ liệu */}
      <div className={styles.sourceFooter}>
        <FileText size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} aria-hidden="true" />
        <span>{data.sourceText}</span>
      </div>
    </section>
  );
}
