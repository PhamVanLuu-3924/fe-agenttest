"use client";

import {
  ArrowRight, ArrowUp, BarChart3, ChartNoAxesCombined, Check, ChevronDown, Clock3,
  Database, FileCheck2, FileText, History, Lightbulb, LogOut, Menu, Mic, Plus,
  Search, ShieldCheck, Sparkles, Users, X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ElementType } from "react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { agentGuides, conversationHistory, projects, propertyUnits } from "@/data/mock-real-estate";

type AgentId = keyof typeof agentGuides;
type Agent = { id: AgentId; name: string; role: string; time: string; preview: string; color: string; icon: ElementType; unread?: boolean };
type Message = { id: string; kind: "user" | "agent" | "system"; text: string; author?: string; time?: string; evidence?: string };
type UserProfile = { name: string; email: string; staffId: string; role: string };

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
    { id: "o8", kind: "agent", author: "Điều phối", text: "Kết quả đã sẵn sàng. Báo cáo đang tạo bản nháp 6 phần; 2 bản ghi thiếu dữ liệu được giữ ngoài kết luận chính để bạn review.", time: "09:42" },
  ],
  data: [{ id: "d1", kind: "agent", author: "Dữ liệu", text: "Tôi đã nạp snapshot Green Avenue Q2/2026. Bạn có thể hỏi theo dự án, phân khu, loại căn, mã căn hoặc khoảng thời gian.", time: "09:40" }],
  compare: [{ id: "c1", kind: "agent", author: "So sánh", text: "Tôi đang có bộ rule peer group: cùng loại căn, diện tích ±10%, cùng giai đoạn mở bán và tối thiểu 5 peers.", time: "09:38" }],
  insight: [{ id: "i1", kind: "agent", author: "Insight", text: "Tôi chỉ diễn giải từ metric đã xác thực. Nếu bằng chứng chưa đủ, kết quả sẽ nêu rõ giới hạn thay vì suy đoán.", time: "09:35" }],
  chart: [{ id: "ch1", kind: "agent", author: "Biểu đồ", text: "Tôi có thể dựng biểu đồ DOM, giá/m² và tỷ lệ hấp thụ từ dữ liệu canonical của dự án.", time: "09:31" }],
  report: [{ id: "r1", kind: "agent", author: "Báo cáo", text: "Tôi có thể tạo báo cáo cho Sales Manager hoặc Project Director từ các artifact đã được kiểm chứng.", time: "09:28" }],
};

