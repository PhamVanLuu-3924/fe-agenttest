import assert from "node:assert/strict";
import test from "node:test";
import { checkReportCompleteness, exportTransitionAllowed, reportSections, reviewTransitionAllowed } from "./report-checks.ts";
import { ReportAdapter } from "./report-adapter.ts";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function adapterData() {
  return {
    reportId: "rp-test",
    sections: reportSections.map(({ id }) => ({ id, paragraphs: ["Nội dung có căn cứ"], claims: [] })),
    evidence: [{ id: "evidence-1", source: "Canonical metric", snapshot: "Q2/2026", description: "100 ngày DOM" }],
  };
}

function completeReport() {
  return {
    sections: reportSections.map(({ id }) => ({ id, paragraphs: ["Nội dung có căn cứ"], claims: [] })),
    evidence: [{ id: "evidence-1", source: "Canonical metric", snapshot: "Q2/2026", description: "100 ngày DOM" }],
  };
}

test("six nonempty sections with resolved reviewed claims can be approved", () => {
  const report = completeReport();
  report.sections[0].claims.push({ id: "claim-1", text: "Nhận định", evidenceIds: ["evidence-1"], reviewed: true });
  assert.equal(checkReportCompleteness(report).complete, true);
});

test("missing and blank required sections are identified, even if an extra section exists", () => {
  const report = completeReport();
  report.sections.pop();
  report.sections[0].paragraphs = ["  "];
  report.sections.push({ id: "extra", paragraphs: ["Not a replacement"], claims: [] });
  assert.deepEqual(checkReportCompleteness(report).issues.map((issue) => issue.id), ["summary", "actions"]);
});

test("a reviewed claim with an unresolved evidence ID still blocks approval", () => {
  const report = completeReport();
  report.sections[2].claims.push({ id: "claim-2", text: "Claim", evidenceIds: ["evidence-1", "missing"], reviewed: true });
  const result = checkReportCompleteness(report);
  assert.equal(result.complete, false);
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].id, "claim-2");
});

test("no evidence and an unreviewed claim are separate actionable issues", () => {
  const report = completeReport();
  report.sections[1].claims.push({ id: "claim-3", text: "Claim", evidenceIds: [], reviewed: false });
  assert.equal(checkReportCompleteness(report).issues.length, 2);
});

test("an evidence ID without source, snapshot or measurements is not valid evidence", () => {
  for (const field of ["source", "snapshot", "description"]) {
    const report = completeReport();
    report.evidence[0][field] = "  ";
    report.sections[0].claims.push({ id: "claim", text: "Claim", evidenceIds: ["evidence-1"], reviewed: true });
    assert.equal(checkReportCompleteness(report).complete, false);
  }
});

test("empty claim text is not accepted as a completed claim", () => {
  const report = completeReport();
  report.sections[1].claims.push({ id: "claim-4", text: " ", evidenceIds: ["evidence-1"], reviewed: true });
  assert.equal(checkReportCompleteness(report).complete, false);
});

test("review transitions require the proper source state and approval completeness", () => {
  assert.equal(reviewTransitionAllowed("draft", "pending_review", false), true);
  assert.equal(reviewTransitionAllowed("draft", "approved", true), false);
  assert.equal(reviewTransitionAllowed("pending_review", "approved", false), false);
  assert.equal(reviewTransitionAllowed("pending_review", "approved", true), true);
  assert.equal(reviewTransitionAllowed("approved", "draft", true), false);
  assert.equal(reviewTransitionAllowed("missing", "approved", true), false);
});

test("revision requests require a nonblank reason and return to draft", () => {
  assert.equal(reviewTransitionAllowed("pending_review", "changes_requested", false, "  "), false);
  assert.equal(reviewTransitionAllowed("pending_review", "changes_requested", false, "Bổ sung nguồn"), true);
  assert.equal(reviewTransitionAllowed("changes_requested", "draft", false), true);
});

test("export supports retry and renewal, blocks a duplicate request and invalid completion", () => {
  for (const state of ["idle", "error", "expired", "success"]) assert.equal(exportTransitionAllowed(state, "exporting"), true);
  assert.equal(exportTransitionAllowed("exporting", "exporting"), false);
  assert.equal(exportTransitionAllowed("exporting", "success"), true);
  assert.equal(exportTransitionAllowed("exporting", "error"), true);
  assert.equal(exportTransitionAllowed("success", "expired"), true);
  assert.equal(exportTransitionAllowed("idle", "success"), false);
  assert.equal(exportTransitionAllowed("error", "expired"), false);
});

test("adapter walks draft → pending_review → approved once every claim is reviewed", () => {
  const data = adapterData();
  data.sections[0].claims.push({ id: "claim-1", text: "Nhận định", evidenceIds: ["evidence-1"] });
  const adapter = new ReportAdapter(data);
  assert.equal(adapter.getSnapshot().reviewStatus, "draft");
  assert.equal(adapter.requestReview("pending_review").ok, true);
  assert.equal(adapter.requestReview("approved").ok, false);
  assert.match(adapter.getSnapshot().error, /Chưa thể phê duyệt/);
  assert.equal(adapter.reviewClaim("claim-1").ok, true);
  assert.equal(adapter.requestReview("approved").ok, true);
  assert.equal(adapter.getSnapshot().reviewStatus, "approved");
});

