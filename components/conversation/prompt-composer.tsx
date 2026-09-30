import { AlertCircle, ArrowUp, Info, Mic, Plus } from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { BouncingDots } from "@/components/shared/bouncing-dots";

type PromptComposerProps = {
  agentName: string;
  draft: string;
  sending: boolean;
  onDraftChange: (draft: string) => void;
  onSubmit: (event: FormEvent) => void;
  placeholder?: string;
  error?: string | null;
  onSendMessage?: (text: string) => void | Promise<boolean>;
};

export function PromptComposer({
  agentName,
  draft,
  sending,
  onDraftChange,
  onSubmit,
  placeholder,
  error,
  onSendMessage,
}: PromptComposerProps) {
  // Synchronous submission lock refs (immune to React async state lag)
  const isLockedRef = useRef<boolean>(false);
  const lastSubmitTimeRef = useRef<number>(0);
  const isComposingRef = useRef<boolean>(false);

  // Hidden focus-forwarding element ref for chat-workspace compatibility
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Transient duplicate warning notification
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isEmpty = !draft.trim();
  const DEBOUNCE_WINDOW_MS = 600;

  // Release lock when sending finishes
  useEffect(() => {
    if (!sending) {
      isLockedRef.current = false;
    }
  }, [sending]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, []);

  const triggerDuplicateWarning = (message: string) => {
    setDuplicateWarning(message);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      setDuplicateWarning(null);
    }, 2800);
  };

  const executeSubmission = (event?: FormEvent) => {
    const text = draft.trim();
    if (!text || sending) return;

    const now = Date.now();
    // Synchronous lock: check if already locked or submitted within debounce window
    if (isLockedRef.current || now - lastSubmitTimeRef.current < DEBOUNCE_WINDOW_MS) {
      triggerDuplicateWarning("Thao tác quá nhanh — đã tiếp nhận tin nhắn, tránh gửi trùng.");
      return;
    }

    // Immediately acquire lock synchronously
    isLockedRef.current = true;
    lastSubmitTimeRef.current = now;
    setDuplicateWarning(null);

    if (onSendMessage) {
      onSendMessage(text);
    }

    // Call standard form submit for chat-workspace backwards compatibility
    if (event) {
      onSubmit(event);
    } else {
      const syntheticEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
      } as unknown as FormEvent;
      onSubmit(syntheticEvent);
    }
  };

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    executeSubmission(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Vietnamese IME composition check: do NOT send while composing tone marks
    if (
      event.nativeEvent.isComposing ||
      isComposingRef.current ||
      event.keyCode === 229
    ) {
      return;
    }

    // 2. Shift + Enter: allow newline
    if (event.key === "Enter" && event.shiftKey) {
      return;
    }

    // 3. Enter alone: submit message
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      executeSubmission();
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
  };

  const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onDraftChange(event.target.value);
    if (duplicateWarning) setDuplicateWarning(null);
  };

  // Figma spec placeholder
  const defaultPlaceholder =
    placeholder ||
    (agentName.includes("So sánh") || agentName.includes("Insight")
      ? "Hỏi tiếp về bằng chứng, nguyên nhân hoặc đề xuất hành động…"
      : `Nhắn cho ${agentName} — nêu dự án, thời gian và điều bạn cần biết…`);

  return (
    <div className="composer-wrap" role="region" aria-label="Khung soạn tin nhắn">
      {/* Duplicate Submission Warning Toast */}
      {duplicateWarning && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "6px",
            padding: "5px 12px",
            borderRadius: "999px",
            background: "rgba(217, 119, 6, 0.12)",
            border: "1px solid rgba(217, 119, 6, 0.3)",
            color: "var(--vd-warning, #d97706)",
            fontSize: "10px",
            fontWeight: 600,
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          <Info size={12} />
          <span>{duplicateWarning}</span>
        </div>
      )}

      {/* Global Error Notice if failed */}
      {error && !duplicateWarning && (
        <div
          role="alert"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "6px",
            padding: "4px 10px",
            borderRadius: "8px",
            background: "rgba(220, 38, 38, 0.08)",
            color: "var(--vd-danger, #dc2626)",
            fontSize: "10px",
            fontWeight: 600,
          }}
        >
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}

      <form className="composer" onSubmit={handleFormSubmit} role="search">
        {/* Hidden focus proxy to guarantee document.querySelector(".composer input")?.focus() works */}
        <input
          ref={hiddenInputRef}
          tabIndex={-1}
          aria-hidden="true"
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
            width: 0,
            height: 0,
            margin: 0,
            padding: 0,
            border: 0,
          }}
          onFocus={() => textareaRef.current?.focus()}
        />

        <button
          type="button"
          className="composer-action"
          aria-label="Thêm tài liệu hoặc bằng chứng đính kèm"
        >
          <Plus aria-hidden="true" />
        </button>

        <textarea
          ref={textareaRef}
          value={draft}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder={defaultPlaceholder}
          disabled={sending}
          rows={1}
          aria-label={`Soạn tin nhắn gửi cho ${agentName}`}
          autoComplete="off"
          style={{
            minWidth: 0,
            flex: 1,
            border: 0,
            outline: 0,
            color: "var(--vd-text-primary, #23262d)",
            fontSize: "12px",
            fontFamily: "inherit",
            lineHeight: "1.45",
            resize: "none",
            background: "transparent",
            padding: "4px 0",
            maxHeight: "110px",
          }}
        />

        <button
          type="button"
          className="composer-action"
          aria-label="Ghi âm giọng nói"
        >
          <Mic aria-hidden="true" />
        </button>

        <button
          type="submit"
          className="send-button"
          disabled={isEmpty || sending}
          aria-label={sending ? "Đang gửi tin nhắn…" : "Gửi tin nhắn"}
        >
          {sending ? (
            <BouncingDots label="Đang gửi" />
          ) : (
            <ArrowUp aria-hidden="true" />
          )}
        </button>
      </form>
      <p>VDAgent có thể mắc lỗi. Hãy kiểm tra các bằng chứng quan trọng.</p>
    </div>
  );
}
