import { LogOut, Plus, Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { AgentMark } from "@/components/shared/agent-mark";
import { BouncingDots } from "@/components/shared/bouncing-dots";
import type { Agent, AgentGroup, AgentId, UserProfile } from "@/types/workspace";

type WorkspaceSidebarProps = {
  agents: readonly Agent[];
  activeId: AgentId;
  activeGroup?: AgentGroup;
  groupSummary?: ReactNode;
  user: UserProfile;
  query: string;
  open: boolean;
  getGroupMemberState: (group: AgentGroup, id: AgentId) => "queued" | "working" | "done";
  onQueryChange: (query: string) => void;
  onChooseAgent: (id: AgentId) => void;
  onNewConversation: () => void;
  onLogout: () => void;
  onClose: () => void;
};

export function WorkspaceSidebar({ agents, activeId, activeGroup, groupSummary, user, query, open, getGroupMemberState, onQueryChange, onChooseAgent, onNewConversation, onLogout, onClose }: WorkspaceSidebarProps) {
  return (
    <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
      <div className="window-row"><div className="traffic-lights" aria-hidden="true"><span /><span /><span /></div><button className="icon-button new-chat" aria-label="Tạo cuộc trò chuyện mới" onClick={onNewConversation}><Plus /></button><button className="icon-button mobile-close" aria-label="Đóng menu" onClick={onClose}><X /></button></div>
      <label className="search-box"><Search /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Tìm agent hoặc phân tích" /><kbd>⌘K</kbd></label>
      {groupSummary}
      <nav className="agent-list" aria-label="Danh sách agent">{agents.map((agent) => {
        const groupState = activeGroup?.memberIds.includes(agent.id) ? getGroupMemberState(activeGroup, agent.id) : null;
        const isAgentWorking = groupState === "working";
        return <button key={agent.id} className={`agent-item ${activeId === agent.id ? "agent-item--active" : ""} ${isAgentWorking ? "agent-item--working" : ""}`} onClick={() => onChooseAgent(agent.id)}><AgentMark agent={agent} /><span className="agent-copy"><span className="agent-title"><strong>{agent.name}</strong>{isAgentWorking ? <BouncingDots label={`${agent.name} đang làm việc`} /> : <time>{agent.time}</time>}</span><span className="agent-role">{agent.role}{groupState && <em>{groupState === "working" ? "Đang làm việc" : groupState === "done" ? "Đã hoàn tất" : "Đang chờ"}</em>}</span><span className="agent-preview">{agent.preview}</span></span>{agent.unread && !isAgentWorking && <span className="unread-dot" />}</button>;
      })}</nav>
      <div className="profile-row"><span className="avatar">{user.name.split(" ").slice(-2).map((part) => part[0]).join("")}</span><span><strong>{user.name}</strong><small>{user.role} · {user.staffId}</small></span><button className="icon-button" aria-label="Đăng xuất" onClick={onLogout}><LogOut /></button></div>
    </aside>
  );
}
