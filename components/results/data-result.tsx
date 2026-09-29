"use client";

import { AlertTriangle, ArrowDown, ArrowDownUp, ArrowUp, Check, ChevronDown, Database, Download, Search } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import type { AreaMetric, ProjectSummary, PropertyUnit } from "@/types/project";
import styles from "./data-result.module.css";

export type DataResultStatus = "ready" | "loading" | "empty" | "partial" | "error";
export type DataResultMetadata = {
  runId?: string;
  runStatus?: "queued" | "running" | "completed" | "partial" | "failed";
  snapshotId?: string;
  dataGateStatus?: string;
  artifactRefs?: readonly string[];
  evidenceRefs?: readonly string[];
  limitations?: readonly string[];
};
type SortKey = "code" | "area" | "type" | "size" | "pricePerSqm" | "daysOnMarket" | "status";
type SortState = { key: SortKey; direction: "asc" | "desc" };

export type DataResultProps = {
  project: ProjectSummary;
  rows: readonly PropertyUnit[];
  metrics: readonly AreaMetric[];
  status?: DataResultStatus;
  metadata?: DataResultMetadata;
  sourceLabel?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onDownload?: () => void;
};

const statusLabels: Record<DataResultStatus, string> = {
  ready: "Đang chạy",
  loading: "Đang tải dữ liệu",
  empty: "Chưa có dữ liệu",
  partial: "Dữ liệu PARTIAL",
  error: "Lỗi mock repository",
};

const numericFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

export function DataResult({ project, rows, metrics, status = "ready", metadata, sourceLabel = "mock repository", errorMessage = "Không thể tải snapshot mô phỏng. Thử tải lại dữ liệu.", onRetry, onDownload }: DataResultProps) {
  const partialCount = rows.filter((row) => row.dataQuality === "PARTIAL").length;
  const duplicates = rows.length - new Set(rows.map((row) => row.code)).size;
  const slowCount = rows.filter((row) => row.status === "Đang bán" && row.daysOnMarket > 90).length;
  const quality = rows.length ? Math.round((rows.length - partialCount) / rows.length * 1000) / 10 : 0;
  const resultStatus = status !== "ready" ? status
    : metadata?.runStatus === "queued" || metadata?.runStatus === "running" ? "loading"
      : metadata?.runStatus === "failed" ? "error"
        : rows.length === 0 ? "empty"
          : partialCount > 0 || metadata?.runStatus === "partial" ? "partial" : "ready";
  const dataGateStatus = metadata?.dataGateStatus ?? (partialCount ? "passed_with_warnings" : "passed");

  return (
    <section className={styles.result} aria-labelledby="data-result-title">
      <header className={styles.header}>
        <div><span className={styles.eyebrow}>KẾT QUẢ PHÂN TÍCH · DỮ LIỆU</span><h2 id="data-result-title">Kiểm tra dữ liệu</h2></div>
        <span className={`${styles.state} ${styles[`state_${resultStatus}`]}`} role="status"><i />{statusLabels[resultStatus]}</span>
        <button className={styles.download} type="button" onClick={onDownload} disabled={!onDownload} aria-label="Tải kết quả dữ liệu"><Download /></button>
      </header>

      <div className={styles.contextBar}>
        <label className={styles.projectPill}><Database aria-hidden="true" /><span>{project.name}</span><ChevronDown aria-hidden="true" /></label>
        <span className={styles.snapshot}>{metadata?.snapshotId ?? project.snapshot}</span>
        <span className={styles.snapshotTime}>Snapshot 24/09</span>
        <button className={styles.compareButton} type="button" aria-label="Chọn snapshot để so sánh">So sánh với Q1/2026<ChevronDown aria-hidden="true" /></button>
      </div>

      {resultStatus === "loading" && <div className={styles.statePanel} role="status"><span className={styles.spinner} />Đang tải snapshot và kiểm tra chất lượng dữ liệu…</div>}
      {resultStatus === "error" && <div className={`${styles.statePanel} ${styles.statePanel_error}`} role="alert"><AlertTriangle /><span><strong>Không tải được dữ liệu</strong>{errorMessage}</span>{onRetry && <button type="button" onClick={onRetry}>Thử lại</button>}</div>}
      {resultStatus === "empty" && <div className={styles.statePanel}><Database /><span><strong>Project chưa có dữ liệu</strong>Chọn project khác hoặc tải snapshot mô phỏng để xem kết quả.</span></div>}

      {resultStatus !== "loading" && resultStatus !== "error" && resultStatus !== "empty" && <>
        <section className={styles.agentSummary} aria-label="Tóm tắt của Data Agent">
          <span className={styles.agentAvatar}>BN</span>
          <div><strong>Dữ liệu Agent</strong><small>Đã đối soát snapshot · 09:33</small></div>
          <span className={styles.summaryStatus}><Check aria-hidden="true" />{partialCount ? "Đã rà soát có cảnh báo" : "Đã rà soát snapshot"}</span>
          <p>Đủ dùng có điều kiện. {numericFormat.format(quality)}% bản ghi hợp lệ; {partialCount} bản ghi PARTIAL, {duplicates} mã trùng và {slowCount} căn có DOM trên 90 ngày.</p>
        </section>

        <section className={styles.quality} aria-labelledby="quality-title">
          <div className={styles.sectionHeading}><h3 id="quality-title"><i />Chất lượng dữ liệu</h3><span>{partialCount ? "Cần review" : "Có điều kiện"}</span></div>
          <div className={styles.metrics}>
            <MetricCard label="BẢN GHI HỢP LỆ" value={`${numericFormat.format(quality)}%`} detail="Đủ điều kiện phân tích" tone="blue" />
            <MetricCard label="THIẾU DỮ LIỆU" value={String(partialCount)} detail="Cần lưu ý khi so sánh" tone="teal" />
            <MetricCard label="CĂN DOM > 90 NGÀY" value={String(slowCount)} detail="Cần review hiệu suất" tone="violet" />
            <MetricCard label="ĐỘ MỚI DỮ LIỆU" value="2 ngày" detail="Snapshot gần nhất" tone="green" />
          </div>
        </section>

        <div className={styles.charts}>
          <QualityChart rows={rows} partialCount={partialCount} duplicateCount={duplicates} slowCount={slowCount} />
          <QualityBreakdown rows={rows} partialCount={partialCount} quality={quality} />
        </div>

        {(metadata?.limitations?.length || partialCount > 0) ? <aside className={styles.notice}><AlertTriangle aria-hidden="true" /><span><strong>Giới hạn của snapshot</strong>{metadata?.limitations?.length ? metadata.limitations.join(" · ") : "Một số trường dữ liệu chưa đầy đủ. Giữ cờ PARTIAL khi lọc, xuất và so sánh dữ liệu."}</span></aside> : null}

        <DataTable rows={rows} areas={project.areas} />
        <footer className={styles.source}>Nguồn: {sourceLabel} · {metadata?.snapshotId ?? project.snapshot} · {rows.length.toLocaleString("vi-VN")} căn · Data Gate: {dataGateStatus}{metadata?.runId && <> · Run {metadata?.runId}</>}{Boolean(metadata?.artifactRefs?.length) && <> · {metadata?.artifactRefs?.length} artifact</>}{Boolean(metadata?.evidenceRefs?.length) && <> · {metadata?.evidenceRefs?.length} evidence</>}</footer>
      </>}
    </section>
  );
}

