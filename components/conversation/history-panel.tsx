import {
  AlertCircle,
  Clock3,
  FileText,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { AgentMark } from "@/components/shared/agent-mark";
import { BouncingDots } from "@/components/shared/bouncing-dots";
import type { Agent, ConversationHistoryItem, ShortTermHistory } from "@/types/workspace";
import styles from "./conversation.module.css";

type HistoryPanelProps = {
  activeAgent: Agent;
  agents: readonly Agent[];
  recentItems: ShortTermHistory[];
  savedRuns: readonly ConversationHistoryItem[];
  onClose: () => void;

  // Trạng thái mở rộng
  isLoading?: boolean;
  activeRunId?: string;
  onSelectRun?: (item: ConversationHistoryItem) => void;
  onSelectRecent?: (item: ShortTermHistory) => void;
  pageSize?: number;
  mockErrorOnLoadMore?: boolean;
};

export function HistoryPanel({
  activeAgent,
  agents,
  recentItems,
  savedRuns,
  onClose,
  isLoading = false,
  activeRunId,
  onSelectRun,
  onSelectRecent,
  pageSize = 5,
  mockErrorOnLoadMore = false,
}: HistoryPanelProps) {
  const [visibleCount, setVisibleCount] = useState<number>(pageSize);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const panelRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Keyboard: Press Escape to close drawer
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Keyboard: Arrow keys navigation between history items
  const handleListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.tagName !== "BUTTON") return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextBtn = target.nextElementSibling as HTMLButtonElement | null;
      if (nextBtn && nextBtn.tagName === "BUTTON") {
        nextBtn.focus();
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const prevBtn = target.previousElementSibling as HTMLButtonElement | null;
      if (prevBtn && prevBtn.tagName === "BUTTON") {
        prevBtn.focus();
      }
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    setLoadError(null);

    // Simulate async pagination
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (mockErrorOnLoadMore) {
      setLoadError("Không thể tải thêm lượt chạy (lỗi DQ_HISTORY_PAGING)");
      setLoadingMore(false);
      return;
    }

    setVisibleCount((prev) => Math.min(savedRuns.length, prev + pageSize));
    setLoadingMore(false);
  };

  const handleRetryLoadMore = () => {
    setLoadError(null);
    handleLoadMore();
  };

  const visibleRuns = savedRuns.slice(0, visibleCount);
  const hasMore = visibleRuns.length < savedRuns.length;
  const remainingCount = savedRuns.length - visibleRuns.length;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={styles.historyBackdrop}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        className={`history-panel ${styles.historyMobileDrawer}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Lịch sử phân tích của ${activeAgent.name}`}
      >
        {/* Header */}
        <div className="history-header">
          <div>
            <small>LỊCH SỬ PHÂN TÍCH</small>
            <strong>{activeAgent.name}</strong>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Đóng bảng lịch sử phân tích"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        {/* Trạng thái 1: Đang tải ban đầu (Skeleton) */}
        {isLoading ? (
          <div
            className={styles.historySkeletonList}
            role="status"
            aria-busy="true"
            aria-label="Đang nạp dữ liệu lịch sử phân tích…"
          >
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.historySkeletonItem}>
                <div className={styles.skeletonBar} style={{ width: "24px", height: "24px", borderRadius: "8px" }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                  <div className={styles.skeletonBar} style={{ width: "75%", height: "10px" }} />
                  <div className={styles.skeletonBar} style={{ width: "45%", height: "8px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Hoạt động gần đây (Short-term activity) */}
            <section className="short-history" aria-label="Hoạt động gần đây">
              <div className="short-history-title">
                <span>
                  <Clock3 aria-hidden="true" /> HOẠT ĐỘNG GẦN ĐÂY
                </span>
              </div>

              {recentItems.length ? (
                <div className="short-history-list" role="list">
                  {recentItems.map((item) => {
                    const itemAgent = agents.find((agent) => agent.id === item.agentId) ?? agents[0];
                    return (
                      <div
                        className="short-history-item"
                        key={item.id}
                        role="listitem"
                        tabIndex={0}
                        onClick={() => onSelectRecent?.(item)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSelectRecent?.(item);
                          }
                        }}
                        aria-label={`Câu hỏi gần đây: ${item.prompt} cùng ${itemAgent.name}, thời gian ${item.time}`}
                      >
                        <AgentMark agent={itemAgent} size="sm" />
                        <span>
                          <strong>{item.prompt}</strong>
                          <small>
                            {itemAgent.name} · {item.project}
                          </small>
                        </span>
                        <time>{item.time}</time>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="short-history-empty" role="status">
                  <Clock3 aria-hidden="true" />
                  <span>
                    <strong>Chưa có hoạt động mới</strong>
                    <small>Câu hỏi gần đây với {activeAgent.name} sẽ xuất hiện tại đây.</small>
                  </span>
                </div>
              )}
            </section>

            <div className="history-divider">
              <span>RUN ĐÃ LƯU ({savedRuns.length})</span>
            </div>

            {/* Danh sách Run đã lưu */}
            {savedRuns.length === 0 ? (
              <div className={styles.emptyRuns} role="status">
                <FileText size={18} aria-hidden="true" />
                <span>
                  <strong>Chưa có run nào được lưu</strong>
                  <small>Các phiên phân tích hoàn thành sẽ được lưu tự động tại đây.</small>
                </span>
              </div>
            ) : (
              <div
                ref={listRef}
                className="history-list"
                role="list"
                onKeyDown={handleListKeyDown}
              >
                {visibleRuns.map((item, index) => {
                  const isActive = activeRunId ? item.id === activeRunId : index === 0;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="listitem"
                      className={isActive ? "history-item--active" : ""}
                      onClick={() => onSelectRun?.(item)}
                      aria-label={`Lượt chạy: ${item.title}, chi tiết: ${item.detail}, thời gian: ${item.time}`}
                    >
                      <span className="history-icon" aria-hidden="true">
                        <Clock3 />
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.detail}</small>
                        <time>{item.time}</time>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Phân trang: Tải thêm / Đang tải thêm / Lỗi tải thêm / Hết dữ liệu */}
            {savedRuns.length > 0 && (
              <div className={styles.loadMoreContainer}>
                {loadError && (
                  <div className={styles.loadErrorNote} role="alert">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <AlertCircle size={12} /> {loadError}
                    </span>
                    <button
                      type="button"
                      className={styles.retryHistoryBtn}
                      onClick={handleRetryLoadMore}
                      aria-label="Thử tải lại thêm lượt chạy"
                    >
                      <RotateCcw size={10} /> Thử lại
                    </button>
                  </div>
                )}

                {hasMore && !loadError && (
                  <button
                    type="button"
                    className={styles.loadMoreHistoryBtn}
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    aria-label={`Tải thêm ${remainingCount} lượt chạy cũ hơn`}
                  >
                    {loadingMore ? (
                      <BouncingDots label="Đang tải thêm lượt chạy" />
                    ) : (
                      <>
                        <Clock3 size={11} aria-hidden="true" />
                        <span>Tải thêm ({remainingCount} lượt chạy cũ hơn)</span>
                      </>
                    )}
                  </button>
                )}

                {!hasMore && (
                  <div className={styles.endOfData} role="status">
                    <span>Đã hiển thị toàn bộ {savedRuns.length} lượt chạy</span>
                  </div>
                )}
              </div>
            )}

            <div className="history-note" role="note">
              <ShieldCheck aria-hidden="true" />
              <p>
                <strong>Lịch sử dài hạn được lưu theo run</strong>
                <span>Lịch sử ngắn hạn phía trên sẽ được xóa khi tải lại trang.</span>
              </p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
