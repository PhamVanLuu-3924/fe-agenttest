import { notFound } from "next/navigation";
import { ChatWorkspace } from "@/components/chat-workspace";
import { agentGuides } from "@/data/mock-real-estate";

type AgentId = keyof typeof agentGuides;

export default async function PreviewAgentPage({ params }: { params: Promise<{ agent: string }> }) {
  const { agent } = await params;
  if (!(agent in agentGuides)) notFound();
  return <ChatWorkspace previewAgent={agent as AgentId} />;
}
