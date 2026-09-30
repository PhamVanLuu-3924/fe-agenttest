import { Check, Clock3, Sparkles } from "lucide-react";
import { getGroupMemberState } from "@/components/run/run-state";
import { AgentMark } from "@/components/shared/agent-mark";
import { BouncingDots } from "@/components/shared/bouncing-dots";
import type { Agent, AgentGroup, AgentId } from "@/types/workspace";

const phaseLabels: Record<AgentGroup["phase"], string> = {
  receiving: "Đang nhận yêu cầu", thinking: "Đang lập kế hoạch", collaborating: "Đang phối hợp",
  complete: "Đã hoàn tất", partial: "Chờ bạn duyệt", failed: "Có lỗi cần xử lý",
  retrying: "Đang thử lại", cancelling: "Đang dừng", cancelled: "Đã dừng",
};

export function CollaborationGroup({ group, agents, onAgent }: { group: AgentGroup; agents: readonly Agent[]; onAgent: (id: AgentId) => void }) {
  const members = group.memberIds.map((id) => agents.find((agent) => agent.id === id)).filter((agent): agent is Agent => Boolean(agent));
  const isWorking = ["receiving", "thinking", "collaborating", "retrying", "cancelling"].includes(group.phase);
  const phaseLabel = phaseLabels[group.phase];

  return <section className={`collaboration-group collaboration-group--${group.phase}`} aria-label={`${group.title}: ${members.map((member) => member.name).join(", ")}`}>
    <div className="collaboration-head">
      <div className="group-avatar-stack" aria-hidden="true">{members.slice(0, 5).map((member) => <span key={member.id}><AgentMark agent={member} size="sm" /></span>)}</div>
      <div className="group-heading"><small>NHÓM AGENT ĐƯỢC TẠO TỰ ĐỘNG</small><strong>{group.title}</strong><p>{members.map((member) => member.name).join(" · ")}</p></div>
      <span className={`group-phase ${isWorking ? "group-phase--working" : ""}`}>{isWorking ? <BouncingDots label={phaseLabel} /> : <Check />} {phaseLabel}</span>
    </div>
    <div className="group-prompt"><Sparkles /><span><small>NHIỆM VỤ CHUNG</small>{group.prompt}</span></div>
    <div className="group-members">{members.map((member) => {
      const state = getGroupMemberState(group, member.id);
      return <button key={member.id} type="button" onClick={() => onAgent(member.id)} disabled={isWorking} className={`group-member group-member--${state}`}>
        <AgentMark agent={member} size="sm" />
        <span><strong>{member.name}</strong><small>{state === "done" ? "Đã bàn giao" : state === "working" ? "Đang suy nghĩ" : "Đang chờ dữ liệu"}</small></span>
        {state === "done" ? <Check /> : state === "working" ? <BouncingDots label={`${member.name} đang suy nghĩ`} /> : <Clock3 />}
      </button>;
    })}</div>
    <div className="group-flow" aria-hidden="true"><span className={group.phase !== "receiving" ? "is-active" : ""}>Dữ liệu</span><i /><span className={["collaborating", "complete", "partial"].includes(group.phase) ? "is-active" : ""}>Phân tích song song</span><i /><span className={["complete", "partial"].includes(group.phase) ? "is-active" : ""}>Hợp nhất kết quả</span></div>
  </section>;
}
