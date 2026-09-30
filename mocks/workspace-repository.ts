import { BarChart3, Database, FileText, Lightbulb, Sparkles, Users } from "lucide-react";
import {
  getAreaMetrics,
  getProjectUnits,
  getSlowMovingUnits,
  projects,
} from "@/data/mock-real-estate";
import type { WorkspaceRepository } from "@/repositories/workspace-repository";
import type { Agent, AgentGroup, AgentGuide, AgentId, AgentRun, ConversationHistoryItem, Message, RunPhase, RunTaskState } from "@/types/workspace";

export const mockAgents: Agent[] = [
  { id: "orchestrator", name: "Điều phối", role: "Orchestrator", time: "09:42", preview: "Đã hoàn tất phân tích giỏ hàng Q2.", color: "#ef8354", icon: Sparkles },
  { id: "data", name: "Dữ liệu", role: "Data Agent", time: "09:40", preview: "Đã kiểm tra 1.248 bản ghi.", color: "#3e8bff", icon: Database },
  { id: "compare", name: "So sánh", role: "Compare Agent", time: "09:38", preview: "Tìm thấy 3 nhóm tương đồng.", color: "#8b5cf6", icon: Users },
  { id: "insight", name: "Insight", role: "Insight Agent", time: "09:35", preview: "2 nhận định cần bạn xem lại.", color: "#10a985", icon: Lightbulb, unread: true },
  { id: "chart", name: "Biểu đồ", role: "Chart Agent", time: "09:31", preview: "Đã tạo 4 biểu đồ bằng chứng.", color: "#e9a23b", icon: BarChart3 },
  { id: "report", name: "Báo cáo", role: "Report Agent", time: "09:28", preview: "Bản nháp v1 sẵn sàng duyệt.", color: "#ec5c8d", icon: FileText },
];

export const defaultCollaborationGroup: AgentGroup = {
  id: "group-slow-moving-q2",
  title: "Nhóm điều tra căn bán chậm",
  prompt: "Phân tích căn bán chậm và các yếu tố liên quan",
  memberIds: ["data", "compare", "insight", "chart", "report"],
  phase: "partial",
};

const runTasks: AgentRun["tasks"] = [
  { id: "task-data", agentId: "data", title: "Kiểm tra dữ liệu", detail: "1.248 bản ghi · DQ 98,7%", state: "success" },
  { id: "task-compare", agentId: "compare", title: "Đối chuẩn peer group", detail: "5 nhóm tương đồng", state: "success" },
  { id: "task-insight", agentId: "insight", title: "Tổng hợp insight", detail: "3 bằng chứng đã liên kết", state: "success" },
  { id: "task-chart", agentId: "chart", title: "Dựng biểu đồ", detail: "4 biểu đồ có thể truy vết", state: "success" },
  { id: "task-report", agentId: "report", title: "Hoàn thiện báo cáo", detail: "Chờ bạn duyệt 2 claim", state: "queued" },
];

const taskStates: Record<Exclude<RunPhase, "idle">, RunTaskState[]> = {
  receiving: ["queued", "queued", "queued", "queued", "queued"],
  thinking: ["running", "queued", "queued", "queued", "queued"],
  collaborating: ["success", "running", "running", "running", "queued"],
  complete: ["success", "success", "success", "success", "success"],
  partial: ["success", "success", "success", "success", "queued"],
  failed: ["success", "failed", "skipped", "skipped", "skipped"],
  retrying: ["success", "running", "queued", "queued", "queued"],
  cancelling: ["success", "running", "queued", "queued", "queued"],
  cancelled: ["success", "skipped", "skipped", "skipped", "skipped"],
};

function makeRunFixture(phase: Exclude<RunPhase, "idle">, overrides: Partial<AgentRun> = {}): AgentRun {
  const tasks = runTasks.map((task, index) => {
    const detail = phase === "failed" && index === 1 ? "Không thể hoàn tất bước đối chuẩn" : phase === "retrying" && index === 1 ? "Đang thử lại với dữ liệu đã lưu" : task.detail;
    return { ...task, state: taskStates[phase][index], detail };
  });
  return {
    id: `run-${phase}`,
    title: "Căn bán chậm · Q2/2026",
    prompt: "Phân tích căn bán chậm và các yếu tố liên quan",
    projectId: "green-avenue",
    startedAt: "09:33",
    phase,
    tasks,
    pendingReviewCount: phase === "partial" ? 2 : 0,
    error: phase === "failed" ? "Một agent chưa thể hoàn tất; dữ liệu đã xử lý vẫn được giữ lại." : undefined,
    ...overrides,
  };
}

/** Fixtures cover every state without requiring API or SSE. */
export const mockRunFixtures: Record<Exclude<RunPhase, "idle">, AgentRun> = {
  receiving: makeRunFixture("receiving"),
  thinking: makeRunFixture("thinking"),
  collaborating: makeRunFixture("collaborating"),
  partial: makeRunFixture("partial", { id: "run-024" }),
  complete: makeRunFixture("complete"),
  failed: makeRunFixture("failed"),
  retrying: makeRunFixture("retrying"),
  cancelling: makeRunFixture("cancelling"),
  cancelled: makeRunFixture("cancelled"),
};

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

