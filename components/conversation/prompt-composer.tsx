import { ArrowUp, Mic, Plus } from "lucide-react";
import type { FormEvent } from "react";

type PromptComposerProps = {
  agentName: string;
  draft: string;
  sending: boolean;
  onDraftChange: (draft: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export function PromptComposer({ agentName, draft, sending, onDraftChange, onSubmit }: PromptComposerProps) {
  return <div className="composer-wrap"><form className="composer" onSubmit={onSubmit}><button type="button" className="composer-action" aria-label="Thêm tệp"><Plus /></button><input value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder={`Nhắn cho ${agentName} — nêu dự án, thời gian và điều bạn cần biết`} /><button type="button" className="composer-action" aria-label="Ghi âm"><Mic /></button><button type="submit" className="send-button" disabled={!draft.trim() || sending}><ArrowUp /></button></form><p>VDAgent có thể mắc lỗi. Hãy kiểm tra các bằng chứng quan trọng.</p></div>;
}