function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "blue" | "teal" | "violet" | "green" }) {
  return <article className={`${styles.metric} ${styles[`metric_${tone}`]}`}><small><i />{label}</small><strong>{value}</strong><span>{detail}</span></article>;
}

function QualityChart({ rows, partialCount, duplicateCount, slowCount }: { rows: readonly PropertyUnit[]; partialCount: number; duplicateCount: number; slowCount: number }) {
  const columns = [
    { label: "PARTIAL", value: partialCount, tone: "blue" },
    { label: "Mã trùng", value: duplicateCount, tone: "teal" },
    { label: "Anomaly", value: slowCount, tone: "amber" },
  ] as const;
  const maximum = Math.max(1, ...columns.map((item) => item.value));
  return <section className={styles.chartCard} aria-label="Cảnh báo theo loại">
    <h3>Cảnh báo theo loại</h3><p>{rows.length.toLocaleString("vi-VN")} bản ghi trong snapshot · số lượng bản ghi</p>
    <div className={styles.barChart}>{columns.map((item) => <div className={styles.barColumn} key={item.label}><strong>{item.value}</strong><i className={styles[`bar_${item.tone}`]} style={{ height: `${Math.max(3, item.value / maximum * 100)}%` }} /><span>{item.label}</span></div>)}</div>
  </section>;
}

function QualityBreakdown({ rows, partialCount, quality }: { rows: readonly PropertyUnit[]; partialCount: number; quality: number }) {
  const rowCount = rows.length;
  const slowOnlyCount = rows.filter((row) => row.dataQuality !== "PARTIAL" && row.status === "Đang bán" && row.daysOnMarket > 90).length;
  const partialShare = rowCount ? partialCount / rowCount * 100 : 0;
  const slowShare = rowCount ? slowOnlyCount / rowCount * 100 : 0;
  return <section className={styles.chartCard} aria-label="Phân loại chất lượng dữ liệu">
    <h3>Phân loại cảnh báo</h3><p>Trên {rowCount.toLocaleString("vi-VN")} bản ghi snapshot</p>
    <div className={styles.donutRow}>
      <div className={styles.donut} style={{ "--partial": `${partialShare}%`, "--slow": `${slowShare}%` } as CSSProperties}><strong>{partialCount + slowOnlyCount}<small>cần xem</small></strong></div>
      <ul><li><i className={styles.legend_blue} />PARTIAL <b>{Math.round(partialShare)}%</b></li><li><i className={styles.legend_teal} />DOM &gt; 90 ngày <b>{Math.round(slowShare)}%</b></li><li><i className={styles.legend_green} />Đủ điều kiện <b>{numericFormat.format(quality)}%</b></li></ul>
    </div>
  </section>;
}

