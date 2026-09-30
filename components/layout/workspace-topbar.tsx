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
  return <header className="topbar topbar--luu"><button type="button" className="icon-button menu-button" aria-label="Mở điều hướng agent" onClick={onOpenSidebar}><Menu /></button><AgentMark agent={agent} size="sm" /><div className="header-copy"><strong>{agent.name}</strong><span>{agent.role}</span></div><span className="status-pill"><span /> Đang hoạt động</span><label className="project-select"><span className="visually-hidden">Chọn dự án</span><select aria-label="Chọn dự án" value={projects.length ? projectId : ""} disabled={!projects.length} onChange={(event) => onProjectChange(event.target.value)}>{projects.length ? projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.snapshot}</option>) : <option value="">Không có project</option>}</select><ChevronDown aria-hidden="true" /></label><button type="button" aria-pressed={historyOpen} className={`history-button ${historyOpen ? "history-button--active" : ""}`} onClick={onToggleHistory}><History aria-hidden="true" /><span>Lịch sử</span></button></header>;
}
