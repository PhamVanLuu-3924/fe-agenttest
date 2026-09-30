/**
 * In-memory mock adapter owning the report review state machine, claim-review
 * state and the simulated export lifecycle. No network, no PDF output; state
 * resets on reload. Pure TypeScript so it runs in unit tests and production.
 */
import { checkReportCompleteness, isEvidenceValid, reviewTransitionAllowed, exportTransitionAllowed } from "./report-checks";

export type ReviewStatus = "draft" | "pending_review" | "changes_requested" | "approved";
export type ExportStatus = "idle" | "exporting" | "success" | "error" | "expired";
export type ExportState = { status: ExportStatus; reference?: string; expiresAt?: string; label?: string };
export type ReviewIssue = { target: "section" | "claim"; id: string; message: string };

export type AdapterClaim = { id: string; text: string; evidenceIds: readonly string[] };
export type AdapterSection = { id: string; paragraphs: readonly string[]; claims: readonly AdapterClaim[] };
export type AdapterEvidence = { id: string; source: string; snapshot: string; description: string };
export type ReportAdapterData = { reportId: string; sections: readonly AdapterSection[]; evidence: readonly AdapterEvidence[] };

export type ReportAdapterOptions = {
  exportDurationMs?: number;
  expiryMs?: number;
  failFirstExport?: boolean;
  initial?: { reviewStatus?: ReviewStatus; revisionReason?: string; reviewedClaims?: readonly string[]; exportState?: ExportState };
};

export type ReportAdapterSnapshot = {
  reviewStatus: ReviewStatus;
  revisionReason: string;
  exportState: ExportState;
  error?: string;
  complete: boolean;
  issues: readonly ReviewIssue[];
  reviewedClaims: readonly string[];
};

type Result = { ok: true } | { ok: false; error: string };

const exportLabel = (reviewStatus: ReviewStatus) => (reviewStatus === "approved" ? "Đã phê duyệt" : "Bản nháp");

export class ReportAdapter {
  private readonly data: ReportAdapterData;
  private readonly listeners = new Set<() => void>();
  private cache: ReportAdapterSnapshot | null = null;
  private reviewStatus: ReviewStatus;
  private revisionReason: string;
  private reviewedClaims: Set<string>;
  private exportState: ExportState;
  private error: string | undefined;
  private exportTimer: ReturnType<typeof setTimeout> | null = null;
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;
  private exportCount = 0;
  private version = 0;
  private failFirstExport: boolean;
  private readonly exportDurationMs: number;
  private readonly expiryMs: number;
  private readonly initial: Required<Pick<NonNullable<ReportAdapterOptions["initial"]>, "reviewStatus" | "revisionReason">> & { exportState: ExportState; reviewedClaims: readonly string[] };

