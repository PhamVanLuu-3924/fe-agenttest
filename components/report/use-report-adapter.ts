"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { ReportAdapter, type ReportAdapterData, type ReportAdapterOptions, type ReportAdapterSnapshot } from "./report-adapter";

/**
 * Binds a ReportAdapter to React. Data and options are captured on first render;
 * remount via `key` when the project/report changes so `initialMode`-style props
 * and adapter state reset together.
 */
export function useReportAdapter(data: ReportAdapterData, options?: ReportAdapterOptions): { adapter: ReportAdapter; snapshot: ReportAdapterSnapshot } {
  // Adapter state must survive re-renders; callers reset by remounting via `key`.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const adapter = useMemo(() => new ReportAdapter(data, options), []);
  useEffect(() => () => adapter.reset(), [adapter]);
  // The initial snapshot derives deterministically from the adapter state, so the
  // server snapshot can reuse the same getter without hydration mismatch.
  const snapshot = useSyncExternalStore(adapter.subscribe, adapter.getSnapshot, adapter.getSnapshot);
  return { adapter, snapshot };
}
