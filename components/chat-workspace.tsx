"use client";

import {
  ArrowRight, ArrowUp, BarChart3, ChartNoAxesCombined, Check, ChevronDown, Clock3,
  Database, FileCheck2, FileText, History, Lightbulb, LogOut, Menu, Mic, Plus,
  Search, ShieldCheck, Sparkles, Users, X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ElementType } from "react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { agentGuides, conversationHistory, getAreaMetrics, getProjectUnits, getSlowMovingUnits, projects } from "@/data/mock-real-estate";

type AgentId = keyof typeof agentGuides;
type Agent = { id: AgentId; name: string; role: string; time: string; preview: string; color: string; icon: ElementType; unread?: boolean };
type Message = { id: string; kind: "user" | "agent" | "system"; text: string; author?: string; time?: string; evidence?: string; artifact?: AgentId; artifactPrompt?: string };
type UserProfile = { name: string; email: string; staffId: string; role: string };
type ShortTermHistory = { id: string; agentId: AgentId; prompt: string; project: string; time: string };

const agents: Agent[] = [
  { id: "orchestrator", name: "Điều phối", role: "Orchestrator", time: "09:42", preview: "Đã hoàn tất phân tích giỏ hàng Q2.", color: "#ef8354", icon: Sparkles },
  { id: "data", name: "Dữ liệu", role: "Data Agent", time: "09:40", preview: "Đã kiểm tra 1.248 bản ghi.", color: "#3e8bff", icon: Database },
  { id: "compare", name: "So sánh", role: "Compare Agent", time: "09:38", preview: "Tìm thấy 3 nhóm tương đồng.", color: "#8b5cf6", icon: Users },
  { id: "insight", name: "Insight", role: "Insight Agent", time: "09:35", preview: "2 nhận định cần bạn xem lại.", color: "#10a985", icon: Lightbulb, unread: true },
  { id: "chart", name: "Biểu đồ", role: "Chart Agent", time: "09:31", preview: "Đã tạo 4 biểu đồ bằng chứng.", color: "#e9a23b", icon: BarChart3 },
  { id: "report", name: "Báo cáo", role: "Report Agent", time: "09:28", preview: "Bản nháp v1 sẵn sàng duyệt.", color: "#ec5c8d", icon: FileText },
];

