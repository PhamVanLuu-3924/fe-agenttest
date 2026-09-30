# Frontend ownership — phân công v3

Tài liệu này đồng bộ với bản phân công mới nhất của nhóm. Mục tiêu là hoàn thiện giao diện bằng mock data, không chờ backend. Mọi component chỉ nhận props hoặc dữ liệu qua `WorkspaceRepository`; không gọi `fetch` trực tiếp.

## Bảng ownership

| Thành viên | Vai trò | Nhánh | Phạm vi được sửa |
| --- | --- | --- | --- |
| **Hiển** | Team Lead · core run · tích hợp | `feature/hien-core-run` | `components/chat-workspace.tsx`, `components/run/`, `types/`, `repositories/`, `components/shared/` |
| **Lưu** | Shell · auth · data result | `feature/luu-shell-data` | `app/`, `components/auth-screen.tsx`, `components/layout/`, `components/results/data/` |
| **Quốc** | Conversation · compare · insight | `feature/quoc-conversation-analysis` | `components/conversation/`, `components/results/analysis/` |
| **Sơn** | Chart · report · evidence | `feature/son-report` | `components/report/`, style riêng của chart và report |

`components/chat-workspace.tsx` là composition root. Hiển là người duy nhất nối component mới vào file này và duyệt thay đổi shared types hoặc repository interface.

## Hiển — Team Lead, core run và tích hợp

- Giữ ranh giới giữa component, shared types, repository và mock implementation.
- Hoàn thiện `CollaborationGroup`, `RunProgressPanel`, `TaskTimeline` và orchestrator result.
- Mô phỏng đủ lifecycle: receiving, thinking, collaborating, complete, PARTIAL, failed, retrying và cancelling/cancelled.
- Review phạm vi, type và khả năng tích hợp của ba pull request còn lại trước khi merge.
- Tích hợp component đã duyệt vào composition root, xử lý xung đột và chạy smoke test toàn ứng dụng.

Điều kiện hoàn thành: run UI chạy hoàn toàn bằng fixture, không phụ thuộc API/SSE; composition root chỉ điều phối state và component; lint, production build và smoke test đều đạt.

## Lưu — Shell, auth, layout và data result

- Hoàn thiện login/logout, route guard giả lập và session adapter dùng `localStorage` có kiểm soát.
- Hoàn thiện sidebar, topbar, project selector, responsive, keyboard, focus và aria label.
- Tách `DataResult`, data table, metric card, filter và sorting.
- Bao phủ loading session, chưa đăng nhập, hết phiên, không có quyền, project rỗng, data loading/empty/PARTIAL và repository error.

## Quốc — Conversation, compare và insight

- Hoàn thiện `ConversationStream`, `MessageItem`, `PromptComposer` và `HistoryPanel`.
- Mô phỏng submit, chống gửi trùng, optimistic message và lịch sử dài.
- Tách `CompareResult` và `InsightResult`; hoàn thiện peer group, benchmark, similarity, insufficient peers, confidence, evidence và giới hạn kết luận.
- Bao phủ conversation rỗng, đang gửi, gửi trùng, không có lịch sử, tải thêm, không đủ peer, insight cảnh báo và kết quả thất bại.

## Sơn — Chart, report và evidence

- Tách `ChartResult`, `ReportDraft`, `ReportSection`, `EvidenceDrawer` và `ReportActions`.
- Hoàn thiện chart DOM, absorption, price/m²; luôn có legend, đơn vị, cỡ mẫu và empty state.
- Hoàn thiện report sáu phần, executive summary, claim/evidence và completeness check.
- Mô phỏng draft, thiếu evidence, chờ duyệt, yêu cầu chỉnh sửa, đã phê duyệt, export loading/success/error/expired URL; chưa cần tạo PDF thật.

## Quy tắc phối hợp

- Mỗi PR chỉ tập trung vào một vùng ownership; không sửa vùng của người khác nếu chưa trao đổi.
- Loading, empty, partial và error phải chạy được không cần backend.
- Nếu cần đổi `types/` hoặc `repositories/`, báo Hiển để xử lý bằng một PR nhỏ rồi cả nhóm rebase.
- PR phải nhắm vào `develop`, có ảnh desktop/mobile và checklist trạng thái UI.
- Trước khi mở hoặc cập nhật PR, chạy:

```bash
npm run lint
npm run build
git fetch origin
git rebase origin/develop
```

Không commit `.env`, `.next` hoặc các file ngoài ownership. Khi backend sẵn sàng, tạo implementation mới của `WorkspaceRepository` và map response về shared types; không viết lại component.