const conversationHistory: ConversationHistoryItem[] = [
  { id: "run-024", title: "Căn bán chậm Green Avenue", detail: "6 agent · Hoàn tất", time: "Hôm nay, 09:32" },
  { id: "run-019", title: "So sánh Riverside và Garden", detail: "3 agent · Hoàn tất", time: "Hôm qua, 16:18" },
  { id: "run-012", title: "Báo cáo hấp thụ tháng 5", detail: "4 agent · Bản nháp", time: "18/06/2026" },
  { id: "run-006", title: "Kiểm tra chất lượng CRM", detail: "1 agent · Có cảnh báo", time: "11/06/2026" },
];

const agentGuides: Record<AgentId, AgentGuide> = {
  orchestrator: { purpose: "Điều phối một yêu cầu phân tích hoàn chỉnh qua nhiều agent và trả về kết quả có bằng chứng.", needs: "Nêu dự án, khoảng thời gian và câu hỏi kinh doanh bạn cần giải quyết.", outputs: ["Kế hoạch xử lý", "Kết quả hợp nhất", "Agent và bằng chứng đã dùng"], prompts: ["Phân tích căn bán chậm tại Green Avenue trong Q2/2026", "Điều tra nguyên nhân hấp thụ thấp của phân khu Riverside", "Tạo báo cáo tuần cho Sales Manager"] },
  data: { purpose: "Tra cứu kho dữ liệu, kiểm tra chất lượng và tính metric định lượng.", needs: "Cho biết dự án, phân khu, loại căn, thời gian hoặc mã căn cần kiểm tra.", outputs: ["Dataset đã lọc", "Metric chuẩn", "Cảnh báo chất lượng dữ liệu"], prompts: ["Liệt kê các căn có DOM trên 90 ngày", "Kiểm tra dữ liệu thiếu trong snapshot Q2/2026", "Tính giá trung bình mỗi m² theo phân khu"] },
  compare: { purpose: "Tạo nhóm căn tương đồng và so sánh hiệu suất theo rule đã cấu hình.", needs: "Chọn căn hoặc phân khu gốc và tiêu chí muốn so sánh.", outputs: ["Peer group", "Benchmark", "Mức chênh lệch và xếp hạng"], prompts: ["So sánh Riverside với các phân khu tương đồng", "Tìm 5 căn tương đồng với GA-RI-0001", "Xếp hạng tốc độ hấp thụ các phân khu"] },
  insight: { purpose: "Diễn giải pattern nghiệp vụ từ metric và bằng chứng đã được xác thực.", needs: "Chọn insight, metric hoặc kết quả so sánh bạn muốn diễn giải.", outputs: ["Nhận định có căn cứ", "Mức tin cậy", "Giới hạn của kết luận"], prompts: ["Yếu tố nào liên quan tới tốc độ bán chậm?", "Giải thích chênh lệch hấp thụ tại Riverside", "Insight nào cần Sales Manager chú ý?"] },
  chart: { purpose: "Biến metric thành biểu đồ và giữ liên kết về dữ liệu nguồn.", needs: "Nêu metric, chiều phân tích và dạng biểu đồ mong muốn.", outputs: ["Biểu đồ bằng chứng", "ChartSpec", "Liên kết dữ liệu nguồn"], prompts: ["Vẽ biểu đồ DOM theo phân khu", "Trực quan hóa hấp thụ theo loại căn", "So sánh giá/m² và DOM của nhóm 2PN"] },
  report: { purpose: "Tổng hợp metric, insight, biểu đồ và evidence thành báo cáo để review.", needs: "Chọn phạm vi báo cáo, đối tượng đọc và các phần cần nhấn mạnh.", outputs: ["Bản nháp 6 phần", "Danh mục bằng chứng", "Điểm cần người dùng duyệt"], prompts: ["Tạo báo cáo Green Avenue Q2 cho Sales Manager", "Tóm tắt executive summary trong một trang", "Kiểm tra claim nào còn thiếu evidence"] },
};

export const mockWorkspaceRepository: WorkspaceRepository = {
  getAgents: () => mockAgents,
  getAgentGuide: (agentId) => agentGuides[agentId],
  getProjects: () => projects,
  getInitialMessages: () => Object.fromEntries(
    Object.entries(initialMessages).map(([key, messages]) => [key, messages.map((message) => ({ ...message }))]),
  ) as Record<AgentId, Message[]>,
  getInitialRuns: () => ({ orchestrator: { ...mockRunFixtures.partial, tasks: mockRunFixtures.partial.tasks.map((task) => ({ ...task })) } }),
  getConversationHistory: () => conversationHistory,
  getProjectUnits,
  getAreaMetrics,
  getSlowMovingUnits,
};
