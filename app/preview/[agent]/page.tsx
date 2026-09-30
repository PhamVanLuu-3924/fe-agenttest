import { notFound } from "next/navigation";
import { ChatWorkspace } from "@/components/chat-workspace";
import { mockAgents } from "@/mocks/workspace-repository";
import type { AgentId } from "@/types/workspace";

export default async function PreviewAgentPage({ params }: { params: Promise<{ agent: string }> }) {
  const { agent } = await params;
  if (!mockAgents.some((item) => item.id === agent)) notFound();
  return <ChatWorkspace previewAgent={agent as AgentId} />;
}
