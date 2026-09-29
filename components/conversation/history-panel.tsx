import { Clock3, ShieldCheck, X } from "lucide-react";
import { AgentMark } from "@/components/shared/agent-mark";
import type { Agent, ConversationHistoryItem, ShortTermHistory } from "@/types/workspace";

type HistoryPanelProps = {
  activeAgent: Agent;
  agents: readonly Agent[];
  recentItems: ShortTermHistory[];
  savedRuns: readonly ConversationHistoryItem[];
  onClose: () => void;
};

export function HistoryPanel({ activeAgent, agents, recentItems, savedRuns, onClose }: HistoryPanelProps) {
  return <aside className="history-panel"><div className="history-header"><div><small>LỊCH SỬ PHÂN TÍCH</small><strong>{activeAgent.name}</strong></div><button className="icon-button" onClick={onClose}><X /></button></div>
    <section className="short-history"><div className="short-history-title"><span><Clock3 /> HOẠT ĐỘNG GẦN ĐÂY</span></div>{recentItems.length ? <div className="short-history-list">{recentItems.map((item) => { const itemAgent = agents.find((agent) => agent.id === item.agentId) ?? agents[0]; return <div className="short-history-item" key={item.id}><AgentMark agent={itemAgent} size="sm" /><span><strong>{item.prompt}</strong><small>{itemAgent.name} · {item.project}</small></span><time>{item.time}</time></div>; })}</div> : <div className="short-history-empty"><Clock3 /><span><strong>Chưa có hoạt động mới</strong><small>Câu hỏi gần đây sẽ xuất hiện tại đây.</small></span></div>}</section>
    <div className="history-divider"><span>RUN ĐÃ LƯU</span></div><div className="history-list">{savedRuns.map((item, index) => <button key={item.id} className={index === 0 ? "history-item--active" : ""}><span className="history-icon"><Clock3 /></span><span><strong>{item.title}</strong><small>{item.detail}</small><time>{item.time}</time></span></button>)}</div><div className="history-note"><ShieldCheck /><p><strong>Lịch sử dài hạn được lưu theo run</strong><span>Lịch sử ngắn hạn phía trên sẽ được xóa khi tải lại trang.</span></p></div>
  </aside>;
}
