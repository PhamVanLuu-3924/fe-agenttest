import { AlertCircle, Clock, FileText, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { AgentMark } from "@/components/shared/agent-mark";
import { BouncingDots } from "@/components/shared/bouncing-dots";
import type { Agent } from "@/types/workspace";
import { ArtifactSkeleton } from "./artifact-skeleton";
import styles from "./conversation.module.css";
import type { ExtendedMessage } from "./types";

export type MessageItemProps = {
  message: ExtendedMessage;
  agent?: Agent;
  onRetry?: (messageId: string) => void;
  onOpenEvidence?: (evidence: string) => void;
  renderArtifact?: (message: ExtendedMessage) => ReactNode;
};

export function MessageItem({
  message,
  agent,
  onRetry,
  onOpenEvidence,
  renderArtifact,
}: MessageItemProps) {
  // 1. System Message
  if (message.kind === "system") {
    return (
      <div className="system-message" role="status" aria-label={`Thông báo hệ thống: ${message.text}`}>
        <span>{message.text}</span>
      </div>
    );
  }

  const isPending = message.status === "pending";
  const isFailed = message.status === "failed";

  // 2. User Message
  if (message.kind === "user") {
    return (
      <div
        className={`message-row message-row--user ${isFailed ? styles.failedRow : ""}`}
        role="article"
        aria-label={`Tin nhắn của Bạn ${message.time ? `lúc ${message.time}` : ""}`}
      >
        <div className={styles.userMeta}>
          <span className={styles.userAvatar} aria-hidden="true">
            BN
          </span>
          <span className={styles.userName}>Bạn</span>
          {message.time && <time className={styles.messageTime}>{message.time}</time>}
        </div>

        <div
          className={`bubble bubble--user ${isPending ? styles.pendingBubble : ""} ${
            isFailed ? styles.failedBubble : ""
          }`}
        >
          {message.text}
        </div>

        {/* Optimistic / Pending indicator */}
        {isPending && (
          <div className={styles.pendingIndicator} role="status" aria-live="polite">
            <BouncingDots label="Đang gửi tin nhắn" />
            <span>Đang gửi…</span>
          </div>
        )}

        {/* Failed / Retry indicator */}
        {isFailed && (
          <div className={styles.failedActions} role="alert">
            <span className={styles.failedNote}>
              <AlertCircle size={12} /> {message.errorMessage || "Gửi thất bại"}
            </span>
            <button
              type="button"
              className={styles.retryButton}
              onClick={() => onRetry?.(message.id)}
              aria-label="Thử gửi lại tin nhắn"
            >
              <RotateCcw size={11} /> Thử lại
            </button>
          </div>
        )}
      </div>
    );
  }

  // 3. Agent Message
  const authorName = message.author || agent?.name || "Agent";
  // Default badges per Figma spec if not explicitly set
  const badgeText =
    message.badge ||
    (agent?.id === "compare"
      ? "Đã đối chiếu 8 peers"
      : agent?.id === "insight"
      ? "2 insight · 1 giới hạn"
      : undefined);

  return (
    <div
      className={`message-row message-row--agent ${isFailed ? styles.failedRow : ""}`}
      role="article"
      aria-label={`Tin nhắn từ ${authorName} ${message.time ? `lúc ${message.time}` : ""}`}
    >
      {agent && <AgentMark agent={agent} size="sm" />}

      <div className="agent-message">
        <div className={styles.agentMeta}>
          <strong className={styles.agentName}>{authorName}</strong>
          {badgeText && <span className={styles.agentBadge}>{badgeText}</span>}
          {message.time && <time className={styles.messageTime}>{message.time}</time>}
        </div>

        <div
          className={`bubble bubble--agent ${isPending ? styles.pendingBubble : ""} ${
            isFailed ? styles.failedBubble : ""
          }`}
        >
          {message.text}
        </div>

        {/* Artifact Loading Skeleton or Rendered Artifact */}
        {message.isLoadingArtifact ? (
          <ArtifactSkeleton agentId={message.artifact || agent?.id} />
        ) : (
          renderArtifact && renderArtifact(message)
        )}

        {/* Evidence Chip */}
        {message.evidence && (
          <button
            type="button"
            className="evidence-chip"
            onClick={() => onOpenEvidence?.(message.evidence!)}
            aria-label={`Xem chi tiết bằng chứng: ${message.evidence}`}
          >
            <FileText size={11} />
            <span>{message.evidence}</span>
          </button>
        )}

        {/* Failed Agent Message Action */}
        {isFailed && (
          <div className={styles.failedActions} role="alert">
            <span className={styles.failedNote}>
              <AlertCircle size={12} /> {message.errorMessage || "Không thể tải phản hồi từ agent"}
            </span>
            <button
              type="button"
              className={styles.retryButton}
              onClick={() => onRetry?.(message.id)}
              aria-label="Thử tải lại phản hồi"
            >
              <RotateCcw size={11} /> Thử lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
