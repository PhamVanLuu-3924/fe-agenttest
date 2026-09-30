import { ArrowRight, MessageSquareDashed } from "lucide-react";
import { AgentMark } from "@/components/shared/agent-mark";
import type { Agent } from "@/types/workspace";
import styles from "./conversation.module.css";

type EmptyConversationProps = {
  activeAgent: Agent;
  onSelectPrompt?: (prompt: string) => void;
};

export function EmptyConversation({ activeAgent, onSelectPrompt }: EmptyConversationProps) {
  const getAgentPrompts = (agentId: string) => {
    switch (agentId) {
      case "compare":
        return [
          "So với các dự án ngang phân khúc, River Gate lệch ở đâu?",
          "Dựng peer group đối sánh căn 2PN diện tích 68–74 m²",
          "Xếp hạng tốc độ hấp thụ các phân khu trong giỏ hàng",
        ];
      case "insight":
        return [
          "Nguyên nhân bán chậm có bằng chứng nào mạnh nhất?",
          "Giải thích chênh lệch hấp thụ giữa các phân khu",
          "Có yếu tố nào liên quan đến DOM vượt ngưỡng 90 ngày?",
        ];
      default:
        return [
          `Nêu yêu cầu phân tích dữ liệu cho ${activeAgent.name}`,
          "Kiểm tra các căn hộ có DOM vượt ngưỡng 90 ngày",
          "Tổng hợp báo cáo hiệu suất bán hàng tuần này",
        ];
    }
  };

  const prompts = getAgentPrompts(activeAgent.id);

  return (
    <div className={styles.emptyStateContainer} role="region" aria-label="Hội thoại rỗng">
      <div className={styles.emptyStateHeader}>
        <AgentMark agent={activeAgent} size="md" />
        <h3 className={styles.emptyStateTitle}>Bắt đầu hội thoại với {activeAgent.name}</h3>
        <p className={styles.emptyStateDesc}>
          Chưa có tin nhắn nào trong phiên này. Hãy chọn một câu hỏi gợi ý bên dưới hoặc nhập câu hỏi mới vào ô bên dưới.
        </p>
      </div>

      <div className={styles.emptyPromptsGrid}>
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className={styles.promptStarterBtn}
            onClick={() => onSelectPrompt?.(prompt)}
            aria-label={`Chọn câu hỏi: ${prompt}`}
          >
            <span>{prompt}</span>
            <ArrowRight size={13} style={{ color: "var(--token-brand, #2563eb)" }} />
          </button>
        ))}
      </div>

      <div>
        <span className={styles.reviewBadge}>Trạng thái đề xuất · Cần duyệt</span>
      </div>
    </div>
  );
}
