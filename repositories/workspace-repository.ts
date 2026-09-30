import type { AreaMetric, ProjectSummary, PropertyUnit } from "@/types/project";
import type { Agent, AgentGuide, AgentId, AgentRun, ConversationHistoryItem, Message } from "@/types/workspace";

/** UI-facing boundary. A future API adapter can replace the mock without changing components. */
export interface WorkspaceRepository {
  getAgents(): readonly Agent[];
  getAgentGuide(agentId: AgentId): AgentGuide;
  getProjects(): readonly ProjectSummary[];
  getInitialMessages(): Record<AgentId, Message[]>;
  getInitialRuns(): Partial<Record<AgentId, AgentRun>>;
  getConversationHistory(): readonly ConversationHistoryItem[];
  getProjectUnits(projectId: string): PropertyUnit[];
  getAreaMetrics(projectId: string): AreaMetric[];
  getSlowMovingUnits(projectId: string, limit?: number): PropertyUnit[];
}