function AgentMark({ agent, size = "md" }: { agent: Agent; size?: "sm" | "md" }) {
  const Icon = agent.icon;
  if (agent.id === "orchestrator") return <span className={`agent-mark orchestrator-mark ${size === "sm" ? "agent-mark--sm" : ""}`} aria-label="Điều phối nhiều agent"><Sparkles className="orchestrator-core" /><i className="orb orb-blue" /><i className="orb orb-purple" /><i className="orb orb-green" /></span>;
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

function MockArtifact({ agentId }: { agentId: AgentId }) {
  if (agentId === "data") return <div className="artifact-card"><div className="artifact-title"><span><Database /> Dữ liệu mẫu</span><small>6 / 1.248 bản ghi</small></div><div className="data-table-wrap"><table><thead><tr><th>Mã căn</th><th>Phân khu</th><th>Loại</th><th>Giá (tỷ)</th><th>DOM</th></tr></thead><tbody>{propertyUnits.slice(0, 4).map((unit) => <tr key={unit.code}><td>{unit.code}</td><td>{unit.area}</td><td>{unit.type}</td><td>{unit.listPrice}</td><td><b className={unit.daysOnMarket > 90 ? "danger" : ""}>{unit.daysOnMarket} ngày</b></td></tr>)}</tbody></table></div></div>;
  if (agentId === "compare") return <div className="artifact-card comparison-preview"><div className="artifact-title"><span><Users /> Benchmark mẫu</span><small>Peer group v1.2</small></div><div className="metric-row"><span>Riverside<b>54,8%</b></span><span className="delta">−14,2 điểm %</span><span>Peer median<b>69,0%</b></span></div></div>;
  if (agentId === "insight") return <div className="artifact-card insight-preview"><div className="artifact-title"><span><Lightbulb /> Insight mẫu</span><small>Độ tin cậy: Khá</small></div><strong>Giá/m² cao hơn peer 8,6%</strong><p>Có liên hệ với tốc độ hấp thụ thấp; cần thêm dữ liệu ưu đãi để kiểm chứng.</p></div>;
  if (agentId === "chart") return <div className="artifact-card chart-preview"><div className="artifact-title"><span><BarChart3 /> DOM theo phân khu</span><small>Q2/2026</small></div><div className="bars"><span style={{ height: "78%" }}><b>128</b><i>Riverside</i></span><span style={{ height: "46%" }}><b>78</b><i>Garden</i></span><span style={{ height: "29%" }}><b>48</b><i>Parkside</i></span></div></div>;
  if (agentId === "report") return <div className="artifact-card report-preview"><div className="report-icon"><FileCheck2 /></div><div><small>BẢN NHÁP V1</small><strong>Báo cáo hiệu suất bán hàng Q2/2026</strong><p>6 phần · 4 biểu đồ · 12 evidence · Chờ bạn review</p></div><button>Xem trước</button></div>;
  return null;
}

export function ChatWorkspace() {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<UserProfile>({ name: "Nguyễn Minh Anh", email: "", staffId: "SO-0248", role: "Sales Operations" });
  const [activeId, setActiveId] = useState<AgentId>("orchestrator");
  const [projectId, setProjectId] = useState(projects[0].id);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [messagesByAgent, setMessagesByAgent] = useState(initialMessages);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const saved = window.localStorage.getItem("vdagent-user");
      if (!saved) { router.replace("/login"); return; }
      try { setUser(JSON.parse(saved) as UserProfile); } catch { window.localStorage.removeItem("vdagent-user"); router.replace("/login"); return; }
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [router]);

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
    setDraft(""); setSending(true);
    window.setTimeout(() => {
      const response = activeId === "orchestrator" ? "Tôi đã ghi nhận phạm vi Green Avenue Q2/2026. Tôi sẽ giao Dữ liệu kiểm tra snapshot, So sánh dựng peer group, Insight diễn giải nguyên nhân, Biểu đồ tạo evidence và Báo cáo tổng hợp bản nháp để bạn duyệt."
        : activeId === "data" ? "Trong dữ liệu mẫu có 31 căn DOM trên 90 ngày. Riverside chiếm tỷ trọng lớn nhất; GA-RS-1208 đang có DOM 128 ngày và giá chào bán 6,12 tỷ đồng."
        : activeId === "compare" ? "Riverside đạt hấp thụ 54,8%, thấp hơn trung vị peer group 14,2 điểm %. Nhóm so sánh sử dụng cùng loại căn và diện tích ±10%."
        : activeId === "insight" ? "Tín hiệu đáng chú ý là giá/m² cao hơn peer 8,6%. Đây là tương quan từ dữ liệu hiện có, không phải kết luận nhân quả."
        : activeId === "chart" ? "Tôi đã chuẩn bị ChartSpec DOM theo phân khu: Riverside 128 ngày, Garden 78 ngày, Parkside 48 ngày, kèm liên kết về snapshot nguồn."
        : "Tôi đã tạo khung báo cáo 6 phần cho Sales Manager. Bản nháp giữ riêng các claim thiếu evidence để bạn review trước khi hoàn tất.";
      const reply: Message = { id: crypto.randomUUID(), kind: "agent", author: activeAgent.name, text: response, time: now, evidence: activeId === "orchestrator" ? "5 agent tham gia · Run RUN-025" : `Nguồn mock · ${activeProject.name} ${activeProject.snapshot}` };
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
          {activeId !== "orchestrator" && <MockArtifact agentId={activeId} />}
          <div className="thread-label"><span>{messages.length ? "Hội thoại mô phỏng" : "Bắt đầu một phân tích mới"}</span></div>
          {messages.map((message) => {
            if (message.kind === "system") return <div key={message.id} className="system-message"><span>{message.text}</span></div>;
            if (message.kind === "user") return <div key={message.id} className="message-row message-row--user">{message.time && <time>{message.time}</time>}<div className="bubble bubble--user">{message.text}</div></div>;
            const authorAgent = agents.find((agent) => agent.name === message.author) ?? activeAgent;
            return <div key={message.id} className="message-row message-row--agent"><AgentMark agent={authorAgent} size="sm" /><div className="agent-message"><div className="message-meta"><strong>{message.author}</strong>{message.time && <time>{message.time}</time>}</div><div className="bubble bubble--agent">{message.text}</div>{message.evidence && <button className="evidence-chip"><FileText /> {message.evidence}</button>}</div></div>;
          })}
          {sending && <div className="typing"><AgentMark agent={activeAgent} size="sm" /><span /><span /><span /></div>}<div ref={endRef} />
        </div></div>
        {historyOpen && <aside className="history-panel"><div className="history-header"><div><small>LỊCH SỬ PHÂN TÍCH</small><strong>{activeAgent.name}</strong></div><button className="icon-button" onClick={() => setHistoryOpen(false)}><X /></button></div><div className="history-list">{conversationHistory.map((item, index) => <button key={item.id} className={index === 0 ? "history-item--active" : ""}><span className="history-icon"><Clock3 /></span><span><strong>{item.title}</strong><small>{item.detail}</small><time>{item.time}</time></span></button>)}</div><div className="history-note"><ShieldCheck /><p><strong>Lịch sử được lưu theo run</strong><span>Mỗi phiên giữ nguyên snapshot, agent tham gia và bằng chứng đã sử dụng.</span></p></div></aside>}
      </div>
      <div className="composer-wrap"><form className="composer" onSubmit={sendMessage}><button type="button" className="composer-action" aria-label="Thêm tệp"><Plus /></button><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Nhắn cho ${activeAgent.name} — nêu dự án, thời gian và điều bạn cần biết`} /><button type="button" className="composer-action" aria-label="Ghi âm"><Mic /></button><button type="submit" className="send-button" disabled={!draft.trim() || sending}><ArrowUp /></button></form><p>VDAgent có thể mắc lỗi. Hãy kiểm tra các bằng chứng quan trọng.</p></div>
    </section>
  </main>;
}
