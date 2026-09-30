import { Check, ShieldCheck } from "lucide-react";
import { getRunProgress } from "@/components/run/run-state";
import { AgentMark } from "@/components/shared/agent-mark";
import { MetricCard } from "@/components/shared/metric-card";
import type { Agent, AgentRun } from "@/types/workspace";

export function OrchestratorResult({ run, agents, projectName, snapshot, slowCount, focusArea, focusDom }: {
  run: AgentRun;
  agents: readonly Agent[];
  projectName: string;
  snapshot: string;
  slowCount: number;
  focusArea: string;
  focusDom: number;
}) {
  const progress = getRunProgress(run);
  return <div className="artifact-card run-artifact">
    <div className="artifact-title"><span><ShieldCheck /> Kết quả điều phối có thể truy vết</span><small>{projectName} · {snapshot}</small></div>
    <div className="artifact-metrics"><MetricCard label="CĂN BÁN CHẬM" value={String(slowCount)} detail="DOM > 90 ngày" tone="warning" /><MetricCard label="ĐIỂM NGHẼN" value={focusArea} detail={`${focusDom} ngày DOM`} /><MetricCard label="TIẾN ĐỘ" value={`${progress.completed}/${progress.total}`} detail={run.phase === "partial" ? "Chờ duyệt" : "Bước hoàn tất"} tone="good" /></div>
    <div className="run-steps">{run.tasks.map((task, index) => {
      const agent = agents.find((item) => item.id === task.agentId);
      return <div key={task.id}>{agent && <AgentMark agent={agent} size="sm" />}<span><strong>{index + 1}. {task.title}</strong><small>{task.detail}</small></span><em>{task.state === "success" && <Check />}{task.state === "success" ? "Xong" : task.state === "failed" ? "Lỗi" : "Chờ"}</em></div>;
    })}</div>
    <div className="run-summary"><strong>Kết quả hợp nhất</strong><span>{focusArea} là khu vực cần ưu tiên review. Run giữ riêng các claim chưa đủ evidence và không đưa chúng vào kết luận chính.</span></div>
  </div>;
}
