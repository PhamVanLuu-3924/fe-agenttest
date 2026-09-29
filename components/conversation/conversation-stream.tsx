import { ChartNoAxesCombined, Check, FileText } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { AgentMark } from "@/components/shared/agent-mark";
import { BouncingDots } from "@/components/shared/bouncing-dots";
import type { ProjectSummary } from "@/types/project";
import type { Agent, Message, WorkPhase } from "@/types/workspace";

type ConversationStreamProps = {
  activeAgent: Agent;
  agents: readonly Agent[];
  project: ProjectSummary;
  messages: Message[];
  sending: boolean;
  workPhase: WorkPhase;
  guide: ReactNode;
  collaboration?: ReactNode;
  endRef: RefObject<HTMLDivElement | null>;
  renderArtifact: (message: Message) => ReactNode;
};

export function ConversationStream({ activeAgent, agents, project, messages, sending, workPhase, guide, collaboration, endRef, renderArtifact }: ConversationStreamProps) {
  return <div className="conversation" role="log" aria-live="polite"><div className="conversation-inner">
    <div className="context-card"><span className="context-icon"><ChartNoAxesCombined /></span><span><small>PHẠM VI PHÂN TÍCH</small><strong>{project.name} · {project.snapshot}</strong></span><span className="context-meta"><Check /> Snapshot đã khóa · DQ {project.dq}%</span></div>
    {guide}
    {collaboration}
    <div className="thread-label"><span>{messages.length ? "Hội thoại mô phỏng" : "Bắt đầu một phân tích mới"}</span></div>
    {messages.map((message) => {
      if (message.kind === "system") return <div key={message.id} className="system-message"><span>{message.text}</span></div>;
      if (message.kind === "user") return <div key={message.id} className="message-row message-row--user">{message.time && <time>{message.time}</time>}<div className="bubble bubble--user">{message.text}</div></div>;
      const authorAgent = agents.find((agent) => agent.name === message.author) ?? activeAgent;
      return <div key={message.id} className="message-row message-row--agent"><AgentMark agent={authorAgent} size="sm" /><div className="agent-message"><div className="message-meta"><strong>{message.author}</strong>{message.time && <time>{message.time}</time>}</div><div className="bubble bubble--agent">{message.text}</div>{renderArtifact(message)}{message.evidence && <button className="evidence-chip"><FileText /> {message.evidence}</button>}</div></div>;
    })}
    {sending && <div className={`thinking-indicator thinking-indicator--${workPhase}`}><AgentMark agent={activeAgent} size="sm" /><div><strong>{workPhase === "receiving" ? `${activeAgent.name} đang tiếp nhận tin nhắn` : workPhase === "thinking" ? `${activeAgent.name} đang suy nghĩ` : "Các agent đang trao đổi trong nhóm"}</strong><span>{workPhase === "receiving" ? "Đang đọc phạm vi và mục tiêu phân tích" : workPhase === "thinking" ? "Đang chọn dữ liệu, rule và agent liên quan" : "Đang đối chiếu kết quả và hợp nhất bằng chứng"}</span></div><BouncingDots label="Hệ thống đang xử lý" /></div>}
    <div ref={endRef} />
  </div></div>;
}
