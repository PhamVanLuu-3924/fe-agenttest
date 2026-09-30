"use client";

import {
  BarChart3, Check, Clock3, Database, FileCheck2, FileText,
  Lightbulb, ShieldCheck, Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ConversationStream } from "@/components/conversation/conversation-stream";
import { HistoryPanel } from "@/components/conversation/history-panel";
import { PromptComposer } from "@/components/conversation/prompt-composer";
import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/layout/workspace-topbar";
import { OrchestratorResult } from "@/components/run/orchestrator-result";
import { RunProgressPanel } from "@/components/run/run-progress-panel";
import { createRun, getGroupMemberState, getGroupTitle, selectCollaborationAgents, setRunPhase } from "@/components/run/run-state";
import { SidebarAgentGroup } from "@/components/run/sidebar-agent-group";
import { AgentMark } from "@/components/shared/agent-mark";
import { MetricCard } from "@/components/shared/metric-card";
import { mockWorkspaceRepository } from "@/mocks/workspace-repository";
import type { AgentGroup, AgentId, AgentRun, Message, RunPhase, ShortTermHistory, UserProfile, WorkPhase } from "@/types/workspace";
import styles from "./chat-workspace.module.css";

const repository = mockWorkspaceRepository;
const agents = repository.getAgents();
const projects = repository.getProjects();
const conversationHistory = repository.getConversationHistory();
const getProjectUnits = repository.getProjectUnits;
const getAreaMetrics = repository.getAreaMetrics;
const getSlowMovingUnits = repository.getSlowMovingUnits;

function createEmptyConversations(): Record<AgentId, Message[]> {
  return { orchestrator: [], data: [], compare: [], insight: [], chart: [], report: [] };
}

function DomChart({ projectId }: { projectId: string }) {
  const metrics = getAreaMetrics(projectId);
  const max = Math.ceil(Math.max(...metrics.map((item) => item.avgDom), 100) / 20) * 20;
  const ticks = [max, Math.round(max * .75), Math.round(max * .5), Math.round(max * .25), 0];
  const colors = ["#f3a63b", "#7d5ce7", "#1caf88"];
  return <div className="real-chart">
    <div className="chart-y-title">DOM trung bình (ngày)</div>
    <div className="chart-stage">
      <div className="chart-axis">{ticks.map((tick) => <span key={tick}>{tick}</span>)}</div>
      <div className="chart-plot">
        {ticks.map((tick) => <i key={tick} style={{ bottom: `${tick / max * 100}%` }} />)}
        <i className="chart-threshold" style={{ bottom: `${90 / max * 100}%` }}><span>90</span></i>
        <div className="chart-columns">{metrics.map((item, index) => <div className="chart-column" key={item.area}>
          <div className="chart-value">{item.avgDom} ngày</div>
          <div className="chart-bar" style={{ height: `${item.avgDom / max * 100}%`, background: colors[index] }}><span>{item.units} căn</span></div>
          <strong>{item.area}</strong><small>Hấp thụ {item.absorption}%</small>
        </div>)}</div>
      </div>
    </div>
    <div className="chart-legend"><span><i className="legend-dom" /> DOM trung bình</span><span><i className="legend-line" /> Ngưỡng cảnh báo: 90 ngày</span></div>
  </div>;
}

function AbsorptionTypeChart({ projectId }: { projectId: string }) {
  const rows = getProjectUnits(projectId);
  const typeRows = (["Studio", "1PN", "2PN", "3PN"] as const).map((type) => {
    const units = rows.filter((row) => row.type === type);
    return { type, units: units.length, absorption: Number((units.reduce((sum, unit) => sum + unit.absorption, 0) / units.length).toFixed(1)) };
  });
  return <div className="horizontal-chart">{typeRows.map((item) => <div key={item.type}><span><strong>{item.type}</strong><small>{item.units} căn</small></span><div><i style={{ width: `${item.absorption}%` }} /></div><b>{item.absorption}%</b></div>)}</div>;
}

function PriceDomChart({ projectId }: { projectId: string }) {
  const rows = getProjectUnits(projectId).filter((row) => row.type === "2PN");
  const metrics = getAreaMetrics(projectId);
  return <div className="price-dom-chart"><div className="price-dom-head"><span>Phân khu</span><span>Giá/m²</span><span>DOM TB</span><span>Tín hiệu</span></div>{metrics.map((metric) => { const units = rows.filter((row) => row.area === metric.area); const dom = Math.round(units.reduce((sum, unit) => sum + unit.daysOnMarket, 0) / units.length); const price = (units.reduce((sum, unit) => sum + unit.pricePerSqm, 0) / units.length).toFixed(1); return <div key={metric.area}><strong>{metric.area}<small>{units.length} căn 2PN</small></strong><span>{price} tr</span><span>{dom} ngày</span><em className={dom > 90 ? "signal-danger" : "signal-good"}>{dom > 90 ? "Cần review" : "Ổn định"}</em></div>; })}</div>;
}

