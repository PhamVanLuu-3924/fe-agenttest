import { Check, Circle, Clock3, RotateCw, TriangleAlert, X } from "lucide-react";
import { AgentMark } from "@/components/shared/agent-mark";
import type { Agent, AgentRun } from "@/types/workspace";
import styles from "./run.module.css";

const stateLabels = {
  queued: "Đang chờ", running: "Đang xử lý", success: "Hoàn tất", failed: "Thất bại", skipped: "Đã bỏ qua",
} as const;

export function TaskTimeline({ run, agents }: { run: AgentRun; agents: readonly Agent[] }) {
  return <ol className={styles.timeline} aria-label="Các bước thực hiện">
    {run.tasks.map((task) => {
      const agent = agents.find((item) => item.id === task.agentId);
      const StateIcon = task.state === "success" ? Check : task.state === "running" ? RotateCw : task.state === "failed" ? TriangleAlert : task.state === "skipped" ? X : Circle;
      return <li key={task.id} className={`${styles.task} ${styles[`task_${task.state}`]}`}>
        <span className={styles.rail}><StateIcon /></span>
        {agent && <AgentMark agent={agent} size="sm" />}
        <span className={styles.taskCopy}><strong>{task.title}</strong><small>{task.detail}</small></span>
        <span className={styles.taskState}>{task.state === "running" && <Clock3 />}{stateLabels[task.state]}</span>
      </li>;
    })}
  </ol>;
}
