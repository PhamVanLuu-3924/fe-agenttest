import {
  AlertCircle,
  ArrowDown,
  ChartNoAxesCombined,
  Check,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AgentMark } from "@/components/shared/agent-mark";
import { BouncingDots } from "@/components/shared/bouncing-dots";
import { CompareResult, InsightResult } from "@/components/results/analysis";
import { ArtifactSkeleton } from "./artifact-skeleton";
import styles from "./conversation.module.css";
import { EmptyConversation } from "./empty-conversation";
import { MessageItem } from "./message-item";
import type { ConversationStreamProps } from "./types";

export function ConversationStream({
  activeAgent,
  agents,
  project,
  messages,
  sending,
  workPhase,
  guide,
  collaboration,
  endRef,
  renderArtifact,
  status = "idle",
  streamError,
  onRetryError,
  onRetryMessage,
  onOpenEvidence,
  onSelectPrompt,
  hasMoreHistory,
  loadingMoreHistory,
  onLoadMoreHistory,
}: ConversationStreamProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showNewMessagePill, setShowNewMessagePill] = useState(false);

  const prevScrollHeightRef = useRef<number>(0);
  const prevScrollTopRef = useRef<number>(0);
  const prevMessagesLengthRef = useRef<number>(messages.length);
  const prevFirstMessageIdRef = useRef<string | undefined>(messages[0]?.id);

  // Monitor scroll position
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 120;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom <= threshold;
    setIsNearBottom(nearBottom);
    if (nearBottom) {
      setShowNewMessagePill(false);
    }
  };

  // Keep scroll at bottom on new message, or preserve position on prepending history
  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const currentLength = messages.length;
    const prevLength = prevMessagesLengthRef.current;
    const currentFirstId = messages[0]?.id;
    const prevFirstId = prevFirstMessageIdRef.current;

    // 1. Prepending history at top: Preserve visual scroll position
    if (currentLength > prevLength && currentFirstId !== prevFirstId && prevFirstId !== undefined) {
      const heightDifference = el.scrollHeight - prevScrollHeightRef.current;
      el.scrollTop = prevScrollTopRef.current + heightDifference;
    }
    // 2. Appending new messages at bottom
    else if (currentLength > prevLength) {
      if (isNearBottom) {
        endRef?.current?.scrollIntoView({ behavior: "smooth" });
        requestAnimationFrame(() => setShowNewMessagePill(false));
      } else {
        // User is reviewing earlier conversation: do not interrupt view
        requestAnimationFrame(() => setShowNewMessagePill(true));
      }
    }

    // Save snapshot for next render
    prevScrollHeightRef.current = el.scrollHeight;
    prevScrollTopRef.current = el.scrollTop;
    prevMessagesLengthRef.current = currentLength;
    prevFirstMessageIdRef.current = currentFirstId;
  }, [messages, isNearBottom, endRef]);

  // Scroll to bottom when user initiates a new message
  useEffect(() => {
    if (sending && isNearBottom) {
      endRef?.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sending, isNearBottom, endRef]);

  const scrollToBottom = () => {
    endRef?.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewMessagePill(false);
    setIsNearBottom(true);
  };

  return (
    <div className={styles.conversationRoot}>
      <div
        ref={scrollContainerRef}
        className="conversation"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label={`Hội thoại phân tích cùng ${activeAgent.name}`}
        onScroll={handleScroll}
      >
        <div className="conversation-inner">
          {/* Analysis Context Scope Header */}
          <div className="context-card" role="region" aria-label="Phạm vi phân tích">
            <span className="context-icon" aria-hidden="true">
              <ChartNoAxesCombined />
            </span>
            <span>
              <small>PHẠM VI PHÂN TÍCH</small>
              <strong>
                {project.name} · {project.snapshot}
              </strong>
            </span>
            <span className="context-meta">
              <Check aria-hidden="true" /> Snapshot đã khóa · DQ {project.dq}%
            </span>
          </div>

          {/* Guide & Collaboration Slots */}
          {guide}
          {collaboration}

          {/* Stream Global Error State */}
          {status === "error" && (
            <div className={styles.streamErrorBanner} role="alert">
              <AlertCircle size={16} />
              <p>{streamError || "Đã xảy ra lỗi khi tải luồng hội thoại. Vui lòng thử lại."}</p>
              {onRetryError && (
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={onRetryError}
                  aria-label="Thử tải lại dữ liệu hội thoại"
                >
                  <RotateCcw size={11} /> Thử lại
                </button>
              )}
            </div>
          )}

          {/* Load More History at Top */}
          {hasMoreHistory && (
            <div className={styles.historyLoader}>
              <button
                type="button"
                className={styles.loadMoreBtn}
                onClick={onLoadMoreHistory}
                disabled={loadingMoreHistory}
                aria-label="Tải thêm lịch sử hội thoại trước đó"
              >
                {loadingMoreHistory ? <BouncingDots label="Đang tải lịch sử" /> : <ChevronUp size={12} />}
                <span>{loadingMoreHistory ? "Đang tải tin nhắn cũ…" : "Tải tin nhắn trước đó"}</span>
              </button>
            </div>
          )}

          {/* Stream Global Loading State */}
          {status === "loading" && (
            <div role="status" aria-busy="true" aria-label="Đang tải tin nhắn…">
              <ArtifactSkeleton label="Đang nạp ngữ cảnh và lịch sử phân tích…" />
            </div>
          )}

          {/* Conversation Thread Header / Empty State */}
          {status !== "loading" && messages.length === 0 ? (
            <EmptyConversation activeAgent={activeAgent} onSelectPrompt={onSelectPrompt} />
          ) : (
            <div className="thread-label">
              <span>Hội thoại phân tích ({messages.length} tin nhắn)</span>
            </div>
          )}

          {/* Message List */}
          {messages.map((message) => {
            const authorAgent = agents.find((agent) => agent.name === message.author) ?? activeAgent;
            return (
              <MessageItem
                key={message.id}
                message={message}
                agent={authorAgent}
                onRetry={onRetryMessage}
                onOpenEvidence={onOpenEvidence}
                renderArtifact={(msg) => {
                  if (msg.artifact === "compare") {
                    return <CompareResult projectId={project.id} />;
                  }
                  if (msg.artifact === "insight") {
                    return <InsightResult projectId={project.id} onOpenEvidence={onOpenEvidence} />;
                  }
                  return renderArtifact(msg);
                }}
              />
            );
          })}

          {/* Thinking / Processing Phase Indicator */}
          {sending && (
            <>
              <div
                className={`thinking-indicator thinking-indicator--${workPhase}`}
                role="status"
                aria-live="polite"
              >
                <AgentMark agent={activeAgent} size="sm" />
                <div>
                  <strong>
                    {workPhase === "receiving"
                      ? `${activeAgent.name} đang tiếp nhận tin nhắn`
                      : workPhase === "thinking"
                      ? `${activeAgent.name} đang suy nghĩ`
                      : "Các agent đang trao đổi trong nhóm"}
                  </strong>
                  <span>
                    {workPhase === "receiving"
                      ? "Đang đọc phạm vi và mục tiêu phân tích"
                      : workPhase === "thinking"
                      ? "Đang chọn dữ liệu, rule và agent liên quan"
                      : "Đang đối chiếu kết quả và hợp nhất bằng chứng"}
                  </span>
                </div>
                <BouncingDots label="Hệ thống đang xử lý" />
              </div>

              {/* Reserved height skeleton for Compare and Insight artifacts */}
              {(activeAgent.id === "compare" || activeAgent.id === "insight") &&
                workPhase !== "receiving" && (
                  <ArtifactSkeleton
                    agentId={activeAgent.id}
                    label={`${activeAgent.name} đang đối chuẩn dữ liệu và tính toán…`}
                  />
                )}
            </>
          )}

          {/* Scroll anchor */}
          <div ref={endRef} aria-hidden="true" style={{ height: "1px" }} />
        </div>
      </div>

      {/* Floating New Messages Pill when user is reading earlier messages */}
      {showNewMessagePill && (
        <button
          type="button"
          className={styles.floatingBottomPill}
          onClick={scrollToBottom}
          aria-label="Cuộn xuống tin nhắn mới nhất"
        >
          <ArrowDown size={12} />
          <span>Tin nhắn mới bên dưới</span>
        </button>
      )}
    </div>
  );
}
