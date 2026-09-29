import { BarChart3, Database, FileText, Lightbulb, Sparkles, Users } from "lucide-react";
import type { Agent } from "@/types/workspace";

export function AgentMark({ agent, size = "md" }: { agent: Agent; size?: "sm" | "md" }) {
  const Icon = agent.icon;

  if (agent.id === "orchestrator") {
    return (
      <span className={`agent-mark orchestrator-mark ${size === "sm" ? "agent-mark--sm" : ""}`} aria-label="Điều phối 5 agent chuyên môn">
        <Sparkles className="orchestrator-core" />
        <i className="agent-satellite satellite-data"><Database /></i>
        <i className="agent-satellite satellite-compare"><Users /></i>
        <i className="agent-satellite satellite-insight"><Lightbulb /></i>
        <i className="agent-satellite satellite-chart"><BarChart3 /></i>
        <i className="agent-satellite satellite-report"><FileText /></i>
      </span>
    );
  }

  return <span className={`agent-mark ${size === "sm" ? "agent-mark--sm" : ""}`} style={{ backgroundColor: agent.color }}><Icon aria-hidden="true" strokeWidth={2.2} /></span>;
}