test("adapter rejects invalid transitions and surfaces the reason in snapshot error", () => {
  const adapter = new ReportAdapter(adapterData());
  assert.equal(adapter.requestReview("approved").ok, false);
  assert.equal(adapter.requestReview("changes_requested", "Lý do").ok, false);
  assert.equal(adapter.requestReview("pending_review").ok, true);
  const noReason = adapter.requestReview("changes_requested", "  ");
  assert.equal(noReason.ok, false);
  assert.match(noReason.error, /Cần nhập lý do/);
  assert.equal(adapter.requestReview("changes_requested", "Bổ sung nguồn").ok, true);
  assert.equal(adapter.getSnapshot().revisionReason, "Bổ sung nguồn");
});

test("returning to draft resets reviewed claims and the revision reason", () => {
  const data = adapterData();
  data.sections[0].claims.push({ id: "claim-1", text: "Nhận định", evidenceIds: ["evidence-1"] });
  const adapter = new ReportAdapter(data);
  adapter.requestReview("pending_review");
  adapter.reviewClaim("claim-1");
  adapter.requestReview("changes_requested", "Bổ sung nguồn");
  assert.deepEqual(adapter.getSnapshot().reviewedClaims, ["claim-1"]);
  adapter.requestReview("draft");
  const snapshot = adapter.getSnapshot();
  assert.equal(snapshot.reviewStatus, "draft");
  assert.deepEqual(snapshot.reviewedClaims, []);
  assert.equal(snapshot.revisionReason, "");
});

test("claim review is guarded by pending_review, existence and valid evidence", () => {
  const data = adapterData();
  data.sections[0].claims.push({ id: "claim-1", text: "Nhận định", evidenceIds: ["evidence-1"] }, { id: "claim-2", text: "Chưa đủ", evidenceIds: ["unresolved"] });
  const adapter = new ReportAdapter(data);
  assert.equal(adapter.reviewClaim("claim-1").ok, false);
  adapter.requestReview("pending_review");
  assert.equal(adapter.reviewClaim("missing-claim").ok, false);
  assert.equal(adapter.reviewClaim("claim-2").ok, false);
  assert.match(adapter.getSnapshot().error, /evidence hợp lệ/);
  assert.equal(adapter.reviewClaim("claim-1").ok, true);
  assert.equal(adapter.reviewClaim("claim-1").ok, true);
});

test("adapter export reaches success with reference, label snapshot and expiry, blocking duplicates", async () => {
  const adapter = new ReportAdapter(adapterData(), { exportDurationMs: 5, expiryMs: 500 });
  let notifications = 0;
  adapter.subscribe(() => { notifications += 1; });
  assert.equal(adapter.exportReport().ok, true);
  assert.equal(adapter.exportReport().ok, false);
  assert.match(adapter.getSnapshot().error, /Export đang thực thi/);
  await sleep(20);
  const snapshot = adapter.getSnapshot();
  assert.equal(snapshot.exportState.status, "success");
  assert.equal(snapshot.exportState.reference, "mock://report/rp-test/v1");
  assert.equal(snapshot.exportState.label, "Bản nháp");
  assert.ok(snapshot.exportState.expiresAt);
  assert.ok(notifications >= 3);
});

test("adapter fails the first export on demand and succeeds on retry", async () => {
  const adapter = new ReportAdapter(adapterData(), { exportDurationMs: 5, expiryMs: 500, failFirstExport: true });
  adapter.exportReport();
  await sleep(20);
  assert.equal(adapter.getSnapshot().exportState.status, "error");
  adapter.exportReport();
  await sleep(20);
  assert.equal(adapter.getSnapshot().exportState.status, "success");
});

test("export keeps the label of the moment and a later export gets a new reference and label", async () => {
  const data = adapterData();
  data.sections[0].claims.push({ id: "claim-1", text: "Nhận định", evidenceIds: ["evidence-1"] });
  const adapter = new ReportAdapter(data, { exportDurationMs: 5, expiryMs: 500 });
  adapter.exportReport();
  await sleep(20);
  assert.equal(adapter.getSnapshot().exportState.label, "Bản nháp");
  adapter.requestReview("pending_review");
  adapter.reviewClaim("claim-1");
  adapter.requestReview("approved");
  assert.equal(adapter.getSnapshot().exportState.label, "Bản nháp");
  adapter.exportReport();
  await sleep(20);
  assert.equal(adapter.getSnapshot().exportState.reference, "mock://report/rp-test/v2");
  assert.equal(adapter.getSnapshot().exportState.label, "Đã phê duyệt");
});

test("a successful export expires automatically and expireNow is guarded", async () => {
  const adapter = new ReportAdapter(adapterData(), { exportDurationMs: 5, expiryMs: 30 });
  assert.equal(adapter.expireNow().ok, false);
  adapter.exportReport();
  await sleep(20);
  assert.equal(adapter.getSnapshot().exportState.status, "success");
  assert.equal(adapter.expireNow().ok, true);
  assert.equal(adapter.getSnapshot().exportState.status, "expired");
  adapter.exportReport();
  await sleep(20);
  assert.equal(adapter.getSnapshot().exportState.status, "success");
  await sleep(40);
  assert.equal(adapter.getSnapshot().exportState.status, "expired");
});

test("reset cancels pending timers and restores the initial state", async () => {
  const adapter = new ReportAdapter(adapterData(), { exportDurationMs: 30 });
  adapter.requestReview("pending_review");
  adapter.exportReport();
  assert.equal(adapter.getSnapshot().exportState.status, "exporting");
  adapter.reset();
  const snapshot = adapter.getSnapshot();
  assert.equal(snapshot.reviewStatus, "draft");
  assert.equal(snapshot.exportState.status, "idle");
  assert.equal(snapshot.error, undefined);
  await sleep(60);
  assert.equal(adapter.getSnapshot().exportState.status, "idle");
});