const initialMessages: Record<AgentId, Message[]> = {
  orchestrator: [
    { id: "o1", kind: "system", text: "Hôm nay, 09:32" },
    { id: "o2", kind: "user", text: "Phân tích các căn bán chậm tại dự án Green Avenue trong quý 2 và cho tôi biết nguyên nhân đáng chú ý.", time: "09:32" },
    { id: "o3", kind: "agent", author: "Điều phối", text: "Tôi đã chia yêu cầu thành 4 bước: kiểm tra dữ liệu, xác định căn bán chậm, so sánh peer group và tổng hợp bằng chứng. 5 agent chuyên môn đang phối hợp.", time: "09:33" },
    { id: "o4", kind: "system", text: "Dữ liệu và So sánh đã hoàn tất" },
    { id: "o5", kind: "agent", author: "Dữ liệu", text: "Đã đối soát 1.248 căn thuộc snapshot Q2/2026. Có 31 căn vượt ngưỡng DOM 90 ngày; 2 bản ghi thiếu lịch sử giá được đánh dấu PARTIAL.", time: "09:36", evidence: "Snapshot GA-Q2-2026 · DQ 98,7%" },
    { id: "o6", kind: "agent", author: "So sánh", text: "Phân khu Riverside có tốc độ hấp thụ thấp hơn peer group 14,2 điểm %. Chênh lệch tập trung ở nhóm căn 2PN, diện tích 68–74 m².", time: "09:38", evidence: "5 peers · tolerance ±10% · công thức v1.2" },
    { id: "o7", kind: "agent", author: "Insight", text: "Giá chào bán mỗi m² cao hơn trung vị nhóm tương đồng 8,6%, trong khi ưu đãi thanh toán thấp hơn 2 điểm %. Đây là yếu tố liên quan mạnh nhất, chưa đủ để kết luận nhân quả.", time: "09:40", evidence: "INS-024 · 3 bằng chứng đã liên kết" },
    { id: "o8", kind: "agent", author: "Điều phối", text: "Kết quả đã sẵn sàng. Tôi đã hợp nhất đầu ra của 5 agent thành một run có thể truy vết; các dòng thiếu dữ liệu được giữ ngoài kết luận chính để bạn review.", time: "09:42", artifact: "orchestrator" },
  ],
  data: [{ id: "d1", kind: "agent", author: "Dữ liệu", text: "Tôi đã chạy truy vấn mẫu trên snapshot. Kết quả bên dưới là dữ liệu có cấu trúc, có bộ lọc, metric và cờ chất lượng — không phải một đoạn trả lời chung chung.", time: "09:40", artifact: "data" }],
  compare: [{ id: "c1", kind: "agent", author: "So sánh", text: "Tôi đã dựng peer group theo rule cùng loại căn, diện tích ±10%, cùng giai đoạn mở bán và tối thiểu 5 peers. Đây là bảng benchmark để bạn nhìn rõ chênh lệch.", time: "09:38", artifact: "compare" }],
  insight: [{ id: "i1", kind: "agent", author: "Insight", text: "Tôi đã xếp hạng các tín hiệu theo mức độ quan trọng, liên kết evidence và ghi rõ giới hạn. Kết quả không đánh đồng tương quan với nguyên nhân.", time: "09:35", artifact: "insight" }],
  chart: [{ id: "ch1", kind: "agent", author: "Biểu đồ", text: "Tôi đã dựng biểu đồ DOM có trục đo, đường lưới, ngưỡng cảnh báo, nhãn số và cỡ mẫu. Mỗi cột vẫn liên kết về dữ liệu nguồn.", time: "09:31", artifact: "chart" }],
  report: [{ id: "r1", kind: "agent", author: "Báo cáo", text: "Tôi đã ghép metric, insight, biểu đồ và evidence thành bản nháp 6 phần đúng đối tượng Sales Manager, kèm các claim còn cần người dùng duyệt.", time: "09:28", artifact: "report" }],
};

function AgentMark({ agent, size = "md" }: { agent: Agent; size?: "sm" | "md" }) {
  const Icon = agent.icon;
  if (agent.id === "orchestrator") return <span className={`agent-mark orchestrator-mark ${size === "sm" ? "agent-mark--sm" : ""}`} aria-label="Điều phối 5 agent chuyên môn"><Sparkles className="orchestrator-core" /><i className="agent-satellite satellite-data"><Database /></i><i className="agent-satellite satellite-compare"><Users /></i><i className="agent-satellite satellite-insight"><Lightbulb /></i><i className="agent-satellite satellite-chart"><BarChart3 /></i><i className="agent-satellite satellite-report"><FileText /></i></span>;
  return <span className={`agent-mark ${size === "sm" ? "agent-mark--sm" : ""}`} style={{ backgroundColor: agent.color }}><Icon aria-hidden="true" strokeWidth={2.2} /></span>;
}

function AgentGuide({ agent, onPrompt }: { agent: Agent; onPrompt: (prompt: string) => void }) {
  const guide = agentGuides[agent.id];
  return <section className="guide-card">
    <div className="guide-heading"><AgentMark agent={agent} /><div><span>BẠN ĐANG LÀM VIỆC VỚI</span><h2>{agent.name}</h2><p>{guide.purpose}</p></div></div>
    <div className="guide-columns"><div><small>BẠN CẦN CUNG CẤP</small><p>{guide.needs}</p></div><div><small>AGENT SẼ TRẢ VỀ</small><ul>{guide.outputs.map((item) => <li key={item}><Check /> {item}</li>)}</ul></div></div>
    <div className="prompt-group"><small>CÂU HỎI GỢI Ý</small><div>{guide.prompts.map((prompt) => <button key={prompt} onClick={() => onPrompt(prompt)}>{prompt}<ArrowRight /></button>)}</div></div>
  </section>;
}

