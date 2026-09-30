import { Check, Clock3, Users } from "lucide-react";
import { getGroupMemberState } from "@/components/run/run-state";
import { AgentMark } from "@/components/shared/agent-mark";
import { BouncingDots } from "@/components/shared/bouncing-dots";
import type { Agent, AgentGroup, AgentId } from "@/types/workspace";

export function SidebarAgentGroup({ group, agents, onAgent }: { group: AgentGroup; agents: readonly Agent[]; onAgent: (id: AgentId) => void }) {
  const members = group.memberIds.map((id) => agents.find((agent) => agent.id === id)).filter((agent): agent is Agent => Boolean(agent));
  const isWorking = ["receiving", "thinking", "collaborating", "retrying", "cancelling"].includes(group.phase);
  return <section className={`sidebar-agent-group sidebar-agent-group--${group.phase}`} aria-label={`Nhóm hiện tại: ${members.map((member) => member.name).join(", ")}`}>
    <div className="sidebar-group-head"><span><Users /></span><div><small>NHÓM ĐANG LÀM VIỆC</small><strong>{group.title}</strong></div>{isWorking ? <BouncingDots label="Nhóm agent đang làm việc" /> : <Check />}</div>
    <div className="sidebar-group-members">{members.map((member) => {
      const state = getGroupMemberState(group, member.id);
      return <button key={member.id} type="button" onClick={() => onAgent(member.id)} disabled={isWorking} title={`${member.name} · ${state}`}>
        <AgentMark agent={member} size="sm" /><span>{member.name}</span>{state === "working" ? <BouncingDots label={`${member.name} đang làm việc`} /> : state === "done" ? <Check /> : <Clock3 />}
      </button>;
    })}</div>
  </section>;
}