type DataFiltersProps = {
  areas: readonly string[];
  area: string;
  quality: string;
  status: string;
  onAreaChange: (value: string) => void;
  onQualityChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClear: () => void;
};

function DataFilters({ areas, area, quality, status, onAreaChange, onQualityChange, onStatusChange, onClear }: DataFiltersProps) {
  return <div className={styles.filters}>
    <label>Phân khu<select value={area} onChange={(event) => onAreaChange(event.target.value)}><option value="all">Tất cả</option>{areas.map((name) => <option value={name} key={name}>{name}</option>)}</select></label>
    <label>Chất lượng<select value={quality} onChange={(event) => onQualityChange(event.target.value)}><option value="all">Tất cả</option><option value="COMPLETE">Đủ dữ liệu</option><option value="PARTIAL">PARTIAL</option></select></label>
    <label>Trạng thái<select value={status} onChange={(event) => onStatusChange(event.target.value)}><option value="all">Tất cả</option><option value="Đang bán">Đang bán</option><option value="Giữ chỗ">Giữ chỗ</option><option value="Đã bán">Đã bán</option></select></label>
    <button type="button" onClick={onClear}>Xóa bộ lọc</button>
  </div>;
}

function SortableColumnButton({ label, sortKey, sort, onSort }: { label: string; sortKey: SortKey; sort: SortState; onSort: (key: SortKey) => void }) {
  const icon = sort.key !== sortKey ? <ArrowDownUp aria-hidden="true" /> : sort.direction === "asc" ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />;
  return <button type="button" onClick={() => onSort(sortKey)}>{label}{icon}</button>;
}

function DataTable({ rows, areas }: { rows: readonly PropertyUnit[]; areas: readonly string[] }) {
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("all");
  const [quality, setQuality] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<SortState>({ key: "daysOnMarket", direction: "desc" });

  const visibleRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi-VN");
    const matching = rows.filter((row) => {
      const matchesText = !term || `${row.code} ${row.area} ${row.tower} ${row.type}`.toLocaleLowerCase("vi-VN").includes(term);
      const matchesArea = area === "all" || row.area === area;
      const matchesQuality = quality === "all" || row.dataQuality === quality;
      const matchesStatus = status === "all" || row.status === status;
      return matchesText && matchesArea && matchesQuality && matchesStatus;
    });
    return [...matching].sort((left, right) => {
      const a = left[sort.key];
      const b = right[sort.key];
      const comparison = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), "vi");
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [area, quality, rows, search, sort, status]);

  function toggleSort(key: SortKey) {
    setSort((current) => current.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" });
  }
  const columns: { key: SortKey; label: string }[] = [
    { key: "code", label: "Mã căn" }, { key: "area", label: "Phân khu" }, { key: "type", label: "Loại căn" },
    { key: "size", label: "Diện tích" }, { key: "pricePerSqm", label: "Giá/m²" }, { key: "daysOnMarket", label: "DOM" }, { key: "status", label: "Chất lượng" },
  ];

  return <section className={styles.tableSection} aria-labelledby="data-table-title">
    <div className={styles.tableHeading}><div><h3 id="data-table-title">Bản ghi trong snapshot</h3><p>{visibleRows.length.toLocaleString("vi-VN")} / {rows.length.toLocaleString("vi-VN")} căn · có thể lọc và sắp xếp</p></div><label className={styles.search}><Search aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã căn, phân khu…" aria-label="Tìm bản ghi" /></label></div>
    <DataFilters areas={areas} area={area} quality={quality} status={status} onAreaChange={setArea} onQualityChange={setQuality} onStatusChange={setStatus} onClear={() => { setSearch(""); setArea("all"); setQuality("all"); setStatus("all"); }} />
    {visibleRows.length === 0 ? <div className={styles.tableEmpty}>Không có bản ghi phù hợp với bộ lọc.</div> : <div className={styles.tableWrap}><table>
      <thead><tr>{columns.map(({ key, label }) => <th key={key} aria-sort={sort.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}><SortableColumnButton label={label} sortKey={key} sort={sort} onSort={toggleSort} /></th>)}</tr></thead>
      <tbody>{visibleRows.slice(0, 100).map((row) => <tr key={`${row.projectId}-${row.code}`}><td data-label="Ma can"><strong>{row.code}</strong></td><td data-label="Phan khu">{row.area}</td><td data-label="Loai can">{row.type}</td><td data-label="Dien tich">{row.size} m²</td><td data-label="Gia/m2">{numericFormat.format(row.pricePerSqm)} tr</td><td data-label="DOM">{row.daysOnMarket} ngày</td><td data-label="Chat luong"><span className={row.dataQuality === "PARTIAL" ? styles.partialBadge : styles.completeBadge}>{row.dataQuality === "PARTIAL" ? "PARTIAL" : "Đủ dữ liệu"}</span></td></tr>)}</tbody>
    </table>{visibleRows.length > 100 && <p className={styles.tableLimit}>Hiển thị 100 dòng đầu tiên. Hãy lọc thêm để thu hẹp kết quả.</p>}</div>}
  </section>;
}
