import type { ElementType } from "react";

export type AgentId = "orchestrator" | "data" | "compare" | "insight" | "chart" | "report";

export type Agent = {
  id: AgentId;
  name: string;
  role: string;
  time: string;
  preview: string;
  color: string;
  icon: ElementType;
  unread?: boolean;
};

export type Message = {
  id: string;
  kind: "user" | "agent" | "system";
  text: string;
  author?: string;
  time?: string;
  evidence?: string;
  artifact?: AgentId;
  artifactPrompt?: string;
};

export type UserProfile = { name: string; email: string; staffId: string; role: string };
export type ShortTermHistory = { id: string; agentId: AgentId; prompt: string; project: string; time: string };
export type RunPhase = "idle" | "receiving" | "thinking" | "collaborating" | "complete" | "partial" | "failed" | "retrying" | "cancelling" | "cancelled";
export type WorkPhase = RunPhase;
export type RunTaskState = "queued" | "running" | "success" | "failed" | "skipped";
export type RunTask = {
  id: string;
  agentId: AgentId;
  title: string;
  detail: string;
  state: RunTaskState;
};
export type AgentRun = {
  id: string;
  title: string;
  prompt: string;
  projectId: string;
  startedAt: string;
  phase: RunPhase;
  tasks: RunTask[];
  pendingReviewCount?: number;
  error?: string;
};
export type AgentGroup = { id: string; title: string; prompt: string; memberIds: AgentId[]; phase: Exclude<RunPhase, "idle"> };
export type AgentGuide = { purpose: string; needs: string; outputs: readonly string[]; prompts: readonly string[] };
export type ConversationHistoryItem = { id: string; title: string; detail: string; time: string };