function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: "warning" | "good" }) {
  return <div className={`metric-card ${tone ? `metric-card--${tone}` : ""}`}><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>;
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

function AgentArtifact({ agentId, projectId, prompt = "", compact = false }: { agentId: AgentId; projectId: string; prompt?: string; compact?: boolean }) {
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
    const runMode = has("báo cáo tuần") ? "weekly" : has("nguyên nhân", "hấp thụ thấp") ? "investigate" : "slow";
    const runTasks = runMode === "weekly"
      ? ["Khóa số liệu tuần và kiểm tra CRM", "So sánh với tuần trước và chỉ tiêu", "Chọn 3 điểm quản lý cần chú ý", "Dựng KPI card và biểu đồ tuần", "Tạo weekly brief một trang"]
      : runMode === "investigate"
        ? ["Kiểm tra funnel lead → booking", "Đối chiếu giá, ưu đãi và peer group", "Xếp hạng giả thuyết nguyên nhân", "Trực quan hóa điểm nghẽn", "Tạo action plan kiểm chứng 30 ngày"]
        : ["Đối soát snapshot và lọc căn DOM > 90", "Tạo peer group và benchmark", "Xếp hạng nguyên nhân kèm độ tin cậy", "Dựng biểu đồ có nguồn", "Đóng gói báo cáo chờ duyệt"];
    const result = runMode === "weekly" ? `Tuần này có ${slowCount} căn bán chậm; ${focus.area} là điểm cần theo dõi. Weekly brief đã sẵn sàng để Sales Manager duyệt.` : runMode === "investigate" ? `${focus.area} có hấp thụ ${focus.absorption}% và DOM ${focus.avgDom} ngày. Ba giả thuyết chính: giá, ưu đãi và chuyển đổi lead.` : `${slowCount} căn bán chậm; ${focus.area} có DOM cao nhất (${focus.avgDom} ngày). Giá/m² và mức ưu đãi là hai tín hiệu cần ưu tiên kiểm tra.`;
    return <div className="artifact-card run-artifact">
      <div className="artifact-title"><span><Sparkles /> {runMode === "weekly" ? "Quy trình báo cáo tuần" : runMode === "investigate" ? "Quy trình điều tra nguyên nhân" : "Kế hoạch phân tích căn bán chậm"}</span><small>5/5 agent đã phản hồi</small></div>
      <div className="run-steps">{agents.slice(1).map((agent, index) => <div key={agent.id}><AgentMark agent={agent} size="sm" /><span><strong>{index + 1}. {agent.name}</strong><small>{runTasks[index]}</small></span><em><Check /> Xong</em></div>)}</div>
      <div className="run-summary"><strong>Kết quả hợp nhất</strong><span>{result}</span></div>
    </div>;
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
  const [ready, setReady] = useState(Boolean(previewAgent));
  const [user, setUser] = useState<UserProfile>({ name: "Nguyễn Minh Anh", email: "", staffId: "SO-0248", role: "Sales Operations" });
  const [activeId, setActiveId] = useState<AgentId>(previewAgent ?? "orchestrator");
  const [projectId, setProjectId] = useState<string>(projects[0].id);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [messagesByAgent, setMessagesByAgent] = useState(initialMessages);
  const [shortTermHistory, setShortTermHistory] = useState<ShortTermHistory[]>([]);

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
        if (requestedAgent && requestedAgent in agentGuides) setActiveId(requestedAgent);
        document.title = `VDAgent — ${requestedAgent ? agentGuides[requestedAgent].purpose.split(".")[0] : "Điều phối"}`;
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

  function chooseAgent(id: AgentId) { setActiveId(id); setSidebarOpen(false); setHistoryOpen(false); }
  function pickPrompt(prompt: string) { setDraft(prompt); window.setTimeout(() => document.querySelector<HTMLInputElement>(".composer input")?.focus(), 0); }
  function logout() { window.localStorage.removeItem("vdagent-user"); router.push("/login"); }
  function newConversation() { setMessagesByAgent((current) => ({ ...current, [activeId]: [] })); setDraft(""); }
  function sendMessage(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    const now = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    setMessagesByAgent((current) => ({ ...current, [activeId]: [...current[activeId], { id: crypto.randomUUID(), kind: "user", text, time: now }] }));
    setShortTermHistory((current) => [{ id: crypto.randomUUID(), agentId: activeId, prompt: text, project: activeProject.name, time: now }, ...current].slice(0, 6));
    setDraft(""); setSending(true);
    window.setTimeout(() => {
      const projectRows = getProjectUnits(projectId);
      const projectMetrics = getAreaMetrics(projectId);
      const topArea = [...projectMetrics].sort((a, b) => b.avgDom - a.avgDom)[0];
      const slowRows = projectRows.filter((row) => row.status === "Đang bán" && row.daysOnMarket > 90);
      const promptText = text.toLocaleLowerCase("vi-VN");
      const asks = (...terms: string[]) => terms.some((term) => promptText.includes(term));
      const response = activeId === "orchestrator" ? `Tôi đã tách yêu cầu “${text}” thành 5 nhiệm vụ chuyên môn. Các agent đã trả về dataset, benchmark, insight, biểu đồ và bản nháp báo cáo; bên dưới là trạng thái của từng bước và kết quả hợp nhất.`
        : activeId === "data" ? asks("thiếu", "chất lượng", "dq") ? `Đã audit ${projectRows.length.toLocaleString("vi-VN")} dòng: ${projectRows.filter((row) => row.dataQuality === "PARTIAL").length} dòng PARTIAL do thiếu lịch sử giá; không phát hiện mã căn trùng.` : asks("giá trung bình", "mỗi m²", "m2", "m²") ? `Giá chào trung bình toàn dự án là ${(projectRows.reduce((sum, row) => sum + row.pricePerSqm, 0) / projectRows.length).toFixed(1)} triệu đồng/m². Tôi đã phân rã theo phân khu và kèm DOM, hấp thụ, ưu đãi để tránh đọc giá tách rời hiệu suất.` : `Truy vấn hoàn tất trên ${projectRows.length.toLocaleString("vi-VN")} căn. Tôi tìm thấy ${slowRows.length} căn đang bán có DOM trên 90 ngày; bảng kết quả giữ cả vị trí, diện tích, giá/m², lead, booking và cờ chất lượng.`
        : activeId === "compare" ? asks("5 căn", "tương đồng với") ? "Tôi đã chọn 5 căn gần nhất theo loại căn, diện tích ±10%, thời điểm mở bán và mức giá. Kết quả được xếp hạng theo độ tương đồng thay vì chỉ liệt kê cùng phân khu." : asks("xếp hạng") ? "Tôi đã xếp hạng các phân khu theo tỷ lệ hấp thụ, đồng thời giữ cỡ mẫu và DOM để tránh thứ hạng gây hiểu nhầm." : `Tôi đã tạo nhóm so sánh cho ${topArea.area}. Bảng benchmark bên dưới cho thấy chênh lệch DOM, hấp thụ, giá/m² và ưu đãi của từng phân khu.`
        : activeId === "insight" ? `Tôi đã diễn giải câu hỏi “${text}” thành 3 nhận định có thể hành động. Mỗi nhận định có độ tin cậy, evidence và giới hạn để Sales Manager không hiểu nhầm tương quan thành nguyên nhân.`
        : activeId === "chart" ? asks("hấp thụ", "loại căn") ? "Tôi đã chuyển dữ liệu thành biểu đồ thanh ngang theo Studio, 1PN, 2PN và 3PN; mỗi thanh kèm tỷ lệ hấp thụ và cỡ mẫu." : asks("giá/m²", "2pn") ? "Tôi đã đặt giá/m² cạnh DOM của riêng nhóm 2PN để thấy phân khu nào vừa định giá cao vừa tồn kho lâu." : `Tôi đã trực quan hóa DOM trung bình của ${projectMetrics.length} phân khu, kèm trục đo, cỡ mẫu và ngưỡng cảnh báo 90 ngày.`
        : asks("executive", "một trang") ? "Tôi đã rút báo cáo thành executive summary một trang: một kết luận, ba KPI và ba quyết định đề xuất cho Sales Manager." : asks("claim", "evidence", "thiếu") ? "Tôi đã audit từng claim trong báo cáo: 10/12 claim đủ evidence, 2 claim được tách riêng để người dùng duyệt hoặc bổ sung dữ liệu." : `Tôi đã tổng hợp yêu cầu “${text}” thành bản nháp 6 phần cho Sales Manager, gồm biểu đồ, evidence và các claim chờ xác nhận.`;
      const reply: Message = { id: crypto.randomUUID(), kind: "agent", author: activeAgent.name, text: response, time: now, evidence: activeId === "orchestrator" ? "5 agent tham gia · Run RUN-025" : `Nguồn mô phỏng · ${activeProject.name} ${activeProject.snapshot}`, artifact: activeId, artifactPrompt: text };
      setMessagesByAgent((current) => ({ ...current, [activeId]: [...current[activeId], reply] }));
      setSending(false); window.setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 40);
    }, 650);
  }

  if (!ready) return <div className="loading-screen"><span className="brand-mark"><BarChart3 /></span><p>Đang mở workspace…</p></div>;

  return <main className="app-shell">
    {sidebarOpen && <button className="mobile-overlay" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} />}
    <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
      <div className="window-row"><div className="traffic-lights" aria-hidden="true"><span /><span /><span /></div><button className="icon-button new-chat" aria-label="Tạo cuộc trò chuyện mới" onClick={newConversation}><Plus /></button><button className="icon-button mobile-close" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)}><X /></button></div>
      <label className="search-box"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm agent hoặc phân tích" /><kbd>⌘K</kbd></label>
      <nav className="agent-list" aria-label="Danh sách agent">{filteredAgents.map((agent) => <button key={agent.id} className={`agent-item ${activeId === agent.id ? "agent-item--active" : ""}`} onClick={() => chooseAgent(agent.id)}><AgentMark agent={agent} /><span className="agent-copy"><span className="agent-title"><strong>{agent.name}</strong><time>{agent.time}</time></span><span className="agent-role">{agent.role}</span><span className="agent-preview">{agent.preview}</span></span>{agent.unread && <span className="unread-dot" />}</button>)}</nav>
      <div className="profile-row"><span className="avatar">{user.name.split(" ").slice(-2).map((part) => part[0]).join("")}</span><span><strong>{user.name}</strong><small>{user.role} · {user.staffId}</small></span><button className="icon-button" aria-label="Đăng xuất" onClick={logout}><LogOut /></button></div>
    </aside>

    <section className="workspace">
      <header className="topbar"><button className="icon-button menu-button" onClick={() => setSidebarOpen(true)}><Menu /></button><AgentMark agent={activeAgent} size="sm" /><div className="header-copy"><strong>{activeAgent.name}</strong><span>{activeAgent.role}</span></div><span className="status-pill"><span /> Đang hoạt động</span><label className="project-select"><select value={projectId} onChange={(e) => setProjectId(e.target.value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><ChevronDown /></label><button className={`history-button ${historyOpen ? "history-button--active" : ""}`} onClick={() => setHistoryOpen(!historyOpen)}><History /><span>Lịch sử</span></button></header>
      <div className="workspace-body">
        <div className="conversation" role="log" aria-live="polite"><div className="conversation-inner">
          <div className="context-card"><span className="context-icon"><ChartNoAxesCombined /></span><span><small>PHẠM VI PHÂN TÍCH</small><strong>{activeProject.name} · {activeProject.snapshot}</strong></span><span className="context-meta"><Check /> Snapshot đã khóa · DQ {activeProject.dq}%</span></div>
          <AgentGuide agent={activeAgent} onPrompt={pickPrompt} />
          {activeId === "orchestrator" && <div className="participant-strip"><div><small>AGENT THAM GIA PHIÊN NÀY</small><strong>5 chuyên môn đang phối hợp</strong></div><div className="participant-list">{agents.slice(1).map((agent) => <button key={agent.id} title={agent.name} onClick={() => chooseAgent(agent.id)}><AgentMark agent={agent} size="sm" /><span>{agent.name}</span><i /></button>)}</div></div>}
          <div className="thread-label"><span>{messages.length ? "Hội thoại mô phỏng" : "Bắt đầu một phân tích mới"}</span></div>
          {messages.map((message) => {
            if (message.kind === "system") return <div key={message.id} className="system-message"><span>{message.text}</span></div>;
            if (message.kind === "user") return <div key={message.id} className="message-row message-row--user">{message.time && <time>{message.time}</time>}<div className="bubble bubble--user">{message.text}</div></div>;
            const authorAgent = agents.find((agent) => agent.name === message.author) ?? activeAgent;
            return <div key={message.id} className="message-row message-row--agent"><AgentMark agent={authorAgent} size="sm" /><div className="agent-message"><div className="message-meta"><strong>{message.author}</strong>{message.time && <time>{message.time}</time>}</div><div className="bubble bubble--agent">{message.text}</div>{message.artifact && <AgentArtifact agentId={message.artifact} projectId={projectId} prompt={message.artifactPrompt} compact />}{message.evidence && <button className="evidence-chip"><FileText /> {message.evidence}</button>}</div></div>;
          })}
          {sending && <div className="typing"><AgentMark agent={activeAgent} size="sm" /><span /><span /><span /></div>}<div ref={endRef} />
        </div></div>
        {historyOpen && <aside className="history-panel"><div className="history-header"><div><small>LỊCH SỬ PHÂN TÍCH</small><strong>{activeAgent.name}</strong></div><button className="icon-button" onClick={() => setHistoryOpen(false)}><X /></button></div>
          <section className="short-history"><div className="short-history-title"><span><Clock3 /> HOẠT ĐỘNG GẦN ĐÂY</span></div>{shortTermHistory.length ? <div className="short-history-list">{shortTermHistory.map((item) => { const itemAgent = agents.find((agent) => agent.id === item.agentId) ?? agents[0]; return <div className="short-history-item" key={item.id}><AgentMark agent={itemAgent} size="sm" /><span><strong>{item.prompt}</strong><small>{itemAgent.name} · {item.project}</small></span><time>{item.time}</time></div>; })}</div> : <div className="short-history-empty"><Clock3 /><span><strong>Chưa có hoạt động mới</strong><small>Câu hỏi gần đây sẽ xuất hiện tại đây.</small></span></div>}</section>
          <div className="history-divider"><span>RUN ĐÃ LƯU</span></div><div className="history-list">{conversationHistory.map((item, index) => <button key={item.id} className={index === 0 ? "history-item--active" : ""}><span className="history-icon"><Clock3 /></span><span><strong>{item.title}</strong><small>{item.detail}</small><time>{item.time}</time></span></button>)}</div><div className="history-note"><ShieldCheck /><p><strong>Lịch sử dài hạn được lưu theo run</strong><span>Lịch sử ngắn hạn phía trên sẽ được xóa khi tải lại trang.</span></p></div></aside>}
      </div>
      <div className="composer-wrap"><form className="composer" onSubmit={sendMessage}><button type="button" className="composer-action" aria-label="Thêm tệp"><Plus /></button><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Nhắn cho ${activeAgent.name} — nêu dự án, thời gian và điều bạn cần biết`} /><button type="button" className="composer-action" aria-label="Ghi âm"><Mic /></button><button type="submit" className="send-button" disabled={!draft.trim() || sending}><ArrowUp /></button></form><p>VDAgent có thể mắc lỗi. Hãy kiểm tra các bằng chứng quan trọng.</p></div>
    </section>
  </main>;
}
