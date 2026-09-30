/** Required presentation sections; independent of the future backend wire model. */
export const reportSections = [
  { id: "summary", title: "Executive summary" },
  { id: "scope", title: "Phạm vi và chất lượng dữ liệu" },
  { id: "performance", title: "Hiệu suất theo phân khu" },
  { id: "slow-moving", title: "Căn bán chậm trọng yếu" },
  { id: "limitations", title: "Nguyên nhân và giới hạn" },
  { id: "actions", title: "Đề xuất hành động 30 ngày" },
] as const;

type CheckInput = {
  sections: readonly { id: string; paragraphs: readonly string[]; claims: readonly { id: string; text: string; evidenceIds: readonly string[]; reviewed: boolean }[] }[];
  evidence: readonly { id: string; source: string; snapshot: string; description: string }[];
};

export function isEvidenceValid(evidence: CheckInput["evidence"][number]) {
  return [evidence.id, evidence.source, evidence.snapshot, evidence.description].every((value) => value.trim().length > 0);
}

export function checkReportCompleteness({ sections, evidence }: CheckInput) {
  const evidenceIds = new Set(evidence.filter(isEvidenceValid).map((item) => item.id));
  const issues: { target: "section" | "claim"; id: string; message: string }[] = [];
  for (const required of reportSections) {
    const section = sections.find((item) => item.id === required.id);
    if (!section?.paragraphs.some((text) => text.trim())) {
      issues.push({ target: "section", id: required.id, message: `Chưa có nội dung: ${required.title}.` });
    }
  }
  for (const section of sections) {
    for (const claim of section.claims) {
      if (!claim.text.trim()) issues.push({ target: "claim", id: claim.id, message: "Claim chưa có nội dung." });
      if (!claim.evidenceIds.length || claim.evidenceIds.some((id) => !evidenceIds.has(id))) {
        issues.push({ target: "claim", id: claim.id, message: `Thiếu evidence: ${claim.text || claim.id}.` });
      }
      if (!claim.reviewed) issues.push({ target: "claim", id: claim.id, message: `Claim chờ duyệt: ${claim.text || claim.id}.` });
    }
  }
  return { complete: issues.length === 0, issues };
}

export function reviewTransitionAllowed(current: string, next: string, complete: boolean, reason = "") {
  return (current === "draft" && next === "pending_review")
    || (current === "pending_review" && next === "approved" && complete)
    || (current === "pending_review" && next === "changes_requested" && reason.trim().length > 0)
    || (current === "changes_requested" && next === "draft");
}

export function exportTransitionAllowed(current: string, next: string) {
  return (["idle", "error", "expired", "success"].includes(current) && next === "exporting")
    || (current === "exporting" && ["success", "error"].includes(next))
    || (current === "success" && next === "expired");
}
