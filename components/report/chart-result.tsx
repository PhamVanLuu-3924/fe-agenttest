"use client";

import { useId, useState } from "react";
import { BarChart3, TriangleAlert } from "lucide-react";
import styles from "./report.module.css";

export type ChartMode = "dom" | "absorption" | "price-dom";

/** Presentation props: values and sample counts are supplied by the shared selector. */
export type ChartSeries = {
  mode: ChartMode;
  rows: readonly { label: string; value: number | null; sampleSize: number; dom?: number | null; evidenceId?: string }[];
  description: string;
};

export type ChartResultProps = {
  projectName: string;
  snapshot: string;
  series: readonly ChartSeries[];
  initialMode?: ChartMode;
  status?: "ready" | "loading" | "empty" | "partial" | "error";
  onOpenEvidence?: (evidenceId: string) => void;
};

const modes: { id: ChartMode; label: string; title: string; unit: string; group: string }[] = [
  { id: "dom", label: "DOM", title: "DOM theo phân khu", unit: "ngày", group: "phân khu" },
  { id: "absorption", label: "Hấp thụ", title: "Hấp thụ theo loại căn", unit: "%", group: "loại căn" },
  { id: "price-dom", label: "Giá/m² + DOM", title: "Giá/m² và DOM nhóm 2PN", unit: "triệu đồng/m²", group: "phân khu" },
];
const number = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

export function ChartResult({ projectName, snapshot, series, initialMode = "dom", status = "ready", onOpenEvidence }: ChartResultProps) {
  const [mode, setMode] = useState(initialMode);
  const descriptionId = useId();
  const config = modes.find((item) => item.id === mode)!;
  const chart = series.find((item) => item.mode === mode);
  const rows = chart?.rows ?? [];
  const valid = rows.filter((row) => row.sampleSize > 0 && row.value !== null && Number.isFinite(row.value));
  const max = mode === "absorption" ? 100 : Math.ceil(Math.max(mode === "dom" ? 100 : 1, ...valid.map((row) => row.value!)) / 20) * 20;
  const count = rows.reduce((sum, row) => sum + row.sampleSize, 0);
  return <section className={styles.card} aria-label="Biểu đồ bằng chứng" aria-busy={status === "loading"}>
    <header className={styles.header}>
      <div className={styles.cardTitle}><BarChart3 size={15} aria-hidden="true" /><h3>{config.title}</h3></div>
      <span className={styles.chip}>{rows.length} {config.group}</span>
    </header>
    <div className={styles.toolbar} role="group" aria-label="Loại biểu đồ">
      {modes.map((item) => <button type="button" key={item.id} aria-pressed={item.id === mode} onClick={() => setMode(item.id)}>{item.label}</button>)}
    </div>
    {status === "loading" ? <p className={styles.state} role="status">Đang tải biểu đồ…</p>
      : status === "error" ? <p className={styles.error} role="alert">Không thể tải biểu đồ. Vui lòng thử lại từ kết quả phân tích.</p>
      : status === "empty" || valid.length === 0 ? <p className={styles.state}>Không có dữ liệu cho biểu đồ này.</p>
      : <>
        {status === "partial" && <p className={styles.warning}>Dữ liệu PARTIAL — diễn giải trong phạm vi mẫu hiện có.</p>}
        <p className={styles.meta}>N = {number.format(count)} căn · Đơn vị: {config.unit}{mode === "price-dom" ? "; DOM: ngày" : ""}</p>
        <div className={styles.tiles}>
          {rows.map((row, index) => {
            const available = row.sampleSize > 0 && row.value !== null && Number.isFinite(row.value);
            return <div key={row.label} className={`${styles.tile} ${styles[`tile${index % 4}`]}`}>
              <span className={styles.tileLabel}>{row.label}</span>
              <span className={styles.tileValue}>{available ? `${number.format(row.value!)} ${config.unit}` : "—"}</span>
              <span className={styles.tileSub}>{available ? `${row.sampleSize} căn` : "Không có dữ liệu"}{mode === "price-dom" && available && row.dom != null && Number.isFinite(row.dom) ? ` · DOM ${number.format(row.dom)} ngày` : ""}</span>
            </div>;
          })}
        </div>
        <figure className={styles.figure} aria-describedby={descriptionId}>
          <div className={styles.scale} aria-hidden="true"><span>0</span><span>{number.format(max / 2)}</span><span>{number.format(max)} {config.unit}</span></div>
          {rows.map((row, index) => {
            const available = row.sampleSize > 0 && row.value !== null && Number.isFinite(row.value);
            const pct = available ? Math.min(100, Math.max(0, row.value! / max * 100)) : 0;
            return <div key={row.label} className={styles.chartCol}>
              <div className={styles.colPlot} aria-hidden="true">
                {mode === "dom" && <span className={styles.threshold} style={{ bottom: `${90 / max * 100}%` }} />}
                {available && <span className={`${styles.bar} ${styles[`bar${index % 4}`]}`} style={{ height: `${pct}%` }} />}
                {available && <span className={styles.colValue} style={{ bottom: `calc(${pct}% + 6px)` }}>{number.format(row.value!)} {config.unit}</span>}
              </div>
              <strong className={styles.colLabel}>{row.label}</strong>
              <span className={styles.colMeta}>{available ? `${row.sampleSize} căn` : "Không có dữ liệu"}</span>
              {row.evidenceId && onOpenEvidence && <button className={styles.textButton} type="button" onClick={() => onOpenEvidence(row.evidenceId!)} aria-label={`Xem bằng chứng ${row.label}`}>Xem nguồn</button>}
            </div>;
          })}
          <figcaption className={styles.legend}><span><i />{config.title}</span>{mode === "dom" && <span><i className={styles.legendThreshold} />Ngưỡng cảnh báo: 90 ngày</span>}</figcaption>
        </figure>
        <p id={descriptionId} className={styles.callout}><TriangleAlert size={16} aria-hidden="true" /><span className={styles.calloutBody}><strong>Cách đọc biểu đồ</strong>{chart?.description}</span></p>
        <p className={styles.source}>Nguồn: {projectName} · {snapshot}</p>
      </>}
  </section>;
}
