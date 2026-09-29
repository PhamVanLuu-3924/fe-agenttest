import { useCallback, useReducer, useRef, useState } from "react";
import {
  createLongHistoryFixture,
  emptyConversationFixture,
  failedConversationFixture,
} from "./fixtures";
import type { ConversationState, ExtendedMessage, UseConversationOptions } from "./types";

type Action =
  | { type: "SEND_START"; message: ExtendedMessage }
  | { type: "SEND_SUCCESS"; tempId: string; reply: ExtendedMessage }
  | { type: "SEND_FAILED"; tempId: string; errorMessage: string }
  | { type: "RETRY_START"; messageId: string }
  | { type: "LOAD_MORE_START" }
  | { type: "LOAD_MORE_SUCCESS"; olderMessages: ExtendedMessage[]; hasMore: boolean }
  | { type: "SET_SCENARIO"; scenario: "normal" | "empty" | "long_history" | "failure" };

function getInitialState(
  initialMessages: ExtendedMessage[],
  mockScenario: "normal" | "empty" | "long_history" | "failure"
): ConversationState {
  if (mockScenario === "empty") {
    return {
      messages: emptyConversationFixture,
      sendStatus: "idle",
      pendingMessageId: null,
      hasMore: false,
      loadingMore: false,
      error: null,
    };
  }

  if (mockScenario === "failure") {
    return {
      messages: failedConversationFixture,
      sendStatus: "failed",
      pendingMessageId: null,
      hasMore: false,
      loadingMore: false,
      error: "Gửi thất bại gần đây",
    };
  }

  if (mockScenario === "long_history") {
    const fullHistory = createLongHistoryFixture(220);
    return {
      messages: fullHistory.slice(fullHistory.length - 20),
      sendStatus: "idle",
      pendingMessageId: null,
      hasMore: true,
      loadingMore: false,
      error: null,
    };
  }

  return {
    messages: initialMessages,
    sendStatus: "idle",
    pendingMessageId: null,
    hasMore: false,
    loadingMore: false,
    error: null,
  };
}

function conversationReducer(state: ConversationState, action: Action): ConversationState {
  switch (action.type) {
    case "SEND_START": {
      return {
        ...state,
        sendStatus: "sending",
        pendingMessageId: action.message.id,
        messages: [...state.messages, action.message],
        error: null,
      };
    }

    case "SEND_SUCCESS": {
      const updatedMessages = state.messages.map((m) =>
        m.id === action.tempId ? { ...m, status: "sent" as const } : m
      );
      return {
        ...state,
        sendStatus: "idle",
        pendingMessageId: null,
        messages: [...updatedMessages, action.reply],
      };
    }

    case "SEND_FAILED": {
      const updatedMessages = state.messages.map((m) =>
        m.id === action.tempId
          ? { ...m, status: "failed" as const, errorMessage: action.errorMessage }
          : m
      );
      return {
        ...state,
        sendStatus: "failed",
        pendingMessageId: null,
        messages: updatedMessages,
        error: action.errorMessage,
      };
    }

    case "RETRY_START": {
      const updatedMessages = state.messages.map((m) =>
        m.id === action.messageId ? { ...m, status: "pending" as const, errorMessage: undefined } : m
      );
      return {
        ...state,
        sendStatus: "sending",
        pendingMessageId: action.messageId,
        messages: updatedMessages,
        error: null,
      };
    }

    case "LOAD_MORE_START": {
      return {
        ...state,
        loadingMore: true,
      };
    }

    case "LOAD_MORE_SUCCESS": {
      return {
        ...state,
        loadingMore: false,
        hasMore: action.hasMore,
        messages: [...action.olderMessages, ...state.messages],
      };
    }

    case "SET_SCENARIO": {
      return getInitialState([], action.scenario);
    }

    default:
      return state;
  }
}