  constructor(data: ReportAdapterData, options: ReportAdapterOptions = {}) {
    this.data = data;
    this.exportDurationMs = options.exportDurationMs ?? 600;
    this.expiryMs = options.expiryMs ?? 30_000;
    this.failFirstExport = options.failFirstExport ?? false;
    const initial = options.initial ?? {};
    this.reviewStatus = initial.reviewStatus ?? "draft";
    this.revisionReason = initial.revisionReason ?? "";
    this.reviewedClaims = new Set(initial.reviewedClaims ?? []);
    this.exportState = initial.exportState ?? { status: "idle" };
    this.initial = {
      reviewStatus: this.reviewStatus,
      revisionReason: this.revisionReason,
      reviewedClaims: [...this.reviewedClaims],
      exportState: this.exportState,
    };
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  getSnapshot = (): ReportAdapterSnapshot => {
    if (!this.cache) {
      const { complete, issues } = checkReportCompleteness({
        sections: this.data.sections.map((section) => ({
          ...section,
          claims: section.claims.map((claim) => ({ ...claim, reviewed: this.reviewedClaims.has(claim.id) })),
        })),
        evidence: this.data.evidence,
      });
      this.cache = { reviewStatus: this.reviewStatus, revisionReason: this.revisionReason, exportState: this.exportState, error: this.error, complete, issues, reviewedClaims: [...this.reviewedClaims] };
    }
    return this.cache;
  };

  requestReview = (next: ReviewStatus, reason = ""): Result => {
    const snapshot = this.getSnapshot();
    if (next === "changes_requested" && !reason.trim()) return this.reject("Cần nhập lý do khi yêu cầu chỉnh sửa.");
    if (next === "approved" && !snapshot.complete) return this.reject(`Chưa thể phê duyệt: còn ${snapshot.issues.length} mục cần hoàn thiện.`);
    if (!reviewTransitionAllowed(this.reviewStatus, next, snapshot.complete, reason)) return this.reject(`Không thể chuyển từ ${this.reviewStatus} sang ${next}.`);
    this.reviewStatus = next;
    this.error = undefined;
    if (next === "changes_requested") this.revisionReason = reason.trim();
    if (next === "draft") { this.reviewedClaims.clear(); this.revisionReason = ""; }
    this.commit();
    return { ok: true };
  };

  reviewClaim = (claimId: string): Result => {
    if (this.reviewStatus !== "pending_review") return this.reject("Chỉ có thể duyệt claim khi báo cáo đang chờ duyệt.");
    const claim = this.data.sections.flatMap((section) => section.claims).find((item) => item.id === claimId);
    if (!claim) return this.reject(`Không tìm thấy claim ${claimId}.`);
    const evidenceById = new Map(this.data.evidence.map((item) => [item.id, item]));
    const supported = claim.text.trim().length > 0 && claim.evidenceIds.length > 0 && claim.evidenceIds.every((id) => isEvidenceValid(evidenceById.get(id) ?? { id, source: "", snapshot: "", description: "" }));
    if (!supported) return this.reject("Claim cần nội dung và evidence hợp lệ trước khi duyệt.");
    this.reviewedClaims.add(claimId);
    this.error = undefined;
    this.commit();
    return { ok: true };
  };

  exportReport = (): Result => {
    if (this.exportState.status === "exporting") return this.reject("Export đang thực thi, vui lòng đợi.");
    if (!exportTransitionAllowed(this.exportState.status, "exporting")) return this.reject("Không thể export từ trạng thái hiện tại.");
    this.clearTimers();
    this.exportState = { status: "exporting" };
    this.error = undefined;
    this.commit();
    const version = this.version;
    const label = exportLabel(this.reviewStatus);
    this.exportTimer = setTimeout(() => {
      if (version !== this.version) return;
      if (this.failFirstExport) {
        this.failFirstExport = false;
        this.exportState = { status: "error" };
        this.commit();
        return;
      }
      this.exportCount += 1;
      const expiresAt = new Date(Date.now() + this.expiryMs).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      this.exportState = { status: "success", reference: `mock://report/${this.data.reportId}/v${this.exportCount}`, label, expiresAt };
      this.commit();
      this.expiryTimer = setTimeout(() => {
        if (version !== this.version || this.exportState.status !== "success") return;
        this.exportState = { ...this.exportState, status: "expired" };
        this.commit();
      }, this.expiryMs);
    }, this.exportDurationMs);
    return { ok: true };
  };

  expireNow = (): Result => {
    if (this.exportState.status !== "success") return this.reject("Chỉ có thể hết hạn sau khi export thành công.");
    if (this.expiryTimer) { clearTimeout(this.expiryTimer); this.expiryTimer = null; }
    this.exportState = { ...this.exportState, status: "expired" };
    this.commit();
    return { ok: true };
  };

  reset = () => {
    this.clearTimers();
    this.version += 1;
    // failFirstExport is a construction-time scenario knob, so it survives reset
    // (StrictMode double-mount must not erase the "first export fails" setup).
    this.reviewStatus = this.initial.reviewStatus;
    this.revisionReason = this.initial.revisionReason;
    this.reviewedClaims = new Set(this.initial.reviewedClaims);
    this.exportState = this.initial.exportState;
    this.error = undefined;
    this.commit();
  };

  private reject(error: string): Result {
    this.error = error;
    this.commit();
    return { ok: false, error };
  }

  private clearTimers() {
    if (this.exportTimer) { clearTimeout(this.exportTimer); this.exportTimer = null; }
    if (this.expiryTimer) { clearTimeout(this.expiryTimer); this.expiryTimer = null; }
  }

  private commit() {
    this.cache = null;
    this.listeners.forEach((listener) => listener());
  }
}
