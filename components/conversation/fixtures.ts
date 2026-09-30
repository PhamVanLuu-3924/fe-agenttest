import type { ExtendedMessage } from "./types";

/**
 * Fixture 1: Conversation rỗng
 */
export const emptyConversationFixture: ExtendedMessage[] = [];

/**
 * Fixture 2: Lịch sử dài (200+ message)
 * Mô phỏng quá trình trao đổi đối chiếu peer group, DOM, hấp thụ giữa User và Agent.
 */
export function createLongHistoryFixture(count = 220): ExtendedMessage[] {
  const sampleTopics = [
    {
      user: "So sánh DOM River Gate với các dự án cùng phân khúc quận 4.",
      agent: "Nhóm 8 dự án cùng khu vực cho thấy DOM River Gate trung vị 124 ngày, cao hơn trung vị peer 34 ngày.",
      evidence: "Snapshot RG-2026-Q2 · N=8 peers",
      badge: "Đã đối chiếu 8 peers",
    },
    {
      user: "Tỷ lệ hấp thụ của nhóm căn 2PN diện tích 68–74 m² lệch bao nhiêu?",
      agent: "Tỷ lệ hấp thụ đạt 2,1%, thấp hơn trung vị peer 3,4% (chênh lệch -1,3 điểm %).",
      evidence: "Metric v1.2 · 2PN 71m²",
      badge: "8 peers",
    },
    {
      user: "Nguyên nhân bán chậm có bằng chứng nào mạnh nhất?",
      agent: "Giá chào cao hơn peer 6,8% và tỷ lệ căn view nội khu 54% cùng xuất hiện trong nhóm tồn kho trên 90 ngày.",
      evidence: "INS-024 · 3 bằng chứng",
      badge: "2 insight · 1 giới hạn",
    },
    {
      user: "Cần kiểm tra thêm yếu tố tầng và view trước khi kết luận không?",
      agent: "Đúng. Đối sánh vị trí mới ở cấp quận, chưa kiểm soát khác biệt về view và tầng cao, cần xem xét thêm giới hạn.",
      evidence: "Metadata view · 8% thiếu",
      badge: "Giới hạn mẫu",
    },
  ];

  const messages: ExtendedMessage[] = [];
  const baseTime = new Date("2026-09-24T08:00:00Z");

  for (let i = 0; i < count / 2; i++) {
    const topic = sampleTopics[i % sampleTopics.length];
    const userTime = new Date(baseTime.getTime() + i * 180000);
    const agentTime = new Date(userTime.getTime() + 60000);

    const timeStrUser = userTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const timeStrAgent = agentTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    messages.push({
      id: `hist-user-${i + 1}`,
      kind: "user",
      text: `${topic.user} (#${i + 1})`,
      time: timeStrUser,
      status: "sent",
    });

    messages.push({
      id: `hist-agent-${i + 1}`,
      kind: "agent",
      author: i % 2 === 0 ? "So sánh Agent" : "Insight Agent",
      text: `${topic.agent} (Bản ghi thứ ${i + 1})`,
      time: timeStrAgent,
      status: "sent",
      evidence: topic.evidence,
      badge: topic.badge,
    });
  }

  return messages;
}

/**
 * Fixture 3: Kịch bản gửi thất bại và lỗi nghiệp vụ
 */
export const failedConversationFixture: ExtendedMessage[] = [
  {
    id: "fail-init-1",
    kind: "system",
    text: "Phiên phân tích đối chiếu peer group bắt đầu lúc 09:15",
  },
  {
    id: "fail-user-1",
    kind: "user",
    text: "So với các dự án ngang phân khúc, River Gate lệch ở đâu?",
    time: "09:20",
    status: "sent",
  },
  {
    id: "fail-agent-1",
    kind: "agent",
    author: "So sánh Agent",
    text: "Nhóm 8 dự án cùng khu vực và diện tích ±10% cho thấy DOM cao hơn trung vị 34 ngày.",
    time: "09:21",
    status: "sent",
    evidence: "8 peers · snapshot 24/09",
    badge: "Đã đối chiếu 8 peers",
  },
  {
    id: "fail-user-2",
    kind: "user",
    text: "Tập trung phân tích các căn view nội khu tầng 10–18 xem giá chào lệch bao nhiêu?",
    time: "09:25",
    status: "failed",
    errorMessage: "Lỗi mạng hoặc timeout khi truy vấn bộ lọc tầng (DQ_TIMEOUT_GATEWAY)",
  },
];
