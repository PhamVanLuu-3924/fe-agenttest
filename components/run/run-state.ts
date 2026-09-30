import type { Agent, AgentGroup, AgentId, AgentRun, RunPhase, RunTask, RunTaskState } from "@/types/workspace";

const taskBlueprints: Record<Exclude<AgentId, "orchestrator">, Pick<RunTask, "title" | "detail">> = {
  data: { title: "Kiểm tra dữ liệu", detail: "Đối soát snapshot và chất lượng dữ liệu" },
  compare: { title: "Đối chuẩn peer group", detail: "So sánh các nhóm tương đồng" },
  insight: { title: "Tổng hợp insight", detail: "Liên kết nhận định với evidence" },
  chart: { title: "Dựng biểu đồ", detail: "Trực quan hóa các metric chính" },
  report: { title: "Hoàn thiện báo cáo", detail: "Ghép kết quả và kiểm tra claim" },
};

export function selectCollaborationAgents(prompt: string, primary: AgentId, agents: readonly Agent[]): AgentId[] {
  const normalized = prompt.toLocaleLowerCase("vi-VN");
  const selected = new Set<AgentId>();
  const has = (...terms: string[]) => terms.some((term) => normalized.includes(term));

  if (primary !== "orchestrator") selected.add(primary);
  selected.add("data");
  if (primary === "compare" || has("so sánh", "peer", "benchmark", "tương đồng", "bán chậm")) selected.add("compare");
  if (primary === "insight" || has("tại sao", "nguyên nhân", "insight", "bất thường", "bán chậm")) selected.add("insight");
  if (primary === "chart" || has("biểu đồ", "trực quan", "dashboard", "xu hướng", "bán chậm")) selected.add("chart");
  if (primary === "report" || has("báo cáo", "tóm tắt", "manager", "pdf", "xuất")) selected.add("report");
  if (primary === "orchestrator" && selected.size === 1) selected.add("insight");

  return agents.filter((agent) => agent.id !== "orchestrator" && selected.has(agent.id)).map((agent) => agent.id);
}

export function getGroupTitle(prompt: string) {
  const normalized = prompt.toLocaleLowerCase("vi-VN");
  if (normalized.includes("báo cáo") || normalized.includes("manager")) return "Nhóm tạo báo cáo có bằng chứng";
  if (normalized.includes("so sánh") || normalized.includes("peer")) return "Nhóm so sánh và đối chuẩn";
  if (normalized.includes("biểu đồ") || normalized.includes("trực quan")) return "Nhóm phân tích và trực quan hóa";
  if (normalized.includes("chất lượng") || normalized.includes("thiếu")) return "Nhóm kiểm tra chất lượng dữ liệu";
  return "Nhóm điều tra và phân tích";
}

export function getGroupMemberState(group: AgentGroup, id: AgentId): "queued" | "working" | "done" {
  if (group.phase === "complete" || group.phase === "partial") return "done";
  if (group.phase === "failed" || group.phase === "cancelled") return "queued";
  if (group.phase === "receiving" || group.phase === "retrying" || group.phase === "cancelling") return "working";
  if (group.phase === "thinking") return id === "data" ? "working" : "queued";
  return id === "data" ? "done" : "working";
}

function stateForPhase(phase: RunPhase, index: number, total: number): RunTaskState {
  if (phase === "complete") return "success";
  if (phase === "partial") return index === total - 1 ? "queued" : "success";
  if (phase === "failed") return index === 1 ? "failed" : index > 1 ? "skipped" : "success";
  if (phase === "receiving") return "queued";
  if (phase === "thinking") return index === 0 ? "running" : "queued";
  if (phase === "collaborating") return index === 0 ? "success" : index < total - 1 ? "running" : "queued";
  if (phase === "retrying") return index === 1 ? "running" : index < 1 ? "success" : "queued";
  if (phase === "cancelling") return index === 0 ? "success" : index === 1 ? "running" : "queued";
  return index === 0 ? "success" : "skipped";
}

export function createRun(input: { id: string; prompt: string; projectId: string; startedAt: string; memberIds: AgentId[]; phase?: RunPhase }): AgentRun {
  const phase = input.phase ?? "receiving";
  const taskAgents = input.memberIds.filter((id): id is Exclude<AgentId, "orchestrator"> => id !== "orchestrator");
  return {
    id: input.id,
    title: getGroupTitle(input.prompt).replace(/^Nhóm /, ""),
    prompt: input.prompt,
    projectId: input.projectId,
    startedAt: input.startedAt,
    phase,
    tasks: taskAgents.map((agentId, index) => ({
      id: `${input.id}-${agentId}`,
      agentId,
      ...taskBlueprints[agentId],
      state: stateForPhase(phase, index, taskAgents.length),
    })),
  };
}

export function setRunPhase(run: AgentRun, phase: RunPhase): AgentRun {
  return {
    ...run,
    phase,
    tasks: run.tasks.map((task, index) => ({ ...task, state: stateForPhase(phase, index, run.tasks.length) })),
    error: phase === "failed" ? "Một agent chưa thể hoàn tất. Dữ liệu đã xử lý được giữ lại để thử lại." : undefined,
    pendingReviewCount: phase === "partial" ? 2 : 0,
  };
}

export function getRunProgress(run: AgentRun) {
  const completed = run.tasks.filter((task) => task.state === "success").length;
  return { completed, total: run.tasks.length, percent: run.tasks.length ? Math.round(completed / run.tasks.length * 100) : 0 };
}
