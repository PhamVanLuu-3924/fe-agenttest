import { ChevronDown, History, Menu } from "lucide-react";
import { AgentMark } from "@/components/shared/agent-mark";
import type { ProjectSummary } from "@/types/project";
import type { Agent } from "@/types/workspace";

type WorkspaceTopbarProps = {
  agent: Agent;
  projects: readonly ProjectSummary[];
  projectId: string;
  historyOpen: boolean;
  onOpenSidebar: () => void;
  onProjectChange: (projectId: string) => void;
  onToggleHistory: () => void;
};

export function WorkspaceTopbar({ agent, projects, projectId, historyOpen, onOpenSidebar, onProjectChange, onToggleHistory }: WorkspaceTopbarProps) {
  return <header className="topbar"><button className="icon-button menu-button" onClick={onOpenSidebar}><Menu /></button><AgentMark agent={agent} size="sm" /><div className="header-copy"><strong>{agent.name}</strong><span>{agent.role}</span></div><span className="status-pill"><span /> Đang hoạt động</span><label className="project-select"><select value={projectId} onChange={(event) => onProjectChange(event.target.value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><ChevronDown /></label><button className={`history-button ${historyOpen ? "history-button--active" : ""}`} onClick={onToggleHistory}><History /><span>Lịch sử</span></button></header>;
}
