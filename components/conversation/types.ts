import type { ReactNode, RefObject } from "react";
import type { ProjectSummary } from "@/types/project";
import type { Agent, AgentId, Message, WorkPhase } from "@/types/workspace";

export type MessageStatus = "sent" | "pending" | "failed";

export type ExtendedMessage = Message & {
  status?: MessageStatus;
  errorMessage?: string;
  badge?: string;
  isLoadingArtifact?: boolean;
};

export type ConversationStreamProps = {
  activeAgent: Agent;
  agents: readonly Agent[];
  project: ProjectSummary;
  messages: (Message | ExtendedMessage)[];
  sending: boolean;
  workPhase: WorkPhase;
  guide: ReactNode;
  collaboration?: ReactNode;
  endRef: RefObject<HTMLDivElement | null>;
  renderArtifact: (message: Message | ExtendedMessage) => ReactNode;

  // Trạng thái hội thoại tổng thể (Loading, Error)
  status?: "idle" | "loading" | "error";
  streamError?: string;
  onRetryError?: () => void;

  // Hành vi tin nhắn (Retry, Evidence)
  onRetryMessage?: (messageId: string) => void;
  onOpenEvidence?: (evidence: string) => void;
  onSelectPrompt?: (prompt: string) => void;

  // Lịch sử cuộn ở đầu
  hasMoreHistory?: boolean;
  loadingMoreHistory?: boolean;
  onLoadMoreHistory?: () => void | Promise<void>;
};

export type ConversationState = {
  messages: ExtendedMessage[];
  sendStatus: "idle" | "sending" | "failed";
  pendingMessageId: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  error: string | null;
};

export type UseConversationOptions = {
  initialMessages?: ExtendedMessage[];
  mockScenario?: "normal" | "empty" | "long_history" | "failure";
  pageSize?: number;
  onSendRequest?: (text: string) => Promise<ExtendedMessage>;
};
