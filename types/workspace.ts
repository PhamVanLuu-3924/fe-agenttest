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
export type WorkPhase = "idle" | "receiving" | "thinking" | "collaborating" | "complete";
export type AgentGroup = { id: string; title: string; prompt: string; memberIds: AgentId[]; phase: Exclude<WorkPhase, "idle"> };
export type AgentGuide = { purpose: string; needs: string; outputs: readonly string[]; prompts: readonly string[] };
export type ConversationHistoryItem = { id: string; title: string; detail: string; time: string };