function AgentArtifact({ agentId, projectId, prompt = "", compact = false, run }: { agentId: AgentId; projectId: string; prompt?: string; compact?: boolean; run?: AgentRun }) {
  const project = projects.find((item) => item.id === projectId) ?? projects[0];
  const rows = getProjectUnits(projectId);
  const slow = getSlowMovingUnits(projectId, compact ? 4 : 6);
  const metrics = getAreaMetrics(projectId);
  const partial = rows.filter((row) => row.dataQuality === "PARTIAL").length;
  const avgPrice = rows.reduce((sum, row) => sum + row.pricePerSqm, 0) / rows.length;
  const slowCount = rows.filter((row) => row.status === "Đang bán" && row.daysOnMarket > 90).length;
  const focus = [...metrics].sort((a, b) => b.avgDom - a.avgDom)[0];
  const benchmark = metrics.filter((item) => item.area !== focus.area).reduce((sum, item, _, source) => sum + item.absorption / source.length, 0);
  const normalizedPrompt = prompt.toLocaleLowerCase("vi-VN");
  const has = (...terms: string[]) => terms.some((term) => normalizedPrompt.includes(term));

  if (agentId === "orchestrator") {
    const fallbackRun = createRun({ id: "run-result", prompt, projectId, startedAt: "09:33", memberIds: agents.slice(1).map((agent) => agent.id), phase: "complete" });
    return <OrchestratorResult run={run ?? fallbackRun} agents={agents} projectName={project.name} snapshot={project.snapshot} slowCount={slowCount} focusArea={focus.area} focusDom={focus.avgDom} />;
  }

  if (agentId === "data" && has("thiếu", "chất lượng", "dq")) {
    const partialRows = rows.filter((row) => row.dataQuality === "PARTIAL").slice(0, 6);
    return <div className="artifact-card data-artifact">
      <div className="artifact-title"><span><Database /> Báo cáo chất lượng dữ liệu</span><small>DQ audit · {project.snapshot}</small></div>
      <div className="artifact-metrics"><MetricCard label="HOÀN CHỈNH" value={`${project.dq}%`} detail={`${rows.length - partial} dòng COMPLETE`} tone="good" /><MetricCard label="CẦN BỔ SUNG" value={String(partial)} detail="Thiếu lịch sử giá" tone="warning" /><MetricCard label="TRÙNG MÃ" value="0" detail="Đã kiểm tra khóa căn" tone="good" /></div>
      <div className="data-table-wrap"><table><thead><tr><th>Mã căn</th><th>Tòa / tầng</th><th>Phân khu</th><th>Trường thiếu</th><th>Mức ảnh hưởng</th><th>Trạng thái</th></tr></thead><tbody>{partialRows.map((unit) => <tr key={unit.code}><td><b>{unit.code}</b></td><td>{unit.tower} · T{unit.floor}</td><td>{unit.area}</td><td>Lịch sử giá T-1</td><td>Không dùng tính xu hướng</td><td><span className="dq-pill dq-pill--partial">PARTIAL</span></td></tr>)}</tbody></table></div>
      <div className="artifact-foot">Khuyến nghị: bổ sung lịch sử giá trước khi chạy mô hình xu hướng; các metric hiện tại vẫn dùng được.</div>
    </div>;
  }
  if (agentId === "data" && has("giá trung bình", "mỗi m²", "m2", "m²")) return <div className="artifact-card data-artifact">
    <div className="artifact-title"><span><Database /> Giá trung bình theo phân khu</span><small>Đơn vị: triệu đồng/m²</small></div>
    <div className="artifact-metrics"><MetricCard label="GIÁ TB DỰ ÁN" value={`${avgPrice.toFixed(1)} tr`} detail="Giá chào / m²" /><MetricCard label="CAO NHẤT" value={`${Math.max(...metrics.map((m) => m.pricePerSqm))} tr`} detail={focus.area} tone="warning" /><MetricCard label="CỠ MẪU" value={rows.length.toLocaleString("vi-VN")} detail="Toàn bộ snapshot" tone="good" /></div>
    <div className="data-table-wrap"><table><thead><tr><th>Phân khu</th><th>Số căn</th><th>Giá TB/m²</th><th>DOM TB</th><th>Hấp thụ</th><th>Ưu đãi</th></tr></thead><tbody>{[...metrics].sort((a, b) => b.pricePerSqm - a.pricePerSqm).map((item) => <tr key={item.area}><td><b>{item.area}</b></td><td>{item.units}</td><td>{item.pricePerSqm} triệu</td><td>{item.avgDom} ngày</td><td>{item.absorption}%</td><td>{item.discountRate}%</td></tr>)}</tbody></table></div>
    <div className="artifact-foot">Công thức: tổng giá chào / tổng diện tích thông thủy · loại trừ dòng PARTIAL khỏi xu hướng.</div>
  </div>;
  if (agentId === "data") return <div className="artifact-card data-artifact">
    <div className="artifact-title"><span><Database /> Kết quả truy vấn dữ liệu</span><small>{rows.length.toLocaleString("vi-VN")} bản ghi · {project.snapshot}</small></div>
    <div className="artifact-metrics"><MetricCard label="CĂN BÁN CHẬM" value={String(slowCount)} detail="DOM > 90 ngày" tone="warning" /><MetricCard label="GIÁ TB / M²" value={`${avgPrice.toFixed(1)} tr`} detail="Giá chào hiện tại" /><MetricCard label="CHẤT LƯỢNG" value={`${project.dq}%`} detail={`${partial} dòng PARTIAL`} tone="good" /></div>
    <div className="data-table-wrap"><table><thead><tr><th>Mã căn</th><th>Vị trí</th><th>Loại / DT</th><th>Giá</th><th>DOM</th><th>Lead</th><th>DQ</th></tr></thead><tbody>{slow.map((unit) => <tr key={`${unit.code}-${unit.floor}`}><td><b>{unit.code}</b><small>{unit.tower} · T{unit.floor}</small></td><td>{unit.area}<small>{unit.view}</small></td><td>{unit.type}<small>{unit.size} m²</small></td><td>{unit.listPrice} tỷ<small>{unit.pricePerSqm} tr/m²</small></td><td><b className="danger">{unit.daysOnMarket} ngày</b></td><td>{unit.leads}<small>{unit.bookings} booking</small></td><td><span className={`dq-pill ${unit.dataQuality === "PARTIAL" ? "dq-pill--partial" : ""}`}>{unit.dataQuality}</span></td></tr>)}</tbody></table></div>
    <div className="artifact-foot">Bộ lọc: Đang bán · DOM &gt; 90 ngày · Nguồn: snapshot canonical {project.name} {project.snapshot}</div>
  </div>;

  if (agentId === "compare" && has("5 căn", "tương đồng với", "peer")) {
    const requestedCode = prompt.toUpperCase().match(/[A-Z]{2}-[A-Z]{2}-\d{4}/)?.[0];
    const origin = rows.find((row) => row.code === requestedCode) ?? slow[0] ?? rows[0];
    const peers = rows.filter((row) => row.code !== origin.code && row.type === origin.type && Math.abs(row.size - origin.size) / origin.size <= .1).slice(0, 5);
    return <div className="artifact-card compare-artifact">
      <div className="artifact-title"><span><Users /> 5 căn tương đồng với {origin.code}</span><small>Similarity ≥ 90%</small></div>
      <div className="compare-rule"><strong>Căn gốc</strong><span>{origin.area} · {origin.type} · {origin.size} m² · {origin.pricePerSqm} tr/m² · DOM {origin.daysOnMarket} ngày</span></div>
      <div className="data-table-wrap"><table><thead><tr><th>Xếp hạng</th><th>Mã căn</th><th>Phân khu</th><th>Diện tích</th><th>Giá/m²</th><th>DOM</th><th>Tương đồng</th></tr></thead><tbody>{peers.map((unit, index) => <tr key={unit.code}><td>#{index + 1}</td><td><b>{unit.code}</b></td><td>{unit.area}</td><td>{unit.size} m²</td><td>{unit.pricePerSqm} tr</td><td>{unit.daysOnMarket} ngày</td><td><span className="similarity-pill">{98 - index * 2}%</span></td></tr>)}</tbody></table></div>
      <div className="compare-conclusion"><strong>Gợi ý định giá</strong><span>Trung vị peer là {(peers.reduce((sum, unit) => sum + unit.pricePerSqm, 0) / peers.length).toFixed(1)} triệu/m². Căn gốc nên được review nếu lệch quá ±5%.</span></div>
    </div>;
  }
  if (agentId === "compare" && has("xếp hạng", "ranking")) return <div className="artifact-card compare-artifact">
    <div className="artifact-title"><span><Users /> Xếp hạng tốc độ hấp thụ</span><small>Cao xuống thấp · {project.snapshot}</small></div>
    <div className="ranking-list">{[...metrics].sort((a, b) => b.absorption - a.absorption).map((item, index) => <div key={item.area}><b>#{index + 1}</b><span><strong>{item.area}</strong><small>{item.units} căn · DOM {item.avgDom} ngày</small></span><div><i style={{ width: `${item.absorption}%` }} /><em>{item.absorption}%</em></div></div>)}</div>
    <div className="compare-conclusion"><strong>Khoảng cách</strong><span>Phân khu dẫn đầu cao hơn phân khu cuối bảng {(Math.max(...metrics.map((m) => m.absorption)) - Math.min(...metrics.map((m) => m.absorption))).toFixed(1)} điểm %.</span></div>
  </div>;
  if (agentId === "compare") return <div className="artifact-card compare-artifact">
    <div className="artifact-title"><span><Users /> So sánh peer group</span><small>Cùng dự án · Q2/2026</small></div>
    <div className="compare-rule"><strong>Rule đang dùng</strong><span>Cùng loại căn · diện tích ±10% · cùng giai đoạn mở bán · tối thiểu 5 peers</span></div>
    <div className="compare-grid">{metrics.map((item, index) => <div key={item.area} className={index === 0 ? "compare-card compare-card--focus" : "compare-card"}><span>{index === 0 ? "PHÂN KHU GỐC" : `PEER #${index}`}</span><strong>{item.area}</strong><dl><div><dt>DOM</dt><dd>{item.avgDom} ngày</dd></div><div><dt>Hấp thụ</dt><dd>{item.absorption}%</dd></div><div><dt>Giá/m²</dt><dd>{item.pricePerSqm} tr</dd></div><div><dt>Ưu đãi</dt><dd>{item.discountRate}%</dd></div></dl></div>)}</div>
    <div className="compare-conclusion"><strong>Chênh lệch chính</strong><span>{focus.area} thấp hơn benchmark {Math.abs(focus.absorption - benchmark).toFixed(1)} điểm % hấp thụ và có DOM cao hơn {Math.round(focus.avgDom - metrics.filter((m) => m.area !== focus.area).reduce((s, m, _, a) => s + m.avgDom / a.length, 0))} ngày.</span></div>
  </div>;

  if (agentId === "insight") {
    const insightMode = has("sales manager", "chú ý") ? "manager" : has("riverside", "chênh lệch hấp thụ", "giải thích") ? "absorption" : "drivers";
    const insightSets = {
      manager: [
        ["Tồn kho trên 90 ngày cần chủ sở hữu xử lý", `${slowCount} căn đang bán vượt ngưỡng; ưu tiên giao owner cho 10 căn DOM cao nhất.`, "CAO · EVD-STOCK-01"],
        ["Lead nhiều nhưng booking thấp", `${focus.area} có tín hiệu nghẽn ở bước tư vấn → booking; cần audit kịch bản và SLA phản hồi.`, "KHÁ · EVD-CRM-08"],
        ["Quyết định cần duyệt trong tuần", "Thử nghiệm ưu đãi có kiểm soát và review giá nhóm 2PN trước khi mở rộng toàn phân khu.", "KHÁ · EVD-ACTION-03"],
      ],
      absorption: [
        ["Chênh giá làm giảm sức cạnh tranh", `${focus.area} có giá ${focus.pricePerSqm} triệu/m² nhưng hấp thụ chỉ ${focus.absorption}%.`, "CAO · EVD-PRICE-04"],
        ["Ưu đãi chưa bù phần chênh", `Ưu đãi ${focus.discountRate}% thấp hơn nhóm bán tốt, làm giảm sức hút ở nhóm khách nhạy giá.`, "KHÁ · EVD-PROMO-03"],
        ["Cơ cấu căn tạo áp lực tồn kho", "Nhóm 2PN, diện tích 68–76 m² và view sông chiếm tỷ trọng cao trong danh sách DOM > 90.", "KHÁ · EVD-MIX-11"],
      ],
      drivers: [
        ["Giá/m² là tín hiệu mạnh nhất", `Phân khu DOM cao nhất đồng thời có mức giá ${focus.pricePerSqm} triệu/m².`, "CAO · EVD-PRICE-04"],
        ["Mức ưu đãi có quan hệ ngược với DOM", "Nhóm ưu đãi tốt hơn có DOM thấp hơn trong cùng loại căn và giai đoạn mở bán.", "KHÁ · EVD-PROMO-03"],
        ["Chất lượng lead cần được kiểm chứng", "Một số căn có nhiều lead nhưng ít booking; chưa đủ dữ liệu nguồn lead để kết luận.", "TRUNG BÌNH · EVD-CRM-08"],
      ],
    } as const;
    const selectedInsights = insightSets[insightMode];
    return <div className="artifact-card insight-artifact">
      <div className="artifact-title"><span><Lightbulb /> {insightMode === "manager" ? "Điểm Sales Manager cần chú ý" : insightMode === "absorption" ? `Giải thích hấp thụ tại ${focus.area}` : "Yếu tố liên quan tới bán chậm"}</span><small>3 insight · 7 evidence</small></div>
      <div className="insight-list">{selectedInsights.map((item, index) => <div key={item[0]}><b>{String(index + 1).padStart(2, "0")}</b><span><strong>{item[0]}</strong><p>{item[1]}</p><small>Độ tin cậy {item[2]}</small></span></div>)}</div>
      <div className="limit-note"><ShieldCheck /><span><strong>Giới hạn kết luận</strong> Đây là quan hệ quan sát trên dữ liệu mô phỏng, chưa chứng minh quan hệ nhân quả. Cần kiểm tra lịch sử chiến dịch và phản hồi khách hàng.</span></div>
    </div>;
  }

  if (agentId === "chart") {
    const chartMode = has("hấp thụ", "loại căn") ? "absorption" : has("giá/m²", "giá/m2", "2pn") ? "price-dom" : "dom";
    return <div className="artifact-card chart-artifact">
      <div className="artifact-title"><span><BarChart3 /> {chartMode === "absorption" ? "Tỷ lệ hấp thụ theo loại căn" : chartMode === "price-dom" ? "Giá/m² và DOM nhóm 2PN" : "DOM theo phân khu"}</span><small>{project.name} · {project.snapshot}</small></div>
      <div className="chart-toolbar"><span className={`chart-tab ${chartMode === "dom" ? "chart-tab--active" : ""}`}>DOM</span><span className={`chart-tab ${chartMode === "absorption" ? "chart-tab--active" : ""}`}>Hấp thụ</span><span className={`chart-tab ${chartMode === "price-dom" ? "chart-tab--active" : ""}`}>Giá/m² + DOM</span><span className="chart-source">N = {rows.length.toLocaleString("vi-VN")} căn</span></div>
      {chartMode === "absorption" ? <AbsorptionTypeChart projectId={projectId} /> : chartMode === "price-dom" ? <PriceDomChart projectId={projectId} /> : <DomChart projectId={projectId} />}
      <div className="chart-callout"><strong>Kết luận nhanh</strong><span>{chartMode === "absorption" ? "So sánh giúp nhận ra loại căn có tốc độ tiêu thụ thấp để điều chỉnh thông điệp bán hàng." : chartMode === "price-dom" ? "Nhóm 2PN được đối chiếu đồng thời giá chào và thời gian tồn kho để phát hiện điểm định giá bất thường." : `${focus.area} có DOM cao nhất dự án; các căn vượt 90 ngày cần được review.`}</span></div>
    </div>;
  }

  if (agentId === "report" && has("executive", "một trang", "1 trang")) return <div className="artifact-card report-artifact executive-artifact">
    <div className="artifact-title"><span><FileCheck2 /> Executive summary · 1 trang</span><small>Dành cho Sales Manager</small></div>
    <div className="executive-hero"><small>{project.name.toUpperCase()} · {project.snapshot}</small><strong>Hiệu suất bán hàng cần can thiệp có chọn lọc</strong><p>Phần lớn phân khu vận hành ổn định, nhưng {focus.area} đang kéo dài vòng đời tồn kho và cần thử nghiệm lại giá–ưu đãi.</p></div>
    <div className="artifact-metrics"><MetricCard label="TỒN KHO CHẬM" value={String(slowCount)} detail="DOM > 90 ngày" tone="warning" /><MetricCard label="ĐIỂM NGHẼN" value={focus.area} detail={`${focus.avgDom} ngày DOM`} /><MetricCard label="ƯU TIÊN" value="30 ngày" detail="Thử nghiệm có kiểm soát" tone="good" /></div>
    <div className="executive-actions"><strong>3 quyết định đề xuất</strong><ol><li>Review giá nhóm 2PN DOM cao.</li><li>Thử gói ưu đãi riêng tại {focus.area}.</li><li>Audit lead chưa chuyển đổi sau 48 giờ.</li></ol></div>
  </div>;
  if (agentId === "report" && has("claim", "evidence", "thiếu")) return <div className="artifact-card report-artifact evidence-artifact">
    <div className="artifact-title"><span><ShieldCheck /> Kiểm tra claim và evidence</span><small>10/12 claim đạt</small></div>
    <div className="claim-list"><div><Check /><span><strong>Hấp thụ {focus.area} thấp hơn benchmark</strong><small>EVD-ABS-02 · Metric canonical</small></span><em>Đủ</em></div><div><Check /><span><strong>Giá/m² cao hơn nhóm tương đồng</strong><small>EVD-PRICE-04 · Peer group v1.2</small></span><em>Đủ</em></div><div className="claim-warning"><Clock3 /><span><strong>Ưu đãi là nguyên nhân trực tiếp làm bán chậm</strong><small>Chỉ có tương quan · cần dữ liệu thử nghiệm</small></span><em>Cần duyệt</em></div><div className="claim-warning"><Clock3 /><span><strong>Lead quảng cáo có chất lượng thấp</strong><small>Thiếu nguồn chiến dịch của {partial} bản ghi</small></span><em>Thiếu evidence</em></div></div>
  </div>;
  if (agentId === "report") return <div className="artifact-card report-artifact">
    <div className="artifact-title"><span><FileCheck2 /> Báo cáo hiệu suất bán hàng</span><small>Bản nháp v1 · Chờ duyệt</small></div>
    <div className="report-head"><div><small>{project.name.toUpperCase()} · {project.snapshot}</small><strong>Phân tích tồn kho và tốc độ hấp thụ</strong><p>Dành cho Sales Manager · tạo từ {rows.length.toLocaleString("vi-VN")} bản ghi canonical</p></div><span>V1</span></div>
    <div className="report-sections">{["Executive summary", "Phạm vi & chất lượng dữ liệu", "Hiệu suất theo phân khu", "Căn bán chậm trọng yếu", "Nguyên nhân & giới hạn", "Đề xuất hành động 30 ngày"].map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong><em><Check /> Đã tạo</em></div>)}</div>
    <div className="report-actions"><span>4 biểu đồ · 12 evidence · 2 claim cần duyệt</span><button>Xem bản nháp</button></div>
  </div>;
  return null;
}

export function ChatWorkspace({ previewAgent }: { previewAgent?: AgentId } = {}) {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const cancelledRunIdsRef = useRef(new Set<string>());
  const [ready, setReady] = useState(Boolean(previewAgent));
  const [user, setUser] = useState<UserProfile>({ name: "Nguyễn Minh Anh", email: "", staffId: "SO-0248", role: "Sales Operations" });
  const [activeId, setActiveId] = useState<AgentId>(previewAgent ?? "orchestrator");
  const [projectId, setProjectId] = useState<string>(projects[0].id);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [runPanelOpen, setRunPanelOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [workPhase, setWorkPhase] = useState<WorkPhase>("idle");
  const [messagesByAgent, setMessagesByAgent] = useState(createEmptyConversations);
  const [runsByAgent, setRunsByAgent] = useState<Partial<Record<AgentId, AgentRun>>>({});
  const [shortTermHistory, setShortTermHistory] = useState<ShortTermHistory[]>([]);
  const [groupsByAgent, setGroupsByAgent] = useState<Partial<Record<AgentId, AgentGroup>>>({});

  useEffect(() => {
    if (previewAgent) {
      document.title = `VDAgent — ${previewAgent}`;
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const preview = new URLSearchParams(window.location.search);
      if (preview.get("figma") === "1") {
        const requestedAgent = preview.get("agent") as AgentId | null;
        if (requestedAgent && agents.some((agent) => agent.id === requestedAgent)) setActiveId(requestedAgent);
        document.title = `VDAgent — ${requestedAgent ? repository.getAgentGuide(requestedAgent).purpose.split(".")[0] : "Điều phối"}`;
        setReady(true);
        return;
      }
      const saved = window.localStorage.getItem("vdagent-user");
      if (!saved) { router.replace("/login"); return; }
      try { setUser(JSON.parse(saved) as UserProfile); } catch { window.localStorage.removeItem("vdagent-user"); router.replace("/login"); return; }
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [previewAgent, router]);

  const activeAgent = agents.find((agent) => agent.id === activeId) ?? agents[0];
  const activeProject = projects.find((project) => project.id === projectId) ?? projects[0];
  const filteredAgents = useMemo(() => agents.filter((agent) => `${agent.name} ${agent.role} ${agent.preview}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const messages = messagesByAgent[activeId];
  const hasConversation = messages.length > 0 || sending;
  const activeGroup = groupsByAgent[activeId];
  const activeRun = runsByAgent[activeId];

  function chooseAgent(id: AgentId) { setActiveId(id); setSidebarOpen(false); setHistoryOpen(false); }
  function logout() { window.localStorage.removeItem("vdagent-user"); router.push("/login"); }
  function newConversation() {
    setMessagesByAgent((current) => ({ ...current, [activeId]: [] }));
    setGroupsByAgent((current) => ({ ...current, [activeId]: undefined }));
    setRunsByAgent((current) => ({ ...current, [activeId]: undefined }));
    setDraft("");
    setWorkPhase("idle");
    setRunPanelOpen(false);
  }
  function transitionRun(agentId: AgentId, runId: string, phase: RunPhase) {
    setRunsByAgent((current) => {
      const run = current[agentId];
      return run?.id === runId ? { ...current, [agentId]: setRunPhase(run, phase) } : current;
    });
    setGroupsByAgent((current) => current[agentId]?.id === runId ? { ...current, [agentId]: { ...current[agentId], phase } as AgentGroup } : current);
    if (agentId === activeId) setWorkPhase(phase);
  }
  function cancelRun() {
    if (!activeRun || !["receiving", "thinking", "collaborating", "retrying"].includes(activeRun.phase)) return;
    cancelledRunIdsRef.current.add(activeRun.id);
    transitionRun(activeId, activeRun.id, "cancelling");
    setSending(false);
    window.setTimeout(() => transitionRun(activeId, activeRun.id, "cancelled"), 360);
  }
  function retryRun() {
    if (!activeRun || !["failed", "cancelled"].includes(activeRun.phase)) return;
    const runId = crypto.randomUUID();
    const retriedRun = createRun({ id: runId, prompt: activeRun.prompt, projectId: activeRun.projectId, startedAt: activeRun.startedAt, memberIds: activeRun.tasks.map((task) => task.agentId), phase: "retrying" });
    setRunsByAgent((current) => ({ ...current, [activeId]: retriedRun }));
    setGroupsByAgent((current) => ({ ...current, [activeId]: { id: runId, title: getGroupTitle(activeRun.prompt), prompt: activeRun.prompt, memberIds: retriedRun.tasks.map((task) => task.agentId), phase: "retrying" } }));
    setSending(true); setWorkPhase("retrying"); setRunPanelOpen(true);
    window.setTimeout(() => transitionRun(activeId, runId, "collaborating"), 650);
    window.setTimeout(() => { transitionRun(activeId, runId, "complete"); setSending(false); }, 1500);
  }
  function sendMessage(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    const now = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    setMessagesByAgent((current) => ({ ...current, [activeId]: [...current[activeId], { id: crypto.randomUUID(), kind: "user", text, time: now }] }));
    setShortTermHistory((current) => [{ id: crypto.randomUUID(), agentId: activeId, prompt: text, project: activeProject.name, time: now }, ...current].slice(0, 6));
    const groupId = crypto.randomUUID();
    const requestedAgentId = activeId;
    const memberIds = selectCollaborationAgents(text, requestedAgentId, agents);
    setGroupsByAgent((current) => ({ ...current, [activeId]: { id: groupId, title: getGroupTitle(text), prompt: text, memberIds, phase: "receiving" } }));
    setRunsByAgent((current) => ({ ...current, [requestedAgentId]: createRun({ id: groupId, prompt: text, projectId, startedAt: now, memberIds }) }));
    cancelledRunIdsRef.current.delete(groupId);
    setDraft(""); setSending(true); setWorkPhase("receiving"); setRunPanelOpen(true); setHistoryOpen(false);
    window.setTimeout(() => {
      if (!cancelledRunIdsRef.current.has(groupId)) transitionRun(requestedAgentId, groupId, "thinking");
    }, 420);
    window.setTimeout(() => {
      if (!cancelledRunIdsRef.current.has(groupId)) transitionRun(requestedAgentId, groupId, "collaborating");
    }, 980);
    window.setTimeout(() => {
      if (cancelledRunIdsRef.current.has(groupId)) return;
      const projectRows = getProjectUnits(projectId);
      const projectMetrics = getAreaMetrics(projectId);
      const topArea = [...projectMetrics].sort((a, b) => b.avgDom - a.avgDom)[0];
      const slowRows = projectRows.filter((row) => row.status === "Đang bán" && row.daysOnMarket > 90);
      const promptText = text.toLocaleLowerCase("vi-VN");
      const asks = (...terms: string[]) => terms.some((term) => promptText.includes(term));
      const response = requestedAgentId === "orchestrator" ? `Tôi đã phân tích yêu cầu “${text}” và tạo nhóm gồm ${memberIds.length} agent liên quan: ${memberIds.map((id) => agents.find((agent) => agent.id === id)?.name).filter(Boolean).join(", ")}. Các agent đã bàn giao phần việc để tôi hợp nhất thành kết quả có thể truy vết.`
        : requestedAgentId === "data" ? asks("thiếu", "chất lượng", "dq") ? `Đã audit ${projectRows.length.toLocaleString("vi-VN")} dòng: ${projectRows.filter((row) => row.dataQuality === "PARTIAL").length} dòng PARTIAL do thiếu lịch sử giá; không phát hiện mã căn trùng.` : asks("giá trung bình", "mỗi m²", "m2", "m²") ? `Giá chào trung bình toàn dự án là ${(projectRows.reduce((sum, row) => sum + row.pricePerSqm, 0) / projectRows.length).toFixed(1)} triệu đồng/m². Tôi đã phân rã theo phân khu và kèm DOM, hấp thụ, ưu đãi để tránh đọc giá tách rời hiệu suất.` : `Truy vấn hoàn tất trên ${projectRows.length.toLocaleString("vi-VN")} căn. Tôi tìm thấy ${slowRows.length} căn đang bán có DOM trên 90 ngày; bảng kết quả giữ cả vị trí, diện tích, giá/m², lead, booking và cờ chất lượng.`
        : requestedAgentId === "compare" ? asks("5 căn", "tương đồng với") ? "Tôi đã chọn 5 căn gần nhất theo loại căn, diện tích ±10%, thời điểm mở bán và mức giá. Kết quả được xếp hạng theo độ tương đồng thay vì chỉ liệt kê cùng phân khu." : asks("xếp hạng") ? "Tôi đã xếp hạng các phân khu theo tỷ lệ hấp thụ, đồng thời giữ cỡ mẫu và DOM để tránh thứ hạng gây hiểu nhầm." : `Tôi đã tạo nhóm so sánh cho ${topArea.area}. Bảng benchmark bên dưới cho thấy chênh lệch DOM, hấp thụ, giá/m² và ưu đãi của từng phân khu.`
        : requestedAgentId === "insight" ? `Tôi đã diễn giải câu hỏi “${text}” thành 3 nhận định có thể hành động. Mỗi nhận định có độ tin cậy, evidence và giới hạn để Sales Manager không hiểu nhầm tương quan thành nguyên nhân.`
        : requestedAgentId === "chart" ? asks("hấp thụ", "loại căn") ? "Tôi đã chuyển dữ liệu thành biểu đồ thanh ngang theo Studio, 1PN, 2PN và 3PN; mỗi thanh kèm tỷ lệ hấp thụ và cỡ mẫu." : asks("giá/m²", "2pn") ? "Tôi đã đặt giá/m² cạnh DOM của riêng nhóm 2PN để thấy phân khu nào vừa định giá cao vừa tồn kho lâu." : `Tôi đã trực quan hóa DOM trung bình của ${projectMetrics.length} phân khu, kèm trục đo, cỡ mẫu và ngưỡng cảnh báo 90 ngày.`
        : asks("executive", "một trang") ? "Tôi đã rút báo cáo thành executive summary một trang: một kết luận, ba KPI và ba quyết định đề xuất cho Sales Manager." : asks("claim", "evidence", "thiếu") ? "Tôi đã audit từng claim trong báo cáo: 10/12 claim đủ evidence, 2 claim được tách riêng để người dùng duyệt hoặc bổ sung dữ liệu." : `Tôi đã tổng hợp yêu cầu “${text}” thành bản nháp 6 phần cho Sales Manager, gồm biểu đồ, evidence và các claim chờ xác nhận.`;
      const finalPhase: RunPhase = asks("thất bại", "giả lập lỗi", "run lỗi") ? "failed" : asks("partial", "chờ duyệt") ? "partial" : "complete";
      const requestedAgent = agents.find((agent) => agent.id === requestedAgentId) ?? agents[0];
      const reply: Message = { id: crypto.randomUUID(), kind: "agent", author: requestedAgent.name, text: response, time: now, evidence: requestedAgentId === "orchestrator" ? `${memberIds.length} agent tham gia · Run RUN-025` : `Nguồn mô phỏng · ${activeProject.name} ${activeProject.snapshot}`, artifact: requestedAgentId, artifactPrompt: text };
      setMessagesByAgent((current) => ({ ...current, [requestedAgentId]: [...current[requestedAgentId], reply] }));
      transitionRun(requestedAgentId, groupId, finalPhase);
      setSending(false); window.setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 40);
    }, 1900);
  }

  if (!ready) return <div className="loading-screen"><span className="brand-mark"><BarChart3 /></span><p>Đang mở workspace…</p></div>;

  return <main className="app-shell">
    {sidebarOpen && <button className="mobile-overlay" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} />}
    <WorkspaceSidebar agents={filteredAgents} activeId={activeId} activeGroup={activeGroup} groupSummary={activeGroup ? <SidebarAgentGroup group={activeGroup} agents={agents} onAgent={chooseAgent} /> : undefined} user={user} query={query} open={sidebarOpen} getGroupMemberState={getGroupMemberState} onQueryChange={setQuery} onChooseAgent={chooseAgent} onNewConversation={newConversation} onLogout={logout} onClose={() => setSidebarOpen(false)} />

    <section className="workspace">
      <WorkspaceTopbar agent={activeAgent} projects={projects} projectId={projectId} historyOpen={historyOpen} onOpenSidebar={() => setSidebarOpen(true)} onProjectChange={setProjectId} onToggleHistory={() => setHistoryOpen(!historyOpen)} />
      <div className="workspace-body">
        {!hasConversation ? <section className={styles.welcome} aria-labelledby="chat-welcome-title">
          <div className={styles.welcomeContent}>
            <h1 id="chat-welcome-title">What should we explore?</h1>
            <div className={styles.welcomeComposer}>
              <PromptComposer agentName={activeAgent.name} draft={draft} sending={sending} onDraftChange={setDraft} onSubmit={sendMessage} placeholder="Ask about your data, comparisons, insights or reports…" />
            </div>
          </div>
        </section> : <ConversationStream activeAgent={activeAgent} agents={agents} project={activeProject} messages={messages} sending={sending} workPhase={workPhase} guide={null} endRef={endRef} renderArtifact={(message) => message.artifact ? <AgentArtifact agentId={message.artifact} projectId={projectId} prompt={message.artifactPrompt} compact run={message.artifact === "orchestrator" ? activeRun : undefined} /> : null} />}
        {historyOpen && <HistoryPanel activeAgent={activeAgent} agents={agents} recentItems={shortTermHistory} savedRuns={conversationHistory} onClose={() => setHistoryOpen(false)} />}
        {!historyOpen && hasConversation && runPanelOpen && activeId === "orchestrator" && activeRun && <RunProgressPanel run={activeRun} agents={agents} onRetry={retryRun} onCancel={cancelRun} onClose={() => setRunPanelOpen(false)} />}
      </div>
      {hasConversation && <PromptComposer agentName={activeAgent.name} draft={draft} sending={sending} onDraftChange={setDraft} onSubmit={sendMessage} />}
    </section>
  </main>;
}
