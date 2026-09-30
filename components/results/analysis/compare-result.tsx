import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { MetricCard } from "@/components/shared/metric-card";
import styles from "./analysis.module.css";
import { selectCompareData } from "./selectors";
import type { CompareResultProps } from "./types";

export function CompareResult({
  data: propData,
  projectId = "green-avenue",
  status = "normal",
  errorMessage,
  chartSlot,
  children,
  onViewLimits,
  onExpandCriteria,
  onRetry,
  compact = false,
}: CompareResultProps) {
  const [limitsExpanded, setLimitsExpanded] = useState(false);

  // Lấy dữ liệu qua selector dùng chung nếu không truyền data trực tiếp qua props
  const data = useMemo(() => {
    if (propData) return propData;
    return selectCompareData(projectId, {
      mockInsufficientPeers: status === "insufficient_peers",
    });
  }, [propData, projectId, status]);

  // Kiểm tra điều kiện không đủ peer
  const isInsufficient =
    status === "insufficient_peers" || data.peerCount < data.minPeersRequired;

  // 1. Trạng thái Loading
  if (status === "loading") {
    return (
      <div
        className={styles.analysisRoot}
        role="status"
        aria-busy="true"
        aria-label="Đang nạp kết quả so sánh peer group…"
      >
        <div className={styles.cardHeader}>
          <div className={styles.titleGroup}>
            <Users size={16} style={{ color: "var(--token-brand, #2563eb)" }} />
            <h3 className={styles.cardTitle}>Đang tải chênh lệch so với peer…</h3>
          </div>
        </div>
        <div className={styles.metricsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: "68px", background: "var(--token-bg-subtle, #f1f5f9)", borderRadius: "8px" }} />
          ))}
        </div>
      </div>
    );
  }

  // 2. Trạng thái Failed (Lỗi tác vụ tính toán / dữ liệu)
  if (status === "failed") {
    return (
      <div className={styles.analysisRoot} role="alert">
        <div className={styles.failedContainer}>
          <div className={styles.failedDetails}>
            <span className={styles.failedTitle}>
              <AlertCircle size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
              Không thể tính toán đối chuẩn so sánh
            </span>
            <p className={styles.failedDesc}>
              {errorMessage || "Lỗi kiểu dữ liệu hoặc thiếu snapshot đối sánh (mã DQ_CALC_FAILED)."}
            </p>
          </div>
          {onRetry && (
            <button
              type="button"
              className={styles.limitsButton}
              style={{ color: "var(--token-danger, #dc2626)", borderColor: "var(--token-danger, #dc2626)" }}
              onClick={onRetry}
              aria-label="Thử lại phép tính đối chuẩn"
            >
              <RotateCcw size={11} style={{ marginRight: "4px", display: "inline" }} /> Thử lại
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Trạng thái Empty
  if (status === "empty" || (!data.peers.length && !isInsufficient)) {
    return (
      <div className={styles.analysisRoot} role="status">
        <div style={{ textAlign: "center", padding: "20px" }}>
          <HelpCircle size={24} style={{ color: "var(--token-text-secondary, #475569)", margin: "0 auto 8px" }} />
          <h4 style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--token-text-primary, #23262d)" }}>
            Không tìm thấy dự án hoặc phân khu tương đồng
          </h4>
          <p style={{ margin: 0, fontSize: "10px", color: "var(--token-text-secondary, #475569)" }}>
            Thử nới lỏng dung sai diện tích hoặc chọn một dự án gốc khác để đối sánh.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section
      className={styles.analysisRoot}
      aria-label={`Kết quả so sánh peer group: ${data.projectName}`}
    >
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <Users size={16} style={{ color: "var(--token-brand, #2563eb)" }} aria-hidden="true" />
          <h3 className={styles.cardTitle}>Chênh lệch so với peer</h3>
        </div>

        <span
          className={styles.peerBadge}
          style={
            isInsufficient
              ? { color: "var(--token-warning, #d97706)", borderColor: "var(--token-warning, #d97706)", background: "rgba(217, 119, 6, 0.08)" }
              : undefined
          }
        >
          {data.peerCount} peers {isInsufficient ? `(cần ≥ ${data.minPeersRequired})` : ""}
        </span>
      </div>

      {/* Cảnh báo đặc biệt: Không đủ peer (insufficient peers) */}
      {isInsufficient && (
        <div className={styles.insufficientBanner} role="alert">
          <div className={styles.insufficientHeader}>
            <AlertTriangle size={15} aria-hidden="true" />
            <span>Mẫu đối sánh không đủ điều kiện thống kê</span>
          </div>
          <p className={styles.insufficientDesc}>
            Hệ thống yêu cầu tối thiểu <strong>{data.minPeersRequired} peers</strong> cùng phân khúc và diện tích ±10% để tính toán benchmark tin cậy, nhưng hiện tại chỉ tìm thấy <strong>{data.peerCount} peers</strong>.
          </p>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button
              type="button"
              className={styles.limitsButton}
              onClick={onExpandCriteria}
              aria-label="Mở rộng dung sai diện tích để tìm thêm peer"
            >
              Mở rộng dung sai diện tích (±15%) · Cần duyệt
            </button>
          </div>
        </div>
      )}

      {/* 4 Thẻ số: Nếu không đủ peer, KHÔNG vẽ số liệu như thể đủ dữ liệu */}
      <div className={styles.metricsGrid}>
        <MetricCard
          label={`DOM ${data.projectName.toUpperCase()}`}
          value={`${data.domProject} ngày`}
          detail="Trung vị của dự án"
          tone={data.domProject > 90 ? "warning" : undefined}
        />

        <MetricCard
          label="TRUNG VỊ PEER"
          value={isInsufficient ? "Không đủ mẫu" : `${data.domPeerMedian} ngày`}
          detail={isInsufficient ? `Chỉ có ${data.peerCount}/${data.minPeersRequired} peers` : `${data.peerCount} dự án tương đồng`}
        />

        <MetricCard
          label="HẤP THỤ"
          value={`${data.absorptionProject}%`}
          detail={isInsufficient ? "Peer: Chưa đủ mẫu" : `Peer: ${data.absorptionPeerMedian}%`}
          tone={data.absorptionProject < data.absorptionPeerMedian && !isInsufficient ? "warning" : undefined}
        />

        <MetricCard
          label="GIÁ CHÀO VS PEER"
          value={isInsufficient ? "N/A" : `+${data.priceDiffPercent}%`}
          detail={isInsufficient ? "Không tính benchmark" : "So với trung vị peer"}
          tone={data.priceDiffPercent > 5 && !isInsufficient ? "warning" : undefined}
        />
      </div>

      {/* Slot Biểu đồ (Dành cho Sơn ghép DOM & Donut hấp thụ) */}
      <div className={styles.chartSlotContainer}>
        {chartSlot || children ? (
          chartSlot || children
        ) : (
          <>
            <div className={styles.chartPlaceholder}>
              <span>
                <BarChart2 size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "5px" }} />
                Biểu đồ đối sánh DOM & Tỷ lệ hấp thụ (Slot dành cho Sơn)
              </span>
              <span style={{ fontSize: "9px", color: "var(--token-text-secondary, #475569)" }}>
                Trục đo 0–160 ngày · Donut hấp thụ
              </span>
            </div>
            <div className={styles.chartVisualProxy}>
              {isInsufficient ? (
                <span>Biểu đồ bị tạm khóa do mẫu đối sánh không đủ (N = {data.peerCount} &lt; {data.minPeersRequired})</span>
              ) : (
                <span>
                  DOM dự án ({data.domProject} ngày) vs Trung vị peer ({data.domPeerMedian} ngày) | Tỷ lệ hấp thụ ({data.absorptionProject}% vs {data.absorptionPeerMedian}%)
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Danh sách Peer Group & Benchmark */}
      <div className={styles.tableSection}>
        <div className={styles.sectionHeading}>
          <span>Bảng đối chiếu căn tương đồng ({data.criteriaRule})</span>
          {data.originUnit && (
            <span style={{ fontSize: "9px", color: "var(--token-text-secondary, #475569)", fontWeight: "normal" }}>
              Căn gốc: <strong>{data.originUnit.code}</strong> ({data.originUnit.area} · {data.originUnit.size}m² · DOM {data.originUnit.daysOnMarket} ngày)
            </span>
          )}
        </div>

        {/* Bọc bảng chống tràn ngang (overflow-x protected) */}
        <div className={styles.tableWrap}>
          <table className={styles.peerTable} aria-label="Bảng đối chiếu peer group">
            <thead>
              <tr>
                <th scope="col">Xếp hạng</th>
                <th scope="col">Mã căn</th>
                <th scope="col">Phân khu / Dự án</th>
                <th scope="col">Diện tích</th>
                <th scope="col">Giá chào / m²</th>
                <th scope="col">DOM</th>
                <th scope="col">Độ tương đồng</th>
              </tr>
            </thead>
            <tbody>
              {data.peers.map((peer, idx) => (
                <tr key={peer.id}>
                  <td>#{idx + 1}</td>
                  <td>
                    <strong>{peer.code}</strong>
                  </td>
                  <td>{peer.area}</td>
                  <td>{peer.size} m²</td>
                  <td>{peer.pricePerSqm} tr</td>
                  <td>
                    <span style={peer.daysOnMarket > 90 ? { color: "var(--token-danger, #dc2626)", fontWeight: 700 } : undefined}>
                      {peer.daysOnMarket} ngày
                    </span>
                  </td>
                  <td>
                    {isInsufficient ? (
                      <span style={{ color: "var(--token-text-secondary, #475569)", fontSize: "9px" }}>Chưa đủ mẫu</span>
                    ) : (
                      <span className={styles.similarityPill}>{peer.similarityPercent}%</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Kết luận Benchmark: Nếu không đủ peer thì khóa notice */}
        {isInsufficient ? (
          <div className={styles.lockedBenchmarkNotice}>
            Không hiển thị benchmark và khuyến nghị định giá vì số lượng peer chưa đạt ngưỡng tối thiểu ({data.peerCount}/{data.minPeersRequired}).
          </div>
        ) : (
          <div className={styles.benchmarkCallout}>
            <strong>Kết luận đối chuẩn:</strong>
            <span>{data.benchmarkSummary}</span>
          </div>
        )}
      </div>

      {/* Cảnh báo mức tương đồng theo đặc tả Figma */}
      <div className={styles.warningCallout}>
        <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true" />
        <div className={styles.warningContent}>
          <span className={styles.warningTitle}>Cảnh báo mức tương đồng</span>
          <span>{data.similarityWarning}</span>
          <button
            type="button"
            className={styles.limitsButton}
            onClick={() => {
              setLimitsExpanded(!limitsExpanded);
              onViewLimits?.();
            }}
            aria-expanded={limitsExpanded}
            aria-label="Xem chi tiết giới hạn phân tích so sánh"
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

          {/* Chi tiết giới hạn mở rộng */}
          {limitsExpanded && (
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
              Mẫu dữ liệu POC chỉ lấy theo cấp độ quận và dung sai diện tích ±10%. Yếu tố hướng ban công, tầm view và hệ số tầng chưa được đưa vào mô hình chuẩn hóa. Khuyến nghị chỉ dùng số liệu cho mục đích định hướng sơ bộ.
            </div>
          )}
        </div>
      </div>

      {/* Trạng thái Partial Response: Hiển thị thêm các chip phạm vi và cam kết an toàn */}
      {status === "partial" && data.partialInfo && (
        <div className={styles.partialContainer}>
          <div className={styles.safetyCommitment}>
            <ShieldCheck size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px", color: "var(--token-brand, #2563eb)" }} />
            <strong>Cam kết an toàn:</strong> {data.partialInfo.safetyCommitment}
          </div>

          <div className={styles.partialScopeChips}>
            {data.partialInfo.availableScopes.map((scope) => (
              <span key={scope} className={styles.chipAvailable}>
                <CheckCircle2 size={10} style={{ display: "inline", marginRight: "3px" }} />
                {scope}
              </span>
            ))}
            {data.partialInfo.missingScopes.map((scope) => (
              <span key={scope} className={styles.chipMissing}>
                <AlertCircle size={10} style={{ display: "inline", marginRight: "3px" }} />
                {scope}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nguồn dữ liệu */}
      <div className={styles.sourceFooter}>
        <FileText size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} aria-hidden="true" />
        <span>{data.sourceText}</span>
      </div>
    </section>
  );
}
