import { Database, LogOut, Plus, Search, X } from "lucide-react";
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
    <aside className={`sidebar sidebar--luu ${open ? "sidebar--open" : ""}`}>
      <div className="window-row sidebar-brand-row"><span className="sidebar-brand-mark"><Database aria-hidden="true" /></span><strong>VDAgent</strong><span className="sidebar-plan">PRO</span><button className="icon-button new-chat" aria-label="Tạo cuộc trò chuyện mới" onClick={onNewConversation}><Plus /></button><button className="icon-button mobile-close" aria-label="Đóng menu" onClick={onClose}><X /></button></div>
      <div className="sidebar-section-label">AGENTS</div>
      <label className="search-box"><Search aria-hidden="true" /><input aria-label="Tìm agent" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Tìm agent" /><kbd>⌘K</kbd></label>
      {groupSummary}
      <nav className="agent-list" aria-label="Điều hướng agent">{agents.map((agent) => {
        const groupState = activeGroup?.memberIds.includes(agent.id) ? getGroupMemberState(activeGroup, agent.id) : null;
        const isAgentWorking = groupState === "working";
        return <button type="button" key={agent.id} aria-current={activeId === agent.id ? "page" : undefined} aria-label={`${agent.name}, ${agent.role}${groupState ? `, ${groupState === "working" ? "đang làm việc" : groupState === "done" ? "đã hoàn tất" : "đang chờ"}` : ""}`} className={`agent-item ${activeId === agent.id ? "agent-item--active" : ""} ${isAgentWorking ? "agent-item--working" : ""}`} onClick={() => onChooseAgent(agent.id)}><AgentMark agent={agent} size="sm" /><span className="agent-copy"><span className="agent-title"><strong>{agent.name}</strong>{isAgentWorking ? <BouncingDots label={`${agent.name} đang làm việc`} /> : agent.unread ? <i className="agent-nav-dot" /> : null}</span>{groupState && <span className="agent-nav-state">{groupState === "working" ? "Đang làm việc" : groupState === "done" ? "Đã hoàn tất" : "Đang chờ"}</span>}</span></button>;
      })}</nav>
      <section className="sidebar-snapshot" aria-label="Dữ liệu minh họa"><span>MOCK WORKSPACE</span><strong>Snapshot mô phỏng</strong><small><i />Dữ liệu từ fixture</small></section>
      <div className="profile-row"><span className="avatar" aria-hidden="true">{user.name.split(" ").slice(-2).map((part) => part[0]).join("")}</span><span><strong>{user.name}</strong><small>{user.role} · {user.staffId}</small></span><button type="button" className="icon-button" aria-label="Đăng xuất" onClick={onLogout}><LogOut /></button></div>
    </aside>
  );
}