export function useConversation(options: UseConversationOptions = {}) {
  const { initialMessages = [], mockScenario = "normal", pageSize = 20, onSendRequest } = options;

  // Track full history for pagination testing outside render
  const fullHistoryRef = useRef<ExtendedMessage[]>([]);
  const historyLoadedOffsetRef = useRef<number>(20);

  // Synchronous submission lock to block race conditions
  const submitLockRef = useRef(false);
  const lastSubmitTimeRef = useRef(0);

  // Track requestCount in state to satisfy React render rules
  const [requestCount, setRequestCount] = useState(0);

  const [state, dispatch] = useReducer(
    conversationReducer,
    null,
    () => getInitialState(initialMessages, mockScenario)
  );

  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed) return false;

      // 1. Synchronous lock check: ignore immediate duplicates (< 600ms) or locked submissions
      const now = Date.now();
      if (submitLockRef.current || now - lastSubmitTimeRef.current < 600) {
        return false;
      }

      submitLockRef.current = true;
      lastSubmitTimeRef.current = now;
      setRequestCount((c) => c + 1);

      const tempId = `user-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const timeStr = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(
        new Date()
      );

      // Create optimistic pending message immediately
      const optimisticMessage: ExtendedMessage = {
        id: tempId,
        kind: "user",
        text: trimmed,
        time: timeStr,
        status: "pending",
      };

      dispatch({ type: "SEND_START", message: optimisticMessage });

      try {
        let reply: ExtendedMessage;
        if (onSendRequest) {
          reply = await onSendRequest(trimmed);
        } else {
          // Default mock handler simulating agent response
          await new Promise((resolve) => setTimeout(resolve, 800));
          reply = {
            id: `reply-${Date.now()}`,
            kind: "agent",
            author: "So sánh Agent",
            text: `Đã phân tích: "${trimmed}". Kết quả đối chiếu đã sẵn sàng.`,
            time: new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(
              new Date()
            ),
            status: "sent",
            badge: "Đã đối chiếu 8 peers",
            evidence: "8 peers · Q2/2026",
          };
        }

        dispatch({ type: "SEND_SUCCESS", tempId, reply });
        submitLockRef.current = false;
        return true;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Gửi thất bại (mất kết nối)";
        dispatch({ type: "SEND_FAILED", tempId, errorMessage: errorMsg });
        submitLockRef.current = false;
        return false;
      }
    },
    [onSendRequest]
  );

  const retryMessage = useCallback(
    async (messageId: string): Promise<boolean> => {
      const target = state.messages.find((m) => m.id === messageId);
      if (!target || target.status !== "failed") return false;

      // Lock during retry
      if (submitLockRef.current) return false;
      submitLockRef.current = true;
      setRequestCount((c) => c + 1);

      dispatch({ type: "RETRY_START", messageId });

      try {
        let reply: ExtendedMessage;
        if (onSendRequest) {
          reply = await onSendRequest(target.text);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 600));
          reply = {
            id: `reply-retry-${Date.now()}`,
            kind: "agent",
            author: "So sánh Agent",
            text: `Thử lại thành công: "${target.text}". Dữ liệu đã được nạp lại.`,
            time: new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(
              new Date()
            ),
            status: "sent",
          };
        }

        dispatch({ type: "SEND_SUCCESS", tempId: messageId, reply });
        submitLockRef.current = false;
        return true;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Thử lại thất bại (mã lỗi DQ_RETRY)";
        dispatch({ type: "SEND_FAILED", tempId: messageId, errorMessage: errorMsg });
        submitLockRef.current = false;
        return false;
      }
    },
    [state.messages, onSendRequest]
  );

  const loadMoreHistory = useCallback(async () => {
    if (!state.hasMore || state.loadingMore) return;

    if (fullHistoryRef.current.length === 0) {
      fullHistoryRef.current = createLongHistoryFixture(220);
    }

    dispatch({ type: "LOAD_MORE_START" });

    await new Promise((resolve) => setTimeout(resolve, 400));

    const total = fullHistoryRef.current.length;
    const currentOffset = historyLoadedOffsetRef.current;
    const nextOffset = Math.min(total, currentOffset + pageSize);

    const olderChunk = fullHistoryRef.current.slice(total - nextOffset, total - currentOffset);
    historyLoadedOffsetRef.current = nextOffset;

    const stillHasMore = nextOffset < total;

    dispatch({
      type: "LOAD_MORE_SUCCESS",
      olderMessages: olderChunk,
      hasMore: stillHasMore,
    });
  }, [state.hasMore, state.loadingMore, pageSize]);

  const switchScenario = useCallback((scenario: "normal" | "empty" | "long_history" | "failure") => {
    if (scenario === "long_history") {
      fullHistoryRef.current = createLongHistoryFixture(220);
      historyLoadedOffsetRef.current = 20;
    }
    dispatch({ type: "SET_SCENARIO", scenario });
  }, []);

  return {
    ...state,
    sendMessage,
    retryMessage,
    loadMoreHistory,
    switchScenario,
    requestCount,
  };
}
